// frontend/src/components/sms/BubbleChartVisualization.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaSpinner, 
  FaDownload, 
  FaBroadcastTower, 
  FaInfoCircle, 
  FaSync,
  FaChartArea,
  FaDatabase
} from 'react-icons/fa';
import { smsService } from '@/services/smsService';

const BubbleChartVisualization = ({ smsId, smsTitle }) => {
  // Estados del componente
  const [bubbleData, setBubbleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Cargar gráfico de burbujas
  const loadBubbleChart = useCallback(async () => {
    if (!smsId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Generando gráfico de burbujas inteligente...');
      const result = await smsService.getBubbleChartAnalysis(smsId);
      
      if (result.success) {
        setBubbleData(result);
        console.log('Gráfico de burbujas generado exitosamente');
      } else {
        setError(result.error || 'Error generando gráfico de burbujas');
      }
    } catch (err) {
      console.error('Error al cargar gráfico de burbujas:', err);
      setError('Error al procesar el gráfico de burbujas: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [smsId]);

  // Efecto para cargar automáticamente
  useEffect(() => {
    loadBubbleChart();
  }, [loadBubbleChart]);

  // Función para descargar
  const downloadVisualization = () => {
    if (!bubbleData?.image_base64) return;
    
    try {
      const byteCharacters = atob(bubbleData.image_base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bubble_chart_${smsId}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar la visualización');
    }
  };

  // Función para regenerar
  const regenerateChart = () => {
    loadBubbleChart();
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-12 space-y-4">
        <div className="relative">
          <FaSpinner className="w-12 h-12 animate-spin text-primary" />
          <FaBroadcastTower className="absolute top-0 left-0 w-12 h-12 animate-pulse text-secondary" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Generando Gráfico de Burbujas</h3>
          <p className="max-w-md text-sm text-gray-600">
            Aplicando análisis semántico para correlacionar técnicas de investigación
            con enfoques de aplicación y tipos de registro.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Analizando enfoques de aplicación...</span>
            </div>
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Clasificando tipos de registro...</span>
            </div>
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Identificando técnicas aplicadas...</span>
            </div>
            <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>Generando visualización de correlaciones...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <FaInfoCircle className="mx-auto text-4xl text-error" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-error">
          Error en el Gráfico de Burbujas
        </h3>
        <p className="mb-4 text-sm text-gray-600">{error}</p>
        <div className="space-x-2">
          <button
            onClick={regenerateChart}
            className="btn btn-primary btn-sm"
          >
            <FaBroadcastTower className="mr-2" />
            Reintentar Generación
          </button>
        </div>
      </div>
    );
  }

  // Sin datos
  if (!bubbleData) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <FaChartArea className="mx-auto text-4xl text-gray-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700">
          No hay datos para gráfico de burbujas
        </h3>
        <p className="text-sm text-gray-600">
          No se pudo generar el gráfico. Verifique que haya artículos procesados.
        </p>
      </div>
    );
  }

  const { statistics } = bubbleData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center text-2xl font-bold">
            <FaBroadcastTower className="mr-3 text-primary" />
            Gráfico de Burbujas: Técnicas vs Aplicaciones
          </h2>
          <p className="text-gray-600">{smsTitle}</p>
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
            <span>🫧 {statistics?.total_bubbles || 0} correlaciones detectadas</span>
            <span>📊 {statistics?.total_articles || 0} artículos analizados</span>
            <span>🎯 {statistics?.unique_approaches || 0} enfoques únicos</span>
            <span>📋 {statistics?.unique_record_types || 0} tipos de registro</span>
          </div>
        </div>
        
        {/* Controles */}
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
            disabled={!bubbleData?.image_base64}
          >
            <FaDownload className="mr-2" />
            Descargar PNG
          </button>
          <button
            onClick={regenerateChart}
            className="btn btn-secondary btn-sm"
          >
            <FaSync className="mr-2" />
            Regenerar
          </button>
        </div>
      </div>

      {/* Panel informativo */}
      {showDetails && (
        <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <h4 className="mb-2 font-semibold text-purple-800">
            🫧 Análisis de Correlaciones con Gráfico de Burbujas
          </h4>
          <div className="space-y-2 text-sm text-purple-700">
            <p>
              <strong>Correlación Multidimensional:</strong> El gráfico muestra las relaciones 
              entre enfoques de aplicación (eje X), tipos de registro (eje Y), y técnicas 
              aplicadas (color de las burbujas).
            </p>
            <p>
              <strong>Tamaño de Burbuja:</strong> Representa el número de artículos que utilizan 
              una técnica específica en un contexto determinado.
            </p>
            <p>
              <strong>Análisis Inteligente:</strong> El sistema identifica automáticamente patrones 
              y agrupa investigaciones similares para revelar tendencias metodológicas.
            </p>
            <p>
              <strong>Aplicación Práctica:</strong> Útil para identificar gaps de investigación, 
              técnicas emergentes, y oportunidades de innovación metodológica.
            </p>
          </div>
        </div>
      )}

      {/* Visualización principal */}
      <div className="shadow-lg card bg-base-100">
        <div className="card-body">
          <div className="text-center">
            {bubbleData.image_base64 ? (
              <div className="relative">
                <img
                  src={`data:image/png;base64,${bubbleData.image_base64}`}
                  alt="Gráfico de Burbujas: Correlación de Técnicas por Enfoque y Tipo de Registro"
                  className="mx-auto max-w-full h-auto rounded-lg border shadow-md"
                />
                <div className="absolute top-2 right-2 space-y-1">
                  {bubbleData.ml_applied && (
                    <div className="badge badge-success">
                      <FaDatabase className="mr-1" />
                      IA Aplicada
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-gray-500">
                No se pudo generar la visualización de burbujas
              </div>
            )}
          </div>
          
          {/* Nota explicativa */}
          {bubbleData.image_base64 && (
            <div className="p-3 mt-4 text-sm bg-blue-50 rounded-lg">
              <p className="text-blue-700">
                🫧 <strong>Interpretación:</strong> Cada burbuja representa una combinación única 
                de enfoque de aplicación, tipo de registro y técnica utilizada. El tamaño 
                indica la frecuencia de uso, mientras que los colores diferencian las técnicas. 
                Las posiciones revelan correlaciones entre metodologías y contextos de aplicación.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BubbleChartVisualization;