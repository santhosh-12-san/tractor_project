from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError

class Customer(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15, unique=True)
    village = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLE_CHOICES = [
        ('Owner', 'Owner'),
        ('Customer', 'Customer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Owner')
    customer_profile = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

    def __str__(self):
        return f"{self.username} ({self.role})"


class Driver(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15, unique=True)
    village = models.CharField(max_length=100)
    daily_wage = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Booking(models.Model):
    WORK_TYPES = [
        ('Ploughing', 'Ploughing'),
        ('Rotavator', 'Rotavator'),
        ('Transport', 'Transport'),
        ('Seed Sowing', 'Seed Sowing'),
        ('Harvesting', 'Harvesting'),
        ('Others', 'Others'),
    ]

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('In Progress', 'In Progress'),
        ('Completed', 'Completed'),
        ('Canceled', 'Canceled'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='bookings')
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    date = models.DateField()
    work_type = models.CharField(max_length=50, choices=WORK_TYPES)
    acres_hours = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    advance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    notes = models.TextField(blank=True, null=True)

    def clean(self):
        super().clean()
        # Enforce that a driver cannot be assigned to two active bookings on the same date
        if self.driver and self.status != 'Canceled':
            conflicts = Booking.objects.filter(
                driver=self.driver,
                date=self.date
            ).exclude(id=self.id).exclude(status='Canceled')
            if conflicts.exists():
                raise ValidationError({
                    'driver': f"Driver {self.driver.name} is already booked for another job on {self.date}."
                })

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.total_amount = round(Decimal(str(self.acres_hours)) * Decimal(str(self.rate)), 2)
        self.full_clean()  # Trigger validation clean method
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer.name} - {self.work_type} ({self.date})"


class DriverWage(models.Model):
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='wages')
    date = models.DateField()
    days_worked = models.IntegerField(default=1)
    daily_wage = models.DecimalField(max_digits=10, decimal_places=2)
    allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    advance_given = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_wage = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    remaining = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    notes = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.total_wage = round((Decimal(str(self.days_worked)) * Decimal(str(self.daily_wage))) + Decimal(str(self.allowance)), 2)
        self.remaining = round(Decimal(str(self.total_wage)) - Decimal(str(self.advance_given)), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.driver.name} - {self.date} (Wage)"


class FuelLog(models.Model):
    date = models.DateField()
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name='fuel_logs')
    litres = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_litre = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    meter_reading = models.IntegerField()

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.total_amount = round(Decimal(str(self.litres)) * Decimal(str(self.price_per_litre)), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.driver.name} - {self.litres}L on {self.date}"


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('Engine Oil', 'Engine Oil'),
        ('Repair', 'Repair'),
        ('Tyre', 'Tyre'),
        ('Service', 'Service'),
        ('Spare Parts', 'Spare Parts'),
        ('Others', 'Others'),
    ]

    date = models.DateField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.category} - {self.amount} ({self.date})"


class Payment(models.Model):
    MODE_CHOICES = [
        ('Cash', 'Cash'),
        ('UPI', 'UPI'),
        ('Bank', 'Bank'),
    ]

    date = models.DateField()
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid = models.DecimalField(max_digits=12, decimal_places=2)
    pending = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES)

    def save(self, *args, **kwargs):
        from decimal import Decimal
        self.pending = round(Decimal(str(self.total_amount)) - Decimal(str(self.paid)), 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer.name} - Paid: {self.paid} ({self.date})"


class Maintenance(models.Model):
    STATUS_CHOICES = [
        ('Due Soon', 'Due Soon'),
        ('Valid', 'Valid'),
        ('Overdue', 'Overdue'),
    ]

    item = models.CharField(max_length=150)
    last_done = models.DateField()
    next_due = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Valid')

    def __str__(self):
        return f"{self.item} - Due: {self.next_due}"