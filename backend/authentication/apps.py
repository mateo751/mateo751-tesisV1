from django.apps import AppConfig

""" Que es una aplicación?
    Una aplicación es un conjunto de modelos, vistas y URLs que se utilizan para crear una funcionalidad específica.
    En Django, las aplicaciones se utilizan para crear funcionalidades específicas.
"""
#Configuración de la aplicación
class AuthenticationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'authentication'
