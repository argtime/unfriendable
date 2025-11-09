import React, { useState, useEffect, memo } from 'react';

interface AvatarProps {
  displayName: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const colors = [
    'bg-red-500', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500', 
    'bg-teal-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500',
    'bg-indigo-500'
];

const getInitials = (name: string) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const Avatar: React.FC<AvatarProps> = ({ displayName, imageUrl, size = 'md', className = '' }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false); // Reset error when image URL changes
  }, [imageUrl]);

  const initials = getInitials(displayName);

  // Simple hash function to get a consistent color
  const colorIndex = (displayName.charCodeAt(0) + (displayName.charCodeAt(1) || 0)) % colors.length;
  const color = colors[colorIndex];

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  };
  
  const baseClasses = `rounded-full flex items-center justify-center font-bold text-white select-none shrink-0 ${sizeClasses[size]} ${className}`;

  if (imageUrl && !error) {
    return (
        <img 
            src={imageUrl} 
            alt={displayName} 
            className={`${baseClasses} object-cover`}
            title={displayName}
            onError={() => setError(true)}
        />
    );
  }

  return (
    <div
      className={`${baseClasses} ${color}`}
      title={displayName}
    >
      <span>{initials}</span>
    </div>
  );
};

export default memo(Avatar);