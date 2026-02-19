# core/serializers.py
from rest_framework import serializers
from .models import Tab, UsageLog
from .models import User

class TabSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tab
        # Fields must match your updated Tab model
        fields = ['id', 'name', 'daily_limit_per_user', 'stock_remaining']

class CheckInSerializer(serializers.Serializer):
    tab_id = serializers.UUIDField()
    quantity = serializers.IntegerField(default=1)

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Make sure 'role' is in this list!
        fields = ('id', 'employee_id', 'username', 'role', 'status')