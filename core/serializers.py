# core/serializers.py
from rest_framework import serializers
from .models import TabType, TabletDevice, AssignmentLog
from .models import User

class TabTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TabType
        fields = '__all__'

class TabletDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TabletDevice
        fields = '__all__'

class AssignmentLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentLog
        fields = '__all__'

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

class ReturnVerificationSerializer(serializers.Serializer):
    device_id = serializers.UUIDField()
    otp_code = serializers.CharField(max_length=6)
    condition = serializers.CharField(max_length=100, required=False)