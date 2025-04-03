//componente de botón
export default function Button({ children, onClick, type = "button", variant = "primary", size = "md", className = "", ...props }) { //props de botón
    return (
        <button
            type={type}
            onClick={onClick}
            className={`btn btn-${variant} btn-${size} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
} 