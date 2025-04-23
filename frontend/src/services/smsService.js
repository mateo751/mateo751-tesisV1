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
            console.error('Headers:', error.response?.headers);
            console.error('Config:', error.response?.config);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    updateSMS: async (id, smsData) => {
        try {
            const response = await api.put(`/api/sms/sms/${id}/`, smsData);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    deleteSMS: async (id) => {
        try {
            await api.delete(`/api/sms/sms/${id}/`);
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    getSMSById: async (id) => {
        try {
            const response = await api.get(`/api/sms/sms/${id}/`);
            return response.data;
        } catch (error) {
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
            const response = await api.post(`/api/sms/sms/${smsId}/studies/`, studiesData);
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
            const response = await api.get(`/api/sms/sms/${smsId}/studies/`);
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