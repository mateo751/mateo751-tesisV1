from django.contrib import admin
from .models import Todo

#Registro de los modelos en el admin
""" Que es el admin?
    El admin es una interfaz de usuario para administrar la base de datos.
    En Django, el admin se utiliza para administrar los modelos de la base de datos.
"""
admin.site.register(Todo)

