from django.contrib import admin
from django.urls import path, re_path
from django.views.generic import TemplateView
from django.http import JsonResponse, HttpResponse
from rest_framework_simplejwt.views import TokenRefreshView

print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
print("HELLO! DJANGO IS SUCCESSFULLY READING THIS URLS.PY FILE!")
print("AND THE TRANSFER ROUTES ARE OFFICIALLY IN IT!")
print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

# --- We must import initiate_transfer and accept_transfer here ---
from core.views import (
    MyTokenObtainPairView, TabCheckInView, UserActivityHistoryView, 
    UserPossessionView, AdminDashboardView, add_tab_stock, 
    export_usage_csv, AssignTabletView, InitiateReturnView, 
    VerifyReturnView, GenerateAssignmentOTPView, AllAssignmentLogsView,
    initiate_transfer, accept_transfer 
)

urlpatterns = [
    # Frontend Admin routes
    path('admin/dashboard', TemplateView.as_view(template_name='index.html')),
    path('admin/logs', TemplateView.as_view(template_name='index.html')),

    # Django Native Admin
    path('admin/', admin.site.urls),

    # Health Check
    path('api/', lambda request: HttpResponse("Welcome to Tab log dashboard API")),

    # Auth & Possession
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/possession/', UserPossessionView.as_view(), name='user-possession'),
    path('api/user/history/', UserActivityHistoryView.as_view(), name='user-history'),
    path('api/check-in/', TabCheckInView.as_view(), name='tab-check-in'),
    
    # --- HERE ARE THE FIXES: THE TRANSFER ENDPOINTS ---
    path('api/transfer/initiate/', initiate_transfer, name='transfer-initiate'),
    path('api/transfer/accept/', accept_transfer, name='transfer-accept'),
    
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
    
    # Catch-all for React frontend (MUST be at the very bottom)
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]