import React from 'react';

import { 
  
  Mail, 
  Phone, 
 
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-sm text-gray-400">
            © {currentYear} School Manager. All rights reserved.
          </p>
          
          {/* Contact Info */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a 
              href="mailto:support@schoolmanager.com" 
              className="flex items-center gap-2 hover:text-white transition"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              support@schoolmanager.com
            </a>
            <a 
              href="tel:+12551234567" 
              className="flex items-center gap-2 hover:text-white transition"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              +1 (555) 123-4567
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;