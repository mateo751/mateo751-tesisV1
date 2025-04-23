from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
import csv
from django.http import HttpResponse
import io

from .models import SMS, Article
from .serializers import (
    SMSSerializer, 
    SMSListSerializer, 
    SMSDetailSerializer,
    SMSCreateUpdateSerializer,
    ArticleSerializer
)

class SMSViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar SMS (Systematic Mapping Study)"""
    permission_classes = [IsAuthenticated]
    queryset = SMS.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo_estudio', 'autores', 'pregunta_principal']
    ordering_fields = ['fecha_creacion', 'fecha_actualizacion', 'titulo_estudio']
    
    def get_queryset(self):
        """Filtra SMS por usuario autenticado"""
        return SMS.objects.filter(usuario=self.request.user)
    
    def get_serializer_class(self):
        """Selecciona el serializador adecuado según la acción"""
        if self.action == 'list':
            return SMSListSerializer
        elif self.action == 'retrieve':
            return SMSDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return SMSCreateUpdateSerializer
        return SMSSerializer
    
    def perform_create(self, serializer):
        """Asigna el usuario al crear un nuevo SMS"""
        serializer.save(usuario=self.request.user)
    
    @action(detail=True, methods=['post', 'put'], url_path='questions')
    def manage_questions(self, request, pk=None):
        """
        Endpoint para gestionar preguntas del SMS
        POST/PUT /api/sms/{id}/questions/
        """
        sms = self.get_object()
        
        # Validamos los datos
        valid_fields = [
            'pregunta_principal', 
            'subpregunta_1', 
            'subpregunta_2', 
            'subpregunta_3'
        ]
        
        # Filtramos solo los campos relacionados con preguntas
        question_data = {k: v for k, v in request.data.items() if k in valid_fields}
        
        if not question_data:
            return Response(
                {"detail": "No se proporcionaron datos de preguntas válidos."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizamos solo los campos de preguntas
        for field, value in question_data.items():
            setattr(sms, field, value)
        
        sms.save()
        return Response(SMSDetailSerializer(sms).data)
    
    @action(detail=True, methods=['post', 'put'], url_path='criteria')
    def manage_criteria(self, request, pk=None):
        """
        Endpoint para gestionar criterios del SMS
        POST/PUT /api/sms/{id}/criteria/
        """
        sms = self.get_object()
        
        # Validamos los datos
        valid_fields = [
            'criterios_inclusion', 
            'criterios_exclusion',
            'enfoque_estudio',
            'anio_inicio',
            'anio_final'
        ]
        
        # Filtramos solo los campos relacionados con criterios
        criteria_data = {k: v for k, v in request.data.items() if k in valid_fields}
        
        if not criteria_data:
            return Response(
                {"detail": "No se proporcionaron datos de criterios válidos."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizamos solo los campos de criterios
        for field, value in criteria_data.items():
            setattr(sms, field, value)
        
        sms.save()
        return Response(SMSDetailSerializer(sms).data)
    
    @action(detail=True, methods=['post'], url_path='articles/import')
    def import_articles(self, request, pk=None):
        """
        Endpoint para importar artículos
        POST /api/sms/{id}/articles/import/
        
        Espera un JSON con array de artículos en el siguiente formato:
        [
            {
                "titulo": "...",
                "autores": "...",
                "anio": 2023,
                ...
            },
            ...
        ]
        """
        sms = self.get_object()
        
        if not isinstance(request.data, list):
            return Response(
                {"detail": "Se esperaba una lista de artículos."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        imported_articles = []
        errors = []
        
        for idx, article_data in enumerate(request.data):
            # Añadimos el SMS al artículo
            article_data['sms'] = sms.id
            
            serializer = ArticleSerializer(data=article_data)
            if serializer.is_valid():
                article = serializer.save()
                imported_articles.append(ArticleSerializer(article).data)
            else:
                errors.append({
                    "index": idx,
                    "data": article_data,
                    "errors": serializer.errors
                })
        
        result = {
            "total_submitted": len(request.data),
            "imported": len(imported_articles),
            "failed": len(errors),
            "articles": imported_articles
        }
        
        if errors:
            result["errors"] = errors
        
        return Response(result)

class ArticleViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar artículos dentro de un SMS"""
    permission_classes = [IsAuthenticated]
    serializer_class = ArticleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['anio_publicacion', 'enfoque', 'tipo_registro', 'estado']
    search_fields = ['titulo', 'autores', 'resumen', 'palabras_clave', 'doi']
    ordering_fields = ['anio_publicacion', 'fecha_creacion', 'titulo']
    
    def get_queryset(self):
        """Filtra artículos por SMS_id y usuario autenticado"""
        sms_id = self.kwargs.get('sms_pk')
        return Article.objects.filter(
            sms_id=sms_id,
            sms__usuario=self.request.user
        )
    
    def get_sms(self):
        """Obtiene el SMS asociado y verifica que pertenezca al usuario"""
        sms_id = self.kwargs.get('sms_pk')
        return get_object_or_404(SMS, id=sms_id, usuario=self.request.user)
    
    def perform_create(self, serializer):
        """Asigna el SMS al crear un nuevo artículo"""
        sms = self.get_sms()
        serializer.save(sms=sms)
    
    @action(detail=True, methods=['patch'], url_path='select')
    def select_article(self, request, sms_pk=None, pk=None):
        """
        Endpoint para seleccionar/deseleccionar artículos
        PATCH /api/sms/{sms_id}/articles/{article_id}/select/
        
        Espera un JSON con el estado:
        {
            "estado": "selected" | "rejected" | "pending"
        }
        """
        article = self.get_object()
        
        if 'estado' not in request.data:
            return Response(
                {"detail": "El campo 'estado' es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_states = ['selected', 'rejected', 'pending']
        if request.data['estado'] not in valid_states:
            return Response(
                {"detail": f"El estado debe ser uno de: {', '.join(valid_states)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article.estado = request.data['estado']
        article.save()
        
        return Response(ArticleSerializer(article).data)
    
    @action(detail=False, methods=['get'], url_path='export')
    def export_articles(self, request, sms_pk=None):
        """
        Endpoint para exportar artículos seleccionados
        GET /api/sms/{sms_id}/articles/export/
        
        Parámetros de consulta opcionales:
        - format: csv (default) | json
        - state: selected (default) | rejected | pending | all
        """
        # Obtener el formato de exportación
        export_format = request.query_params.get('format', 'csv')
        # Obtener el estado de filtrado
        state_filter = request.query_params.get('state', 'selected')
        
        # Filtramos los artículos según el estado solicitado
        queryset = self.get_queryset()
        if state_filter != 'all':
            queryset = queryset.filter(estado=state_filter)
        
        # Para formato JSON, simplemente serializamos y devolvemos
        if export_format == 'json':
            serializer = ArticleSerializer(queryset, many=True)
            return Response(serializer.data)
        
        # Para formato CSV, generamos el archivo
        elif export_format == 'csv':
            # Creamos un buffer en memoria para el CSV
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer)
            
            # Escribimos el encabezado
            headers = [
                'ID', 'Título', 'Autores', 'Año', 'Resumen', 
                'Palabras Clave', 'DOI', 'URL', 'Enfoque', 
                'Tipo de Registro', 'Tipo de Técnica', 'Estado', 'Notas'
            ]
            writer.writerow(headers)
            
            # Escribimos los datos
            for article in queryset:
                row = [
                    article.id, article.titulo, article.autores, article.anio_publicacion,
                    article.resumen, article.palabras_clave, article.doi,
                    article.url, article.enfoque, article.tipo_registro,
                    article.tipo_tecnica, article.estado, article.notas
                ]
                writer.writerow(row)
            
            # Preparamos la respuesta con el archivo CSV
            response = HttpResponse(
                csv_buffer.getvalue(),
                content_type='text/csv'
            )
            response['Content-Disposition'] = f'attachment; filename="articles_{sms_pk}_{state_filter}.csv"'
            
            return response
        
        # Si el formato no es válido
        else:
            return Response(
                {"detail": "Formato de exportación no válido. Use 'csv' o 'json'."},
                status=status.HTTP_400_BAD_REQUEST
            )