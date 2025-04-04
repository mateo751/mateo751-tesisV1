import api from '@/services/axios';

export const authService = {
    login: async (credentials) => {
        return api.post('/api/login/', credentials);
    },
    logout: async () => {
        return api.post('/api/logout/');
    },
    register: async (userData) => {
        return api.post('/api/register/', userData);
    },

};