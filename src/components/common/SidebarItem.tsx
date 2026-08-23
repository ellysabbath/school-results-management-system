import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  path: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  path,
  label,
  icon: Icon,
  isActive,
  isCollapsed,
  onClick,
}) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-blue-50 text-blue-700 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${isCollapsed ? 'justify-center' : ''}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
      {!isCollapsed && (
        <span className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </Link>
  );
};

export default SidebarItem;