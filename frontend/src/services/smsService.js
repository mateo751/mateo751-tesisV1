import api from './axios';

export const smsService = {
    getAllSMS: async () => {
        try {
            const response = await api.get('/api/sms/');
            return response.data;
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
            const response = await api.post('/api/sms/', smsData);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/auth/login';
            }
            throw error;
        }
    },

    updateSMS: async (id, smsData) => {
        try {
            const response = await api.put(`/api/sms/${id}/`, smsData);
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
            await api.delete(`/api/sms/${id}/`);
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
            const response = await api.get(`/api/sms/${id}/`);
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
            const response = await api.post(`/api/sms/${smsId}/studies/`, studiesData);
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
            const response = await api.get(`/api/sms/${smsId}/studies/`);
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