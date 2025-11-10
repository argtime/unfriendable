
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AvatarSelector from '../components/AvatarSelector';
import CoverImageSelector from '../components/CoverImageSelector';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bio.length > 250) {
      toast.error("Bio cannot be longer than 250 characters.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          display_name: displayName,
          avatar_url: avatarUrl || null,
          cover_image_url: coverImageUrl || null,
          bio: bio,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      if (data.session) {
        // User is already logged in
        toast.success('Account created and logged in!');
        navigate('/home');
      } else {
        // Email confirmation required
        toast.success(
          'Account created! Please check your email to confirm. Note: Your browser might say the verification link is broken, but it will still work.',
          { duration: 10000 }
        );
        navigate('/login');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)] py-8">
      <Card className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center text-accent mb-6">Create Account</h1>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-medium mb-1">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-medium mb-1">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-medium mb-1">Username</label>
              <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="unique_username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-medium mb-1">Display Name</label>
              <Input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Your Name" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-medium">Bio (Optional)</label>
                <span className={`text-xs ${bio.length > 250 ? 'text-red-500' : 'text-medium'}`}>{bio.length} / 250</span>
            </div>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell everyone about yourself..." 
              className="w-full px-3 py-2 bg-secondary border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-light"
              rows={2}
              maxLength={250}
            />
          </div>
          <div>
              <label className="block text-sm font-medium text-medium mb-1">Avatar URL (Optional)</label>
              <Input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="Or paste a URL..." />
              <div className="mt-2">
                <p className="text-xs text-medium mb-2">Or pick one:</p>
                <AvatarSelector selectedAvatar={avatarUrl} onSelectAvatar={setAvatarUrl} />
              </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-medium mb-1">Cover Image URL (Optional)</label>
              <Input type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="Or paste a URL..." />
              <div className="mt-2">
                <p className="text-xs text-medium mb-2">Or pick one:</p>
                <CoverImageSelector selectedCover={coverImageUrl} onSelectCover={setCoverImageUrl} />
              </div>
          </div>
          <Button type="submit" loading={loading} className="w-full pt-2">
            Sign Up
          </Button>
        </form>
        <p className="text-center text-medium mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default SignupPage;