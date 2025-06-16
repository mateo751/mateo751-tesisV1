import React, { useState, useEffect, useCallback } from 'react';
import { FaSpinner, FaSync, FaFileExport, FaExclamationTriangle } from 'react-icons/fa';
import { smsService } from '@/services/smsService';

const ExtractionStep = ({ formData, smsId, analyzedResults = null, onAnalyzeComplete }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(analyzedResults || []);
    const [error, setError] = useState(null);
    const [selectedArticles, setSelectedArticles] = useState({});
    const [hasAnalyzed, setHasAnalyzed] = useState(false);
    const [showForceReanalysisModal, setShowForceReanalysisModal] = useState(false);
    const [pendingReanalysis, setPendingReanalysis] = useState(false);
    
    // Función para analizar PDFs
    const handleAnalyzePDFs = useCallback(async (forceReanalysis = false) => {
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
            const response = await smsService.analyzePDFs(smsId, formData.pdfFiles, forceReanalysis);
            
            if (response.requires_confirmation && !forceReanalysis) {
                // Si ya existen artículos, mostrar modal de confirmación
                setShowForceReanalysisModal(true);
                setPendingReanalysis(true);
                setIsAnalyzing(false);
                return;
            }
            
            const newResults = response.results || [];
            setResults(newResults);
            setHasAnalyzed(true);
            
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
            setPendingReanalysis(false);
        }
    }, [formData.pdfFiles, smsId, onAnalyzeComplete]);
    
    // Confirmar re-análisis forzado
    const handleConfirmReanalysis = () => {
        setShowForceReanalysisModal(false);
        handleAnalyzePDFs(true);
    };
    
    // Cancelar re-análisis
    const handleCancelReanalysis = () => {
        setShowForceReanalysisModal(false);
        setPendingReanalysis(false);
    };
    
    // Cargar artículos existentes al inicializar
    useEffect(() => {
        const loadExistingArticles = async () => {
            if (smsId && !hasAnalyzed && !analyzedResults) {
                try {
                    const existingArticles = await smsService.getStudiesBySMSId(smsId);
                    if (existingArticles && existingArticles.length > 0) {
                        console.log('Cargando artículos existentes:', existingArticles.length);
                        setResults(existingArticles);
                        setHasAnalyzed(true);
                        
                        // Inicializar selección
                        const initialSelection = {};
                        existingArticles.forEach(article => {
                            initialSelection[article.id] = true;
                        });
                        setSelectedArticles(initialSelection);
                        
                        if (onAnalyzeComplete) {
                            onAnalyzeComplete(existingArticles);
                        }
                    }
                } catch (error) {
                    console.log('No hay artículos existentes o error al cargar:', error);
                }
            }
        };
        
        loadExistingArticles();
    }, [smsId, hasAnalyzed, analyzedResults, onAnalyzeComplete]);
    
    // Inicializar con resultados previos si existen
    useEffect(() => {
        if (analyzedResults && analyzedResults.length > 0) {
            setResults(analyzedResults);
            setHasAnalyzed(true);
            
            // Inicializar selección de artículos existentes
            const initialSelection = {};
            analyzedResults.forEach(result => {
                initialSelection[result.id] = true;
            });
            setSelectedArticles(initialSelection);
        }
    }, [analyzedResults]);
    
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
                <div className="text-center">Extracción y Análisis de Datos</div>
            </div>
            
            {error && (
                <div className="alert alert-error">
                    <span>{error}</span>
                </div>
            )}
            
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => handleAnalyzePDFs(false)}
                        className="btn btn-primary"
                        disabled={isAnalyzing || !formData.pdfFiles?.length}
                    >
                        {isAnalyzing ? (
                            <>
                                <FaSpinner className="mr-2 animate-spin" />
                                Analizando...
                            </>
                        ) : hasAnalyzed ? (
                            <>
                                <FaSync className="mr-2" />
                                Re-analizar PDFs
                            </>
                        ) : (
                            <>
                                <FaSync className="mr-2" />
                                Analizar PDFs
                            </>
                        )}
                    </button>
                    
                    {hasAnalyzed && results.length > 0 && (
                        <div className="text-sm text-gray-600">
                            {results.length} artículos analizados
                        </div>
                    )}
                </div>
                
                <button
                    type="button"
                    onClick={handleExport}
                    className="btn btn-secondary"
                    disabled={isAnalyzing || results.length === 0}
                >
                    <FaFileExport className="mr-2" />
                    Exportar ({Object.values(selectedArticles).filter(Boolean).length})
                </button>
            </div>
            
            {/* Modal de confirmación para re-análisis */}
            {showForceReanalysisModal && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="text-lg font-bold">
                            <FaExclamationTriangle className="inline mr-2 text-warning" />
                            Artículos ya analizados
                        </h3>
                        <p className="py-4">
                            Ya existen artículos analizados para este SMS. 
                            ¿Desea eliminar los artículos existentes y re-analizar los PDFs?
                        </p>
                        <div className="modal-action">
                            <button 
                                className="btn btn-error" 
                                onClick={handleConfirmReanalysis}
                            >
                                Sí, re-analizar
                            </button>
                            <button 
                                className="btn btn-ghost" 
                                onClick={handleCancelReanalysis}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
            
            {/* Tabla de resultados */}
            {results.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr>
                                <th>Seleccionar</th>
                                <th>Título</th>
                                <th>Autores</th>
                                <th>Año</th>
                                <th>DOI</th>
                                <th>Enfoque del estudio</th>
                                <th>Tipo de registro</th>
                                <th>Tipo de técnica</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(result => (
                                <tr key={result.id} className={selectedArticles[result.id] ? "bg-base-200" : ""}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox"
                                            checked={selectedArticles[result.id] || false}
                                            onChange={() => handleToggleSelection(result.id)}
                                        />
                                    </td>
                                    <td className="max-w-xs truncate" title={result.title || result.titulo}>
                                        {result.title || result.titulo}
                                    </td>
                                    <td className="max-w-xs truncate" title={result.authors || result.autores}>
                                        {result.authors || result.autores}
                                    </td>
                                    <td>{result.year || result.anio_publicacion || "N/A"}</td>
                                    <td className="max-w-xs truncate">{result.doi || "N/A"}</td>
                                    <td>{result.res_subpregunta_1 || result.respuesta_subpregunta_1 || "N/A"}</td>
                                    <td>{result.res_subpregunta_2 || result.respuesta_subpregunta_2 || "N/A"}</td>
                                    <td>{result.res_subpregunta_3 || result.respuesta_subpregunta_3 || "N/A"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Mensaje cuando no hay resultados */}
            {!isAnalyzing && results.length === 0 && !pendingReanalysis && (
                <div className="py-8 text-center">
                    <p className="text-gray-500">
                        {formData.pdfFiles?.length > 0 
                            ? 'Haga clic en "Analizar PDFs" para procesar los archivos cargados.'
                            : 'No hay archivos PDF cargados para analizar.'
                        }
                    </p>
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