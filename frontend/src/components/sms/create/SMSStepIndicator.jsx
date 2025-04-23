import React from 'react';

const SMSStepIndicator = ({ currentStep, totalSteps }) => {
    return (
        <div className="mb-8">
        <div className="flex justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
            <div 
                key={step}
                className={`w-full h-1 ${
                step === currentStep ? 'bg-primary' : 
                step < currentStep ? 'bg-primary' : 'bg-gray-300'
                } ${step < totalSteps ? 'mr-1' : ''}`}
            ></div>
            ))}
        </div>
        </div>
    );
};

export default SMSStepIndicator;