import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { smsService } from '../../services/smsService';

const SMSForm = ({ smsId = null, initialData = null }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        titulo_estudio: '',
        autores: '',
        preguntas_investigacion: '',
        fuentes: '',
        criterios_inclusion_exclusion: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (smsId) {
            loadSMS();
        } else if (initialData) {
            setFormData(initialData);
        }
    }, [smsId, initialData]);

    const loadSMS = async () => {
        try {
            setLoading(true);
            const data = await smsService.getSMSById(smsId);
            setFormData(data);
        } catch (err) {
            setError('Error al cargar el SMS');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (smsId) {
                await smsService.updateSMS(smsId, formData);
            } else {
                await smsService.createSMS(formData);
            }
            navigate('/sms/');
        } catch (err) {
            setError('Error al guardar el SMS');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto p-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Título del Estudio
                </label>
                <input
                    type="text"
                    name="titulo_estudio"
                    value={formData.titulo_estudio}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Autores
                </label>
                <input
                    type="text"
                    name="autores"
                    value={formData.autores}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Preguntas de Investigación
                </label>
                <textarea
                    name="preguntas_investigacion"
                    value={formData.preguntas_investigacion}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Fuentes
                </label>
                <textarea
                    name="fuentes"
                    value={formData.fuentes}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Criterios de Inclusión/Exclusión
                </label>
                <textarea
                    name="criterios_inclusion_exclusion"
                    value={formData.criterios_inclusion_exclusion}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <div className="flex justify-end space-x-3">
                <button
                    type="button"
                    onClick={() => navigate('/sms')}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {smsId ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </form>
    );
};

export default SMSForm; 