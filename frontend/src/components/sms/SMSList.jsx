import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { smsService } from '../../services/smsService';
import { useAuth } from '../../context/AuthContext';

const SMSList = () => {
    const [smsList, setSmsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/sms');
            return;
        }
        loadSMSList();
    }, [user]);

    const loadSMSList = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await smsService.getAllSMS();
            setSmsList(data);
        } catch (err) {
            console.error('Error al cargar la lista de SMS:', err);
            if (err.response?.status === 401) {
                setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                navigate('/auth/login');
            } else {
                setError('Error al cargar la lista de SMS. Por favor, intente nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este SMS?')) {
            try {
                setError(null);
                await smsService.deleteSMS(id);
                await loadSMSList();
            } catch (err) {
                console.error('Error al eliminar el SMS:', err);
                if (err.response?.status === 401) {
                    setError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                    navigate('/auth/login');
                } else {
                    setError('Error al eliminar el SMS. Por favor, intente nuevamente.');
                }
            }
        }
    };

    if (!user) {
        return null; // No renderizar nada si no hay usuario autenticado
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Lista de SMS</h1>
                <Link
                    to="/sms/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Crear Nuevo SMS
                </Link>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {smsList.map((sms) => (
                    <div
                        key={sms.id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold mb-2">{sms.titulo_estudio}</h2>
                        <p className="text-gray-600 mb-2">Autores: {sms.autores}</p>
                        <p className="text-gray-600 mb-4">
                            Fecha de creación: {new Date(sms.fecha_creacion).toLocaleDateString()}
                        </p>
                        
                        <div className="flex justify-end space-x-2">
                            <Link
                                to={`/sms/${sms.id}`}
                                className="text-indigo-600 hover:text-indigo-800"
                            >
                                Ver
                            </Link>
                            <Link
                                to={`/sms/${sms.id}/edit`}
                                className="text-green-600 hover:text-green-800"
                            >
                                Editar
                            </Link>
                            <button
                                onClick={() => handleDelete(sms.id)}
                                className="text-red-600 hover:text-red-800"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {smsList.length === 0 && !error && (
                <div className="text-center text-gray-500 mt-8">
                    No hay SMS disponibles. ¡Crea uno nuevo!
                </div>
            )}
        </div>
    );
};

export default SMSList; 