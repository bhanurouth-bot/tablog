# core/urls.py
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView 
from django.views.decorators.csrf import csrf_exempt  # <--- 1. ADD THIS IMPORT

from core import views
from core.views import (
    TabCheckInView, 
    UserPossessionView,
    GenerateAssignmentOTPView, 
    MyTokenObtainPairView, 
    add_tab_stock,
    UserActivityHistoryView,
    AssignTabletView, 
    AdminDashboardView, 
    InitiateReturnView, 
    VerifyReturnView,
    InitiateTransferView,
    AcceptTransferView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('api/assign/', AssignTabletView.as_view(), name='assign-tablet'),
    path('api/assign/generate-otp/', GenerateAssignmentOTPView.as_view(), name='generate-assign-otp'),
    
    path('api/possession/', UserPossessionView.as_view(), name='user-possession'),
    path('api/check-in/', TabCheckInView.as_view(), name='tab-check-in'),
    path('api/user/history/', UserActivityHistoryView.as_view(), name='user-history'),
    
    path('api/return/initiate/', InitiateReturnView.as_view(), name='return-initiate'),
    path('api/return/verify/', VerifyReturnView.as_view(), name='return-verify'),
    
    # --- 2. WRAP THE TRANSFER VIEWS WITH csrf_exempt() ---
    path('api/transfer/initiate/', csrf_exempt(InitiateTransferView.as_view()), name='transfer-initiate'),
    path('api/transfer/accept/', csrf_exempt(AcceptTransferView.as_view()), name='transfer-accept'),
    
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/add-tab/', add_tab_stock, name='add-tab'),
]