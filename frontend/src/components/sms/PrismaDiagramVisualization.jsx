    // frontend/src/components/sms/PrismaDiagramVisualization.jsx

    import React, { useState, useEffect, useCallback } from 'react';
    import { 
    FaSpinner, 
    FaDownload, 
    FaProjectDiagram, 
    FaInfoCircle, 
    FaSync, 
    
    FaCheckCircle,
    FaTimesCircle,
    } from 'react-icons/fa';
    import { smsService } from '@/services/smsService';

    const PrismaDiagramVisualization = ({ smsId, smsTitle }) => {
    // Estados del componente para manejo completo de la funcionalidad
    const [prismaData, setPrismaData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);


    // Función principal para cargar el diagrama PRISMA
    const loadPrismaDiagram = useCallback(async () => {
        if (!smsId) return;
        
        try {
        setLoading(true);
        setError(null);
        
        console.log('Generando diagrama PRISMA inteligente...');
        const result = await smsService.getPrismaDiagram(smsId);
        
        if (result.success) {
            setPrismaData(result);
            console.log('Diagrama PRISMA generado exitosamente');
        } else {
            setError(result.error || 'Error generando diagrama PRISMA');
        }
        } catch (err) {
        console.error('Error al cargar diagrama PRISMA:', err);
        setError('Error al procesar el diagrama PRISMA: ' + err.message);
        } finally {
        setLoading(false);
        }
    }, [smsId]);

    // Efecto para cargar automáticamente al montar el componente
    useEffect(() => {
        loadPrismaDiagram();
    }, [loadPrismaDiagram]);

    // Función para descargar el diagrama como imagen PNG
    const downloadDiagram = () => {
        if (!prismaData?.image_base64) return;
        
        try {
        // Proceso de conversión de base64 a archivo descargable
        const byteCharacters = atob(prismaData.image_base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        
        // Creación del enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prisma_diagram_${smsId}_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        
        // Limpieza de memoria
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        } catch (error) {
        console.error('Error al descargar diagrama:', error);
        alert('Error al descargar el diagrama PRISMA');
        }
    };

    // Función para regenerar el diagrama
    const regenerateDiagram = () => {
        loadPrismaDiagram();
    };

    // Función para formatear números con separadores de miles
    const formatNumber = (num) => {
        return new Intl.NumberFormat('es-ES').format(num);
    };

    // Función para calcular porcentajes
    const calculatePercentage = (part, total) => {
        if (total === 0) return 0;
        return ((part / total) * 100).toFixed(1);
    };

    // Renderizado del estado de carga
    if (loading) {
        return (
        <div className="flex flex-col justify-center items-center py-12 space-y-4">
            <div className="relative">
            <FaSpinner className="w-12 h-12 animate-spin text-primary" />
            <FaProjectDiagram className="absolute top-0 left-0 w-12 h-12 animate-pulse text-secondary" />
            </div>
            <div className="text-center">
            <h3 className="text-lg font-semibold">Generando Diagrama PRISMA</h3>
            <p className="max-w-md text-sm text-gray-600">
                Aplicando análisis semántico para generar un diagrama de flujo PRISMA 
                profesional que sigue estándares internacionales de investigación.
            </p>
            {/* Indicadores de progreso del proceso PRISMA */}
            <div className="mt-4 space-y-2">
                <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Analizando proceso de identificación...</span>
                </div>
                <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Calculando etapas de cribado...</span>
                </div>
                <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Evaluando criterios de elegibilidad...</span>
                </div>
                <div className="flex justify-center items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span>Generando visualización PRISMA...</span>
                </div>
            </div>
            </div>
        </div>
        );
    }

    // Renderizado del estado de error
    if (error) {
        return (
        <div className="p-6 text-center">
            <div className="mb-4">
            <FaInfoCircle className="mx-auto text-4xl text-error" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-error">
            Error en el Diagrama PRISMA
            </h3>
            <p className="mb-4 text-sm text-gray-600">{error}</p>
            <div className="space-x-2">
            <button
                onClick={regenerateDiagram}
                className="btn btn-primary btn-sm"
            >
                <FaProjectDiagram className="mr-2" />
                Reintentar Generación
            </button>
            </div>
        </div>
        );
    }

    // Renderizado cuando no hay datos
    if (!prismaData) {
        return (
        <div className="p-6 text-center">
            <div className="mb-4">
            <FaProjectDiagram className="mx-auto text-4xl text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-700">
            No hay datos para diagrama PRISMA
            </h3>
            <p className="text-sm text-gray-600">
            No se pudo generar el diagrama PRISMA. Verifique que haya artículos procesados.
            </p>
        </div>
        );
    }

    const { prisma_statistics, image_base64 } = prismaData;

    return (
        <div className="space-y-6">
        {/* Header con información y controles */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
            <h2 className="flex items-center text-2xl font-bold">
                <FaProjectDiagram className="mr-3 text-primary" />
                Diagrama de Flujo PRISMA
            </h2>
            <p className="text-gray-600">{smsTitle}</p>
            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                <span>📊 Estándar PRISMA 2020</span>
                <span>🤖 Generado con IA</span>
                <span>📈 {prisma_statistics?.total_processed || 0} artículos procesados</span>
                <span>✅ {prisma_statistics?.final_included || 0} incluidos finalmente</span>
            </div>
            </div>
            
            {/* Panel de controles */}
            <div className="flex space-x-2">
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="btn btn-outline btn-sm"
            >
                <FaInfoCircle className="mr-2" />
                {showDetails ? 'Ocultar' : 'Mostrar'} Metodología
            </button>
            <button
                onClick={downloadDiagram}
                className="btn btn-primary btn-sm"
                disabled={!image_base64}
            >
                <FaDownload className="mr-2" />
                Descargar PNG
            </button>
            <button
                onClick={regenerateDiagram}
                className="btn btn-secondary btn-sm"
            >
                <FaSync className="mr-2" />
                Regenerar
            </button>
            </div>
        </div>

        {/* Panel informativo sobre metodología PRISMA */}
        {showDetails && (
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
            <h4 className="mb-2 font-semibold text-green-800">
                📋 Metodología PRISMA 2020 con Inteligencia Artificial
            </h4>
            <div className="space-y-2 text-sm text-green-700">
                <p>
                <strong>PRISMA (Preferred Reporting Items for Systematic Reviews and Meta-Analyses):</strong> 
                Estándar internacional para reportar revisiones sistemáticas y meta-análisis, 
                asegurando transparencia y reproducibilidad en la investigación.
                </p>
                <p>
                <strong>Innovación con IA:</strong> Nuestro sistema automatiza la generación del diagrama 
                utilizando análisis semántico para inferir razones de exclusión y optimizar el proceso 
                de selección de estudios.
                </p>
                <p>
                <strong>Ventajas:</strong> Eliminación de sesgos manuales, consistencia en criterios de selección, 
                y generación automática de visualizaciones que cumplen con estándares académicos internacionales.
                </p>
            </div>
            </div>
        )}

        {/* Estadísticas resumidas del proceso */}
        {prisma_statistics && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg stat bg-primary/10">
                <div className="stat-title text-primary">Tasa de Selección</div>
                <div className="stat-value text-primary">{prisma_statistics.selection_rate}%</div>
                <div className="stat-desc text-primary">
                {prisma_statistics.final_included} de {prisma_statistics.total_processed} artículos
                </div>
            </div>
            
            <div className="rounded-lg stat bg-success/10">
                <div className="stat-title text-success">Incluidos</div>
                <div className="flex items-center stat-value text-success">
                <FaCheckCircle className="mr-2" />
                {formatNumber(prisma_statistics.final_included)}
                </div>
                <div className="stat-desc text-success">Estudios seleccionados</div>
            </div>
            
            <div className="rounded-lg stat bg-error/10">
                <div className="stat-title text-error">Excluidos</div>
                <div className="flex items-center stat-value text-error">
                <FaTimesCircle className="mr-2" />
                {formatNumber(prisma_statistics.total_processed - prisma_statistics.final_included)}
                </div>
                <div className="stat-desc text-error">Por criterios específicos</div>
            </div>
            
            <div className="rounded-lg stat bg-info/10">
                <div className="stat-title text-info">IA Aplicada</div>
                <div className="stat-value text-info">
                {prisma_statistics.ai_applied ? '✓' : '○'}
                </div>
                <div className="stat-desc text-info">
                {prisma_statistics.ai_applied ? 'Análisis semántico activo' : 'Modo básico'}
                </div>
            </div>
            </div>
        )}

        {/* Diagrama PRISMA principal */}
        <div className="shadow-lg card bg-base-100">
            <div className="card-body">
            <div className="text-center">
                {image_base64 ? (
                <div className="relative">
                    <img
                    src={`data:image/png;base64,${image_base64}`}
                    alt="Diagrama de Flujo PRISMA - Proceso de Selección de Estudios"
                    className="mx-auto max-w-full h-auto rounded-lg border shadow-md"
                    />
                    {/* Badges informativos superpuestos */}
                    <div className="absolute top-2 right-2 space-y-1">
                    {prisma_statistics?.ai_applied && (
                        <div className="badge badge-info">
                        <FaProjectDiagram className="mr-1" />
                        IA Aplicada
                        </div>
                    )}
                    </div>
                </div>
                ) : (
                <div className="p-8 text-gray-500">
                    No se pudo generar el diagrama PRISMA
                </div>
                )}
            </div>
            
            {/* Nota explicativa debajo del diagrama */}
            {image_base64 && (
                <div className="p-3 mt-4 text-sm bg-blue-50 rounded-lg">
                <p className="text-blue-700">
                    📋 <strong>Interpretación del Diagrama PRISMA:</strong> Este diagrama de flujo muestra 
                    el proceso sistemático de selección de estudios siguiendo los estándares PRISMA 2020. 
                    Cada caja representa una etapa del proceso, desde la identificación inicial hasta la 
                    inclusión final de estudios. Las cajas rojas muestran exclusiones con sus respectivas 
                    razones, mientras que la caja azul representa nuestra innovación: el análisis semántico 
                    automático aplicado a los estudios incluidos.
                </p>
                </div>
            )}
            </div>
        </div>

        {/* Panel de estadísticas detalladas del proceso PRISMA */}
        {prisma_statistics?.stages && (
            <div className="shadow-lg card bg-base-100">
            <div className="card-body">
                <h3 className="mb-4 text-lg card-title">
                📊 Estadísticas Detalladas del Proceso PRISMA
                </h3>
                
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Etapas del proceso */}
                <div>
                    <h4 className="mb-3 font-semibold text-primary">Etapas del Proceso</h4>
                    <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded bg-base-200">
                        <span className="text-sm font-medium">Búsqueda inicial</span>
                        <span className="font-bold">{formatNumber(prisma_statistics.stages.initial_search)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded bg-base-200">
                        <span className="text-sm font-medium">Después de eliminar duplicados</span>
                        <span className="font-bold">{formatNumber(prisma_statistics.stages.after_duplicates)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded bg-base-200">
                        <span className="text-sm font-medium">Cribado por título/resumen</span>
                        <span className="font-bold">{formatNumber(prisma_statistics.stages.title_abstract_screening)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded bg-base-200">
                        <span className="text-sm font-medium">Evaluación texto completo</span>
                        <span className="font-bold">{formatNumber(prisma_statistics.stages.full_text_assessed)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded bg-success/20">
                        <span className="text-sm font-medium">Estudios incluidos finalmente</span>
                        <span className="font-bold text-success">{formatNumber(prisma_statistics.stages.final_included)}</span>
                    </div>
                    </div>
                </div>

                {/* Análisis de exclusiones */}
                <div>
                    <h4 className="mb-3 font-semibold text-error">Análisis de Exclusiones</h4>
                    <div className="space-y-3">
                    <div className="p-3 rounded bg-error/10">
                        <div className="mb-2 text-sm font-medium text-error">Duplicados eliminados</div>
                        <div className="flex justify-between">
                        <span className="text-xs">Cantidad:</span>
                        <span className="font-bold">{formatNumber(prisma_statistics.stages.duplicates_removed)}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="text-xs">Porcentaje:</span>
                        <span className="font-bold">
                            {calculatePercentage(
                            prisma_statistics.stages.duplicates_removed, 
                            prisma_statistics.stages.initial_search
                            )}%
                        </span>
                        </div>
                    </div>
                    
                    <div className="p-3 rounded bg-error/10">
                        <div className="mb-2 text-sm font-medium text-error">Excluidos por título/resumen</div>
                        <div className="flex justify-between">
                        <span className="text-xs">Cantidad:</span>
                        <span className="font-bold">{formatNumber(prisma_statistics.stages.title_abstract_excluded)}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="text-xs">Porcentaje:</span>
                        <span className="font-bold">
                            {calculatePercentage(
                            prisma_statistics.stages.title_abstract_excluded,
                            prisma_statistics.stages.after_duplicates
                            )}%
                        </span>
                        </div>
                    </div>
                    
                    <div className="p-3 rounded bg-error/10">
                        <div className="mb-2 text-sm font-medium text-error">Excluidos por texto completo</div>
                        <div className="flex justify-between">
                        <span className="text-xs">Cantidad:</span>
                        <span className="font-bold">{formatNumber(prisma_statistics.stages.full_text_excluded)}</span>
                        </div>
                        <div className="flex justify-between">
                        <span className="text-xs">Porcentaje:</span>
                        <span className="font-bold">
                            {calculatePercentage(
                            prisma_statistics.stages.full_text_excluded,
                            prisma_statistics.stages.full_text_assessed
                            )}%
                        </span>
                        </div>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            </div>
        )}
        </div>
    );
    };

    export default PrismaDiagramVisualization;