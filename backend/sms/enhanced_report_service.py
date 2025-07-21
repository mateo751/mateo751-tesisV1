# backend/sms/enhanced_report_service.py
import base64
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, ListFlowable, ListItem
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT, TA_CENTER
from django.conf import settings
import openai
import os
from .semantic_analysis import SemanticResearchAnalyzer

class EnhancedReportGeneratorService:
    """
    Servicio mejorado para generar reportes metodológicos completos
    integrando las visualizaciones existentes del sistema.
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
        # Configurar OpenAI si está disponible
        if hasattr(settings, 'OPENAI_API_KEY'):
            openai.api_key = settings.OPENAI_API_KEY
    
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
    
    def generate_comprehensive_report(self, sms_data, articles_data, visualizations_data=None):
        """
        Genera un reporte metodológico completo incluyendo visualizaciones
        
        Args:
            sms_data: Datos del SMS
            articles_data: Lista de artículos procesados
            visualizations_data: Datos de las visualizaciones (opcional)
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=inch, bottomMargin=inch)
        
        story = []
        
        # 1. Portada y Abstract
        story.extend(self._generate_title_and_abstract(sms_data))
        
        # 2. Introducción con citas
        story.extend(self._generate_introduction(sms_data, articles_data))
        
        # 3. Metodología detallada
        story.extend(self._generate_detailed_methodology(sms_data, articles_data))
        
        # 4. Visualizaciones integradas
        if visualizations_data:
            story.extend(self._integrate_visualizations(visualizations_data, sms_data))
        
        # 5. Resultados y análisis
        story.extend(self._generate_results_analysis(sms_data, articles_data))
        
        # 6. Tabla de artículos
        story.extend(self._generate_articles_table(articles_data))
        
        # 7. Referencias bibliográficas
        story.extend(self._generate_references(articles_data))
        
        # 8. Conclusiones
        story.extend(self._generate_conclusions(sms_data, articles_data))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.read()
    
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
            f"Write a professional abstract for a systematic mapping study about {sms_data['titulo_estudio']}. "
            f"Include the research objectives, methodology, and key findings in academic style."
        )
        
        story.append(Paragraph("Abstract", self.styles['CustomHeading2']))
        story.append(Paragraph(abstract, self.styles['CustomNormal']))
        
        # Keywords
        keywords = self._extract_keywords_from_title(sms_data['titulo_estudio'])
        story.append(Paragraph(f"Keywords: {keywords}", self.styles['CustomNormal']))
        story.append(Spacer(1, 30))
        
        return story
    
    def _generate_introduction(self, sms_data, articles_data):
        """Generar sección de introducción con contexto y citas"""
        story = []
        
        story.append(Paragraph("INTRODUCTION", self.styles['CustomHeading2']))
        
        # Introducción generada con IA
        introduction_prompt = (
            f"Write a professional introduction for a systematic mapping study about {sms_data['titulo_estudio']}. "
            f"Include the research context, motivation, and objectives. "
            f"Reference the importance of systematic mapping studies in this field."
        )
        
        introduction_text = self._generate_ai_text(introduction_prompt)
        story.append(Paragraph(introduction_text, self.styles['CustomNormal']))
        
        # Contexto del problema
        story.append(Paragraph(
            f"The field of {sms_data['titulo_estudio']} has experienced significant growth in recent years, "
            f"necessitating a comprehensive systematic mapping to identify research trends, gaps, and opportunities.",
            self.styles['CustomNormal']
        ))
        
        # Objetivos del estudio
        story.append(Paragraph("Study Objectives:", self.styles['Heading3']))
        story.append(Paragraph(
            f"The primary objective of this systematic mapping study is to provide a comprehensive overview "
            f"of the current state of research in {sms_data['titulo_estudio']}, identifying key trends, "
            f"methodologies, and research gaps.",
            self.styles['CustomNormal']
        ))
        
        story.append(Spacer(1, 20))
        
        return story
    
    def _generate_detailed_methodology(self, sms_data, articles_data):
        """Generar sección de metodología detallada"""
        story = []
        
        story.append(Paragraph("1. MATERIALES Y MÉTODOS", self.styles['CustomHeading2']))
        
        
        
        # Preguntas de investigación
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
        
        return story
    
    def _integrate_visualizations(self, visualizations_data, sms_data):
        """Integrar las visualizaciones existentes del sistema en el reporte"""
        story = []
        # Integrar diagrama PRISMA
        if 'prisma_diagram' in visualizations_data:
            
            # Añadir imagen del diagrama PRISMA
            prisma_image = self._base64_to_reportlab_image(
                visualizations_data['prisma_diagram']['image_base64']
            )
            if prisma_image:
                story.append(prisma_image)
                story.append(Paragraph(
                    f"""Figura 1. Diagrama de flujo que muestra una visión general del proceso
                    de investigación para estudios relevantes.""", self.styles['CustomNormal']))
        
        story.append(Paragraph("C.Results", self.styles['Heading3']))
        story.append(Paragraph(
            f"""
            Los resultados encontrados en la Tabla I muestran 
            la información relevante de los estudios 
            seleccionados sobre las funcionalidades, 
            métodos y técnicas utilizadas en las 
            aplicaciones para {sms_data['titulo_estudio']}, 
            información que se utiliza para generar 
            un mapa de distribución de los estudios 
            seleccionados sobre el contexto de la 
            investigación (Figura 2) y para calcular 
            las frecuencias de los estudios para cada 
            funcionalidad del esquema de clasificación 
            (Figura 3). Esto nos permite analizar 
            cómo se abordan las funcionalidades, 
            técnicas y registros utilizados en las 
            diferentes aplicaciones para {sms_data['titulo_estudio']}.
            y responder así a las preguntas de investigación propuestas.""",
            self.styles['CustomNormal']))
                
        # Integrar análisis semántico
        if 'semantic_analysis' in visualizations_data:
            story.append(Paragraph("2.2 Semantic Analysis of Research Approaches", self.styles['Heading3']))
            story.append(Paragraph(
                "Figure 2 presents the semantic analysis results showing the distribution "
                "of research approaches identified through AI-powered clustering.",
                self.styles['CustomNormal']
            ))
            
            semantic_image = self._base64_to_reportlab_image(
                visualizations_data['semantic_analysis']['image_base64']
            )
            if semantic_image:
                story.append(semantic_image)
                story.append(Paragraph("Figure 2: Semantic Analysis Distribution", self.styles['Normal']))
                story.append(Spacer(1, 20))
        
        # Integrar gráfico de burbujas
        if 'bubble_chart' in visualizations_data:
            story.append(Paragraph("2.3 Techniques and Applications Correlation", self.styles['Heading3']))
            story.append(Paragraph(
                "Figure 3 displays the bubble chart correlation between research techniques, "
                "application focuses, and record types identified in the selected studies.",
                self.styles['CustomNormal']
            ))
            
            bubble_image = self._base64_to_reportlab_image(
                visualizations_data['bubble_chart']['image_base64']
            )
            if bubble_image:
                story.append(bubble_image)
                story.append(Paragraph("Figure 3: Techniques vs Applications Bubble Chart", self.styles['Normal']))
                story.append(Spacer(1, 20))
        
        return story
    
    def _generate_results_analysis(self, sms_data, articles_data):
        """Generar análisis de resultados con estadísticas"""
        story = []
        
        story.append(Paragraph("3. ANALYSIS AND DISCUSSION", self.styles['CustomHeading2']))
        
        # Análisis estadístico
        total_articles = len(articles_data)
        selected_count = len([a for a in articles_data if a.get('estado') == 'SELECTED'])
        
        # Análisis por año
        year_distribution = {}
        for article in articles_data:
            year = article.get('anio_publicacion', 'Unknown')
            year_distribution[year] = year_distribution.get(year, 0) + 1
        
        # Generar texto de análisis con IA
        analysis_prompt = (
            f"Analyze the results of a systematic mapping study about {sms_data['titulo_estudio']}. "
            f"We analyzed {total_articles} articles and selected {selected_count} for final inclusion. "
            f"Write a professional analysis discussing the trends, patterns, and implications of these findings."
        )
        
        analysis_text = self._generate_ai_text(analysis_prompt)
        story.append(Paragraph(analysis_text, self.styles['CustomNormal']))
        
        return story
    
    def _generate_articles_table(self, articles_data):
        """Generar tabla detallada de artículos seleccionados"""
        story = []
        
        story.append(Paragraph("4. SELECTED STUDIES", self.styles['CustomHeading2']))
        story.append(Paragraph(
            "Table 1 presents the detailed information of the selected studies.",
            self.styles['CustomNormal']
        ))
        
        # Filtrar solo artículos seleccionados
        selected_articles = [a for a in articles_data if a.get('estado') == 'SELECTED']
        
        if selected_articles:
            # Crear datos de la tabla
            table_data = [["ID", "Title", "Authors", "Year", "Journal"]]
            
            for i, article in enumerate(selected_articles[:20]):  # Limitar a 20 para el PDF
                table_data.append([
                    str(i + 1),
                    article.get('titulo', 'N/A')[:60] + ('...' if len(article.get('titulo', '')) > 60 else ''),
                    article.get('autores', 'N/A')[:40] + ('...' if len(article.get('autores', '')) > 40 else ''),
                    str(article.get('anio_publicacion', 'N/A')),
                    article.get('journal', 'N/A')[:30] + ('...' if len(article.get('journal', '')) > 30 else '')
                ])
            
            # Crear tabla
            table = Table(table_data, colWidths=[0.5*inch, 3*inch, 2*inch, 0.7*inch, 1.8*inch])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(table)
            story.append(Paragraph("Table 1: Selected Studies Overview", self.styles['Normal']))
        
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
            f"Write 3 professional conclusions for a systematic mapping study about {sms_data['titulo_estudio']}. "
            f"Based on the analysis of {len(articles_data)} studies. Include implications for future research."
        )
        
        conclusions_text = self._generate_ai_text(conclusions_prompt)
        story.append(Paragraph(conclusions_text, self.styles['CustomNormal']))
        
        return story
    
    def _generate_ai_text(self, prompt, max_tokens=500):
        """Generar texto usando OpenAI GPT"""
        try:
            if not hasattr(settings, 'OPENAI_API_KEY'):
                return "AI text generation not available. Please configure OpenAI API key."
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert academic writer specializing in systematic reviews."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens
            )
            return response.choices[0].message['content'].strip()
        except Exception as e:
            return f"Text generation unavailable: {str(e)}"
    
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