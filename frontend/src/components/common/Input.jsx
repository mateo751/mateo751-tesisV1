    //componente de input
export default function Input({ label, name, type = "text", placeholder = "", className = "", ...props }) { //props de input
    return (
        <div className="form-control w-full">
            {label && <label className="label"><span className="label-text">{label}</span></label>}
            <input
            type={type}
            name={name}
            placeholder={placeholder} 
            className={`input input-bordered w-full ${className}`}
            {...props}
            />
        </div>
    );
}
