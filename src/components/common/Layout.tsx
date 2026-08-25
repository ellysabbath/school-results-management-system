import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Remove unused user variable
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed position */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={handleSidebarToggle}
        onClose={handleSidebarClose}
        isMobile={isMobile}
      />
      
      {/* Main content - Push right to accommodate sidebar */}
      <div className={`transition-all duration-300 ${
        !isMobile && sidebarOpen ? 'ml-64' : 
        !isMobile && !sidebarOpen ? 'ml-20' : 
        'ml-0'
      }`}>
        <Header 
          onMenuClick={handleSidebarToggle} 
          isMobile={isMobile}
        />
        <main className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;