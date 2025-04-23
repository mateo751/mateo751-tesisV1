import React, { useState } from 'react';

const InclusionStep = ({ formData, handleChange, errors }) => {
  const [inclusionInput, setInclusionInput] = useState('');
  const [exclusionInput, setExclusionInput] = useState('');

  const addInclusion = () => {
    if (!inclusionInput.trim()) return;
    
    const updatedCriteria = formData.criterios_inclusion 
      ? `${formData.criterios_inclusion}\n${inclusionInput}` 
      : inclusionInput;
    
    // Simulamos el evento para el manejador existente
    handleChange({
      target: {
        name: 'criterios_inclusion',
        value: updatedCriteria
      }
    });
    
    setInclusionInput('');
  };

  const addExclusion = () => {
    if (!exclusionInput.trim()) return;
    
    const updatedCriteria = formData.criterios_exclusion 
      ? `${formData.criterios_exclusion}\n${exclusionInput}` 
      : exclusionInput;
    
    handleChange({
      target: {
        name: 'criterios_exclusion',
        value: updatedCriteria
      }
    });
    
    setExclusionInput('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Mapeos Sistemáticos</h2>
      
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Criterio de inclusión</span>
        </label>
        <div className="flex items-center mb-2">
          <input
            type="text"
            value={inclusionInput}
            onChange={(e) => setInclusionInput(e.target.value)}
            placeholder="añadir criterios de inclusion"
            className="input input-bordered w-full"
            onKeyPress={(e) => e.key === 'Enter' && addInclusion()}
          />
          <button 
            type="button"
            onClick={addInclusion}
            className="btn btn-square ml-2"
          >
            +
          </button>
        </div>
        <textarea
          name="criterios_inclusion"
          value={formData.criterios_inclusion}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
          rows="3"
          readOnly
        ></textarea>
      </div>
      
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Criterio de Exclusión</span>
        </label>
        <div className="flex items-center mb-2">
          <input
            type="text"
            value={exclusionInput}
            onChange={(e) => setExclusionInput(e.target.value)}
            placeholder="Añadir criterios de exclusión"
            className="input input-bordered w-full"
            onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
          />
          <button 
            type="button"
            onClick={addExclusion}
            className="btn btn-square ml-2"
          >
            +
          </button>
        </div>
        <textarea
          name="criterios_exclusion"
          value={formData.criterios_exclusion}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
          rows="3"
          readOnly
        ></textarea>
      </div>
    </div>
  );
};

export default InclusionStep;