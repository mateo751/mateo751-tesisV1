from django.apps import AppConfig

class SmsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sms'
    def ready(self):
        # Importar y configurar Science-Parse al iniciar la aplicación
        try:
            from .science_parse import setup_science_parse
            setup_science_parse()
        except Exception as e:
            print(f"No se pudo inicializar Science-Parse automáticamente: {e}")
            print("Deberás configurarlo manualmente.")