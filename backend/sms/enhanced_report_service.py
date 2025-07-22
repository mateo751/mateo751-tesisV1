# backend/sms/enhanced_report_service.py - Versión con Debug Mejorado
import base64
import io
import re
import os
from datetime import datetime
from collections import Counter
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from django.conf import settings

# Importaciones condicionales para OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    print("📦 OpenAI library imported successfully")
except ImportError as e:
    OPENAI_AVAILABLE = False
    print(f"⚠️ OpenAI not installed: {e}")

from .semantic_analysis import SemanticResearchAnalyzer

class EnhancedReportGeneratorService:
    """
    Servicio mejorado para generar reportes metodológicos completos
    integrando las visualizaciones existentes del sistema y análisis con IA.
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
        # Configurar OpenAI con debugging mejorado
        self.client = None
        self.openai_status = self._setup_openai_client()
        
    def _setup_openai_client(self):
        """Configurar cliente OpenAI con debugging detallado"""
        print("🔍 Iniciando configuración de OpenAI...")
        
        if not OPENAI_AVAILABLE:
            print("❌ OpenAI library no disponible")
            return "library_not_available"
        
        # Método 1: Desde settings de Django
        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        if api_key:
            print(f"✅ Clave encontrada en Django settings (longitud: {len(api_key)})")
        else:
            print("⚠️ No se encontró clave en Django settings")
            
            # Método 2: Directamente desde variables de entorno
            api_key = os.environ.get('OPENAI_API_KEY', '')
            if api_key:
                print(f"✅ Clave encontrada en variables de entorno (longitud: {len(api_key)})")
            else:
                print("❌ No se encontró clave en variables de entorno")
        
        # Método 3: Desde archivo .env (manual)
        if not api_key:
            try:
                from dotenv import load_dotenv
                load_dotenv()
                api_key = os.environ.get('OPENAI_API_KEY', '')
                if api_key:
                    print(f"✅ Clave encontrada después de cargar .env (longitud: {len(api_key)})")
                else:
                    print("❌ No se encontró clave después de cargar .env")
            except ImportError:
                print("⚠️ python-dotenv no instalado")
        
        if not api_key:
            print("❌ No se encontró clave API de OpenAI en ningún método")
            return "no_api_key"
        
        # Validar formato de la clave
        if not api_key.startswith('sk-'):
            print(f"⚠️ Formato de clave inválido. Debe comenzar con 'sk-', actual: {api_key[:10]}...")
            return "invalid_key_format"
        
        if len(api_key) < 40:
            print(f"⚠️ Clave parece incompleta. Longitud: {len(api_key)}, esperada: ~51")
            return "key_too_short"
        
        # Intentar crear el cliente
        try:
            self.client = OpenAI(api_key=api_key)
            print("✅ Cliente OpenAI creado exitosamente")
            
            # Test básico de conectividad
            try:
                test_response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "Test"}],
                    max_tokens=5
                )
                print("✅ Test de conectividad OpenAI exitoso")
                return "configured_and_tested"
            except Exception as test_error:
                print(f"⚠️ Cliente creado pero test falló: {test_error}")
                return "client_created_but_test_failed"
                
        except Exception as e:
            print(f"❌ Error creando cliente OpenAI: {e}")
            self.client = None
            return f"client_creation_failed: {str(e)}"
    
    def _setup_custom_styles(self):
        """Configurar estilos personalizados para el documento"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#2563eb'),
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.HexColor('#1f2937')
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=12
        ))
        
        # NUEVO ESTILO para encabezados de tabla
        self.styles.add(ParagraphStyle(
            name='CustomHeading5',
            parent=self.styles['Normal'],
            fontSize=10,
            fontName='Helvetica-Bold',
            textColor=colors.black,
            alignment=TA_LEFT,
            spaceAfter=0,
            spaceBefore=0
        ))
    
    def generate_comprehensive_report(self, sms_data, articles_data, visualizations_data=None):
        """
        Genera un reporte metodológico completo incluyendo visualizaciones
        
        Args:
            sms_data: Datos del SMS
            articles_data: Lista de artículos procesados
            visualizations_data: Datos de las visualizaciones (opcional)
        """
        print(f"📄 Generando reporte completo. Estado OpenAI: {self.openai_status}")
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=inch, bottomMargin=inch)
        
        story = []
        
        # 1. Portada y Abstract
        story.extend(self._generate_title_and_abstract(sms_data))
        
        # 2. Introducción con citas
        story.extend(self._generate_introduction(sms_data, articles_data))
        
        # 3. Metodología detallada (A. Planning + c)
        story.extend(self._generate_detailed_methodology(sms_data, articles_data, visualizations_data))
        
        # 4. NUEVA SECCIÓN: C. Results mejorada con IA
        story.extend(self._generate_comprehensive_results_section(sms_data, articles_data, visualizations_data))

        # 5. Tabla de extracción de información (NUEVA POSICIÓN)
        story.extend(self._generate_information_extraction_table(articles_data))
        
        # 6. NUEVA SECCIÓN: Analysis and discussions (AGREGAR AQUÍ)
        story.extend(self._generate_analysis_and_discussions_section(sms_data, articles_data, visualizations_data))

        # 6. Visualizaciones integradas
        if visualizations_data:
            story.extend(self._integrate_visualizations(visualizations_data, sms_data))
        
        # 7. Conclusiones
        story.extend(self._generate_conclusions(sms_data, articles_data))
        
        # 8. Referencias bibliográficas
        story.extend(self._generate_references(articles_data))

        doc.build(story)
        buffer.seek(0)
        return buffer.read()
    
    def _generate_ai_text(self, prompt, max_tokens=500):
        """Generar texto usando OpenAI GPT con fallbacks mejorados"""
        print(f"🤖 Generando texto con IA. Cliente disponible: {self.client is not None}")
        
        try:
            if not self.client:
                print(f"⚠️ Cliente no disponible. Status: {self.openai_status}")
                return self._generate_academic_fallback_text(prompt)
            
            print(f"📡 Enviando prompt a OpenAI (longitud: {len(prompt)})")
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert academic writer specializing in systematic reviews."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            
            generated_text = response.choices[0].message.content.strip()
            print(f"✅ Texto generado exitosamente (longitud: {len(generated_text)})")
            return generated_text
            
        except Exception as e:
            print(f"❌ Error en generación con IA: {e}")
            return self._generate_academic_fallback_text(prompt)
    
    def _generate_academic_fallback_text(self, prompt):
        """Generar texto académico profesional como fallback"""
        prompt_lower = prompt.lower()
        
        if "abstract" in prompt_lower:
            return 
        
        elif "introduction" in prompt_lower:
            return 
        
        elif "conclusion" in prompt_lower:
            return 
        
        elif "rsq" in prompt_lower or "research question" in prompt_lower:
            return 
    
    def _generate_title_and_abstract(self, sms_data):
        """Generar título y abstract del documento"""
        story = []
        
        # Título principal
        story.append(Paragraph(
            f"{sms_data['titulo_estudio']}: A Systematic Mapping Study", 
            self.styles['CustomTitle']
        ))
        story.append(Spacer(1, 20))
        
        # Autores
        story.append(Paragraph(f"Authors: {sms_data['autores']}", self.styles['Normal']))
        story.append(Spacer(1, 10))
        
        # Abstract generado con IA
        abstract = self._generate_ai_text(
            f"Escribe un abstract para una revisión sistemática sobre {sms_data['titulo_estudio']} en ingles. "
            f"Incluya los objetivos de la investigación, la metodología y las principales conclusiones en estilo académico."
            f"solo dame el texto sin titulo ni listas "
        )
        
        story.append(Paragraph("Abstract", self.styles['CustomHeading2']))
        story.append(Paragraph(abstract, self.styles['CustomNormal']))
        
        # Keywords
        keywords = self._extract_keywords_from_title(sms_data['titulo_estudio'])
        story.append(Paragraph(f"Keywords: {keywords}", self.styles['CustomNormal']))
        story.append(Spacer(1, 30))
        
        return story
    
    def _generate_introduction(self, sms_data, articles_data):
        """Generar una introducción extensa, coherente y profunda, sin gerundios, usando todos los datos del sistema."""
        story = []
        story.append(Paragraph("INTRODUCCIÓN", self.styles['CustomHeading2']))

        # Estadísticas reales del sistema
        total_articles = len(articles_data)
        years = [a.get('anio_publicacion', 'Desconocido') for a in articles_data]
        year_stats = {y: years.count(y) for y in set(years)}
        top_years = sorted(year_stats.items(), key=lambda x: x[1], reverse=True)[:3]
        top_authors = {}
        for a in articles_data:
            for author in a.get('autores', '').split(','):
                author = author.strip()
                if author:
                    top_authors[author] = top_authors.get(author, 0) + 1
        top_authors_list = sorted(top_authors.items(), key=lambda x: x[1], reverse=True)[:3]
        topics = []
        for a in articles_data:
            if a.get('palabras_clave'):
                topics.extend([t.strip() for t in a['palabras_clave'].split(',')])
        topic_stats = {}
        for t in topics:
            if t:
                topic_stats[t] = topic_stats.get(t, 0) + 1
        top_topics = sorted(topic_stats.items(), key=lambda x: x[1], reverse=True)[:5]

        stats_text = (
            f"En el análisis de la literatura, se identificaron {total_articles} artículos relevantes. "
            f"Los años con mayor producción científica fueron: {', '.join([f'{y} ({c} artículos)' for y, c in top_years])}. "
            f"Entre los autores más prolíficos se encuentran: {', '.join([f'{a} ({c} artículos)' for a, c in top_authors_list])}. "
            f"Los temas más frecuentes son: {', '.join([f'{t} ({c} menciones)' for t, c in top_topics])}."
        )

        # 1. Contexto y motivación
        context_prompt = (
            f"Redacta la primera parte de una introducción académica extensa (al menos 700 palabras) para un mapeo sistemático titulado '{sms_data['titulo_estudio']}'. "
            f"Describe el contexto general del área, su evolución, importancia y motivación para investigar este tema. "
            f"Evita el uso de gerundios. Escribe en español, con coherencia y profundidad. Utiliza datos reales cuando sea posible. "
            f"{stats_text}"
            f"No incluyas ningún título, encabezado ni la palabra 'Introducción' al inicio. Solo el texto corrido"
        )
        context_text = self._generate_ai_text(context_prompt, max_tokens=1000)
        story.append(Paragraph(context_text, self.styles['CustomNormal']))

        # 2. Estado del arte y tendencias
        state_of_art_prompt = (
            f"Redacta una sección de introducción (al menos 700 palabras) que describa el estado del arte sobre '{sms_data['titulo_estudio']}', "
            f"incluyendo tendencias, vacíos y temas recurrentes. Utiliza los siguientes datos: {stats_text}. "
            f"Evita el uso de gerundios. Escribe en español, con coherencia y profundidad."
            f"solo dame el texto sin titulo ni listas "
        )
        state_of_art_text = self._generate_ai_text(state_of_art_prompt, max_tokens=1000)
        story.append(Paragraph(state_of_art_text, self.styles['CustomNormal']))

        # 3. Vacíos y justificación
        gaps_prompt = (
            f"Redacta una sección (al menos 500 palabras) que identifique vacíos en la literatura y justifique la necesidad de realizar el mapeo sistemático sobre '{sms_data['titulo_estudio']}'. "
            f"Evita el uso de gerundios. Escribe en español, con coherencia y profundidad. Utiliza datos reales cuando sea posible."
            f"solo dame el texto sin titulo ni listas "
        )
        gaps_text = self._generate_ai_text(gaps_prompt, max_tokens=1000)
        story.append(Paragraph(gaps_text, self.styles['CustomNormal']))

        # 4. Objetivos y relevancia del SMS
        objectives_prompt = (
            f"Redacta una sección (al menos 500 palabras) que exponga los objetivos del estudio, la relevancia del mapeo sistemático y cómo contribuye al área de '{sms_data['titulo_estudio']}'. "
            f"Evita el uso de gerundios. Escribe en español, con coherencia y profundidad. Utiliza datos reales cuando sea posible."
            f"solo dame el texto sin titulo ni listas "
        )
        objectives_text = self._generate_ai_text(objectives_prompt, max_tokens=1000)
        story.append(Paragraph(objectives_text, self.styles['CustomNormal']))

        # 5. Cierre de la introducción
        closing_prompt = (
            f"Redacta el cierre de la introducción (al menos 500 palabras), resumiendo la importancia del estudio y anticipando la estructura del documento. "
            f"Evita el uso de gerundios. Escribe en español, con coherencia y profundidad."
            f"solo dame el texto sin titulo ni listas "
        )
        closing_text = self._generate_ai_text(closing_prompt, max_tokens=1000)
        story.append(Paragraph(closing_text, self.styles['CustomNormal']))

        return story

    
    def _generate_detailed_methodology(self, sms_data, articles_data, visualizations_data=None):
        """Generar sección de metodología detallada"""
        story = []
        
        story.append(Paragraph("1. MATERIALES Y MÉTODOS", self.styles['CustomHeading2']))
        
        # Introducción a la metodología
        story.append(Paragraph(
            f"""
            Este mapeo sistematico (SMS) se basa en las directrices 
            propuestas en (Kitchenham et al, 2010) & (Petersen et al, 2015), 
            cuyo principal objetivo es analizar el estado actual de la 
            investigación relacionada con las aplicaciones informáticas 
            para {sms_data['titulo_estudio']}. Esta revisión consta de dos 
            etapas: planificación y ejecución. 
            La primera aborda la definición de las preguntas de investigación,
            especificando la intervención de interés, 
            el proceso de búsqueda y la definición de los criterios de selección
            de artículos. La segunda etapa implementa 
            el proceso de selección de las investigaciones relevantes para el objeto
            de estudio, mediante 
            la aplicación de los criterios de selección y la extracción de datos para
            obtener los resultados de esta revisión sistemática.
            """,
            self.styles['CustomNormal']
        ))
        
        # Subsección A: Planificación
        story.append(Paragraph("A. Planning", self.styles['Heading3']))
        
        story.append(Paragraph(
            f"""
            La intención de esta investigación se regirá por la pregunta 
            principal de investigación (PRQ): 
            {sms_data.get('pregunta_principal', 'Not defined')}""",
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            La PRQ busca localizar documentos relevantes sobre el tema 
            propuesto, para lograr este objetivo se divide en tres subpreguntas 
            de investigación (RSQ). """,
            self.styles['CustomNormal']
        ))
        
        # Sub-preguntas
        for i, key in enumerate(['subpregunta_1', 'subpregunta_2', 'subpregunta_3'], 1):
            if sms_data.get(key):
                story.append(Paragraph(
                    f"-RSQ_{i}: {sms_data[key]}", 
                    self.styles['CustomNormal']
                ))
        
        story.append(Paragraph(
            f"""
            Para llevar a cabo la búsqueda de publicaciones científicas que contribuyan 
            al análisis del objeto de estudio, se consideran tres bases
            de datos de citas: Scopus, Web of Science (WoS) y PubMed. Las dos 
            primeras son bases de datos bibliográficas de resúmenes y citas de 
            artículos de revistas científicas. La tercera es un motor de búsqueda de 
            referencias bibliográficas. Todas estas bases de 
            datos se complementan entre sí, ya que incluyen documentos de 
            diversas fuentes, incluyendo artículos de revistas y ponencias de 
            congresos.""",
            self.styles['CustomNormal']
        ))

        # Función para convertir números a números romanos
        def to_roman(num):
            values = [5, 4, 1]
            symbols = ["V", "IV", "I"]
            roman = ""
            for i in range(len(values)):
                count = num // values[i]
                roman += symbols[i] * count
                num -= values[i] * count
            return roman

        keywords = self._extract_keywords_from_title(sms_data['titulo_estudio'])
        keywords_list = keywords.split(', ')

        # Generar enumeración con números romanos
        keywords_enum = ', '.join([f"{to_roman(i+1)}) {kw}" for i, kw in enumerate(keywords_list)])

        story.append(Paragraph(
            f"""
            El proceso de revisión consiste en la elección de palabras clave, las 
            cuales surgen de la pregunta de investigación: {keywords_enum}.""",
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            Las palabras clave permiten identificar sinónimos y términos 
            relacionados con el objeto de estudio, que al combinarse forman 
            la cadena de búsqueda, cuyo propósito es identificar artículos 
            relevantes para la investigación. El período de búsqueda de 
            publicaciones relevantes se realizó entre {sms_data.get('anio_inicio', 'N/A')} 
            y {sms_data.get('anio_final', 'N/A')}, debido a la 
            velocidad con la que se producen los cambios tecnológicos.""",
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            Una vez encontrados los documentos, se aplicaron criterios de inclusión y 
            exclusión para la preselección y selección de los artículos relevantes. Los 
            principales criterios de una revisión sistemática son los siguientes:""",
            self.styles['CustomNormal']
        ))
        
        # Criterios de inclusión/exclusión
        story.append(Paragraph("Criterios de inclusión:", self.styles['Heading5']))
        inclusion = sms_data.get('criterios_inclusion')
        if inclusion:
            # Si es string, conviértelo a lista
            if isinstance(inclusion, str):
                criterios_inclusion = [c.strip() for c in inclusion.split('\n') if c.strip()]
            else:
                criterios_inclusion = inclusion
            story.append(ListFlowable(
                [ListItem(Paragraph(criterio, self.styles['CustomNormal'])) for criterio in criterios_inclusion],
                bulletType='bullet'
            ))

        story.append(Paragraph("Criterios de exclusión:", self.styles['Heading5']))
        exclusion = sms_data.get('criterios_exclusion')
        if exclusion:
            if isinstance(exclusion, str):
                criterios_exclusion = [c.strip() for c in exclusion.split('\n') if c.strip()]
            else:
                criterios_exclusion = exclusion
            story.append(ListFlowable(
                [ListItem(Paragraph(criterio, self.styles['CustomNormal'])) for criterio in criterios_exclusion],
                bulletType='bullet'
            ))
        
        # Subsección B: Ejecución
        story.append(Paragraph("B. Execute", self.styles['Heading3']))
        
        story.append(Paragraph(
            f"""
            El proceso de ejecución comienza con la aplicación de la cadena de 
            búsqueda inicial en bases de datos indexadas con el fin de refinar la cadena 
            y encontrar los artículos relevantes al objeto de estudio.""",
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            Durante la primera iteración de búsqueda en las bases de datos bibliográficas 
            seleccionadas, el sistema obtuvo automáticamente el número de publicaciones 
            encontradas en cada fuente, de acuerdo con los criterios y el periodo 
            definidos por el usuario. Esta información inicial proporciona una visión 
            general del volumen de literatura disponible y constituye el punto de partida 
            para el proceso de selección y análisis de los artículos relevantes.""",
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            Después de una serie de pruebas y revisiones, se identificaron términos 
            relacionados y sus sinónimos, de tal manera que: {keywords_enum}.""",
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            Por lo tanto, el modelo estándar de cadenas de búsqueda se expresa 
            de la siguiente manera: {sms_data.get('cadena_busqueda', 'Not specified')}""",
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            Una vez aplicada la cadena de búsqueda refinada, 
            el sistema identificó automáticamente los estudios 
            primarios relevantes en cada base de datos seleccionada. 
            Para maximizar la exhaustividad de la revisión, también 
            se consideraron las referencias de los estudios encontrados, 
            empleando la técnica de búsqueda en "bola de nieve" 
            (Wohlin, 2014), con el objetivo de localizar artículos 
            adicionales pertinentes al objeto de estudio.
            """,
            self.styles['CustomNormal']
        ))
        
        # Obtener datos PRISMA
        analyzer = SemanticResearchAnalyzer()
        real_data = analyzer._extract_real_prisma_data(articles_data, sms_data)
        
        story.append(Paragraph(
            f"""
            Tal como se ilustra en la Figura 1, el sistema documenta detalladamente 
            el proceso de selección de artículos. Inicialmente, se identificaron 
            {real_data['initial_search']} estudios potencialmente relevantes a través 
            de las bases de datos seleccionadas, y se identificaron {real_data['additional_sources']}  
            estudios adicionales a través de otras fuentes.  Después de eliminar {real_data['duplicates_removed']} 
            artículo duplicado, quedaron {real_data['after_duplicates']} artículos para la revisión de título 
            y resumen. De estos, {real_data['title_abstract_excluded']} fueron 
            excluidos basándose en los criterios de inclusión y exclusión. 
            Los {real_data['full_text_assessed']} artículos restantes fueron evaluados a texto completo, 
            de los cuales {real_data['full_text_excluded']} fueron excluidos. Finalmente, {real_data['final_included']} estudios cumplieron 
            con todos los criterios y fueron incluidos en la síntesis cuantitativa, 
            representando una tasa de selección del {real_data['selection_rate']}%.
            """,
            self.styles['CustomNormal']
        ))
        
        story.append(Paragraph(
            f"""
            Finalmente, se obtuvieron {real_data['final_included']} artículos para ser analizados en detalle. 
            Una primera aproximación de los estudios relevantes es su pre-selección; 
            primero, se descartaron los artículos cuyo idioma era diferente del inglés, 
            y luego se analizaron el título, el resumen y las palabras clave de cada artículo
            para verificar si están relacionados con el objeto de estudio. Después de esta 
            evaluación, se eliminaron {real_data['full_text_excluded']} artículos y se obtuvieron {real_data['final_included']} artículos para su 
            revisión completa. Para la selección de artículos, se analizó a fondo el texto 
            completo para determinar si el artículo estaba estrechamente relacionado con 
            el objeto de estudio, o si se desarrolló una aplicación que pudiera verificar 
            la construcción de una herramienta como requisito mínimo para la selección. 
            Para evitar la subjetividad, las actividades de revisión de artículos y 
            extracción de datos se realizaron de manera independiente. 
            Si un artículo no fue incluido, se mencionó el motivo de su exclusión. 
            Con este análisis, se eliminaron {real_data['full_text_excluded']} 
            artículos, resultando en {real_data['final_included']} estudios 
            utilizados para la extracción de datos.""",
            self.styles['CustomNormal']
        ))
        
        if visualizations_data and 'prisma_diagram' in visualizations_data:
            
            # Añadir imagen del diagrama PRISMA
            prisma_image = self._base64_to_reportlab_image(
                visualizations_data['prisma_diagram']['image_base64']
            )
            if prisma_image:
                story.append(prisma_image)
                story.append(Spacer(1, 10))
                story.append(Paragraph(
                    "Figura 1. Diagrama de flujo que muestra una visión general del proceso "
                    "de investigación para estudios relevantes.", 
                    self.styles['CustomNormal']
                ))

        return story
    
    def _generate_comprehensive_results_section(self, sms_data, articles_data, visualizations_data=None):
        """
        Genera la sección C. Results con estructura académica completa usando ChatGPT.
        """
        story = []
        print("📊 Generando sección C. Results con IA...")
        
        # Título de la sección
        story.append(Paragraph("C. Results", self.styles['Heading3']))
        
        # Obtener estadísticas reales para el análisis
        stats = self._extract_detailed_statistics(articles_data)
        print(f"📈 Estadísticas extraídas: {stats['selected_count']} seleccionados de {stats['total_articles']}")
        
        # Paso 1: Párrafo Introductorio
        intro_paragraph = self._generate_results_introduction(sms_data, stats, visualizations_data)
        story.append(Paragraph(intro_paragraph, self.styles['CustomNormal']))
        story.append(Spacer(1, 15))
        
        # Paso 2: Respuestas Sistemáticas a las Preguntas de Investigación
        for i in range(1, 4):
            subquestion_key = f'subpregunta_{i}'
            if sms_data.get(subquestion_key):
                print(f"🔍 Generando análisis para RSQ_{i}")
                rsq_section = self._generate_rsq_analysis(
                    question_number=i,
                    question_text=sms_data[subquestion_key],
                    articles_data=articles_data,
                    statistics=stats,
                    visualizations_data=visualizations_data
                )
                story.extend(rsq_section)
        
        return story

    def _extract_detailed_statistics(self, articles_data):
        """Extrae estadísticas detalladas de los artículos para el análisis."""
        
        # Estadísticas básicas
        total_articles = len(articles_data)
        selected_articles = [a for a in articles_data if a.get('estado') == 'SELECTED']
        selected_count = len(selected_articles)
        
        # Análisis por año
        years = [a.get('anio_publicacion') for a in selected_articles if a.get('anio_publicacion')]
        year_distribution = Counter(years)
        
        # Análisis por revista/journal
        journals = [a.get('journal', 'Sin revista') for a in selected_articles 
                    if a.get('journal') and a.get('journal') != 'Sin revista']
        journal_distribution = Counter(journals)
        
        # Análisis de respuestas a subpreguntas
        subq1_responses = [a.get('respuesta_subpregunta_1', '') for a in selected_articles 
                           if a.get('respuesta_subpregunta_1') and a.get('respuesta_subpregunta_1') != 'Sin respuesta disponible']
        subq2_responses = [a.get('respuesta_subpregunta_2', '') for a in selected_articles 
                           if a.get('respuesta_subpregunta_2') and a.get('respuesta_subpregunta_2') != 'Sin respuesta disponible']
        subq3_responses = [a.get('respuesta_subpregunta_3', '') for a in selected_articles 
                           if a.get('respuesta_subpregunta_3') and a.get('respuesta_subpregunta_3') != 'Sin respuesta disponible']
        
        print(f"📋 Respuestas encontradas: RSQ1={len(subq1_responses)}, RSQ2={len(subq2_responses)}, RSQ3={len(subq3_responses)}")
        
        # Análisis por enfoque (si existe)
        enfoques = [a.get('enfoque', 'No especificado') for a in selected_articles 
                    if a.get('enfoque')]
        enfoque_distribution = Counter(enfoques)
        
        return {
            'total_articles': total_articles,
            'selected_count': selected_count,
            'selection_rate': round((selected_count / total_articles) * 100, 1) if total_articles > 0 else 0,
            'year_distribution': dict(year_distribution.most_common(10)),
            'journal_distribution': dict(journal_distribution.most_common(10)),
            'enfoque_distribution': dict(enfoque_distribution.most_common()),
            'year_range': f"{min(years) if years else 'N/A'} - {max(years) if years else 'N/A'}",
            'most_productive_year': year_distribution.most_common(1)[0] if year_distribution else ('N/A', 0),
            'subq1_responses': subq1_responses,
            'subq2_responses': subq2_responses,
            'subq3_responses': subq3_responses,
            'avg_responses_per_question': round(
                (len(subq1_responses) + len(subq2_responses) + len(subq3_responses)) / 3, 1
            )
        }

    def _generate_results_introduction(self, sms_data, stats, visualizations_data):
        """Genera párrafo introductorio para la sección de resultados usando ChatGPT."""
        prompt = f"""
        Escribe un párrafo introductorio académico profesional para la sección de resultados 
        de un mapeo sistemático sobre "{sms_data['titulo_estudio']}".
        
        Información clave para incluir:
        - Se analizaron {stats['selected_count']} estudios de un total de {stats['total_articles']} identificados
        - Tasa de selección del {stats['selection_rate']}%
        - Periodo de publicación: {stats['year_range']}
        - Se responderán las siguientes preguntas de investigación:
          1. {sms_data.get('subpregunta_1', 'Pregunta 1 no definida')}
          2. {sms_data.get('subpregunta_2', 'Pregunta 2 no definida')}
          3. {sms_data.get('subpregunta_3', 'Pregunta 3 no definida')}
        
        El párrafo debe:
        - Establecer el contexto de los hallazgos
        - Mencionar las figuras y tablas que se presentarán (Figura 2, Figura 3, Tabla I)
        - Explicar que se utilizó análisis semántico y clustering
        - Mantener un tono académico formal
        - Ser de aproximadamente 100-120 palabras
        Evita el uso de gerundios. Escribe en español, con coherencia y profundidad.
        solo dame el texto sin titulo ni listas 
        Responde SOLO con el párrafo, sin texto adicional.
        """
        
        return self._generate_ai_text(prompt)

    def _generate_rsq_analysis(self, question_number, question_text, articles_data, statistics, visualizations_data):
        """Genera análisis detallado para una pregunta de investigación específica usando ChatGPT."""
        story = []
        
        # Título de la RSQ
        story.append(Paragraph(f"RSQ_{question_number}: {question_text}", self.styles['Heading3']))
        
        # Obtener respuestas específicas para esta pregunta
        subq_key = f'subq{question_number}_responses'
        responses = statistics.get(subq_key, [])
        
        print(f"🔍 Analizando RSQ_{question_number} con {len(responses)} respuestas")
        
        # Analizar respuestas para extraer patrones
        analysis_data = self._analyze_subquestion_responses(responses, question_number)
        
        # Generar análisis con ChatGPT
        analysis_prompt = f"""
        Eres un investigador experto analizando resultados de un mapeo sistemático.
        
        Pregunta de investigación: {question_text}
        
        Datos para analizar:
        - Número total de estudios analizados: {len(responses)}
        - Patrones identificados: {analysis_data['patterns']}
        - Categorías principales: {analysis_data['categories']}
        - Frecuencias: {analysis_data['frequencies']}
        
        Estadísticas adicionales:
        - Total de estudios seleccionados: {statistics['selected_count']}
        - Distribución por año: {statistics['year_distribution']}
        - Distribución por enfoque: {statistics['enfoque_distribution']}
        
        Genera un análisis académico estructurado que incluya:
        
        1. **Metodología de análisis** (1-2 oraciones sobre cómo se analizó)
        2. **Estadísticas cuantitativas** (porcentajes específicos y frecuencias)
        3. **Análisis detallado** (interpretación de patrones encontrados)
        4. **Hallazgos principales** (insights más importantes)
        
        Usa un lenguaje académico formal y cita porcentajes específicos.
        Estructura la respuesta en párrafos claros de 80-200 palabras cada uno.
        Evita el uso de gerundios. Escribe en español, con coherencia y profundidad.
        solo dame el texto sin titulo ni listas 
        """
        
        analysis_text = self._generate_ai_text(analysis_prompt, max_tokens=800)
        
        # Dividir en párrafos y añadir al story
        paragraphs = analysis_text.split('\n\n')
        for paragraph in paragraphs:
            if paragraph.strip():
                # Limpiar marcadores de markdown si existen
                clean_paragraph = paragraph.replace('**', '').replace('*', '').strip()
                story.append(Paragraph(clean_paragraph, self.styles['CustomNormal']))
                story.append(Spacer(1, 8))
        
        return story

    def _analyze_subquestion_responses(self, responses, question_number):
        """Analiza las respuestas a una subpregunta específica para extraer patrones."""
        if not responses:
            return {
                'patterns': [],
                'categories': {},
                'frequencies': {},
                'keywords': []
            }
        
        # Combinar todas las respuestas para análisis
        combined_text = ' '.join(responses).lower()
        
        # Extraer palabras clave frecuentes (excluyendo stopwords)
        stop_words = {'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'su', 'este', 'esta', 'como', 'más', 'pero', 'sus', 'muy', 'sin', 'sobre', 'entre', 'ser', 'estar', 'hacer', 'the', 'of', 'and', 'to', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more', 'much', 'my', 'way', 'been', 'who', 'its', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'}
        
        # Extraer palabras significativas
        words = re.findall(r'\b[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]{3,}\b', combined_text)
        filtered_words = [word for word in words if word not in stop_words]
        word_freq = Counter(filtered_words)
        
        # Categorización básica según el número de pregunta
        if question_number == 1:
            # Pregunta 1: Usualmente sobre métodos/enfoques
            tech_keywords = ['machine', 'learning', 'algorithm', 'statistical', 'analysis', 'model', 'approach', 'method', 'technique', 'algoritmo', 'análisis', 'método', 'técnica', 'estadístico']
            categories = self._categorize_by_keywords(responses, tech_keywords, 'Técnicas y Métodos')
        elif question_number == 2:
            # Pregunta 2: Usualmente sobre aplicaciones/dominios
            app_keywords = ['health', 'medical', 'clinical', 'diagnostic', 'treatment', 'patient', 'disease', 'salud', 'médico', 'clínico', 'diagnóstico', 'tratamiento', 'paciente', 'enfermedad']
            categories = self._categorize_by_keywords(responses, app_keywords, 'Aplicaciones Médicas')
        else:
            # Pregunta 3: Usualmente sobre limitaciones/futuro
            limit_keywords = ['limitation', 'challenge', 'future', 'recommendation', 'improvement', 'limitación', 'desafío', 'futuro', 'recomendación', 'mejora']
            categories = self._categorize_by_keywords(responses, limit_keywords, 'Limitaciones y Futuro')
        
        return {
            'patterns': list(word_freq.most_common(5)),
            'categories': categories,
            'frequencies': {cat: len(items) for cat, items in categories.items()},
            'keywords': list(word_freq.most_common(10))
        }

    def _categorize_by_keywords(self, responses, keywords, default_category):
        """Categoriza respuestas basándose en palabras clave."""
        categories = {default_category: []}
        other_category = 'Otros aspectos'
        categories[other_category] = []
        
        for response in responses:
            response_lower = response.lower()
            if any(keyword in response_lower for keyword in keywords):
                categories[default_category].append(response)
            else:
                categories[other_category].append(response)
        
        # Eliminar categorías vacías
        return {cat: items for cat, items in categories.items() if items}
    
    def _integrate_visualizations(self, visualizations_data, sms_data):
        """Integrar las visualizaciones existentes del sistema en el reporte"""
        story = []
                
        # Integrar análisis semántico
        if 'semantic_analysis' in visualizations_data:
            semantic_image = self._base64_to_reportlab_image(
                visualizations_data['semantic_analysis']['image_base64']
            )
            if semantic_image:
                story.append(semantic_image)
                story.append(Paragraph("Figure 2: Semantic Analysis Distribution", self.styles['Normal']))
        
        # Integrar gráfico de burbujas
        if 'bubble_chart' in visualizations_data:            
            bubble_image = self._base64_to_reportlab_image(
                visualizations_data['bubble_chart']['image_base64']
            )
            if bubble_image:
                story.append(bubble_image)
                story.append(Paragraph("Figure 3: Techniques vs Applications Bubble Chart", self.styles['Normal']))

        
        return story
    
    def _generate_information_extraction_table(self, articles_data):
        """Generar una tabla separada de extracción de información para cada artículo"""
        story = []
        
        # Título de la sección
        story.append(Paragraph("D. INFORMATION EXTRACTION", self.styles['CustomHeading2']))
        story.append(Spacer(1, 10))
        
        # Filtrar solo artículos seleccionados
        selected_articles = [a for a in articles_data if a.get('estado') == 'SELECTED']
        
        if not selected_articles:
            story.append(Paragraph("No selected articles found for extraction.", self.styles['CustomNormal']))
            return story
        
        # Generar UNA tabla por cada artículo
        for idx, article in enumerate(selected_articles, 1):
            
            # Crear datos para ESTA tabla específica (solo 2 columnas)
            # IMPORTANTE: Usar Paragraph para textos largos que necesitan ajustarse
            table_data = []
            
            # Fila 1: Encabezado principal
            table_data.append([
                Paragraph("extraccion de informacion", self.styles['CustomHeading2']), 
                ""
            ])
            
            # Fila 2: Título
            titulo = article.get('titulo', 'N/A')
            table_data.append([
                Paragraph("Titulo", self.styles['CustomHeading5']), 
                Paragraph(titulo, self.styles['CustomNormal'])
            ])
            
            # Fila 3: Autor
            autor = article.get('autores', 'N/A')
            table_data.append([
                Paragraph("Autor", self.styles['CustomHeading5']), 
                Paragraph(autor, self.styles['CustomNormal'])
            ])
            
            # Fila 4: Publicación
            publicacion = article.get('journal', 'N/A')
            table_data.append([
                Paragraph("Publicacion", self.styles['CustomHeading5']), 
                Paragraph(publicacion, self.styles['CustomNormal'])
            ])
            
            # Fila 5: Año
            año = str(article.get('anio_publicacion', 'N/A'))
            table_data.append([
                Paragraph("Año", self.styles['CustomHeading5']), 
                Paragraph(año, self.styles['CustomNormal'])
            ])
            
            # Fila 6: sub_pregunta1
            subq1 = article.get('respuesta_subpregunta_1', 'Sin respuesta')
            table_data.append([
                Paragraph("sub_pregunta1", self.styles['CustomHeading5']), 
                Paragraph(subq1, self.styles['CustomNormal'])
            ])
            
            # Fila 7: sub_pregunta2
            subq2 = article.get('respuesta_subpregunta_2', 'Sin respuesta')
            table_data.append([
                Paragraph("sub_pregunta2", self.styles['CustomHeading5']), 
                Paragraph(subq2, self.styles['CustomNormal'])
            ])
            
            # Fila 8: sub_pregunta3
            subq3 = article.get('respuesta_subpregunta_3', 'Sin respuesta')
            table_data.append([
                Paragraph("sub_pregunta3", self.styles['CustomHeading5']), 
                Paragraph(subq3, self.styles['CustomNormal'])
            ])
            
            # Configurar anchos de columna (solo 2 columnas) - Más espacio para el contenido
            col_widths = [
                1.3*inch,  # Primera columna para nombres de campos (reducida)
                5.7*inch   # Segunda columna para datos del artículo (aumentada)
            ]
            
            # Crear la tabla para este artículo
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Aplicar estilos - Optimizados para texto que se ajusta automáticamente
            table.setStyle(TableStyle([
                # Estilo para el encabezado principal (primera fila)
                ('SPAN', (0, 0), (1, 0)),  # Combinar las 2 columnas de la primera fila
                ('BACKGROUND', (0, 0), (1, 0), colors.lightgrey),
                ('TEXTCOLOR', (0, 0), (1, 0), colors.black),
                ('ALIGN', (0, 0), (1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (1, 0), 8),
                ('TOPPADDING', (0, 0), (1, 0), 8),
                
                # Estilo para la primera columna (nombres de campos)
                ('BACKGROUND', (0, 1), (0, -1), colors.lightgrey),
                ('TEXTCOLOR', (0, 1), (0, -1), colors.black),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('VALIGN', (0, 1), (0, -1), 'TOP'),
                
                # Estilo para la segunda columna (datos del artículo)
                ('BACKGROUND', (1, 1), (1, -1), colors.white),
                ('TEXTCOLOR', (1, 1), (1, -1), colors.black),
                ('ALIGN', (1, 1), (1, -1), 'LEFT'),
                ('VALIGN', (1, 1), (1, -1), 'TOP'),
                
                # Bordes para toda la tabla
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('LINEBELOW', (0, 0), (-1, 0), 2, colors.black),  # Línea más gruesa bajo encabezado
                ('LINEAFTER', (0, 1), (0, -1), 2, colors.black),  # Línea más gruesa después de nombres de campos
                
                # Padding optimizado para texto que se ajusta
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
            ]))
            
            # Añadir la tabla al documento (SIN espacios entre tablas)
            story.append(Spacer(1, 6))
            story.append(table)  
        return story
    def _generate_analysis_and_discussions_section(self, sms_data, articles_data, visualizations_data=None):
        """
        Genera el apartado '3. Analysis and discussions' usando ChatGPT
        Coloca esta función después de _generate_information_extraction_table
        """
        story = []
        print("🔍 Generando apartado 'Analysis and discussions' con IA...")
        
        # PASO 1: Extraer estadísticas detalladas (ya existe en tu código)
        stats = self._extract_detailed_statistics(articles_data)
        
        # PASO 2: Crear análisis de patrones por pregunta
        analysis_patterns = self._extract_rsq_patterns_analysis(articles_data, stats)
        
        # PASO 3: Construir el prompt completo para ChatGPT
        prompt = self._build_analysis_discussions_prompt(sms_data, stats, analysis_patterns)
        
        # PASO 4: Generar texto con ChatGPT
        analysis_text = self._generate_ai_text(prompt, max_tokens=2500)
        
        # PASO 5: Procesar y estructurar la respuesta
        story.extend(self._process_analysis_discussions_response(analysis_text))
        
        return story

    def _extract_rsq_patterns_analysis(self, articles_data, stats):
        """
        NUEVO: Extrae patrones específicos para cada RSQ
        """
        selected_articles = [a for a in articles_data if a.get('estado') == 'SELECTED']
        
        patterns = {}
        
        # Analizar RSQ1 (métodos/técnicas)
        rsq1_responses = [a.get('respuesta_subpregunta_1', '') for a in selected_articles 
                        if a.get('respuesta_subpregunta_1') and a.get('respuesta_subpregunta_1') != 'Sin respuesta disponible']
        patterns['rsq1'] = self._analyze_text_patterns(rsq1_responses, 'techniques')
        
        # Analizar RSQ2 (aplicaciones/dominios)
        rsq2_responses = [a.get('respuesta_subpregunta_2', '') for a in selected_articles 
                        if a.get('respuesta_subpregunta_2') and a.get('respuesta_subpregunta_2') != 'Sin respuesta disponible']
        patterns['rsq2'] = self._analyze_text_patterns(rsq2_responses, 'applications')
        
        # Analizar RSQ3 (limitaciones/futuro)
        rsq3_responses = [a.get('respuesta_subpregunta_3', '') for a in selected_articles 
                        if a.get('respuesta_subpregunta_3') and a.get('respuesta_subpregunta_3') != 'Sin respuesta disponible']
        patterns['rsq3'] = self._analyze_text_patterns(rsq3_responses, 'limitations')
        
        return patterns

    def _analyze_text_patterns(self, responses, category_type):
        """
        NUEVO: Analiza patrones de texto según categoría
        """
        if not responses:
            return {"keywords": [], "categories": {}, "summary": "Sin datos suficientes", "total_responses": 0}
        
        # Combinar todas las respuestas
        combined_text = ' '.join(responses).lower()
        
        # Definir palabras clave por categoría
        if category_type == 'techniques':
            key_terms = ['machine learning', 'deep learning', 'algorithm', 'statistical', 'neural network', 
                        'regression', 'classification', 'clustering', 'ai', 'artificial intelligence',
                        'aprendizaje automático', 'algoritmo', 'estadístico', 'inteligencia artificial']
        elif category_type == 'applications':
            key_terms = ['healthcare', 'medical', 'clinical', 'diagnostic', 'treatment', 'patient',
                        'disease', 'health', 'salud', 'médico', 'clínico', 'diagnóstico', 'tratamiento']
        else:  # limitations
            key_terms = ['limitation', 'challenge', 'problem', 'issue', 'future work', 'improvement',
                        'limitación', 'desafío', 'problema', 'trabajo futuro', 'mejora']
        
        # Contar menciones
        keyword_counts = {}
        for term in key_terms:
            count = combined_text.count(term)
            if count > 0:
                keyword_counts[term] = count
        
        # Crear resumen
        top_keywords = sorted(keyword_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "keywords": top_keywords,
            "total_responses": len(responses),
            "summary": f"Se identificaron {len(keyword_counts)} términos clave relevantes"
        }

    def _build_analysis_discussions_prompt(self, sms_data, stats, analysis_patterns):
        """
        NUEVO: Construye el prompt específico para Analysis and Discussions - VERSIÓN TEXTO CONTINUO
        """
        prompt = f"""
    Actúa como un investigador experto en revisiones sistemáticas que necesita redactar el apartado "Analysis and discussions" de un estudio de mapeo sistemático.

    DATOS DE ENTRADA:

    1. Información básica del estudio:
    - Tema de investigación: {sms_data.get('titulo_estudio', 'No especificado')}
    - Pregunta principal: {sms_data.get('pregunta_principal', 'No especificada')}
    - Preguntas de investigación:
    * RSQ_1: {sms_data.get('subpregunta_1', 'No especificada')}
    * RSQ_2: {sms_data.get('subpregunta_2', 'No especificada')}
    * RSQ_3: {sms_data.get('subpregunta_3', 'No especificada')}
    - Número total de estudios seleccionados: {stats['selected_count']} artículos
    - Período de búsqueda: {sms_data.get('anio_inicio', 'N/A')} - {sms_data.get('anio_final', 'N/A')}
    - Bases de datos utilizadas: Scopus, Web of Science, PubMed
    - Tasa de selección: {stats['selection_rate']}%

    2. Resultados cuantitativos principales:
    - Distribución temporal: {stats['year_distribution']}
    - Año más productivo: {stats['most_productive_year'][0]} con {stats['most_productive_year'][1]} artículos
    - Distribución por revista (top 5): {dict(list(stats['journal_distribution'].items())[:5])}
    - Distribución por enfoque: {stats['enfoque_distribution']}

    3. Análisis de respuestas por pregunta:
    RSQ_1 - {analysis_patterns['rsq1']['total_responses']} respuestas analizadas:
    Principales términos: {analysis_patterns['rsq1']['keywords']}

    RSQ_2 - {analysis_patterns['rsq2']['total_responses']} respuestas analizadas:
    Principales términos: {analysis_patterns['rsq2']['keywords']}

    RSQ_3 - {analysis_patterns['rsq3']['total_responses']} respuestas analizadas:
    Principales términos: {analysis_patterns['rsq3']['keywords']}

    4. Figuras y gráficos disponibles:
    - Figura 1: Diagrama PRISMA (proceso de selección)
    - Figura 2: Análisis semántico (distribución de estudios por clusters)
    - Figura 3: Gráfico de burbujas (técnicas vs aplicaciones)
    - Tabla de extracción: {stats['selected_count']} artículos con información detallada

    INSTRUCCIONES PARA EL TEXTO:

    Redacta un texto académico continuo y fluido que aborde TODOS estos aspectos en el siguiente orden lógico:

    1. Párrafo introductorio: Explica que el análisis de {stats['selected_count']} estudios seleccionados muestra la distribución por categorías, cómo esto permite identificar áreas enfatizadas y futuras líneas de investigación. Conecta con el mapa sistemático desarrollado en las figuras 2 y 3, y hace referencia a las múltiples áreas cubiertas en el período {sms_data.get('anio_inicio', 'N/A')}-{sms_data.get('anio_final', 'N/A')}.

    2. Análisis temporal y cuantitativo: Presenta la distribución temporal "{stats['year_distribution']}", identifica el año más productivo ({stats['most_productive_year'][0]} con {stats['most_productive_year'][1]} estudios), analiza tendencias y proporciona estadísticas sobre concentración de publicaciones.

    3. Interpretación de figuras: Analiza la Figura 2 (análisis semántico) describiendo clusters, explica la Figura 3 (gráfico de burbujas) mostrando relaciones entre técnicas y aplicaciones, identifica conjuntos más grandes de contribuciones.

    4. Análisis por pregunta de investigación: Para RSQ_1 resume los {analysis_patterns['rsq1']['total_responses']} estudios identificando enfoques metodológicos frecuentes. Para RSQ_2 analiza los {analysis_patterns['rsq2']['total_responses']} estudios relevantes identificando aplicaciones más exploradas. Para RSQ_3 examina los {analysis_patterns['rsq3']['total_responses']} estudios identificando limitaciones reportadas.

    5. Gaps y oportunidades: Señala áreas con pocas investigaciones basándose en distribución cuantitativa, identifica limitaciones en enfoques actuales, menciona aplicaciones sub-exploradas.

    6. Técnicas e innovaciones: Resalta técnicas avanzadas encontradas (IA, ML, estadística), menciona enfoques únicos, conecta técnicas con aplicaciones específicas.

    7. Síntesis final: Resume hallazgos principales que responden a la pregunta principal, conecta resultados con las tres RSQs, menciona implicaciones prácticas y sugiere líneas futuras.

    ESTILO DE REDACCIÓN:
    - Tono académico formal pero accesible
    - Incluye referencias específicas a "Figura 2", "Figura 3", "Tabla de extracción"
    - Usa conectores lógicos entre ideas para mantener fluidez
    - Equilibrio entre descripción cuantitativa y análisis crítico
    - Respalda afirmaciones con datos cuantitativos específicos
    - Evita gerundios, usa español académico formal
    - Usa números exactos proporcionados, no aproximaciones
    - Longitud total: aproximadamente 1000-1500 palabras

    FORMATO DE RESPUESTA:
    Responde con un texto continuo estructurado en párrafos (sin subtítulos numerados), que fluya naturalmente de un tema al siguiente. Cada párrafo debe tener 100-200 palabras. Separa párrafos con doble salto de línea.

    No incluyas explicaciones adicionales, solo el texto académico del apartado.
    """
        
        return prompt

    def _process_analysis_discussions_response(self, analysis_text):
        """
        NUEVO: Procesa la respuesta de ChatGPT y la convierte en elementos ReportLab
        Mantiene el texto como flujo continuo sin dividir en subsecciones
        """
        import re
        story = []
        
        # Agregar título de la sección
        story.append(Paragraph("3. Analysis and discussions", self.styles['CustomHeading2']))
        story.append(Spacer(1, 15))
        
        # Dividir el texto en párrafos por saltos de línea dobles
        paragraphs = analysis_text.split('\n\n')
        
        for paragraph in paragraphs:
            # Limpiar el párrafo
            clean_paragraph = paragraph.strip()
            
            # Si el párrafo no está vacío
            if clean_paragraph:
                # Remover posibles numeraciones automáticas (3.1, 3.2, etc.) si las hay
                clean_paragraph = re.sub(r'^3\.\d+\s*', '', clean_paragraph)
                
                # Remover saltos de línea internos del párrafo
                clean_paragraph = clean_paragraph.replace('\n', ' ')
                
                # Agregar como párrafo normal
                story.append(Paragraph(clean_paragraph, self.styles['CustomNormal']))
                story.append(Spacer(1, 12))
        
        return story
    def _generate_references(self, articles_data):
        """Generar referencias bibliográficas en formato APA"""
        story = []
        
        story.append(Paragraph("REFERENCES", self.styles['CustomHeading2']))
        
        selected_articles = [a for a in articles_data if a.get('estado') == 'SELECTED']
        
        for i, article in enumerate(selected_articles[:30], 1):  # Limitar referencias
            # Formato APA simplificado
            authors = article.get('autores', 'Unknown authors')
            year = article.get('anio_publicacion', 'n.d.')
            title = article.get('titulo', 'Untitled')
            journal = article.get('journal', 'Unknown journal')
            
            reference = f"[{i}] {authors} ({year}). {title}. {journal}."
            story.append(Paragraph(reference, self.styles['Normal']))
            story.append(Spacer(1, 6))
        
        return story
    
    def _generate_conclusions(self, sms_data, articles_data):
        """Generar conclusiones usando IA"""
        story = []
        
        story.append(Paragraph("CONCLUSIONS", self.styles['CustomHeading2']))
        
        # Generar conclusiones con IA
        conclusions_prompt = (
            f"Escribe 3 conclusiones para una revisión sistemática sobre {sms_data['titulo_estudio']}. "
            f"Basado en el análisis de {len(articles_data)} estudios. Incluye implicaciones para futuras investigaciones."
            f" Evita el uso de gerundios. Escribe en español, con coherencia y profundidad."
            f"solo dame el texto sin titulo ni listas."
            f"Responde SOLO con el párrafo, sin texto adicional."
        )
        
        conclusions_text = self._generate_ai_text(conclusions_prompt)
        story.append(Paragraph(conclusions_text, self.styles['CustomNormal']))
        
        return story
    
    def _extract_keywords_from_title(self, title):
        """Extraer keywords del título"""
        # Implementación simple - en producción usar NLP más avanzado
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = [word.lower() for word in title.split() if word.lower() not in stop_words and len(word) > 3]
        return ', '.join(words[:6])  # Máximo 6 keywords
    
    def _base64_to_reportlab_image(self, base64_string, max_width=6*inch, max_height=4*inch):
        """Convertir imagen base64 a formato ReportLab"""
        try:
            # Decodificar base64
            image_data = base64.b64decode(base64_string)
            image_buffer = io.BytesIO(image_data)
            
            # Crear imagen ReportLab
            image = RLImage(image_buffer, width=max_width, height=max_height)
            return image
        except Exception as e:
            print(f"Error converting base64 to image: {e}")
            return None