
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PowerIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import SearchInput from '../SearchInput';
import Avatar from '../ui/Avatar';

const Header: React.FC = () => {
  const { user, profile, signOut, isDev } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-secondary sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-accent tracking-wider shrink-0">
              Unfriendable
            </Link>
            <span className="bg-gray-700 text-light text-xs font-semibold px-2 py-0.5 rounded-full">Beta</span>
          </div>
          
          {user && <div className="flex-1 justify-center px-4 hidden md:flex"><SearchInput /></div>}

          <nav className="flex justify-end shrink-0">
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center space-x-2 text-light hover:opacity-80 transition-opacity duration-200"
                >
                  <span className="hidden sm:inline">{profile.display_name}</span>
                  <Avatar displayName={profile.display_name} size="sm" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-secondary rounded-md shadow-lg py-1 border border-accent/20">
                    <Link
                      to={`/profile/${profile.username}`}
                      onClick={() => setMenuOpen(false)}
                      className="hidden md:block px-4 py-2 text-sm text-light hover:bg-accent hover:text-primary transition-colors duration-200"
                    >
                      My Profile
                    </Link>
                    {isDev && (
                       <Link
                        to="/dev"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-light hover:bg-accent hover:text-primary transition-colors duration-200"
                      >
                         <CodeBracketIcon className="h-4 w-4 mr-2" /> Dev Page
                       </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-light hover:bg-accent hover:text-primary transition-colors duration-200"
                    >
                      <PowerIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="hover:text-accent transition-colors">Login</Link>
                <Link to="/signup" className="bg-accent text-primary px-4 py-2 rounded-md hover:opacity-90 transition-opacity">Sign Up</Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
