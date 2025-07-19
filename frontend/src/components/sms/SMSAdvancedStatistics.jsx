// frontend/src/components/SMS/SMSAdvancedStatistics.jsx - VERSIÓN COMPLETA
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,Cell,} from 'recharts';
import { 
  FaChartBar, FaChartPie, FaChartLine, FaDownload, 
  FaChevronDown, FaFileAlt, FaFilePdf, FaImage 
} from 'react-icons/fa';
import { smsService } from '@/services/smsService';
import ReportGenerationModal from './ReportGenerationModal';

const SMSAdvancedStatistics = ({ smsTitle, articles, smsId }) => {
  const [activeChart, setActiveChart] = useState('research-flow');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Procesar datos para las visualizaciones
  const visualizationData = useMemo(() => {
    if (!articles || articles.length === 0) return null;

    try {
      // 1. Datos para el diagrama de flujo del proceso de investigación
      const processFlowData = {
        totalInitial: articles.length,
        titleReview: articles.filter(a => a.titulo && a.titulo.trim() !== '').length,
        abstractReview: articles.filter(a => a.resumen && a.resumen.trim() !== '').length,
        fullTextReview: articles.filter(a => a.estado === 'SELECTED' || a.estado === 'PENDING').length,
        finalSelected: articles.filter(a => a.estado === 'SELECTED').length,
        excluded: articles.filter(a => a.estado === 'REJECTED').length
      };

      // 2. Datos para gráfica de burbujas por año y revista
      const bubbleData = {};
      articles.forEach(article => {
        const year = article.anio_publicacion || 'Sin año';
        const journal = (article.journal && article.journal !== 'None') ? article.journal : 'Sin revista';
        const key = `${year}-${journal}`;
        
        if (!bubbleData[key]) {
          bubbleData[key] = {
            year: year,
            journal: journal.substring(0, 20) + (journal.length > 20 ? '...' : ''),
            count: 0,
            articles: []
          };
        }
        bubbleData[key].count += 1;
        bubbleData[key].articles.push(article);
      });

      const bubbleChartData = Object.values(bubbleData).map(item => ({
        x: item.year,
        y: item.count,
        z: item.count * 10,
        journal: item.journal,
        count: item.count,
        articles: item.articles
      }));

      // 3. Datos para distribución por enfoque de investigación
      const researchFocusData = {};
      articles.forEach(article => {
        const responses = [
          article.respuesta_subpregunta_1,
          article.respuesta_subpregunta_2, 
          article.respuesta_subpregunta_3
        ].filter(r => r && r.trim() !== '' && r !== 'Sin respuesta disponible' && r !== 'None');

        let focus = 'No clasificado';
        
        if (responses.length > 0) {
          const allResponses = responses.join(' ').toLowerCase();
          
          if (allResponses.includes('experimental') || allResponses.includes('experimento')) {
            focus = 'Experimental';
          } else if (allResponses.includes('survey') || allResponses.includes('encuesta')) {
            focus = 'Survey';
          } else if (allResponses.includes('case study') || allResponses.includes('caso de estudio')) {
            focus = 'Caso de Estudio';
          } else if (allResponses.includes('review') || allResponses.includes('revisión')) {
            focus = 'Revisión Sistemática';
          } else if (allResponses.includes('qualitative') || allResponses.includes('cualitativo')) {
            focus = 'Cualitativo';
          } else if (allResponses.includes('quantitative') || allResponses.includes('cuantitativo')) {
            focus = 'Cuantitativo';
          } else {
            focus = 'Otro';
          }
        }

        if (!researchFocusData[focus]) {
          researchFocusData[focus] = 0;
        }
        researchFocusData[focus] += 1;
      });

      const focusChartData = Object.entries(researchFocusData).map(([focus, count]) => ({
        name: focus,
        value: count,
        percentage: ((count / articles.length) * 100).toFixed(1)
      }));

      // 4. Datos para mapa de contexto
      const contextData = {};
      articles.forEach(article => {
        if (article.resumen && article.resumen.trim() !== '' && article.resumen !== 'None') {
          const words = article.resumen.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 4)
            .filter(word => !['that', 'with', 'this', 'from', 'they', 'were', 'have', 'been', 'their', 'which', 'these', 'such', 'would', 'could', 'should', 'using', 'based', 'also', 'study', 'research', 'method', 'approach'].includes(word));

          words.forEach(word => {
            if (!contextData[word]) {
              contextData[word] = {
                name: word,
                value: 0,
                articles: []
              };
            }
            contextData[word].value += 1;
            contextData[word].articles.push(article);
          });
        }
      });

      const contextChartData = Object.values(contextData)
        .sort((a, b) => b.value - a.value)
        .slice(0, 15)
        .map(item => ({
          name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
          value: item.value,
          articles: item.articles
        }));

      return {
        processFlow: processFlowData,
        bubbleChart: bubbleChartData,
        researchFocus: focusChartData,
        contextMap: contextChartData
      };
    } catch (error) {
      console.error('Error procesando datos para visualización:', error);
      return null;
    }
  }, [articles]);

  const downloadChart = () => {
    console.log('Generando Mapeo');
    setShowDownloadMenu(false);
  };

  // Nueva función para generar reporte metodológico
  const handleGenerateReport = () => {
    setShowReportModal(true);
    setShowDownloadMenu(false);
  };

  // Nueva función para exportar reporte directo a PDF
  const handleExportReportPDF = async () => {
    try {
      setShowDownloadMenu(false);
      
      console.log('Generando y descargando reporte PDF...');
      
      const response = await smsService.exportReportPDF(smsId);
      
      // Crear enlace de descarga
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `methodology_report_${smsTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error al exportar reporte:', error);
      alert('Error al generar el reporte: ' + error.message);
    }
  };

  if (!articles || articles.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No hay datos suficientes para generar las visualizaciones</p>
      </div>
    );
  }

  if (!visualizationData) {
    return (
      <div className="p-8 text-center">
        <p>Error al procesar los datos para las visualizaciones</p>
      </div>
    );
  }

  const chartTabs = [
    { id: 'research-flow', label: 'Flujo de Investigación', icon: FaChartLine },
    { id: 'bubble-analysis', label: 'Análisis de Burbujas', icon: FaChartBar },
    { id: 'context-map', label: 'Mapa de Contexto', icon: FaChartPie },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

  const renderResearchFlowChart = () => {
    if (!visualizationData?.processFlow) {
      return (
        <div className="p-8 text-center text-gray-500">
          <p>No hay datos para mostrar el flujo de investigación</p>
        </div>
      );
    }

    const flowData = visualizationData.processFlow;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">Diagrama de Flujo PRISMA del Proceso de Investigación</h3>
        
        <div className="p-8 bg-white rounded-lg border">
          <div className="mx-auto space-y-6 max-w-6xl">
            
            {/* IDENTIFICACIÓN */}
            <div className="relative">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="flex col-span-2 justify-center">
                  <div className="px-4 py-8 text-xs font-bold text-white whitespace-nowrap bg-cyan-400 rounded-lg transform origin-center -rotate-90">
                    Identification
                  </div>
                </div>
                
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="font-semibold text-gray-600">
                      {flowData.totalInitial} potential relevant studies identified
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      (PubMed:222, Web of Science: 106, Scopus: 61)
                    </div>
                  </div>
                </div>
                
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Additional studies identified through other resources
                    </div>
                    <div className="mt-1 text-xs font-bold text-gray-600">(n = 0)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flecha hacia abajo */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-black"></div>
            </div>
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>

            {/* OVERVIEW */}
            <div className="relative">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="flex col-span-2 justify-center">
                  <div className="px-4 py-8 text-xs font-bold text-white whitespace-nowrap bg-cyan-400 rounded-lg transform origin-center -rotate-90">
                    Overview
                  </div>
                </div>
                
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Total number of articles
                    </div>
                    <div className="mt-1 text-lg font-bold text-gray-600">(n = {flowData.totalInitial})</div>
                  </div>
                </div>
                
                <div className="flex col-span-1 justify-center">
                  <div className="w-full h-0.5 bg-black"></div>
                  <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-black"></div>
                </div>
                
                <div className="col-span-4">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Duplicate articles excluded
                    </div>
                    <div className="mt-1 text-xs font-bold text-gray-600">
                      (n = {flowData.totalInitial - flowData.titleReview})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resultado final */}
            <div className="relative">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="flex col-span-2 justify-center">
                  <div className="px-4 py-8 text-xs font-bold text-white whitespace-nowrap bg-cyan-400 rounded-lg transform origin-center -rotate-90">
                    Included
                  </div>
                </div>
                
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Studies included in the quantitative synthesis (systematic review)
                    </div>
                    <div className="mt-1 text-xl font-bold text-gray-600">
                      (n = {flowData.finalSelected})
                    </div>
                  </div>
                </div>
                
                <div className="col-span-5"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const renderBubbleChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Análisis de Burbujas: Distribución por Año y Revista</h3>
      {visualizationData.bubbleChart && visualizationData.bubbleChart.length > 0 ? (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart data={visualizationData.bubbleChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="Año" />
            <YAxis dataKey="y" name="Cantidad" />
            <Tooltip />
            <Bar dataKey="y" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="p-8 text-center text-gray-600">
          <p>No hay suficientes datos para generar la gráfica de burbujas</p>
        </div>
      )}
    </div>
  );

  const renderContextMapChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Mapa de Contexto: Términos Más Frecuentes</h3>
      {visualizationData.contextMap && visualizationData.contextMap.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={visualizationData.contextMap} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8">
              {visualizationData.contextMap.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <p>No hay suficientes datos en los resúmenes para generar el mapa de contexto</p>
        </div>
      )}
    </div>
  );

  const renderActiveChart = () => {
    switch (activeChart) {
      case 'research-flow':
        return renderResearchFlowChart();
      case 'bubble-analysis':
        return renderBubbleChart();
      case 'context-map':
        return renderContextMapChart();
      default:
        return renderResearchFlowChart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header modificado con menú desplegable */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Visualizaciones Avanzadas</h2>
          <p className="text-gray-600">{smsTitle}</p>
        </div>
        
        {/* Menú desplegable de descarga */}
        <div className="relative">
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="btn btn-outline btn-sm"
          >
            <FaDownload className="mr-2" />
            Descargar
            <FaChevronDown className="ml-2" />
          </button>
          
          {showDownloadMenu && (
            <div className="absolute right-0 z-10 mt-2 w-64 bg-white rounded-lg border shadow-lg">
              <div className="py-2">
                {/* Opción 1: Descargar gráfica actual */}
                <button
                  onClick={downloadChart}
                  className="flex items-center px-4 py-2 w-full text-left hover:bg-gray-100"
                >
                  <FaImage className="mr-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Descargar Gráfica</div>
                    <div className="text-xs text-gray-500">Imagen de la visualización actual</div>
                  </div>
                </button>
                
                <hr className="my-1" />
                
                {/* Opción 2: Generar reporte metodológico (con vista previa) */}
                <button
                  onClick={handleGenerateReport}
                  className="flex items-center px-4 py-2 w-full text-left hover:bg-gray-100"
                >
                  <FaFileAlt className="mr-3 text-green-500" />
                  <div>
                    <div className="font-medium">Generar Reporte Metodológico</div>
                    <div className="text-xs text-gray-500">Texto completo con vista previa</div>
                  </div>
                </button>
                
                {/* Opción 3: Exportar reporte directo a PDF */}
                <button
                  onClick={handleExportReportPDF}
                  className="flex items-center px-4 py-2 w-full text-left hover:bg-gray-100"
                >
                  <FaFilePdf className="mr-3 text-red-500" />
                  <div>
                    <div className="font-medium">Exportar Reporte PDF</div>
                    <div className="text-xs text-gray-500">Descarga directa en formato PDF</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="tabs tabs-boxed">
        {chartTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeChart === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveChart(tab.id)}
          >
            <tab.icon className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      <div className="shadow-lg card bg-base-100">
        <div className="card-body">
          {renderActiveChart()}
        </div>
      </div>

      {/* Modal de generación de reportes */}
      <ReportGenerationModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        smsId={smsId}
        smsTitle={smsTitle}
        articles={articles}
      />
    </div>
  );
};

export default SMSAdvancedStatistics;