import api from './axios';

export const smsService = {
    getAllSMS: async () => {
        try {
            const response = await api.get('/api/sms/sms/');
            console.log('Respuesta getAllSMS:', response.data);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error al obtener SMS:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    createSMS: async (smsData) => {
        try {
            console.log('Intentando crear SMS con datos:', smsData);
            const response = await api.post('/api/sms/sms/', smsData);
            console.log('Respuesta createSMS:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al crear SMS. Status:', error.response?.status);
            console.error('Datos del error:', error.response?.data);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    createInitialSMS: async (basicData) => {
        try {
            console.log('Creando SMS inicial con datos:', basicData);
            const response = await api.post('/api/sms/sms/', basicData);
            console.log('Respuesta completa createInitialSMS:', response);
            console.log('Datos de la respuesta:', response.data);
            
            // Verificar la estructura de la respuesta
            if (!response.data) {
                throw new Error('El servidor no devolvió datos');
            }
            
            // Asegurarnos de que tenemos un ID válido
            const smsData = response.data;
            if (!smsData.id && typeof smsData.id !== 'number') {
                console.error('Estructura de la respuesta:', smsData);
                throw new Error('El servidor no devolvió un ID válido en la respuesta');
            }
            
            return {
                ...smsData,
                id: Number(smsData.id) // Asegurarnos de que el ID sea un número
            };
        } catch (error) {
            console.error('Error completo al crear SMS inicial:', error);
            if (error.response) {
                console.error('Estado de la respuesta:', error.response.status);
                console.error('Datos del error:', error.response.data);
                console.error('Headers de la respuesta:', error.response.headers);
                throw new Error(`Error del servidor: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                throw error;
            }
        }
    },

    updateSMS: async (id, smsData) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para actualizar el SMS');
            }
            const response = await api.put(`/api/sms/sms/${id}/`, smsData);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar SMS:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    updateSMSQuestions: async (id, questionsData) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para actualizar las preguntas');
            }
            console.log('Actualizando preguntas del SMS', id, 'con datos:', questionsData);
            const response = await api.post(`/api/sms/sms/${id}/questions/`, questionsData);
            console.log('Respuesta updateSMSQuestions:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar preguntas. Status:', error.response?.status);
            console.error('Datos del error:', error.response?.data);
            throw error;
        }
    },

    updateSMSCriteria: async (id, criteriaData) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para actualizar los criterios');
            }
            
            // Asegurar que los datos enviados sean los correctos
            const cleanCriteriaData = {};
            
            // Solo incluir campos que tengan valores válidos
            if (criteriaData.cadena_busqueda !== undefined && criteriaData.cadena_busqueda !== null) {
                cleanCriteriaData.cadena_busqueda = criteriaData.cadena_busqueda;
            }
            
            if (criteriaData.anio_inicio !== undefined && criteriaData.anio_inicio !== null) {
                cleanCriteriaData.anio_inicio = criteriaData.anio_inicio;
            }
            
            if (criteriaData.anio_final !== undefined && criteriaData.anio_final !== null) {
                cleanCriteriaData.anio_final = criteriaData.anio_final;
            }
            
            if (criteriaData.criterios_inclusion !== undefined && criteriaData.criterios_inclusion !== null) {
                cleanCriteriaData.criterios_inclusion = criteriaData.criterios_inclusion;
            }
            
            if (criteriaData.criterios_exclusion !== undefined && criteriaData.criterios_exclusion !== null) {
                cleanCriteriaData.criterios_exclusion = criteriaData.criterios_exclusion;
            }
            
            if (criteriaData.enfoque_estudio !== undefined && criteriaData.enfoque_estudio !== null) {
                cleanCriteriaData.enfoque_estudio = criteriaData.enfoque_estudio;
            }
            
            console.log('Actualizando criterios del SMS', id, 'con datos:', cleanCriteriaData);
            const response = await api.post(`/api/sms/sms/${id}/criteria/`, cleanCriteriaData);
            console.log('Respuesta updateSMSCriteria:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar criterios. Status:', error.response?.status);
            console.error('Datos del error:', error.response?.data);
            throw error;
        }
    },

    getSMSById: async (id) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para obtener el SMS');
            }
            const response = await api.get(`/api/sms/sms/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener SMS por ID:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    deleteSMS: async (id) => {
        try {
            if (!id) {
                throw new Error('Se requiere un ID válido para eliminar el SMS');
            }
            await api.delete(`/api/sms/sms/${id}/`);
        } catch (error) {
            console.error('Error al eliminar SMS:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    // Añadir estudios a un SMS
    addStudiesToSMS: async (smsId, studiesData) => {
        try {
            const response = await api.post(`/api/sms/sms/${smsId}/articles/import/`, studiesData);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },
    
    // Obtener estudios de un SMS
    getStudiesBySMSId: async (smsId) => {
        try {
            const response = await api.get(`/api/sms/sms/${smsId}/articles/`);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },
};

export default smsService;