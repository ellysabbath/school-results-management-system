import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  User, 
  Search, 
  LogOut, 
  Settings, 
  CreditCard, 
  HelpCircle,
  ChevronDown,
  Moon,
  Sun,
  UserCircle,
  Mail,
  Phone,
  Building2,
  Shield,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../api/notificationApi';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
  isMobile?: boolean;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
  created_at?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobile = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      // Use actual notification service or mock for now
      const response = await notificationService.getNotifications();
      if (response.status === 'success') {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Use mock data if API fails
      setNotifications([
        { 
          id: 1, 
          title: 'Results Published', 
          message: 'Fall 2026 semester results have been published', 
          time: '2 hours ago', 
          read: false,
          type: 'success'
        },
        { 
          id: 2, 
          title: 'New Student Added', 
          message: 'Alice Johnson has been added to Grade 10A', 
          time: '4 hours ago', 
          read: false,
          type: 'info'
        },
        { 
          id: 3, 
          title: 'Payment Received', 
          message: 'Payment of $59 has been confirmed', 
          time: '1 day ago', 
          read: true,
          type: 'success'
        },
      ]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    return 'U';
  };

  const getFullName = (): string => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'User';
  };

  const getRoleLabel = (role?: string): string => {
    const roleMap: Record<string, string> = {
      super_admin: 'Super Admin',
      school_admin: 'School Admin',
      teacher: 'Teacher',
      student: 'Student',
      parent: 'Parent',
    };
    return roleMap[role || ''] || role || 'User';
  };

  const getRoleColor = (role?: string): string => {
    const colorMap: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-700',
      school_admin: 'bg-blue-100 text-blue-700',
      teacher: 'bg-green-100 text-green-700',
      student: 'bg-orange-100 text-orange-700',
      parent: 'bg-pink-100 text-pink-700',
    };
    return colorMap[role || ''] || 'bg-gray-100 text-gray-700';
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />;
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Left side - Menu button + Search */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Search - Hidden on mobile */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students, teachers, subjects..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 lg:w-80"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden md:block"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 text-center">
                  <Link to="/notifications" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Profile"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {getInitials(user?.first_name, user?.last_name)}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {getFullName()}
              </span>
              <ChevronDown className="hidden md:block w-4 h-4 text-gray-400" />
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                {/* User Info */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {getInitials(user?.first_name, user?.last_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {getFullName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user?.email}
                      </p>
                      {user?.phone && (
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </p>
                      )}
                      <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full inline-block ${getRoleColor(user?.role)}`}>
                        {getRoleLabel(user?.role)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    to="/settings/profile"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setShowProfile(false)}
                  >
                    <UserCircle className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setShowProfile(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    to="/billing"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setShowProfile(false)}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Billing</span>
                  </Link>
                  <Link
                    to="/help"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setShowProfile(false)}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </Link>
                </div>
                
                {/* Logout */}
                <div className="border-t border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;