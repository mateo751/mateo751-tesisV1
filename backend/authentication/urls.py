from django.urls import path
from .views import CustomTokenObtainPairView, CustomTokenRefreshView, logout, get_todos, register, is_logged_in
""" Que es una URL?
    Una URL es una dirección web que se utiliza para acceder a una página web.
    En Django, las URLs se utilizan para acceder a las vistas.
"""
#URLs para el token de acceso y refresco
urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),#URL para obtener el token de acceso
    path('logout/', logout, name='logout'),#URL para cerrar sesión
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),#URL para refrescar el token de acceso
    path('todos/', get_todos, name='get_todos'),#URL para obtener todos los todos
    path('register/', register, name='register'),#URL para registrar un usuario
    path('auth/', is_logged_in, name='is_logged_in'),#URL para verificar si el usuario está autenticado
]

