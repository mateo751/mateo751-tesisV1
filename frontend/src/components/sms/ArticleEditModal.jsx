// frontend/src/components/SMS/ArticleEditModal.jsx

import React, { useState, useEffect, useCallback  } from 'react';
import { FaSave, FaTimes, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { smsService } from '@/services/smsService';

const ArticleEditModal = ({ 
  isOpen, 
  onClose, 
  articleId, 
  smsId, 
  onSave = null 
}) => {
  const [formData, setFormData] = useState({
    titulo: '',
    autores: '',
    anio_publicacion: '',
    journal: '',
    doi: '',
    resumen: '',
    palabras_clave: '',
    metodologia: '',
    resultados: '',
    conclusiones: '',
    respuesta_subpregunta_1: '',
    respuesta_subpregunta_2: '',
    respuesta_subpregunta_3: '',
    estado: 'PENDING',
    notas: ''
  });
  
  const [smsInfo, setSmsInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Función para cargar datos del artículo con useCallback
  const loadArticleData = useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      setGeneralError('');
      
      const data = await smsService.getArticleDetails(smsId, articleId);
      
      // Cargar datos del artículo
      setFormData({
        titulo: data.titulo || '',
        autores: data.autores || '',
        anio_publicacion: data.anio_publicacion || '',
        journal: data.journal || '',
        doi: data.doi || '',
        resumen: data.resumen || '',
        palabras_clave: data.palabras_clave || '',
        metodologia: data.metodologia || '',
        resultados: data.resultados || '',
        conclusiones: data.conclusiones || '',
        respuesta_subpregunta_1: data.respuesta_subpregunta_1 || '',
        respuesta_subpregunta_2: data.respuesta_subpregunta_2 || '',
        respuesta_subpregunta_3: data.respuesta_subpregunta_3 || '',
        estado: data.estado || 'PENDING',
        notas: data.notas || ''
      });
      
      // Cargar información del SMS para contexto
      setSmsInfo(data.sms_info);
      
    } catch (error) {
      console.error('Error al cargar datos del artículo:', error);
      setGeneralError('Error al cargar los datos del artículo: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [smsId, articleId]); // Dependencias de useCallback

  // Cargar datos del artículo cuando se abra el modal
  useEffect(() => {
    if (isOpen && articleId && smsId) {
      loadArticleData();
    }
  }, [isOpen, articleId, smsId, loadArticleData]); // Ahora incluimos loadArticleData

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setErrors({});
      setGeneralError('');
      
      // Validar datos del lado del cliente
      const validation = smsService.validateArticleData(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }
      
      // Enviar datos al backend
      const response = await smsService.updateArticle(smsId, articleId, formData);
      
      // Notificar éxito y cerrar modal
      if (onSave) {
        onSave(response.article);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error al guardar artículo:', error);
      setGeneralError('Error al guardar los cambios: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({});
      setErrors({});
      setGeneralError('');
      setSmsInfo(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="w-11/12 max-w-5xl modal-box max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Editar Artículo</h3>
            {smsInfo && (
              <p className="text-sm text-gray-600">
                SMS: {smsInfo.titulo_estudio}
              </p>
            )}
          </div>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={handleClose}
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <FaSpinner className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Cargando datos del artículo...</span>
          </div>
        )}

        {/* Error General */}
        {generalError && (
          <div className="mb-4 alert alert-error">
            <FaExclamationTriangle />
            <span>{generalError}</span>
          </div>
        )}

        {/* Formulario */}
        {!loading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="p-4 rounded-lg bg-base-200">
              <h4 className="mb-4 text-lg font-semibold">Información Básica</h4>
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">
                    Título *
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.titulo ? 'input-error' : ''}`}
                    disabled={saving}
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-sm text-error">{errors.titulo}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">
                    Autores *
                  </label>
                  <input
                    type="text"
                    name="autores"
                    value={formData.autores}
                    onChange={handleChange}
                    className={`input input-bordered w-full ${errors.autores ? 'input-error' : ''}`}
                    disabled={saving}
                  />
                  {errors.autores && (
                    <p className="mt-1 text-sm text-error">{errors.autores}</p>
                  )}
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Año de Publicación
                  </label>
                  <input
                    type="number"
                    name="anio_publicacion"
                    value={formData.anio_publicacion}
                    onChange={handleChange}
                    min="1900"
                    max="2030"
                    className={`input input-bordered w-full ${errors.anio_publicacion ? 'input-error' : ''}`}
                    disabled={saving}
                  />
                  {errors.anio_publicacion && (
                    <p className="mt-1 text-sm text-error">{errors.anio_publicacion}</p>
                  )}
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Revista/Journal
                  </label>
                  <input
                    type="text"
                    name="journal"
                    value={formData.journal}
                    onChange={handleChange}
                    className="w-full input input-bordered"
                    disabled={saving}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-1 text-sm font-medium">
                    DOI
                  </label>
                  <input
                    type="text"
                    name="doi"
                    value={formData.doi}
                    onChange={handleChange}
                    placeholder="10.1000/journal.2023.123"
                    className={`input input-bordered w-full ${errors.doi ? 'input-error' : ''}`}
                    disabled={saving}
                  />
                  {errors.doi && (
                    <p className="mt-1 text-sm text-error">{errors.doi}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen y Contenido */}
            <div className="p-4 rounded-lg bg-base-200">
              <h4 className="mb-4 text-lg font-semibold">Contenido</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Resumen
                  </label>
                  <textarea
                    name="resumen"
                    value={formData.resumen}
                    onChange={handleChange}
                    rows={3}
                    className="w-full textarea textarea-bordered"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Respuestas a Subpreguntas */}
            {smsInfo && (
              <div className="p-4 rounded-lg bg-base-200">
                <h4 className="mb-4 text-lg font-semibold">Respuestas a Preguntas de Investigación</h4>
                
                <div className="space-y-4">
                  {smsInfo.subpregunta_1 && (
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        {smsInfo.subpregunta_1}
                      </label>
                      <textarea
                        name="respuesta_subpregunta_1"
                        value={formData.respuesta_subpregunta_1}
                        onChange={handleChange}
                        rows={2}
                        className="w-full textarea textarea-bordered"
                        disabled={saving}
                      />
                    </div>
                  )}
                  
                  {smsInfo.subpregunta_2 && (
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        {smsInfo.subpregunta_2}
                      </label>
                      <textarea
                        name="respuesta_subpregunta_2"
                        value={formData.respuesta_subpregunta_2}
                        onChange={handleChange}
                        rows={2}
                        className="w-full textarea textarea-bordered"
                        disabled={saving}
                      />
                    </div>
                  )}
                  
                  {smsInfo.subpregunta_3 && (
                    <div>
                      <label className="block mb-1 text-sm font-medium">
                        {smsInfo.subpregunta_3}
                      </label>
                      <textarea
                        name="respuesta_subpregunta_3"
                        value={formData.respuesta_subpregunta_3}
                        onChange={handleChange}
                        rows={2}
                        className="w-full textarea textarea-bordered"
                        disabled={saving}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-ghost"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={handleClose}></div>
    </dialog>
  );
};

export default ArticleEditModal;