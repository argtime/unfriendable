import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', loading = false, children, className, ...props }) => {
  const baseClasses = "px-4 py-2 rounded-md font-semibold transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variantClasses = {
    primary: 'bg-accent text-primary hover:bg-opacity-90',
    secondary: 'bg-secondary text-light hover:bg-gray-700 border border-gray-600',
    danger: 'bg-red-600 text-light hover:bg-red-700',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
};

export default Button;
