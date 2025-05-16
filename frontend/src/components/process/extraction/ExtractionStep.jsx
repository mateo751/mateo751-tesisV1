import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner, FaSync, FaFileExport } from 'react-icons/fa';
import { smsService } from '@/services/smsService';

const ExtractionStep = ({ formData, smsId, analyzedResults = null, onAnalyzeComplete }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(analyzedResults || []);
    const [error, setError] = useState(null);
    const [selectedArticles, setSelectedArticles] = useState({});
    
    // Función para analizar PDFs
    const handleAnalyzePDFs = useCallback(async () => {
        if (!formData.pdfFiles?.length) {
            setError('No hay archivos PDF para analizar');
            return;
        }
        
        if (!smsId) {
            setError('No se encontró un ID válido para el SMS');
            return;
        }
        
        setIsAnalyzing(true);
        setError(null);
        
        try {
            const response = await smsService.analyzePDFs(smsId, formData.pdfFiles);
            const newResults = response.results || [];
            setResults(newResults);
            
            // Inicializar selección de artículos (todos seleccionados por defecto)
            const initialSelection = {};
            newResults.forEach(result => {
                initialSelection[result.id] = true;
            });
            setSelectedArticles(initialSelection);
            
            // Notificar al componente padre que se completó el análisis
            if (onAnalyzeComplete) {
                onAnalyzeComplete(newResults);
            }
        } catch (err) {
            console.error('Error al analizar PDFs:', err);
            setError(`Error al analizar PDFs: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsAnalyzing(false);
        }
    }, [formData.pdfFiles, smsId, onAnalyzeComplete]);
    
    // Iniciar análisis automáticamente si hay archivos y no hay resultados previos
    useEffect(() => {
        if (!analyzedResults && formData.pdfFiles?.length > 0 && !isAnalyzing) {
            handleAnalyzePDFs();
        } else if (analyzedResults) {
            setResults(analyzedResults);
            // Inicializar selección de artículos existentes
            const initialSelection = {};
            analyzedResults.forEach(result => {
                initialSelection[result.id] = true;
            });
            setSelectedArticles(initialSelection);
        }
    }, [analyzedResults, formData.pdfFiles, handleAnalyzePDFs, isAnalyzing]);
    
    // Manejar la exportación de datos
    const handleExport = async () => {
        try {
            // Filtrar los artículos seleccionados
            const selectedIds = Object.entries(selectedArticles)
                .filter(([isSelected]) => isSelected)
                .map(([id]) => id);
                
            if (selectedIds.length === 0) {
                setError('No hay artículos seleccionados para exportar');
                return;
            }
            
            // Llamar al servicio para exportar
            const response = await smsService.exportArticles(smsId, selectedIds);
            
            // Crear un objeto URL y generar un enlace de descarga
            const blob = new Blob([response], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `articulos_sms_${smsId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Error al exportar artículos:', err);
            setError(`Error al exportar: ${err.message || 'Error desconocido'}`);
        }
    };
    
    // Manejar cambio en la selección de artículos
    const handleToggleSelection = (id) => {
        setSelectedArticles(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Mapeos Sistemáticos</h2>
                <div className="text-center">Selección de artículos</div>
            </div>
            
            {error && (
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={handleAnalyzePDFs}
                    className="btn btn-primary"
                    disabled={isAnalyzing || !formData.pdfFiles?.length}
                >
                    {isAnalyzing ? (
                        <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Analizando...
                        </>
                    ) : (
                        <>
                            <FaSync className="mr-2" />
                            Re-analizar PDFs
                        </>
                    )}
                </button>
                
                <button
                    type="button"
                    onClick={handleExport}
                    className="btn btn-secondary"
                    disabled={isAnalyzing || results.length === 0}
                >
                    <FaFileExport className="mr-2" />
                    Exportar
                </button>
            </div>
            
            {/* Tabla de resultados */}
            {results.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>título</th>
                                <th>Autores</th>
                                <th>Año</th>
                                <th>Enfoque del estudio</th>
                                <th>Tipo de registro</th>
                                <th>Tipo de técnica</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(result => (
                                <tr key={result.id} className={selectedArticles[result.id] ? "bg-base-200" : ""}>
                                    <td>{result.title}</td>
                                    <td>{result.authors}</td>
                                    <td>{result.year || "N/A"}</td>
                                    <td>{result.res_subpregunta_1 || "Prueba 1"}</td>
                                    <td>{result.res_subpregunta_2 || "Prueba 1"}</td>
                                    <td>{result.res_subpregunta_3 || "Prueba 1"}</td>
                                    <td>
                                        <button 
                                            className="btn btn-circle btn-ghost btn-sm"
                                            onClick={() => handleToggleSelection(result.id)}
                                        >
                                            ...
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Mensaje cuando no hay resultados */}
            {!isAnalyzing && results.length === 0 && (
                <div className="py-8 text-center">
                    <p className="text-gray-500">No hay artículos analizados. Por favor, analice sus PDFs.</p>
                </div>
            )}
            
            {/* Mensaje de carga durante el análisis */}
            {isAnalyzing && (
                <div className="flex flex-col items-center justify-center p-8">
                    <FaSpinner className="w-12 h-12 mb-4 animate-spin text-primary" />
                    <p className="text-lg">Analizando PDFs...</p>
                    <p className="text-sm text-gray-500">
                        Este proceso puede tomar varios minutos dependiendo del número y tamaño de los archivos.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ExtractionStep;