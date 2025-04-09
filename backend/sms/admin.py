from django.contrib import admin
from .models import SMS
@admin.register(SMS)
class SMSAdmin(admin.ModelAdmin):
    list_display = ('id', 'titulo_estudio', 'autores', 'fecha_creacion')
    search_fields = ('titulo_estudio', 'autores')
    list_filter = ('fecha_creacion',)

