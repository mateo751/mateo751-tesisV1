import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSMS } from '@/context/SMSContext';
import { smsService } from '@/services/smsService';
import { useNavigate } from 'react-router-dom';

const SMSList = () => {
    const { smsData, setSmsData } = useSMS();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const loadSMSList = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await smsService.getAllSMS();
            setSmsData(data);
        } catch (err) {
            console.error('Error al cargar la lista de SMS:', err);
            if (err.message === 'No hay token de autenticación') {
                setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                navigate('/auth/login');
            } else if (err.response?.status === 401) {
                setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                navigate('/auth/login');
            } else {
                setError('Error al cargar la lista de SMS. Por favor, intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await loadSMSList(); // Llama a la función para obtener los SMS
        };

        loadData();
    }, [loadSMSList, navigate]);

    const handleDelete = (id) => {
        if (window.confirm('¿Estás seguro de querer eliminar este SMS?')) {
            deleteSMS(id);
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Lista de Systematic Mapping Studies</h2>
                <Link 
                to="/admin/sms/new" 
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded shadow-sm"
                >
                Nuevo SMS
                </Link>
            </div>

            {smsData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay SMS disponibles. ¡Crea uno nuevo!</p>
            ) : (
                <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Creación</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudios</th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {smsData.map((sms) => (
                        <tr key={sms.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm text-gray-900">{sms.title}</td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                            {new Date(sms.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                            sms.status === 'active' ? 'bg-green-100 text-green-800' : 
                            sms.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                            }`}>
                            {sms.status === 'active' ? 'Activo' : 
                            sms.status === 'draft' ? 'Borrador' : sms.status}
                            </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                            {sms.studiesCount || 0}
                        </td>
                        <td className="py-4 px-4 text-sm font-medium">
                            <div className="flex space-x-2">
                            <Link 
                                to={`/admin/sms/${sms.id}`}
                                className="text-blue-600 hover:text-blue-900"
                            >
                                Ver
                            </Link>
                            <Link 
                                to={`/admin/sms/${sms.id}/edit`}
                                className="text-yellow-600 hover:text-yellow-900"
                            >
                                Editar
                            </Link>
                            <button
                                onClick={() => handleDelete(sms.id)}
                                className="text-red-600 hover:text-red-900"
                            >
                                Eliminar
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>
    );
};

export default SMSList;
