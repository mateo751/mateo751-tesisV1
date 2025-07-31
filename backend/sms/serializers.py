from rest_framework import serializers
from .models import SMS, Article


class SMSSerializer(serializers.ModelSerializer):
    usuario = serializers.ReadOnlyField(source='usuario.username')
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'titulo', 'autores', 'anio_publicacion', 'resumen', 
            'palabras_clave', 'doi', 'url', 'journal',
            'respuesta_subpregunta_1', 'respuesta_subpregunta_2', 'respuesta_subpregunta_3',
            'enfoque', 'tipo_registro', 'tipo_tecnica', 'estado', 'notas',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        instance = super().create(validated_data)
        return instance

class SMSListSerializer(serializers.ModelSerializer):
    """Serializador para listar SMS sin artículos"""
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SMS
        fields = [
            'id', 'titulo_estudio', 'autores', 'pregunta_principal',
            'fecha_creacion', 'fecha_actualizacion'
        ]

class ArticleSerializer(serializers.ModelSerializer):
    # Añadir campos calculados para asegurar valores no nulos
    journal_display = serializers.SerializerMethodField()
    respuesta_pregunta_principal_display = serializers.SerializerMethodField()
    respuesta_subpregunta_1_display = serializers.SerializerMethodField()
    respuesta_subpregunta_2_display = serializers.SerializerMethodField()
    respuesta_subpregunta_3_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Article
        fields = [
            'id', 'titulo', 'autores', 'anio_publicacion', 'resumen', 
            'palabras_clave', 'doi', 'url', 'journal', 'journal_display',
            'respuesta_pregunta_principal', 'respuesta_pregunta_principal_display',
            'respuesta_subpregunta_1', 'respuesta_subpregunta_1_display',
            'respuesta_subpregunta_2', 'respuesta_subpregunta_2_display', 
            'respuesta_subpregunta_3', 'respuesta_subpregunta_3_display',
            'enfoque', 'tipo_registro', 'tipo_tecnica', 'estado', 'notas',
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_journal_display(self, obj):
        """Asegurar que journal nunca sea None o vacío"""
        journal = obj.journal
        if journal and journal.strip() and journal != 'None':
            return journal.strip()
        return 'Sin revista'
    
    def get_respuesta_pregunta_principal_display(self, obj):
        """Asegurar que la respuesta principal nunca sea None o vacía"""
        respuesta = obj.respuesta_pregunta_principal
        if respuesta and respuesta.strip() and respuesta != 'None':
            return respuesta.strip()
        return 'Sin respuesta disponible'
    
    def get_respuesta_subpregunta_1_display(self, obj):
        """Asegurar que la respuesta 1 nunca sea None o vacía"""
        respuesta = obj.respuesta_subpregunta_1
        if respuesta and respuesta.strip() and respuesta != 'None':
            return respuesta.strip()
        return 'Sin respuesta disponible'
    
    def get_respuesta_subpregunta_2_display(self, obj):
        """Asegurar que la respuesta 2 nunca sea None o vacía"""
        respuesta = obj.respuesta_subpregunta_2
        if respuesta and respuesta.strip() and respuesta != 'None':
            return respuesta.strip()
        return 'Sin respuesta disponible'
    
    def get_respuesta_subpregunta_3_display(self, obj):
        """Asegurar que la respuesta 3 nunca sea None o vacía"""
        respuesta = obj.respuesta_subpregunta_3
        if respuesta and respuesta.strip() and respuesta != 'None':
            return respuesta.strip()
        return 'Sin respuesta disponible'

    def to_representation(self, instance):
        """Personalizar la representación de salida"""
        data = super().to_representation(instance)
        
        # Asegurar que los campos críticos nunca sean None
        data['journal'] = data.get('journal_display', 'Sin revista')
        data['respuesta_pregunta_principal'] = data.get('respuesta_pregunta_principal_display', 'Sin respuesta disponible')
        data['respuesta_subpregunta_1'] = data.get('respuesta_subpregunta_1_display', 'Sin respuesta disponible')
        data['respuesta_subpregunta_2'] = data.get('respuesta_subpregunta_2_display', 'Sin respuesta disponible')
        data['respuesta_subpregunta_3'] = data.get('respuesta_subpregunta_3_display', 'Sin respuesta disponible')
        
        # Limpiar campos auxiliares
        data.pop('journal_display', None)
        data.pop('respuesta_pregunta_principal_display', None)
        data.pop('respuesta_subpregunta_1_display', None)
        data.pop('respuesta_subpregunta_2_display', None)
        data.pop('respuesta_subpregunta_3_display', None)
        
        return data

class ArticleEditSerializer(serializers.ModelSerializer):
    """Serializador específico para edición de artículos"""
    
    class Meta:
        model = Article
        fields = [
            'id', 'titulo', 'autores', 'anio_publicacion', 'journal', 'doi',
            'resumen', 'palabras_clave', 'metodologia', 'resultados', 'conclusiones',
            'respuesta_pregunta_principal', 'respuesta_subpregunta_1', 'respuesta_subpregunta_2', 'respuesta_subpregunta_3',
            'estado', 'notas'
        ]
        read_only_fields = ['id']
    
    def validate_titulo(self, value):
        """Validar que el título no esté vacío"""
        if not value or not value.strip():
            raise serializers.ValidationError("El título es obligatorio")
        return value.strip()
    
    def validate_autores(self, value):
        """Validar que los autores no estén vacíos"""
        if not value or not value.strip():
            raise serializers.ValidationError("Los autores son obligatorios")
        return value.strip()
    
    def validate_anio_publicacion(self, value):
        """Validar año de publicación"""
        if value is not None:
            if value < 1900 or value > 2030:
                raise serializers.ValidationError("El año debe estar entre 1900 y 2030")
        return value
    
    def validate_estado(self, value):
        """Validar estado del artículo"""
        valid_states = ['SELECTED', 'REJECTED', 'PENDING']
        if value not in valid_states:
            raise serializers.ValidationError(
                f"El estado debe ser uno de: {', '.join(valid_states)}"
            )
        return value
    
    def validate_doi(self, value):
        """Validar formato básico del DOI"""
        if value and value.strip():
            # Validación básica de DOI (debe empezar con 10.)
            if not value.strip().startswith('10.'):
                raise serializers.ValidationError(
                    "El DOI debe tener un formato válido (ejemplo: 10.1000/journal.2023.123)"
                )
        return value.strip() if value else ""
    
    def clean_text_field(self, value, field_name, default_empty=""):
        """Limpia campos de texto, manejando valores None o 'None'"""
        if not value or value == 'None' or value == 'null':
            return default_empty
        return value.strip()
    
    def validate(self, data):
        """Validaciones a nivel de objeto"""
        # Limpiar campos de texto
        text_fields = [
            'journal', 'resumen', 'palabras_clave', 'metodologia', 
            'resultados', 'conclusiones', 'notas'
        ]
        
        for field in text_fields:
            if field in data:
                if field == 'journal':
                    data[field] = self.clean_text_field(data[field], field, "Sin revista")
                else:
                    data[field] = self.clean_text_field(data[field], field, "")
        
        # Limpiar respuestas a preguntas
        subquestion_fields = [
            'respuesta_pregunta_principal', 'respuesta_subpregunta_1', 'respuesta_subpregunta_2', 'respuesta_subpregunta_3'
        ]
        
        for field in subquestion_fields:
            if field in data:
                data[field] = self.clean_text_field(
                    data[field], field, "Sin respuesta disponible"
                )
        
        return data
    
    def update(self, instance, validated_data):
        """Actualizar instancia con logging"""
        # Log de cambios
        changes = []
        for field, new_value in validated_data.items():
            old_value = getattr(instance, field)
            if old_value != new_value:
                changes.append(f"{field}: '{old_value}' -> '{new_value}'")
        
        if changes:
            print(f"Actualizando artículo {instance.id}:")
            for change in changes:
                print(f"  - {change}")
        
        # Actualizar instancia
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        return instance
    
class SMSDetailSerializer(serializers.ModelSerializer):
    """Serializador para ver detalles completos de SMS con sus artículos"""
    articles = ArticleSerializer(many=True, read_only=True)
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SMS
        fields = [
            'id', 'titulo_estudio', 'autores', 'pregunta_principal',
            'subpregunta_1', 'subpregunta_2', 'subpregunta_3',
            'cadena_busqueda', 'anio_inicio', 'anio_final',
            'criterios_inclusion', 'criterios_exclusion', 'enfoque_estudio',
            'tipo_registro', 'tipo_tecnica', 'usuario', 'fecha_creacion',
            'fecha_actualizacion', 'articles'
        ]

class SMSCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializador para crear y actualizar SMS sin artículos"""
    id = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = SMS
        fields = [
            'id', 'titulo_estudio', 'autores', 'pregunta_principal',
            'subpregunta_1', 'subpregunta_2', 'subpregunta_3',
            'cadena_busqueda', 'anio_inicio', 'anio_final',
            'criterios_inclusion', 'criterios_exclusion', 
            #'enfoque_estudio','tipo_registro', 'tipo_tecnica'
        ]
