import React from 'react';

interface AvatarProps {
  displayName: string;
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

const Avatar: React.FC<AvatarProps> = ({ displayName, size = 'md', className = '' }) => {
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

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${color}
        ${className}
        rounded-full flex items-center justify-center font-bold text-white select-none shrink-0
      `}
      title={displayName}
    >
      <span>{initials}</span>
    </div>
  );
};

export default Avatar;