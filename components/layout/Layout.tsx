
import React, { ReactNode } from 'react';
import Header from './Header';
import BottomNav from './BottomNav';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-primary text-light flex flex-col">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8 flex-grow">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Layout;