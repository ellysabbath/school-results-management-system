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
  BookCopy,
  Plane,
  DollarSign,
  Mail,
  Bell,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import SidebarItem from './SidebarItem';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  isMobile: boolean;
}

interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  section: string;
  roles: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onClose, isMobile }) => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Get user role from auth context
  const userRole = user?.role || 'guest';

  // ============================================
  // NAVIGATION ITEMS WITH ROLE-BASED ACCESS
  // Matching Django role names: super_admin, school_admin, teacher, student, parent
  // ============================================
  const navigationItems: NavigationItem[] = [
    // Public/Auth Section
    { 
      path: '/login', 
      label: 'Login', 
      icon: LogIn,
      section: 'Account',
      roles: ['guest']
    },
    { 
      path: '/register', 
      label: 'Register', 
      icon: UserPlus,
      section: 'Account',
      roles: ['guest']
    },
    { 
      path: '/forgot-password', 
      label: 'Forgot Password', 
      icon: Key,
      section: 'Account',
      roles: ['guest']
    },
    
    // Super Admin Section
    { 
      path: '/dashboard', 
      label: 'System Dashboard', 
      icon: Shield,
      section: 'System Admin',
      roles: ['super_admin']
    },
    { 
      path: '/system/schools', 
      label: 'All Schools', 
      icon: Building2,
      section: 'System Admin',
      roles: ['super_admin']
    },
    { 
      path: '/system/analytics', 
      label: 'System Analytics', 
      icon: PieChart,
      section: 'System Admin',
      roles: ['super_admin']
    },
    { 
      path: '/manage-users', 
      label: 'User Management', 
      icon: UserCog,
      section: 'System Admin',
      roles: ['super_admin']
    },
    { 
      path: '/system/settings', 
      label: 'System Settings', 
      icon: Server,
      section: 'System Admin',
      roles: ['super_admin']
    },
    { 
      path: '/manage/mails', 
      label: 'Manage Mails', 
      icon: Mail,
      section: 'System Admin',
      roles: ['super_admin']
    },
    { 
      path: '/manage-plans', 
      label: 'Manage Payments', 
      icon: Plane,
      section: 'System Admin',
      roles: ['super_admin']
    },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: Bell,
      section: 'System Admin',
      roles: ['super_admin', 'school_admin', 'teacher', 'student', 'parent']
    },
    
    // School Admin Section
    { 
      path: '/admin-dashboard', 
      label: 'School Dashboard', 
      icon: LayoutDashboard,
      section: 'School Admin',
      roles: ['school_admin']
    },
    { 
      path: '/students', 
      label: 'Students', 
      icon: Users,
      section: 'School Admin',
      roles: ['school_admin']
    },
    { 
      path: '/teachers', 
      label: 'Teachers', 
      icon: UserCheck,
      section: 'School Admin',
      roles: ['school_admin']
    },
    { 
      path: '/subjects', 
      label: 'Subjects', 
      icon: BookOpen,
      section: 'School Admin',
      roles: ['school_admin']
    },
    { 
      path: '/results-entry', 
      label: 'Results Entry', 
      icon: ClipboardList,
      section: 'School Admin',
      roles: ['school_admin']
    },
    { 
      path: '/terms', 
      label: 'Term Manager', 
      icon: Calendar,
      section: 'School Admin',
      roles: ['school_admin']
    },
    { 
      path: '/view-results', 
      label: 'View Results', 
      icon: BookCopy,
      section: 'School Admin',
      roles: ['school_admin']
    },
    { 
      path: '/billing', 
      label: 'My Payments', 
      icon: DollarSign,
      section: 'School Admin',
      roles: ['school_admin', 'super_admin']
    },
    
    // Teacher Section
    { 
      path: '/teacher-dashboard', 
      label: 'Teacher Dashboard', 
      icon: GraduationCap,
      section: 'Teacher',
      roles: ['teacher']
    },
    { 
      path: '/results', 
      label: 'Results Entry', 
      icon: ClipboardList,
      section: 'Teacher',
      roles: ['teacher']
    },
    { 
      path: '/students', 
      label: 'Students', 
      icon: Users,
      section: 'Teacher',
      roles: ['teacher']
    },
    
    
    // Student Section
    { 
      path: '/student-dashboard', 
      label: 'Student Dashboard', 
      icon: School,
      section: 'Student',
      roles: ['student']
    },
    { 
      path: '/student/my-results', 
      label: 'My Results', 
      icon: School,
      section: 'Student',
      roles: ['student']
    },
    { 
      path: '/my-results', 
      label: 'School Results', 
      icon: FileText,
      section: 'Student',
      roles: ['student']
    },
    { 
      path: '/report-card/1', 
      label: 'Report Card', 
      icon: GraduationCap,
      section: 'Student',
      roles: ['student']
    },
    
    // Parent Section
    { 
      path: '/parent-dashboard', 
      label: 'Parent Dashboard', 
      icon: Users,
      section: 'Parent',
      roles: ['parent']
    },
    { 
      path: '/my-results', 
      label: 'View Results', 
      icon: FileText,
      section: 'Parent',
      roles: ['parent']
    },
    { 
      path: '/report-card/1', 
      label: 'Report Card', 
      icon: GraduationCap,
      section: 'Parent',
      roles: ['parent']
    },
    
    // Common Section (available to all authenticated users)
    { 
      path: '/analytics', 
      label: 'Analytics', 
      icon: BarChart3,
      section: 'Common',
      roles: ['school_admin', 'teacher', 'student', 'super_admin', 'parent']
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: Settings,
      section: 'Common',
      roles: ['school_admin', 'teacher', 'student', 'super_admin', 'parent']
    },
  ];

  // Filter items based on user role and authentication status
  const getFilteredItems = () => {
    if (!isAuthenticated) {
      return navigationItems.filter(item => 
        item.roles.includes('guest')
      );
    }

    return navigationItems.filter(item => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.includes(userRole);
    });
  };

  // Group menu items by section
  const groupMenuItems = (items: NavigationItem[]) => {
    return items.reduce((acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section].push(item);
      return acc;
    }, {} as Record<string, NavigationItem[]>);
  };

  const filteredItems = getFilteredItems();
  const groupedMenuItems = groupMenuItems(filteredItems);

  // Check if a path is active
  const isPathActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    if (path === '/report-card/1') {
      return location.pathname.startsWith('/report-card');
    }
    if (path === '/students' && location.pathname.startsWith('/students/')) {
      return true;
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  // If not authenticated and no public items, show a message
  if (!isAuthenticated && filteredItems.length === 0) {
    return (
      <>
        {isMobile && isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        <aside className={`
          fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300
          ${isOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : '-translate-x-full'}
          ${isMobile ? 'w-72' : 'w-64'}
          lg:translate-x-0
          ${!isMobile && isOpen ? 'lg:w-64' : 'lg:w-20'}
        `}>
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
          <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <p className="text-sm text-gray-400 text-center px-4">
              Please login to access the menu
            </p>
          </div>
        </aside>
      </>
    );
  }

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
        {/* Logo / Header - Fixed at top */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
        </div>

        {/* Navigation Menu - Scrollable area with padding for footer */}
        <nav className="p-2 space-y-2 overflow-y-auto" style={{ 
          height: isOpen ? 'calc(100vh - 240px)' : 'calc(100vh - 180px)',
          paddingBottom: isOpen ? '16px' : '8px'
        }}>
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

        {/* Footer - User Info & Subscription Card - Fixed at bottom */}
        <div className={`flex-shrink-0 border-t border-gray-200 bg-gray-50/50 ${isOpen ? 'p-4' : 'p-2'}`}>
          {isAuthenticated && user && (
            <div className="mb-2">
              {isOpen ? (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-100">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.username || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate capitalize">
                      {user.role?.replace('_', ' ') || 'User'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                  {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          )}
          
          {isOpen ? (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4 text-white shadow-lg shadow-blue-500/20">
              <div className="flex items-center justify-between">
                {/* <div>
                  <p className="text-xs font-medium opacity-80">Current Plan</p>
                  <p className="text-lg font-bold">Premium</p>
                  <p className="text-xs opacity-75">30 days remaining</p>
                </div> */}
                <Link
                  to="/payment"
                  className="bg-white text-blue-700 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-100 transition font-medium shadow-md"
                >
                  <CreditCard className="w-3 h-3 inline mr-1" />
                  TopUp now
                </Link>
              </div>
            </div>
          ) : (
            <Link
              to="/payment"
              className="block text-center p-2 rounded-lg hover:bg-blue-50 transition"
              title="Upgrade Plan"
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