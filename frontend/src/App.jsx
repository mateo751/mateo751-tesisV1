// frontend/src/App.jsx - Verificar que las importaciones sean correctas

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SMSProvider } from "@/context/SMSContext";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import SMSList from "@/components/SMS/SMSList";
import SMSForm from "@/components/SMS/SMSForm";
import SMSDetails from "@/components/SMS/SMSDetails"; // ← Verificar esta importación
import ProcessManager from '@/components/process/shared/ProcessManager';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SMSProvider>
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              
              {/* Rutas protegidas */}
              <Route path="/sms" element={
                <ProtectedRoute>
                  <SMSList />
                </ProtectedRoute>
              } />
              <Route path="/sms/new" element={
                <ProtectedRoute>
                  <ProcessManager />
                </ProtectedRoute>
              } />
              <Route path="/sms/:id" element={
                <ProtectedRoute>
                  <SMSDetails />
                </ProtectedRoute>
              } />
              <Route path="/sms/:id/process" element={
                <ProtectedRoute>
                  <ProcessManager />
                </ProtectedRoute>
              } />
              <Route path="/sms/:id/edit" element={
                <ProtectedRoute>
                  <SMSForm />
                </ProtectedRoute>
              } />
              
              {/* Redirección por defecto */}
              <Route path="/" element={<Navigate to="/sms" replace />} />
            </Routes>
          </div>
        </Router>
      </SMSProvider>
    </AuthProvider>
  );
}

export default App;