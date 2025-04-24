import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSMS } from '@/context/SMSContext';
import { smsService } from '@/services/smsService';
import QuestionStep from '@/components/process/planning/QuestionStep';
import ScopingStep from '@/components/process/planning/ScopingStep';
import InclusionStep from '@/components/process/identification/InclusionStep';
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

  // Usar useCallback para memoizar la función loadSMSData
  const loadSMSData = useCallback(async (id) => {
    if (!id) {
      console.log('No hay ID para cargar datos');
      return;
    }

    try {
      setLoading(true);
      const data = await fetchSMSById(id);
      if (data) {
        setFormData({
          titulo_estudio: data.titulo_estudio || '',
          autores: data.autores || '',
          pregunta_principal: data.pregunta_principal || '',
          subpregunta_1: data.subpregunta_1 || '',
          subpregunta_2: data.subpregunta_2 || '',
          subpregunta_3: data.subpregunta_3 || '',
          cadena_busqueda: data.cadena_busqueda || '',
          anio_inicio: data.anio_inicio || 2000,
          anio_final: data.anio_final || new Date().getFullYear(),
          criterios_inclusion: data.criterios_inclusion || '',
          criterios_exclusion: data.criterios_exclusion || '',
        });
      } else {
        throw new Error('No se encontraron datos para el SMS');
      }
    } catch (error) {
      console.error('Error al cargar los datos:', error);
      setErrors({ general: "Error al cargar los datos: " + error.message });
      // Si hay error al cargar, limpiamos el localStorage
      localStorage.removeItem('sms_draft');
      localStorage.removeItem('sms_step');
      localStorage.removeItem('sms_id');
      // Redirigir al inicio si hay error al cargar
      navigate('/sms');
    } finally {
      setLoading(false);
    }
  }, [fetchSMSById, navigate]);

  // Cargar datos si hay un ID existente
  useEffect(() => {
    const checkSavedData = async () => {
      // Evitar múltiples llamadas si ya estamos cargando datos
      if (loading) return;
      
      try {
        // Intentar cargar del localStorage
        const savedData = localStorage.getItem('sms_draft');
        const savedStep = localStorage.getItem('sms_step');
        const savedId = localStorage.getItem('sms_id');
        
        if (smsId) {
          // Si hay un ID en la URL, cargamos del servidor
          await loadSMSData(smsId);
          if (savedStep) {
            setCurrentStep(parseInt(savedStep));
          }
        } else if (savedId) {
          // Si hay un ID guardado localmente, lo usamos
          setSmsId(savedId);
          await loadSMSData(savedId);
          if (savedStep) {
            setCurrentStep(parseInt(savedStep));
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
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
        // Si hay error al cargar, limpiamos el localStorage para evitar futuros errores
        localStorage.removeItem('sms_draft');
        localStorage.removeItem('sms_step');
        localStorage.removeItem('sms_id');
      }
    };
    
    checkSavedData();
  }, [smsId]); // Solo depender de smsId

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
            cadena_busqueda: formData.cadena_busqueda || '(pendiente)', // Campo obligatorio
            fuentes: formData.fuentes || 'Por definir',
            anio_inicio: formData.anio_inicio || 2000,
            anio_final: formData.anio_final || new Date().getFullYear(),
            criterios_inclusion: formData.criterios_inclusion || 'Por definir',
            criterios_exclusion: formData.criterios_exclusion || 'Por definir'
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
          localStorage.setItem('sms_draft', JSON.stringify(formData));
          localStorage.setItem('sms_step', currentStep.toString());
          
          // Esperar un momento para asegurar que el estado se actualice
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      
        // Solo actualizar criterios si tenemos un ID válido
        if (currentSmsId) {
          try {
            await smsService.updateSMSCriteria(currentSmsId, {
              cadena_busqueda: formData.cadena_busqueda || '(pendiente)',
              anio_inicio: formData.anio_inicio || 2000,
              anio_final: formData.anio_final || new Date().getFullYear(),
            });
          } catch (error) {
            console.error('Error al actualizar criterios:', error);
            throw new Error('Error al actualizar criterios: ' + error.message);
          }
        } else {
          throw new Error('No se pudo obtener un ID válido para el SMS');
        }
      }
      
      // Si todo va bien, avanzamos al siguiente paso
      setCurrentStep(prev => prev + 1);
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
      
      // Validar que los criterios no estén vacíos
      if (!formData.criterios_inclusion.trim() || !formData.criterios_exclusion.trim()) {
        setErrors({
          general: "Los criterios de inclusión y exclusión son obligatorios"
        });
        return;
      }
      
      // Guardar criterios de inclusión/exclusión
      await smsService.updateSMSCriteria(smsId, {
        criterios_inclusion: formData.criterios_inclusion.trim(),
        criterios_exclusion: formData.criterios_exclusion.trim(),
      });

      // Limpiar localStorage
      localStorage.removeItem('sms_draft');
      localStorage.removeItem('sms_step');
      localStorage.removeItem('sms_id');
      
      navigate('/sms');
    } catch (error) {
      console.error('Error al guardar criterios:', error);
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
          />
        );
      case 2:
        return (
          <ScopingStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
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
      default:
        return null;
    }
  };

  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {smsId ? 'Editar Mapeo Sistemático' : 'Nuevo Mapeo Sistemático'}
      </h1>
      
      <ProcessTracker currentStep={currentStep} totalSteps={3} />
      
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="alert alert-error mb-4">
            <p>{errors.general}</p>
          </div>
        )}
        
        {renderStep()}
        
        <StepNavigator
          currentStep={currentStep}
          totalSteps={3}
          onNext={nextStep}
          onPrev={prevStep}
          isSubmitting={isSaving}
          isLastStep={currentStep === 3}
        />
      </form>
    </div>
  );
};

export default ProcessManager;