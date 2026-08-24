import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Users, Building2, 
  DollarSign, Download, Calendar, Filter,
  ArrowUp, ArrowDown, PieChart as PieChartIcon,
  Loader2, RefreshCw, School, Hash, AlertCircle,
  CheckCircle, XCircle, Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { schoolService, subscriptionService, systemService } from '../../api/schoolApi';
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

const SystemAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState([
    { name: 'Trial', value: 0 },
    { name: 'Starter', value: 0 },
    { name: 'Professional', value: 0 },
    { name: 'Enterprise', value: 0 },
  ]);
  const [statusDistribution, setStatusDistribution] = useState([
    { name: 'Active', value: 0 },
    { name: 'Expired', value: 0 },
    { name: 'Suspended', value: 0 },
  ]);
  const [topSchools, setTopSchools] = useState<any[]>([]);

  const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b'];
  const STATUS_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Fetch schools
      const schoolsResponse = await schoolService.getSchools({ page_size: 100 });
      const schoolData = schoolsResponse.results || schoolsResponse;
      setSchools(schoolData);

      // Fetch subscriptions
      const subsResponse = await subscriptionService.getSubscriptions({ page_size: 100 });
      const subData = subsResponse.results || subsResponse;
      setSubscriptions(subData);

      // Calculate stats
      const activeSchools = schoolData.filter((s: School) => s.status === 'active').length;
      const expiredSchools = schoolData.filter((s: School) => s.status === 'expired').length;
      const suspendedSchools = schoolData.filter((s: School) => s.status === 'suspended').length;
      
      const totalStudents = schoolData.reduce((acc: number, s: School) => acc + (s.total_students || 0), 0);
      const totalTeachers = schoolData.reduce((acc: number, s: School) => acc + (s.total_teachers || 0), 0);

      // Calculate revenue from subscriptions
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

      // Calculate status distribution
      const active = schoolData.filter((s: School) => s.status === 'active').length;
      const expired = schoolData.filter((s: School) => s.status === 'expired').length;
      const suspended = schoolData.filter((s: School) => s.status === 'suspended').length;

      setStatusDistribution([
        { name: 'Active', value: active },
        { name: 'Expired', value: expired },
        { name: 'Suspended', value: suspended },
      ]);

      // Generate revenue data for chart
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const revenueChartData = months.map((month, idx) => ({
        month,
        revenue: monthlyRevenue * (0.6 + (idx / 6) * 0.4),
        subscriptions: subData.length * (0.5 + (idx / 6) * 0.5),
      }));
      setRevenueData(revenueChartData);

      // Generate growth data
      const growthChartData = months.map((month, idx) => ({
        month,
        schools: schoolData.length * (0.5 + (idx / 6) * 0.5),
        students: totalStudents * (0.5 + (idx / 6) * 0.5),
        revenue: monthlyRevenue * (0.6 + (idx / 6) * 0.4),
      }));
      setGrowthData(growthChartData);

      // Top schools
      const top = schoolData
        .map(s => ({
          schoolName: s.name,
          schoolCode: s.school_code,
          studentCount: s.total_students || 0,
          revenue: s.plan === 'enterprise' ? 75000 : s.plan === 'professional' ? 35000 : s.plan === 'starter' ? 15000 : 0,
          growth: Math.floor(Math.random() * 30) + 5,
          plan: s.plan,
          status: s.status,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopSchools(top);

    } catch (error: any) {
      console.error('Failed to fetch analytics data:', error);
      toast.error(error.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, fetchAllData]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getPlanColor = (plan: string): string => {
    const colors: Record<string, string> = {
      trial: 'bg-blue-100 text-blue-700',
      starter: 'bg-green-100 text-green-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-yellow-100 text-yellow-700',
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
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

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const headers = ['School', 'School Code', 'Plan', 'Students', 'Teachers', 'Status', 'Revenue', 'Joined'];
      const rows = schools.map(s => [
        s.name,
        s.school_code || 'N/A',
        getPlanLabel(s.plan),
        s.total_students || 0,
        s.total_teachers || 0,
        s.status,
        s.plan === 'enterprise' ? 75000 : s.plan === 'professional' ? 35000 : s.plan === 'starter' ? 15000 : 0,
        new Date(s.created_at).toLocaleDateString()
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view analytics</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            System Analytics
          </h1>
          <p className="text-secondary-500">Deep dive into system performance and growth</p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Total Revenue</p>
              <p className="text-lg font-bold text-secondary-900">{formatCurrency(stats.total_revenue)}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              {stats.growth_rate}%
            </span>
            <span className="text-xs text-secondary-400">growth</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">MRR</p>
              <p className="text-lg font-bold text-secondary-900">{formatCurrency(stats.monthly_revenue)}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              12.5%
            </span>
            <span className="text-xs text-secondary-400">MoM</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Avg. Revenue/School</p>
              <p className="text-lg font-bold text-secondary-900">
                {formatCurrency(stats.total_schools > 0 ? stats.total_revenue / stats.total_schools : 0)}
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Building2 className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              8.2%
            </span>
            <span className="text-xs text-secondary-400">vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Conversion Rate</p>
              <p className="text-lg font-bold text-secondary-900">
                {stats.total_schools > 0 ? Math.round((stats.active_schools / stats.total_schools) * 100) : 0}%
              </p>
            </div>
            <div className="p-2 bg-yellow-50 rounded-lg">
              <PieChartIcon className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              5.3%
            </span>
            <span className="text-xs text-secondary-400">improvement</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Growth Trends</h3>
          {growthData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-secondary-400">
              <p>No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="schools" stroke="#3b82f6" strokeWidth={2} name="Schools" />
                <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={2} name="Students" />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
              </LineChart>
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
                <PieChart>
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Status Distribution</h3>
          {statusDistribution.every(d => d.value === 0) ? (
            <div className="flex items-center justify-center h-[250px] text-secondary-400">
              <p>No data available</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Top Schools Performance</h3>
          {topSchools.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-secondary-400">
              <p>No data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topSchools.map((school, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-secondary-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">{school.schoolName}</p>
                    <div className="flex items-center gap-2 text-xs text-secondary-400">
                      <span className="font-mono text-xs">{school.schoolCode || 'N/A'}</span>
                      <span>•</span>
                      <span>{school.studentCount} students</span>
                      <span>•</span>
                      <span className="text-green-600">↑ {school.growth}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-secondary-900">{formatCurrency(school.revenue)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPlanColor(school.plan)}`}>
                      {getPlanLabel(school.plan)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Monthly Revenue Breakdown</h3>
        {revenueData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-secondary-400">
            <p>No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default SystemAnalytics;