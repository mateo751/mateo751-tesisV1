import axios from 'axios';

const API_URL = 'http://localhost:8000';
//crea una instancia de axios con la URL base y las credenciales
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true // Importante para las cookies
});
//intercepta las respuestas de la API
api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response.status === 401) {
        try {
          await authService.refreshToken();
          return api(error.config);
        } catch (refreshError) {
          // Redirigir al login si el refresh falla
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

export default api;

