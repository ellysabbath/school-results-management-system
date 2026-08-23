import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, UserCheck, CreditCard, TrendingUp, 
  Calendar, Download, Search, Filter, Eye, MoreVertical,
  DollarSign, School, AlertCircle, CheckCircle, XCircle,
  Clock, BarChart3, ArrowUp, ArrowDown, Zap, Shield,
  Activity, PieChart, Server
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
  PieChart as RePieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import { 
  mockSystemStats, 
  mockRevenueData, 
  mockSystemActivities, 
  mockAllSchools,
  mockSystemAlerts,
  mockTopSchools,
  getPlanColor,
  getPlanLabel,
  getStatusColor
} from '../../utils/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

const SuperAdminDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = mockSystemStats;
  const revenueData = mockRevenueData;
  const activities = mockSystemActivities.slice(0, 5);
  const alerts = mockSystemAlerts.filter(a => !a.isResolved);
  const schools = mockAllSchools;

  // Filter schools
  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          school.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          school.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || school.subscription.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || school.subscription.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Plan distribution for pie chart
  const planDistribution = [
    { name: 'Trial', value: schools.filter(s => s.subscription.plan === 'trial').length },
    { name: 'Starter', value: schools.filter(s => s.subscription.plan === 'starter').length },
    { name: 'Professional', value: schools.filter(s => s.subscription.plan === 'professional').length },
    { name: 'Enterprise', value: schools.filter(s => s.subscription.plan === 'enterprise').length },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b'];

  const handleSchoolAction = (action: string, schoolName: string) => {
    toast.success(`${action} action performed on ${schoolName}`);
  };

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
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <Calendar className="w-4 h-4" />
            This Month
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border flex items-start gap-3 ${
              alert.type === 'critical' ? 'bg-red-50 border-red-200' :
              alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                alert.type === 'critical' ? 'text-red-600' :
                alert.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div className="flex-1">
                <p className={`font-medium ${
                  alert.type === 'critical' ? 'text-red-700' :
                  alert.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>{alert.title}</p>
                <p className="text-sm text-secondary-600">{alert.message}</p>
                <p className="text-xs text-secondary-400 mt-1">{formatDate(alert.timestamp)}</p>
              </div>
              <button className="text-sm text-secondary-500 hover:text-secondary-700 font-medium">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Schools</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.totalSchools}</p>
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
            <span className="text-green-600">● {stats.activeSchools} Active</span>
            <span className="text-red-600">● {stats.expiredSchools} Expired</span>
            <span className="text-yellow-600">● {stats.suspendedSchools} Suspended</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Students</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.totalStudents.toLocaleString()}</p>
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
            Avg. {Math.round(stats.totalStudents / stats.totalSchools)} students per school
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Total Teachers</p>
              <p className="text-2xl font-bold text-secondary-900">{stats.totalTeachers}</p>
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
            Student-Teacher ratio: {Math.round(stats.totalStudents / stats.totalTeachers)}:1
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.monthlyRevenue)}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  {stats.growthRate}%
                </span>
                <span className="text-xs text-secondary-400">growth</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 text-xs text-secondary-400">
            {formatCurrency(stats.totalRevenue)} total revenue
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Revenue & Subscriptions</h3>
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
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} name="Revenue ($)" />
              <Bar yAxisId="right" dataKey="subscriptions" fill="#8b5cf6" name="Subscriptions" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Plan Distribution</h3>
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
        </div>
      </div>

      {/* Recent Activity & Top Schools */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Recent System Activity</h3>
            <Link to="/system/analytics" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 border-b border-secondary-100 hover:bg-secondary-50 rounded-lg transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'school_registered' ? 'bg-blue-500' :
                  activity.type === 'subscription_activated' ? 'bg-green-500' :
                  activity.type === 'subscription_expired' ? 'bg-red-500' :
                  activity.type === 'payment_received' ? 'bg-purple-500' :
                  activity.type === 'school_suspended' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">{activity.schoolName}</p>
                      <p className="text-sm text-secondary-600">{activity.description}</p>
                    </div>
                    {activity.amount && (
                      <span className="text-sm font-medium text-green-600 whitespace-nowrap ml-2">
                        +{formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Top Performing Schools</h3>
            <div className="space-y-3">
              {mockTopSchools.map((school, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-secondary-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">{school.schoolName}</p>
                    <div className="flex items-center gap-2 text-xs text-secondary-400">
                      <span>{school.studentCount} students</span>
                      <span>•</span>
                      <span className={`${getPlanColor(school.plan)} px-1.5 py-0.5 rounded-full text-xs`}>
                        {school.plan}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-secondary-900">{formatCurrency(school.revenue)}</p>
                    <p className="text-xs text-green-600">↑ {school.growth}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/system/schools"
                className="p-3 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors text-center"
              >
                <Building2 className="w-5 h-5 mx-auto text-primary-600 mb-1" />
                <span className="text-xs font-medium text-primary-700">All Schools</span>
              </Link>
              <Link
                to="/system/analytics"
                className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center"
              >
                <PieChart className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <span className="text-xs font-medium text-purple-700">Analytics</span>
              </Link>
              <Link
                to="/system/settings"
                className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center"
              >
                <Server className="w-5 h-5 mx-auto text-green-600 mb-1" />
                <span className="text-xs font-medium text-green-700">Settings</span>
              </Link>
              <button className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-center">
                <Activity className="w-5 h-5 mx-auto text-yellow-600 mb-1" />
                <span className="text-xs font-medium text-yellow-700">Health Check</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* All Schools Table Preview */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
          <h3 className="font-semibold text-secondary-900">All Schools</h3>
          <Link to="/system/schools" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View All Schools →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">School</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Admin</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Plan</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Students</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredSchools.slice(0, 5).map((school) => (
                <tr key={school.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-secondary-900 text-sm">{school.name}</p>
                      <p className="text-xs text-secondary-400">{school.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-secondary-700">{school.adminName}</p>
                      <p className="text-xs text-secondary-400">{school.adminEmail}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(school.subscription.plan)}`}>
                      {getPlanLabel(school.subscription.plan)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">
                    {school.usage.totalStudents}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.subscription.status)}`}>
                      {school.subscription.status.charAt(0).toUpperCase() + school.subscription.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-500">
                    {formatDate(school.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSchools.length > 5 && (
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