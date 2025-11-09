import React, { useState } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import Input from './ui/Input';
import Avatar from './ui/Avatar';
import AvatarSelector from './AvatarSelector';
import CoverImageSelector from './CoverImageSelector';

interface EditProfileModalProps {
  userProfile: UserProfile;
  onClose: () => void;
  onProfileUpdate: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ userProfile, onClose, onProfileUpdate }) => {
  const [displayName, setDisplayName] = useState(userProfile.display_name);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatar_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(userProfile.cover_image_url || '');
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Animation duration
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bio.length > 250) {
      toast.error("Bio cannot be longer than 250 characters.");
      return;
    }
    setLoading(true);

    const { error } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        bio: bio,
        avatar_url: avatarUrl || null,
        cover_image_url: coverImageUrl || null,
      })
      .eq('id', userProfile.id);
    
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully!");
      onProfileUpdate();
      handleClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 flex justify-center items-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={handleClose}
    >
      <form
        onSubmit={handleSave}
        className={`bg-secondary rounded-lg shadow-xl max-w-lg w-full transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-light">Edit Profile</h2>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-white"><XMarkIcon className="h-6 w-6" /></button>
        </header>

        <main className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-center">
            <Avatar displayName={displayName} imageUrl={avatarUrl} size="lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-medium mb-1">Display Name</label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-medium">Bio</label>
                <span className={`text-xs ${bio.length > 250 ? 'text-red-500' : 'text-medium'}`}>{bio.length} / 250</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-primary border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-light"
              maxLength={250}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-medium mb-1">Avatar URL</label>
            <Input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste a URL..."
            />
            <div className="mt-2">
                <p className="text-xs text-medium mb-2">Or pick one:</p>
                <AvatarSelector selectedAvatar={avatarUrl} onSelectAvatar={setAvatarUrl} />
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-medium mb-1">Cover Image URL</label>
             <Input
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="Or paste a URL..."
            />
            <div className="mt-2">
                <p className="text-xs text-medium mb-2">Or pick one:</p>
                <CoverImageSelector selectedCover={coverImageUrl} onSelectCover={setCoverImageUrl} />
            </div>
          </div>
        </main>
        
        <footer className="p-4 bg-primary/50 rounded-b-lg flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save Changes</Button>
        </footer>
      </form>
    </div>
  );
};

export default EditProfileModal;