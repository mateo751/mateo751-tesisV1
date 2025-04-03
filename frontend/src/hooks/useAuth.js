import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Hook personalizado para acceder fácilmente al contexto de autenticación
//hook de autenticación sirve para acceder fácilmente al contexto de autenticación
export function useAuth() {
    return useContext(AuthContext); //devuelve el contexto de autenticación
}
