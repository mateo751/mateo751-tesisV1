import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';

const MappingTable = ({ mappings, searchTerm, setSearchTerm, onDelete }) => {
    // Verificar que mappings sea un array
    const mappingsArray = Array.isArray(mappings) ? mappings : [];
    
    // Ahora es seguro usar filter
    const filtered = mappingsArray.filter(m =>
        m.titulo_estudio && m.titulo_estudio.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex flex-col justify-start gap-4 mb-6 md:flex-row md:items-center">
                <Link to="/sms/new" className="btn btn-primary">
                    <FaPlus className="mr-3" />
                    Nuevo Mapeo
                </Link>
            </div>
            <label className="flex items-center max-w-sm gap-2 mb-4 input input-bordered">
                <FaSearch />
                <input
                    type="text"
                    className="grow"
                    placeholder="Buscar mapeos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </label>

            <div className="overflow-x-auto">
                <table className="table w-full table-zebra">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Autores</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center text-gray-500">
                                    No se encontraron mapeos.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((sms) => (
                                <tr key={sms.id}>
                                    <td>{sms.titulo_estudio}</td>
                                    <td>{sms.autores}</td>
                                    <td>{new Date(sms.fecha_creacion).toLocaleDateString()}</td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link 
                                                to={`/sms/${sms.id}`} className="text-white btn btn-sm btn-info"
                                                onClick={() => console.log('Navegando a SMS ID:', sms.id)}
                                            >
                                                Ver
                                            </Link>
                                            <Link to={`/sms/${sms.id}/process`} className="text-white btn btn-sm btn-secondary">
                                                Editar
                                            </Link>
                                            <button
                                                onClick={() => onDelete(sms.id)}
                                                className="text-white btn btn-sm btn-error"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MappingTable;