//componente de alerta
export default function Alert({ message, type = "info", className = "" }) { //props de alerta
    const typeClass = { //clase de alerta
        info: "alert-info", //clase de alerta info
        success: "alert-success", //clase de alerta success
        warning: "alert-warning", //clase de alerta warning
        error: "alert-error", //clase de alerta error
    };

    return (
        <div className={`alert ${typeClass[type]} ${className}`}>
            <span>{message}</span>
        </div>
    );
}  