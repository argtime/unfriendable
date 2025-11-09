
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary border-t border-gray-800 mt-auto">
      <div className="container mx-auto py-4 px-4 md:px-6 lg:px-8 text-center text-medium text-sm">
        <p>&copy; {new Date().getFullYear()} Unfriendable. All actions are final.</p>
        <p className="mt-1">
          Built by{' '}
          <a 
            href="https://github.com/argtime" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            argtime
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
