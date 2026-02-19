from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import AdminAuditLog, Tab, UsageLog
from drf_spectacular.utils import extend_schema # Add this import
from .serializers import CheckInSerializer, TabSerializer
import csv
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from .models import UsageLog
from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from .models import UsageLog
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from core import models

class TabCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            # Explicitly fetch all tabs to ensure the model is accessible
            available_tabs = Tab.objects.all()
            serializer = TabSerializer(available_tabs, many=True)
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
                tab = Tab.objects.select_for_update().get(id=tab_id)
                
                if action == 'log':
                    # 1. Check Global Stock
                    if tab.stock_remaining < quantity:
                        return Response({"error": "Insufficient stock."}, status=400)
                    
                    # 2. Daily Limit check
                    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
                    usage_today = UsageLog.objects.filter(
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
                    user_balance = UsageLog.objects.filter(
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

                UsageLog.objects.create(
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
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Calculates the net balance of tabs currently held by the user."""
        try:
            user = request.user
            # We group by tab and sum quantities: Log(+1) + Return(-1)
            possessions = UsageLog.objects.filter(user=user).values(
                'tab__id', 'tab__name'
            ).annotate(
                current_balance=Sum('quantity')
            ).filter(current_balance__gt=0) # Only show items where they hold 1 or more

            return Response(list(possessions))
        except Exception as e:
            return Response({"error": str(e)}, status=500)

# core/views.py
class AdminDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]

    def get(self, request):
        # 1. Global Stock Levels
        stock_summary = Tab.objects.values('id', 'name', 'stock_remaining', 'daily_limit_per_user')

        # 2. Currently Held Tabs (All Users)
        active_possessions = UsageLog.objects.values(
            'user__employee_id', 'user__username', 'tab__name'
        ).annotate(
            balance=Sum('quantity')
        ).filter(balance__gt=0).order_by('-balance')

        # 3. ADD THIS: Recent Activity Feed
        recent_activity = UsageLog.objects.select_related('user', 'tab').order_by('-timestamp')[:10].values(
            'user__username', 'tab__name', 'quantity', 'timestamp'
        )

        audit_trails = AdminAuditLog.objects.select_related('admin').order_by('-timestamp')[:20].values(
            'admin__username', 'action_type', 'description', 'timestamp'
        )

        return Response({
            "stock": list(stock_summary),
            "active_loans": list(active_possessions),
            "recent_activity": list(recent_activity),
            "audit_trails": list(audit_trails) # Add this to the response
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
        logs = UsageLog.objects.filter(user=request.user).select_related('tab').order_by('-timestamp')[:20]
        data = [{
            "tab_name": log.tab.name,
            "action": "Logged" if log.quantity > 0 else "Returned",
            "timestamp": log.timestamp
        } for log in logs]
        return Response(data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def filtered_logs(request):
    """Allows admins to filter logs by Employee ID or Tab Name."""
    query = request.query_params.get('search', '')
    logs = UsageLog.objects.select_related('user', 'tab').filter(
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
def export_usage_csv(request):
    # Create the HttpResponse object with the appropriate CSV header.
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="tab_audit_logs.csv"'

    writer = csv.writer(response)
    # Write Header [cite: 105-112]
    writer.writerow(['Timestamp', 'Employee ID', 'Branch', 'Tab Type', 'Quantity', 'IP Address', 'Device'])

    # Write Data
    logs = UsageLog.objects.all().select_related('user', 'branch', 'tab')
    for log in logs:
        writer.writerow([
            log.timestamp,
            log.user.employee_id,
            log.branch.name,
            log.tab.name,
            log.quantity,
            log.ip_address,
            log.device_info
        ])

    return response

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    try:
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        this_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        stats = {
            # Total stock available across all Tab types
            "total_stock": Tab.objects.aggregate(Sum('stock_remaining'))['stock_remaining__sum'] or 0,
            
            # Usage metrics from UsageLog
            "used_today": UsageLog.objects.filter(timestamp__gte=today, quantity__gt=0).count(),
            "used_this_month": UsageLog.objects.filter(timestamp__gte=this_month, quantity__gt=0).count(),
            
            # Stock breakdown by Tab type instead of branch
            "inventory_breakdown": list(Tab.objects.values('name', 'stock_remaining'))
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
    # Header row
    writer.writerow(['Timestamp', 'Employee ID', 'Username', 'Tab Name', 'Action', 'Quantity'])

    logs = UsageLog.objects.select_related('user', 'tab').all().order_by('-timestamp')
    
    for log in logs:
        # Convert the UTC timestamp from the database to your local timezone
        local_time = timezone.localtime(log.timestamp) 
        
        action = "Logged" if log.quantity > 0 else "Returned"
        writer.writerow([
            local_time.strftime('%Y-%m-%d %H:%M:%S'), # Use local_time
            log.user.employee_id,
            log.user.username,
            log.tab.name,
            action,
            abs(log.quantity)
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
    tab, created = Tab.objects.get_or_create(
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