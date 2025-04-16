from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SMSViewSet

router = DefaultRouter()
router.register('', SMSViewSet, basename='sms')

urlpatterns = [
    path('', include(router.urls)),
]
