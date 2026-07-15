from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomerViewSet, DriverViewSet, BookingViewSet, 
    DriverWageViewSet, FuelLogViewSet, ExpenseViewSet, 
    PaymentViewSet, MaintenanceViewSet, DashboardStatsView, ReportsStatsView,
    CustomTokenObtainPairView, RegisterView
)

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
router.register(r'drivers', DriverViewSet)
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'wages', DriverWageViewSet)
router.register(r'fuel', FuelLogViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'maintenance', MaintenanceViewSet)

urlpatterns = [
    path('api/login/', CustomTokenObtainPairView.as_view(), name='api-login'),
    path('api/register/', RegisterView.as_view(), name='api-register'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/reports/stats/', ReportsStatsView.as_view(), name='reports-stats'),
    path('api/', include(router.urls)),
]