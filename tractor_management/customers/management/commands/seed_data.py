from django.core.management.base import BaseCommand
from datetime import datetime, date
from customers.models import Customer, Driver, Booking, DriverWage, FuelLog, Expense, Payment, Maintenance

class Command(BaseCommand):
    help = 'Seeds the database with initial data matching the Figma mock screens'

    def handle(self, *args, **kwargs):
        self.stdout.write('Clearing existing data...')
        Maintenance.objects.all().delete()
        Payment.objects.all().delete()
        Expense.objects.all().delete()
        FuelLog.objects.all().delete()
        DriverWage.objects.all().delete()
        Booking.objects.all().delete()
        Driver.objects.all().delete()
        Customer.objects.all().delete()

        self.stdout.write('Creating customers...')
        customers_data = [
            {'name': 'Ramesh Patil', 'phone': '9988776655', 'village': 'Hirehali', 'address': '123 Main St, Hirehali', 'notes': 'Regular customer for ploughing'},
            {'name': 'Shankar Babu', 'phone': '9900112233', 'village': 'Yeshwanthpur', 'address': 'Near Bus Stand, Yeshwanthpur', 'notes': 'Needs rotavator every season'},
            {'name': 'Mahesh Gowda', 'phone': '9887766554', 'village': 'Magadi', 'address': 'Magadi Village, Ward 4', 'notes': 'Owns large land'},
            {'name': 'Suresh Kumar', 'phone': '9988776654', 'village': 'Nelamangala', 'address': 'Nelamangala Town', 'notes': ''},
            {'name': 'Ravi', 'phone': '7766554432', 'village': 'Chikkaballapur', 'address': 'Chikkaballapur Road', 'notes': ''},
            {'name': 'Nandini', 'phone': '9988001122', 'village': 'Tumkur', 'address': 'KHB Colony, Tumkur', 'notes': ''},
        ]
        customers = {}
        for c in customers_data:
            customer = Customer.objects.create(**c)
            customers[customer.name] = customer

        self.stdout.write('Creating drivers...')
        drivers_data = [
            {'name': 'Nagaraj', 'phone': '9988776655', 'village': 'Hirehali', 'daily_wage': 680},
            {'name': 'Mahadeva', 'phone': '9900112233', 'village': 'Yeshwanthpur', 'daily_wage': 680},
            {'name': 'Shivanna', 'phone': '9887766554', 'village': 'Magadi', 'daily_wage': 680},
            {'name': 'Kumar', 'phone': '7766554432', 'village': 'Nelamangala', 'daily_wage': 680},
            {'name': 'Prakash', 'phone': '7766554433', 'village': 'Tumkur', 'daily_wage': 680},
        ]
        drivers = {}
        for d in drivers_data:
            driver = Driver.objects.create(**d)
            drivers[driver.name] = driver

        self.stdout.write('Creating bookings...')
        bookings_data = [
            {'customer': customers['Ramesh Patil'], 'driver': drivers['Nagaraj'], 'date': '2026-06-20', 'work_type': 'Ploughing', 'acres_hours': 5.0, 'rate': 1000.0, 'advance': 2000.0, 'status': 'Completed'},
            {'customer': customers['Shankar Babu'], 'driver': drivers['Mahadeva'], 'date': '2026-06-20', 'work_type': 'Rotavator', 'acres_hours': 3.0, 'rate': 1200.0, 'advance': 1000.0, 'status': 'In Progress'},
            {'customer': customers['Mahesh Gowda'], 'driver': drivers['Shivanna'], 'date': '2026-06-18', 'work_type': 'Transport', 'acres_hours': 2.0, 'rate': 1000.0, 'advance': 0.0, 'status': 'Completed'},
            {'customer': customers['Suresh Kumar'], 'driver': drivers['Kumar'], 'date': '2026-06-19', 'work_type': 'Seed Sowing', 'acres_hours': 4.0, 'rate': 1000.0, 'advance': 2000.0, 'status': 'Pending'},
            {'customer': customers['Ravi'], 'driver': drivers['Nagaraj'], 'date': '2026-06-19', 'work_type': 'Ploughing', 'acres_hours': 6.0, 'rate': 1000.0, 'advance': 1000.0, 'status': 'Completed'},
            {'customer': customers['Nandini'], 'driver': drivers['Mahadeva'], 'date': '2026-06-18', 'work_type': 'Rotavator', 'acres_hours': 2.0, 'rate': 1250.0, 'advance': 0.0, 'status': 'Canceled'},
        ]
        for b in bookings_data:
            Booking.objects.create(**b)

        self.stdout.write('Creating driver wages...')
        wages_data = [
            {'driver': drivers['Nagaraj'], 'date': '2026-06-01', 'days_worked': 1, 'daily_wage': 680, 'allowance': 100, 'advance_given': 0},
            {'driver': drivers['Nagaraj'], 'date': '2026-06-02', 'days_worked': 1, 'daily_wage': 680, 'allowance': 100, 'advance_given': 0},
            {'driver': drivers['Nagaraj'], 'date': '2026-06-03', 'days_worked': 1, 'daily_wage': 680, 'allowance': 100, 'advance_given': 0},
            {'driver': drivers['Nagaraj'], 'date': '2026-06-04', 'days_worked': 1, 'daily_wage': 680, 'allowance': 100, 'advance_given': 2000},
        ]
        for w in wages_data:
            DriverWage.objects.create(**w)

        self.stdout.write('Creating fuel logs...')
        fuel_data = [
            {'date': '2026-06-20', 'driver': drivers['Nagaraj'], 'litres': 20.0, 'price_per_litre': 90.0, 'meter_reading': 1250},
            {'date': '2026-06-19', 'driver': drivers['Mahadeva'], 'litres': 25.0, 'price_per_litre': 90.0, 'meter_reading': 1225},
            {'date': '2026-06-18', 'driver': drivers['Shivanna'], 'litres': 30.0, 'price_per_litre': 90.0, 'meter_reading': 1195},
            {'date': '2026-06-15', 'driver': drivers['Kumar'], 'litres': 20.0, 'price_per_litre': 90.0, 'meter_reading': 1175},
            {'date': '2026-06-12', 'driver': drivers['Nagaraj'], 'litres': 25.0, 'price_per_litre': 90.0, 'meter_reading': 1160},
        ]
        for f in fuel_data:
            FuelLog.objects.create(**f)

        self.stdout.write('Creating expenses...')
        expenses_data = [
            {'date': '2026-06-20', 'category': 'Engine Oil', 'description': 'Engine oil change', 'amount': 1280.0},
            {'date': '2026-06-18', 'category': 'Repair', 'description': 'Clutch plate change', 'amount': 3500.0},
            {'date': '2026-06-15', 'category': 'Tyre', 'description': 'Front tyre replacement', 'amount': 4000.0},
            {'date': '2026-06-12', 'category': 'Service', 'description': 'General service', 'amount': 2000.0},
            {'date': '2026-06-10', 'category': 'Spare Parts', 'description': 'Filter set', 'amount': 1250.0},
        ]
        for e in expenses_data:
            Expense.objects.create(**e)

        self.stdout.write('Creating payments...')
        payments_data = [
            {'date': '2026-06-20', 'customer': customers['Ramesh Patil'], 'total_amount': 5000.0, 'paid': 5000.0, 'mode': 'Cash'},
            {'date': '2026-06-20', 'customer': customers['Shankar Babu'], 'total_amount': 3600.0, 'paid': 1000.0, 'mode': 'UPI'},
            {'date': '2026-06-19', 'customer': customers['Mahesh Gowda'], 'total_amount': 2000.0, 'paid': 2000.0, 'mode': 'Cash'},
            {'date': '2026-06-18', 'customer': customers['Suresh Kumar'], 'total_amount': 4000.0, 'paid': 1000.0, 'mode': 'Bank'},
        ]
        for p in payments_data:
            Payment.objects.create(**p)

        self.stdout.write('Creating maintenance logs...')
        maint_data = [
            {'item': 'Engine Oil Change', 'last_done': '2026-06-10', 'next_due': '2026-07-10', 'status': 'Due Soon'},
            {'item': 'General Service', 'last_done': '2026-05-15', 'next_due': '2026-07-15', 'status': 'Due Soon'},
            {'item': 'Insurance', 'last_done': '2025-01-01', 'next_due': '2026-01-01', 'status': 'Overdue'},
            {'item': 'Pollution Certificate', 'last_done': '2025-02-10', 'next_due': '2026-02-10', 'status': 'Overdue'},
            {'item': 'Tyne Check', 'last_done': '2026-06-05', 'next_due': '2026-07-05', 'status': 'Overdue'},
        ]
        for m in maint_data:
            Maintenance.objects.create(**m)

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with Figma mockup records!'))
