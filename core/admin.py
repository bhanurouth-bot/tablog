from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User,AssignmentOTP, TabType, TabletDevice, AssignmentLog, AdminAuditLog, ReturnVerification

admin.site.register(User, UserAdmin)
admin.site.register(TabType)
admin.site.register(TabletDevice)
admin.site.register(AssignmentLog)
admin.site.register(AdminAuditLog)
admin.site.register(ReturnVerification)
admin.site.register(AssignmentOTP)