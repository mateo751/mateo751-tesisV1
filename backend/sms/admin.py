from django.contrib import admin
from .models import SMS, Article

@admin.register(SMS)
class SMSAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo_estudio', 'autores', 'fecha_creacion')
    search_fields = ('titulo_estudio', 'autores')
    list_filter = ('fecha_creacion',)

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo', 'autores', 'anio_publicacion', 'estado')
    list_filter = ('estado', 'enfoque', 'tipo_registro', 'anio_publicacion')
    search_fields = ('titulo', 'autores', 'resumen', 'doi')
    fieldsets = (
        ('Información básica', {
            'fields': ('sms', 'titulo', 'autores', 'anio_publicacion', 'doi', 'url')
        }),
        ('Clasificación', {
            'fields': ('enfoque', 'tipo_registro', 'tipo_tecnica')
        }),
        ('Contenido', {
            'fields': ('resumen', 'palabras_clave', 'metodologia', 'resultados', 'conclusiones')
        }),
        ('Estado y notas', {
            'fields': ('estado', 'notas')
        }),
    )