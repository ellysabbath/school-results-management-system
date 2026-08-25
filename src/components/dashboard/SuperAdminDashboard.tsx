import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, UserCheck, 
  Calendar, Download, Search, Eye,
  DollarSign, School, AlertCircle, CheckCircle, XCircle,
  Clock, ArrowUp, Shield,
  Activity, Loader2, RefreshCw,
  X
} from 'lucide-react';
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { schoolService, subscriptionService, paymentService } from '../../api/schoolApi';
import toast from 'react-hot-toast';

// ============================================
// INTERFACES
// ============================================

interface School {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  status: string;
  admin_name: string;
  admin_email: string;
  school_code?: string;
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  total_results: number;
  created_at: string;
  updated_at: string;
  last_active: string;
}

interface ActivityLog {
  id: number;
  user: number;
  username: string;
  school: number;
  school_name: string;
  action_type: string;
  action: string;
  description: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

interface Transaction {
  id: number;
  transaction_code: string;
  school: number;
  school_code: string;
  school_name: string;
  admin_email: string;
  admin_name: string;
  admin_phone: string;
  plan: number;
  plan_name: string;
  plan_price: number;
  currency: string;
  amount: number;
  formatted_amount?: string;
  payment_method: string;
  telecom_provider: string;
  transaction_reference: string;
  status: string;
  created_at: string;
  completed_at: string;
}

interface SystemStats {
  total_schools: number;
  active_schools: number;
  expired_schools: number;
  suspended_schools: number;
  total_students: number;
  total_teachers: number;
  monthly_revenue: number;
  total_revenue: number;
  growth_rate: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

const SuperAdminDashboard: React.FC = () => {
  const { user, isAuthenticated, getActivityLogs } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [schools, setSchools] = useState<School[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    total_schools: 0,
    active_schools: 0,
    expired_schools: 0,
    suspended_schools: 0,
    total_students: 0,
    total_teachers: 0,
    monthly_revenue: 0,
    total_revenue: 0,
    growth_rate: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSchoolCode, setSearchSchoolCode] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Revenue data for chart
  const [revenueData, setRevenueData] = useState<any[]>([]);
  
  // Plan distribution
  const [planDistribution, setPlanDistribution] = useState([
    { name: 'Trial', value: 0 },
    { name: 'Starter', value: 0 },
    { name: 'Professional', value: 0 },
    { name: 'Enterprise', value: 0 },
  ]);

  const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b'];

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getMonthName = (monthIndex: number): string => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthIndex] || 'Jan';
  };

  const calculateRevenueByMonth = (transactionsData: Transaction[]): Record<string, number> => {
    const revenueByMonth: Record<string, number> = {};
    
    // Initialize all months with 0
    for (let i = 0; i < 12; i++) {
      const monthName = getMonthName(i);
      revenueByMonth[monthName] = 0;
    }

    // Add revenue from ALL transactions to each month
    transactionsData.forEach(t => {
      const date = new Date(t.created_at || t.completed_at);
      const monthIndex = date.getMonth();
      const monthName = getMonthName(monthIndex);
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0;
      revenueByMonth[monthName] = (revenueByMonth[monthName] || 0) + amount;
    });

    return revenueByMonth;
  };

  // ============================================
  // FETCH ACTIVITY LOGS - USING AUTH CONTEXT
  // ============================================

  const fetchActivities = useCallback(async () => {
    try {
      console.log('[SuperAdminDashboard] Fetching activity logs...');
      
      const response = await getActivityLogs();
      
      console.log('[SuperAdminDashboard] Activity logs raw response:', response);
      
      let activityData: ActivityLog[] = [];
      
      if (Array.isArray(response)) {
        activityData = response;
        console.log('[SuperAdminDashboard] Response is array, length:', activityData.length);
      } else if (response && typeof response === 'object') {
        if (response.results && Array.isArray(response.results)) {
          activityData = response.results;
          console.log('[SuperAdminDashboard] Found array in response.results, length:', activityData.length);
        } else if (response.data && Array.isArray(response.data)) {
          activityData = response.data;
          console.log('[SuperAdminDashboard] Found array in response.data, length:', activityData.length);
        } else if (response.status === 'success' && response.data && Array.isArray(response.data)) {
          activityData = response.data;
          console.log('[SuperAdminDashboard] Found array in success.data, length:', activityData.length);
        } else {
          let found = false;
          for (const key of Object.keys(response)) {
            if (Array.isArray(response[key]) && response[key].length > 0) {
              if (response[key].length > 0 && typeof response[key][0] === 'object') {
                activityData = response[key];
                console.log(`[SuperAdminDashboard] Found array in response.${key}, length:`, activityData.length);
                found = true;
                break;
              }
            }
          }
          
          if (!found && response.id !== undefined && response.action !== undefined) {
            activityData = [response];
            console.log('[SuperAdminDashboard] Response is single activity object, converted to array');
          }
        }
      }
      
      // Filter activities for the current user if not super admin
      if (user?.role !== 'super_admin' && user?.id) {
        activityData = activityData.filter(a => a.user === user.id);
        console.log('[SuperAdminDashboard] Filtered activities for user:', user.id, 'count:', activityData.length);
      }
      
      // Ensure each item has required fields
      activityData = activityData.filter(item => 
        item && typeof item === 'object' && item.id !== undefined
      );
      
      // Sort activities by created_at descending (newest first)
      activityData.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      
      console.log('[SuperAdminDashboard] Final processed activities:', activityData);
      setActivities(activityData);
      
      if (activityData.length === 0) {
        console.log('[SuperAdminDashboard] No activities found');
      }
      
    } catch (error: any) {
      console.error('[SuperAdminDashboard] Failed to fetch activities:', error);
      
      let errorMessage = 'Failed to load activity logs';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setActivities([]);
    }
  }, [getActivityLogs, user?.id, user?.role]);

  // ============================================
  // FETCH ALL DATA
  // ============================================

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setSearchError(null);
    
    try {
      const params: any = { page_size: 1000 };

      if (searchSchoolCode && searchSchoolCode.trim() !== '') {
        params.school_code = searchSchoolCode.trim().toUpperCase();
        setHasSearched(true);
      }

      // Fetch ALL schools
      const schoolsResponse = await schoolService.getSchools(params);
      const schoolData = schoolsResponse.results || schoolsResponse || [];
      setSchools(schoolData);

      // Fetch ALL subscriptions
      const subsResponse = await subscriptionService.getSubscriptions({ page_size: 1000 });
      const subData = subsResponse.results || subsResponse || [];

      // Fetch ALL transactions
      const transactionsResponse = await paymentService.getTransactions({ page_size: 1000 });
      let transactionData: Transaction[] = transactionsResponse.results || transactionsResponse || [];
      
      // Ensure amounts are numbers
      transactionData = transactionData.map(t => ({
        ...t,
        amount: typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0,
        plan_price: typeof t.plan_price === 'number' ? t.plan_price : parseFloat(String(t.plan_price)) || 0,
      }));

      // Fetch activity logs
      await fetchActivities();

      // Calculate stats from ALL data
      const activeSchools = schoolData.filter((s: School) => s.status === 'active').length;
      const expiredSchools = schoolData.filter((s: School) => s.status === 'expired').length;
      const suspendedSchools = schoolData.filter((s: School) => s.status === 'suspended').length;
      
      const totalStudents = schoolData.reduce((acc: number, s: School) => acc + (s.total_students || 0), 0);
      const totalTeachers = schoolData.reduce((acc: number, s: School) => acc + (s.total_teachers || 0), 0);

      // Calculate revenue from ALL transactions
      const monthlyRevenue = transactionData.reduce((acc: number, t: Transaction) => {
        const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0;
        return acc + amount;
      }, 0);

      const totalRevenue = transactionData.reduce((acc: number, t: Transaction) => {
        const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0;
        return acc + amount;
      }, 0);

      // Calculate growth rate from transaction data
      const revenueByMonth = calculateRevenueByMonth(transactionData);
      const monthKeys = Object.keys(revenueByMonth);
      const lastMonthIndex = monthKeys.length - 1;
      const prevMonthIndex = lastMonthIndex - 1;
      
      const currentRevenue = revenueByMonth[monthKeys[lastMonthIndex]] || 0;
      const previousRevenue = revenueByMonth[monthKeys[prevMonthIndex]] || 0;
      const growthRate = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 12.5;

      setStats({
        total_schools: schoolData.length,
        active_schools: activeSchools,
        expired_schools: expiredSchools,
        suspended_schools: suspendedSchools,
        total_students: totalStudents,
        total_teachers: totalTeachers,
        monthly_revenue: monthlyRevenue,
        total_revenue: totalRevenue,
        growth_rate: Math.round(growthRate * 100) / 100,
      });

      // Calculate plan distribution from ALL subscriptions
      const trial = subData.filter((s: any) => s.plan_name === 'trial').length;
      const starter = subData.filter((s: any) => s.plan_name === 'starter').length;
      const professional = subData.filter((s: any) => s.plan_name === 'professional').length;
      const enterprise = subData.filter((s: any) => s.plan_name === 'enterprise').length;

      setPlanDistribution([
        { name: 'Trial', value: trial },
        { name: 'Starter', value: starter },
        { name: 'Professional', value: professional },
        { name: 'Enterprise', value: enterprise },
      ]);

      // Generate revenue data for chart - full year from ALL transactions
      const revenueByMonthData = calculateRevenueByMonth(transactionData);
      const revenueChartData = Object.entries(revenueByMonthData).map(([month, revenue]) => ({
        month,
        revenue: Math.round(revenue),
        transactions: transactionData.filter(t => {
          const date = new Date(t.created_at);
          const monthIndex = date.getMonth();
          const subMonth = getMonthName(monthIndex);
          return subMonth === month;
        }).length,
      }));
      setRevenueData(revenueChartData);

      if (schoolData.length === 0 && searchSchoolCode) {
        setSearchError(`No schools found with code "${searchSchoolCode}"`);
      }

    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setSearchError(error.response?.data?.message || 'Failed to load dashboard data');
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [searchSchoolCode, fetchActivities]);

  // ============================================
  // LOAD DATA ON MOUNT
  // ============================================

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSchoolCode.trim()) {
      fetchAllData();
    } else {
      toast.error('Please enter a school code');
    }
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    setHasSearched(false);
    setSearchError(null);
    fetchAllData();
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const getPlanColor = (plan: string): string => {
    const colors: Record<string, string> = {
      trial: 'bg-blue-100 text-blue-700',
      starter: 'bg-green-100 text-green-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-yellow-100 text-yellow-700',
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
  };

  const getPlanLabel = (plan: string): string => {
    const labels: Record<string, string> = {
      trial: 'Trial',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return labels[plan] || plan;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      suspended: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'TZS 0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ============================================
  // FILTER SCHOOLS
  // ============================================

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (school.admin_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          school.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (school.school_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || school.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || school.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // ============================================
  // EXPORT REPORT
  // ============================================

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const headers = ['School', 'School Code', 'Admin', 'Plan', 'Students', 'Teachers', 'Status', 'Joined'];
      const rows = schools.map(s => [
        s.name,
        s.school_code || 'N/A',
        s.admin_name || 'N/A',
        getPlanLabel(s.plan),
        s.total_students || 0,
        s.total_teachers || 0,
        s.status,
        formatDate(s.created_at)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view the dashboard</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            System Dashboard
          </h1>
          <p className="text-secondary-500">Full overview of all schools and system performance</p>
          {user && (
            <p className="text-xs text-secondary-400 mt-1">
              Logged in as: {user.email} ({user.role})
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAllData}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleExportReport}
            disabled={isExporting || schools.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <Calendar className="w-4 h-4" />
            This Month
          </button>
        </div>
      </div>

      {/* ==========================================
          SEARCH BY SCHOOL CODE
          ========================================== */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-secondary-700 mb-1 block">
              Search by School Code
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Enter school code (e.g., AY8NH)"
                  value={searchSchoolCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    if (/^[A-Z0-9]*$/.test(value) || value === '') {
                      setSearchSchoolCode(value);
                      setSearchError(null);
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all uppercase ${
                    searchError ? 'border-red-500' : 'border-secondary-200'
                  }`}
                  maxLength={10}
                />
                {searchError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading || !searchSchoolCode.trim()}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
              {hasSearched && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-4 py-2.5 text-secondary-600 hover:text-secondary-800 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-1 text-sm"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </form>
            {searchError && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {searchError}
              </p>
            )}
            <p className="text-xs text-secondary-400 mt-1">
              Enter a 5-character school code to filter results
            </p>
          </div>
        </div>
      </div>

      {/* ==========================================
          STATS CARDS
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Schools</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.total_schools}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +12%
                </span>
                <span className="text-xs text-secondary-400">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="text-green-600">● {stats.active_schools} Active</span>
            <span className="text-red-600">● {stats.expired_schools} Expired</span>
            <span className="text-yellow-600">● {stats.suspended_schools} Suspended</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Students</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.total_students.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +8%
                </span>
                <span className="text-xs text-secondary-400">across all schools</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-secondary-400">
            Avg. {Math.round(stats.total_students / (stats.total_schools || 1))} students per school
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Teachers</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.total_teachers}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  +5%
                </span>
                <span className="text-xs text-secondary-400">vs last month</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-secondary-400">
            Student-Teacher ratio: {Math.round(stats.total_students / (stats.total_teachers || 1))}:1
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.monthly_revenue)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  {stats.growth_rate}%
                </span>
                <span className="text-xs text-secondary-400">growth</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-secondary-400">
            {formatCurrency(stats.total_revenue)} total revenue
          </div>
        </div>
      </div>

      {/* ==========================================
          CHARTS
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Revenue & Subscriptions</h3>
          {revenueData.length === 0 || revenueData.every(d => d.revenue === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-secondary-400">
              <p>No transaction data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                <Tooltip formatter={(value: any) => typeof value === 'number' ? formatCurrency(value) : value} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                <Bar yAxisId="right" dataKey="transactions" fill="#8b5cf6" name="Transactions" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Plan Distribution</h3>
          {planDistribution.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-secondary-400">
              <p>No data available</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 flex-wrap">
                {planDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-secondary-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
          RECENT ACTIVITY
          ========================================== */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-900">
            Recent System Activity
            {user && (
              <span className="text-xs font-normal text-secondary-400 ml-2">
                for {user.email}
              </span>
            )}
          </h3>
          <button 
            onClick={fetchActivities}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-secondary-400">
            <Activity className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
            <p className="text-sm">No recent activity for your account</p>
            <p className="text-xs text-secondary-400 mt-1">Activities will appear here as you use the system</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border-b border-secondary-100 hover:bg-secondary-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  activity.action_type === 'payment' ? 'bg-purple-500' :
                  activity.action_type === 'subscription' ? 'bg-green-500' :
                  activity.action_type === 'create' ? 'bg-blue-500' :
                  activity.action_type === 'delete' ? 'bg-red-500' :
                  activity.action_type === 'update' ? 'bg-yellow-500' :
                  activity.action_type === 'login' ? 'bg-indigo-500' :
                  activity.action_type === 'logout' ? 'bg-gray-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        {activity.school_name || 'System'}
                      </p>
                      <p className="text-sm text-secondary-600">{activity.description || activity.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Clock className="w-3 h-3 text-secondary-400" />
                    <span className="text-xs text-secondary-400">
                      {formatDateTime(activity.created_at)}
                    </span>
                    {activity.username && (
                      <>
                        <span className="text-xs text-secondary-400">•</span>
                        <span className="text-xs text-secondary-400">{activity.username}</span>
                      </>
                    )}
                    {activity.ip_address && (
                      <>
                        <span className="text-xs text-secondary-400">•</span>
                        <span className="text-xs text-secondary-400">IP: {activity.ip_address}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activities.length > 0 && (
          <div className="mt-3 text-center text-xs text-secondary-400">
            Showing {activities.length} recent activities
          </div>
        )}
      </div>

      {/* ==========================================
          ALL SCHOOLS TABLE
          ========================================== */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200 flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-semibold text-secondary-900">
            {searchSchoolCode ? `Schools (${schools.length})` : `All Schools (${schools.length})`}
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Filter schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
            >
              <option value="all">All Plans</option>
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
            {(searchTerm || filterPlan !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterPlan('all');
                  setFilterStatus('all');
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {schools.length === 0 ? (
            <div className="text-center py-12">
              <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900">No Schools Found</h3>
              <p className="text-secondary-500 mt-1">
                {searchSchoolCode ? `No schools with code "${searchSchoolCode}"` : 'No schools registered in the system'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">School</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Code</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Admin</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Students</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredSchools.slice(0, 10).map((school) => (
                  <tr key={school.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-secondary-900 text-sm">{school.name}</p>
                        <p className="text-xs text-secondary-400">{school.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs bg-secondary-100 px-2 py-1 rounded text-secondary-600">
                        {school.school_code || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm text-secondary-700">{school.admin_name || 'N/A'}</p>
                        <p className="text-xs text-secondary-400">{school.admin_email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(school.plan)}`}>
                        {getPlanLabel(school.plan)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-600">
                      {school.total_students || 0}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(school.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.status)}`}>
                          {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-500">
                      {formatDate(school.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/system/schools/${school.id}`}
                        className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors inline-block"
                      >
                        <Eye className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredSchools.length > 10 && (
          <div className="p-4 border-t border-secondary-200 text-center">
            <Link to="/system/schools" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all {filteredSchools.length} schools →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;