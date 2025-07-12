// frontend/src/components/SMS/SMSAdvancedStatistics.jsx
import React, { useState, useCallback } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, 
  BarChart, Bar
} from 'recharts';
import { FaDownload, FaProjectDiagram, FaGlobe, FaChartArea } from 'react-icons/fa';

const SMSAdvancedStatistics = ({ smsTitle, articles }) => {
  const [activeChart, setActiveChart] = useState('research-flow');

  // Procesar datos para las nuevas visualizaciones
  const processDataForVisualization = useCallback(() => {
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
        z: item.count * 10, // Tamaño de la burbuja
        journal: item.journal,
        count: item.count,
        articles: item.articles
      }));

      // 3. Datos para distribución por enfoque de investigación
      const researchFocusData = {};
      articles.forEach(article => {
        // Analizar las respuestas a subpreguntas para determinar el enfoque
        const responses = [
          article.respuesta_subpregunta_1,
          article.respuesta_subpregunta_2, 
          article.respuesta_subpregunta_3
        ].filter(r => r && r.trim() !== '' && r !== 'Sin respuesta disponible' && r !== 'None');

        let focus = 'No clasificado';
        
        if (responses.length > 0) {
          // Clasificar por palabras clave en las respuestas
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

      // 4. Datos para mapa de contexto (por palabras clave en resúmenes)
      const contextData = {};
      articles.forEach(article => {
        if (article.resumen && article.resumen.trim() !== '' && article.resumen !== 'None') {
          // Extraer palabras clave del resumen
          const words = article.resumen.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 4) // Solo palabras de más de 4 caracteres
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

      // Seleccionar las 15 palabras más frecuentes
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

  const visualizationData = processDataForVisualization();

  // Debug - opcional, puedes eliminarlo después
  console.log('SMSAdvancedStatistics - Articles:', articles?.length || 0);
  console.log('SMSAdvancedStatistics - VisualizationData:', visualizationData);

  const downloadChart = () => {
    console.log('Generando Mapeo');
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
    { id: 'research-flow', label: 'Flujo de Investigación', icon: FaProjectDiagram },
    { id: 'bubble-analysis', label: 'Análisis de Burbujas', icon: FaChartArea },
    { id: 'context-map', label: 'Mapa de Contexto', icon: FaGlobe },
  ];

  // Colores para las gráficas
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
        
        {/* Diagrama de flujo estilo PRISMA - Exactamente como la imagen */}
        <div className="p-8 bg-white rounded-lg border">
          <div className="mx-auto space-y-6 max-w-6xl">
            
            {/* IDENTIFICACIÓN */}
            <div className="relative">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Etiqueta lateral */}
                <div className="flex col-span-2 justify-center">
                  <div className="px-4 py-8 text-xs font-bold text-white whitespace-nowrap bg-cyan-400 rounded-lg transform origin-center -rotate-90">
                    Identification
                  </div>
                </div>
                
                {/* Caja principal */}
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
                
                {/* Caja lateral derecha */}
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Additional studies identified through other resources
                    </div>
                    <div className="text-xs font-semibold text-gray-600">
                      
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
                {/* Etiqueta lateral */}
                <div className="flex col-span-2 justify-center">
                  <div className="px-4 py-8 text-xs font-bold text-white whitespace-nowrap bg-cyan-400 rounded-lg transform origin-center -rotate-90">
                    Overview
                  </div>
                </div>
                
                {/* Caja principal */}
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Total number of articles
                    </div>
                    <div className="mt-1 text-lg font-bold text-gray-600">(n = {flowData.totalInitial})</div>
                  </div>
                </div>
                
                {/* Línea horizontal hacia la derecha */}
                <div className="flex col-span-1 justify-center">
                  <div className="w-full h-0.5 bg-black"></div>
                  <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-black"></div>
                </div>
                
                {/* Caja de exclusión */}
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

            {/* Flecha hacia abajo */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-black"></div>
            </div>
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>

            {/* SELECCIÓN POR TÍTULO Y RESUMEN */}
            <div className="relative">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Espacio para etiqueta */}
                <div className="col-span-2"></div>
                
                {/* Caja principal */}
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Articles for selection by title and abstract
                    </div>
                    <div className="mt-1 text-lg font-bold text-gray-600">(n = {flowData.titleReview})</div>
                  </div>
                </div>
                
                {/* Línea horizontal hacia la derecha */}
                <div className="flex col-span-1 justify-center">
                  <div className="w-full h-0.5 bg-black"></div>
                  <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-black"></div>
                </div>
                
                {/* Caja de exclusión */}
                <div className="col-span-4">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Irrelevant Articles Excluded (Based on inclusion and exclusion criteria)
                    </div>
                    <div className="mt-1 text-xs font-bold text-gray-600">
                      (n = {flowData.titleReview - flowData.abstractReview})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flecha hacia abajo */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-black"></div>
            </div>
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>

            {/* ELEGIBILIDAD */}
            <div className="relative">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Etiqueta lateral */}
                <div className="flex col-span-2 justify-center">
                  <div className="px-4 py-8 text-xs font-bold text-white whitespace-nowrap bg-cyan-400 rounded-lg transform origin-center -rotate-90">
                    Eligibility
                  </div>
                </div>
                
                {/* Caja principal */}
                <div className="col-span-5">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Articles for full-text eligibility evaluation
                    </div>
                    <div className="mt-1 text-lg font-bold text-gray-600">(n = {flowData.abstractReview})</div>
                  </div>
                </div>
                
                {/* Línea horizontal hacia la derecha */}
                <div className="flex col-span-1 justify-center">
                  <div className="w-full h-0.5 bg-black"></div>
                  <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-black"></div>
                </div>
                
                {/* Caja de exclusión */}
                <div className="col-span-4">
                  <div className="p-4 text-center bg-white rounded-lg border-2 border-black shadow-sm">
                    <div className="text-xs font-semibold text-gray-600">
                      Irrelevant Articles Excluded (Based on inclusion and exclusion criteria)
                    </div>
                    <div className="mt-1 text-xs font-bold text-gray-600">
                      (n = {flowData.abstractReview - flowData.finalSelected})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flecha hacia abajo */}
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-black"></div>
            </div>
            <div className="flex justify-center">
              <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-black"></div>
            </div>

            {/* INCLUIDOS */}
            <div className="relative">
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Etiqueta lateral */}
                <div className="flex col-span-2 justify-center">
                  <div className="px-4 py-8 text-xs font-bold text-white whitespace-nowrap bg-cyan-400 rounded-lg transform origin-center -rotate-90">
                    Included
                  </div>
                </div>
                
                {/* Caja principal final */}
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
                
                {/* Espacio vacío */}
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
          <ScatterChart data={visualizationData.bubbleChart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              name="Año" 
              type="category"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis dataKey="y" name="Cantidad" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 bg-white rounded border shadow-lg">
                      <p className="font-semibold">{data.journal}</p>
                      <p>Año: {data.x}</p>
                      <p>Artículos: {data.count}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter 
              dataKey="z" 
              fill="#8884d8" 
              fillOpacity={0.6}
              stroke="#8884d8"
              strokeWidth={2}
            />
          </ScatterChart>
        </ResponsiveContainer>
      ) : (
        <div className="p-8 text-center text-gray-600">
          <p>No hay suficientes datos para generar la gráfica de burbujas</p>
        </div>
      )}
      <div className="p-3 rounded-lg bg-base-200">
        <p className="text-xs text-gray-600">
          El tamaño de cada burbuja representa la cantidad de artículos. 
          Hover sobre las burbujas para ver detalles de la revista y año.
        </p>
      </div>
    </div>
  );

  const renderResearchFocusChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Distribución de Estudios por Enfoque de Investigación</h3>
      {visualizationData.researchFocus && visualizationData.researchFocus.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={visualizationData.researchFocus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {visualizationData.researchFocus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Desglose por Enfoque</h4>
            <div className="space-y-2">
              {visualizationData.researchFocus.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-base-100">
                  <div className="flex items-center">
                    <div 
                      className="mr-3 w-4 h-4 rounded" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-xs font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.value}</div>
                    <div className="text-xs text-gray-600">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-gray-500">
          <p>No hay suficientes datos para clasificar por enfoque de investigación</p>
        </div>
      )}
    </div>
  );

  const renderContextMapChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Mapa de Contexto: Términos Más Frecuentes</h3>
      {visualizationData.contextMap && visualizationData.contextMap.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={visualizationData.contextMap}
              layout="horizontal"
            >
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
          
          {/* Lista complementaria */}
          <div className="p-3 rounded-lg bg-base-200">
            <h4 className="mb-3 font-semibold">Términos Más Relevantes</h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {visualizationData.contextMap.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center p-3 rounded bg-base-100">
                  <div 
                    className="mr-2 w-3 h-3 rounded" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <div className="text-xs font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.value} veces</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
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
      case 'research-focus':
        return renderResearchFocusChart();
      case 'context-map':
        return renderContextMapChart();
      default:
        return renderResearchFlowChart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Visualizaciones Avanzadas</h2>
          <p className="text-gray-600">{smsTitle}</p>
        </div>
        <button
          onClick={downloadChart}
          className="btn btn-outline btn-sm"
        >
          <FaDownload className="mr-2" />
          Descargar
        </button>
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
    </div>
  );
};

export default SMSAdvancedStatistics;