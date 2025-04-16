// src/pages/admin/SMSAdminPage.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SMSList from '@/components/admin/SMSList';
import SMSForm from '@/components/admin/SMSForm';
import SMSDetails from '@/components/admin/SMSDetails';

const SMSAdminPage = () => {
    return (
        <SMSProvider>
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Administración de Systematic Mapping Studies</h1>
            
            <Routes>
            {/* Ruta para la lista de SMS */}
            <Route path="/" element={<SMSList />} />
            
            {/* Ruta para crear un nuevo SMS */}
            <Route path="/new" element={<SMSForm />} />
            
            {/* Ruta para editar un SMS existente */}
            <Route path="/:id/edit" element={<SMSForm />} />
            
            {/* Ruta para ver detalles de un SMS */}
            <Route path="/:id" element={<SMSDetails />} />
            
            {/* Redirección para rutas no encontradas */}
            <Route path="*" element={<Navigate replace to="/sms" />} />
            </Routes>
        </div>
        </SMSProvider>
    );
};

export default SMSAdminPage;