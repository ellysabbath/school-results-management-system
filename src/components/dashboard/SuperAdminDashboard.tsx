import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, UserCheck, CreditCard, TrendingUp, 
  Calendar, Download, Search, Filter, Eye, MoreVertical,
  DollarSign, School, AlertCircle, CheckCircle, XCircle,
  Clock, BarChart3, ArrowUp, ArrowDown, Zap, Shield,
  Activity, PieChart, Server, Loader2, RefreshCw,
  Hash, Copy, Mail, Phone, Home, BarChart, X
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart as ReBarChart,
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
import { schoolService, subscriptionService, systemService, studentService } from '../../api/schoolApi';
import toast from 'react-hot-toast';

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

interface Subscription {
  id: number;
  school: number;
  school_name: string;
  school_code: string;
  plan: number;
  plan_name: string;
  plan_display_name: string;
  status: string;
  days_remaining: number;
  is_active: boolean;
  is_trial: boolean;
  is_expiring_soon: boolean;
  current_period_end: string;
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

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setSearchError(null);
    
    try {
      const params: any = { page_size: 100 };

      // If searching by school code
      if (searchSchoolCode && searchSchoolCode.trim() !== '') {
        params.school_code = searchSchoolCode.trim().toUpperCase();
        setHasSearched(true);
      }

      // Fetch schools
      const schoolsResponse = await schoolService.getSchools(params);
      const schoolData = schoolsResponse.results || schoolsResponse;
      setSchools(schoolData);

      // Fetch subscriptions
      const subsResponse = await subscriptionService.getSubscriptions({ page_size: 100 });
      const subData = subsResponse.results || subsResponse;
      setSubscriptions(subData);

      // Fetch activity logs
      const activityResponse = await systemService.getActivities({ page_size: 20 });
      const activityData = activityResponse.results || activityResponse;
      setActivities(activityData);

      // Calculate stats
      const activeSchools = schoolData.filter((s: School) => s.status === 'active').length;
      const expiredSchools = schoolData.filter((s: School) => s.status === 'expired').length;
      const suspendedSchools = schoolData.filter((s: School) => s.status === 'suspended').length;
      
      const totalStudents = schoolData.reduce((acc: number, s: School) => acc + (s.total_students || 0), 0);
      const totalTeachers = schoolData.reduce((acc: number, s: School) => acc + (s.total_teachers || 0), 0);

      // Calculate revenue (simulated from subscriptions)
      const monthlyRevenue = subData.reduce((acc: number, s: any) => {
        if (s.plan_name === 'starter') return acc + 15000;
        if (s.plan_name === 'professional') return acc + 35000;
        if (s.plan_name === 'enterprise') return acc + 75000;
        return acc + 0;
      }, 0);

      setStats({
        total_schools: schoolData.length,
        active_schools: activeSchools,
        expired_schools: expiredSchools,
        suspended_schools: suspendedSchools,
        total_students: totalStudents,
        total_teachers: totalTeachers,
        monthly_revenue: monthlyRevenue,
        total_revenue: monthlyRevenue * 12,
        growth_rate: 12.5,
      });

      // Calculate plan distribution
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

      // Generate revenue data for chart
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const revenueChartData = months.map((month, idx) => ({
        month,
        revenue: monthlyRevenue * (0.6 + (idx / 6) * 0.4),
        subscriptions: subData.length * (0.5 + (idx / 6) * 0.5),
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
  }, [searchSchoolCode]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

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

  // Filter schools (for display)
  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (school.admin_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          school.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (school.school_code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || school.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || school.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

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

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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

  // If not authenticated
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            System Dashboard
          </h1>
          <p className="text-secondary-500">Full overview of all schools and system performance</p>
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

      {/* Search by School Code */}
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

      {/* Stats Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Revenue & Subscriptions</h3>
          {revenueData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-secondary-400">
              <p>No data available</p>
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
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                <Bar yAxisId="right" dataKey="subscriptions" fill="#8b5cf6" name="Subscriptions" />
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
                    {planDistribution.map((entry, index) => (
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

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-900">Recent System Activity</h3>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All
          </button>
        </div>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-secondary-400">
            <Activity className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
            <p className="text-sm">No recent activity</p>
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
                  <p className="text-xs text-secondary-400 mt-1">
                    {formatDate(activity.created_at)} • {activity.username || 'System'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Schools Table */}
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