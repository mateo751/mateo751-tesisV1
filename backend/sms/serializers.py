from rest_framework import serializers
from .models import SMS

class SMSSerializer(serializers.ModelSerializer):
    usuario = serializers.ReadOnlyField(source='usuario.username')
    
    class Meta:
        model = SMS
        fields = ['id', 'titulo_estudio', 'autores', 'preguntas_investigacion',
                 'fuentes', 'criterios_inclusion_exclusion', 'usuario',
                 'fecha_creacion', 'fecha_actualizacion']
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']

    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)

class SMSListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMS
        fields = ['id', 'titulo_estudio', 'autores', 'fecha_creacion']
