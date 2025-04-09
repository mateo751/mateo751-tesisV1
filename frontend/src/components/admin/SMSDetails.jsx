// src/pages/admin/components/SMSDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSMS } from '@/context/SMSContext';

const SMSDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchSMSById, currentSMS, loading, error, deleteSMS, fetchStudiesBySMSId } = useSMS();
  const [studies, setStudies] = useState([]);
  const [studiesLoading, setStudiesLoading] = useState(false);
  
  useEffect(() => {
    const loadSMS = async () => {
      await fetchSMSById(id);
    };
    
    loadSMS();
  }, [id]);
  
  useEffect(() => {
    const loadStudies = async () => {
      if (currentSMS) {
        setStudiesLoading(true);
        try {
          const studiesData = await fetchStudiesBySMSId(id);
          setStudies(studiesData);
        } catch (err) {
          console.error('Error cargando estudios:', err);
        } finally {
          setStudiesLoading(false);
        }
      }
    };
    
    loadStudies();
  }, [currentSMS, id]);
  
  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este SMS?')) {
      const success = await deleteSMS(id);
      if (success) {
        navigate('/admin/sms');
      }
    }
  };
  
  if (loading) return <div className="text-center py-4">Cargando...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;
  if (!currentSMS) return <div className="text-center py-4">SMS no encontrado</div>;
  
  const renderStatusBadge = (status) => {
    const statusConfig = {
      'active': { bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Activo' },
      'draft': { bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', label: 'Borrador' },
      'completed': { bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'Completado' },
      'archived': { bgColor: 'bg-gray-100', textColor: 'text-gray-800', label: 'Archivado' }
    };
    
    const config = statusConfig[status] || statusConfig['draft'];
    
    return (
      <span className={`${config.bgColor} ${config.textColor} px-2 py-1 rounded-full text-xs font-medium`}>
        {config.label}
      </span>
    );
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Detalles del SMS</h2>
        <div className="flex space-x-2">
          <Link
            to={`/admin/sms/${id}/edit`}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded shadow-sm"
          >
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded shadow-sm"
          >
            Eliminar
          </button>
          <Link
            to="/admin/sms"
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded shadow-sm"
          >
            Volver
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">{currentSMS.title}</h3>
            <div className="flex items-center mb-2">
              <span className="text-gray-600 text-sm mr-2">Estado:</span>
              {renderStatusBadge(currentSMS.status)}
            </div>
            <p className="text-gray-700 mb-4">{currentSMS.description}</p>
            <div className="text-sm text-gray-500">
              Creado: {new Date(currentSMS.createdAt).toLocaleDateString()}
              {currentSMS.updatedAt && (
                <span> | Actualizado: {new Date(currentSMS.updatedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Información General</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Estudios:</p>
              <p className="text-lg">{studies.length}</p>
            </div>
            <Link
              to={`/admin/sms/${id}/studies`}
              className="block text-blue-600 hover:text-blue-800 font-medium"
            >
              Gestionar Estudios
            </Link>
            <Link
              to={`/admin/sms/${id}/analysis`}
              className="block text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver Análisis
            </Link>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Preguntas de Investigación</h3>
          {currentSMS.researchQuestions ? (
            <ul className="list-disc list-inside space-y-2">
              {currentSMS.researchQuestions.split('\n').map((question, index) => (
                question.trim() && <li key={index} className="text-gray-700">{question.trim()}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No hay preguntas de investigación definidas</p>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Cadena de Búsqueda</h3>
          {currentSMS.searchString ? (
            <div className="bg-white p-3 rounded border border-gray-200">
              <pre className="whitespace-pre-wrap text-sm">{currentSMS.searchString}</pre>
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay cadena de búsqueda definida</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Criterios de Inclusión</h3>
          {currentSMS.inclusionCriteria ? (
            <ul className="list-disc list-inside space-y-2">
              {currentSMS.inclusionCriteria.split('\n').map((criterion, index) => (
                criterion.trim() && <li key={index} className="text-gray-700">{criterion.trim()}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No hay criterios de inclusión definidos</p>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Criterios de Exclusión</h3>
          {currentSMS.exclusionCriteria ? (
            <ul className="list-disc list-inside space-y-2">
              {currentSMS.exclusionCriteria.split('\n').map((criterion, index) => (
                criterion.trim() && <li key={index} className="text-gray-700">{criterion.trim()}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No hay criterios de exclusión definidos</p>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Estudios Incluidos</h3>
          <Link
            to={`/admin/sms/${id}/studies/add`}
            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
          >
            Añadir Estudios
          </Link>
        </div>
        
        {studiesLoading ? (
          <p className="text-center py-4">Cargando estudios...</p>
        ) : studies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Autores</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Año</th>
                  <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {studies.map((study) => (
                  <tr key={study.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 text-sm">{study.title}</td>
                    <td className="py-2 px-3 text-sm">{study.authors}</td>
                    <td className="py-2 px-3 text-sm">{study.year}</td>
                    <td className="py-2 px-3 text-sm">
                      <div className="flex space-x-2">
                        <Link 
                          to={`/admin/sms/${id}/studies/${study.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
                        </Link>
                        <Link 
                          to={`/admin/sms/${id}/studies/${study.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 italic text-center py-4">No hay estudios añadidos a este SMS</p>
        )}
      </div>
    </div>
  );
};

export default SMSDetails;