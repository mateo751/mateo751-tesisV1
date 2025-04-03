//componente de footer
export default function Footer() { //exporta el componente de footer para usar en el layout
    return (
        <footer className="bg-base-100 border-t border-base-content/10 py-6 mt-auto">
            <div className="container mx-auto text-center text-sm text-base-content/70 px-4">
                © {new Date().getFullYear()} Sistema de Mapeos Sistemáticos. Todos los derechos reservados.
            </div>
        </footer>
    );
}
