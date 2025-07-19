# backend/sms/pdf_generator.py
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import markdown
from io import BytesIO

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Configurar estilos personalizados"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#2563eb')
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading2',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.HexColor('#1f2937')
        ))
    
    def generate_pdf(self, markdown_content, title):
        """Generar PDF desde contenido markdown"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=inch, bottomMargin=inch)
        
        # Convertir markdown a HTML
        html_content = markdown.markdown(markdown_content, extensions=['tables'])
        
        # Parsear y convertir a elementos de ReportLab
        story = []
        story.append(Paragraph(title, self.styles['CustomTitle']))
        story.append(Spacer(1, 12))
        
        # Procesar contenido (simplificado - en producción usarías un parser más robusto)
        lines = markdown_content.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                story.append(Spacer(1, 6))
            elif line.startswith('# '):
                story.append(Paragraph(line[2:], self.styles['CustomTitle']))
            elif line.startswith('## '):
                story.append(Paragraph(line[3:], self.styles['CustomHeading2']))
            elif line.startswith('**') and line.endswith('**'):
                story.append(Paragraph(line[2:-2], self.styles['Heading3']))
            else:
                story.append(Paragraph(line, self.styles['Normal']))
            
            story.append(Spacer(1, 6))
        
        # Construir PDF
        doc.build(story)
        
        buffer.seek(0)
        return buffer.read()