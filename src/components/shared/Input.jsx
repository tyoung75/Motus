import React from 'react';

// Clean, minimal input styling - Apple/Nike inspired
export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helper,
  disabled = false,
  className = '',
  size = 'md',
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full ${sizes[size]}
          bg-dark-700 border rounded-lg
          text-white placeholder-dark-400
          focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
          hover:border-dark-400
          transition-colors duration-200
          ${error ? 'border-accent-danger focus:border-accent-danger focus:ring-accent-danger' : 'border-dark-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-dark-800' : ''}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-accent-danger flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-sm text-text-muted">{helper}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  disabled = false,
  className = '',
  size = 'md',
}) {
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full ${sizes[size]}
            bg-dark-700 border rounded-lg
            text-white appearance-none
            focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
            hover:border-dark-400
            transition-colors duration-200
            ${error ? 'border-accent-danger' : 'border-dark-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-dark-800' : ''}
          `}
        >
          <option value="" disabled className="text-dark-400">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-dark-700">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-sm text-accent-danger">{error}</p>
      )}
    </div>
  );
}

// Textarea component
export function Textarea({
  label,
  value,
  onChange,
  placeholder,
  error,
  helper,
  disabled = false,
  className = '',
  rows = 4,
  ...props
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full px-4 py-3
          bg-dark-700 border rounded-lg
          text-white placeholder-dark-400
          focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary
          hover:border-dark-400
          transition-colors duration-200 resize-none
          ${error ? 'border-accent-danger' : 'border-dark-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-dark-800' : ''}
        `}
        {...props}
      />
      {error && <p className="text-sm text-accent-danger">{error}</p>}
      {helper && !error && <p className="text-sm text-text-muted">{helper}</p>}
    </div>
  );
}

export default Input;
