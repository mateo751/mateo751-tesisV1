import { useState, useEffect} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSMS } from '@/context/SMSContext';
import { smsService } from '@/services/smsService';
import QuestionStep from '@/components/process/planning/QuestionStep';
import ScopingStep from '@/components/process/planning/ScopingStep';
import InclusionStep from '@/components/process/identification/InclusionStep';
import SourcesStep from '@/components/process/identification/SourcesStep';
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

  // Cargar datos solo una vez al inicio
  useEffect(() => {
    if (dataInitialized) return;
    
    const initializeData = async () => {
      setLoading(true);
      try {
        // Intentar cargar del localStorage
        const savedData = localStorage.getItem('sms_draft');
        const savedStep = localStorage.getItem('sms_step');
        const savedId = localStorage.getItem('sms_id');
        
        let idToUse = id || savedId || null;
        
        if (idToUse) {
          // Si hay un ID, cargamos del servidor
          const data = await fetchSMSById(idToUse);
          if (data) {
            setSmsId(idToUse);
            setFormData({
              titulo_estudio: data.titulo_estudio || '',
              autores: data.autores || '',
              pregunta_principal: data.pregunta_principal || '',
              subpregunta_1: data.subpregunta_1 || '',
              subpregunta_2: data.subpregunta_2 || '',
              subpregunta_3: data.subpregunta_3 || '',
              cadena_busqueda: data.cadena_busqueda && data.cadena_busqueda !== '(pendiente)' 
                ? data.cadena_busqueda : '',
              anio_inicio: data.anio_inicio || 2000,
              anio_final: data.anio_final || new Date().getFullYear(),
              fuentes: data.fuentes && data.fuentes !== 'Por definir' ? data.fuentes : '',
              criterios_inclusion: data.criterios_inclusion && data.criterios_inclusion !== 'Por definir' 
                ? data.criterios_inclusion : '',
              criterios_exclusion: data.criterios_exclusion && data.criterios_exclusion !== 'Por definir' 
                ? data.criterios_exclusion : '',
            });
            
            if (savedStep) {
              setCurrentStep(parseInt(savedStep));
            }
          }
        } else if (savedData) {
          // Si solo hay datos locales, los cargamos
          try {
            const parsedData = JSON.parse(savedData);
            setFormData(parsedData);
            if (savedStep) {
              setCurrentStep(parseInt(savedStep));
            }
          } catch (error) {
            console.error('Error al parsear datos guardados:', error);
            localStorage.removeItem('sms_draft');
            localStorage.removeItem('sms_step');
          }
        }
        
        setDataInitialized(true);
      } catch (error) {
        console.error('Error al inicializar datos:', error);
        // Si hay error, limpiamos el localStorage
        localStorage.removeItem('sms_draft');
        localStorage.removeItem('sms_step');
        localStorage.removeItem('sms_id');
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
      if (!formData.fuentes.trim()) {
        newErrors.fuentes = 'Las fuentes de búsqueda son obligatorias';
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
      
      // Guardar fuentes de búsqueda (nuevo paso 4)
      await smsService.updateSMSCriteria(smsId, {
        fuentes: formData.fuentes.trim(),
      });

      // Limpiar localStorage
      localStorage.removeItem('sms_draft');
      localStorage.removeItem('sms_step');
      localStorage.removeItem('sms_id');
      
      // Redirigir a la lista de SMS
      navigate('/sms');
    } catch (error) {
      console.error('Error al guardar fuentes:', error);
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
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {smsId ? 'Editar Mapeo Sistemático' : 'Nuevo Mapeo Sistemático'}
      </h1>
      
      <ProcessTracker currentStep={currentStep} totalSteps={4} />
      
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="alert alert-error mb-4">
            <p>{errors.general}</p>
          </div>
        )}
        
        {renderStep()}
        
        <StepNavigator
          currentStep={currentStep}
          totalSteps={4}
          onNext={nextStep}
          onPrev={prevStep}
          isSubmitting={isSaving}
          isLastStep={currentStep === 4}
        />
      </form>
    </div>
  );
};

export default ProcessManager;