import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  const baseClasses = "bg-secondary rounded-lg shadow-lg p-6 border border-gray-800 transition-all duration-300";
  return (
    <div className={`${baseClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
