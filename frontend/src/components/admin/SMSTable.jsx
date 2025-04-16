import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';

const MappingTable = ({ mappings, searchTerm, setSearchTerm, onDelete }) => {
    const filtered = mappings.filter(m =>
        m.titulo_estudio.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
        <div className="flex flex-col md:flex-row md:items-center justify-start mb-6 gap-4">
            <Link to="/sms/new" className="btn btn-primary">
                <FaPlus className="mr-3" />
                Nuevo Mapeo
            </Link>
        </div>
        <label className="input input-bordered flex items-center gap-2 mb-4 max-w-sm">
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
            <table className="table table-zebra w-full">
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
                        <Link to={`/sms/${sms.id}`} className="btn btn-sm btn-info text-white">
                            Ver
                        </Link>
                        <Link to={`/sms/${sms.id}/edit`} className="btn btn-sm btn-warning text-white">
                            Editar
                        </Link>
                        <button
                            onClick={() => onDelete(sms.id)}
                            className="btn btn-sm btn-error text-white"
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
