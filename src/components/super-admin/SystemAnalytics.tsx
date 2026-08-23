import React from 'react';
import { 
  BarChart3, TrendingUp, Users, Building2, 
  DollarSign, Download, Calendar, Filter,
  ArrowUp, ArrowDown, PieChart as PieChartIcon
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
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { 
  mockSystemStats, 
  mockRevenueData, 
  mockAllSchools,
  mockTopSchools
} from '../../utils/mockData';
import { formatCurrency } from '../../utils/helpers';

const SystemAnalytics: React.FC = () => {
  const stats = mockSystemStats;
  const revenueData = mockRevenueData;
  const schools = mockAllSchools;

  // Growth data
  const growthData = [
    { month: 'Jan', schools: 85, students: 8500, revenue: 3200 },
    { month: 'Feb', schools: 88, students: 8900, revenue: 3500 },
    { month: 'Mar', schools: 92, students: 9400, revenue: 3800 },
    { month: 'Apr', schools: 95, students: 9800, revenue: 4100 },
    { month: 'May', schools: 98, students: 10200, revenue: 4400 },
    { month: 'Jun', schools: 102, students: 10800, revenue: 4802 },
  ];

  const planDistribution = [
    { name: 'Trial', value: schools.filter(s => s.subscription.plan === 'trial').length },
    { name: 'Starter', value: schools.filter(s => s.subscription.plan === 'starter').length },
    { name: 'Professional', value: schools.filter(s => s.subscription.plan === 'professional').length },
    { name: 'Enterprise', value: schools.filter(s => s.subscription.plan === 'enterprise').length },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b'];

  // Status distribution
  const statusDistribution = [
    { name: 'Active', value: schools.filter(s => s.subscription.status === 'active').length },
    { name: 'Expired', value: schools.filter(s => s.subscription.status === 'expired').length },
    { name: 'Suspended', value: schools.filter(s => s.subscription.status === 'suspended').length },
  ];

  const STATUS_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

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
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Calendar className="w-4 h-4" />
            Last 6 Months
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Total Revenue</p>
              <p className="text-lg font-bold text-secondary-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              {stats.growthRate}%
            </span>
            <span className="text-xs text-secondary-400">growth</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">MRR</p>
              <p className="text-lg font-bold text-secondary-900">{formatCurrency(stats.monthlyRevenue)}</p>
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
                {formatCurrency(stats.totalRevenue / stats.totalSchools)}
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
                {Math.round((schools.filter(s => s.subscription.status === 'active').length / stats.totalSchools) * 100)}%
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="schools" stroke="#3b82f6" strokeWidth={2} name="Schools" />
              <Line type="monotone" dataKey="students" stroke="#8b5cf6" strokeWidth={2} name="Students" />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Plan Distribution</h3>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Status Distribution</h3>
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
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Top Schools Performance</h3>
          <div className="space-y-3">
            {mockTopSchools.map((school, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 bg-secondary-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 truncate">{school.schoolName}</p>
                  <div className="flex items-center gap-2 text-xs text-secondary-400">
                    <span>{school.studentCount} students</span>
                    <span>•</span>
                    <span className="text-green-600">↑ {school.growth}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-secondary-900">{formatCurrency(school.revenue)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    school.plan === 'Enterprise' ? 'bg-yellow-100 text-yellow-700' :
                    school.plan === 'Professional' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {school.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="font-semibold text-secondary-900 mb-4">Monthly Revenue Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SystemAnalytics;