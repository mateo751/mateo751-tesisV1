import { useState, useEffect} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSMS } from '@/context/SMSContext';
import { smsService } from '@/services/smsService';
import QuestionStep from '@/components/process/planning/QuestionStep';
import ScopingStep from '@/components/process/planning/ScopingStep';
import InclusionStep from '@/components/process/identification/InclusionStep';
import SourcesStep from '@/components/process/identification/SourcesStep';
import ExtractionStep from '@/components/process/extraction/ExtractionStep';
import ProcessTracker from '@/components/process/shared/ProcessTracker';
import StepNavigator from '@/components/process/shared/StepNavigator';

const initialFormData = {
  // Paso 1: Información básica
  titulo_estudio: '',
  autores: '',
  pregunta_principal: '',
  subpregunta_1: '',
  subpregunta_2: '',
  subpregunta_3: '',
  // Paso 2: Búsqueda
  cadena_busqueda: '',
  anio_inicio: 2000,
  anio_final: new Date().getFullYear(),
  // Paso 4: Fuentes de búsqueda
  fuentes: '',
  // Paso 3: Criterios
  criterios_inclusion: '',
  criterios_exclusion: '',
  // Paso 4: PDFs
  pdfFiles: [],
};

const ProcessManager = () => {
  const { id } = useParams(); // Obtener ID de la URL si existe
  const [smsId, setSmsId] = useState(id || null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { fetchSMSById } = useSMS();
  const [loading, setLoading] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [searchQuerySuggestion, setSearchQuerySuggestion] = useState(null);
  const [analyzedResults, setAnalyzedResults] = useState(null);

  // Cargar datos solo una vez al inicio
    useEffect(() => {
      if (dataInitialized) return;
      
      const initializeData = async () => {
          setLoading(true);
          try {
              // ... código existente ...
              
              // Cargar resultados analizados desde localStorage si existen
              const savedAnalyzedResults = localStorage.getItem('sms_analyzed_results');
              if (savedAnalyzedResults) {
                  try {
                      const parsedResults = JSON.parse(savedAnalyzedResults);
                      setAnalyzedResults(parsedResults);
                  } catch (error) {
                      console.error('Error al parsear resultados analizados:', error);
                      localStorage.removeItem('sms_analyzed_results');
                  }
              }
              
              setDataInitialized(true);
          } catch (error) {
              console.error('Error al inicializar datos:', error);
              // Limpiar localStorage en caso de error
              localStorage.removeItem('sms_draft');
              localStorage.removeItem('sms_step');
              localStorage.removeItem('sms_id');
              localStorage.removeItem('sms_analyzed_results');
          } finally {
              setLoading(false);
          }
      };
      
      initializeData();
  }, [id, fetchSMSById, dataInitialized]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Para campos numéricos, convertir el valor a número si es necesario
    let finalValue = value;
    if (name === 'anio_inicio' || name === 'anio_final') {
      finalValue = value === '' ? '' : Number(value);
    }
    
    // Actualizar el estado local del formulario
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: finalValue
      };
      
      // Guardar en localStorage
      localStorage.setItem('sms_draft', JSON.stringify(updated));
      
      return updated;
    });
    
    // Limpiar errores
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Nuevo manejador para la generación de cadenas de búsqueda
  const handleSearchQueryGeneration = (result) => {
    console.log('Resultado de la generación de cadena de búsqueda:', result);
    
    // Guardar la sugerencia para mostrarla en el siguiente paso
    setSearchQuerySuggestion(result);
    
    // Movernos al siguiente paso si todo está validado
    if (validateStep(currentStep)) {
      nextStep();
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.titulo_estudio.trim()) newErrors.titulo_estudio = 'El título es obligatorio';
      if (!formData.autores.trim()) newErrors.autores = 'El autor es obligatorio';
      if (!formData.pregunta_principal.trim()) newErrors.pregunta_principal = 'La pregunta principal es obligatoria';
    }
    
    if (step === 2) {
      if (!formData.cadena_busqueda.trim()) newErrors.cadena_busqueda = 'La cadena de búsqueda es obligatoria';
      if (formData.anio_inicio > formData.anio_final) {
        newErrors.anio_inicio = 'El año de inicio debe ser menor que el año final';
      }
    }
    
    if (step === 3) {
      if (!formData.criterios_inclusion.trim()) {
        newErrors.criterios_inclusion = 'Los criterios de inclusión son obligatorios';
      }
      if (!formData.criterios_exclusion.trim()) {
        newErrors.criterios_exclusion = 'Los criterios de exclusión son obligatorios';
      }
    }
    
    if (step === 4) {
      if (!formData.pdfFiles || formData.pdfFiles.length === 0) {
        newErrors.pdfFiles = 'Debe cargar al menos un PDF';
      }
    }
    
    if (step === 5) {
      // Para el paso 5, podríamos requerir que se hayan analizado los PDFs
      if (!analyzedResults || analyzedResults.length === 0) {
        newErrors.extraction = 'Debe analizar al menos un PDF antes de continuar';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) return;
  
    try {
      setIsSaving(true);
      
      // Procesar según el paso actual
      if (currentStep === 1) {
        let currentSmsId = smsId;
        
        if (!currentSmsId) {
          // Crear SMS inicial si no existe - incluir todos los campos obligatorios
          const basicData = {
            titulo_estudio: formData.titulo_estudio,
            autores: formData.autores,
            pregunta_principal: formData.pregunta_principal,
            subpregunta_1: formData.subpregunta_1 || '',
            subpregunta_2: formData.subpregunta_2 || '',
            subpregunta_3: formData.subpregunta_3 || '',
            // Añadir campos obligatorios con valores temporales
            cadena_busqueda: '(pendiente)', // Campo obligatorio
            fuentes: 'Por definir',
            anio_inicio: formData.anio_inicio || 2000,
            anio_final: formData.anio_final || new Date().getFullYear(),
            criterios_inclusion: 'Por definir',
            criterios_exclusion: 'Por definir'
          };
          
          console.log('Enviando datos con valores por defecto:', basicData);
          const response = await smsService.createInitialSMS(basicData);
          console.log('SMS creado con éxito:', response);
          
          if (!response || !response.id) {
            throw new Error('No se recibió un ID válido del servidor al crear el SMS');
          }
          
          currentSmsId = response.id;
          setSmsId(currentSmsId);
          
          // Guardar el ID en localStorage
          localStorage.setItem('sms_id', currentSmsId.toString());
        } else {
          // Si ya existe un ID, actualizar las preguntas
          await smsService.updateSMSQuestions(currentSmsId, {
            pregunta_principal: formData.pregunta_principal,
            subpregunta_1: formData.subpregunta_1 || '',
            subpregunta_2: formData.subpregunta_2 || '',
            subpregunta_3: formData.subpregunta_3 || '',
          });
        }
        
        // Avanzar al siguiente paso
        localStorage.setItem('sms_draft', JSON.stringify(formData));
        localStorage.setItem('sms_step', "2");
        setCurrentStep(2);
        
      } else if (currentStep === 2) {
        // En el paso 2, actualizar la cadena de búsqueda y años (sin fuentes)
        if (!smsId) {
          throw new Error('No se encontró un ID válido para el SMS');
        }
        
        // Asegurarse de enviar los valores correctos (sin fuentes)
        const criteriaData = {
          cadena_busqueda: formData.cadena_busqueda.trim(),
          anio_inicio: Number(formData.anio_inicio),
          anio_final: Number(formData.anio_final)
          // Ya no enviamos fuentes aquí
        };
        
        // Actualizar los criterios de búsqueda
        await smsService.updateSMSCriteria(smsId, criteriaData);
        
        // Avanzar al siguiente paso
        localStorage.setItem('sms_draft', JSON.stringify(formData));
        localStorage.setItem('sms_step', "3");
        setCurrentStep(3);
        
      } else if (currentStep === 3) {
        // En el paso 3, actualizar criterios de inclusión/exclusión
        if (!smsId) {
          throw new Error('No se encontró un ID válido para el SMS');
        }
        
        // Guardar criterios
        await smsService.updateSMSCriteria(smsId, {
          criterios_inclusion: formData.criterios_inclusion.trim(),
          criterios_exclusion: formData.criterios_exclusion.trim(),
        });
        
        // Avanzar al paso 4
        localStorage.setItem('sms_draft', JSON.stringify(formData));
        localStorage.setItem('sms_step', "4");
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // En el paso 4, guardar fuentes y avanzar al paso 5 (extracción)
        if (!smsId) {
          throw new Error('No se encontró un ID válido para el SMS');
        }

        // Guardar fuentes
        await smsService.updateSMSCriteria(smsId, {
          fuentes: formData.fuentes.trim(),
        });

        // Avanzar al paso 5
        localStorage.setItem('sms_draft', JSON.stringify(formData));
        localStorage.setItem('sms_step', "5");
        setCurrentStep(5);
      } else if (currentStep === 5) {
        // En el paso 5, ya hemos procesado los PDFs,
        // así que podemos finalizar directamente

        // Limpiar localStorage
        localStorage.removeItem('sms_draft');
        localStorage.removeItem('sms_step');
        localStorage.removeItem('sms_id');
        
        // Redirigir a la lista de SMS
        navigate('/sms');
      } else {
        // Si llegamos aquí, estamos en un paso no contemplado
        // (solo por seguridad)
        localStorage.setItem('sms_step', (currentStep + 1).toString());
        localStorage.setItem('sms_draft', JSON.stringify(formData));
        setCurrentStep(prev => prev + 1);
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      setErrors({ 
        general: "Error al guardar: " + (error.response?.data?.detail || error.message)
      });
    } finally {
      setIsSaving(false);
    }
  };

  const prevStep = () => {
    // Limpiar la sugerencia de cadena de búsqueda al volver atrás
    if (currentStep === 2) {
      setSearchQuerySuggestion(null);
    }
    
    // Guardar el paso anterior en localStorage
    localStorage.setItem('sms_step', (currentStep - 1).toString());
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    try {
        setIsSaving(true);
        
        // Verificar que tengamos un ID válido
        if (!smsId) {
            throw new Error('No se encontró el ID del SMS. Por favor, vuelva al inicio del proceso.');
        }
        
        // Limpiar localStorage
        localStorage.removeItem('sms_draft');
        localStorage.removeItem('sms_step');
        localStorage.removeItem('sms_id');
        localStorage.removeItem('sms_analyzed_results'); // Añadir esta línea
        
        // Redirigir a la lista de SMS
        navigate('/sms');
    } catch (error) {
        console.error('Error al finalizar:', error);
        setErrors({ 
            general: "Error al finalizar: " + (error.response?.data?.detail || error.message)
        });
    } finally {
        setIsSaving(false);
    }
};

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <QuestionStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            handleSearchQueryGeneration={handleSearchQueryGeneration}
          />
        );
      case 2:
        return (
          <ScopingStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            searchQuerySuggestion={searchQuerySuggestion}
          />
        );
      case 3:
        return (
          <InclusionStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <SourcesStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
        case 5:
          return (
              <ExtractionStep
                  formData={formData}
                  smsId={smsId}
                  analyzedResults={analyzedResults}
                  onAnalyzeComplete={(results) => {
                      setAnalyzedResults(results);
                      // Guardar en localStorage para persistencia
                      localStorage.setItem('sms_analyzed_results', JSON.stringify(results));
                  }}
              />
          );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl p-6 mx-auto rounded-lg shadow-lg bg-base-100">
      <h1 className="mb-6 text-2xl font-bold text-center">
        {smsId ? 'Editar Mapeo Sistemático' : 'Nuevo Mapeo Sistemático'}
      </h1>
      
      <ProcessTracker currentStep={currentStep} totalSteps={5} />
      
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="mb-4 alert alert-error">
            <p>{errors.general}</p>
          </div>
        )}
        
        {renderStep()}
        
        <StepNavigator
          currentStep={currentStep}
          totalSteps={5}
          onNext={nextStep}
          onPrev={prevStep}
          isSubmitting={isSaving}
          isLastStep={currentStep === 5}
        />
      </form>
    </div>
  );
};

export default ProcessManager;