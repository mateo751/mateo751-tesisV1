//componente de navbar
import { Link } from "react-router-dom";

export default function Navbar() { //exporta el componente de navbar para usar en el layout 
    return (
        <nav className="sticky top-0 z-50 bg-base-100 shadow-sm border-b border-base-content/10">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
                <Link to="/" className="text-xl font-bold">
                Mapeos Sistemáticos
                </Link>
                <div className="flex gap-4">
                    <Link className="btn btn-sm btn-ghost" to="/auth/login">Login</Link>
                    <Link className="btn btn-sm btn-outline" to="/auth/register">Register</Link>
                </div>
            </div>
        </nav>
    );
}
