import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Configuración común para todas las peticiones
const axiosConfig = {
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Usamos axios directamente aquí (no api) para evitar un ciclo de dependencia circular
export const authService = {
    login: async (credentials) => {
        try {
            console.log('Enviando credenciales al servidor:', credentials);
            const response = await axios.post(`${API_URL}/login/`, credentials, axiosConfig);
            console.log('Respuesta completa del servidor:', response);
            if (response.data && response.data.access) {
                console.log('Token almacenado en localStorage:', response.data.access);
                localStorage.setItem('access_token', response.data.access);
            }
            return response;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            // Configurar headers con token si existe
            const token = localStorage.getItem('access_token');
            const config = {...axiosConfig};
            if (token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
            
            const response = await axios.post(`${API_URL}/logout/`, {}, config);
            localStorage.removeItem('access_token');
            return response;
        } catch (error) {
            console.error('Error en logout:', error);
            // Eliminamos el token de todas formas
            localStorage.removeItem('access_token');
            throw error;
        }
    },
    
    refreshToken: async () => {
        try {
            // Configurar headers con token si existe
            const token = localStorage.getItem('access_token');
            const config = {...axiosConfig};
            if (token) {
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`
                };
            }
            
            // Esta ruta no existe en el backend, usamos auth/ para refrescar
            const response = await axios.get(`${API_URL}/auth/`, config);
            if (response.data && response.data.access) {
                localStorage.setItem('access_token', response.data.access);
            }
            return response;
        } catch (error) {
            console.error('Error al refrescar token:', error);
            localStorage.removeItem('access_token');
            throw error;
        }
    },
    
    register: async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/register/`, userData, axiosConfig);
            return response;
        } catch (error) {
            console.error('Error en registro:', error);
            throw error;
        }
    },
    
    checkAuth: async () => {
        try {
            // Verificar si hay un token antes de hacer la petición
            const token = localStorage.getItem('access_token');
            if (!token) {
                return {data: {isAuthenticated: false}};
            }
            
            const config = {...axiosConfig};
            config.headers = {
                ...config.headers,
                'Authorization': `Bearer ${token}`
            };
            
            const response = await axios.get(`${API_URL}/auth/`, config);
            return response;
        } catch (error) {
            console.error('Error en checkAuth:', error);
            return {data: {isAuthenticated: false}};
        }
    }
};