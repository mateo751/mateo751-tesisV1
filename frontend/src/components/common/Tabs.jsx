// src/components/ui/Tabs.jsx
import React, { createContext, useContext } from 'react';

// Contexto para manejar las pestañas activas
const TabsContext = createContext({
  value: '',
  onValueChange: () => {},
});

export const Tabs = ({ children, value, onValueChange, className = '' }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`flex border rounded-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ children, value, className = '' }) => {
  const { value: activeValue, onValueChange } = useContext(TabsContext);
  const isActive = activeValue === value;
  
  return (
    <button
      type="button"
      className={`flex-1 py-2 px-4 text-center transition-all ${
        isActive 
          ? 'bg-primary text-primary-content font-medium' 
          : 'bg-base-100 hover:bg-base-200'
      } ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ children, value, className = '' }) => {
  const { value: activeValue } = useContext(TabsContext);
  
  if (activeValue !== value) return null;
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};