import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

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
    pass

class Tab(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    daily_limit_per_user = models.IntegerField(default=1)
    stock_remaining = models.IntegerField(default=0) 
    created_at = models.DateTimeField(auto_now_add=True)
    low_stock_threshold = models.IntegerField(default=10) # Add this

    def __str__(self):
        return self.name

class UsageLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    tab = models.ForeignKey(Tab, on_delete=models.PROTECT)
    quantity = models.IntegerField(default=1)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
    device_info = models.TextField()

    class Meta:
        ordering = ['-timestamp']

class AdminAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action_type = models.CharField(max_length=100)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)