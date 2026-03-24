from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponse
from rest_framework_simplejwt.views import TokenRefreshView

# Core Views
from core.views import (
    MyTokenObtainPairView, TabCheckInView, UserActivityHistoryView, 
    UserPossessionView, AdminDashboardView, add_tab_stock, 
    export_usage_csv, AssignTabletView, InitiateReturnView, 
    VerifyReturnView, GenerateAssignmentOTPView, AllAssignmentLogsView
)

urlpatterns = [
    # --- 1. FRONTEND ADMIN EXCEPTIONS (Crucial Fix) ---
    # We must define these BEFORE 'admin/' so Django doesn't eat them.
    # This allows your React Admin Dashboard to load instead of Django's 404 page.
    path('admin/dashboard', TemplateView.as_view(template_name='index.html')),
    path('admin/logs', TemplateView.as_view(template_name='index.html')),

    # --- 2. DJANGO NATIVE ADMIN ---
    path('admin/', admin.site.urls),

    # --- 3. SERVER HEALTH CHECK ---
    path('api/', lambda request: HttpResponse("Welcome to Tab log dashboard API")),

    # --- 4. API ENDPOINTS ---
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/possession/', UserPossessionView.as_view(), name='user-possession'),
    path('api/user/history/', UserActivityHistoryView.as_view(), name='user-history'),
    path('api/check-in/', TabCheckInView.as_view(), name='tab-check-in'),
    
    # Admin API
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/export-csv/', export_usage_csv, name='export_usage_csv'),
    path('api/admin/add-tab/', add_tab_stock, name='add-tab'),
    path('api/logs/', AllAssignmentLogsView.as_view(), name='all-logs'),
    
    # Assignment & Return
    path('api/assign/', AssignTabletView.as_view(), name='assign-tablet'),
    path('api/assign/generate-otp/', GenerateAssignmentOTPView.as_view(), name='generate-assign-otp'),
    path('api/return/initiate/', InitiateReturnView.as_view(), name='return-initiate'),
    path('api/return/verify/', VerifyReturnView.as_view(), name='return-verify'),

    # --- 5. API 404 CATCH-ALL ---
    re_path(r'^api/.*$', lambda request: JsonResponse({'error': 'API endpoint not found'}, status=404)),

    # --- 6. FRONTEND CATCH-ALL (Must be last) ---
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]