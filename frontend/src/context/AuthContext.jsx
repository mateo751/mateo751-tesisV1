import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '@/services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('Intentando verificar autenticación...'); // Cambiado de 'Intentando verificar autenticación...' a 'Intentando verificar autenticación...'
      const response = await authService.checkAuth();
      console.log('Respuesta del servidor:', response.data);
      if (response.data.isAuthenticated) {
        console.log('Usuario autenticado:', response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        console.log('Usuario no autenticado');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error en checkAuth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
        console.log('Intentando iniciar sesión...');
        const response = await authService.login(credentials);
        console.log('Respuesta del servidor:', response.data);
        
        if (response.data.success) {
            console.log('Login exitoso, actualizando estado...');
            setIsAuthenticated(true);
            if (response.data.access) {
                localStorage.setItem('access_token', response.data.access);
                console.log('Token almacenado en localStorage:', response.data.access);
              }
            if (response.data.user) {
                setUser(response.data.user);
                console.log('Usuario establecido:', response.data.user);
            }
        }
        return response;
    } catch (error) {
        console.error('Error en login:', error);
        setIsAuthenticated(false);
        setUser(null);
        throw error;
    }
};

  const register = async (userData) => {
    const response = await authService.register(userData);
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      register,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};