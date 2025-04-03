import { useState } from "react";
import { Link } from "react-router-dom";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"; 

export default function RegisterForm() {
//useState: para manejar el estado del formulario
const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
});
//useState: para manejar el estado del formulario
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

//handleChange: función para actualizar el estado del formulario
const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
};
//validate: función para validar el formulario
const validate = () => {
    const errs = {};
    if (!formData.name) errs.name = "El nombre es obligatorio"; //validación de nombre
    if (!formData.email.includes("@")) errs.email = "Correo inválido"; //validación de correo
    if (formData.password.length < 8) errs.password = "Mínimo 8 caracteres"; //validación de contraseña
    if (formData.password !== formData.confirmPassword)
        errs.confirmPassword = "Las contraseñas no coinciden"; //validación de contraseña
    return errs;
};
//handleSubmit: función para manejar el envío del formulario
const handleSubmit = (e) => {
    e.preventDefault(); //previene el envío del formulario
    const validation = validate(); //valida el formulario
    if (Object.keys(validation).length > 0) {
        setErrors(validation); //setea los errores
        return;
    }
    setErrors({}); //limpia los errores
    setIsLoading(true); //setea el estado de carga

    // Simulación de registro
    setTimeout(() => {
        console.log("Registrado:", formData); //muestra los datos del formulario
        setIsLoading(false); //setea el estado de carga
    }, 1500); //espera 1.5 segundos
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

            <div className="space-y-5">
                {/* Nombre */}
                <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Nombre completo
                </label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Juan Pérez"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
                        <EyeOffIcon className="w-5 h-5" />
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
