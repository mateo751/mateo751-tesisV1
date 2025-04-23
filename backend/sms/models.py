from django.db import models
from django.contrib.auth.models import User

class SMS(models.Model):
    id = models.AutoField(primary_key=True)
    titulo_estudio = models.CharField(max_length=255)
    autores = models.CharField(max_length=255)
    
    # Pregunta principal que reemplaza a preguntas_investigacion
    pregunta_principal = models.TextField(default="")
    subpregunta_1 = models.TextField(blank=True, null=True)
    subpregunta_2 = models.TextField(blank=True, null=True)
    subpregunta_3 = models.TextField(blank=True, null=True)
    
    # Renombrar criterios_inclusion_exclusion a cadena_busqueda
    cadena_busqueda = models.TextField()  # Este campo ya existe, solo se renombra
    
    # Campos numéricos con valores por defecto adecuados
    anio_inicio = models.IntegerField(default=2000)  # Un año por defecto razonable
    anio_final = models.IntegerField(default=2025)   # Un año por defecto razonable
    
    # Nuevos campos de criterios
    criterios_inclusion = models.TextField(default="")
    criterios_exclusion = models.TextField(default="")
    
    # Campos adicionales con valores por defecto
    enfoque_estudio = models.CharField(max_length=100, default="")
    tipo_registro = models.CharField(max_length=100, default="")
    tipo_tecnica = models.CharField(max_length=100, default="")
    
    # Campos existentes que mantenemos
    fuentes = models.TextField()
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sms_studies')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.titulo_estudio
    
class Article(models.Model):
    # Opciones para el campo estado
    STATUS_CHOICES = [
        ('SELECTED', 'Seleccionado'),
        ('REJECTED', 'Descartado'),
        ('PENDING', 'Pendiente'),
    ]
    
    # Relación con el modelo SMS
    sms = models.ForeignKey(SMS, on_delete=models.CASCADE, related_name='articles')
    
    # Campos básicos para la información del artículo
    titulo = models.CharField(max_length=255)
    autores = models.TextField()
    anio_publicacion = models.IntegerField()
    doi = models.CharField(max_length=100, blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    
    # Clasificación del artículo
    enfoque = models.CharField(max_length=100)
    tipo_registro = models.CharField(max_length=100)
    tipo_tecnica = models.CharField(max_length=100, blank=True, null=True)
    
    # Campos para el análisis
    resumen = models.TextField(blank=True, null=True)
    palabras_clave = models.TextField(blank=True, null=True)
    metodologia = models.TextField(blank=True, null=True)
    resultados = models.TextField(blank=True, null=True)
    conclusiones = models.TextField(blank=True, null=True)
    
    # Campo para el estado de selección
    estado = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    
    # Campos para seguimiento
    notas = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.titulo  
