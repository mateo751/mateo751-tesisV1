import React from 'react';

const SMSNavButtons = ({ currentStep, totalSteps, onNext, onPrev, isSubmitting, isLastStep }) => {
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
      
      <div className="ml-auto">
        {!isLastStep ? (
          <button
            type="button"
            onClick={onNext}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SMSNavButtons;