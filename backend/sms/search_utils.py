import spacy
from nltk.corpus import wordnet
import nltk
from collections import Counter
import re

# Asegúrate de tener los modelos y recursos necesarios
try:
    # Descargar recursos de NLTK si es necesario
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
except:
    pass

# Cargar modelos de spaCy
try:
    nlp_es = spacy.load("es_core_news_sm")
    nlp_en = spacy.load("en_core_web_sm")
except OSError:
    # Si los modelos no están instalados, proporcionamos instrucciones
    print("ERROR: Modelos de Spacy no encontrados. Instala los modelos con:")
    print("python -m spacy download es_core_news_sm")
    print("python -m spacy download en_core_web_sm")
    # Usar un modelo vacío como fallback
    nlp_es = spacy.blank("es")
    nlp_en = spacy.blank("en")

def detect_language(text):
    """Detecta si el texto está principalmente en español o inglés"""
    # Simplificación: contar palabras en español vs inglés
    doc_es = nlp_es(text)
    doc_en = nlp_en(text)
    
    # Contamos cuántas palabras son reconocidas como tokens significativos
    es_count = sum(1 for token in doc_es if token.pos_ in ['NOUN', 'VERB', 'ADJ'])
    en_count = sum(1 for token in doc_en if token.pos_ in ['NOUN', 'VERB', 'ADJ'])
    
    return 'es' if es_count >= en_count else 'en'

def clean_text(text):
    """Limpia el texto eliminando caracteres especiales"""
    # Eliminar caracteres especiales y mantener solo letras, números y espacios
    text = re.sub(r'[^\w\s]', ' ', text)
    # Eliminar múltiples espacios
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def get_synonyms(word, language='en', max_synonyms=2):
    """Obtiene sinónimos de una palabra usando WordNet"""
    synonyms = []
    
    # Para español necesitamos ajustar el idioma en wordnet
    if language == 'es':
        synsets = wordnet.synsets(word, lang='spa')
    else:
        synsets = wordnet.synsets(word)
    
    # Extraer lemmas únicos (excluyendo la palabra original)
    for synset in synsets:
        for lemma in synset.lemmas():
            synonym = lemma.name().replace('_', ' ')
            if synonym.lower() != word.lower() and synonym not in synonyms:
                synonyms.append(synonym)
                if len(synonyms) >= max_synonyms:
                    return synonyms
    
    return synonyms[:max_synonyms]  # Devolver como máximo max_synonyms sinónimos

def extract_keywords_and_synonyms(title, min_terms=5, synonyms_per_term=2):
    """
    Extrae palabras clave del título y genera sinónimos.
    Args:
        title (str): Título del SMS
        min_terms (int): Número mínimo de términos a extraer
        synonyms_per_term (int): Número de sinónimos por término
    
    Returns:
        dict: Diccionario con términos y sus sinónimos
    """
    # Detectar idioma y limpiar texto
    language = detect_language(title)
    clean_title = clean_text(title)
    
    # Seleccionar el modelo según el idioma
    nlp = nlp_es if language == 'es' else nlp_en
    
    # Procesar el texto con spaCy
    doc = nlp(clean_title)
    
    # Extraer sustantivos, verbos y adjetivos significativos
    important_pos = ['NOUN', 'PROPN', 'ADJ', 'VERB']
    keywords = [token.lemma_ for token in doc if token.pos_ in important_pos 
                and not token.is_stop and len(token.text) > 2]
    
    # Si no tenemos suficientes palabras, incluir otras categorías
    if len(keywords) < min_terms:
        # Incluir todas las palabras que no sean stopwords
        additional_words = [token.lemma_ for token in doc if not token.is_stop 
                            and len(token.text) > 2 and token.lemma_ not in keywords]
        keywords.extend(additional_words)
    
    # Contar frecuencia de palabras
    word_counts = Counter(keywords)
    
    # Seleccionar las palabras más frecuentes primero, y luego completar
    # hasta tener al menos min_terms
    top_keywords = [word for word, _ in word_counts.most_common(min_terms)]
    
    # Si todavía no tenemos suficientes, incluir algunas stopwords significativas
    if len(top_keywords) < min_terms:
        remaining = min_terms - len(top_keywords)
        other_words = [token.text for token in doc if token.text.lower() not in top_keywords 
                        and len(token.text) > 2]
        top_keywords.extend(other_words[:remaining])
    
    # Limitar a los primeros min_terms
    top_keywords = top_keywords[:min_terms]
    
    # Generar sinónimos para cada palabra clave
    result = {}
    for word in top_keywords:
        synonyms = get_synonyms(word, language, synonyms_per_term)
        result[word] = synonyms
    
    return result

def generate_search_query(keywords_dict):
    """
    Genera una cadena de búsqueda a partir del diccionario de palabras clave y sinónimos.
    Args:
        keywords_dict (dict): Diccionario con términos y sinónimos
    
    Returns:
        str: Cadena de búsqueda formateada
    """
    query_parts = []
    
    for keyword, synonyms in keywords_dict.items():
        if synonyms:
            # Si hay sinónimos, crearemos una parte con OR
            terms = [keyword] + synonyms
            part = f"({' OR '.join(terms)})"
        else:
            # Si no hay sinónimos, solo usamos la palabra clave
            part = keyword
        
        query_parts.append(part)
    
    # Unir todas las partes con AND
    return " AND ".join(query_parts)