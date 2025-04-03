//contexto de autenticación
//contecto de autenticación sirve para manejar el estado de autenticación del usuario
import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
const [user, setUser] = useState(() => {
    // Intenta recuperar desde localStorage
    const storedUser = localStorage.getItem("user"); //recupera el usuario desde localStorage
    return storedUser ? JSON.parse(storedUser) : null; //si existe, lo parsea y lo devuelve, si no, devuelve null
});

const login = (userData) => {
    setUser(userData); //setea el usuario
    localStorage.setItem("user", JSON.stringify(userData)); //guarda el usuario en localStorage
};

const logout = () => {
    setUser(null); //setea el usuario a null
    localStorage.removeItem("user"); //elimina el usuario de localStorage
};

useEffect(() => {
    // Si quieres hacer validación por token, hazlo aquí
}, []);

return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
        {children}
    </AuthContext.Provider>
);
}
