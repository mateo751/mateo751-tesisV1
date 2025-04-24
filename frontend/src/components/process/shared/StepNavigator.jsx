import React from 'react';
const StepNavigator = ({ currentStep, totalSteps, onNext, onPrev, isSubmitting, isLastStep }) => {
  return (
    <div className="flex justify-between mt-8">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onPrev}
          className="btn btn-outline"
          disabled={isSubmitting}
        >
          Atrás
        </button>
      )}
      
      {/* Mostrar información de progreso */}
      <div className="flex items-center mx-2 text-sm text-gray-500">
        Paso {currentStep} de {totalSteps}
      </div>
      
      <div className="ml-auto">
        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar y Continuar'}
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Finalizar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepNavigator;