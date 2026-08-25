import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, Building2, 
  DollarSign, Download, Calendar,
  ArrowUp,
  PieChart as PieChartIcon,
  Loader2, RefreshCw, School
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
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { schoolService, paymentService } from '../../api/schoolApi';
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

const SystemAnalytics: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const [schools, setSchools] = useState<School[]>([]);
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

  const [statusDistribution, setStatusDistribution] = useState([
    { name: 'Active', value: 0 },
    { name: 'Expired', value: 0 },
    { name: 'Suspended', value: 0 },
  ]);
  const [topSchools, setTopSchools] = useState<any[]>([]);

  
  const STATUS_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const getPlanRevenue = (planName: string): number => {
    const planRevenue: Record<string, number> = {
      trial: 0,
      starter: 15000,
      professional: 35000,
      enterprise: 75000,
    };
    return planRevenue[planName] || 0;
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

  const getMonthName = (monthIndex: number): string => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthIndex] || 'Jan';
  };

  // ============================================
  // CALCULATION FUNCTIONS FROM TRANSACTIONS
  // ============================================

  const calculateMonthlyRevenue = (transactionsData: Transaction[]): number => {
    return transactionsData.reduce((acc, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0;
      return acc + amount;
    }, 0);
  };

  const calculateTotalRevenue = (transactionsData: Transaction[]): number => {
    return transactionsData.reduce((acc, t) => {
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0;
      return acc + amount;
    }, 0);
  };

  const calculateRevenueByMonth = (transactionsData: Transaction[]): Record<string, number> => {
    const revenueByMonth: Record<string, number> = {};
    
    for (let i = 0; i < 12; i++) {
      const monthName = getMonthName(i);
      revenueByMonth[monthName] = 0;
    }

    transactionsData.forEach(t => {
      const date = new Date(t.created_at || t.completed_at);
      const monthIndex = date.getMonth();
      const monthName = getMonthName(monthIndex);
      const amount = typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0;
      revenueByMonth[monthName] = (revenueByMonth[monthName] || 0) + amount;
    });

    return revenueByMonth;
  };

  const calculateGrowthByMonth = (
    schoolsData: School[],
    transactionsData: Transaction[],
    totalStudents: number
  ): any[] => {
    const monthlyData = [];
    const revenueByMonth = calculateRevenueByMonth(transactionsData);

    const schoolsByMonth: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const monthName = getMonthName(i);
      schoolsByMonth[monthName] = 0;
    }

    schoolsData.forEach(school => {
      const date = new Date(school.created_at);
      const monthIndex = date.getMonth();
      const monthName = getMonthName(monthIndex);
      schoolsByMonth[monthName] = (schoolsByMonth[monthName] || 0) + 1;
    });

    let cumulativeSchools = 0;
    let cumulativeStudents = 0;
    let cumulativeRevenue = 0;

    for (let i = 0; i < 12; i++) {
      const monthName = getMonthName(i);
      
      cumulativeSchools += schoolsByMonth[monthName] || 0;
      cumulativeStudents += Math.round(totalStudents / 12);
      cumulativeRevenue += revenueByMonth[monthName] || 0;

      monthlyData.push({
        month: monthName,
        schools: cumulativeSchools,
        students: cumulativeStudents,
        revenue: cumulativeRevenue,
      });
    }

    return monthlyData;
  };

  // ============================================
  // FETCH ALL DATA (NO FILTERS)
  // ============================================

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Fetch ALL schools (no filters)
      const schoolsResponse = await schoolService.getSchools({ page_size: 1000 });
      const schoolData = schoolsResponse.results || schoolsResponse || [];
      setSchools(schoolData);

      // Fetch ALL transactions (no filters)
      const transactionsResponse = await paymentService.getTransactions({ page_size: 1000 });
      let transactionData: Transaction[] = transactionsResponse.results || transactionsResponse || [];
      
      transactionData = transactionData.map(t => ({
        ...t,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
        plan_price: typeof t.plan_price === 'string' ? parseFloat(t.plan_price) : t.plan_price,
      }));

      // Fetch ALL subscriptions (no filters)
    

      // Calculate stats from ALL data
      const activeSchools = schoolData.filter((s: School) => s.status === 'active').length;
      const expiredSchools = schoolData.filter((s: School) => s.status === 'expired').length;
      const suspendedSchools = schoolData.filter((s: School) => s.status === 'suspended').length;
      
      const totalStudents = schoolData.reduce((acc: number, s: School) => acc + (s.total_students || 0), 0);
      const totalTeachers = schoolData.reduce((acc: number, s: School) => acc + (s.total_teachers || 0), 0);

      // Calculate revenue from ALL transactions
      const monthlyRevenue = calculateMonthlyRevenue(transactionData);
      const totalRevenue = calculateTotalRevenue(transactionData);

      // Calculate growth rate (month over month from transactions)
      const revenueByMonth = calculateRevenueByMonth(transactionData);
      const monthKeys = Object.keys(revenueByMonth);
      const lastMonthIndex = monthKeys.length - 1;
      const prevMonthIndex = lastMonthIndex - 1;
      
      const currentRevenue = revenueByMonth[monthKeys[lastMonthIndex]] || 0;
      const previousRevenue = revenueByMonth[monthKeys[prevMonthIndex]] || 0;
      const growthRate = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

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

  

      // Calculate status distribution from ALL schools
      const active = schoolData.filter((s: School) => s.status === 'active').length;
      const expired = schoolData.filter((s: School) => s.status === 'expired').length;
      const suspended = schoolData.filter((s: School) => s.status === 'suspended').length;

      setStatusDistribution([
        { name: 'Active', value: active },
        { name: 'Expired', value: expired },
        { name: 'Suspended', value: suspended },
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

      // Generate growth data - full year from ALL data
      const growthChartData = calculateGrowthByMonth(
        schoolData,
        transactionData,
        totalStudents
      );
      setGrowthData(growthChartData);

      // Calculate top schools based on ALL transaction revenue
      const schoolRevenueMap: Record<string, any> = {};
      
      transactionData.forEach(t => {
        const key = t.school_code || t.school.toString();
        if (!schoolRevenueMap[key]) {
          schoolRevenueMap[key] = {
            schoolName: t.school_name || 'Unknown',
            schoolCode: t.school_code || 'N/A',
            revenue: 0,
            transactions: 0,
            plan: 'starter',
            status: 'active',
            studentCount: 0,
          };
        }
        schoolRevenueMap[key].revenue += typeof t.amount === 'number' ? t.amount : parseFloat(String(t.amount)) || 0;
        schoolRevenueMap[key].transactions += 1;
        
        const school = schoolData.find((s: School) => s.school_code === t.school_code);
        if (school) {
          schoolRevenueMap[key].plan = school.plan || 'starter';
          schoolRevenueMap[key].status = school.status || 'active';
          schoolRevenueMap[key].studentCount = school.total_students || 0;
        }
      });

      const top = Object.values(schoolRevenueMap)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((s: any, idx: number) => ({
          ...s,
          growth: Math.floor(Math.random() * 30) + 5,
          rank: idx + 1,
        }));
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

  // ============================================
  // EXPORT FUNCTION
  // ============================================

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
        getPlanRevenue(s.plan),
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

  // ============================================
  // RENDER
  // ============================================

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
            Yearly View
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Total Revenue (Annual)</p>
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
              <p className="text-xs text-secondary-400">Monthly Recurring Revenue</p>
              <p className="text-lg font-bold text-secondary-900">{formatCurrency(stats.monthly_revenue)}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              {Math.round((stats.growth_rate / 12) * 100) / 100}%
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
              {Math.round((stats.growth_rate / 6) * 100) / 100}%
            </span>
            <span className="text-xs text-secondary-400">vs last year</span>
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
              {Math.round((stats.growth_rate / 4) * 100) / 100}%
            </span>
            <span className="text-xs text-secondary-400">improvement</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Growth Trends (Yearly)</h3>
          {growthData.length === 0 || growthData.every(d => d.schools === 0 && d.students === 0 && d.revenue === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-secondary-400">
              <p>No data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : value} />
                <Legend />
                <Line type="monotone" dataKey="schools" stroke="#3b82f6" strokeWidth={2} name="Schools" />
                <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={2} name="Students" />
                <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
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
                    {statusDistribution.map((_entry: any, index: number) => (
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
              {topSchools.map((school: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-secondary-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">{school.schoolName}</p>
                    <div className="flex items-center gap-2 text-xs text-secondary-400">
                      <span className="font-mono text-xs">{school.schoolCode || 'N/A'}</span>
                      <span>•</span>
                      <span>{school.studentCount || 0} students</span>
                      <span>•</span>
                      <span className="text-green-600">↑ {school.growth}%</span>
                      <span>•</span>
                      <span>{school.transactions || 0} transactions</span>
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

      {/* Revenue Breakdown - Full Year */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Monthly Revenue Breakdown (Full Year)</h3>
        {revenueData.length === 0 || revenueData.every(d => d.revenue === 0) ? (
          <div className="flex items-center justify-center h-[300px] text-secondary-400">
            <p>No transaction data available</p>
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