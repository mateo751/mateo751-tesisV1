import React, { useState, useRef } from 'react';
import { FaFileUpload, FaFilePdf, FaTrash } from 'react-icons/fa';

const SourcesStep = ({ formData, handleChange}) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Renombrado para evitar conflicto con la prop handleChange
  const handleFileInputChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    setUploadError('');
    
    // Verificar límite de archivos
    if (uploadedFiles.length + files.length > 40) {
      setUploadError('No puedes subir más de 40 archivos en total.');
      return;
    }
    
    const newFiles = [];
    
    // Procesar archivos
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Verificar tipo de archivo
      if (file.type !== 'application/pdf') {
        setUploadError('Solo se permiten archivos PDF.');
        continue;
      }
      
      // Verificar tamaño de archivo (10MB = 10 * 1024 * 1024 bytes)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Los archivos no pueden superar los 10MB.');
        continue;
      }
      
      newFiles.push({
        id: Date.now() + i,
        name: file.name,
        size: file.size,
        file: file
      });
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // También debemos actualizar el formData que viene del padre
    // Esto dependerá de cómo quieras guardar estos archivos en el estado general
    if (newFiles.length > 0) {
      // Puedes almacenar solo las referencias a los archivos en el formData
      // o crear una representación que sea útil para tu caso de uso
      handleChange({
        target: {
          name: 'pdfFiles',
          value: [...uploadedFiles, ...newFiles]
        }
      });
    }
  };

  const handleRemoveFile = (id) => {
    const updatedFiles = uploadedFiles.filter(file => file.id !== id);
    setUploadedFiles(updatedFiles);
    
    // Actualizar también en el formData
    handleChange({
      target: {
        name: 'pdfFiles',
        value: updatedFiles
      }
    });
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Mapeos Sistemáticos</h2>
        <p className="text-gray-600">PDF Information Extractor</p>
      </div>
      
      <div className="bg-gray-700 rounded-lg p-6">
        <h3 className="font-semibold mb-4">Subir PDF</h3>
        <p className="text-sm mb-4">Cargue un artículo científico en PDF para extraer información</p>
        
        <div 
          onDragEnter={handleDrag}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-primary bg-primary/10' : 'border-gray-400'
          } transition-colors duration-200`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center gap-2">
            <FaFileUpload className="w-10 h-10 text-gray-500" />
            <p className="font-medium">
              Haga clic para cargar o arrastre y suelte PDF (máx 10MB)
            </p>
            <button
              type="button"
              onClick={onButtonClick}
              className="mt-2 btn btn-primary btn-sm"
            >
              Seleccionar archivos
            </button>
          </div>
          
          {dragActive && (
            <div
              className="absolute inset-0 w-full h-full"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            />
          )}
        </div>
        
        {uploadError && (
          <div className="alert alert-error mt-4">
            <p>{uploadError}</p>
          </div>
        )}
      </div>
      
      {uploadedFiles.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-6">
          <h3 className="font-semibold mb-4">
            Archivos cargados
          </h3>
          
          <div className="overflow-y-auto max-h-64">
            <ul className="divide-y">
              {uploadedFiles.map(file => (
                <li key={file.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <FaFilePdf className="text-red-500 mr-3" />
                    <div>
                      <p className="font-medium truncate max-w-md">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="btn btn-ghost btn-sm text-red-500"
                  >
                    <FaTrash />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Mantenemos el campo de texto fuentes para compatibilidad con el backend existente */}
      <div className="form-control w-full hidden">
        <textarea
          name="fuentes"
          value={formData.fuentes || ''}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
        />
      </div>
    </div>
  );
};

export default SourcesStep;