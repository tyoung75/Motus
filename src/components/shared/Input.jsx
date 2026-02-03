import React from 'react';

export function Input({ label, type = 'text', value, onChange, placeholder, error, helper, disabled = false, className = '', ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
        className={`w-full px-4 py-2.5 bg-dark-700 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${error ? 'border-accent-danger' : 'border-dark-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} {...props} />
      {error && <p className="text-sm text-accent-danger">{error}</p>}
      {helper && !error && <p className="text-sm text-gray-500">{helper}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, options, placeholder = 'Select...', error, disabled = false, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
      <select value={value} onChange={onChange} disabled={disabled}
        className={`w-full px-4 py-2.5 bg-dark-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${error ? 'border-accent-danger' : 'border-dark-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <p className="text-sm text-accent-danger">{error}</p>}
    </div>
  );
}

export default Input;
