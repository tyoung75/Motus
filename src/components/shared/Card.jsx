import React from 'react';

// Premium card styling - clean surfaces, subtle borders, confident presence
export function Card({
  children,
  className = '',
  hover = false,
  onClick,
  variant = 'default', // default, elevated, outlined
  padding = true,
}) {
  const baseStyles = 'rounded-xl transition-all duration-300';

  const variants = {
    default: 'bg-dark-800 border border-dark-600',
    elevated: 'bg-dark-800 border border-dark-600 shadow-lg shadow-black/20',
    outlined: 'bg-transparent border border-dark-500',
    solid: 'bg-dark-700',
  };

  const hoverStyles = hover
    ? 'hover:border-dark-400 hover:shadow-gold cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${hoverStyles}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', border = true }) {
  return (
    <div className={`
      px-6 py-4
      ${border ? 'border-b border-dark-600' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-white tracking-tight ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-text-secondary mt-1 ${className}`}>
      {children}
    </p>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', border = true }) {
  return (
    <div className={`
      px-6 py-4
      ${border ? 'border-t border-dark-600' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export default Card;
