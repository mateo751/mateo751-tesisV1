import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { smsService } from '@/services/smsService';
import { useAuth } from '@/context/AuthContext';
import MappingTable from '@/components/admin/SMSTable'
import Layout from "@/components/layout/Layout";

const SMSList = () => {
    const [smsList, setSmsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('')
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

    if (loading) return (
        <Layout>
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="text-2xl font-medium">Cargando...</div>
            </div>
        </Layout>
    );
    
    if (error) return (
        <Layout>
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="text-2xl font-medium text-red-500">Error: {error}</div>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <section className="py-10 md:py-20 w-full bg-base-200">
                <div className="container mx-auto px-6 md:px-6"> 
                    <div className='mb-10'>
                        <h2 className="text-2x1 font-bold">Gestión de Mapeos Sistemáticos</h2>
                        <p className="text-gray-500">Administre todos sus mapeos en un solo lugar.</p>
                    </div>
                    
                {error && (
                    <div className="alert alert-error shadow-lg mb-6">
                        <div>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
                
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        
                        <MappingTable
                            mappings={smsList}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            onDelete={handleDelete}
                        />
                    </div>
                </div>
                </div>
            </section>
        </Layout>
    );
};
export default SMSList;