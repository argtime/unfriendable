
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/ui/Spinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DevPage = lazy(() => import('./pages/DevPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner /></div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/dev" element={<ProtectedRoute><DevPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
            </Routes>
          </Suspense>
        </Layout>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#F5F5F5',
            border: '1px solid #FF0055'
          }
        }} />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;