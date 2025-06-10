// frontend/src/components/SMS/SMSDetails.jsx - Versión completa con debug
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';
import { useSMS } from '@/context/SMSContext';
import { smsService } from '@/services/smsService'; // Importar el servicio directamente
import Layout from '@/components/layout/Layout';

const SMSDetails = () => {
  const { id } = useParams();
  const { smsList } = useSMS(); // Solo usamos smsList del contexto
  const [sms, setSms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSMSDetails = useCallback(async () => {
    try {
      console.log('Cargando detalles para SMS ID:', id);
      setLoading(true);
      setError(null);
      
      // Verificar si tenemos datos completos en la lista
      const existingSMS = smsList.find(s => s.id.toString() === id.toString());
      console.log('SMS existente en lista:', existingSMS);
      
      // Verificar si los datos están completos (tienen subpreguntas)
      const hasCompleteData = existingSMS && (
        existingSMS.subpregunta_1 !== undefined ||
        existingSMS.criterios_inclusion !== undefined ||
        existingSMS.cadena_busqueda !== undefined
      );
      
      console.log('¿Datos completos en lista?', hasCompleteData);
      
      if (hasCompleteData) {
        console.log('Usando datos completos del contexto');
        setSms(existingSMS);
        setLoading(false);
        return;
      }
      
      // Cargar detalles completos usando el servicio directo
      console.log('Cargando detalles completos desde API usando smsService...');
      let smsData;
      
      // Probar primero con getSMSDetails si existe, sino con getSMSById
      if (smsService.getSMSDetails) {
        smsData = await smsService.getSMSDetails(id);
      } else {
        smsData = await smsService.getSMSById(id);
      }
      
      console.log('Datos del SMS obtenidos desde API:', JSON.stringify(smsData, null, 2));
      
      if (smsData) {
        setSms(smsData);
      } else {
        // Si la API falla pero tenemos datos básicos, usarlos
        if (existingSMS) {
          console.log('API falló, usando datos básicos del contexto');
          setSms(existingSMS);
          setError('Algunos datos pueden estar incompletos (error de conectividad)');
        } else {
          setError('SMS no encontrado');
        }
      }
    } catch (err) {
      console.error('Error al cargar detalles del SMS:', err);
      
      // Si hay error de red pero tenemos datos básicos en la lista, usarlos
      const existingSMS = smsList.find(s => s.id.toString() === id.toString());
      if (existingSMS) {
        console.log('Error de red, usando datos disponibles del contexto');
        setSms(existingSMS);
        setError('Mostrando datos básicos (error de conectividad al servidor)');
      } else {
        setError('Error al cargar los detalles del SMS. Verifique que el servidor esté ejecutándose.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, smsList]);

  useEffect(() => {
    console.log('SMSDetails montado, ID:', id);
    console.log('Lista SMS actual:', smsList);
    if (id) {
      loadSMSDetails();
    }
  }, [id, loadSMSDetails, smsList]);

  console.log('Renderizando SMSDetails. Loading:', loading, 'Error:', error, 'SMS:', sms);

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-primary"></div>
            <span className="ml-4">Cargando detalles del SMS...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !sms) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-4 alert alert-error">
            <span>{error}</span>
          </div>
          <div className="mb-4 alert alert-info">
            <span>💡 Asegúrate de que el servidor Django esté ejecutándose en puerto 8000</span>
          </div>
          <Link to="/sms" className="btn btn-outline">
            <FaArrowLeft className="mr-2" />
            Volver a la lista
          </Link>
        </div>
      </Layout>
    );
  }

  if (!sms) {
    return (
      <Layout>
        <div className="container px-4 py-8 mx-auto">
          <div className="mb-4 alert alert-warning">
            <span>SMS no encontrado con ID: {id}</span>
          </div>
          <Link to="/sms" className="btn btn-outline">
            <FaArrowLeft className="mr-2" />
            Volver a la lista
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container px-4 py-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/sms" className="btn btn-ghost btn-sm">
              <FaArrowLeft className="mr-2" />
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-700">{sms.titulo_estudio}</h1>
              <p className="text-gray-600">Detalles del Mapeo Sistemático</p>
            </div>
          </div>
          <Link 
            to={`/sms/${id}/process`} 
            className="btn btn-primary"
          >
            <FaEdit className="mr-2" />
            Editar
          </Link>
        </div>
        <div className="space-y-6">
          {/* Información General */}
          <div className="shadow-lg card bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Información General</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Título del Estudio</span>
                  </label>
                  <p className="p-3 rounded bg-base-200">{sms.titulo_estudio || 'No definido'}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Autores</span>
                  </label>
                  <p className="p-3 rounded bg-base-200">{sms.autores || 'No definidos'}</p>
                </div>
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Fecha de Creación</span>
                  </label>
                  <p className="p-3 rounded bg-base-200">
                    {sms.fecha_creacion ? new Date(sms.fecha_creacion).toLocaleDateString('es-ES') : 'No disponible'}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Última Actualización</span>
                  </label>
                  <p className="p-3 rounded bg-base-200">
                    {sms.fecha_actualizacion ? new Date(sms.fecha_actualizacion).toLocaleDateString('es-ES') : 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preguntas de Investigación */}
          <div className="shadow-lg card bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Preguntas de Investigación</h3>
              <div className="space-y-4">
                {/* Pregunta Principal */}
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Pregunta Principal</span>
                  </label>
                  <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                    {sms.pregunta_principal || 'No definida'}
                  </p>
                </div>

                {/* Sub-pregunta 1 - Mostrar siempre el campo */}
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Sub-pregunta 1</span>
                  </label>
                  <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                    {sms.subpregunta_1 || 'No definida'}
                  </p>
                  {!sms.subpregunta_1 && (
                    <p className="mt-1 text-sm text-gray-500">
                      💡 Esta subpregunta no ha sido definida aún
                    </p>
                  )}
                </div>

                {/* Sub-pregunta 2 - Mostrar siempre el campo */}
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Sub-pregunta 2</span>
                  </label>
                  <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                    {sms.subpregunta_2 || 'No definida'}
                  </p>
                  {!sms.subpregunta_2 && (
                    <p className="mt-1 text-sm text-gray-500">
                      💡 Esta subpregunta no ha sido definida aún
                    </p>
                  )}
                </div>

                {/* Sub-pregunta 3 - Mostrar siempre el campo */}
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Sub-pregunta 3</span>
                  </label>
                  <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                    {sms.subpregunta_3 || 'No definida'}
                  </p>
                  {!sms.subpregunta_3 && (
                    <p className="mt-1 text-sm text-gray-500">
                      💡 Esta subpregunta no ha sido definida aún
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Criterios de Búsqueda */}
          <div className="shadow-lg card bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Criterios de Búsqueda</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Cadena de Búsqueda</span>
                  </label>
                  <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                    {sms.cadena_busqueda || 'No definida'}
                  </p>
                </div>
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Período de Búsqueda</span>
                  </label>
                  <p className="p-3 rounded bg-base-200">
                    {sms.anio_inicio || 'N/A'} - {sms.anio_final || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Criterios de Inclusión y Exclusión */}
          <div className="shadow-lg card bg-base-100">
            <div className="card-body">
              <h3 className="card-title">Criterios de Inclusión y Exclusión</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Criterios de Inclusión</span>
                  </label>
                  <div>
                    <p className="p-3 whitespace-pre-wrap rounded bg-base-20">
                      {sms.criterios_inclusion || 'No definidos'}
                    </p>
                    {!sms.criterios_inclusion && (
                      <p className="mt-2 text-sm text-green-600">
                        ℹ️ Los criterios de inclusión no han sido definidos aún
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">
                    <span className="font-semibold label-text">Criterios de Exclusión</span>
                  </label>
                  <div>
                    <p className="p-3 whitespace-pre-wrap rounded bg-base-20">
                      {sms.criterios_exclusion || 'No definidos'}
                    </p>
                    {!sms.criterios_exclusion && (
                      <p className="mt-2 text-sm text-red-600">
                        ℹ️ Los criterios de exclusión no han sido definidos aún
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Fuentes */}
          {sms.fuentes && sms.fuentes !== 'Por definir' && (
            <div className="shadow-lg card bg-base-100">
              <div className="card-body">
                <h3 className="card-title">Fuentes de Búsqueda</h3>
                <div>
                  <p className="p-3 whitespace-pre-wrap rounded bg-base-200">
                    {sms.fuentes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SMSDetails;