from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AssignmentOTP, TabType, TabletDevice, AssignmentLog, AdminAuditLog, ReturnVerification

class CustomUserAdmin(UserAdmin):
    model = User
    
    # 1. Columns to show in the User List
    list_display = ('employee_id', 'username', 'email', 'role', 'status', 'is_active')
    
    # 2. Search bar will hunt for these fields
    search_fields = ('employee_id', 'username', 'email')
    
    # 3. Default sorting by Employee ID
    ordering = ('employee_id',)

    # 4. Layout for the "Edit User" page (Replace 'username' with 'employee_id')
    fieldsets = (
        ('Login Credentials', {'fields': ('employee_id', 'password')}), 
        ('Personal Info', {'fields': ('username', 'email', 'first_name', 'last_name')}),
        ('Role & Status', {'fields': ('role', 'status')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    # 5. Layout for the "Add User" page
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            # This ensures you set Employee ID, Role, and Password immediately
            'fields': ('employee_id', 'username', 'email', 'role', 'password', 'password_2'),
        }),
    )

# Register the custom UserAdmin
admin.site.register(User, CustomUserAdmin)
admin.site.register(TabType)
admin.site.register(TabletDevice)
admin.site.register(AssignmentLog)
admin.site.register(AdminAuditLog)
admin.site.register(ReturnVerification)
admin.site.register(AssignmentOTP)