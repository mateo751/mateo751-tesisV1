import './App.css'

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-grow">
        <section className="py-20 md:py-20 lg:py-20 w-full bg-base-200">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  Sistema de Mapeos Sistemáticos
                </h1>
                <p className="mx-auto max-w-xl text-base-content/70 text-lg md:text-xl">
                  Gestione sus mapeos sistemáticos de manera eficiente
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                  <button className="btn btn-primary btn-lg rounded-lg">
                    Iniciar sesión
                  </button>
                  <button className="btn btn-outline btn-lg rounded-lg">
                    Registrar
                  </button>
              </div>
            </div>
          </div>
        </section>
        {/* Sección de características */}
        <section className="container mx-auto px-4 py-12 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Gestión de Mapeos Sistemáticos</h2>
                <p className="text-base-content/70">
                  Gestione todos sus mapeos sistemáticos en un solo lugar
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-4 text-sm">
                  <li>Crear nuevos mapeos sistemáticos</li>
                  <li>Visualizar y editar mapeos existentes</li>
                  <li>Exportar resultados en múltiples formatos</li>
                  <li>Análisis y reportes detallados</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <h2 className="card-title">Administración del Sistema</h2>
                <p className="text-base-content/70">
                  Administre usuarios y configuraciones del sistema
                </p>
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
      </main>
      {/* Footer */}
      <footer className="border-accent bg-base-200">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 md:h-15 md:flex-row">
          <div className="text-center text-sm text-base-content/60">
            © {new Date().getFullYear()} Sistema de Mapeos Sistemáticos. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
