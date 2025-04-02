from django.db import models
from django.contrib.auth.models import User

#Modelo de la tabla Todo
""" Que es un modelo?
    Un modelo es una clase que representa una tabla en la base de datos.
    En Django, los modelos se utilizan para crear tablas en la base de datos.
"""
class Todo(models.Model):
    name = models.CharField(max_length=200)
    completed = models.BooleanField(default=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='todos')

