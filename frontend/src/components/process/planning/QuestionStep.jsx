import React from 'react';
import { FaQuestionCircle } from 'react-icons/fa';

const QuestionStep= ({ formData, handleChange, errors }) => {
    return (
        <div className="space-y-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Preguntas de Investigación</h1>
            <p className="text-muted-foreground">
                Define las preguntas que guiarán tu revisión sistemática de literatura
            </p>
        </div>
        <div className="bg-gray-700 rounded-lg shadow-sm mb-6 ">
                <div className="bg-gray-700 rounded-lg p-6">
                    <div className="flex items-start gap-2">
                        <FaQuestionCircle className="h-5 w-5 text-blue-500 mt-1" />
                        <div >
                            <h3 className="text-lg font-semibold">Guía para formular preguntas</h3>
                            <p className="text-sm text-amber-50 mt-1">
                                Según Barbara Kitchenham, las preguntas de investigación efectivas deben ser claras, específicas, y
                                estar alineadas con los objetivos del estudio. Utiliza el formato PICOC (Población, Intervención,
                                Comparación, Resultados, Contexto) cuando sea apropiado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        <div className="form-control w-full">
            <label className="label">
            <span className="label-text">Título</span>
            </label>
            <input
            type="text"
            name="titulo_estudio"
            value={formData.titulo_estudio}
            onChange={handleChange}
            className={`input input-bordered w-full ${errors.titulo_estudio ? 'input-error' : ''}`}
            />
            {errors.titulo_estudio && (
            <p className="text-error text-sm mt-1">{errors.titulo_estudio}</p>
            )}
        </div>
        
        <div className="form-control w-full">
            <label className="label">
            <span className="label-text">Autor</span>
            </label>
            <input
            type="text"
            name="autores"
            value={formData.autores}
            onChange={handleChange}
            className={`input input-bordered w-full ${errors.autores ? 'input-error' : ''}`}
            />
            {errors.autores && (
            <p className="text-error text-sm mt-1">{errors.autores}</p>
            )}
        </div>
        
        <div className="form-control w-full">
            <label className="label">
            <span className="label-text">Pregunta Principal</span>
            </label>
            <textarea
            name="pregunta_principal"
            value={formData.pregunta_principal}
            onChange={handleChange}
            className={`textarea textarea-bordered w-full ${errors.pregunta_principal ? 'textarea-error' : ''}`}
            rows="2"
            ></textarea>
            {errors.pregunta_principal && (
            <p className="text-error text-sm mt-1">{errors.pregunta_principal}</p>
            )}
        </div>
        
        <div className="form-control w-full">
            <label className="label">
            <span className="label-text">Sub-Pregunta 1</span>
            </label>
            <input
            type="text"
            name="subpregunta_1"
            value={formData.subpregunta_1}
            onChange={handleChange}
            className="input input-bordered w-full"
            />
        </div>
        
        <div className="form-control w-full">
            <label className="label">
            <span className="label-text">Sub-Pregunta 1</span>
            </label>
            <input
            type="text"
            name="subpregunta_2"
            value={formData.subpregunta_2}
            onChange={handleChange}
            className="input input-bordered w-full"
            />
        </div>
        <div className="form-control w-full">
            <label className="label">
            <span className="label-text">Sub-Pregunta 3</span>
            </label>
            <input
            type="text"
            name="subpregunta_3"
            value={formData.subpregunta_3}
            onChange={handleChange}
            className="input input-bordered w-full"
            />
        </div>
        </div>
    );
};

export default QuestionStep;