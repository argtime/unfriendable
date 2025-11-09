import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Spinner from './ui/Spinner';
import Avatar from './ui/Avatar';
import { Link } from 'react-router-dom';

interface UserListModalProps {
  title: string;
  fetchUsers: () => Promise<UserProfile[]>;
  onClose: () => void;
}

const UserListModal: React.FC<UserListModalProps> = ({ title, fetchUsers, onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (e: any) {
        setError("Could not load user list.");
        console.error("Failed to fetch users in modal:", e);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [fetchUsers]);
  
  const handleClose = () => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to finish
  }

  return (
    <div 
      className={`fixed inset-0 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)'}}
      onClick={handleClose}
    >
      <div 
        className={`bg-secondary rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-light">{title}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
        </header>
        
        <main className="overflow-y-auto flex-grow p-4">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : error ? (
             <p className="text-center text-red-500 py-10">{error}</p>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map(user => (
                <Link 
                  to={`/profile/${user.username}`} 
                  key={user.id}
                  onClick={handleClose}
                  className="flex items-center gap-4 p-2 rounded-md hover:bg-primary transition-colors"
                >
                  <Avatar displayName={user.display_name} imageUrl={user.avatar_url} size="md" />
                  <div>
                    <p className="font-bold text-light">{user.display_name}</p>
                    <p className="text-sm text-medium">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-medium py-10">No users to display.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserListModal;