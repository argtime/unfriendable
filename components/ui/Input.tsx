
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseClasses = "w-full px-3 py-2 bg-secondary border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-light";
  
  return (
    <input
      className={`${baseClasses} ${className}`}
      {...props}
    />
  );
};

export default Input;