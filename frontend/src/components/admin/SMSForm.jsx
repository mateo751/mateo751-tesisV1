// src/pages/admin/components/SMSForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSMS } from '@/context/SMSContext';

const initialFormState = {
  title: '',
  description: '',
  researchQuestions: '',
  inclusionCriteria: '',
  exclusionCriteria: '',
  searchString: '',
  status: 'draft',
};

const SMSForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  
  const { createSMS, updateSMS, fetchSMSById, currentSMS, loading, error } = useSMS();
  
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // Cargar datos si estamos editando
  useEffect(() => {
    const loadSMS = async () => {
      if (isEditing) {
        const smsData = await fetchSMSById(id);
        if (smsData) {
          // Formatear los datos para el formulario
          setFormData({
            title: smsData.title || '',
            description: smsData.description || '',
            researchQuestions: smsData.researchQuestions || '',
            inclusionCriteria: smsData.inclusionCriteria || '',
            exclusionCriteria: smsData.exclusionCriteria || '',
            searchString: smsData.searchString || '',
            status: smsData.status || 'draft',
          });
        }
      }
    };
    
    loadSMS();
  }, [isEditing, id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Limpiar el error del campo cuando se modifica
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'El título es obligatorio';
    if (!formData.description.trim()) errors.description = 'La descripción es obligatoria';
    if (!formData.researchQuestions.trim()) errors.researchQuestions = 'Las preguntas de investigación son obligatorias';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      if (isEditing) {
        await updateSMS(id, formData);
        navigate(`/admin/sms/${id}`);
      } else {
        const newSMS = await createSMS(formData);
        if (newSMS) {
          navigate(`/admin/sms/${newSMS.id}`);
        }
      }
    } catch (err) {
      console.error('Error saving SMS:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
if (loading && isEditing) return <div className="text-center py-4">Cargando...</div>;

return (
        <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isEditing ? 'Editar SMS' : 'Crear Nuevo SMS'}
        </h2>
        
        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
            </div>
        )}
        
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Título *
            </label>
            <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Título del Systematic Mapping Study"
            />
            {formErrors.title && (
                <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>
            )}
            </div>
            
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Descripción *
            </label>
            <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                rows="4"
                placeholder="Describe el propósito del SMS"
            ></textarea>
            {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
            )}
            </div>
            
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="researchQuestions">
                Preguntas de Investigación *
            </label>
            <textarea
                id="researchQuestions"
                name="researchQuestions"
                value={formData.researchQuestions}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg ${formErrors.researchQuestions ? 'border-red-500' : 'border-gray-300'}`}
                rows="3"
                placeholder="Ingresa las preguntas de investigación (una por línea)"
            ></textarea>
            {formErrors.researchQuestions && (
                <p className="text-red-500 text-xs mt-1">{formErrors.researchQuestions}</p>
            )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="inclusionCriteria">
                Criterios de Inclusión
                </label>
                <textarea
                id="inclusionCriteria"
                name="inclusionCriteria"
                value={formData.inclusionCriteria}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Criterios para incluir estudios"
                ></textarea>
            </div>
            
            <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="exclusionCriteria">
                Criterios de Exclusión
                </label>
                <textarea
                id="exclusionCriteria"
                name="exclusionCriteria"
                value={formData.exclusionCriteria}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Criterios para excluir estudios"
                ></textarea>
            </div>
            </div>
            
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="searchString">
                Cadena de Búsqueda
            </label>
            <textarea
                id="searchString"
                name="searchString"
                value={formData.searchString}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows="2"
                placeholder="Cadena de búsqueda para bases de datos"
            ></textarea>
            </div>
            
            <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                Estado
            </label>
            <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="archived">Archivado</option>
            </select>
            </div>
            
            <div className="flex justify-end space-x-3">
            <button
                type="button"
                onClick={() => navigate('/sms')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                disabled={submitting}
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                disabled={submitting}
            >
                {submitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
            </div>
        </form>
        </div>
    );
};

export default SMSForm;