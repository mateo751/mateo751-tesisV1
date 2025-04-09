// src/context/SMSContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { smsService } from '@/services/smsService';
import { useAuth } from '@/context/AuthContext'; // Asumiendo que tienes un contexto de autenticación

export const SMSContext = createContext();

export const SMSProvider = ({ children }) => {
  const [smsList, setSmsList] = useState([]);
  const [currentSMS, setCurrentSMS] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useAuth(); // Verificar si el usuario está autenticado
  
  // Cargar la lista de SMS al iniciar o cuando cambia el estado de autenticación
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllSMS();
    }
  }, [isAuthenticated]);
  
  // Obtener todos los SMS
  const fetchAllSMS = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await smsService.getAllSMS();
      setSmsList(data);
    } catch (err) {
      setError('Error al cargar los SMS: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener un SMS por ID
  const fetchSMSById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await smsService.getSMSById(id);
      setCurrentSMS(data);
      return data;
    } catch (err) {
      setError('Error al cargar el SMS: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Crear un nuevo SMS
  const createSMS = async (smsData) => {
    setLoading(true);
    setError(null);
    try {
      const newSMS = await smsService.createSMS(smsData);
      setSmsList([...smsList, newSMS]);
      return newSMS;
    } catch (err) {
      setError('Error al crear el SMS: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Actualizar un SMS existente
  const updateSMS = async (id, smsData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedSMS = await smsService.updateSMS(id, smsData);
      setSmsList(smsList.map(sms => sms.id === id ? updatedSMS : sms));
      if (currentSMS && currentSMS.id === id) {
        setCurrentSMS(updatedSMS);
      }
      return updatedSMS;
    } catch (err) {
      setError('Error al actualizar el SMS: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar un SMS
  const deleteSMS = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await smsService.deleteSMS(id);
      setSmsList(smsList.filter(sms => sms.id !== id));
      if (currentSMS && currentSMS.id === id) {
        setCurrentSMS(null);
      }
      return true;
    } catch (err) {
      setError('Error al eliminar el SMS: ' + err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Añadir estudios a un SMS
  const addStudiesToSMS = async (smsId, studiesData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await smsService.addStudiesToSMS(smsId, studiesData);
      // Actualizar el SMS actual si es necesario
      if (currentSMS && currentSMS.id === smsId) {
        fetchSMSById(smsId);
      }
      return result;
    } catch (err) {
      setError('Error al añadir estudios: ' + err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Obtener estudios de un SMS
  const fetchStudiesBySMSId = async (smsId) => {
    setLoading(true);
    setError(null);
    try {
      const studies = await smsService.getStudiesBySMSId(smsId);
      return studies;
    } catch (err) {
      setError('Error al cargar los estudios: ' + err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    smsList,
    currentSMS,
    loading,
    error,
    fetchAllSMS,
    fetchSMSById,
    createSMS,
    updateSMS,
    deleteSMS,
    addStudiesToSMS,
    fetchStudiesBySMSId,
    setCurrentSMS
  };
  
  return (
    <SMSContext.Provider value={value}>
      {children}
    </SMSContext.Provider>
  );
};

// Hook personalizado para facilitar el uso del contexto
export const useSMS = () => {
  const context = useContext(SMSContext);
  if (!context) {
    throw new Error('useSMS debe utilizarse dentro de un SMSProvider');
  }
  return context;
};