from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm
from .models import User, AssignmentOTP, TabType, TabletDevice, AssignmentLog, AdminAuditLog, ReturnVerification

# --- 1. DEFINE A CLEAN CUSTOM FORM ---
class CustomUserCreationForm(forms.ModelForm):
    """
    A custom form that replaces the standard UserCreationForm.
    It manually handles password hashing to avoid validation conflicts.
    """
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        help_text="Enter a strong password."
    )
    confirm_password = forms.CharField(
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
        label="Confirm Password"
    )

    class Meta:
        model = User
        fields = ('employee_id', 'username', 'email', 'role')

    def clean(self):
        cleaned_data = super().clean()
        p1 = cleaned_data.get("password")
        p2 = cleaned_data.get("confirm_password")

        if p1 and p2 and p1 != p2:
            self.add_error('confirm_password', "Passwords do not match")
        
        return cleaned_data

    def save(self, commit=True):
        # 1. Create the user instance but don't save to DB yet
        user = super().save(commit=False)
        
        # 2. Hash the password (Crucial Step)
        user.set_password(self.cleaned_data["password"])
        
        # 3. Grant Admin Permissions automatically if role is 'admin'
        if user.role == 'admin':
            user.is_staff = True      # Access Admin Panel
            user.is_superuser = True  # Full Permissions
        
        if commit:
            user.save()
        return user

class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = '__all__'

# --- 2. UPDATE THE ADMIN CLASS ---
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    
    # 1. Columns to show in the User List
    list_display = ('employee_id', 'username', 'email', 'role', 'status', 'is_staff')
    
    # 2. Search bar
    search_fields = ('employee_id', 'username', 'email')
    
    # 3. Default sorting
    ordering = ('employee_id',)

    # 4. Layout for "Edit User" page
    fieldsets = (
        ('Login Credentials', {'fields': ('employee_id', 'password')}), 
        ('Personal Info', {'fields': ('username', 'email', 'first_name', 'last_name')}),
        ('Role & Status', {'fields': ('role', 'status')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    # 5. Layout for "Add User" page
    # MUST match the fields in CustomUserCreationForm exactly
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('employee_id', 'username', 'email', 'role', 'password', 'confirm_password'),
        }),
    )

# Register models
admin.site.register(User, CustomUserAdmin)
admin.site.register(TabType)
admin.site.register(TabletDevice)
admin.site.register(AssignmentLog)
admin.site.register(AdminAuditLog)
admin.site.register(ReturnVerification)
admin.site.register(AssignmentOTP)