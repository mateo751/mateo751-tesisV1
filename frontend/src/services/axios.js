import axios from 'axios';
// Evitamos la importación directa para prevenir dependencia circular
// import { authService } from './authService';

const API_URL = 'http://localhost:8000';
//crea una instancia de axios con la URL base y las credenciales
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true // Importante para las cookies
});

// Añadir interceptor para incluir el token en el encabezado de autorización
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//intercepta las respuestas de la API
api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        try {
          // Importamos authService dinámicamente para evitar la dependencia circular
          const { authService } = await import('./authService');
          await authService.refreshToken();
          return api(error.config);
        } catch (refreshError) {
          // Redirigir al login si el refresh falla
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

export default api;

