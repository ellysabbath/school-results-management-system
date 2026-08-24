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
  Award,
  School,
  Hash,
  Copy,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  X,
  CheckCircle,
  FileText,
  Loader2,
  TrendingUp,
  AlertCircle,
  Users,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { schoolService, notificationService, resultService, studentService } from '../../api/schoolApi';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
  isMobile?: boolean;
}

interface SchoolData {
  id: number;
  name: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  plan?: string;
  trial_ends_at?: string;
  current_period_ends_at?: string;
}

interface Notification {
  id: number | string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type?: 'info' | 'success' | 'warning' | 'error' | 'result' | 'system' | 'payment' | 'subscription';
  created_at?: string;
  link?: string;
  icon?: string;
}

interface ExpiryNotification {
  id: string;
  title: string;
  message: string;
  daysRemaining: number;
  type: 'danger' | 'warning' | 'info' | 'success';
  read: boolean;
  created_at: string;
}

interface StudentData {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  admission_number: string;
  student_class: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobile = false }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [expiryNotifications, setExpiryNotifications] = useState<ExpiryNotification[]>([]);
  const [resultNotifications, setResultNotifications] = useState<Notification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<HTMLDivElement>(null);

  // Fetch all data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSchoolCode();
      fetchAllNotifications();
      fetchStudentData();
      
      // Refresh every 60 seconds
      const interval = setInterval(() => {
        fetchAllNotifications();
        if (schoolData) {
          checkAndUpdateExpiry(schoolData);
        }
      }, 60000);
      
      return () => clearInterval(interval);
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
      if (expiryRef.current && !expiryRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================
  // FETCH SCHOOL CODE
  // ============================================

  const fetchSchoolCode = async () => {
    if (!user?.school_id) {
      console.log('[Header] No school_id found for user');
      return;
    }

    setIsLoadingSchool(true);
    try {
      const response = await schoolService.getSchools({
        school_code: user.school_id,
        page_size: 1
      });
      
      const results = response.results || response;
      if (results && results.length > 0) {
        const school = results[0];
        const schoolDataObj = {
          id: school.id,
          name: school.name || '',
          school_code: school.school_code || '',
          email: school.email || '',
          phone: school.phone || '',
          address: school.address || '',
          status: school.status || 'active',
          plan: school.plan || 'trial',
          trial_ends_at: school.trial_ends_at || null,
          current_period_ends_at: school.current_period_ends_at || null,
        };
        setSchoolData(schoolDataObj);
        checkAndUpdateExpiry(schoolDataObj);
      }
    } catch (error) {
      console.error('[Header] Failed to fetch school:', error);
    } finally {
      setIsLoadingSchool(false);
    }
  };

  // ============================================
  // FETCH STUDENT DATA
  // ============================================

  const fetchStudentData = async () => {
    if (!user?.email || !user?.school_id) {
      console.log('[Header] No email or school_id found');
      return;
    }

    try {
      const studentsResponse = await studentService.getStudentsBySchoolCode(user.school_id);
      
      let studentDataList: any[] = [];
      if (studentsResponse.status === 'success' && studentsResponse.data) {
        const groupedData = studentsResponse.data;
        if (groupedData.length > 0) {
          studentDataList = groupedData[0].students || [];
        }
      } else if (Array.isArray(studentsResponse)) {
        studentDataList = studentsResponse;
      } else if (studentsResponse.results) {
        studentDataList = studentsResponse.results;
      }
      
      const foundStudent = studentDataList.find((s: any) => s.email === user.email);
      
      if (foundStudent) {
        setStudentData(foundStudent);
      } else if (studentDataList.length > 0) {
        setStudentData(studentDataList[0]);
      }
    } catch (error) {
      console.error('[Header] Failed to fetch student data:', error);
    }
  };

  // ============================================
  // FETCH ALL NOTIFICATIONS
  // ============================================

  const fetchAllNotifications = async () => {
    setIsLoadingNotifications(true);
    
    try {
      const allNotifs: Notification[] = [];
      
      // 1. Fetch system notifications from API
      try {
        const response = await notificationService.getNotifications();
        if (response && response.status === 'success') {
          const data = response.data || [];
          const systemNotifs = data.map((n: any) => ({
            id: n.id || `sys-${Math.random()}`,
            title: n.title || 'System Notification',
            message: n.message || '',
            time: n.created_at || new Date().toISOString(),
            read: n.is_read || false,
            type: n.type || 'system',
            created_at: n.created_at || new Date().toISOString(),
            link: n.action_url || null,
          }));
          allNotifs.push(...systemNotifs);
          setSystemNotifications(systemNotifs);
        }
      } catch (error) {
        console.log('Could not fetch system notifications:', error);
      }

      // 2. Fetch result notifications (for students)
      if (studentData?.id) {
        try {
          const resultsResponse = await resultService.getResults({
            student: studentData.id,
            is_published: true,
            page_size: 10,
          });
          
          let resultData: any[] = [];
          if (resultsResponse.results) {
            resultData = resultsResponse.results;
          } else if (Array.isArray(resultsResponse)) {
            resultData = resultsResponse;
          } else if (resultsResponse.data) {
            resultData = resultsResponse.data;
          }
          
          const resultNotifs = resultData.map((r: any) => ({
            id: `result-${r.id || Math.random()}`,
            title: `📊 ${r.subject_name || 'Subject'} Result`,
            message: `${r.marks_obtained}/${r.total_marks} (${r.grade || 'N/A'}) - ${r.term_name || ''}`,
            time: r.created_at || new Date().toISOString(),
            read: false,
            type: 'result',
            created_at: r.created_at || new Date().toISOString(),
            link: '/results-management',
          }));
          allNotifs.push(...resultNotifs);
          setResultNotifications(resultNotifs);
        } catch (error) {
          console.log('Could not fetch result notifications:', error);
        }
      }

      // 3. Add expiry notifications
      if (expiryNotifications.length > 0) {
        const expiryNotifs = expiryNotifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: n.created_at,
          read: n.read,
          type: n.type === 'danger' ? 'error' : 'warning',
          created_at: n.created_at,
          link: '/pricing',
        }));
        allNotifs.push(...expiryNotifs);
      }

      // Sort by created_at (newest first)
      allNotifs.sort((a, b) => {
        return new Date(b.created_at || b.time).getTime() - new Date(a.created_at || a.time).getTime();
      });

      // Count unread
      const unread = allNotifs.filter(n => !n.read).length;
      
      setAllNotifications(allNotifs.slice(0, 20));
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('[Header] Failed to fetch notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // ============================================
  // CHECK AND UPDATE EXPIRY NOTIFICATIONS
  // ============================================

  const checkAndUpdateExpiry = (school: SchoolData) => {
    try {
      const notifications: ExpiryNotification[] = [];
      
      if (school.trial_ends_at) {
        const expiryNotification = createExpiryNotification(
          school.trial_ends_at,
          'Trial',
          'trial'
        );
        if (expiryNotification) {
          notifications.push(expiryNotification);
        }
      }
      
      if (school.current_period_ends_at) {
        const expiryNotification = createExpiryNotification(
          school.current_period_ends_at,
          school.plan || 'subscription',
          'subscription'
        );
        if (expiryNotification) {
          notifications.push(expiryNotification);
        }
      }
      
      notifications.sort((a, b) => a.daysRemaining - b.daysRemaining);
      setExpiryNotifications(notifications);
      
    } catch (error) {
      console.error('[Header] Failed to check expiry:', error);
    }
  };

  // ============================================
  // CREATE EXPIRY NOTIFICATION
  // ============================================

  const createExpiryNotification = (
    expiryDate: string,
    planName: string,
    type: string
  ): ExpiryNotification | null => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) return null;

    let title = '';
    let message = '';
    let notificationType: 'danger' | 'warning' | 'info' | 'success' = 'info';

    if (diffDays <= 0) {
      title = '❌ Subscription Expired!';
      message = `Your ${planName} plan has expired. Please renew immediately.`;
      notificationType = 'danger';
    } else if (diffDays <= 7) {
      title = `⚠️ Subscription Expires in ${diffDays} Days!`;
      message = `Your ${planName} plan will expire in ${diffDays} days. Renew now.`;
      notificationType = 'danger';
    } else if (diffDays <= 14) {
      title = `⚡ Subscription Expires in ${diffDays} Days`;
      message = `Your ${planName} plan will expire in ${diffDays} days. Please plan to renew.`;
      notificationType = 'warning';
    } else if (diffDays <= 30) {
      title = `📅 Subscription Expires in ${diffDays} Days`;
      message = `Your ${planName} plan will expire in ${diffDays} days. Consider renewing early.`;
      notificationType = 'info';
    }

    return {
      id: `${type}-${expiryDate}`,
      title,
      message,
      daysRemaining: diffDays,
      type: notificationType,
      read: false,
      created_at: new Date().toISOString(),
    };
  };

  // ============================================
  // MARK NOTIFICATION AS READ
  // ============================================

  const markAsRead = async (notificationId: number | string) => {
    try {
      // If it's a system notification, call API
      if (typeof notificationId === 'number' && !notificationId.toString().startsWith('result-')) {
        await notificationService.markAsRead([notificationId]);
      }
      
      // Update local state
      setAllNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // ============================================
  // MARK ALL AS READ
  // ============================================

  const markAllAsRead = async () => {
    try {
      await notificationService.markAsRead([], true);
      
      setAllNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // ============================================
  // GET EXPIRY STYLES
  // ============================================

  const getExpiryStyles = (type: string): string => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getExpiryIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      default:
        return <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (daysRemaining: number): { text: string; color: string } => {
    if (daysRemaining <= 0) {
      return { text: 'Expired', color: 'bg-red-100 text-red-700' };
    } else if (daysRemaining <= 7) {
      return { text: 'Urgent', color: 'bg-red-100 text-red-700' };
    } else if (daysRemaining <= 14) {
      return { text: 'Soon', color: 'bg-yellow-100 text-yellow-700' };
    } else if (daysRemaining <= 30) {
      return { text: 'Upcoming', color: 'bg-blue-100 text-blue-700' };
    }
    return { text: 'Active', color: 'bg-green-100 text-green-700' };
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'result':
        return <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'subscription':
        return <Calendar className="w-4 h-4 text-purple-500 flex-shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500 flex-shrink-0" />;
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const now = new Date();
      const time = new Date(timeString);
      const diff = now.getTime() - time.getTime();
      
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return time.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    setShowNotifications(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('School code copied to clipboard!');
  };

  const handleRenew = () => {
    navigate('/pricing');
    setShowNotifications(false);
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Left side - Menu button + School Code Display */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* School Code Display */}
          {!isLoadingSchool && schoolData?.school_code && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 rounded-lg border border-gray-800">
              <School className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <span 
                  className="text-sm font-bold text-white tracking-wider"
                  style={{ fontFamily: 'Broadway, "Broadway BT", cursive, serif' }}
                >
                  {schoolData.school_code}
                </span>
                <button
                  onClick={() => copyToClipboard(schoolData.school_code)}
                  className="p-0.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-gray-300"
                  title="Copy school code"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          
          {isLoadingSchool && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-xs text-gray-500">Loading...</span>
            </div>
          )}

          {/* Search */}
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
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              document.documentElement.classList.toggle('dark');
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors hidden md:block"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Notifications - Combined */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Combined Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[420px] max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
                <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {allNotifications.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {allNotifications.length}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="p-8 text-center text-gray-500">
                      <Loader2 className="w-6 h-6 text-primary-600 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Loading notifications...</p>
                    </div>
                  ) : allNotifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium">No notifications</p>
                      <p className="text-xs text-gray-400 mt-1">Stay tuned for updates</p>
                    </div>
                  ) : (
                    allNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50/50 hover:bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {formatTime(notification.time || notification.created_at || new Date().toISOString())}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <Link 
                    to="/notifications" 
                    className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
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
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fade-in">
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

                  {/* Student Info */}
                  {studentData && (
                    <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-blue-600 text-[10px] font-medium uppercase tracking-wider">
                            Student
                          </p>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {studentData.full_name || `${studentData.first_name} ${studentData.last_name}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {studentData.admission_number} • {studentData.student_class}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subscription Info */}
                  {schoolData && (
                    <div className="mt-3 p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <DollarSign className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="text-blue-600 text-[10px] font-medium uppercase tracking-wider">
                              Plan
                            </p>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {schoolData.plan || 'Trial'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            schoolData.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {schoolData.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* School Code Section */}
                  {!isLoadingSchool && schoolData?.school_code && (
                    <div className="mt-3 p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <School className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wider">
                              School Code
                            </p>
                            <span 
                              className="text-sm font-bold text-white tracking-wider truncate block"
                              style={{ fontFamily: 'Broadway, "Broadway BT", cursive, serif' }}
                            >
                              {schoolData.school_code}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(schoolData.school_code)}
                          className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1 text-gray-300 text-xs border border-gray-700 flex-shrink-0"
                          title="Copy school code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Copy</span>
                        </button>
                      </div>
                      {schoolData.name && schoolData.name !== 'Unknown School' && (
                        <p className="text-[10px] text-gray-500 truncate mt-1">{schoolData.name}</p>
                      )}
                    </div>
                  )}
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
                    to="/notifications"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setShowProfile(false)}
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/pricing"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700"
                    onClick={() => setShowProfile(false)}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Pricing & Plans</span>
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
                    onClick={async () => {
                      try {
                        await logout();
                        navigate('/login');
                      } catch (error) {
                        toast.error('Failed to logout');
                      }
                    }}
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