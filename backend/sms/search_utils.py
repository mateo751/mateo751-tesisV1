import spacy
from nltk.corpus import wordnet
import nltk
from collections import Counter
import re

try:
    from googletrans import Translator
    from deep_translator import GoogleTranslator
    TRANSLATION_AVAILABLE = True
except ImportError:
    TRANSLATION_AVAILABLE = False
    print("Librerías de traducción no disponibles. Usando solo métodos basados en embeddings.")

# Opción 2: Sentence Transformers
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    EMBEDDINGS_AVAILABLE = True
except ImportError:
    EMBEDDINGS_AVAILABLE = False

# Cargar modelos de spaCy
try:
    nlp_es = spacy.load("es_core_news_sm")
    nlp_en = spacy.load("en_core_web_sm")
except OSError:
    print("ERROR: Modelos de Spacy no encontrados.")
    nlp_es = spacy.blank("es")
    nlp_en = spacy.blank("en")

# Variable global para modelos
_sentence_model = None
_translator = None

def get_translator():
    """Inicializar traductor de forma lazy"""
    global _translator
    if _translator is None and TRANSLATION_AVAILABLE:
        try:
            _translator = GoogleTranslator(source='es', target='en')  # Cambio: traducir al inglés
        except Exception as e:
            print(f"Error inicializando traductor: {e}")
            return None
    return _translator

def get_sentence_model():
    """Cargar modelo de embeddings multilingüe"""
    global _sentence_model
    if _sentence_model is None and EMBEDDINGS_AVAILABLE:
        try:
            # Modelo que funciona bien en español
            _sentence_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        except Exception as e:
            print(f"Error cargando modelo: {e}")
            return None
    return _sentence_model

def translate_to_english(text):
    """Traduce texto del español al inglés"""
    if not TRANSLATION_AVAILABLE:
        return text
    
    try:
        translator = get_translator()
        if translator:
            result = translator.translate(text)
            return result if result else text
    except Exception as e:
        print(f"Error traduciendo '{text}': {e}")
    
    return text

def translate_to_spanish(text):
    """Traduce texto del inglés al español (mantenida para compatibilidad)"""
    if not TRANSLATION_AVAILABLE:
        return text
    
    try:
        # Crear traductor inverso para esta función
        reverse_translator = GoogleTranslator(source='en', target='es')
        result = reverse_translator.translate(text)
        return result if result else text
    except Exception as e:
        print(f"Error traduciendo '{text}': {e}")
    
    return text

def detect_language(text):
    """Detecta si el texto está en español o inglés"""
    doc_es = nlp_es(text)
    doc_en = nlp_en(text)
    
    es_count = sum(1 for token in doc_es if token.pos_ in ['NOUN', 'VERB', 'ADJ'])
    en_count = sum(1 for token in doc_en if token.pos_ in ['NOUN', 'VERB', 'ADJ'])
    
    return 'es' if es_count >= en_count else 'en'

def clean_text(text):
    """Limpia el texto"""
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

class EnglishSynonymGenerator:
    """Generador de sinónimos que garantiza resultados en inglés"""
    
    def __init__(self):
        self.model = get_sentence_model()
        
        # Sinónimos específicos críticos en inglés (alta prioridad)
        self.critical_synonyms = {
            'covid': ['coronavirus', 'sars-cov-2', 'covid-19', 'pandemic'],
            'covid-19': ['coronavirus', 'sars-cov-2', 'covid', 'pandemic'],
            'coronavirus': ['covid', 'sars-cov-2', 'covid-19', 'virus'],
            'sars-cov-2': ['covid', 'coronavirus', 'covid-19', 'virus'],
            'tracking': ['monitoring', 'surveillance', 'tracing', 'recording'],
            'symptoms': ['signs', 'manifestations', 'indicators', 'conditions'],
            'application': ['app', 'software', 'system', 'platform'],
            'mobile': ['smartphone', 'device', 'phone', 'cellular'],
            'health': ['medical', 'healthcare', 'wellness', 'clinical'],
            'contact': ['exposure', 'interaction', 'communication', 'connection'],
            'prevention': ['prophylaxis', 'protection', 'control', 'mitigation'],
            'diagnosis': ['detection', 'identification', 'assessment', 'screening'],
            'treatment': ['therapy', 'intervention', 'care', 'management'],
            'prediction': ['forecasting', 'modeling', 'estimation', 'projection'],
            'analysis': ['evaluation', 'assessment', 'examination', 'study'],
            'data': ['information', 'records', 'statistics', 'metrics'],
            'algorithm': ['method', 'technique', 'approach', 'model'],
            'machine learning': ['artificial intelligence', 'AI', 'ML', 'deep learning'],
            'neural network': ['deep learning', 'AI model', 'neural system', 'ML model']
        }
    
    def get_critical_synonyms(self, word, max_synonyms=3):
        """Obtiene sinónimos críticos predefinidos en inglés"""
        word_lower = word.lower()
        
        # Buscar en sinónimos críticos
        if word_lower in self.critical_synonyms:
            return self.critical_synonyms[word_lower][:max_synonyms]
        
        return []
    
    def get_wordnet_synonyms_english(self, word, max_synonyms=4):
        """Extrae sinónimos de WordNet en inglés"""
        synonyms = []
        
        # Traducir al inglés si es necesario
        english_word = word
        if detect_language(word) == 'es':
            english_word = translate_to_english(word)
        
        # Buscar sinónimos en inglés
        synsets_en = wordnet.synsets(english_word)
        for synset in synsets_en:
            for lemma in synset.lemmas():
                synonym = lemma.name().replace('_', ' ')
                if synonym.lower() != english_word.lower() and synonym not in synonyms:
                    synonyms.append(synonym)
                    if len(synonyms) >= max_synonyms:
                        return synonyms
        
        return synonyms[:max_synonyms]
    
    def generate_english_vocabulary_pool(self, word, context_size=50):
        """Genera un pool dinámico de vocabulario en inglés basado en la palabra"""
        if not EMBEDDINGS_AVAILABLE:
            return []
        
        # Traducir la palabra al inglés si es necesario
        english_word = word
        if detect_language(word) == 'es':
            english_word = translate_to_english(word)
        
        # Crear contextos en inglés para generar vocabulario relacionado
        medical_contexts = [
            f"The {english_word} is important for health",
            f"Symptoms of {english_word} include",
            f"Treatment for {english_word} requires",
            f"Prevention of {english_word} is fundamental",
            f"Patients with {english_word} need",
            f"Analysis of {english_word} shows",
            f"Monitoring {english_word} helps",
            f"Detection of {english_word} involves"
        ]
        
        # Usar spaCy inglés para generar vocabulario relacionado
        vocabulary_pool = set()
        
        for context in medical_contexts:
            doc = nlp_en(context)
            for token in doc:
                if (token.pos_ in ['NOUN', 'ADJ', 'VERB'] and 
                    not token.is_stop and 
                    len(token.text) > 3 and
                    token.text.lower() != english_word.lower()):
                    vocabulary_pool.add(token.lemma_)
        
        # Agregar vocabulario médico y técnico básico en inglés
        medical_vocab = [
            'disease', 'symptom', 'treatment', 'medicine', 'health', 'doctor',
            'hospital', 'patient', 'care', 'prevention', 'diagnosis',
            'medication', 'therapy', 'healing', 'infection', 'virus',
            'bacteria', 'pathogen', 'immunity', 'vaccine', 'antibody',
            'epidemic', 'pandemic', 'outbreak', 'contagion', 'transmission',
            'isolation', 'quarantine', 'protection', 'hygiene', 'disinfection',
            'control', 'monitoring', 'surveillance', 'tracking', 'recording',
            'documentation', 'registration', 'person', 'individual', 'citizen',
            'population', 'community', 'group', 'cohort', 'study',
            'research', 'analysis', 'test', 'examination', 'result',
            'application', 'software', 'system', 'platform', 'mobile',
            'smartphone', 'device', 'technology', 'digital', 'electronic',
            'data', 'information', 'algorithm', 'machine learning', 'AI',
            'artificial intelligence', 'neural network', 'model', 'prediction',
            'classification', 'detection', 'identification', 'assessment'
        ]
        
        vocabulary_pool.update(medical_vocab)
        return list(vocabulary_pool)[:context_size]
    
    def get_embeddings_synonyms(self, word, max_synonyms=4):
        """Usa embeddings para encontrar palabras similares en inglés"""
        if not self.model:
            return []
        
        try:
            # Traducir palabra al inglés si es necesario
            english_word = word
            if detect_language(word) == 'es':
                english_word = translate_to_english(word)
            
            # Generar pool dinámico de vocabulario en inglés
            vocabulary_pool = self.generate_english_vocabulary_pool(english_word)
            
            if not vocabulary_pool:
                return []
            
            # Calcular embeddings
            word_embedding = self.model.encode([english_word])
            pool_embeddings = self.model.encode(vocabulary_pool)
            
            # Calcular similitudes
            similarities = cosine_similarity(word_embedding, pool_embeddings)[0]
            
            # Obtener los más similares
            similar_indices = np.argsort(similarities)[::-1]
            synonyms = []
            
            for idx in similar_indices:
                candidate = vocabulary_pool[idx]
                similarity_score = similarities[idx]
                
                if (similarity_score > 0.3 and 
                    candidate.lower() != english_word.lower() and
                    candidate.lower() != word.lower() and
                    len(candidate) > 2):
                    synonyms.append(candidate)
                    if len(synonyms) >= max_synonyms:
                        break
            
            return synonyms
            
        except Exception as e:
            print(f"Error con embeddings para '{word}': {e}")
            return []
    
    def get_morphological_variants(self, word, max_synonyms=3):
        """Genera variantes morfológicas usando spaCy inglés"""
        if not word:
            return []
        
        # Traducir al inglés si es necesario
        english_word = word
        if detect_language(word) == 'es':
            english_word = translate_to_english(word)
        
        doc = nlp_en(english_word)
        variants = []
        
        for token in doc:
            # Obtener diferentes formas de la palabra
            if token.lemma_ != english_word.lower():
                variants.append(token.lemma_)
            
            # Si es un sustantivo, intentar formas relacionadas
            if token.pos_ == 'NOUN':
                # Buscar palabras de la misma familia en inglés
                base = token.lemma_
                potential_variants = [
                    base + 'tion',    # predict -> prediction
                    base + 'ment',    # treat -> treatment
                    base + 'ness',    # ill -> illness
                    base + 'ing',     # track -> tracking
                    'pre' + base,     # prevention
                    base + 'ic',      # diagnostic
                    base + 'al',      # medical
                    base + 'ed',      # infected
                ]
                
                # Variantes comunes en inglés médico/técnico
                if base.endswith('e'):
                    base_root = base[:-1]
                    potential_variants.extend([
                        base_root + 'ing',  # care -> caring
                        base_root + 'ation' # analyze -> analyzation
                    ])
                
                for variant in potential_variants:
                    if variant != english_word and len(variant) > 3:
                        variants.append(variant)
        
        # Filtrar y limitar
        unique_variants = list(set(variants))[:max_synonyms]
        return unique_variants
    
    def get_synonyms(self, word, max_synonyms=3):
        """Método principal que combina todas las estrategias para inglés"""
        all_synonyms = []
        
        # Estrategia 1: Sinónimos críticos predefinidos (MÁXIMA PRIORIDAD)
        critical_syns = self.get_critical_synonyms(word, max_synonyms)
        if critical_syns:
            return critical_syns[:max_synonyms]  # Devolver inmediatamente si hay críticos
        
        # Estrategia 2: WordNet en inglés
        wordnet_syns = self.get_wordnet_synonyms_english(word, max_synonyms)
        all_synonyms.extend(wordnet_syns)
        
        # Estrategia 3: Embeddings semánticos
        if len(all_synonyms) < max_synonyms:
            remaining = max_synonyms - len(all_synonyms)
            embedding_syns = self.get_embeddings_synonyms(word, remaining)
            all_synonyms.extend(embedding_syns)
        
        # Estrategia 4: Variantes morfológicas
        if len(all_synonyms) < max_synonyms:
            remaining = max_synonyms - len(all_synonyms)
            morph_syns = self.get_morphological_variants(word, remaining)
            all_synonyms.extend(morph_syns)
        
        # Eliminar duplicados manteniendo orden
        seen = set()
        unique_synonyms = []
        for syn in all_synonyms:
            if syn.lower() not in seen and syn.lower() != word.lower():
                seen.add(syn.lower())
                unique_synonyms.append(syn)
                if len(unique_synonyms) >= max_synonyms:
                    break
        
        return unique_synonyms[:max_synonyms]

class SpanishSynonymGenerator:
    """Generador de sinónimos que garantiza resultados en español"""
    
    def __init__(self):
        self.model = get_sentence_model()
        self.translator = get_translator()
        
        # Sinónimos específicos críticos (alta prioridad)
        self.critical_synonyms = {
            'covid': ['coronavirus', 'sars-cov-2', 'covid-19'],
            'covid-19': ['coronavirus', 'sars-cov-2', 'covid'],
            'coronavirus': ['covid', 'sars-cov-2', 'covid-19'],
            'sars-cov-2': ['covid', 'coronavirus', 'covid-19'],
        }
    
    def get_critical_synonyms(self, word, max_synonyms=3):
        """Obtiene sinónimos críticos predefinidos"""
        word_lower = word.lower()
        
        # Buscar en sinónimos críticos
        if word_lower in self.critical_synonyms:
            return self.critical_synonyms[word_lower][:max_synonyms]
        
        return []
    
    def get_wordnet_synonyms_spanish(self, word, max_synonyms=4):
        """Extrae sinónimos de WordNet y los traduce al español"""
        synonyms = []
        
        # Primero intentar en español directamente
        synsets_es = wordnet.synsets(word, lang='spa')
        for synset in synsets_es:
            for lemma in synset.lemmas('spa'):
                synonym = lemma.name().replace('_', ' ')
                if synonym.lower() != word.lower() and synonym not in synonyms:
                    synonyms.append(synonym)
                    if len(synonyms) >= max_synonyms:
                        return synonyms
        
        # Si no hay suficientes, intentar en inglés y traducir
        if len(synonyms) < max_synonyms and TRANSLATION_AVAILABLE:
            synsets_en = wordnet.synsets(word)
            for synset in synsets_en:
                for lemma in synset.lemmas():
                    english_synonym = lemma.name().replace('_', ' ')
                    spanish_synonym = translate_to_spanish(english_synonym)
                    
                    if (spanish_synonym and 
                        spanish_synonym.lower() != word.lower() and 
                        spanish_synonym not in synonyms and
                        spanish_synonym != english_synonym):  # Solo si se tradujo
                        synonyms.append(spanish_synonym)
                        if len(synonyms) >= max_synonyms:
                            break
                if len(synonyms) >= max_synonyms:
                    break
        
        return synonyms[:max_synonyms]
    
    def generate_spanish_vocabulary_pool(self, word, context_size=50):
        """Genera un pool dinámico de vocabulario en español basado en la palabra"""
        if not EMBEDDINGS_AVAILABLE:
            return []
        
        # Traducir la palabra al español si es necesario
        spanish_word = word
        if TRANSLATION_AVAILABLE:
            spanish_word = translate_to_spanish(word)
        
        # Crear contextos en español para generar vocabulario relacionado
        medical_contexts = [
            f"El {spanish_word} es importante para la salud",
            f"Los síntomas del {spanish_word} incluyen",
            f"El tratamiento para {spanish_word} requiere",
            f"La prevención de {spanish_word} es fundamental",
            f"Los pacientes con {spanish_word} necesitan"
        ]
        
        # Usar spaCy español para generar vocabulario relacionado
        vocabulary_pool = set()
        
        for context in medical_contexts:
            doc = nlp_es(context)
            for token in doc:
                if (token.pos_ in ['NOUN', 'ADJ', 'VERB'] and 
                    not token.is_stop and 
                    len(token.text) > 3 and
                    token.text.lower() != spanish_word.lower()):
                    vocabulary_pool.add(token.lemma_)
        
        # Agregar vocabulario médico básico en español
        medical_vocab = [
            'enfermedad', 'síntoma', 'tratamiento', 'medicina', 'salud', 'doctor',
            'hospital', 'paciente', 'cuidado', 'prevención', 'diagnóstico',
            'medicamento', 'terapia', 'curación', 'infección', 'virus',
            'bacteria', 'patógeno', 'inmunidad', 'vacuna', 'anticuerpo',
            'epidemia', 'pandemia', 'brote', 'contagio', 'transmisión',
            'aislamiento', 'cuarentena', 'protección', 'higiene', 'desinfección',
            'control', 'seguimiento', 'monitoreo', 'vigilancia', 'registro',
            'documentación', 'inscripción', 'persona', 'individuo', 'ciudadano',
            'población', 'comunidad', 'grupo', 'cohorte', 'estudio',
            'investigación', 'análisis', 'prueba', 'examen', 'resultado'
        ]
        
        vocabulary_pool.update(medical_vocab)
        return list(vocabulary_pool)[:context_size]
    
    def get_embeddings_synonyms(self, word, max_synonyms=4):
        """Usa embeddings para encontrar palabras similares en español"""
        if not self.model:
            return []
        
        try:
            # Traducir palabra al español si es necesario
            spanish_word = word
            if TRANSLATION_AVAILABLE:
                spanish_word = translate_to_spanish(word)
            
            # Generar pool dinámico de vocabulario
            vocabulary_pool = self.generate_spanish_vocabulary_pool(spanish_word)
            
            if not vocabulary_pool:
                return []
            
            # Calcular embeddings
            word_embedding = self.model.encode([spanish_word])
            pool_embeddings = self.model.encode(vocabulary_pool)
            
            # Calcular similitudes
            similarities = cosine_similarity(word_embedding, pool_embeddings)[0]
            
            # Obtener los más similares
            similar_indices = np.argsort(similarities)[::-1]
            synonyms = []
            
            for idx in similar_indices:
                candidate = vocabulary_pool[idx]
                similarity_score = similarities[idx]
                
                if (similarity_score > 0.3 and 
                    candidate.lower() != spanish_word.lower() and
                    candidate.lower() != word.lower() and
                    len(candidate) > 2):
                    synonyms.append(candidate)
                    if len(synonyms) >= max_synonyms:
                        break
            
            return synonyms
            
        except Exception as e:
            print(f"Error con embeddings para '{word}': {e}")
            return []
    
    def get_morphological_variants(self, word, max_synonyms=3):
        """Genera variantes morfológicas usando spaCy español"""
        if not word:
            return []
        
        # Traducir al español si es necesario
        spanish_word = word
        if TRANSLATION_AVAILABLE:
            spanish_word = translate_to_spanish(word)
        
        doc = nlp_es(spanish_word)
        variants = []
        
        for token in doc:
            # Obtener diferentes formas de la palabra
            if token.lemma_ != spanish_word.lower():
                variants.append(token.lemma_)
            
            # Si es un sustantivo, intentar formas relacionadas
            if token.pos_ == 'NOUN':
                # Buscar palabras de la misma familia
                base = token.lemma_
                potential_variants = [
                    base + 'ción',  # vacuna -> vacunación
                    base + 'miento',  # trata -> tratamiento
                    base + 'dad',     # enfermo -> enfermedad
                    base + 'ismo',    # 
                    'pre' + base,     # prevención
                    base + 'ico',     # diagnóstico
                ]
                
                for variant in potential_variants:
                    if variant != spanish_word and len(variant) > 3:
                        variants.append(variant)
        
        # Filtrar y limitar
        unique_variants = list(set(variants))[:max_synonyms]
        return unique_variants
    
    def get_synonyms(self, word, max_synonyms=3):
        """Método principal que combina todas las estrategias"""
        all_synonyms = []
        
        # Estrategia 1: Sinónimos críticos predefinidos (MÁXIMA PRIORIDAD)
        critical_syns = self.get_critical_synonyms(word, max_synonyms)
        if critical_syns:
            return critical_syns[:max_synonyms]  # Devolver inmediatamente si hay críticos
        
        # Estrategia 2: WordNet + traducción
        wordnet_syns = self.get_wordnet_synonyms_spanish(word, max_synonyms)
        all_synonyms.extend(wordnet_syns)
        
        # Estrategia 3: Embeddings semánticos
        if len(all_synonyms) < max_synonyms:
            remaining = max_synonyms - len(all_synonyms)
            embedding_syns = self.get_embeddings_synonyms(word, remaining)
            all_synonyms.extend(embedding_syns)
        
        # Estrategia 4: Variantes morfológicas
        if len(all_synonyms) < max_synonyms:
            remaining = max_synonyms - len(all_synonyms)
            morph_syns = self.get_morphological_variants(word, remaining)
            all_synonyms.extend(morph_syns)
        
        # Eliminar duplicados manteniendo orden
        seen = set()
        unique_synonyms = []
        for syn in all_synonyms:
            if syn.lower() not in seen and syn.lower() != word.lower():
                seen.add(syn.lower())
                unique_synonyms.append(syn)
                if len(unique_synonyms) >= max_synonyms:
                    break
        
        return unique_synonyms[:max_synonyms]

# Instancias globales de los generadores
_synonym_generator = None
_english_synonym_generator = None

def get_synonyms_english_only(word, max_synonyms=3):
    """
    Función principal para obtener sinónimos garantizando que sean en inglés
    """
    global _english_synonym_generator
    if _english_synonym_generator is None:
        _english_synonym_generator = EnglishSynonymGenerator()
    
    return _english_synonym_generator.get_synonyms(word, max_synonyms)

def get_synonyms_spanish_only(word, language='es', max_synonyms=3): 
    """
    Función principal para obtener sinónimos garantizando que sean en español
    """
    global _synonym_generator
    if _synonym_generator is None:
        _synonym_generator = SpanishSynonymGenerator()
    
    return _synonym_generator.get_synonyms(word, max_synonyms)

def extract_keywords_and_synonyms_english(title, min_terms=5, synonyms_per_term=3):
    """
    Extrae palabras clave y sinónimos en inglés
    """
    # Limpiar texto
    clean_title = clean_text(title)
    
    # Traducir al inglés si es necesario
    if detect_language(title) == 'es':
        clean_title = translate_to_english(clean_title)
    
    # Procesar el texto con spaCy inglés
    doc = nlp_en(clean_title)
    
    # Extraer palabras clave en inglés
    important_pos = ['NOUN', 'PROPN', 'ADJ', 'VERB']
    keywords = [token.lemma_.lower() for token in doc if token.pos_ in important_pos 
                and not token.is_stop and len(token.text) > 2]
    
    if len(keywords) < min_terms:
        additional_words = [token.lemma_.lower() for token in doc if not token.is_stop 
                           and len(token.text) > 2 and token.lemma_.lower() not in keywords]
        keywords.extend(additional_words)
    
    word_counts = Counter(keywords)
    top_keywords = [word for word, _ in word_counts.most_common(min_terms)]
    
    if len(top_keywords) < min_terms:
        remaining = min_terms - len(top_keywords)
        other_words = [token.text.lower() for token in doc if token.text.lower() not in top_keywords 
                       and len(token.text) > 2]
        top_keywords.extend(other_words[:remaining])
    
    top_keywords = top_keywords[:min_terms]
    
    # Generar sinónimos en inglés
    result = {}
    for word in top_keywords:
        synonyms = get_synonyms_english_only(word, synonyms_per_term)
        result[word] = synonyms
    
    return result

def extract_keywords_and_synonyms(title, min_terms=5, synonyms_per_term=3):
    """
    Versión actualizada que usa el nuevo sistema de sinónimos en español (mantenida para compatibilidad)
    """
    # Detectar idioma y limpiar texto
    language = detect_language(title)
    clean_title = clean_text(title)
    
    # Seleccionar el modelo según el idioma
    nlp = nlp_es if language == 'es' else nlp_en
    
    # Procesar el texto con spaCy
    doc = nlp(clean_title)
    
    # Extraer palabras clave
    important_pos = ['NOUN', 'PROPN', 'ADJ', 'VERB']
    keywords = [token.lemma_ for token in doc if token.pos_ in important_pos 
                and not token.is_stop and len(token.text) > 2]
    
    if len(keywords) < min_terms:
        additional_words = [token.lemma_ for token in doc if not token.is_stop 
                           and len(token.text) > 2 and token.lemma_ not in keywords]
        keywords.extend(additional_words)
    
    word_counts = Counter(keywords)
    top_keywords = [word for word, _ in word_counts.most_common(min_terms)]
    
    if len(top_keywords) < min_terms:
        remaining = min_terms - len(top_keywords)
        other_words = [token.text for token in doc if token.text.lower() not in top_keywords 
                       and len(token.text) > 2]
        top_keywords.extend(other_words[:remaining])
    
    top_keywords = top_keywords[:min_terms]
    
    # Generar sinónimos usando el nuevo sistema
    result = {}
    for word in top_keywords:
        synonyms = get_synonyms_spanish_only(word, language, synonyms_per_term)
        result[word] = synonyms
    
    return result

def generate_search_query(keywords_dict):
    """Genera cadena de búsqueda"""
    query_parts = []
    
    for keyword, synonyms in keywords_dict.items():
        if synonyms:
            terms = [keyword] + synonyms
            part = f"({' OR '.join(terms)})"
        else:
            part = keyword
        query_parts.append(part)
    
    return " AND ".join(query_parts)