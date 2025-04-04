import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";

export default function LoginForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
        setError(""); // Limpiar error cuando el usuario empiece a escribir
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            await login({
                username: formData.username,
                password: formData.password
            });
            navigate('/');
        } catch (error) {
            console.error('Error durante el login:', error);
            setError("Usuario o contraseña incorrectos");
        } finally {
            setIsLoading(false);
        }
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
                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-left mb-1">
                                Nombre de Usuario
                            </label>
                            <Input
                                id="username"
                                name="username"
                                type="text"
                                placeholder="usuario"
                                value={formData.username}
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