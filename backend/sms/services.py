# backend/sms/services.py
class ReportGeneratorService:
    """Servicio para generar reportes metodológicos automáticos"""
    
    def generate_methodology_section(self, template_data):
        """
        Genera la sección de metodología completa
        """
        sms_data = template_data['sms_data']
        statistics = template_data['statistics']
        articles_sample = template_data['articles_sample']
        
        # Template principal
        methodology_text = f"""
            # 2. Materials and Methods

            ## 2.1 Research Questions

            This systematic mapping study was guided by the following research questions:

            **Main Research Question:** {sms_data['pregunta_principal']}

            **Sub-questions:**
            - RQ1: {sms_data['subpregunta_1'] or 'Not defined'}
            - RQ2: {sms_data['subpregunta_2'] or 'Not defined'}  
            - RQ3: {sms_data['subpregunta_3'] or 'Not defined'}

            ## 2.2 Search Strategy

            The systematic search was conducted to identify relevant studies in the field. The following search query was developed and applied across multiple databases:
            {sms_data['cadena_busqueda']}

            **Search Period:** {sms_data['anio_inicio']} to {sms_data['anio_final']}

            **Databases Searched:** {sms_data['fuentes'] or 'Multiple academic databases'}

            ## 2.3 Selection Criteria

            The selection of studies was based on predefined inclusion and exclusion criteria to ensure relevance and quality.

            **Inclusion Criteria:**
            {self._format_criteria_list(sms_data['criterios_inclusion'])}

            **Exclusion Criteria:**
            {self._format_criteria_list(sms_data['criterios_exclusion'])}

            ## 2.4 Study Selection Process

            Following the PRISMA guidelines for systematic reviews, the study selection process was conducted in multiple phases:

            1. **Initial Search Results:** {statistics['total_articles']} potentially relevant studies were identified through database searching.

            2. **Screening Phase:** Studies were screened based on title and abstract against the inclusion and exclusion criteria.

            3. **Full-Text Assessment:** Remaining studies underwent full-text evaluation for final inclusion.

            4. **Final Selection:** {statistics['selected_count']} studies met all criteria and were included in the final analysis.

            **Selection Results:**
            - Total studies identified: {statistics['total_articles']}
            - Studies selected for inclusion: {statistics['selected_count']}
            - Studies excluded: {statistics['rejected_count']}
            - Studies pending review: {statistics['pending_count']}
            - Overall selection rate: {statistics['selection_rate']}%

            The detailed study selection process is illustrated in the PRISMA flowchart (Figure 1).

            ## 2.5 Data Extraction

            Data extraction was performed systematically from all included studies using a predefined extraction form. The following information was extracted from each study:

            - Bibliographic information (authors, title, year, journal)
            - Study objectives and research questions
            - Methodology employed
            - Key findings and results
            - Study limitations

            {self._generate_studies_table(articles_sample)}

            ## 2.6 Quality Assessment

            Each included study was assessed for quality and relevance using established criteria appropriate for the study design and methodology employed.
            """
        
        return methodology_text.strip()
    
    def _format_criteria_list(self, criteria_text):
        """Convierte texto de criterios en lista formateada"""
        if not criteria_text:
            return "- Not specified"
        
        # Dividir por líneas y formatear como lista
        lines = [line.strip() for line in criteria_text.split('\n') if line.strip()]
        formatted_lines = []
        
        for line in lines:
            if not line.startswith('-') and not line.startswith('•'):
                line = f"- {line}"
            formatted_lines.append(line)
        
        return '\n'.join(formatted_lines)
    
    def _generate_studies_table(self, articles_sample):
        """Genera tabla de ejemplo con algunos estudios"""
        if not articles_sample:
            return "**Table 1:** No studies available for preview."
        
        table = "\n**Table 1:** Sample of included studies\n\n"
        table += "| Authors | Title | Year | Journal |\n"
        table += "|---------|-------|------|----------|\n"
        
        for article in articles_sample:
            authors = article['autores'][:50] + "..." if len(article['autores']) > 50 else article['autores']
            title = article['titulo'][:60] + "..." if len(article['titulo']) > 60 else article['titulo']
            year = article['anio_publicacion'] or 'N/A'
            journal = article['journal'][:30] + "..." if article['journal'] and len(article['journal']) > 30 else (article['journal'] or 'N/A')
            
            table += f"| {authors} | {title} | {year} | {journal} |\n"
        
        return table