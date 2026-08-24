// src/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap,
  BookOpen,
  BarChart3,
  Calendar,
  Settings,
  Home,
  CreditCard,
  Menu,
  X,
  Shield,
  Building2,
  PieChart,
  Server,
  UserCheck,
  ClipboardList,
  School,
  LogIn,
  UserPlus,
  Key,
  Activity,
  Award,
  TrendingUp,
  BookCopy,
  Plane,
  DollarSign
} from 'lucide-react';
import SidebarItem from './SidebarItem';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onClose, isMobile }) => {
  const location = useLocation();

  // ============================================
  // NAVIGATION ITEMS - ALL SECTIONS
  // ============================================
  const navigationItems = [
    // Authentication Section
    { 
      path: '/login', 
      label: 'Login', 
      icon: LogIn,
      section: 'Account'
    },
    { 
      path: '/register', 
      label: 'Register', 
      icon: UserPlus,
      section: 'Account'
    },
    { 
      path: '/forgot-password', 
      label: 'Forgot Password', 
      icon: Key,
      section: 'Account'
    },
    
    // System Admin Section
    { 
      path: '/dashboard', 
      label: 'System Dashboard', 
      icon: Shield,
      section: 'System Admin'
    },
    { 
      path: '/system/schools', 
      label: 'All Schools', 
      icon: Building2,
      section: 'System Admin'
    },
    { 
      path: '/system/analytics', 
      label: 'System Analytics', 
      icon: PieChart,
      section: 'System Admin'
    },
    { 
      path: '/system/settings', 
      label: 'System Settings', 
      icon: Server,
      section: 'System Admin'
    },
        { 
      path: '/manage-payments', 
      label: 'payments', 
      icon: DollarSign,
      section: 'System Admin'
    },

            { 
      path: '/manage-plans', 
      label: 'plans', 
      icon: Plane,
      section: 'System Admin'
    },
    
    // School Admin Section
    { 
      path: '/admin-dashboard', 
      label: 'School Dashboard', 
      icon: LayoutDashboard,
      section: 'School Admin'
    },
    { 
      path: '/students', 
      label: 'Students', 
      icon: Users,
      section: 'School Admin'
    },
    { 
      path: '/teachers', 
      label: 'Teachers', 
      icon: UserCheck,
      section: 'School Admin'
    },
    { 
      path: '/subjects', 
      label: 'Subjects', 
      icon: BookOpen,
      section: 'School Admin'
    },
    { 
      path: '/results', 
      label: 'Results', 
      icon: ClipboardList,
      section: 'School Admin'
    },
       { 
      path: '/terms', 
      label: 'terms', 
      icon: Calendar,
      section: 'School Admin'
    },
       { 
      path: '/view-results', 
      label: 'view results', 
      icon: BookCopy,
      section: 'School Admin'
    },
    
    // Teacher Section
    { 
      path: '/teacher-dashboard', 
      label: 'Teacher Dashboard', 
      icon: GraduationCap,
      section: 'Teacher'
    },
    
    // Student Section
    { 
      path: '/student-dashboard', 
      label: 'Student Dashboard', 
      icon: School,
      section: 'Student'
    },
    { 
      path: '/my-results', 
      label: 'My Results', 
      icon: FileText,
      section: 'Student'
    },
    { 
      path: '/report-card/1', 
      label: 'Report Card', 
      icon: GraduationCap,
      section: 'Student'
    },
    
    // Common Section
    { 
      path: '/analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      section: 'Common'
    },
    { 
      path: '/billing', 
      label: 'Billing', 
      icon: CreditCard,
      section: 'Common'
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: Settings,
      section: 'Common'
    },
  ];

  // Group menu items by section
  const groupedMenuItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  // Check if a path is active
  const isPathActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/report-card/1') {
      return location.pathname.startsWith('/report-card');
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay - Click to close sidebar */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300
        ${isOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : '-translate-x-full'}
        ${isMobile ? 'w-72' : 'w-64'}
        lg:translate-x-0
        ${!isMobile && isOpen ? 'lg:w-64' : 'lg:w-20'}
      `}>
        {/* Logo / Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-800 leading-tight">School</h1>
                <p className="text-xs text-blue-600 font-medium">Manager</p>
              </div>
            )}
          </Link>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded-lg transition lg:hidden flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          {/* Desktop toggle button */}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded-lg transition hidden lg:block flex-shrink-0"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-gray-500" />
            ) : (
              <Menu className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation Menu - Scrollable area */}
        <nav className="p-2 space-y-2 overflow-y-auto flex-1" style={{ height: 'calc(100vh - 200px)' }}>
          {Object.entries(groupedMenuItems).map(([section, items]) => (
            <div key={section}>
              {/* Section Header */}
              {isOpen && (
                <div className="px-3 py-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    {section}
                  </p>
                </div>
              )}
              
              {/* Section Items */}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.path);
                
                return (
                  <SidebarItem
                    key={item.path}
                    path={item.path}
                    label={item.label}
                    icon={Icon}
                    isActive={isActive}
                    isCollapsed={!isOpen}
                    onClick={onClose}
                  />
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer - Subscription Card - Fixed at bottom */}
        <div className={`flex-shrink-0 border-t border-gray-200 bg-gray-50/50 ${
          isOpen ? 'p-4' : 'p-2'
        }`}>
          {isOpen ? (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white">
              <p className="text-xs font-medium opacity-80">Subscription</p>
              <p className="text-lg font-bold">Premium</p>
              <p className="text-xs opacity-75">30 days remaining</p>
              <Link
                to="/subscription"
                className="mt-2 inline-block bg-white text-blue-700 text-xs px-3 py-1 rounded hover:bg-gray-100 transition"
              >
                <CreditCard className="w-3 h-3 inline mr-1" />
                Upgrade
              </Link>
            </div>
          ) : (
            <Link
              to="/billing"
              className="block text-center"
            >
              <CreditCard className="w-6 h-6 mx-auto text-blue-600 hover:text-blue-700 transition" />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;