import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner, FaDownload, FaBrain, FaChartArea, FaInfoCircle, FaSync } from 'react-icons/fa';
import { smsService } from '@/services/smsService';

const SemanticAnalysisVisualization = ({ smsId, smsTitle }) => {
  // Estados del componente - cada uno tiene un propósito específico
  const [analysisData, setAnalysisData] = useState(null); // Almacena los resultados del análisis
  const [loading, setLoading] = useState(false); // Controla el estado de carga
  const [error, setError] = useState(null); // Maneja errores de manera elegante
  const [showDetails, setShowDetails] = useState(false); // Controla la visibilidad de detalles técnicos

  // Función para cargar el análisis semántico
  // useCallback optimiza el rendimiento evitando recrear la función innecesariamente
  const loadSemanticAnalysis = useCallback(async () => {
    if (!smsId) return; // Validación de seguridad - no proceder sin ID
    
    try {
      setLoading(true); // Activamos el indicador de carga
      setError(null); // Limpiamos errores anteriores
      
      console.log('Iniciando análisis semántico avanzado...');
      const result = await smsService.getAdvancedSemanticAnalysis(smsId);
      
      if (result.success) {
        setAnalysisData(result);
        console.log('Análisis semántico completado exitosamente');
      } else {
        setError(result.error || 'Error en el análisis');
      }
    } catch (err) {
      console.error('Error al cargar análisis semántico:', err);
      setError('Error al procesar el análisis semántico: ' + err.message);
    } finally {
      setLoading(false); // Siempre desactivamos la carga, sin importar el resultado
    }
  }, [smsId]);

  // Efecto que se ejecuta al montar el componente
  // Es como un "arranque automático" que inicia el análisis
  useEffect(() => {
    loadSemanticAnalysis();
  }, [loadSemanticAnalysis]);

  // Función para descargar la visualización como imagen PNG
  // Convierte la imagen base64 en un archivo descargable
  const downloadVisualization = () => {
    if (!analysisData?.image_base64) return;
    
    try {
      // Proceso de conversión: base64 → bytes → blob → archivo
      const byteCharacters = atob(analysisData.image_base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Crear enlace de descarga temporal
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `semantic_analysis_${smsId}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      
      // Limpieza de memoria - importante para evitar memory leaks
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar visualización:', error);
      alert('Error al descargar la visualización');
    }
  };

  // Función para regenerar el análisis
  // Útil cuando el usuario quiere actualizar los resultados
  const regenerateAnalysis = () => {
    loadSemanticAnalysis();
  };

  // Renderizado condicional: estado de carga
  // Mostramos una animación elegante mientras procesamos
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12 space-y-4">
        <div className="relative">
          {/* Animación de dos iconos superpuestos para efecto visual */}
          <FaSpinner className="w-12 h-12 animate-spin text-primary" />
          <FaBrain className="absolute top-0 left-0 w-12 h-12 animate-pulse text-secondary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Procesando Análisis Semántico</h3>
          <p className="max-w-md text-sm text-gray-600">
            Aplicando embeddings semánticos y clustering automático para agrupar 
            enfoques de investigación similares. Este proceso puede tomar algunos minutos.
          </p>
          {/* Indicadores de progreso paso a paso */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Extrayendo enfoques de investigación...</span>
            </div>
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Generando embeddings semánticos...</span>
            </div>
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Aplicando clustering automático...</span>
            </div>
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>Generando visualización...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizado condicional: estado de error
  // Proporcionamos información útil y opciones de recuperación
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <FaInfoCircle className="mx-auto text-4xl text-error" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-error">
          Error en el Análisis Semántico
        </h3>
        <p className="mb-4 text-sm text-gray-600">{error}</p>
        <div className="space-x-2">
          <button
            onClick={regenerateAnalysis}
            className="btn btn-primary btn-sm"
          >
            <FaBrain className="mr-2" />
            Reintentar Análisis
          </button>
        </div>
      </div>
    );
  }

  // Renderizado condicional: sin datos
  // Estado cuando no hay información para mostrar
  if (!analysisData) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          {/* AQUÍ ESTABA EL ICONO PROBLEMÁTICO - AHORA CORREGIDO */}
          <FaChartArea className="mx-auto text-4xl text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700">
          No hay datos para análisis
        </h3>
        <p className="text-sm text-gray-600">
          No se pudo generar el análisis semántico. Verifique que haya artículos analizados.
        </p>
      </div>
    );
  }

  // Destructuración de datos para fácil acceso
  const { statistics, image_base64 } = analysisData;

  // Renderizado principal: visualización completa
  return (
    <div className="space-y-6">
      {/* Header con información y controles */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center text-2xl font-bold">
            <FaBrain className="mr-3 text-primary" />
            Análisis Semántico Avanzado
          </h2>
          <p className="text-gray-600">{smsTitle}</p>
          {/* Estadísticas resumidas en formato de badges */}
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
            <span>🤖 IA aplicada: Embeddings + Clustering</span>
            <span>📊 {statistics.total_articles} artículos analizados</span>
            <span>🎯 {statistics.unique_approaches} enfoques identificados</span>
          </div>
        </div>
        
        {/* Panel de controles */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-outline btn-sm"
          >
            <FaInfoCircle className="mr-2" />
            {showDetails ? 'Ocultar' : 'Mostrar'} Detalles
          </button>
          <button
            onClick={downloadVisualization}
            className="btn btn-primary btn-sm"
            disabled={!image_base64}
          >
            <FaDownload className="mr-2" />
            Descargar PNG
          </button>
          <button
            onClick={regenerateAnalysis}
            className="btn btn-secondary btn-sm"
          >
            <FaSync className="mr-2" />
            Regenerar
          </button>
        </div>
      </div>

      {/* Panel informativo expandible */}
      {/* Solo se muestra cuando el usuario activa showDetails */}
      {showDetails && (
        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <h4 className="mb-2 font-semibold text-blue-800">
            🧠 Tecnología de Inteligencia Artificial Aplicada
          </h4>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <strong>SentenceTransformers:</strong> Cada enfoque de investigación se convierte en un vector 
              multidimensional que captura su significado semántico profundo.
            </p>
            <p>
              <strong>Clustering KMeans:</strong> Los vectores se agrupan automáticamente en clusters 
              basándose en su similitud conceptual, no solo en palabras clave.
            </p>
            <p>
              <strong>Análisis Inteligente:</strong> El sistema identifica patrones metodológicos complejos 
              que van más allá de la clasificación manual tradicional.
            </p>
            <p>
              <strong>Visualización Académica:</strong> Cada punto representa un artículo específico con 
              referencias bibliográficas simuladas siguiendo estándares académicos.
            </p>
          </div>
        </div>
      )}

      {/* Visualización principal */}
      <div className="shadow-lg card bg-base-100">
        <div className="card-body">
          <div className="text-center">
          {image_base64 ? (
            <div className="relative">
                <img
                src={`data:image/png;base64,${image_base64}`}
                alt="Distribución Académica de Enfoques de Investigación"
                className="mx-auto max-w-full h-auto rounded-lg border shadow-md"
                />
                <div className="absolute top-2 right-2">
                <div className="badge badge-success">
                    <FaBrain className="mr-1" />
                    Estilo Académico
                </div>
                </div>
                {/* Añadimos una nota explicativa debajo de la imagen */}
                <div className="p-3 mt-4 text-sm bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                    📊 <strong>Interpretación:</strong> Cada punto negro representa un artículo individual. 
                    Las filas muestran diferentes enfoques de investigación ordenados por frecuencia. 
                    Los números en la parte inferior son referencias bibliográficas simuladas siguiendo 
                    estándares académicos internacionales.
                </p>
                </div>
            </div>
            ) : (
            <div className="p-8 text-gray-500">
                No se pudo generar la visualización
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de estadísticas detalladas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribución por enfoques */}
        <div className="shadow-lg card bg-base-100">
          <div className="card-body">
            <h3 className="text-lg card-title">
              📊 Distribución por Enfoques
            </h3>
            <div className="space-y-3">
              {statistics.approach_details?.map((approach, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded bg-base-200">
                  <div className="flex-1">
                    <div className="font-medium">{approach.name}</div>
                    <div className="text-xs text-gray-600">
                      {approach.articles?.length > 0 && (
                        <span>
                          Ej: {approach.articles[0].substring(0, 50)}
                          {approach.articles[0].length > 50 ? '...' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{approach.count}</div>
                    <div className="text-xs text-gray-500">{approach.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Métricas de análisis */}
        <div className="shadow-lg card bg-base-100">
          <div className="card-body">
            <h3 className="text-lg card-title">
              🔬 Métricas de Análisis
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg stat bg-primary/10">
                <div className="stat-title text-primary">Total Artículos</div>
                <div className="stat-value text-primary">{statistics.total_articles}</div>
                <div className="stat-desc">Procesados con IA</div>
              </div>
              
              <div className="rounded-lg stat bg-secondary/10">
                <div className="stat-title text-secondary">Enfoques Únicos</div>
                <div className="stat-value text-secondary">{statistics.unique_approaches}</div>
                <div className="stat-desc">Identificados automáticamente</div>
              </div>
              
              <div className="rounded-lg stat bg-accent/10">
                <div className="stat-title text-accent">Clustering</div>
                <div className="stat-value text-accent">
                  {statistics.clustering_applied ? '✓' : '✗'}
                </div>
                <div className="stat-desc">
                  {statistics.clustering_applied ? 'Aplicado' : 'No aplicado'}
                </div>
              </div>

              <div className="p-3 mt-4 rounded bg-success/10">
                <div className="mb-1 text-xs font-medium text-success">
                  🎯 Precisión del Análisis
                </div>
                <div className="text-sm text-gray-700">
                  El modelo utiliza embeddings semánticos entrenados en millones de 
                  documentos académicos para garantizar alta precisión en la clasificación.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemanticAnalysisVisualization;