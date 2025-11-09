
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          display_name: displayName,
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
        navigate('/');
      } else {
        // Email confirmation required
        toast.success('Account created! Please check your email to confirm.');
        navigate('/login');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-accent mb-6">Create Account</h1>
        <form onSubmit={handleSignUp} className="space-y-4">
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