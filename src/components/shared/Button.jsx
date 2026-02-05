import React from 'react';

// Confident, clean button styling
// Gold primary = bold action, Dark secondary = subtle, Ghost = minimal
const variants = {
  primary: 'bg-accent-primary hover:bg-accent-primaryHover active:bg-accent-primaryMuted text-dark-900 font-semibold shadow-sm',
  secondary: 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-500 hover:border-dark-400',
  ghost: 'bg-transparent hover:bg-dark-800 text-text-secondary hover:text-white',
  danger: 'bg-accent-danger hover:bg-red-500 text-white',
  success: 'bg-accent-success hover:bg-green-500 text-dark-900 font-semibold',
  outline: 'bg-transparent border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-dark-900',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
  xl: 'px-8 py-4 text-lg rounded-xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        font-medium tracking-wide
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:ring-offset-2 focus:ring-offset-dark-900
        inline-flex items-center justify-center gap-2
        ${className}
      `}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
    </button>
  );
}

export default Button;
