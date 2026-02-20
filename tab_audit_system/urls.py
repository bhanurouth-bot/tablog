# tab_audit_system/urls.py
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# IMPORT ALL YOUR CORE VIEWS HERE
from core.views import (
    MyTokenObtainPairView, 
    TabCheckInView, 
    UserActivityHistoryView, 
    UserPossessionView, 
    AdminDashboardView, 
    add_tab_stock, 
    export_usage_csv,
    AssignTabletView,      
    InitiateReturnView,    
    VerifyReturnView,
    GenerateAssignmentOTPView # <-- Add the new OTP view import
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Auth
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Paths
    path('api/possession/', UserPossessionView.as_view(), name='user-possession'),
    path('api/user/history/', UserActivityHistoryView.as_view(), name='user-history'),
    
    # Legacy check-in (Can be removed later)
    path('api/check-in/', TabCheckInView.as_view(), name='tab-check-in'),
    
    # Admin Paths
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/export-csv/', export_usage_csv, name='export_usage_csv'),
    path('api/admin/add-tab/', add_tab_stock, name='add-tab'),
    
    # NEW: Physical Assignment & Return Paths
    path('api/assign/', AssignTabletView.as_view(), name='assign-tablet'),
    path('api/assign/generate-otp/', GenerateAssignmentOTPView.as_view(), name='generate-assign-otp'), # <-- Add this path
    path('api/return/initiate/', InitiateReturnView.as_view(), name='return-initiate'),
    path('api/return/verify/', VerifyReturnView.as_view(), name='return-verify'),
]