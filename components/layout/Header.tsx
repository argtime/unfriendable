import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PowerIcon, CodeBracketIcon, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';
import SearchInput from '../SearchInput';
import Avatar from '../ui/Avatar';
import Dropdown from '../ui/Dropdown';

const Header: React.FC = () => {
  const { user, profile, signOut, isDev } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-secondary/80 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800/50 shadow-lg">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-accent tracking-wider shrink-0">
              Unfriendable
            </Link>
          </div>
          
          {user && <div className="flex-1 justify-center px-4 hidden md:flex"><SearchInput /></div>}

          <nav className="flex justify-end shrink-0">
            {user && profile ? (
              <Dropdown 
                contentClasses="w-48"
                trigger={
                  <button className="flex items-center space-x-2 text-light hover:opacity-80 transition-opacity duration-200">
                    <span className="hidden sm:inline">{profile.display_name}</span>
                    <Avatar displayName={profile.display_name} imageUrl={profile.avatar_url} size="sm" />
                  </button>
                }
              >
                <Dropdown.Item onClick={() => navigate(`/profile/${profile.username}`)} className="hidden md:flex">
                   <UserIconSolid className="h-4 w-4 mr-2" /> My Profile
                </Dropdown.Item>
                {isDev && (
                  <Dropdown.Item onClick={() => navigate('/dev')}>
                    <CodeBracketIcon className="h-4 w-4 mr-2" /> Dev Page
                  </Dropdown.Item>
                )}
                <Dropdown.Item onClick={handleSignOut}>
                  <PowerIcon className="h-4 w-4 mr-2" /> Sign Out
                </Dropdown.Item>
              </Dropdown>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="hover:text-accent transition-colors">Login</Link>
                <Link to="/signup" className="bg-accent text-light px-4 py-2 rounded-md hover:bg-accent-hover transition-all">Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;