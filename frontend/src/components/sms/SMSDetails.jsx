// frontend/src/components/SMS/SMSDetails.jsx - Versión completa con tabla mejorada
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTable, FaChartBar, FaFileExport, FaEye } from 'react-icons/fa';
import { useSMS } from '@/context/SMSContext';
import { smsService } from '@/services/smsService';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
import ArticleEditModal from '@/components/sms/ArticleEditModal';

const SMSDetails = () => {
  const { id } = useParams();
  const { smsList } = useSMS();
  
  // Estados principales
  const [sms, setSms] = useState(null);
  const [articles, setArticles] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Estados para la tabla mejorada
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const itemsPerPage = 10;

  // Estados para edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);

  // Calcular artículos filtrados y paginación
  const filteredArticles = useMemo(() => {
    let filtered = articles;
    
    if (statusFilter) {
      filtered = articles.filter(article => article.estado === statusFilter);
    }
    
    return filtered;
  }, [articles, statusFilter]);

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Resetear página cuando cambie el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const loadSMSDetails = useCallback(async () => {
    try {
      console.log('Cargando detalles para SMS ID:', id);
      setLoading(true);
      setError(null);
      
      // Verificar si tenemos datos completos en la lista
      const existingSMS = smsList.find(s => s.id.toString() === id.toString());
      console.log('SMS existente en lista:', existingSMS);
      
      // Verificar si los datos están completos
      const hasCompleteData = existingSMS && (
        existingSMS.subpregunta_1 !== undefined ||
        existingSMS.criterios_inclusion !== undefined ||
        existingSMS.cadena_busqueda !== undefined
      );
      
      if (hasCompleteData) {
        console.log('Usando datos completos del contexto');
        setSms(existingSMS);
        setLoading(false);
        return;
      }
      
      // Cargar detalles completos desde la API
      console.log('Cargando detalles completos desde API...');
      let smsData;
      
      if (smsService.getSMSDetails) {
        smsData = await smsService.getSMSDetails(id);
      } else {
        smsData = await smsService.getSMSById(id);
      }
      
      console.log('Datos del SMS obtenidos desde API:', JSON.stringify(smsData, null, 2));
      
      if (smsData) {
        setSms(smsData);
      } else {
        if (existingSMS) {
          setSms(existingSMS);
          setError('Algunos datos pueden estar incompletos (error de conectividad)');
        } else {
          setError('SMS no encontrado');
        }
      }
    } catch (err) {
      console.error('Error al cargar detalles del SMS:', err);
      
      const existingSMS = smsList.find(s => s.id.toString() === id.toString());
      if (existingSMS) {
        setSms(existingSMS);
        setError('Mostrando datos básicos (error de conectividad al servidor)');
      } else {
        setError('Error al cargar los detalles del SMS. Verifique que el servidor esté ejecutándose.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, smsList]);

  const loadArticles = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoadingArticles(true);
      console.log('Cargando artículos para SMS:', id);
      const articlesData = await smsService.getStudiesBySMSId(id);
      console.log('Artículos cargados:', articlesData);
      setArticles(Array.isArray(articlesData) ? articlesData : []);
    } catch (err) {
      console.error('Error al cargar artículos:', err);
      setArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  }, [id]);

  const loadStatistics = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoadingStats(true);
      console.log('Cargando estadísticas para SMS:', id);
      const statsData = await smsService.getSMSStatistics(id);
      console.log('Estadísticas cargadas:', statsData);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setStatistics(null);
    } finally {
      setLoadingStats(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadSMSDetails();
    }
  }, [id, loadSMSDetails, smsList]);

  // Cargar artículos cuando se cambie a la pestaña de extracción
  useEffect(() => {
    if (activeTab === 'extraction' && articles.length === 0) {
      loadArticles();
    }
  }, [activeTab, articles.length, loadArticles]);

  // Cargar estadísticas cuando se cambie a la pestaña de estadísticas
  useEffect(() => {
    if (activeTab === 'statistics' && !statistics) {
      loadStatistics();
    }
  }, [activeTab, statistics, loadStatistics]);

  const handleExportArticles = async () => {
    try {
      console.log('Exportando artículos...');
      const csvData = await smsService.exportArticles(id);
      
      // Crear un blob y generar enlace de descarga
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `articulos_sms_${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al exportar artículos:', err);
      alert('Error al exportar artículos: ' + err.message);
    }
  };

  const handleStatusChange = async (articleId, newStatus) => {
    try {
      // Llamar al endpoint para actualizar el estado del artículo
      await smsService.updateArticleStatus(id, articleId, newStatus);
      
      // Actualizar el estado local
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId 
            ? { ...article, estado: newStatus }
            : article
        )
      );
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado del artículo');
    }
  };


  const getStatusSelectColor = (status) => {
    switch (status) {
      case 'SELECTED': return 'select-success';
      case 'REJECTED': return 'select-error';
      case 'PENDING': return 'select-warning';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'SELECTED': return 'Seleccionado';
      case 'REJECTED': return 'Rechazado';
      case 'PENDING': return 'Pendiente';
      default: return status;
    }
  };

  const handleViewArticle = (article) => {
    setSelectedArticle(article);
    setShowArticleModal(true);
  };

  const handleEditArticle = async (article) => {
    console.log('Editando artículo:', article);
    setEditingArticleId(article.id);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingArticleId(null);
  };

  const handleSaveArticle = async (updatedArticle) => {
    try {
      console.log('Artículo actualizado:', updatedArticle);
      
      // Actualizar la lista local de artículos
      setArticles(prev => 
        prev.map(article => 
          article.id === updatedArticle.id 
            ? { ...article, ...updatedArticle }
            : article
        )
      );
      
      // Mostrar mensaje de éxito
      // Puedes implementar un sistema de notificaciones aquí
      console.log('Artículo guardado exitosamente');
      
      // Recargar artículos para asegurar datos actualizados
      setTimeout(() => {
        loadArticles();
      }, 500);
      
    } catch (error) {
      console.error('Error al procesar artículo guardado:', error);
    }
  };


  // Componente Modal para ver detalles del artículo
  const ArticleModal = () => {
    if (!selectedArticle) return null;

    return (
      <dialog className={`modal ${showArticleModal ? 'modal-open' : ''}`}>
        <div className="w-11/12 max-w-4xl modal-box">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Detalles del Artículo</h3>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => setShowArticleModal(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="font-semibold label">Título:</label>
              <p className="p-3 rounded bg-base-200">{selectedArticle.titulo}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="font-semibold label">Autores:</label>
                <p className="p-3 rounded bg-base-200">{selectedArticle.autores}</p>
              </div>
              <div>
                <label className="font-semibold label">Año:</label>
                <p className="p-3 rounded bg-base-200">{selectedArticle.anio_publicacion || 'N/A'}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="font-semibold label">Revista:</label>
                <p className="p-3 rounded bg-base-200">{selectedArticle.journal || 'N/A'}</p>
              </div>
              <div>
                <label className="font-semibold label">DOI:</label>
                <p className="p-3 rounded bg-base-200">
                  {selectedArticle.doi && selectedArticle.doi !== 'N/A' ? (
                    <a 
                      href={`https://doi.org/${selectedArticle.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {selectedArticle.doi}
                    </a>
                  ) : 'N/A'}
                </p>
              </div>
            </div>
            
            {selectedArticle.resumen && (
              <div>
                <label className="font-semibold label">Resumen:</label>
                <p className="p-3 whitespace-pre-wrap rounded bg-base-200">{selectedArticle.resumen}</p>
              </div>
            )}
            
            <div>
              <label className="font-semibold label">Respuestas a Subpreguntas:</label>
              <div className="space-y-2">
                <div className="p-3 rounded bg-base-200">
                  <p className="mb-1 text-sm font-medium text-gray-600">
                    {sms?.subpregunta_1 || 'Subpregunta 1:'}
                  </p>
                  <p>{selectedArticle.respuesta_subpregunta_1 || 'Sin respuesta'}</p>
                </div>
                <div className="p-3 rounded bg-base-200">
                  <p className="mb-1 text-sm font-medium text-gray-600">
                    {sms?.subpregunta_2 || 'Subpregunta 2:'}
                  </p>
                  <p>{selectedArticle.respuesta_subpregunta_2 || 'Sin respuesta'}</p>
                </div>
                <div className="p-3 rounded bg-base-200">
                  <p className="mb-1 text-sm font-medium text-gray-600">
                    {sms?.subpregunta_3 || 'Subpregunta 3:'}
                  </p>
                  <p>{selectedArticle.respuesta_subpregunta_3 || 'Sin respuesta'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-action">
            <button 
              className="btn btn-primary"
              onClick={() => setShowArticleModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => setShowArticleModal(false)}></div>
      </dialog>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
            <span className="ml-4">Cargando detalles del SMS...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !sms) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-4 alert alert-error">
            <span>{error}</span>
          </div>
          <div className="mb-4 alert alert-info">
            <span>💡 Asegúrate de que el servidor Django esté ejecutándose en puerto 8000</span>
          </div>
          <Link to="/sms" className="btn btn-outline">
            <FaArrowLeft className="mr-2" />
            Volver a la lista
          </Link>
        </div>
      </Layout>
    );
  }

  if (!sms) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-4 alert alert-warning">
            <span>SMS no encontrado con ID: {id}</span>
          </div>
          <Link to="/sms" className="btn btn-outline">
            <FaArrowLeft className="mr-2" />
            Volver a la lista
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/sms" className="btn btn-ghost btn-sm">
              <FaArrowLeft className="mr-2" />
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{sms.titulo_estudio}</h1>
              <p className="text-gray-100">Detalles del Mapeo Sistemático</p>
            </div>
          </div>
          <Link 
            to={`/sms/${id}/process`} 
            className="btn btn-primary"
          >
            <FaEdit className="mr-2" />
            Editar
          </Link>
        </div>

        {error && (
          <div className="mb-4 alert alert-warning">
            <span>{error}</span>
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">
              <FaEye className="mr-2" />
              Detalles
            </TabsTrigger>
            <TabsTrigger value="extraction">
              <FaTable className="mr-2" />
              Extracción de Datos
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <FaChartBar className="mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Detalles */}
          <TabsContent value="details" className="mt-6">
            <div className="space-y-6">
              {/* Información General */}
              <div className="shadow-lg card bg-base-100">
                <div className="card-body">
                  <h3 className="card-title">Información General</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Título del Estudio</span>
                      </label>
                      <p className="p-3 rounded bg-base-200">{sms.titulo_estudio || 'No definido'}</p>
                    </div>
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Autores</span>
                      </label>
                      <p className="p-3 rounded bg-base-200">{sms.autores || 'No definidos'}</p>
                    </div>
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Fecha de Creación</span>
                      </label>
                      <p className="p-3 rounded bg-base-200">
                        {sms.fecha_creacion ? new Date(sms.fecha_creacion).toLocaleDateString('es-ES') : 'No disponible'}
                      </p>
                    </div>
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Última Actualización</span>
                      </label>
                      <p className="p-3 rounded bg-base-200">
                        {sms.fecha_actualizacion ? new Date(sms.fecha_actualizacion).toLocaleDateString('es-ES') : 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preguntas de Investigación */}
              <div className="shadow-lg card bg-base-100">
                <div className="card-body">
                  <h3 className="card-title">Preguntas de Investigación</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Pregunta Principal</span>
                      </label>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.pregunta_principal || 'No definida'}
                      </p>
                    </div>

                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Sub-pregunta 1</span>
                      </label>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.subpregunta_1 || 'No definida'}
                      </p>
                    </div>

                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Sub-pregunta 2</span>
                      </label>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.subpregunta_2 || 'No definida'}
                      </p>
                    </div>

                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Sub-pregunta 3</span>
                      </label>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.subpregunta_3 || 'No definida'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Criterios de Búsqueda */}
              <div className="shadow-lg card bg-base-100">
                <div className="card-body">
                  <h3 className="card-title">Criterios de Búsqueda</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Cadena de Búsqueda</span>
                      </label>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.cadena_busqueda || 'No definida'}
                      </p>
                    </div>
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Período de Búsqueda</span>
                      </label>
                      <p className="p-3 rounded bg-base-200">
                        {sms.anio_inicio || 'N/A'} - {sms.anio_final || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Criterios de Inclusión y Exclusión */}
              <div className="shadow-lg card bg-base-100">
                <div className="card-body">
                  <h3 className="card-title">Criterios de Inclusión y Exclusión</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Criterios de Inclusión</span>
                      </label>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.criterios_inclusion || 'No definidos'}
                      </p>
                    </div>
                    <div>
                      <label className="label">
                        <span className="font-semibold label-text">Criterios de Exclusión</span>
                      </label>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.criterios_exclusion || 'No definidos'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fuentes */}
              {sms.fuentes && sms.fuentes !== 'Por definir' && (
                <div className="shadow-lg card bg-base-100">
                  <div className="card-body">
                    <h3 className="card-title">Fuentes de Búsqueda</h3>
                    <div>
                      <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                        {sms.fuentes}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Extracción de Datos */}
          <TabsContent value="extraction" className="mt-6">
            <div className="space-y-6">
              {/* Header con filtros y exportación */}
              <div className="p-4 rounded-lg bg-base-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Tabla de Extracción de Datos</h2>
                    <p className="text-sm text-gray-600">
                      Resultados del análisis automático de PDFs ({filteredArticles.length} artículos)
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    {/* Filtro por estado */}
                    <select 
                      className="select select-bordered select-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      <option value="SELECTED">Seleccionados</option>
                      <option value="PENDING">Pendientes</option>
                      <option value="REJECTED">Rechazados</option>
                    </select>
                    
                    {/* Botón de exportar */}
                    <button
                      onClick={handleExportArticles}
                      className="btn btn-primary btn-sm"
                      disabled={filteredArticles.length === 0}
                    >
                      <FaFileExport className="mr-2" />
                      Exportar ({filteredArticles.length})
                    </button>
                  </div>
                </div>
                
                {/* Resumen estadístico */}
                <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
                  <div className="p-3 rounded-lg bg-base-100">
                    <div className="text-xs text-gray-600">Total</div>
                    <div className="text-lg font-semibold">{articles.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-success/20">
                    <div className="text-xs text-gray-600">Seleccionados</div>
                    <div className="text-lg font-semibold text-success">
                      {articles.filter(a => a.estado === 'SELECTED').length}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/20">
                    <div className="text-xs text-gray-600">Pendientes</div>
                    <div className="text-lg font-semibold text-warning">
                      {articles.filter(a => a.estado === 'PENDING').length}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-error/20">
                    <div className="text-xs text-gray-600">Rechazados</div>
                    <div className="text-lg font-semibold text-error">
                      {articles.filter(a => a.estado === 'REJECTED').length}
                    </div>
                  </div>
                </div>
              </div>

              {loadingArticles ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
                  <span className="ml-3 text-lg">Cargando artículos...</span>
                </div>
              ) : articles.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mb-4">
                    <FaTable className="mx-auto text-6xl text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-700">
                    No hay artículos analizados
                  </h3>
                  <p className="text-gray-600">
                    Los artículos aparecerán aquí después de analizar PDFs en el proceso de edición.
                  </p>
                  <Link 
                    to={`/sms/${id}/process`} 
                    className="mt-4 btn btn-primary btn-sm"
                  >
                    Ir al proceso de análisis
                  </Link>
                </div>
              ) : (
                <>
                  {/* Contenedor con scroll horizontal mejorado */}
                  <div className="overflow-hidden border rounded-lg shadow-lg border-base-300">
                    <div className="overflow-x-auto">
                      <table className="table w-full table-zebra">
                        <thead className="sticky top-0 bg-base-300">
                          <tr>
                            <th className="w-16 min-w-16">#</th>
                            <th className="min-w-80">Título</th>
                            <th className="min-w-60">Autores</th>
                            <th className="w-20 min-w-20">Año</th>
                            <th className="min-w-40">Revista</th>
                            <th className="min-w-40">DOI</th>
                            <th className="w-32 min-w-32">Estado</th>
                            <th className="min-w-64">
                              <div className="text-xs">
                                <div className="font-semibold">Subpregunta 1</div>
                                <div className="font-normal text-gray-600 truncate">
                                  {sms?.subpregunta_1 ? 
                                    sms.subpregunta_1.substring(0, 50) + '...' : 
                                    'No definida'
                                  }
                                </div>
                              </div>
                            </th>
                            <th className="min-w-64">
                              <div className="text-xs">
                                <div className="font-semibold">Subpregunta 2</div>
                                <div className="font-normal text-gray-600 truncate">
                                  {sms?.subpregunta_2 ? 
                                    sms.subpregunta_2.substring(0, 50) + '...' : 
                                    'No definida'
                                  }
                                </div>
                              </div>
                            </th>
                            <th className="min-w-64">
                              <div className="text-xs">
                                <div className="font-semibold">Subpregunta 3</div>
                                <div className="font-normal text-gray-600 truncate">
                                  {sms?.subpregunta_3 ? 
                                    sms.subpregunta_3.substring(0, 50) + '...' : 
                                    'No definida'
                                  }
                                </div>
                              </div>
                            </th>
                            <th className="w-20 min-w-20">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedArticles.map((article, index) => {
                            console.log(`Debug Artículo ${index}:`, {
                              id: article.id,
                              titulo: article.titulo,
                              journal: article.journal,
                              respuesta1: article.respuesta_subpregunta_1,
                              respuesta2: article.respuesta_subpregunta_2,
                              respuesta3: article.respuesta_subpregunta_3
                            });
                            
                            // Función helper para limpiar y mostrar datos
                            const getCleanValue = (value, defaultText = 'No disponible') => {
                              if (!value || value === 'None' || value === 'null' || value.trim() === '') {
                                return defaultText;
                              }
                              return value.trim();
                            };
                            
                            // Función helper para obtener revista
                            const getJournal = (article) => {
                              return getCleanValue(article.journal, 'Sin revista');
                            };
                            
                            // Función helper para obtener respuestas a subpreguntas
                            const getSubquestionResponse = (article, questionNumber) => {
                              const fieldName = `respuesta_subpregunta_${questionNumber}`;
                              const value = article[fieldName];
                              return getCleanValue(value, 'Sin respuesta disponible');
                            };
                            
                            return (
                              <tr 
                                key={article.id} 
                                className={`hover:bg-base-200 ${
                                  article.estado === 'SELECTED' ? 'bg-success/10' :
                                  article.estado === 'REJECTED' ? 'bg-error/10' :
                                  'bg-warning/5'
                                }`}
                              >
                                <td className="font-mono text-sm text-center">{article.id}</td>
                                
                                {/* Título con tooltip */}
                                <td className="max-w-80">
                                  <div className="tooltip tooltip-right" data-tip={article.titulo || 'Sin título'}>
                                    <p className="font-medium break-words line-clamp-2">
                                      {getCleanValue(article.titulo, 'Sin título')}
                                    </p>
                                  </div>
                                </td>
                                
                                {/* Autores */}
                                <td className="max-w-60">
                                  <div className="tooltip tooltip-right" data-tip={article.autores || 'Sin autores'}>
                                    <p className="break-words line-clamp-2">
                                      {getCleanValue(article.autores, 'Sin autores')}
                                    </p>
                                  </div>
                                </td>
                                
                                <td className="font-mono text-sm text-center">
                                  {article.anio_publicacion || '-'}
                                </td>
                                
                                {/* Revista - CORREGIDA */}
                                <td className="max-w-40">
                                  <div className="tooltip tooltip-right" data-tip={getJournal(article)}>
                                    <p className="font-medium break-words line-clamp-2">
                                      {getJournal(article)}
                                    </p>
                                  </div>
                                </td>
                                
                                {/* DOI con enlace */}
                                <td className="max-w-40">
                                  {article.doi && article.doi !== 'N/A' && article.doi !== 'None' && article.doi.trim() !== '' ? (
                                    <a 
                                      href={`https://doi.org/${article.doi}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                      title={`Ver en DOI: ${article.doi}`}
                                    >
                                      <div className="font-medium break-words line-clamp-2">
                                        {article.doi.length > 30 ? 
                                          article.doi.substring(0, 30) + '...' : 
                                          article.doi
                                        }
                                      </div>
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">N/A</span>
                                  )}
                                </td>
                                
                                {/* Estado con selector */}
                                <td>
                                  <select
                                    value={article.estado || 'PENDING'}
                                    onChange={(e) => handleStatusChange(article.id, e.target.value)}
                                    className={`select select-xs w-full ${getStatusSelectColor(article.estado)}`}
                                  >
                                    <option value="PENDING">Pendiente</option>
                                    <option value="SELECTED">Seleccionado</option>
                                    <option value="REJECTED">Rechazado</option>
                                  </select>
                                </td>
                                
                                {/* Respuestas a subpreguntas - CORREGIDAS */}
                                <td className="max-w-64">
                                  <div className="p-2 rounded bg-base-100">
                                    {(() => {
                                      const respuesta = getSubquestionResponse(article, 1);
                                      return respuesta !== 'Sin respuesta disponible' ? (
                                        <div className="tooltip tooltip-left" data-tip={respuesta}>
                                          <p className="text-sm break-words line-clamp-3">
                                            {respuesta}
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="text-xs italic text-gray-500">
                                          {respuesta}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </td>
                                
                                <td className="max-w-64">
                                  <div className="p-2 rounded bg-base-100">
                                    {(() => {
                                      const respuesta = getSubquestionResponse(article, 2);
                                      return respuesta !== 'Sin respuesta disponible' ? (
                                        <div className="tooltip tooltip-left" data-tip={respuesta}>
                                          <p className="text-sm break-words line-clamp-3">
                                            {respuesta}
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="text-xs italic text-gray-500">
                                          {respuesta}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </td>
                                
                                <td className="max-w-64">
                                  <div className="p-2 rounded bg-base-100">
                                    {(() => {
                                      const respuesta = getSubquestionResponse(article, 3);
                                      return respuesta !== 'Sin respuesta disponible' ? (
                                        <div className="tooltip tooltip-left" data-tip={respuesta}>
                                          <p className="text-sm break-words line-clamp-3">
                                            {respuesta}
                                          </p>
                                        </div>
                                      ) : (
                                        <span className="text-xs italic text-gray-500">
                                          {respuesta}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </td>
                                
                                {/* Acciones */}
                                <td>
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => handleViewArticle(article)}
                                      className="btn btn-ghost btn-xs"
                                      title="Ver detalles completos"
                                    >
                                      <FaEye />
                                    </button>
                                    <button
                                      onClick={() => handleEditArticle(article)}
                                      className="btn btn-ghost btn-xs"
                                      title="Editar respuestas"
                                    >
                                      <FaEdit />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Paginación mejorada */}
                  {filteredArticles.length > itemsPerPage && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="join">
                        <button 
                          className="join-item btn btn-sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          «
                        </button>
                        
                        {/* Páginas con lógica de truncamiento */}
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let page;
                          if (totalPages <= 7) {
                            page = i + 1;
                          } else {
                            if (currentPage <= 4) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                              page = totalPages - 6 + i;
                            } else {
                              page = currentPage - 3 + i;
                            }
                          }
                          
                          return (
                            <button
                              key={page}
                              className={`join-item btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          );
                        })}
                        
                        <button 
                          className="join-item btn btn-sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          »
                        </button>
                      </div>

                      {/* Información de paginación */}
                      <div className="text-sm text-center text-gray-600">
                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredArticles.length)} de {filteredArticles.length} artículos
                        {statusFilter && ` (filtrado por: ${getStatusText(statusFilter)})`}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* Tab: Estadísticas */}
          <TabsContent value="statistics" className="mt-6">
            <div className="space-y-6">
              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
                  <span className="ml-2">Cargando estadísticas...</span>
                </div>
              ) : statistics ? (
                <div className="space-y-6">
                  {/* Resumen General */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg stat bg-primary text-primary-content">
                      <div className="text-gray-100 stat-title">Total</div>
                      <div className="stat-value">{statistics.general?.total_articles || 0}</div>
                      <div className="text-gray-100 stat-desc">Artículos procesados</div>
                    </div>
                    <div className="rounded-lg stat bg-success text-success-content">
                      <div className="text-gray-100 stat-title">Seleccionados</div>
                      <div className="text-gray-100 stat-value">{statistics.general?.selected_count || 0}</div>
                      <div className="text-gray-100 stat-desc">
                        {statistics.general?.selection_rate || 0}% del total
                      </div>
                    </div>
                    <div className="rounded-lg stat bg-error text-error-content">
                      <div className="text-gray-100 stat-title">Rechazados</div>
                      <div className="text-gray-100 stat-value">{statistics.general?.rejected_count || 0}</div>
                      <div className="text-gray-100 stat-desc">Excluidos del estudio</div>
                    </div>
                    <div className="rounded-lg stat bg-warning text-warning-content">
                      <div className="text-gray-100 stat-title">Pendientes</div>
                      <div className="text-gray-100 stat-value">{statistics.general?.pending_count || 0}</div>
                      <div className="text-gray-100 stat-desc">Por revisar</div>
                    </div>
                  </div>

                  {/* Distribución por Estado */}
                  {statistics.by_status && statistics.by_status.length > 0 && (
                    <div className="shadow-lg card bg-base-100">
                      <div className="card-body">
                        <h3 className="card-title">Distribución por Estado</h3>
                        <div className="space-y-2">
                          {statistics.by_status.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded bg-base-200">
                              <div className="flex items-center">
                                <div 
                                  className="w-4 h-4 mr-2 rounded" 
                                  style={{ backgroundColor: item.color }}
                                ></div>
                                <span className="text-sm">{item.status}</span>
                              </div>
                              <span className="font-semibold">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No hay estadísticas disponibles para este SMS.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de detalles del artículo */}
        <ArticleModal />
        <ArticleEditModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          articleId={editingArticleId}
          smsId={id}
          onSave={handleSaveArticle}
        />
      </div>
    </Layout>
  );
};

export default SMSDetails;