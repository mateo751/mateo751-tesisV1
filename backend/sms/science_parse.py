import os
import subprocess
import json
import tempfile
import requests
import traceback
import re
from openai import OpenAI
from django.conf import settings

# Instalar estas dependencias si no están ya instaladas
# pip install pdfminer.six PyPDF2

# Importar extractores de texto de PDF
try:
    from pdfminer.high_level import extract_text as pdfminer_extract_text
    PDFMINER_AVAILABLE = True
except ImportError:
    PDFMINER_AVAILABLE = False
    print("pdfminer.six no está instalado. La extracción de texto puede ser limitada.")

try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False
    print("PyPDF2 no está instalado. La extracción de texto puede ser limitada.")

# Configurar el cliente de OpenAI
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# Configuración para Science-Parse
SCIENCE_PARSE_URL = "http://localhost:8080/v1"  # Asumiendo que Science-Parse corre en este puerto

def setup_science_parse():
    """Verifica si Science-Parse está instalado, de lo contrario lo instala"""
    try:
        # Verificar si Docker está instalado
        subprocess.run(["docker", "--version"], check=True, stdout=subprocess.PIPE)
        
        # Verificar si el contenedor Science-Parse está corriendo
        result = subprocess.run(["docker", "ps", "-q", "--filter", "name=science-parse"], 
                            check=True, stdout=subprocess.PIPE)
        
        if not result.stdout:
            print("Science-Parse no está corriendo. Intentando iniciar...")
            # Intentar iniciar el contenedor existente
            start_result = subprocess.run(["docker", "start", "science-parse"], 
                                    stderr=subprocess.PIPE, stdout=subprocess.PIPE)
            
            # Si el contenedor no existe, crearlo
            if start_result.returncode != 0:
                print("Creando nuevo contenedor Science-Parse...")
                subprocess.run([
                    "docker", "run", "-d", "--name", "science-parse", "-p", "8080:8080", 
                    "allenai/science-parse:2.0.3"
                ], check=True)
            
            print("Science-Parse está corriendo en localhost:8080")
        else:
            print("Science-Parse ya está corriendo")
            
    except Exception as e:
        print(f"Error al configurar Science-Parse: {e}")
        print("Asegúrate de tener Docker instalado y funcionando")
        raise

def extract_text_with_pdfminer(pdf_file_path):
    """Extrae texto de un PDF usando pdfminer.six"""
    if not PDFMINER_AVAILABLE:
        return "pdfminer.six no está instalado"
    
    try:
        text = pdfminer_extract_text(pdf_file_path)
        return text
    except Exception as e:
        print(f"Error al extraer texto con pdfminer: {e}")
        return "No se pudo extraer texto del PDF con pdfminer"

def extract_text_from_pdf(pdf_file_path):
    """Extrae texto de un PDF usando PyPDF2"""
    if not PYPDF2_AVAILABLE:
        return "PyPDF2 no está instalado"
    
    try:
        with open(pdf_file_path, 'rb') as f:
            pdf_reader = PyPDF2.PdfReader(f)
            text = ""
            # Extraer texto de las primeras 5 páginas o menos si hay menos
            num_pages = min(5, len(pdf_reader.pages))
            for i in range(num_pages):
                page_text = pdf_reader.pages[i].extract_text()
                if page_text:
                    text += page_text + "\n"
            return text
    except Exception as e:
        print(f"Error al extraer texto con PyPDF2: {e}")
        return "No se pudo extraer texto del PDF con PyPDF2"

def analyze_pdf_with_chatgpt(pdf_text, file_name):
    """Usa ChatGPT para extraer metadatos del PDF"""
    try:
        # Limitar el texto a analizar para no exceder tokens
        text_preview = pdf_text[:6000] if len(pdf_text) > 6000 else pdf_text
        
        prompt = f"""
        Analiza el siguiente contenido de un PDF académico y extrae los siguientes metadatos:
        - Título del artículo
        - Autores
        - Año de publicación (solo el número)
        - Nombre de la revista o conferencia
        - DOI (si está disponible)
        - Resumen o abstract

        El nombre del archivo es: {file_name}

        Contenido del PDF:
        ```
        {text_preview}
        ```

        Responde SOLO con un JSON con el siguiente formato, sin texto adicional:
        {{
            "title": "Título extraído",
            "authors": "Autor1, Autor2, etc",
            "year": 2023,  # o null si no se encuentra
            "journal": "Nombre de la revista",
            "doi": "Número DOI o URL",
            "abstract": "Texto del resumen..."
        }}
        """

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un asistente especializado en extraer metadatos de artículos académicos."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500
        )
        
        result_text = response.choices[0].message.content
        
        # Intentar extraer el JSON de la respuesta
        json_match = re.search(r'({[\s\S]*})', result_text)
        if json_match:
            json_str = json_match.group(1)
            try:
                metadata = json.loads(json_str)
                return metadata
            except json.JSONDecodeError as je:
                print(f"Error al parsear JSON de ChatGPT: {je}")
                print(f"JSON recibido: {json_str}")
        
        # Si falla, devolver un diccionario con valores extraídos manualmente
        title_match = re.search(r'"title":\s*"([^"]+)"', result_text)
        authors_match = re.search(r'"authors":\s*"([^"]+)"', result_text)
        year_match = re.search(r'"year":\s*(\d{4}|null)', result_text)
        journal_match = re.search(r'"journal":\s*"([^"]+)"', result_text)
        doi_match = re.search(r'"doi":\s*"([^"]+)"', result_text)
        abstract_match = re.search(r'"abstract":\s*"([^"]+)"', result_text)
        
        return {
            'title': title_match.group(1) if title_match else file_name,
            'authors': authors_match.group(1) if authors_match else 'Extraído por IA (no confiable)',
            'year': int(year_match.group(1)) if year_match and year_match.group(1) != 'null' else None,
            'journal': journal_match.group(1) if journal_match else 'Extraído por IA (no confiable)',
            'doi': doi_match.group(1) if doi_match else 'No detectado',
            'abstract': abstract_match.group(1) if abstract_match else text_preview[:500]
        }
    except Exception as e:
        print(f"Error al analizar PDF con ChatGPT: {e}")
        traceback.print_exc()
        
        # Fallback en caso de error completo
        return {
            'title': file_name,
            'authors': 'Error en extracción con IA',
            'year': None,
            'journal': 'Error en extracción con IA',
            'doi': 'Error en extracción con IA',
            'abstract': pdf_text[:500] if pdf_text else 'Error en extracción con IA'
        }

def extract_pdf_metadata(pdf_file_path):
    """Extrae metadatos de un PDF usando Science-Parse con fallback a ChatGPT"""
    try:
        print(f"Intentando extraer metadatos de: {pdf_file_path}")
        
        # Intento 1: Science-Parse
        with open(pdf_file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{SCIENCE_PARSE_URL}", files=files, timeout=30)
            
        print(f"Science-Parse - Código de estado HTTP: {response.status_code}")
        
        if response.status_code != 200:
            raise Exception(f"Error en Science-Parse: {response.status_code} {response.text}")
            
        data = response.json()
        print(f"Science-Parse - Datos extraídos: {data.keys()}")
        
        # Manejo robusto de los campos de Science-Parse
        title = data.get('title', '')
        if not title or title == "null":
            title = os.path.basename(pdf_file_path)
            
        # Procesar los autores correctamente
        authors = data.get('authors', [])
        # Manejo de diferentes formatos de autores
        if not authors:
            author_names = "Autor desconocido"
        elif isinstance(authors, list):
            if len(authors) > 0 and isinstance(authors[0], dict):
                # Si son diccionarios, extraer el campo 'name'
                author_names = ", ".join([author.get('name', 'Desconocido') for author in authors])
            else:
                author_names = ", ".join([str(author) for author in authors])
        else:
            author_names = str(authors)
            
        # Extraer año
        year = data.get('year')
        if not year or year == 0:
            year = None
            
        # Extraer revista
        journal = data.get('venue', '')
        if not journal:
            journal = data.get('journalName', '')
        if not journal or journal == "null":
            journal = "Sin revista"
            
        # Extraer DOI
        doi = data.get('doi', '')
        if not doi or doi == "null":
            doi = "Sin DOI"
            
        # Extraer resumen
        abstract = data.get('abstractText', '')
        if not abstract or abstract == "null":
            # Intentar extraer texto de las primeras páginas
            if 'text' in data:
                abstract = data['text'][:500] + "..." if len(data['text']) > 500 else data['text']
            else:
                abstract = "Sin resumen disponible"
        
        # Extraer los datos que necesitamos
        metadata = {
            'title': title,
            'authors': author_names,
            'year': year,
            'journal': journal,
            'doi': doi,
            'abstract': abstract
        }
        
        # Verificar si los datos son válidos
        if (metadata['title'] != os.path.basename(pdf_file_path) and 
            metadata['authors'] != "Autor desconocido" and
            metadata['abstract'] != "Sin resumen disponible"):
            
            print(f"Science-Parse - Metadatos extraídos con éxito: {metadata}")
            return metadata
        else:
            print("Science-Parse - Extracción parcial, probando con extracción de texto + ChatGPT")
            raise Exception("Datos insuficientes de Science-Parse")
        
    except Exception as e:
        print(f"Science-Parse falló: {e}")
        
        # Intento 2: Extraer texto del PDF
        extracted_text = ""
        
        # Intentar primero con pdfminer si está disponible
        if PDFMINER_AVAILABLE:
            extracted_text = extract_text_with_pdfminer(pdf_file_path)
            
        # Si pdfminer falla o extrae poco texto, intentar con PyPDF2
        if not extracted_text or len(extracted_text.strip()) < 100:
            if PYPDF2_AVAILABLE:
                extracted_text = extract_text_from_pdf(pdf_file_path)
        
        # Intento 3: Si tenemos suficiente texto, analizar con ChatGPT
        if extracted_text and len(extracted_text.strip()) > 100:
            filename = os.path.basename(pdf_file_path)
            print(f"Extraído texto ({len(extracted_text)} caracteres), analizando con ChatGPT")
            return analyze_pdf_with_chatgpt(extracted_text, filename)
        else:
            # Fallback final - no se pudo extraer texto suficiente
            filename = os.path.basename(pdf_file_path)
            print("No se pudo extraer suficiente texto del PDF")
            return {
                'title': filename,
                'authors': 'No detectado automáticamente',
                'year': None,
                'journal': 'No detectado automáticamente',
                'doi': 'No detectado automáticamente',
                'abstract': "No se pudo extraer suficiente texto del PDF para análisis."
            }

def analyze_with_chatgpt(metadata, subquestions):
    """Analiza los metadatos con ChatGPT para responder las subpreguntas"""
    try:
        if not subquestions:
            return {
                "analysis": "No hay subpreguntas para analizar",
                "subpregunta_1": "",
                "subpregunta_2": "",
                "subpregunta_3": ""
            }
        
        # Construir el prompt con los metadatos y solicitar respuestas cortas
        prompt = f"""
        Analiza el siguiente artículo académico:
        
        Título: {metadata['title']}
        Autores: {metadata['authors']}
        Año: {metadata['year']}
        Revista: {metadata['journal']}
        DOI: {metadata['doi']}
        Resumen: {metadata['abstract']}
        
        Por favor, responde a las siguientes preguntas de forma CORTA y DIRECTA (máximo 1-2 oraciones por respuesta):
        """
        
        for i, question in enumerate(subquestions, 1):
            if question and question.strip():
                prompt += f"\n{i}. {question}"
        
        prompt += "\n\nDevuelve tus respuestas en formato JSON con este formato exacto (incluye todas las subpreguntas aunque estén vacías):\n"
        prompt += """
        {
          "subpregunta_1": "Respuesta corta a la primera pregunta",
          "subpregunta_2": "Respuesta corta a la segunda pregunta",
          "subpregunta_3": "Respuesta corta a la tercera pregunta",
          "analysis": "Un análisis más detallado si es necesario"
        }
        """
        
        # Llamar a la API de ChatGPT
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un asistente de investigación especializado en análisis científico. Respondes de forma concisa y directa."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000
        )
        
        result_text = response.choices[0].message.content
        
        # Intentar extraer el JSON de la respuesta
        import json
        import re
        
        # Buscar el patrón de JSON en la respuesta
        json_match = re.search(r'({[\s\S]*})', result_text)
        if json_match:
            json_str = json_match.group(1)
            try:
                result = json.loads(json_str)
                # Asegurar que todas las subpreguntas existan
                if 'subpregunta_1' not in result:
                    result['subpregunta_1'] = ""
                if 'subpregunta_2' not in result:
                    result['subpregunta_2'] = ""
                if 'subpregunta_3' not in result:
                    result['subpregunta_3'] = ""
                if 'analysis' not in result:
                    result['analysis'] = "Análisis no disponible"
                return result
            except:
                print("Error al parsear JSON de ChatGPT")
        
        # Si falla el parseo JSON, intentar extraer por párrafos
        paragraphs = result_text.split('\n\n')
        clean_paragraphs = [p for p in paragraphs if p.strip()]
        
        # Crear respuestas por defecto
        result = {
            "subpregunta_1": "",
            "subpregunta_2": "",
            "subpregunta_3": "",
            "analysis": result_text  # Usar todo el texto como análisis si falla el parseo
        }
        
        # Intentar asignar párrafos a subpreguntas
        for i, p in enumerate(clean_paragraphs[:3], 1):
            if p.strip():
                result[f"subpregunta_{i}"] = p.strip()
        
        return result
    except Exception as e:
        print(f"Error en el análisis con ChatGPT: {e}")
        import traceback
        traceback.print_exc()
        return {
            "analysis": f"Error en el análisis: {str(e)}",
            "subpregunta_1": "",
            "subpregunta_2": "",
            "subpregunta_3": ""
        }