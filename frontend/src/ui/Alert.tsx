import React from 'react';

interface AlertProps {
  variant?: 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ variant = 'success', title, children }) => {
  const baseClasses = 'rounded-md border px-4 py-3 mb-4';
  
  const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  const titleClasses = 'text-sm font-medium mb-1';
  const messageClasses = 'text-sm';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]}`}>
      {title && <h5 className={titleClasses}>{title}</h5>}
      <div className={messageClasses}>{children}</div>
    </div>
  );
};

export default Alert;