from rest_framework import serializers
from .models import SMS, Article


class SMSSerializer(serializers.ModelSerializer):
    usuario = serializers.ReadOnlyField(source='usuario.username')
    
    class Meta:
        model = SMS
        fields = [  'id', 'titulo_estudio', 'autores', 'pregunta_principal', 
                    'subpregunta_1', 'subpregunta_2', 'subpregunta_3', 
                    'cadena_busqueda', 'anio_inicio', 'anio_final',
                    'criterios_inclusion', 'criterios_exclusion', 'enfoque_estudio',
                    'tipo_registro', 'tipo_tecnica', 'fuentes', 'usuario',
                    'fecha_creacion', 'fecha_actualizacion']
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)

class SMSListSerializer(serializers.ModelSerializer):
    """Serializador para listar SMS sin artículos"""
    class Meta:
        model = SMS
        fields = [
            'id', 'titulo_estudio', 'autores', 'pregunta_principal',
            'fecha_creacion', 'fecha_actualizacion'
        ]

class ArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = [
            'id', 'titulo', 'autores', 'anio', 'abstract', 
            'palabras_clave', 'doi', 'url', 'fuente', 
            'tipo_registro', 'estado', 'notas',
            'fecha_creacion', 'fecha_actualizacion'
        ]

class SMSDetailSerializer(serializers.ModelSerializer):
    """Serializador para ver detalles completos de SMS con sus artículos"""
    articles = ArticleSerializer(many=True, read_only=True)
    
    class Meta:
        model = SMS
        fields = [
            'id', 'titulo_estudio', 'autores', 'pregunta_principal',
            'sub_preguntas', 'cadena_busqueda', 'anio_inicio', 'anio_final',
            'criterios_inclusion', 'criterios_exclusion', 'enfoque_estudio',
            'tipo_registro', 'tipo_tecnica', 'usuario', 'fecha_creacion',
            'fecha_actualizacion', 'articles'
        ]

class SMSCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador para crear y actualizar SMS sin artículos"""
    class Meta:
        model = SMS
        fields = [
            'titulo_estudio', 'autores', 'pregunta_principal',
            'sub_preguntas', 'cadena_busqueda', 'anio_inicio', 'anio_final',
            'criterios_inclusion', 'criterios_exclusion', 'enfoque_estudio',
            'tipo_registro', 'tipo_tecnica'
        ]
