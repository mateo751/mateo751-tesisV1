# En la parte superior de backend/sms/views.py, añade estas importaciones

# Importaciones existentes de Django y DRF (mantén las que ya tienes)
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Count
from django.utils import timezone  # ← NUEVA IMPORTACIÓN para timezone
import csv
import io
import os
import tempfile
import traceback

# Importaciones de tus modelos y serializadores (mantén las existentes)
from .models import SMS, Article
from .serializers import (
    SMSSerializer, 
    SMSListSerializer, 
    SMSDetailSerializer,
    SMSCreateUpdateSerializer,
    ArticleSerializer
)

# Importaciones de servicios (mantén las existentes)
from .search_utils import extract_keywords_and_synonyms, generate_search_query
from .science_parse import setup_science_parse, extract_pdf_metadata, analyze_with_chatgpt

# NUEVA IMPORTACIÓN para el análisis semántico
from .semantic_analysis import SemanticResearchAnalyzer  # ← NUEVA IMPORTACIÓN

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
    
    @action(detail=True, methods=['post'], url_path='generate-report')
    def generate_report(self, request, pk=None):
        """
        Generar reporte metodológico automático
        POST /api/sms/{id}/generate-report/
        """
        try:
            sms = self.get_object()
            
            # Obtener artículos y estadísticas
            articles = sms.articles.all()
            
            # Generar estadísticas básicas
            total_articles = articles.count()
            selected_count = articles.filter(estado='SELECTED').count()
            rejected_count = articles.filter(estado='REJECTED').count()
            pending_count = articles.filter(estado='PENDING').count()
            
            # Datos para el template
            template_data = {
                'sms_data': {
                    'titulo_estudio': sms.titulo_estudio,
                    'autores': sms.autores,
                    'pregunta_principal': sms.pregunta_principal,
                    'subpregunta_1': sms.subpregunta_1,
                    'subpregunta_2': sms.subpregunta_2,
                    'subpregunta_3': sms.subpregunta_3,
                    'cadena_busqueda': sms.cadena_busqueda,
                    'anio_inicio': sms.anio_inicio,
                    'anio_final': sms.anio_final,
                    'criterios_inclusion': sms.criterios_inclusion,
                    'criterios_exclusion': sms.criterios_exclusion,
                    'fuentes': sms.fuentes
                },
                'statistics': {
                    'total_articles': total_articles,
                    'selected_count': selected_count,
                    'rejected_count': rejected_count,
                    'pending_count': pending_count,
                    'selection_rate': round((selected_count / total_articles * 100), 2) if total_articles > 0 else 0
                },
                'articles_sample': list(articles.filter(estado='SELECTED')[:5].values(
                    'titulo', 'autores', 'anio_publicacion', 'journal'
                ))
            }
            
            # Generar el reporte usando el servicio
            from .services import ReportGeneratorService
            report_service = ReportGeneratorService()
            generated_report = report_service.generate_methodology_section(template_data)
            
            return Response({
                'success': True,
                'report_content': generated_report,
                'metadata': template_data
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error al generar reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='export-report')
    def export_report(self, request, pk=None):
        """
        Exportar reporte a PDF
        POST /api/sms/{id}/export-report/
        """
        try:
            # Generar el contenido del reporte
            report_response = self.generate_report(request, pk)
            
            if report_response.status_code != 200:
                return report_response
            
            report_content = report_response.data['report_content']
            
            # Por ahora, devolver como texto plano (luego implementaremos PDF)
            response = HttpResponse(report_content, content_type='text/plain')
            response['Content-Disposition'] = f'attachment; filename="methodology_report_{pk}.txt"'
            
            return response
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Error al exportar reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    from .semantic_analysis import SemanticResearchAnalyzer

    @action(detail=True, methods=['get'], url_path='advanced-analysis')
    def get_advanced_semantic_analysis(self, request, pk=None):
        """
        Endpoint para análisis semántico avanzado de enfoques de investigación.
        
        Utiliza machine learning para agrupar automáticamente artículos
        por enfoques similares y genera visualizaciones sofisticadas.
        """
        try:
            sms = self.get_object()
            
            # Obtenemos todos los artículos del SMS
            articles = sms.articles.all()
            
            if not articles.exists():
                return Response({
                    'error': 'No hay artículos disponibles para análisis',
                    'success': False
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convertimos queryset a lista de diccionarios
            articles_data = []
            for article in articles:
                articles_data.append({
                    'id': article.id,
                    'titulo': article.titulo or '',
                    'autores': article.autores or '',
                    'anio_publicacion': article.anio_publicacion,
                    'resumen': article.resumen or '',
                    'respuesta_subpregunta_1': article.respuesta_subpregunta_1 or '',
                    'respuesta_subpregunta_2': article.respuesta_subpregunta_2 or '',
                    'respuesta_subpregunta_3': article.respuesta_subpregunta_3 or '',
                    'metodologia': article.metodologia or '',
                    'palabras_clave': article.palabras_clave or '',
                    'journal': article.journal or '',
                    'doi': article.doi or ''
                })
            
            # Inicializamos el analizador semántico
            analyzer = SemanticResearchAnalyzer()
            
            # Generamos el análisis completo
            analysis_result = analyzer.generar_figura_distribucion_estudios(articles_data)
            
            # Añadimos información del SMS
            analysis_result['sms_info'] = {
                'id': sms.id,
                'titulo': sms.titulo_estudio,
                'total_articles': len(articles_data),
                'analysis_date': timezone.now().isoformat()
            }
            
            return Response(analysis_result, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Error en análisis semántico: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=True, methods=['get'], url_path='prisma-diagram')
    def get_prisma_diagram(self, request, pk=None):
        """
        Endpoint para generar diagrama PRISMA inteligente.
        
        GET /api/sms/{id}/prisma-diagram/
        """
        try:
            sms = self.get_object()
            articles = sms.articles.all()
            
            if not articles.exists():
                return Response({
                    'error': 'No hay artículos disponibles para generar diagrama PRISMA',
                    'success': False
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Convertimos a formato necesario
            articles_data = []
            for article in articles:
                articles_data.append({
                    'id': article.id,
                    'titulo': article.titulo or '',
                    'resumen': article.resumen or '',
                    'estado': article.estado or 'PENDING',
                    'respuesta_subpregunta_1': article.respuesta_subpregunta_1 or '',
                    'respuesta_subpregunta_2': article.respuesta_subpregunta_2 or '',
                    'respuesta_subpregunta_3': article.respuesta_subpregunta_3 or '',
                })
            
            # Información del SMS
            sms_info = {
                'titulo': sms.titulo_estudio,
                'criterios_inclusion': sms.criterios_inclusion,
                'criterios_exclusion': sms.criterios_exclusion,
                'fecha_creacion': sms.fecha_creacion
            }
            
            # Generamos diagrama PRISMA
            analyzer = SemanticResearchAnalyzer()
            result = analyzer.generar_diagrama_prisma(articles_data, sms_info)
            
            if result['success']:
                result['sms_info'] = {
                    'id': sms.id,
                    'titulo': sms.titulo_estudio,
                    'total_articles': len(articles_data)
                }
            
            return Response(result, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Error generando diagrama PRISMA: {str(e)}',
                'success': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        """
        article = self.get_object()
        
        if 'estado' not in request.data:
            return Response(
                {"detail": "El campo 'estado' es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_states = ['SELECTED', 'REJECTED', 'PENDING']
        estado = request.data['estado'].upper()
        
        if estado not in valid_states:
            return Response(
                {"detail": f"El estado debe ser uno de: {', '.join(valid_states)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article.estado = estado
        article.save()
        
        return Response(ArticleSerializer(article).data)
    
    @action(detail=True, methods=['put', 'patch'], url_path='edit')
    
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
            
            # Verificar si ya existen artículos para este SMS
            existing_articles = sms.articles.count()
            force_reanalysis = request.data.get('force_reanalysis', False)
            
            if existing_articles > 0 and not force_reanalysis:
                return Response({
                    'error': 'Ya existen artículos analizados para este SMS. Use force_reanalysis=true para re-analizar.',
                    'existing_count': existing_articles,
                    'requires_confirmation': True
                }, status=status.HTTP_409_CONFLICT)
            
            # Si es re-análisis forzado, eliminar artículos existentes
            if force_reanalysis and existing_articles > 0:
                sms.articles.all().delete()
                print(f"Eliminados {existing_articles} artículos existentes para re-análisis")
            
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
                
            print(f"Subpreguntas a analizar: {subquestions}")
            
            # Obtener los archivos del request
            files = request.FILES.getlist('files')
            if not files:
                return Response({"error": "No se han proporcionado archivos"}, 
                            status=status.HTTP_400_BAD_REQUEST)
            
            results = []
            processed_titles = set()  # Para evitar duplicados por título
            
            for file in files:
                # Guardar el archivo temporalmente
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp:
                    for chunk in file.chunks():
                        temp.write(chunk)
                    temp_path = temp.name
                
                try:
                    # Extraer metadatos
                    metadata = extract_pdf_metadata(temp_path)
                    
                    # Verificar si ya existe un artículo con el mismo título
                    title = metadata['title']
                    if title in processed_titles:
                        print(f"Saltando artículo duplicado con título: {title}")
                        continue
                    
                    # Verificar en la base de datos si ya existe
                    existing_article = sms.articles.filter(titulo__iexact=title).first()
                    if existing_article and not force_reanalysis:
                        print(f"Artículo ya existe en BD: {title}")
                        continue
                    
                    processed_titles.add(title)
                    
                    # Analizar con ChatGPT para responder subpreguntas
                    analysis_results = analyze_with_chatgpt(metadata, subquestions)
                    
                    # Crear o actualizar el artículo en la base de datos
                    article_data = {
                        'sms': sms,
                        'titulo': metadata['title'],
                        'autores': metadata['authors'],
                        'anio_publicacion': metadata['year'] or 2023,
                        'doi': metadata['doi'] if metadata['doi'] and metadata['doi'] != 'No detectado' else '',
                        'resumen': metadata['abstract'],
                        # CORREGIR: Asegurar que journal no sea None o vacío
                        'journal': metadata.get('journal', 'Sin revista') or 'Sin revista',
                        'enfoque': request.data.get('enfoque', 'No especificado'),
                        'tipo_registro': request.data.get('tipo_registro', 'No especificado'),
                        'tipo_tecnica': request.data.get('tipo_tecnica', 'No especificado'),
                        'notas': analysis_results.get('analysis', ''),
                        'estado': 'PENDING',
                        # CORREGIR: Asegurar que las respuestas no sean None o vacías
                        'respuesta_subpregunta_1': analysis_results.get('subpregunta_1', '') or 'Análisis no disponible',
                        'respuesta_subpregunta_2': analysis_results.get('subpregunta_2', '') or 'Análisis no disponible',
                        'respuesta_subpregunta_3': analysis_results.get('subpregunta_3', '') or 'Análisis no disponible'
                    }
                    
                    # AÑADIR: Debug para verificar los datos antes de guardar
                    print(f"DEBUG - Datos del artículo antes de guardar:")
                    print(f"  - Título: {article_data['titulo']}")
                    print(f"  - Journal: '{article_data['journal']}'")
                    print(f"  - Respuesta 1: '{article_data['respuesta_subpregunta_1']}'")
                    print(f"  - Respuesta 2: '{article_data['respuesta_subpregunta_2']}'")
                    print(f"  - Respuesta 3: '{article_data['respuesta_subpregunta_3']}'")
                    
                    # Crear el artículo
                    article = Article.objects.create(**article_data)
                    
                    # AÑADIR: Verificar que se guardó correctamente
                    print(f"DEBUG - Artículo guardado con ID: {article.id}")
                    print(f"  - Journal guardado: '{article.journal}'")
                    print(f"  - Respuesta 1 guardada: '{article.respuesta_subpregunta_1}'")
                    
                    # Preparar el resultado
                    result = {
                        'id': article.id,
                        'title': metadata['title'],
                        'authors': metadata['authors'],
                        'year': metadata['year'],
                        'journal': article.journal,  # Usar el valor guardado
                        'doi': metadata['doi'],
                        'res_subpregunta_1': article.respuesta_subpregunta_1,  # Usar valores guardados
                        'res_subpregunta_2': article.respuesta_subpregunta_2,
                        'res_subpregunta_3': article.respuesta_subpregunta_3,
                        'analysis': analysis_results.get('analysis', 'Análisis pendiente')
                    }
                    
                    results.append(result)

                    
                finally:
                    # Limpiar el archivo temporal
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
            
            return Response({
                'results': results,
                'message': f"Se analizaron {len(results)} archivos correctamente",
                'total_processed': len(results),
                'total_articles_in_sms': sms.articles.count()
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Error al analizar los PDFs: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @action(detail=True, methods=['put', 'patch'], url_path='edit')
    def edit_article(self, request, sms_pk=None, pk=None):
        """
        Endpoint para editar un artículo específico
        PUT/PATCH /api/sms/{sms_id}/articles/{article_id}/edit/
        
        Permite editar campos como:
        - titulo, autores, anio_publicacion
        - journal, doi, resumen
        - respuesta_subpregunta_1, respuesta_subpregunta_2, respuesta_subpregunta_3
        - estado, notas
        """
        try:
            article = self.get_object()
            
            # Campos editables
            editable_fields = [
                'titulo', 'autores', 'anio_publicacion', 'journal', 'doi', 
                'resumen', 'palabras_clave', 'metodologia', 'resultados', 
                'conclusiones', 'respuesta_subpregunta_1', 'respuesta_subpregunta_2', 
                'respuesta_subpregunta_3', 'estado', 'notas'
            ]
            
            # Validar que solo se envíen campos editables
            invalid_fields = set(request.data.keys()) - set(editable_fields)
            if invalid_fields:
                return Response(
                    {"detail": f"Campos no editables: {', '.join(invalid_fields)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validaciones específicas
            if 'anio_publicacion' in request.data:
                anio = request.data['anio_publicacion']
                if anio and (anio < 1900 or anio > 2030):
                    return Response(
                        {"detail": "El año de publicación debe estar entre 1900 y 2030"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            if 'estado' in request.data:
                valid_states = ['SELECTED', 'REJECTED', 'PENDING']
                if request.data['estado'] not in valid_states:
                    return Response(
                        {"detail": f"El estado debe ser uno de: {', '.join(valid_states)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Actualizar solo los campos proporcionados
            for field, value in request.data.items():
                if field in editable_fields:
                    # Limpiar valores vacíos
                    if value == '' or value == 'None' or value == 'null':
                        if field == 'journal':
                            value = 'Sin revista'
                        elif field.startswith('respuesta_subpregunta_'):
                            value = 'Sin respuesta disponible'
                        else:
                            value = None if field in ['anio_publicacion'] else ''
                    
                    setattr(article, field, value)
            
            # Guardar cambios
            article.save()
            
            # Log de la edición
            print(f"Artículo {article.id} editado por usuario {request.user.username}")
            print(f"Campos modificados: {list(request.data.keys())}")
            
            # Devolver el artículo actualizado
            serializer = ArticleSerializer(article)
            return Response({
                "message": "Artículo actualizado exitosamente",
                "article": serializer.data
            })
            
        except Exception as e:
            return Response(
                {"detail": f"Error al actualizar el artículo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @action(detail=True, methods=['get'], url_path='details')
    def get_article_details(self, request, sms_pk=None, pk=None):
        """
        Obtiene los detalles completos de un artículo para edición
        GET /api/sms/{sms_id}/articles/{article_id}/details/
        """
        try:
            article = self.get_object()
            sms = article.sms
            
            # Preparar datos completos para el modal de edición
            response_data = {
                "id": article.id,
                "titulo": article.titulo or "",
                "autores": article.autores or "",
                "anio_publicacion": article.anio_publicacion,
                "journal": article.journal or "Sin revista",
                "doi": article.doi or "",
                "resumen": article.resumen or "",
                "palabras_clave": article.palabras_clave or "",
                "metodologia": article.metodologia or "",
                "resultados": article.resultados or "",
                "conclusiones": article.conclusiones or "",
                "respuesta_subpregunta_1": article.respuesta_subpregunta_1 or "",
                "respuesta_subpregunta_2": article.respuesta_subpregunta_2 or "",
                "respuesta_subpregunta_3": article.respuesta_subpregunta_3 or "",
                "estado": article.estado,
                "notas": article.notas or "",
                "fecha_creacion": article.fecha_creacion,
                "fecha_actualizacion": article.fecha_actualizacion,
                # Información del SMS para contexto
                "sms_info": {
                    "id": sms.id,
                    "titulo_estudio": sms.titulo_estudio,
                    "pregunta_principal": sms.pregunta_principal,
                    "subpregunta_1": sms.subpregunta_1,
                    "subpregunta_2": sms.subpregunta_2,
                    "subpregunta_3": sms.subpregunta_3
                }
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

