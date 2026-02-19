# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Tab, UsageLog, AdminAuditLog

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('employee_id', 'username', 'role', 'status', 'is_staff')
    list_filter = ('role', 'status')
    fieldsets = UserAdmin.fieldsets + (
        ('Company Info', {'fields': ('employee_id', 'role', 'status')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Company Info', {'fields': ('employee_id', 'role', 'status')}),
    )
    search_fields = ('employee_id', 'username')

@admin.register(Tab)
class TabAdmin(admin.ModelAdmin):
    list_display = ('name', 'stock_remaining', 'daily_limit_per_user', 'created_at')

@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'tab', 'ip_address')
    list_filter = ('tab', 'timestamp')
    search_fields = ('user__employee_id', 'user__username')
    
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'admin', 'action_type', 'description')
    readonly_fields = ('admin', 'action_type', 'description', 'timestamp')
    
    def has_add_permission(self, request): return False