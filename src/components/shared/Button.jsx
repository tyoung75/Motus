import React from 'react';

const variants = {
  primary: 'bg-accent-primary hover:bg-indigo-500 text-white',
  secondary: 'bg-dark-600 hover:bg-dark-500 text-white border border-dark-500',
  ghost: 'bg-transparent hover:bg-dark-700 text-gray-300',
  danger: 'bg-accent-danger hover:bg-red-600 text-white',
  success: 'bg-accent-success hover:bg-green-600 text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ children, variant = 'primary', size = 'md', disabled = false, fullWidth = false, onClick, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-dark-900 flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
