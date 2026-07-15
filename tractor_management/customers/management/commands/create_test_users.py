from django.core.management.base import BaseCommand
from customers.models import User, Customer

class Command(BaseCommand):
    help = 'Creates default test users (Owner and Customer) for testing the JWT login'

    def handle(self, *args, **kwargs):
        # 1. Create Owner user if it doesn't exist
        owner_username = 'owner'
        owner_password = 'owner123'
        
        if User.objects.filter(username=owner_username).exists():
            self.stdout.write(f"User '{owner_username}' already exists. Updating password...")
            user = User.objects.get(username=owner_username)
            user.set_password(owner_password)
            user.role = 'Owner'
            user.save()
        else:
            User.objects.create_user(
                username=owner_username,
                password=owner_password,
                email='owner@tractorwork.com',
                role='Owner'
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully created Owner: {owner_username} (password: {owner_password})"))

        # 2. Create a test Customer profile & User account
        cust_name = 'Ramesh Patil'
        customer_username = 'customer'
        customer_password = 'customer123'

        # Get or create customer profile
        customer_profile, created = Customer.objects.get_or_create(
            phone='9988776655',
            defaults={
                'name': cust_name,
                'village': 'Hirehali',
                'address': '123 Main St, Hirehali'
            }
        )
        if created:
            self.stdout.write(f"Created Customer profile for {cust_name}")

        # Create Customer user
        if User.objects.filter(username=customer_username).exists():
            self.stdout.write(f"User '{customer_username}' already exists. Updating password...")
            user = User.objects.get(username=customer_username)
            user.set_password(customer_password)
            user.role = 'Customer'
            user.customer_profile = customer_profile
            user.save()
        else:
            User.objects.create_user(
                username=customer_username,
                password=customer_password,
                email='ramesh@gmail.com',
                role='Customer',
                customer_profile=customer_profile
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully created Customer user: {customer_username} (password: {customer_password})"))
