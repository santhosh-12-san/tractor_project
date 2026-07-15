from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import Customer, Driver, Booking, DriverWage, FuelLog, Expense, Payment, Maintenance, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'customer_profile']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = '__all__'


class BookingSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')
    driver_name = serializers.ReadOnlyField(source='driver.name')

    class Meta:
        model = Booking
        fields = '__all__'

    def validate(self, attrs):
        # Make a draft instance to run models clean method for conflicts
        instance = Booking(
            customer=attrs.get('customer', self.instance.customer if self.instance else None),
            driver=attrs.get('driver', self.instance.driver if self.instance else None),
            date=attrs.get('date', self.instance.date if self.instance else None),
            work_type=attrs.get('work_type', self.instance.work_type if self.instance else ''),
            acres_hours=attrs.get('acres_hours', self.instance.acres_hours if self.instance else 0),
            rate=attrs.get('rate', self.instance.rate if self.instance else 0),
            status=attrs.get('status', self.instance.status if self.instance else 'Pending'),
        )
        if self.instance:
            instance.id = self.instance.id
            
        try:
            instance.clean()
        except ValidationError as e:
            # Map django's validation errors directly to DRF serializer errors
            raise serializers.ValidationError(e.message_dict)
            
        return attrs


class DriverWageSerializer(serializers.ModelSerializer):
    driver_name = serializers.ReadOnlyField(source='driver.name')

    class Meta:
        model = DriverWage
        fields = '__all__'


class FuelLogSerializer(serializers.ModelSerializer):
    driver_name = serializers.ReadOnlyField(source='driver.name')

    class Meta:
        model = FuelLog
        fields = '__all__'


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')

    class Meta:
        model = Payment
        fields = '__all__'


class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = '__all__'