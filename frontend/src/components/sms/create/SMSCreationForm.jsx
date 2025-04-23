import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSMS } from '@/context/SMSContext';
import SMSBasicInfoStep from '@/components/sms/create/SMSBasicInfoStep';
import SMSSearchStep from '@/components/sms/create/SMSSearchStep';
import SMSCriteriaStep from '@/components/sms/create/SMSCriteriaStep';
import SMSStepIndicator from '@/components/sms/create/SMSStepIndicator';
import SMSNavButtons from '@/components/sms/create/SMSNavButtons';

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

const SMSCreationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { createSMS, loading, error } = useSMS();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando cambia
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

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    try {
      // Transformar los datos al formato que espera el backend
      const smsData = {
        titulo_estudio: formData.titulo_estudio.trim(),
        autores: formData.autores.trim(),
        preguntas_investigacion: [
          formData.pregunta_principal.trim(),
          ...(formData.subpregunta_1 ? [formData.subpregunta_1.trim()] : []),
          ...(formData.subpregunta_2 ? [formData.subpregunta_2.trim()] : []),
          ...(formData.subpregunta_3 ? [formData.subpregunta_3.trim()] : [])
        ].join('\n'),
        cadena_busqueda: formData.cadena_busqueda.trim(),
        anio_inicio: parseInt(formData.anio_inicio),
        anio_final: parseInt(formData.anio_final),
        criterios_inclusion: formData.criterios_inclusion ? formData.criterios_inclusion.trim() : '',
        criterios_exclusion: formData.criterios_exclusion ? formData.criterios_exclusion.trim() : '',
        estado: 'borrador'
      };

      // Log de los datos que se envían al servidor
      console.log('Datos que se envían al servidor:', smsData);
      console.log('Datos en formato JSON:', JSON.stringify(smsData, null, 2));

      const response = await createSMS(smsData);
      console.log('Respuesta del servidor:', response);
      navigate('/sms');
    } catch (err) {
      console.error('Error al crear el SMS:', err);
      // Mostrar el error específico del servidor si existe
      if (err.response?.data) {
        console.error('Error del servidor:', err.response.data);
        const errorMessages = [];
        
        // Procesar los mensajes de error del servidor
        Object.entries(err.response.data).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            errorMessages.push(`${field}: ${errors.join(', ')}`);
          } else if (typeof errors === 'string') {
            errorMessages.push(`${field}: ${errors}`);
          } else if (typeof errors === 'object') {
            errorMessages.push(`${field}: ${JSON.stringify(errors)}`);
          }
        });

        setErrors({
          submit: errorMessages.join('\n')
        });
      } else {
        setErrors({
          submit: 'Error al crear el SMS. Por favor, verifica los datos e intenta nuevamente.'
        });
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SMSBasicInfoStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <SMSSearchStep
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <SMSCriteriaStep
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
      <h1 className="text-2xl font-bold mb-6 text-center">Mapeos Sistemáticos</h1>
      
      <SMSStepIndicator currentStep={currentStep} totalSteps={3} />
      
      <form onSubmit={handleSubmit}>
        {renderStep()}
        
        <SMSNavButtons
          currentStep={currentStep}
          totalSteps={3}
          onNext={nextStep}
          onPrev={prevStep}
          isSubmitting={loading}
          isLastStep={currentStep === 3}
        />
      </form>
      
      {error && (
        <div className="alert alert-error mt-4">
          <p>{error}</p>
        </div>
      )}
      
      {errors.submit && (
        <div className="alert alert-error mt-4">
          <p>{errors.submit}</p>
        </div>
      )}
    </div>
  );
};

export default SMSCreationForm;