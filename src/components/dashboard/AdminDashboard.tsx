import React from 'react';
import { Users, UserCheck, BookOpen, ClipboardList, TrendingUp, Award, Calendar, Download } from 'lucide-react';
import StatCard from '../common/StatCard';
import { mockSchools, mockStudents, mockTeachers, mockSubjects, mockResults, mockActivities } from '../../utils/mockData';
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

const AdminDashboard: React.FC = () => {
  const school = mockSchools[0];
  
  const performanceData = [
    { term: 'Fall 2024', average: 68 },
    { term: 'Spring 2025', average: 72 },
    { term: 'Fall 2025', average: 75 },
    { term: 'Spring 2026', average: 78 },
    { term: 'Fall 2026', average: 82 },
  ];

  const subjectPerformance = [
    { subject: 'Mathematics', average: 72 },
    { subject: 'English', average: 78 },
    { subject: 'Biology', average: 85 },
    { subject: 'Chemistry', average: 65 },
    { subject: 'History', average: 70 },
    { subject: 'Physics', average: 76 },
    { subject: 'Geography', average: 68 },
  ];

  const gradeDistribution = [
    { name: 'A (80-100%)', value: 45 },
    { name: 'B (65-79%)', value: 68 },
    { name: 'C (50-64%)', value: 42 },
    { name: 'D (40-49%)', value: 15 },
    { name: 'F (0-39%)', value: 8 },
  ];

  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

  const recentActivities = mockActivities.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
          <p className="text-secondary-500">Welcome back, John! Here's your school overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Calendar className="w-4 h-4" />
            Fall 2026
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={school.stats.totalStudents}
          icon={Users}
          color="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Teachers"
          value={school.stats.totalTeachers}
          icon={UserCheck}
          color="green"
          subtitle="5 departments"
        />
        <StatCard
          title="Total Subjects"
          value={school.stats.totalSubjects}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Total Results"
          value={school.stats.totalResults}
          icon={ClipboardList}
          color="orange"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Performance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="term" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="average" stroke="#3b82f6" fill="url(#colorAverage)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Subject Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="subject" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-secondary-100 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'result' ? 'bg-green-500' :
                  activity.type === 'student' ? 'bg-blue-500' :
                  activity.type === 'publish' ? 'bg-purple-500' :
                  activity.type === 'payment' ? 'bg-emerald-500' :
                  activity.type === 'subscription' ? 'bg-indigo-500' :
                  'bg-orange-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-secondary-700 truncate">{activity.action}</p>
                  <p className="text-xs text-secondary-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;