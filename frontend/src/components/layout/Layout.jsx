//componente de layout
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function Layout({ children }) { //props de layout para usar en el layout
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    );
}
