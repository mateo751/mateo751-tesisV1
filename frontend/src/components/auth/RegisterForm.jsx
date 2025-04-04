import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { authService } from "@/services/authService";

export default function RegisterForm() { //componente de registro
    const navigate = useNavigate(); //navegación
    const { register } = useAuth(); //registro de usuario
    const [formData, setFormData] = useState({ //estado del formulario
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({}); //errores del formulario
    const [isLoading, setIsLoading] = useState(false); //estado de carga
    const [showPassword, setShowPassword] = useState(false); //mostrar contraseña
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); //mostrar contraseña
    const [serverError, setServerError] = useState(""); //error del servidor

    const handleChange = (e) => { //maneja el cambio de los campos del formulario
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); //actualiza el estado del formulario
        setErrors((prev) => ({ ...prev, [e.target.name]: "" })); //limpia los errores
        setServerError(""); //limpia el error del servidor
    };

    const validate = () => { //valida los campos del formulario
        const errs = {}; //errores
        if (!formData.username) errs.username = "El nombre de usuario es obligatorio"; //si no hay nombre de usuario, agrega el error
        if (!formData.email) errs.email = "El correo es obligatorio"; //si no hay correo, agrega el error
        if (!formData.email.includes("@")) errs.email = "Correo inválido"; //si el correo no tiene @, agrega el error
        if (formData.password.length < 8) errs.password = "Mínimo 8 caracteres"; //si la contraseña es menor a 8 caracteres, agrega el error
        if (formData.password !== formData.confirmPassword)
            errs.confirmPassword = "Las contraseñas no coinciden"; //si las contraseñas no coinciden, agrega el error
        return errs;
    };

    const handleSubmit = async (e) => { //maneja el envío del formulario
        e.preventDefault(); //previene el envío del formulario
        const validation = validate(); //valida los campos del formulario
        if (Object.keys(validation).length > 0) { //si hay errores, agrega los errores al estado
            setErrors(validation); //agrega los errores al estado
            return; //sale de la función
        }
        // Verificar si el correo ya existe
        try {
            await authService.checkEmail(formData.email);
        } catch (error) {
            setErrors((prev) => ({ ...prev, email: "El correo electrónico ya está en uso" }));
            return;
        }
        // Verificar si el nombre de usuario ya existe
        try {
            await authService.checkUsername(formData.username);
        } catch (error) {
            console.log("Error al verificar el nombre de usuario:", error);
            setErrors((prev) => ({ ...prev, username: "El nombre de usuario ya está en uso" }));
            return;
        }
        // Continuar con el registro
        setErrors({}); //limpia los errores
        setIsLoading(true); //setea el estado de carga
        setServerError(""); //limpia el error del servidor

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            navigate('/auth/login');
        } catch (error) {
            console.error('Error durante el registro:', error);
            if (error.response?.data) {
                // Manejar errores específicos del servidor
                const serverErrors = error.response.data;
                if (typeof serverErrors === 'object') {
                    setErrors(serverErrors);
                } else {
                    setServerError("Error en el registro. Por favor, intente nuevamente.");
                }
            } else {
                setServerError("Error de conexión. Por favor, verifique su conexión a internet.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-base-200 px-4">
            <div className="card w-full max-w-md p-6 shadow-lg bg-base-100">
                <form onSubmit={handleSubmit}>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">Crear una cuenta</h2>
                        <p className="text-sm text-base-content/70">
                            Ingrese sus datos para registrarse en el sistema de mapeos sistemáticos
                        </p>
                    </div>

                    {serverError && (
                        <div className="alert alert-error mb-4">
                            <span>{serverError}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        {/* Nombre de Usuario */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium mb-1">
                                Nombre de Usuario
                            </label>
                            <Input
                                id="username"
                                name="username"
                                placeholder="usuario123"
                                value={formData.username}
                                onChange={handleChange}
                                className={errors.username ? "border-red-500" : ""}
                            />
                            {errors.username && <p className="text-sm text-red-500">{errors.username}</p>}
                        </div>

                        {/* Correo */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">
                                Correo electrónico
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                value={formData.email}
                                onChange={handleChange}
                                className={errors.email ? "border-red-500" : ""}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                >
                                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                            <p className="text-xs text-base-content/60">
                                La contraseña debe tener al menos 8 caracteres
                            </p>
                        </div>

                        {/* Confirmar contraseña */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeSlashIcon className="w-5 h-5" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Registrando..." : "Registrarse"}
                        </Button>
                        <p className="text-center text-sm text-base-content/70">
                            ¿Ya tiene una cuenta?{" "}
                            <Link to="/auth/login" className="text-primary hover:underline">
                                Iniciar sesión
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
