import React, { useState } from 'react';
import { FaInfo, FaCheck, FaTimes } from 'react-icons/fa';

const ScopingStep = ({ formData, handleChange, errors, searchQuerySuggestion = null }) => {
    const currentYear = new Date().getFullYear();
    const [showSuggestion, setShowSuggestion] = useState(!!searchQuerySuggestion);

    // Función para aplicar la sugerencia de cadena de búsqueda
    const applySuggestion = () => {
        if (searchQuerySuggestion?.search_query) {
            handleChange({
                target: {
                    name: 'cadena_busqueda',
                    value: searchQuerySuggestion.search_query
                }
            });
            setShowSuggestion(false);
        }
    };

    // Función para rechazar la sugerencia
    const rejectSuggestion = () => {
        setShowSuggestion(false);
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Mapeos Sistemáticos</h2>
            
            {showSuggestion && searchQuerySuggestion && (
                <div className="alert mb-4">
                    <div className="flex items-start gap-3">
                        <FaInfo className="w-6 h-6 mt-1" />
                        <div className="flex-1">
                            <h3 className="font-bold">Sugerencia de cadena de búsqueda generada</h3>
                            <p className="py-2">{searchQuerySuggestion.search_query}</p>
                            <div className="mt-2">
                                <p className="text-sm mb-2">Palabras clave extraídas:</p>
                                <ul className="list-disc list-inside text-sm">
                                    {Object.entries(searchQuerySuggestion.keywords).map(([keyword, synonyms]) => (
                                        <li key={keyword}>
                                            <strong>{keyword}</strong>
                                            {synonyms.length > 0 && (
                                                <span> (Sinónimos: {synonyms.join(', ')})</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={applySuggestion}
                                    className="btn btn-sm btn-success"
                                >
                                    <FaCheck className="mr-1" /> Aplicar sugerencia
                                </button>
                                <button
                                    type="button"
                                    onClick={rejectSuggestion}
                                    className="btn btn-sm btn-ghost"
                                >
                                    <FaTimes className="mr-1" /> Rechazar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Cadena de búsqueda</span>
                </label>
                <textarea
                    name="cadena_busqueda"
                    value={formData.cadena_busqueda}
                    onChange={handleChange}
                    className={`textarea textarea-bordered w-full ${errors.cadena_busqueda ? 'textarea-error' : ''}`}
                    rows="3"
                    placeholder="Ingrese su cadena de búsqueda aquí"
                ></textarea>
                {errors.cadena_busqueda && (
                    <p className="text-error text-sm mt-1">{errors.cadena_busqueda}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: (machine learning OR AI) AND (education OR teaching)
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Año de inicio</span>
                    </label>
                    <input
                        type="number"
                        name="anio_inicio"
                        value={formData.anio_inicio}
                        onChange={handleChange}
                        min="1900"
                        max={currentYear}
                        className={`input input-bordered w-full ${errors.anio_inicio ? 'input-error' : ''}`}
                    />
                    {errors.anio_inicio && (
                        <p className="text-error text-sm mt-1">{errors.anio_inicio}</p>
                    )}
                </div>
                
                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Año Final</span>
                    </label>
                    <input
                        type="number"
                        name="anio_final"
                        value={formData.anio_final}
                        onChange={handleChange}
                        min="1900"
                        max={currentYear}
                        className={`input input-bordered w-full ${errors.anio_final ? 'input-error' : ''}`}
                    />
                    {errors.anio_final && (
                        <p className="text-error text-sm mt-1">{errors.anio_final}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScopingStep;