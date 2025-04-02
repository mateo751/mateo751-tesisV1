from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Todo

""" Que es un serializador?
    Un serializador es un objeto que convierte datos complejos
    en formatos de datos simples, como JSON, y viceversa.
    En Django, los serializadores se utilizan para convertir
    modelos de datos en formatos de datos simples, como JSON, y viceversa.
"""
#Serializadores de los modelos

class UserRegisterSerializer(serializers.ModelSerializer):#Serializador para registrar un usuario
    password = serializers.CharField(write_only=True) #Campo password que no se mostrará en el JSON
    class Meta: #Meta clase para definir los campos del modelo  
        model = User #Modelo de datos
        fields = ['username', 'email', 'password'] #Campos del modelo
    def create(self, validated_data): #Método para crear un usuario
        user = User(
            username = validated_data['username'],
            email = validated_data['email']
        )
        user.set_password(validated_data['password']) #Establecer la contraseña del usuario
        user.save() #Guardar el usuario en la base de datos
        return user

class UserSerializer(serializers.ModelSerializer):#Serializador para obtener los datos del usuario
    class Meta:
        model = User
        fields = ['username']

class TodoSerializer(serializers.ModelSerializer):#Serializador para obtener los datos de la tabla Todo 
    class Meta:
        model = Todo
        fields = ['id', 'name', 'completed']