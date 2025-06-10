// frontend/src/components/SMS/SMSStatistics.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { FaChartBar, FaChartPie, FaChartLine, FaDownload, FaSpinner } from 'react-icons/fa';
import { smsService } from '@/services/smsService';

const SMSStatistics = ({ smsId, smsTitle }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChart, setActiveChart] = useState('selection-process');

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await smsService.getSMSStatistics(smsId);
      setStatistics(data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [smsId]);

  useEffect(() => {
    if (smsId) {
      fetchStatistics();
    }
  }, [smsId, fetchStatistics]);

  const downloadChart = () => {
    // Implementar descarga de gráficas si es necesario
    console.log('Descargar gráfica');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Cargando estadísticas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="p-8 text-center">
        <p>No hay estadísticas disponibles</p>
      </div>
    );
  }

  const { general, by_status, by_year, by_focus, selection_process } = statistics;

  const chartTabs = [
    { id: 'selection-process', label: 'Proceso de Selección', icon: FaChartLine },
    { id: 'status-distribution', label: 'Distribución por Estado', icon: FaChartPie },
    { id: 'year-distribution', label: 'Artículos por Año', icon: FaChartBar },
    { id: 'focus-distribution', label: 'Por Enfoque', icon: FaChartBar },
  ];

  const renderSelectionProcessChart = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Proceso de Selección de Estudios</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={selection_process}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="stage" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis />
          <Tooltip />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#3B82F6" 
            fill="#3B82F6" 
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="p-4 rounded-lg bg-base-200">
        <p className="text-sm text-gray-600">
          Este gráfico muestra el número de artículos en cada etapa del proceso de selección, 
          desde la búsqueda inicial hasta los artículos finalmente incluidos.
        </p>
      </div>
    </div>
  );

  const renderStatusDistribution = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Distribución de Artículos por Estado</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={by_status}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {by_status.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="space-y-4">
          <h4 className="font-semibold">Resumen General</h4>
          <div className="space-y-2">
            <div className="p-3 rounded-lg stat bg-base-200">
              <div className="text-sm stat-title">Total de Artículos</div>
              <div className="text-2xl stat-value">{general.total_articles}</div>
            </div>
            <div className="p-3 rounded-lg stat bg-base-200">
              <div className="text-sm stat-title">Tasa de Selección</div>
              <div className="text-xl stat-value text-success">{general.selection_rate}%</div>
            </div>
          </div>
          
          <div className="space-y-2">
            {by_status.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-base-100">
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
    </div>
  );

  const renderYearDistribution = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Distribución de Artículos por Año</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={by_year}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="anio_publicacion" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderFocusDistribution = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Distribución por Enfoque de Estudio</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={by_focus} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="enfoque" type="category" width={150} />
          <Tooltip />
          <Bar dataKey="count" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderActiveChart = () => {
    switch (activeChart) {
      case 'selection-process':
        return renderSelectionProcessChart();
      case 'status-distribution':
        return renderStatusDistribution();
      case 'year-distribution':
        return renderYearDistribution();
      case 'focus-distribution':
        return renderFocusDistribution();
      default:
        return renderSelectionProcessChart();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas del Mapeo</h2>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg stat bg-primary text-primary-content">
          <div className="stat-title text-primary-content/70">Total</div>
          <div className="stat-value">{general.total_articles}</div>
          <div className="stat-desc text-primary-content/70">Artículos procesados</div>
        </div>
        <div className="rounded-lg stat bg-success text-success-content">
          <div className="stat-title text-success-content/70">Seleccionados</div>
          <div className="stat-value">{general.selected_count}</div>
          <div className="stat-desc text-success-content/70">{general.selection_rate}% del total</div>
        </div>
        <div className="rounded-lg stat bg-error text-error-content">
          <div className="stat-title text-error-content/70">Rechazados</div>
          <div className="stat-value">{general.rejected_count}</div>
          <div className="stat-desc text-error-content/70">Excluidos del estudio</div>
        </div>
        <div className="rounded-lg stat bg-warning text-warning-content">
          <div className="stat-title text-warning-content/70">Pendientes</div>
          <div className="stat-value">{general.pending_count}</div>
          <div className="stat-desc text-warning-content/70">Por revisar</div>
        </div>
      </div>
    </div>
  );
};

export default SMSStatistics;