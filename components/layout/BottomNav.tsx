

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../hooks/useAuth';

const BottomNav: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  
  if (!profile) return null;

  const navItems = [
    { path: '/', icon: HomeIcon, label: 'Home' },
    { path: '/search', icon: MagnifyingGlassIcon, label: 'Search' },
    { path: `/profile/${profile.username}`, icon: UserIcon, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-gray-800 z-20">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => {
              const isProfilePage = item.label === 'Profile' && location.pathname.startsWith('/profile/');
              const finalIsActive = isActive || isProfilePage;

              return `flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                finalIsActive
                  ? 'text-accent'
                  : 'text-medium hover:text-light'
              }`;
            }}
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;