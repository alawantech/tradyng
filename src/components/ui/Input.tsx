import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  labelClassName?: string;
  borderClassName?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon, 
  className = '', 
  labelClassName = '', 
  borderClassName = '',
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-bold mb-1 ${labelClassName || 'text-gray-900'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">
              {icon}
            </div>
          </div>
        )}
        <input
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border ${borderClassName || 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-transparent ${
            error ? 'border-red-500' : ''
          } ${className} text-white placeholder-white/70`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};