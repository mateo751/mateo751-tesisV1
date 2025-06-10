from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Count
import csv
import io
import os
import tempfile
import traceback

from .models import SMS, Article
from .serializers import (
    SMSSerializer, 
    SMSListSerializer, 
    SMSDetailSerializer,
    SMSCreateUpdateSerializer,
    ArticleSerializer
)
from .search_utils import extract_keywords_and_synonyms, generate_search_query
from .science_parse import setup_science_parse, extract_pdf_metadata, analyze_with_chatgpt

# Intenta configurar Science-Parse al iniciar
try:
    setup_science_parse()
except Exception as e:
    print(f"Advertencia: No se pudo configurar Science-Parse automáticamente: {e}")
    print("Esto no impedirá que la aplicación funcione, pero deberás configurar Science-Parse manualmente.")

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
            'anio_final',
            'cadena_busqueda',
            'fuentes'
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
    
    @action(detail=False, methods=['post'], url_path='generate-search-query')
    def generate_search_query(self, request):
        """
        Endpoint para generar una cadena de búsqueda basada en el título
        POST /api/sms/sms/generate-search-query/
        
        Espera un JSON con el título:
        {
            "titulo": "..."
        }
        """
        if 'titulo' not in request.data or not request.data['titulo'].strip():
            return Response(
                {"detail": "Se requiere un título válido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        titulo = request.data['titulo']
        
        try:
            # Extraer palabras clave y generar sinónimos
            keywords_dict = extract_keywords_and_synonyms(titulo, min_terms=5, synonyms_per_term=2)
            
            # Generar la cadena de búsqueda
            search_query = generate_search_query(keywords_dict)
            
            return Response({
                "keywords": keywords_dict,
                "search_query": search_query
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"detail": f"Error al generar la cadena de búsqueda: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
    
    @action(detail=True, methods=['get'], url_path='statistics')
    def get_statistics(self, request, pk=None):
        """
        Endpoint para obtener estadísticas de artículos del SMS
        GET /api/sms/{id}/statistics/
        """
        try:
            sms = self.get_object()
            
            # Contar artículos por estado
            total_articles = sms.articles.count()
            selected_count = sms.articles.filter(estado='SELECTED').count()
            rejected_count = sms.articles.filter(estado='REJECTED').count()
            pending_count = sms.articles.filter(estado='PENDING').count()
            
            # Contar artículos por año
            articles_by_year = sms.articles.values('anio_publicacion').annotate(
                count=Count('id')
            ).order_by('anio_publicacion')
            
            # Contar artículos por enfoque
            articles_by_focus = sms.articles.values('enfoque').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Contar artículos por tipo de registro
            articles_by_type = sms.articles.values('tipo_registro').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Estadísticas del proceso de selección (simulando etapas)
            # En un caso real, podrías tener campos adicionales para rastrear cada etapa
            selection_process = {
                'Búsqueda inicial': total_articles,
                'Después de criterios de inclusión': selected_count + pending_count,
                'Revisión de título y resumen': selected_count + max(0, pending_count - rejected_count//2),
                'Revisión de texto completo': selected_count + pending_count//2,
                'Artículos finales incluidos': selected_count
            }
            
            statistics = {
                'general': {
                    'total_articles': total_articles,
                    'selected_count': selected_count,
                    'rejected_count': rejected_count,
                    'pending_count': pending_count,
                    'selection_rate': round((selected_count / total_articles * 100), 2) if total_articles > 0 else 0
                },
                'by_status': [
                    {'status': 'Seleccionados', 'count': selected_count, 'color': '#10B981'},
                    {'status': 'Rechazados', 'count': rejected_count, 'color': '#EF4444'},
                    {'status': 'Pendientes', 'count': pending_count, 'color': '#F59E0B'}
                ],
                'by_year': list(articles_by_year),
                'by_focus': list(articles_by_focus),
                'by_type': list(articles_by_type),
                'selection_process': [
                    {'stage': stage, 'count': count} 
                    for stage, count in selection_process.items()
                ]
            }
            
            return Response(statistics, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Error al obtener estadísticas: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
        
        valid_states = ['SELECTED', 'REJECTED', 'PENDING']
        
        # Convertir a mayúsculas para hacer coincidir con los valores de la base de datos
        estado = request.data['estado'].upper()
        
        if estado not in valid_states:
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
        - ids: lista de IDs separados por comas para exportar artículos específicos
        """
        # Obtener el formato de exportación
        export_format = request.query_params.get('format', 'csv')
        # Obtener el estado de filtrado
        state_filter = request.query_params.get('state', 'selected')
        # Obtener IDs específicos si se proporcionan
        article_ids = request.query_params.get('ids', None)
        
        # Filtramos los artículos según el estado solicitado
        queryset = self.get_queryset()
        if state_filter != 'all':
            queryset = queryset.filter(estado=state_filter.upper())
        
        # Si se proporcionan IDs específicos, filtrar por ellos
        if article_ids:
            ids_list = [int(x) for x in article_ids.split(',') if x.isdigit()]
            if ids_list:
                queryset = queryset.filter(id__in=ids_list)
        
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
                'ID', 'Título', 'Autores', 'Año', 'Revista/Journal', 'Resumen', 
                'Palabras Clave', 'DOI', 'URL', 'Enfoque', 
                'Tipo de Registro', 'Tipo de Técnica', 'Estado', 'Notas',
                'Respuesta Subpregunta 1', 'Respuesta Subpregunta 2', 'Respuesta Subpregunta 3'
            ]
            writer.writerow(headers)
            
            # Escribimos los datos
            for article in queryset:
                row = [
                    article.id, article.titulo, article.autores, article.anio_publicacion,
                    article.journal, article.resumen, article.palabras_clave, article.doi,
                    article.url, article.enfoque, article.tipo_registro,
                    article.tipo_tecnica, article.estado, article.notas,
                    article.respuesta_subpregunta_1, article.respuesta_subpregunta_2, article.respuesta_subpregunta_3
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
    
    @action(detail=False, methods=['POST'], url_path='analyze-pdfs')
    def analyze_pdfs(self, request, sms_pk=None):
        """
        Analiza los PDFs cargados para extraer metadatos y hacer análisis con ChatGPT
        """
        try:
            # Obtener el SMS
            sms = self.get_sms()
            
            # Obtener las subpreguntas para el análisis de ChatGPT
            subquestions = []
            
            # Añadir pregunta principal si existe
            if sms.pregunta_principal and sms.pregunta_principal.strip():
                subquestions.append(sms.pregunta_principal)
            
            # Añadir subpreguntas si existen
            if sms.subpregunta_1 and sms.subpregunta_1.strip():
                subquestions.append(sms.subpregunta_1)
            if sms.subpregunta_2 and sms.subpregunta_2.strip():
                subquestions.append(sms.subpregunta_2)
            if sms.subpregunta_3 and sms.subpregunta_3.strip():
                subquestions.append(sms.subpregunta_3)
            
            # Si no hay subpreguntas, crear algunas por defecto
            if not subquestions:
                subquestions = [
                    "¿Cuál es el principal hallazgo del estudio?",
                    "¿Qué metodología se utilizó?",
                    "¿Cuáles son las principales conclusiones?"
                ]
                
            print(f"Subpreguntas a analizar: {subquestions}")  # Debug
            
            # Obtener los archivos del request
            files = request.FILES.getlist('files')
            if not files:
                return Response({"error": "No se han proporcionado archivos"}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
            results = []
            for file in files:
                # Guardar el archivo temporalmente
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
                    for chunk in file.chunks():
                        temp.write(chunk)
                    temp_path = temp.name
                
                try:
                    # Extraer metadatos
                    metadata = extract_pdf_metadata(temp_path)
                    
                    # Analizar con ChatGPT para responder subpreguntas
                    analysis_results = analyze_with_chatgpt(metadata, subquestions)
                    
                    # Crear o actualizar el artículo en la base de datos
                    article_data = {
                        'sms': sms,
                        'titulo': metadata['title'],
                        'autores': metadata['authors'],
                        'anio_publicacion': metadata['year'] or 2023,  # Valor por defecto
                        'doi': metadata['doi'],
                        'resumen': metadata['abstract'],
                        'journal': metadata.get('journal', 'Sin revista'),
                        'enfoque': request.data.get('enfoque', 'No especificado'),
                        'tipo_registro': request.data.get('tipo_registro', 'No especificado'),
                        'tipo_tecnica': request.data.get('tipo_tecnica', 'No especificado'),
                        'notas': analysis_results.get('analysis', ''),
                        'estado': 'PENDING',
                        # Aseguramos que siempre haya respuestas a las subpreguntas
                        'respuesta_subpregunta_1': analysis_results.get('subpregunta_1', 'Respuesta pendiente de análisis'),
                        'respuesta_subpregunta_2': analysis_results.get('subpregunta_2', 'Respuesta pendiente de análisis'),
                        'respuesta_subpregunta_3': analysis_results.get('subpregunta_3', 'Respuesta pendiente de análisis')
                    }
                    
                    # Crear el artículo
                    article = Article.objects.create(**article_data)
                    
                    # Preparar el resultado combinando metadatos y respuestas a subpreguntas
                    result = {
                        'id': article.id,
                        'title': metadata['title'],
                        'authors': metadata['authors'],
                        'year': metadata['year'],
                        'journal': metadata.get('journal', 'Sin revista'),
                        'doi': metadata['doi'],
                        'res_subpregunta_1': article_data['respuesta_subpregunta_1'],
                        'res_subpregunta_2': article_data['respuesta_subpregunta_2'],
                        'res_subpregunta_3': article_data['respuesta_subpregunta_3'],
                        'analysis': analysis_results.get('analysis', 'Análisis pendiente')
                    }
                    
                    results.append(result)
                    
                finally:
                    # Limpiar el archivo temporal
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
            
            return Response({
                'results': results,
                'message': f"Se analizaron {len(results)} archivos correctamente"
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Error al analizar los PDFs: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['GET'], url_path='get-article-details')
    def get_article_details(self, request, pk=None):
        """
        Obtiene los detalles de un artículo en el formato específico solicitado
        """
        try:
            article = self.get_object()
            
            response_data = {
                "title": article.titulo,
                "authors": article.autores,
                "year": article.anio_publicacion,
                "journal": article.journal or "Sin revista",
                "doi": article.doi or "Sin DOI",
                "res_subpregunta_1": article.respuesta_subpregunta_1 or "Respuesta corta a la primera subpregunta",
                "res_subpregunta_2": article.respuesta_subpregunta_2 or "Respuesta corta a la segunda subpregunta",
                "res_subpregunta_3": article.respuesta_subpregunta_3 or "Respuesta corta a la tercera subpregunta"
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Article.DoesNotExist:
            return Response(
                {"error": "Artículo no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )