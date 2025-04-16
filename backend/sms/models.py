from django.db import models
from django.contrib.auth.models import User

class SMS(models.Model):
    id = models.AutoField(primary_key=True)
    titulo_estudio = models.CharField(max_length=255)
    autores = models.CharField(max_length=255)
    preguntas_investigacion = models.TextField()
    fuentes = models.TextField()  # Puedes cambiarlo a JSONField si estás usando PostgreSQL
    criterios_inclusion_exclusion = models.TextField()
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sms_studies')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.titulo_estudio
