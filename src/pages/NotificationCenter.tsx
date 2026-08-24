// src/pages/NotificationCenter.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, CheckCircle, XCircle, AlertCircle, Clock,
  Loader2, RefreshCw, Mail, FileText, DollarSign,
  School, Users, BookOpen, Calendar, TrendingUp,
  Check, X, Filter, Search, ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../api/schoolApi';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  action_label: string | null;
  created_at: string;
}

const NotificationCenter: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationService.getNotifications();
      const data = response.results || response;
      setNotifications(data || []);
      setFilteredNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      // Auto-refresh every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Filter notifications
  useEffect(() => {
    let filtered = [...notifications];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }
    
    if (filterRead === 'read') {
      filtered = filtered.filter(n => n.is_read);
    } else if (filterRead === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term)
      );
    }
    
    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, filterType, filterRead, searchTerm]);

  // Mark as read
  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead([notificationId]);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAsRead([], true);
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'result': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'payment': return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'subscription': return <Calendar className="w-5 h-5 text-purple-500" />;
      case 'school': return <School className="w-5 h-5 text-primary-500" />;
      case 'student': return <Users className="w-5 h-5 text-orange-500" />;
      case 'teacher': return <BookOpen className="w-5 h-5 text-teal-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'reminder': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const now = new Date();
      const time = new Date(dateString);
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

  const getPaginatedNotifications = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredNotifications.slice(start, end);
  };

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Bell className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" />
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-secondary-500">Stay updated with all your notifications</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
        >
          <option value="all">All Types</option>
          <option value="result">Results</option>
          <option value="payment">Payments</option>
          <option value="subscription">Subscriptions</option>
          <option value="school">Schools</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="alert">Alerts</option>
          <option value="reminder">Reminders</option>
        </select>
        
        <select
          value={filterRead}
          onChange={(e) => setFilterRead(e.target.value)}
          className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
        
        {(filterType !== 'all' || filterRead !== 'all' || searchTerm) && (
          <button
            onClick={() => {
              setFilterType('all');
              setFilterRead('all');
              setSearchTerm('');
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear Filters
          </button>
        )}
        
        <div className="text-sm text-secondary-400 ml-auto">
          {filteredNotifications.length} notifications
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <span className="ml-3 text-secondary-500">Loading notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900">No notifications</h3>
            <p className="text-secondary-500 mt-1">
              {searchTerm || filterType !== 'all' || filterRead !== 'all'
                ? 'No notifications match your filters'
                : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-secondary-100">
              {getPaginatedNotifications().map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-secondary-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    if (notification.action_url) {
                      // Navigate to action URL
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-secondary-900`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-secondary-600 mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </span>
                        <span className="text-xs text-secondary-400">
                          {formatTime(notification.created_at)}
                        </span>
                        {notification.action_url && notification.action_label && (
                          <button
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to action URL
                            }}
                          >
                            {notification.action_label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-secondary-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of {filteredNotifications.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-secondary-400" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'hover:bg-secondary-100 text-secondary-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="text-secondary-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-secondary-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;