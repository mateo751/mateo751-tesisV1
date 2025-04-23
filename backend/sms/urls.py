from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedSimpleRouter

from .views import SMSViewSet, ArticleViewSet

# Router principal para SMS
router = DefaultRouter()
router.register(r'sms', SMSViewSet)

# Router anidado para artículos dentro de SMS
sms_router = NestedSimpleRouter(router, r'sms', lookup='sms')
sms_router.register(r'articles', ArticleViewSet, basename='sms-articles')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(sms_router.urls)),
]