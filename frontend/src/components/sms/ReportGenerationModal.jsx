// frontend/src/components/SMS/ReportGenerationModal.jsx
import React, { useState, useCallback } from 'react';
import { FaTimes, FaFileAlt, FaSpinner, FaDownload, FaCopy, FaCheck } from 'react-icons/fa';
import { smsService } from '@/services/smsService';

const ReportGenerationModal = ({ isOpen, onClose, smsId, smsTitle, articles }) => {
  const [step, setStep] = useState('generate'); // 'generate', 'loading', 'preview'
  const [reportContent, setReportContent] = useState('');
  const [reportMetadata, setReportMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Generar reporte
  const handleGenerateReport = useCallback(async () => {
    setStep('loading');
    setError(null);

    try {
      const response = await smsService.generateReport(smsId);
      
      if (response.success) {
        setReportContent(response.report_content);
        setReportMetadata(response.metadata);
        setStep('preview');
      } else {
        setError('Error al generar el reporte');
        setStep('generate');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setStep('generate');
    }
  }, [smsId]);

  // Exportar a PDF
  const handleExportPDF = useCallback(async () => {
    try {
      const response = await smsService.exportReportPDF(smsId);
      
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `methodology_report_${smsTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Error al exportar PDF: ' + err.message);
    }
  }, [smsId, smsTitle]);

  // Copiar al portapapeles
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setError('Error al copiar al portapapeles', error);
    }
  };

  // Resetear modal al cerrar
  const handleClose = () => {
    setStep('generate');
    setReportContent('');
    setReportMetadata(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  // Formatear contenido markdown a JSX simplificado
  const formatContent = (content) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h1 key={index} className="mt-4 mb-2 text-xl font-bold">{line.slice(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={index} className="mt-3 mb-2 text-lg font-semibold">{line.slice(3)}</h2>;
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={index} className="mt-2 mb-1 font-medium">{line.slice(2, -2)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="mb-1 ml-4">{line.slice(2)}</li>;
      } else if (line.startsWith('```')) {
        return <div key={index} className="p-2 my-2 font-mono text-sm bg-gray-100 rounded">{line.slice(3)}</div>;
      } else if (line.trim() === '') {
        return <div key={index} className="my-1"></div>;
      } else {
        return <p key={index} className="mb-1 text-sm leading-relaxed">{line}</p>;
      }
    });
  };

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="w-11/12 max-w-4xl modal-box max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Reporte Metodológico</h3>
          <button onClick={handleClose} className="btn btn-ghost btn-sm">
            <FaTimes />
          </button>
        </div>

        {/* Content según el paso */}
        <div className="overflow-hidden flex-1">
          {step === 'generate' && (
            <div className="py-8 text-center">
              <FaFileAlt className="mx-auto mb-4 w-16 h-16 text-gray-400" />
              <h4 className="mb-2 text-lg font-semibold">Generar Reporte Metodológico</h4>
              <p className="mx-auto mb-6 max-w-md text-gray-600">
                Esta herramienta generará automáticamente la sección de Materials and Methods 
                de su mapeo sistemático basado en los datos ingresados.
              </p>
              
              {/* Estadísticas rápidas */}
              <div className="grid grid-cols-3 gap-4 mx-auto mb-6 max-w-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{articles?.length || 0}</div>
                  <div className="text-xs text-gray-500">Artículos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {articles?.filter(a => a.estado === 'SELECTED').length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Incluidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {articles?.length > 0 
                      ? Math.round((articles.filter(a => a.estado === 'SELECTED').length / articles.length) * 100)
                      : 0
                    }%
                  </div>
                  <div className="text-xs text-gray-500">Selección</div>
                </div>
              </div>

              <button onClick={handleGenerateReport} className="btn btn-primary">
                <FaFileAlt className="mr-2" />
                Generar Reporte
              </button>
            </div>
          )}

          {step === 'loading' && (
            <div className="py-16 text-center">
              <FaSpinner className="mx-auto mb-4 w-12 h-12 animate-spin text-primary" />
              <h4 className="mb-2 text-lg font-semibold">Generando reporte...</h4>
              <p className="text-gray-600">
                Procesando datos y creando el contenido metodológico...
              </p>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex flex-col h-full">
              {/* Toolbar */}
              <div className="flex justify-between items-center p-3 mb-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Reporte generado:</strong> {reportMetadata?.statistics.total_articles} estudios procesados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="btn btn-ghost btn-xs"
                  >
                    {copied ? <FaCheck className="text-green-600" /> : <FaCopy />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="btn btn-primary btn-xs"
                  >
                    <FaDownload className="mr-1" />
                    PDF
                  </button>
                </div>
              </div>

              {/* Contenido del reporte */}
              <div className="overflow-y-auto flex-1 p-4 bg-white rounded-lg border">
                <div className="max-w-none prose prose-sm">
                  {formatContent(reportContent)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Footer con botones */}
        <div className="flex gap-2 justify-end pt-4 mt-4 border-t">
          {step === 'preview' && (
            <button onClick={() => setStep('generate')} className="btn btn-ghost">
              Generar Nuevo
            </button>
          )}
          <button onClick={handleClose} className="btn btn-outline">
            Cerrar
          </button>
        </div>
      </div>
      
      <div className="modal-backdrop" onClick={handleClose}></div>
    </dialog>
  );
};

export default ReportGenerationModal;