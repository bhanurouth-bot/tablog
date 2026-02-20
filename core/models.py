import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee_id = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=20, choices=ROLES, default='user')
    status = models.CharField(max_length=10, default='active')

    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['username', 'email']

class TabType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    daily_limit_per_user = models.IntegerField(default=1)
    low_stock_threshold = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class TabletDevice(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('assigned', 'Assigned'),
        ('return_pending', 'Return Pending'),
        ('repair', 'Repair'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tab_type = models.ForeignKey(TabType, on_delete=models.PROTECT, related_name="devices")
    serial_number = models.CharField(max_length=100, unique=True)
    qr_code = models.CharField(max_length=255, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    condition = models.CharField(max_length=100, blank=True)
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    assigned_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.tab_type.name} - {self.serial_number}"

class AssignmentLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    device = models.ForeignKey(TabletDevice, on_delete=models.PROTECT)
    issued_at = models.DateTimeField(auto_now_add=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default="active")
    ip_address = models.GenericIPAddressField()
    device_info = models.TextField()

    class Meta:
        ordering = ['-issued_at']

class AdminAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action_type = models.CharField(max_length=100)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class ReturnVerification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    device = models.ForeignKey(TabletDevice, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)  # OTP valid 10 min
        super().save(*args, **kwargs)

class AssignmentOTP(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tab_type = models.ForeignKey(TabType, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # OTPs for assignment are valid for 12 hours
            self.expires_at = timezone.now() + timedelta(hours=12)  
        super().save(*args, **kwargs)