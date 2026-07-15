from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from datetime import datetime, date

from .models import Customer, Driver, Booking, DriverWage, FuelLog, Expense, Payment, Maintenance, User
from .serializers import (
    CustomerSerializer, DriverSerializer, BookingSerializer, 
    DriverWageSerializer, FuelLogSerializer, ExpenseSerializer, 
    PaymentSerializer, MaintenanceSerializer, UserSerializer
)

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow Owners to access endpoints.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'Owner'


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'customer_profile': self.user.customer_profile.id if self.user.customer_profile else None
        }
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by('-id')
    serializer_class = CustomerSerializer
    permission_classes = [IsOwner]


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all().order_by('-id')
    serializer_class = DriverSerializer
    permission_classes = [IsOwner]


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'Customer':
            if not user.customer_profile:
                profile = Customer.objects.create(
                    name=user.username.capitalize(),
                    phone='9988776655',
                    village='Village'
                )
                user.customer_profile = profile
                user.save()
            return Booking.objects.filter(customer=user.customer_profile).order_by('-date', '-id')
        return Booking.objects.all().order_by('-date', '-id')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'Customer':
            if not user.customer_profile:
                profile = Customer.objects.create(
                    name=user.username.capitalize(),
                    phone='9988776655',
                    village='Village'
                )
                user.customer_profile = profile
                user.save()
            serializer.save(customer=user.customer_profile)
        else:
            serializer.save()


class DriverWageViewSet(viewsets.ModelViewSet):
    queryset = DriverWage.objects.all().order_by('-date', '-id')
    serializer_class = DriverWageSerializer
    permission_classes = [IsOwner]


class FuelLogViewSet(viewsets.ModelViewSet):
    queryset = FuelLog.objects.all().order_by('-date', '-id')
    serializer_class = FuelLogSerializer
    permission_classes = [IsOwner]


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date', '-id')
    serializer_class = ExpenseSerializer
    permission_classes = [IsOwner]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-date', '-id')
    serializer_class = PaymentSerializer
    permission_classes = [IsOwner]


class MaintenanceViewSet(viewsets.ModelViewSet):
    queryset = Maintenance.objects.all().order_by('next_due')
    serializer_class = MaintenanceSerializer
    permission_classes = [IsOwner]


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        today = date.today()
        current_month = today.month
        current_year = today.year

        # If logged in user is a customer, return restricted customer stats
        if user.role == 'Customer':
            if not user.customer_profile:
                profile = Customer.objects.create(
                    name=user.username.capitalize(),
                    phone='9988776655',
                    village='Village'
                )
                user.customer_profile = profile
                user.save()
            
            cust_bookings = Booking.objects.filter(customer=user.customer_profile)
            total_b = cust_bookings.count()
            todays_b = cust_bookings.filter(date=today).count()
            
            # Pending balance calculated from payments
            payments = Payment.objects.filter(customer=user.customer_profile)
            total_pending = payments.aggregate(total=Sum('pending'))['total'] or 0.00
            total_paid = payments.aggregate(total=Sum('paid'))['total'] or 0.00

            recent = cust_bookings.order_by('-date', '-id')[:5]
            recent_serializer = BookingSerializer(recent, many=True)

            data = {
                'role': 'Customer',
                'customer_profile': user.customer_profile.id,
                'total_bookings': total_b,
                'todays_bookings': todays_b,
                'pending_payments': float(total_pending),
                'total_paid': float(total_paid),
                'recent_bookings': recent_serializer.data,
            }
            return Response(data, status=status.HTTP_200_OK)

        # Owners stats (existing logic)
        total_customers = Customer.objects.count()
        todays_bookings = Booking.objects.filter(date=today).count()
        todays_earnings = Booking.objects.filter(date=today).aggregate(total=Sum('total_amount'))['total'] or 0.00
        pending_payments = Payment.objects.aggregate(total=Sum('pending'))['total'] or 0.00
        fuel_expense_month = FuelLog.objects.filter(date__month=current_month, date__year=current_year).aggregate(total=Sum('total_amount'))['total'] or 0.00
        
        maint_expense_month = Expense.objects.filter(
            category__in=['Repair', 'Service'], 
            date__month=current_month, 
            date__year=current_year
        ).aggregate(total=Sum('amount'))['total'] or 0.00

        total_income_month = Payment.objects.filter(date__month=current_month, date__year=current_year).aggregate(total=Sum('paid'))['total'] or 0.00
        total_general_expenses = Expense.objects.filter(date__month=current_month, date__year=current_year).aggregate(total=Sum('amount'))['total'] or 0.00
        total_expenses_month = float(fuel_expense_month) + float(total_general_expenses)
        profit_month = float(total_income_month) - total_expenses_month

        recent_bookings = Booking.objects.all().order_by('-date', '-id')[:5]
        recent_bookings_serializer = BookingSerializer(recent_bookings, many=True)

        work_type_counts = Booking.objects.values('work_type').annotate(count=Count('id')).order_by('-count')
        total_bookings_count = Booking.objects.count() or 1
        work_type_data = []
        for item in work_type_counts:
            percentage = round((item['count'] / total_bookings_count) * 100, 1)
            work_type_data.append({
                'name': item['work_type'],
                'value': item['count'],
                'percentage': percentage
            })

        income_overview = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timezone.timedelta(days=i)
            day_earnings = Booking.objects.filter(date=day).aggregate(total=Sum('total_amount'))['total'] or 0.00
            income_overview.append({
                'date': day.strftime('%d %b'),
                'earnings': float(day_earnings)
            })

        data = {
            'role': 'Owner',
            'total_customers': total_customers,
            'todays_bookings': todays_bookings,
            'todays_earnings': float(todays_earnings),
            'pending_payments': float(pending_payments),
            'fuel_expense': float(fuel_expense_month),
            'maintenance_expense': float(maint_expense_month),
            'total_income': float(total_income_month),
            'profit': profit_month,
            'recent_bookings': recent_bookings_serializer.data,
            'work_types': work_type_data,
            'income_overview': income_overview
        }
        return Response(data, status=status.HTTP_200_OK)


class ReportsStatsView(APIView):
    permission_classes = [IsOwner]

    def get(self, request, format=None):
        total_income = Payment.objects.aggregate(total=Sum('paid'))['total'] or 0.00
        total_fuel = FuelLog.objects.aggregate(total=Sum('total_amount'))['total'] or 0.00
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0.00
        overall_expenses = float(total_fuel) + float(total_expenses)
        net_profit = float(total_income) - overall_expenses
        profit_percent = round((net_profit / float(total_income)) * 100, 2) if float(total_income) > 0 else 0.00

        expense_breakdown = [
            {'name': 'Fuel', 'amount': float(total_fuel)},
        ]
        categories = Expense.objects.values('category').annotate(amount=Sum('amount'))
        for cat in categories:
            expense_breakdown.append({
                'name': cat['category'],
                'amount': float(cat['amount'])
            })

        total_bookings = Booking.objects.count()
        completed_bookings = Booking.objects.filter(status='Completed').count()
        canceled_bookings = Booking.objects.filter(status='Canceled').count()

        monthly_income_data = []
        for m in range(1, 13):
            month_paid = Payment.objects.filter(date__month=m).aggregate(total=Sum('paid'))['total'] or 0.00
            monthly_income_data.append({
                'month': datetime(2000, m, 1).strftime('%B')[:3],
                'income': float(month_paid)
            })

        data = {
            'total_income': float(total_income),
            'total_expenses': overall_expenses,
            'net_profit': net_profit,
            'profit_percent': profit_percent,
            'expense_breakdown': expense_breakdown,
            'total_bookings': total_bookings,
            'completed_bookings': completed_bookings,
            'canceled_bookings': canceled_bookings,
            'monthly_income': monthly_income_data
        }
        return Response(data, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        role = request.data.get('role', 'Owner')

        if not username or not password or not email:
            return Response({'detail': 'Username, email, and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'username': ['A user with that username already exists.']}, status=status.HTTP_400_BAD_REQUEST)

        customer_profile = None
        if role == 'Customer':
            name = request.data.get('name')
            phone = request.data.get('phone')
            village = request.data.get('village')
            address = request.data.get('address', '')
            notes = request.data.get('notes', '')

            if not name or not phone or not village:
                return Response({'detail': 'Customer name, phone, and village are required for Customer registration.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if Customer.objects.filter(phone=phone).exists():
                return Response({'phone': ['A customer with this phone number already exists.']}, status=status.HTTP_400_BAD_REQUEST)

            customer_profile = Customer.objects.create(
                name=name,
                phone=phone,
                village=village,
                address=address,
                notes=notes
            )

        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role=role,
            customer_profile=customer_profile
        )

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'customer_profile': user.customer_profile.id if user.customer_profile else None
            }
        }, status=status.HTTP_201_CREATED)