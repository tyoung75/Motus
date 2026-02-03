import React from 'react';

export function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div onClick={onClick} className={`bg-dark-800 rounded-xl border border-dark-600 ${hover ? 'hover:border-accent-primary cursor-pointer transition-colors' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-5 py-4 border-b border-dark-600 ${className}`}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={`px-5 py-4 border-t border-dark-600 ${className}`}>{children}</div>;
}

export default Card;
