import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, Award, Calendar, Download,
  ArrowUp, ArrowDown, BookOpen, Users, UserCheck,
  Clock, Star, Target, Brain, Zap, School,
  PieChart, Activity, Globe, Filter, Eye,
  CheckCircle, XCircle, AlertCircle
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
  mockStudents, 
  mockResults, 
  mockSubjects, 
  mockTeachers,
  mockSchools 
} from '../../utils/mockData';
import { getGradeColor } from '../../utils/mockData';

const CommonAnalytics: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('Fall 2026');
  const [viewType, setViewType] = useState<'overview' | 'subjects' | 'students' | 'teachers'>('overview');

  // Filter data
  const filteredStudents = selectedClass === 'all' 
    ? mockStudents 
    : mockStudents.filter(s => s.class === selectedClass);
  
  const filteredResults = mockResults.filter(r => r.term === selectedTerm);
  
  // Statistics
  const totalStudents = filteredStudents.length;
  const totalTeachers = mockTeachers.length;
  const totalSubjects = mockSubjects.length;
  const totalResults = filteredResults.length;
  
  const publishedResults = filteredResults.filter(r => r.isPublished);
  const averageScore = publishedResults.length > 0 
    ? publishedResults.reduce((acc, r) => acc + r.percentage, 0) / publishedResults.length 
    : 0;
  
  const passRate = publishedResults.length > 0 
    ? (publishedResults.filter(r => r.percentage >= 40).length / publishedResults.length) * 100 
    : 0;

  // Class performance comparison
  const classPerformance = ['Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 11B'].map(cls => {
    const students = mockStudents.filter(s => s.class === cls);
    const results = mockResults.filter(r => 
      students.some(s => s.id === r.studentId) && r.term === selectedTerm && r.isPublished
    );
    const avg = results.length > 0 
      ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length 
      : 0;
    return { class: cls, average: avg, students: students.length };
  });

  // Subject performance
  const subjectPerformance = mockSubjects.map(sub => {
    const results = mockResults.filter(r => 
      r.subjectId === sub.id && r.term === selectedTerm && r.isPublished
    );
    const avg = results.length > 0 
      ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length 
      : 0;
    return { 
      subject: sub.name, 
      average: avg, 
      students: results.length,
      passing: results.filter(r => r.percentage >= 40).length,
      failing: results.filter(r => r.percentage < 40).length,
    };
  });

  // Grade distribution
  const gradeDistribution = [
    { name: 'A (80-100%)', value: publishedResults.filter(r => r.percentage >= 80).length },
    { name: 'B (65-79%)', value: publishedResults.filter(r => r.percentage >= 65 && r.percentage < 80).length },
    { name: 'C (50-64%)', value: publishedResults.filter(r => r.percentage >= 50 && r.percentage < 65).length },
    { name: 'D (40-49%)', value: publishedResults.filter(r => r.percentage >= 40 && r.percentage < 50).length },
    { name: 'F (0-39%)', value: publishedResults.filter(r => r.percentage < 40).length },
  ];

  const COLORS = ['#22c55e', '#60a5fa', '#f59e0b', '#fb923c', '#ef4444'];

  // Monthly performance trend
  const monthlyTrend = [
    { month: 'Jan', avg: 62 },
    { month: 'Feb', avg: 65 },
    { month: 'Mar', avg: 68 },
    { month: 'Apr', avg: 72 },
    { month: 'May', avg: 75 },
    { month: 'Jun', avg: 78 },
  ];

  // Top performing students
  const topStudents = mockStudents.map(student => {
    const results = mockResults.filter(r => 
      r.studentId === student.id && r.term === selectedTerm && r.isPublished
    );
    const avg = results.length > 0 
      ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length 
      : 0;
    return { ...student, average: avg, subjects: results.length };
  }).sort((a, b) => b.average - a.average).slice(0, 5);

  const classes = ['all', ...new Set(mockStudents.map(s => s.class))];
  const subjects = ['all', ...mockSubjects.map(s => s.name)];
  const terms = ['Fall 2026', 'Spring 2026', 'Fall 2025'];

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 65) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            School Analytics
          </h1>
          <p className="text-secondary-500">Comprehensive overview of school performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
          >
            {terms.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* View Type Selector */}
      <div className="flex items-center gap-2 bg-white rounded-xl border border-secondary-200 p-2 flex-wrap">
        <button
          onClick={() => setViewType('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewType === 'overview'
              ? 'bg-primary-600 text-white'
              : 'hover:bg-secondary-100 text-secondary-600'
          }`}
        >
          <Activity className="w-4 h-4 inline mr-1" />
          Overview
        </button>
        <button
          onClick={() => setViewType('subjects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewType === 'subjects'
              ? 'bg-primary-600 text-white'
              : 'hover:bg-secondary-100 text-secondary-600'
          }`}
        >
          <BookOpen className="w-4 h-4 inline mr-1" />
          Subjects
        </button>
        <button
          onClick={() => setViewType('students')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewType === 'students'
              ? 'bg-primary-600 text-white'
              : 'hover:bg-secondary-100 text-secondary-600'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Students
        </button>
        <button
          onClick={() => setViewType('teachers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewType === 'teachers'
              ? 'bg-primary-600 text-white'
              : 'hover:bg-secondary-100 text-secondary-600'
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-1" />
          Teachers
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Total Students</p>
              <p className="text-2xl font-bold text-secondary-900">{totalStudents}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              12%
            </span>
            <span className="text-xs text-secondary-400">vs last term</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Average Score</p>
              <p className="text-2xl font-bold text-secondary-900">{averageScore.toFixed(1)}%</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              5.2%
            </span>
            <span className="text-xs text-secondary-400">improvement</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Pass Rate</p>
              <p className="text-2xl font-bold text-secondary-900">{passRate.toFixed(1)}%</p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              3.8%
            </span>
            <span className="text-xs text-secondary-400">increase</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-secondary-400">Total Results</p>
              <p className="text-2xl font-bold text-secondary-900">{totalResults}</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              8%
            </span>
            <span className="text-xs text-secondary-400">more entries</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-secondary-400" />
          <span className="text-sm text-secondary-600">Filters:</span>
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
        >
          {classes.map(cls => (
            <option key={cls} value={cls}>
              {cls === 'all' ? 'All Classes' : cls}
            </option>
          ))}
        </select>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
        >
          {subjects.map(sub => (
            <option key={sub} value={sub}>
              {sub === 'all' ? 'All Subjects' : sub}
            </option>
          ))}
        </select>
        <span className="text-sm text-secondary-400 ml-auto">
          Showing data for {selectedTerm}
        </span>
      </div>

      {/* Charts - Overview View */}
      {viewType === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Class Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="class" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Grade Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
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
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 flex-wrap">
                {gradeDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-secondary-600">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Monthly Performance Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Area type="monotone" dataKey="avg" stroke="#3b82f6" fill="url(#colorTrend)" strokeWidth={2} name="Average %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Top 5 Students</h3>
              <div className="space-y-3">
                {topStudents.map((student, idx) => (
                  <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-secondary-50 rounded-lg transition-colors">
                    <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary-900 truncate">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-secondary-400">{student.class}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${getStatusColor(student.average)}`}>
                        {student.average.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subjects View */}
      {viewType === 'subjects' && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Subject Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Students</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Average</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Passed</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Failed</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Pass Rate</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {subjectPerformance.map((sub) => (
                  <tr key={sub.subject} className="hover:bg-secondary-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-secondary-900">{sub.subject}</td>
                    <td className="py-3 px-4 text-sm text-secondary-600">{sub.students}</td>
                    <td className="py-3 px-4 text-sm font-medium text-secondary-700">{sub.average.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-sm text-green-600">{sub.passing}</td>
                    <td className="py-3 px-4 text-sm text-red-600">{sub.failing}</td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {sub.students > 0 ? ((sub.passing / sub.students) * 100).toFixed(1) + '%' : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sub.average >= 65 ? 'bg-green-50 text-green-600' :
                        sub.average >= 50 ? 'bg-yellow-50 text-yellow-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {sub.average >= 65 ? 'Strong' :
                         sub.average >= 50 ? 'Average' : 'Needs Improvement'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Students View */}
      {viewType === 'students' && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Student Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Class</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subjects</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Average</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredStudents.map((student) => {
                  const results = mockResults.filter(r => 
                    r.studentId === student.id && r.term === selectedTerm && r.isPublished
                  );
                  const avg = results.length > 0 
                    ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length 
                    : 0;
                  const grade = avg >= 80 ? 'A' : avg >= 65 ? 'B' : avg >= 50 ? 'C' : avg >= 40 ? 'D' : 'F';
                  
                  return (
                    <tr key={student.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-xs">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <span className="text-sm font-medium text-secondary-900">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">{student.class}</td>
                      <td className="py-3 px-4 text-sm text-secondary-600">{results.length}</td>
                      <td className="py-3 px-4 text-sm font-medium text-secondary-700">{avg.toFixed(1)}%</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(grade)}`}>
                          {grade}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          avg >= 65 ? 'bg-green-50 text-green-600' :
                          avg >= 50 ? 'bg-yellow-50 text-yellow-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {avg >= 65 ? 'Good Standing' :
                           avg >= 50 ? 'Satisfactory' : 'Needs Attention'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teachers View */}
      {viewType === 'teachers' && (
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Teacher Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTeachers.map((teacher) => {
              const subjects = mockSubjects.filter(s => s.teacherId === teacher.id);
              const results = mockResults.filter(r => 
                subjects.some(s => s.id === r.subjectId) && r.term === selectedTerm && r.isPublished
              );
              const avg = results.length > 0 
                ? results.reduce((acc, r) => acc + r.percentage, 0) / results.length 
                : 0;
              
              return (
                <div key={teacher.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-secondary-900">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-xs text-secondary-400">{teacher.department}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-secondary-400">Subjects</p>
                      <p className="font-medium">{subjects.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-400">Students</p>
                      <p className="font-medium">{results.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-400">Average</p>
                      <p className={`font-medium ${getStatusColor(avg)}`}>{avg.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-400">Status</p>
                      <span className={`text-xs font-medium ${
                        avg >= 65 ? 'text-green-600' :
                        avg >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {avg >= 65 ? 'Good' :
                         avg >= 50 ? 'Average' : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-secondary-100">
                    <div className="flex flex-wrap gap-1">
                      {subjects.map(s => (
                        <span key={s.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonAnalytics;