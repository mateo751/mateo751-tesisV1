import React from 'react';

const ScopingStep = ({ formData, handleChange, errors }) => {
    const currentYear = new Date().getFullYear();
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Mapeos Sistemáticos</h2>
            
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