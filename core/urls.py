# core/urls.py
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView 

# 1. Import your custom view from core.views
from core import views
from core.views import TabCheckInView, UserPossessionView, MyTokenObtainPairView, add_tab_stock,UserActivityHistoryView  # Add this import 
from core.views import (
    AssignTabletView, 
    AdminDashboardView, 
    InitiateReturnView, 
    VerifyReturnView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 2. Update this line to use MyTokenObtainPairView
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/assign/', AssignTabletView.as_view(), name='assign-tablet'),
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/possession/', UserPossessionView.as_view(), name='user-possession'),
    path('api/check-in/', TabCheckInView.as_view(), name='tab-check-in'),
    path('api/user/history/', UserActivityHistoryView.as_view(), name='user-history'),
    path('api/admin/add-tab/', add_tab_stock, name='add-tab'),
    path('api/return/initiate/', InitiateReturnView.as_view(), name='return-initiate'),
    path('api/return/verify/', VerifyReturnView.as_view(), name='return-verify'),
]