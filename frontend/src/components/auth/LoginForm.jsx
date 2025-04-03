import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

export default function LoginForm() { //componente de formulario de login
const [formData, setFormData] = useState({ email: "", password: "" }); //estado del formulario
const [isLoading, setIsLoading] = useState(false); //estado de carga
//handleChange: función para actualizar el estado del formulario
const handleChange = (e) => { //actualiza el estado del formulario
    setFormData((prev) => ({ 
        ...prev,
        [e.target.name]: e.target.value,
    }));
};

//handleSubmit: función para manejar el envío del formulario
const handleSubmit = (e) => { //previene el envío del formulario
    e.preventDefault();
    setIsLoading(true);

    // Simulación: llamada a login
    setTimeout(() => {
        console.log("Login con:", formData); //muestra los datos del formulario
        setIsLoading(false); //setea el estado de carga
    }, 1500); //espera 1.5 segundos
};

return (
    <div className="flex items-center justify-center min-h-screen bg-base-200 p-4">
        <div className="card w-full max-w-md sm:max-w-lg p-6 shadow-lg bg-base-100">
            <form onSubmit={handleSubmit} className="w-full">
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-3xl sm:text-4xl font-bold">Iniciar Sesión</h1>
                    <p className="text-sm sm:text-base text-base-content/70">
                    Ingrese sus credenciales para acceder al sistema
                    </p>
                </div>
                <div className="space-y-6">
                    <div>
                    <label htmlFor="email" className="block text-sm font-medium text-left mb-1">
                        Correo Electrónico
                    </label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    </div>

                    <div>
                    <label htmlFor="password" className="block text-sm font-medium text-left mb-1">
                        Contraseña
                    </label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    </div>
                </div>

                <div className="mt-8 flex flex-col space-y-4">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>
                    <p className="text-center text-sm text-base-content/70">
                    ¿No tiene una cuenta?{" "}
                    <Link to="/auth/register" className="text-primary hover:underline">
                        Registrarse
                    </Link>
                    </p>
                </div>
        </form>
        </div>
    </div>
    );
}
