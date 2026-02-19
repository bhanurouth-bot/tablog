# tab_audit_system/urls.py
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from django.views.generic import TemplateView
from django.urls import path, re_path, include
# IMPORT FROM YOUR CORE VIEWS, NOT THE LIBRARY
from core.views import MyTokenObtainPairView, TabCheckInView, UserActivityHistoryView, UserPossessionView, AdminDashboardView, add_tab_stock, export_usage_csv # Add this import
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # THIS LINE MUST USE MyTokenObtainPairView
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/check-in/', TabCheckInView.as_view(), name='tab-check-in'),
    path('api/possession/', UserPossessionView.as_view(), name='user-possession'),
    path('api/admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('api/admin/export-csv/', export_usage_csv, name='export_usage_csv'), # Add this line
    path('api/admin/add-tab/', add_tab_stock, name='add-tab'),
    path('api/user/history/', UserActivityHistoryView.as_view(), name='user-history'),
    re_path(r'^.*', TemplateView.as_view(template_name='index.html')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)