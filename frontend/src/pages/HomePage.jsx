import Layout from "../components/layout/Layout";
import { Link } from "react-router-dom";

export default function HomePage() {
    return (
        <Layout>
        <section className="py-20 md:py-24 lg:py-32 w-full bg-base-200">
            <div className="container mx-auto px-4 md:px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Sistema de Mapeos Sistemáticos
                </h1>
                <p className="text-base-content/70 max-w-xl mx-auto mt-4 text-lg md:text-xl">
                    Gestione sus mapeos sistemáticos de manera eficiente
                </p>
                <div className="flex flex-col sm:flex-row justify-center mt-6 gap-4">
                    <Link to="/auth/login">
                    <button className="btn btn-primary btn-lg rounded-lg">
                        Iniciar sesión
                    </button>
                    </Link>
                    <Link to="/auth/register">
                    <button className="btn btn-outline btn-lg rounded-lg">
                        Registrar
                    </button>
                    </Link>
                </div>
                </div>
            </section>

        <section className="container mx-auto px-4 py-12 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
                {/* Tarjeta 1 */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                    <h2 className="card-title">Gestión de Mapeos Sistemáticos</h2>
                    <p>Gestione todos sus mapeos sistemáticos en un solo lugar</p>
                    <ul className="list-disc pl-5 space-y-2 mt-4 text-sm">
                        <li>Crear nuevos mapeos sistemáticos</li>
                        <li>Visualizar y editar mapeos existentes</li>
                        <li>Exportar resultados en múltiples formatos</li>
                        <li>Análisis y reportes detallados</li>
                    </ul>
                    </div>
                </div>
                {/* Tarjeta 2 */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                    <h2 className="card-title">Administración del Sistema</h2>
                    <p>Administre usuarios y configuraciones del sistema</p>
                    <ul className="list-disc pl-5 space-y-2 mt-4 text-sm">
                        <li>Gestión de usuarios y permisos</li>
                        <li>Configuración del sistema</li>
                        <li>Respaldos y restauración</li>
                        <li>Monitoreo de actividad</li>
                    </ul>
                    </div>
                </div>
            </div>
        </section>
        </Layout>
    );
}
