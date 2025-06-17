#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
    
    


if __name__ == '__main__':
    main()
    
# Ejecutar en Django shell: python manage.py shell

from sms.models import Article, SMS

# Obtener el SMS que tienes problemas (reemplaza el ID)
sms_id = 1  # Cambia por el ID de tu SMS
sms = SMS.objects.get(id=sms_id)

print(f"SMS: {sms.titulo_estudio}")
print(f"Artículos en este SMS: {sms.articles.count()}")
print("-" * 50)

# Revisar los primeros 3 artículos
for article in sms.articles.all()[:3]:
    print(f"ID: {article.id}")
    print(f"Título: {article.titulo}")
    print(f"Autores: {article.autores}")
    print(f"Revista (journal): '{article.journal}'")
    print(f"DOI: {article.doi}")
    print(f"Respuesta Subpregunta 1: '{article.respuesta_subpregunta_1}'")
    print(f"Respuesta Subpregunta 2: '{article.respuesta_subpregunta_2}'")
    print(f"Respuesta Subpregunta 3: '{article.respuesta_subpregunta_3}'")
    print("-" * 30)

# Verificar también la estructura de campos
print("Campos del modelo Article:")
for field in Article._meta.fields:
    print(f"- {field.name}: {field.__class__.__name__}")
