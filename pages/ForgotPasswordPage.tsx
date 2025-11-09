import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // This constructs the base URL by safely removing any existing hash, making it more robust.
    const baseUrl = window.location.href.split('#')[0];
    const redirectTo = `${baseUrl}#/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setMessageSent(true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md">
        {!messageSent ? (
          <>
            <h1 className="text-3xl font-bold text-center text-accent mb-2">Forgot Password?</h1>
            <p className="text-center text-medium mb-6">Enter your email and we'll send you a link to reset your password.</p>
            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-medium mb-1">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-accent mb-4">Check your inbox</h2>
            <p className="text-light">A password reset link has been sent to <span className="font-semibold">{email}</span>. Please follow the instructions in the email to set a new password.</p>
             <Link to="/login" className="mt-6 inline-flex items-center text-accent hover:underline">
               <ArrowLeftIcon className="h-4 w-4 mr-2" />
               Back to Login
             </Link>
          </div>
        )}
         <p className="text-center text-medium mt-6 text-sm">
          Remember your password?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;