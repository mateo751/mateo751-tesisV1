import os
import json
import traceback
import re
from openai import OpenAI
from django.conf import settings

# Instalar estas dependencias si no están ya instaladas
# pip install pdfminer.six PyPDF2 PyMuPDF habanero

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

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    print("PyMuPDF no está instalado. La extracción de texto puede ser limitada.")

try:
    import habanero
    HABANERO_AVAILABLE = True
except ImportError:
    HABANERO_AVAILABLE = False
    print("Habanero no está instalado. No se podrá consultar CrossRef.")

# Configurar el cliente de OpenAI
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))


def setup_science_parse():
    """
    Función de configuración simplificada sin Science-Parse
    """
    print("Inicializando sistema de extracción de metadatos PDF...")
    
    available_extractors = []
    if PDFMINER_AVAILABLE:
        available_extractors.append("pdfminer.six")
    if PYPDF2_AVAILABLE:
        available_extractors.append("PyPDF2")
    if PYMUPDF_AVAILABLE:
        available_extractors.append("PyMuPDF")
    
    if available_extractors:
        print(f"Extractores disponibles: {', '.join(available_extractors)}")
    else:
        print("ADVERTENCIA: No hay extractores de PDF disponibles")
        return False
    
    if HABANERO_AVAILABLE:
        print("CrossRef disponible para consultas de metadatos")
    else:
        print("ADVERTENCIA: CrossRef no disponible")
    
    if os.environ.get("OPENAI_API_KEY"):
        print("OpenAI API configurada")
    else:
        print("ADVERTENCIA: OpenAI API no configurada")
    
    print("Setup completado exitosamente.")
    return True


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


def extract_text_with_pymupdf(pdf_file_path):
    """Extrae texto y metadatos con PyMuPDF (más potente que pdfminer)"""
    if not PYMUPDF_AVAILABLE:
        return None
        
    try:
        doc = fitz.open(pdf_file_path)
        
        # Extraer metadatos del documento
        metadata = doc.metadata
        
        # Extraer texto de las primeras páginas
        text = ""
        # Extraer texto de portada, abstract y algunas páginas iniciales
        pages_to_extract = min(5, doc.page_count)
        for i in range(pages_to_extract):
            page = doc[i]
            text += page.get_text()
        
        return {
            'metadata': metadata,
            'text': text
        }
    except Exception as e:
        print(f"Error al extraer texto con PyMuPDF: {e}")
        return None


def extract_doi_from_text(text):
    """Extrae DOI del texto usando expresiones regulares"""
    # Patrón DOI: 10.XXXX/cualquier.cosa
    doi_pattern = r'\b(10\.\d{4,}(?:\.\d+)*\/(?:(?!["&\'])\S)+)\b'
    doi_match = re.search(doi_pattern, text)
    if doi_match:
        return doi_match.group(1)
    return None


def get_metadata_from_crossref(doi=None, title=None):
    """Obtiene metadatos completos desde CrossRef usando DOI o título"""
    if not HABANERO_AVAILABLE:
        return None
        
    try:
        cr = habanero.Crossref()
        
        if doi:
            # Buscar por DOI (más preciso)
            try:
                result = cr.works(ids=doi)
                if 'message' in result:
                    return parse_crossref_result(result['message'])
            except Exception as e:
                print(f"Error consultando CrossRef por DOI: {e}")
        
        if title:
            # Buscar por título como fallback
            try:
                results = cr.works(query=title, limit=1)
                if results and 'message' in results and 'items' in results['message'] and results['message']['items']:
                    return parse_crossref_result(results['message']['items'][0])
            except Exception as e:
                print(f"Error consultando CrossRef por título: {e}")
                
        return None
    except Exception as e:
        print(f"Error general al consultar CrossRef: {e}")
        return None
        

def parse_crossref_result(item):
    """Parsea el resultado de CrossRef a nuestro formato de metadatos"""
    try:
        # Extraer autores
        authors = []
        if 'author' in item:
            for author in item['author']:
                if 'given' in author and 'family' in author:
                    authors.append(f"{author['given']} {author['family']}")
                elif 'name' in author:
                    authors.append(author['name'])
        
        # Extraer año de publicación
        year = None
        if 'published-print' in item and 'date-parts' in item['published-print'] and item['published-print']['date-parts']:
            year = item['published-print']['date-parts'][0][0] if item['published-print']['date-parts'][0] else None
        elif 'published-online' in item and 'date-parts' in item['published-online'] and item['published-online']['date-parts']:
            year = item['published-online']['date-parts'][0][0] if item['published-online']['date-parts'][0] else None
        elif 'created' in item and 'date-parts' in item['created'] and item['created']['date-parts']:
            year = item['created']['date-parts'][0][0] if item['created']['date-parts'][0] else None
        
        # Extraer título
        title = ''
        if 'title' in item:
            if isinstance(item['title'], list) and item['title']:
                title = item['title'][0]
            else:
                title = item['title']
        
        # Extraer revista
        journal = ''
        if 'container-title' in item:
            if isinstance(item['container-title'], list) and item['container-title']:
                journal = item['container-title'][0]
            else:
                journal = item['container-title']
        
        # Construir objeto de metadatos
        metadata = {
            'title': title,
            'authors': ', '.join(authors) if authors else 'No disponible',
            'year': year,
            'journal': journal,
            'doi': item.get('DOI', ''),
            'abstract': item.get('abstract', '')
        }
        
        return metadata
    except Exception as e:
        print(f"Error al parsear resultado de CrossRef: {e}")
        traceback.print_exc()
        return None


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
            "year": 2023,
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


def extract_pdf_metadata_enhanced(pdf_file_path):
    """Flujo mejorado para extraer metadatos de PDFs académicos sin Science-Parse"""
    try:
        print(f"Iniciando extracción mejorada de: {pdf_file_path}")
        
        # 1. Intento rápido con PyMuPDF para obtener texto y metadatos básicos
        extracted_text = ""
        if PYMUPDF_AVAILABLE:
            pymupdf_result = extract_text_with_pymupdf(pdf_file_path)
            if pymupdf_result:
                extracted_text = pymupdf_result.get('text', '')
                print(f"Texto extraído con PyMuPDF: {len(extracted_text)} caracteres")
        
        # Si PyMuPDF no está disponible o falla, intentar con otros extractores
        if not extracted_text and PDFMINER_AVAILABLE:
            extracted_text = extract_text_with_pdfminer(pdf_file_path)
            print(f"Texto extraído con pdfminer: {len(extracted_text)} caracteres")
            
        if not extracted_text and PYPDF2_AVAILABLE:
            extracted_text = extract_text_from_pdf(pdf_file_path)
            print(f"Texto extraído con PyPDF2: {len(extracted_text)} caracteres")
        
        # 2. Intentar extraer DOI del texto
        doi = None
        if extracted_text:
            doi = extract_doi_from_text(extracted_text)
            if doi:
                print(f"DOI encontrado en el texto: {doi}")
        
        # 3. Si encontramos DOI, consultar CrossRef
        if doi and HABANERO_AVAILABLE:
            print(f"Consultando CrossRef con DOI: {doi}")
            cr_metadata = get_metadata_from_crossref(doi=doi)
            if cr_metadata and cr_metadata.get('title'):
                print("Metadatos obtenidos exitosamente de CrossRef por DOI")
                
                # Si no tenemos abstract pero tenemos texto extraído, usar las primeras 500 palabras
                if not cr_metadata.get('abstract') and extracted_text:
                    cr_metadata['abstract'] = ' '.join(extracted_text.split()[:500])
                
                return cr_metadata
        
        # 4. Intentar con título si tenemos texto pero no DOI o CrossRef falló
        if extracted_text:
            # Extraer título con heurística simple (primeras líneas no vacías)
            potential_title = ''
            for line in extracted_text.split('\n')[:10]:  # Revisar las primeras 10 líneas
                line = line.strip()
                if line and len(line) > 20 and len(line) < 300:
                    potential_title = line
                    break
            
            if potential_title and HABANERO_AVAILABLE:
                print(f"Intentando con título extraído: {potential_title}")
                cr_metadata = get_metadata_from_crossref(title=potential_title)
                if cr_metadata and cr_metadata.get('title'):
                    print("Metadatos obtenidos exitosamente de CrossRef con título")
                    
                    # Si no tenemos abstract pero tenemos texto extraído, usar las primeras 500 palabras
                    if not cr_metadata.get('abstract') and extracted_text:
                        cr_metadata['abstract'] = ' '.join(extracted_text.split()[:500])
                    
                    return cr_metadata
        
        # 5. Usar ChatGPT para análisis como último recurso
        if extracted_text:
            print("Usando ChatGPT para análisis de texto")
            filename = os.path.basename(pdf_file_path)
            return analyze_pdf_with_chatgpt(extracted_text, filename)
        
        # 6. Fallback final - devolver metadatos mínimos
        filename = os.path.basename(pdf_file_path)
        print(f"No se pudieron extraer metadatos. Devolviendo información básica para {filename}")
        return {
            'title': filename,
            'authors': 'No detectado automáticamente',
            'year': None,
            'journal': 'No detectado automáticamente',
            'doi': doi if doi else 'No detectado automáticamente',
            'abstract': extracted_text[:500] if extracted_text else "No se pudo extraer texto del PDF"
        }
    
    except Exception as e:
        print(f"Error general en el proceso de extracción mejorada: {e}")
        traceback.print_exc()
        filename = os.path.basename(pdf_file_path)
        return {
            'title': filename,
            'authors': 'Error en el proceso de extracción',
            'year': None,
            'journal': 'Error en el proceso de extracción',
            'doi': 'Error en el proceso de extracción',
            'abstract': f"Error en el proceso de extracción: {str(e)}"
        }


def extract_pdf_metadata(pdf_file_path):
    """
    Extrae metadatos de un PDF usando el flujo mejorado con fallbacks
    Esta función mantiene la interfaz original para compatibilidad
    """
    try:
        # Usar la nueva función mejorada
        print(f"Intentando extraer metadatos de: {pdf_file_path}")
        return extract_pdf_metadata_enhanced(pdf_file_path)
        
    except Exception as e:
        print(f"Error en extract_pdf_metadata: {e}")
        traceback.print_exc()
        
        # Fallback: devolver datos básicos
        filename = os.path.basename(pdf_file_path)
        return {
            'title': filename,
            'authors': 'Error en extracción',
            'year': None,
            'journal': 'Error en extracción',
            'doi': 'Error en extracción',
            'abstract': f"Error en extracción: {str(e)}"
        }


def analyze_with_chatgpt(metadata, subquestions):

    try:
        if not subquestions or len(subquestions) == 0:
            return {
                "analysis": "No hay preguntas para analizar",
                "pregunta_principal": "",
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
        
        Por favor, responde a las siguientes preguntas de forma CORTA y DIRECTA (máximo 10 palabras por respuesta):
        """
        
        # Agregar todas las preguntas disponibles
        question_count = 0
        if len(subquestions) > 0 and subquestions[0] and subquestions[0].strip():
            question_count += 1
            prompt += f"\nPregunta Principal: {subquestions[0]}"
            
        for i in range(1, min(len(subquestions), 4)):  # subpreguntas 1, 2, 3
            if subquestions[i] and subquestions[i].strip():
                question_count += 1
                prompt += f"\n{i}. {subquestions[i]}"
        
        if question_count == 0:
            return {
                "analysis": "No hay preguntas válidas para analizar",
                "pregunta_principal": "",
                "subpregunta_1": "",
                "subpregunta_2": "",
                "subpregunta_3": ""
            }
        
        prompt += "\n\nAdicionalmente, extrae 5-8 palabras clave técnicas en INGLÉS que mejor representen el contenido, metodología y enfoque del artículo.\n"
        prompt += "\nDevuelve tus respuestas en formato JSON con este formato exacto (incluye todas las preguntas aunque estén vacías):\n"
        prompt += """
        {
            "pregunta_principal": "Respuesta corta y concisa en formato de lista a la pregunta principal",
            "subpregunta_1": "Respuesta corta y concisa en formato de lista a la primera subpregunta",
            "subpregunta_2": "Respuesta corta y concisa en formato de lista a la segunda subpregunta",
            "subpregunta_3": "Respuesta corta y concisa en formato de lista a la tercera subpregunta",
            "keywords": "machine learning, neural networks, deep learning, classification, algorithm, COVID-19, symptom tracking",
            "analysis": "Un análisis corto y conciso si es necesario (máximo 10 palabras)"
        }
        """
        
        # Llamar a la API de ChatGPT
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un investigador especializado en análisis científico y mapeo de literatura. Respondes de forma concisa y directa."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000
        )
        
        result_text = response.choices[0].message.content
        
        # Intentar extraer el JSON de la respuesta
        json_match = re.search(r'({[\s\S]*})', result_text)
        if json_match:
            json_str = json_match.group(1)
            try:
                result = json.loads(json_str)
                # Asegurar que todas las preguntas y campos existan
                if 'pregunta_principal' not in result:
                    result['pregunta_principal'] = ""
                if 'subpregunta_1' not in result:
                    result['subpregunta_1'] = ""
                if 'subpregunta_2' not in result:
                    result['subpregunta_2'] = ""
                if 'subpregunta_3' not in result:
                    result['subpregunta_3'] = ""
                if 'keywords' not in result:
                    result['keywords'] = ""
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
            "pregunta_principal": "",
            "subpregunta_1": "",
            "subpregunta_2": "",
            "subpregunta_3": "",
            "keywords": "",
            "analysis": result_text  # Usar todo el texto como análisis si falla el parseo
        }
        
        # Intentar asignar párrafos a preguntas
        if len(clean_paragraphs) > 0:
            result["pregunta_principal"] = clean_paragraphs[0].strip()
        for i, p in enumerate(clean_paragraphs[1:4], 1):  # Tomar párrafos 1-3 para subpreguntas
            if p.strip():
                result[f"subpregunta_{i}"] = p.strip()
        
        return result
    except Exception as e:
        print(f"Error en el análisis con ChatGPT: {e}")
        traceback.print_exc()
        return {
            "analysis": f"Error en el análisis: {str(e)}",
            "pregunta_principal": "",
            "subpregunta_1": "",
            "subpregunta_2": "",
            "subpregunta_3": ""
        }