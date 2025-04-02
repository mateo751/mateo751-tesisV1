from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .models import Todo
from .serializers import UserRegisterSerializer, UserSerializer, TodoSerializer
from datetime import datetime, timedelta
from rest_framework import status

""" Que es una vista?
    Una vista es una función que se utiliza para procesar las solicitudes HTTP.
    En Django, las vistas se utilizan para procesar las solicitudes HTTP.
"""

#Vista para registrar un usuario
@api_view(['POST'])#Decorador para indicar que es una vista de API
@permission_classes([AllowAny])#Decorador para indicar que la vista es pública
def register(request):
    serializer = UserRegisterSerializer(data=request.data)#Serializador para registrar un usuario
    if serializer.is_valid():#Si el serializador es válido
        user = serializer.save()#Guardar el usuario en la base de datos
        return Response(serializer.data, status=status.HTTP_201_CREATED)#Devolver la respuesta con el usuario creado
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)#Devolver el error si el serializador no es válido

#Vista para obtener el token de acceso
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)#Serializador para obtener el token de acceso
        try:
            response = super().post(request, *args, **kwargs)#Respuesta de la vista
            tokens = response.data#Tokens de la respuesta
            access_token = tokens['access']#Token de acceso
            refresh_token = tokens['refresh']#Token de refresco
            serializer = UserSerializer(request.user, many=False)#Serializador para obtener el usuario
            res = Response()#Respuesta
            res.data = {'success':True}#Datos de la respuesta
            res.set_cookie(key='access_token', value=str(access_token), httponly=True, secure=True, samesite='None', path='/')#Establecer el cookie de acceso
            res.set_cookie(key='refresh_token', value=str(refresh_token), httponly=True, secure=True, samesite='None', path='/')#Establecer el cookie de refresco
            return res#Devolver la respuesta
        except Exception as e:
            return Response({'success':False, 'error':str(e)}, status=status.HTTP_400_BAD_REQUEST)#Devolver el error si el serializador no es válido
        
#Vista para refrescar el token de acceso
class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.COOKIES.get('refresh_token')#Token de refresco
            request.data['refresh'] = refresh_token#Establecer el token de refresco en el request
            response = super().post(request, *args, **kwargs)#Respuesta de la vista
            tokens = response.data#Tokens de la respuesta
            access_token = tokens['access']#Token de acceso
            res = Response()#Respuesta
            res.data = {'refreshed':True}#Datos de la respuesta
            res.set_cookie(key='access_token', value=access_token, httponly=True, secure=False, samesite='None', path='/')#Establecer el cookie de acceso
            return res#Devolver la respuesta
        except Exception as e:
            return Response({'refreshed':False, 'error':str(e)}, status=status.HTTP_400_BAD_REQUEST)#Devolver el error si el serializador no es válido
        
#Vista para cerrar sesión
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        res = Response()#Respuesta
        res.data = {'success':True}#Datos de la respuesta
        res.delete_cookie('access_token', path='/',samesite='None')#Eliminar el cookie de acceso
        res.delete_cookie('response_token', path='/',samesite='None')#Eliminar el cookie de refresco
        return res#Devolver la respuesta
    except Exception as e:
        return Response({'success':False, 'error':str(e)}, status=status.HTTP_400_BAD_REQUEST)#Devolver el error si el serializador no es válido

#Vista para obtener todos los todos de un usuario
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_todos(request):
    user = request.user#Usuario autenticado
    todos = Todo.objects.filter(owner=user)#Todos del usuario autenticado
    serializer = TodoSerializer(todos, many=True)#Serializador para obtener todos los todos
    return Response(serializer.data, status=status.HTTP_200_OK)#Devolver la respuesta con los todos

#Vista para verificar si el usuario está autenticado
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_logged_in(request):
    serializer = UserSerializer(request.user, many=False)#Serializador para obtener el usuario
    return Response(serializer.data, status=status.HTTP_200_OK)#Devolver la respuesta con el usuario





