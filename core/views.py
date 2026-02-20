from django.shortcuts import get_object_or_404   # <--- MUST HAVE THIS
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.http import HttpResponse

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from drf_spectacular.utils import extend_schema

# Make sure User and ReturnVerification are in this list!
from .models import AdminAuditLog, TabType, TabletDevice, AssignmentLog,AssignmentOTP, User, ReturnVerification 
from .serializers import CheckInSerializer, TabTypeSerializer
import csv
import random
from core import models

class GenerateAssignmentOTPView(APIView):
    """Admin generates an OTP that users can use to get a random free tab."""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def post(self, request):
        tab_type_id = request.data.get('tab_type_id')
        try:
            tab_type = TabType.objects.get(id=tab_type_id)
        except TabType.DoesNotExist:
            return Response({"error": "Invalid Tab Model selected."}, status=400)
        
        # --- THE FIX: Check if there are any available devices FIRST ---
        available_count = TabletDevice.objects.filter(tab_type=tab_type, status='available').count()
        if available_count <= 0:
            return Response(
                {"error": f"Cannot generate OTP: There are 0 available '{tab_type.name}' devices left in stock."}, 
                status=400
            )

        # Generate a unique 6-digit OTP
        otp = f"{random.randint(100000, 999999)}"
        while AssignmentOTP.objects.filter(otp_code=otp, is_used=False).exists():
            otp = f"{random.randint(100000, 999999)}"
            
        AssignmentOTP.objects.create(tab_type=tab_type, otp_code=otp)
        return Response({"message": "Assignment OTP Generated!", "otp_code": otp})
        
class AssignTabletView(APIView):
    """Handles a user self-assigning a tablet via SCAN OR OTP."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        device_id = request.data.get('device_id') # For Scanning
        otp_code = request.data.get('otp_code')   # For OTP Assignment
        user = request.user 

        if not device_id and not otp_code:
            return Response({"error": "Please provide either a scan barcode or an OTP."}, status=status.HTTP_400_BAD_REQUEST)

        device = None

        # --- OTP ASSIGNMENT WORKFLOW ---
        if otp_code:
            try:
                assignment_otp = AssignmentOTP.objects.get(otp_code=otp_code, is_used=False)
                if assignment_otp.expires_at < timezone.now():
                    return Response({"error": "This OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Find the first available device of the requested type
                device = TabletDevice.objects.filter(tab_type=assignment_otp.tab_type, status='available').first()
                if not device:
                    return Response({"error": f"No available devices for {assignment_otp.tab_type.name} at the moment."}, status=status.HTTP_400_BAD_REQUEST)
                
                # Mark OTP as used so it can't be used twice
                assignment_otp.is_used = True
                assignment_otp.save()
            except AssignmentOTP.DoesNotExist:
                return Response({"error": "Invalid or already used OTP."}, status=status.HTTP_404_NOT_FOUND)
        
        # --- SCAN ASSIGNMENT WORKFLOW ---
        else:
            try:
                device = TabletDevice.objects.get(serial_number=device_id)
            except TabletDevice.DoesNotExist:
                return Response({"error": f"Tablet '{device_id}' does not exist."}, status=status.HTTP_404_NOT_FOUND)

            if device.status != 'available':
                return Response({"error": f"Device is currently {device.status}."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Check Daily Limit
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        usage_today = AssignmentLog.objects.filter(
            user=user, device__tab_type=device.tab_type, issued_at__gte=today_start
        ).count()

        if usage_today >= device.tab_type.daily_limit_per_user:
            return Response({"error": f"You reached your daily limit for this tab type."}, status=status.HTTP_400_BAD_REQUEST)

        # 4. Update Device Status
        device.status = 'assigned'
        device.assigned_to = user
        device.assigned_at = timezone.now()
        device.save()

        # 5. Create Assignment Log
        AssignmentLog.objects.create(
            user=user, device=device, status='active',
            ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0'),
            device_info=request.META.get('HTTP_USER_AGENT', 'Unknown')
        )

        return Response({"message": f"Assigned! Pick up device Serial: {device.serial_number}"}, status=status.HTTP_201_CREATED)



class TabCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Explicitly fetch all tabs to ensure the model is accessible
            available_tabs = TabletDevice.objects.all()
            serializer = TabTypeSerializer(tab_instance)
            return Response(serializer.data)
        except Exception as e:
            # This will help you see the EXACT error in your console
            print(f"GET Error: {str(e)}") 
            return Response({"error": str(e)}, status=500)

    def post(self, request):
        """Handles both Logging usage (+1) and Returning tabs (-1)."""
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        tab_id = serializer.validated_data['tab_id']
        action = request.data.get('action', 'log') # Expected: 'log' or 'return'
        quantity = 1

        try:
            with transaction.atomic():
                # Lock the row for update to prevent race conditions
                tab = TabletDevice.objects.select_for_update().get(id=tab_id)
                
                if action == 'log':
                    # 1. Check Global Stock
                    if tab.stock_remaining < quantity:
                        return Response({"error": "Insufficient stock."}, status=400)
                    
                    # 2. Daily Limit check
                    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    usage_today = AssignmentLog.objects.filter(
                        user=user, 
                        tab=tab, 
                        timestamp__gte=today_start, 
                        quantity__gt=0
                    ).count()

                    if usage_today + quantity > tab.daily_limit_per_user:
                        return Response({"error": f"Daily limit of {tab.daily_limit_per_user} reached."}, status=400)

                    tab.stock_remaining -= quantity
                    log_qty = quantity
                
                elif action == 'return':
                    # 1. Possession Check: Can't return what you don't have
                    user_balance = AssignmentLog.objects.filter(
                        user=user, 
                        tab=tab
                    ).aggregate(Sum('quantity'))['quantity__sum'] or 0

                    if user_balance <= 0:
                        return Response({
                            "error": "You cannot return this tab because you haven't logged any usage for it."
                        }, status=400)

                    tab.stock_remaining += quantity
                    log_qty = -quantity 

                tab.save()

                AssignmentLog.objects.create(
                    user=user,
                    tab=tab,
                    quantity=log_qty,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    device_info=request.META.get('HTTP_USER_AGENT', 'Unknown')
                )

            return Response({
                "message": f"Tab {action}ed successfully!",
                "remaining_stock": tab.stock_remaining,
                "timestamp": timezone.now()
            }, status=status.HTTP_201_CREATED)

        except Tab.DoesNotExist:
            return Response({"error": "Tab not found."}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class UserPossessionView(APIView):
    """Returns the physical devices currently assigned to the user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Query the new AssignmentLog model for active assignments
            active_assignments = AssignmentLog.objects.filter(
                user=request.user, 
                status='active'
            ).select_related('device', 'device__tab_type')

            data = [
                {
                    "device__serial_number": log.device.serial_number,
                    "device__tab_type__name": log.device.tab_type.name,
                    "issued_at": log.issued_at
                }
                for log in active_assignments
            ]
            return Response(data)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=500)


class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        tab_types = TabType.objects.values('id', 'name')
        
        stock_summary = TabType.objects.annotate(
            stock_remaining=Count('devices', filter=Q(devices__status='available'))
        ).values('id', 'name', 'stock_remaining', 'daily_limit_per_user')

        active_loans = AssignmentLog.objects.filter(status='active').select_related(
            'user', 'device', 'device__tab_type'
        ).values('user__employee_id', 'user__username', 'device__serial_number', 'device__tab_type__name', 'issued_at').order_by('-issued_at')

        recent_activity_qs = AssignmentLog.objects.select_related('user', 'device', 'device__tab_type').order_by('-issued_at')[:10]
        recent_activity = [{'user__username': log.user.username, 'tab__name': log.device.tab_type.name, 'quantity': 1 if log.status == 'active' else -1, 'timestamp': log.issued_at if log.status == 'active' else log.returned_at} for log in recent_activity_qs]

        audit_trails = AdminAuditLog.objects.select_related('admin').order_by('-timestamp')[:20].values('admin__username', 'action_type', 'description', 'timestamp')
        
        pending_returns = ReturnVerification.objects.filter(verified=False).select_related('device', 'device__assigned_to').values('device__serial_number', 'device__assigned_to__username', 'device__assigned_to__employee_id', 'otp_code', 'created_at').order_by('-created_at')

        # NEW: Fetch active assignment OTPs so admin can see them
        active_assignment_otps = AssignmentOTP.objects.filter(is_used=False, expires_at__gt=timezone.now()).select_related('tab_type').values('otp_code', 'tab_type__name', 'created_at').order_by('-created_at')

        stats = {
            "total": TabletDevice.objects.count(), "available": TabletDevice.objects.filter(status='available').count(),
            "assigned": TabletDevice.objects.filter(status='assigned').count(), "repair": TabletDevice.objects.filter(status='repair').count()
        }

        return Response({
            "tab_types": list(tab_types),
            "stock": list(stock_summary), "stats": stats, "active_loans": list(active_loans),
            "recent_activity": recent_activity, "audit_trails": list(audit_trails),
            "pending_returns": list(pending_returns),
            "active_assignment_otps": list(active_assignment_otps) # Added here
        })


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Ensure the keys here match what your frontend (Login.js) expects
        data['user'] = {
            'username': self.user.username,
            'role': self.user.role, 
            'employee_id': self.user.employee_id
        }
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    

class UserActivityHistoryView(APIView):
    """Returns the last 20 actions performed by the logged-in user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logs = AssignmentLog.objects.filter(user=request.user).select_related('tab').order_by('-timestamp')[:20]
        data = [{
            "tab_name": log.tab.name,
            "action": "Logged" if log.quantity > 0 else "Returned",
            "timestamp": log.timestamp
        } for log in logs]
        return Response(data)

class InitiateReturnView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        device_id = request.data.get("device_id")
        try:
            # FIX: Allow BOTH 'assigned' and 'return_pending'. 
            # This way, if they refresh the app, it doesn't error out!
            device = TabletDevice.objects.get(
                serial_number=device_id, 
                status__in=["assigned", "return_pending"],
                assigned_to=request.user
            )
        except TabletDevice.DoesNotExist:
            return Response({"error": "Device not found, not assigned to you, or already returned."}, status=404)

        # Generate a new OTP and save it
        otp = f"{random.randint(100000, 999999)}"
        ReturnVerification.objects.create(device=device, otp_code=otp)
        
        # Change status
        device.status = "return_pending"
        device.save()
        
        return Response({"message": "Return initiated. Please ask the Admin for your 6-digit OTP to complete the return."})


class VerifyReturnView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        device_id = request.data.get("device_id")
        otp_code = request.data.get("otp_code")
        condition = request.data.get("condition", "Good")
        
        try:
            # FIX: Verify the OTP actually belongs to the user trying to return it
            rv = ReturnVerification.objects.filter(
                device__serial_number=device_id, 
                otp_code=otp_code, 
                verified=False,
                device__assigned_to=request.user
            ).latest('created_at') # In case they initiated multiple times, get the newest
        except ReturnVerification.DoesNotExist:
            return Response({"error": "Invalid OTP. Please check with the Admin."}, status=400)
        
        if rv.expires_at < timezone.now():
            return Response({"error": "OTP expired. Please initiate return again."}, status=400)
        
        rv.verified = True
        rv.save()
        
        device = rv.device
        device.status = "available" if condition.lower() == "good" else "repair"
        device.condition = condition
        device.assigned_to = None
        device.save()
        
        try:
            log = AssignmentLog.objects.get(device=device, status="active")
            log.status = "returned"
            log.returned_at = timezone.now()
            log.save()
        except AssignmentLog.DoesNotExist:
            pass
        
        return Response({"success": "Return Verified! You have successfully returned the tablet."})

class AllAssignmentLogsView(APIView):
    """Returns a full list of all assignment logs for the dedicated logs page."""
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        logs = AssignmentLog.objects.select_related(
            'user', 'device', 'device__tab_type'
        ).order_by('-issued_at')
        
        data = []
        for log in logs:
            data.append({
                'id': log.id,
                'employee_id': log.user.employee_id,
                'username': log.user.username,
                'serial_number': log.device.serial_number,
                'tab_model': log.device.tab_type.name,
                'status': log.status, # 'active' or 'returned'
                'issued_at': log.issued_at,
                'returned_at': log.returned_at,
            })
            
        return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def filtered_logs(request):
    """Allows admins to filter logs by Employee ID or Tab Name."""
    query = request.query_params.get('search', '')
    logs = AssignmentLog.objects.select_related('user', 'tab').filter(
        models.Q(user__employee_id__icontains=query) | 
        models.Q(tab__name__icontains=query)
    ).order_by('-timestamp')[:50]
    
    data = [{
        "username": log.user.username,
        "employee_id": log.user.employee_id,
        "tab": log.tab.name,
        "qty": log.quantity,
        "time": log.timestamp
    } for log in logs]
    return Response(data)



@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    try:
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        this_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        stats = {
            # Total stock available across all Tab types
            "total_stock": TabletDevice.objects.aggregate(Sum('stock_remaining'))['stock_remaining__sum'] or 0,
            
            # Usage metrics from UsageLog
            "used_today": AssignmentLog.objects.filter(timestamp__gte=today, quantity__gt=0).count(),
            "used_this_month": AssignmentLog.objects.filter(timestamp__gte=this_month, quantity__gt=0).count(),
            
            # Stock breakdown by Tab type instead of branch
            "inventory_breakdown": list(TabletDevice.objects.values('name', 'stock_remaining'))
        }
        
        return Response(stats)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAdminUser])
def export_usage_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="warehouse_logs.csv"'

    writer = csv.writer(response)
    # Updated Header row for the new physical device architecture
    writer.writerow([
        'Issued At', 
        'Returned At', 
        'Employee ID', 
        'Username', 
        'Device Serial', 
        'Tab Model', 
        'Status'
    ])

    # FIX: Query using the correct new relationships ('device', 'device__tab_type') 
    # and order by the new date field ('-issued_at')
    logs = AssignmentLog.objects.select_related(
        'user', 'device', 'device__tab_type'
    ).all().order_by('-issued_at')
    
    for log in logs:
        # Convert UTC timestamps to local timezone safely
        issued_time = timezone.localtime(log.issued_at).strftime('%Y-%m-%d %H:%M:%S') if log.issued_at else ""
        returned_time = timezone.localtime(log.returned_at).strftime('%Y-%m-%d %H:%M:%S') if log.returned_at else "Pending"
        
        writer.writerow([
            issued_time,
            returned_time,
            log.user.employee_id,
            log.user.username,
            log.device.serial_number,
            log.device.tab_type.name,
            log.status.title() # Will print "Active" or "Returned"
        ])

    return response

@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_tab_stock(request):
    name = request.data.get('name')
    quantity = int(request.data.get('quantity', 0))
    limit = int(request.data.get('limit', 1))

    if not name:
        return Response({"error": "Tab name is required."}, status=400)

    # get_or_create determines if this is a NEW tab or an existing one
    tab, created = TabletDevice.objects.get_or_create(
        name=name,
        defaults={'stock_remaining': quantity, 'daily_limit_per_user': limit}
    )

    action_desc = ""
    if created:
        action_desc = f"Created new tab '{name}' with {quantity} units and limit {limit}."
    else:
        tab.stock_remaining += quantity
        tab.save()
        action_desc = f"Added {quantity} units to '{name}'. New total: {tab.stock_remaining}."

    # THIS IS THE TRACE: It saves who did it, what they did, and when
    AdminAuditLog.objects.create(
        admin=request.user,
        action_type="Inventory Update",
        description=action_desc
    )

    return Response({
        "message": f"Successfully updated {name}",
        "new_stock": tab.stock_remaining
    })