
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/ui/Spinner';
import PageSkeleton from './components/ui/PageSkeleton';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DevPage = lazy(() => import('./pages/DevPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const PaymentRequiredPage = lazy(() => import('./pages/PaymentRequiredPage'));

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  // If we have a user, go to home. Otherwise, go to login.
  return <Navigate to={user ? "/home" : "/login"} replace />;
};

const AppRoutes: React.FC = () => {
  const { user, paymentRequired } = useAuth();

  if (user && paymentRequired) {
    return (
      <Suspense fallback={<PageSkeleton />}>
        <PaymentRequiredPage />
      </Suspense>
    );
  }
  
  return (
    <Suspense fallback={<div className="flex justify-center items-center flex-grow w-full"><PageSkeleton /></div>}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/dev" element={<ProtectedRoute><DevPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <AppRoutes />
        </Layout>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F5F5F5',
            border: '1px solid #3b82f6'
          }
        }} />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;