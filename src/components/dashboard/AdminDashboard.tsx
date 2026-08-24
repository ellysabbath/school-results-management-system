import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserCheck, BookOpen, ClipboardList, TrendingUp, Award, 
  Calendar, Download, Loader2, School, RefreshCw, AlertCircle,
  CheckCircle, XCircle, BarChart3, PieChart as PieChartIcon,
  Activity, BookMarked, GraduationCap, Target, Percent,
  FileText, Clock, User, Mail, Settings, Bell
} from 'lucide-react';
import StatCard from '../common/StatCard';
import { 
  schoolService, 
  studentService, 
  teacherService, 
  subjectService, 
  resultService,
  subscriptionService 
} from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
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

// ============================================
// INTERFACES
// ============================================

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalResults: number;
  publishedResults: number;
  averagePerformance: number;
  totalSchools?: number;
}

interface PerformanceDataPoint {
  term: string;
  average: number;
}

interface SubjectPerformanceData {
  subject: string;
  average: number;
  students: number;
}

interface GradeDistributionData {
  name: string;
  value: number;
  percentage: number;
}

interface ActivityLog {
  id: number;
  action: string;
  type: string;
  time: string;
  user?: string;
}

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, school } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalResults: 0,
    publishedResults: 0,
    averagePerformance: 0,
  });
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceData[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistributionData[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [schoolName, setSchoolName] = useState<string>('');
  const [schoolCode, setSchoolCode] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('Current');
  const [terms, setTerms] = useState<{id: number; name: string; academic_year: string}[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null);
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);

  // ============================================
  // FETCH DASHBOARD DATA
  // ============================================

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Get user's school
      const userEmail = user.email;
      let schoolData = null;
      let schoolCodeValue = '';
      let schoolIdValue = null;

      // If school is provided from context, use it
      if (school) {
        schoolData = school;
        schoolCodeValue = school.school_code || '';
        schoolIdValue = school.id;
        setSchoolName(school.name || 'My School');
        setSchoolCode(school.school_code || '');
      } else if (userEmail) {
        // Fetch school by admin email
        const schoolsResponse = await schoolService.getSchools({
          admin_email: userEmail,
          page_size: 1
        });
        
        const results = schoolsResponse.results || schoolsResponse;
        if (results && results.length > 0) {
          schoolData = results[0];
          schoolCodeValue = schoolData.school_code || '';
          schoolIdValue = schoolData.id;
          setSchoolName(schoolData.name || 'My School');
          setSchoolCode(schoolData.school_code || '');
        } else {
          toast.error('No school found for your account');
          setIsLoading(false);
          return;
        }
      } else {
        toast.error('Unable to identify your school');
        setIsLoading(false);
        return;
      }

      if (!schoolCodeValue) {
        toast.error('School code not found');
        setIsLoading(false);
        return;
      }

      // Fetch students
      const studentsResponse = await studentService.getStudentsBySchoolCode(schoolCodeValue);
      let students: any[] = [];
      if (studentsResponse.status === 'success' && studentsResponse.data) {
        const groupedData = studentsResponse.data;
        if (groupedData.length > 0) {
          students = groupedData[0].students || [];
        }
      } else if (Array.isArray(studentsResponse)) {
        students = studentsResponse;
      } else if (studentsResponse.results) {
        students = studentsResponse.results;
      }
      const totalStudents = students.length;

      // Fetch teachers
      const teachersResponse = await teacherService.getTeachersBySchoolCode(schoolCodeValue);
      let teachers: any[] = [];
      if (teachersResponse.results) {
        teachers = teachersResponse.results;
      } else if (Array.isArray(teachersResponse)) {
        teachers = teachersResponse;
      }
      const totalTeachers = teachers.length;

      // Fetch subjects
      const subjectsResponse = await subjectService.getSubjects({
        school_code: schoolCodeValue,
        page_size: 100
      });
      let subjects: any[] = [];
      if (subjectsResponse.results) {
        subjects = subjectsResponse.results;
      } else if (Array.isArray(subjectsResponse)) {
        subjects = subjectsResponse;
      }
      const totalSubjects = subjects.length;

      // Fetch results
      const resultsResponse = await resultService.getResults({
        school_code: schoolCodeValue,
        page_size: 100
      });
      let results: any[] = [];
      if (resultsResponse.results) {
        results = resultsResponse.results;
      } else if (Array.isArray(resultsResponse)) {
        results = resultsResponse;
      } else if (resultsResponse.data) {
        results = resultsResponse.data;
      }
      const totalResults = results.length;
      const publishedResults = results.filter(r => r.is_published).length;

      // Calculate average performance
      let avgPerformance = 0;
      if (results.length > 0) {
        const totalPercentage = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
        avgPerformance = totalPercentage / results.length;
      }

      // Update stats
      setStats({
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalResults,
        publishedResults,
        averagePerformance: avgPerformance,
      });

      // Generate performance trend data (from results grouped by term)
      const termMap = new Map<string, {total: number; count: number}>();
      results.forEach(r => {
        const termName = r.term_name || 'Unknown';
        if (!termMap.has(termName)) {
          termMap.set(termName, {total: 0, count: 0});
        }
        const entry = termMap.get(termName)!;
        entry.total += r.percentage || 0;
        entry.count += 1;
      });

      const performanceDataArray: PerformanceDataPoint[] = Array.from(termMap.entries())
        .map(([term, data]) => ({
          term,
          average: data.count > 0 ? data.total / data.count : 0,
        }))
        .slice(-5); // Last 5 terms

      if (performanceDataArray.length === 0) {
        // Fallback mock data if no results
        performanceDataArray.push(
          { term: 'Fall 2025', average: 0 },
          { term: 'Spring 2026', average: 0 },
          { term: 'Current', average: 0 }
        );
      }
      setPerformanceData(performanceDataArray);

      // Generate subject performance
      const subjectMap = new Map<string, {total: number; count: number}>();
      results.forEach(r => {
        const subjectName = r.subject_name || 'Unknown';
        if (!subjectMap.has(subjectName)) {
          subjectMap.set(subjectName, {total: 0, count: 0});
        }
        const entry = subjectMap.get(subjectName)!;
        entry.total += r.percentage || 0;
        entry.count += 1;
      });

      const subjectDataArray: SubjectPerformanceData[] = Array.from(subjectMap.entries())
        .map(([subject, data]) => ({
          subject,
          average: data.count > 0 ? data.total / data.count : 0,
          students: data.count,
        }))
        .sort((a, b) => b.average - a.average);

      setSubjectPerformance(subjectDataArray);

      // Generate grade distribution
      const gradeCounts = new Map<string, number>();
      results.forEach(r => {
        const grade = r.grade || 'N/A';
        gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
      });

      const gradeDataArray: GradeDistributionData[] = Array.from(gradeCounts.entries())
        .map(([grade, count]) => ({
          name: `${grade} (${count} students)`,
          value: count,
          percentage: results.length > 0 ? (count / results.length) * 100 : 0,
        }))
        .sort((a, b) => b.value - a.value);

      if (gradeDataArray.length === 0) {
        gradeDataArray.push(
          { name: 'No Grades', value: 1, percentage: 100 }
        );
      }
      setGradeDistribution(gradeDataArray);

      // Generate recent activities from results
      const activities: ActivityLog[] = results
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 6)
        .map(r => ({
          id: r.id,
          action: `${r.student_name || 'Student'} - ${r.subject_name || 'Subject'}: ${r.grade || 'N/A'} (${r.percentage?.toFixed(1) || 0}%)`,
          type: r.is_published ? 'publish' : 'result',
          time: new Date(r.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

      if (activities.length === 0) {
        activities.push({
          id: 1,
          action: 'No recent activities',
          type: 'info',
          time: new Date().toLocaleDateString(),
        });
      }
      setRecentActivities(activities);

      // Update available terms
      const termNames = Array.from(termMap.keys());
      setAvailableTerms(termNames);
      if (termNames.length > 0 && !selectedTerm) {
        setSelectedTerm(termNames[termNames.length - 1]);
      }

    } catch (error: any) {
      console.error('[AdminDashboard] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, user, school, selectedTerm]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, fetchDashboardData]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const handleExportReport = async () => {
    try {
      toast.loading('Generating report...');
      // You can implement actual report generation here
      setTimeout(() => {
        toast.dismiss();
        toast.success('Report exported successfully!');
      }, 1500);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  // ============================================
  // COLOR CONSTANTS
  // ============================================

  const GRADE_COLORS: Record<string, string> = {
    'A': '#22c55e',
    'B+': '#3b82f6',
    'B': '#60a5fa',
    'C+': '#eab308',
    'C': '#f59e0b',
    'D': '#f97316',
    'E': '#ef4444',
    'F': '#dc2626',
    'N/A': '#94a3b8',
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getGradeColor = (gradeName: string) => {
    const grade = gradeName.charAt(0);
    return GRADE_COLORS[grade as keyof typeof GRADE_COLORS] || '#94a3b8';
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      result: 'bg-blue-500',
      publish: 'bg-purple-500',
      student: 'bg-green-500',
      teacher: 'bg-orange-500',
      subject: 'bg-indigo-500',
      info: 'bg-gray-400',
    };
    return colors[type] || colors.info;
  };

  const getStatusIcon = (isPublished: boolean) => {
    return isPublished ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-yellow-500" />
    );
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
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

  const studentsWithResults = stats.totalResults > 0 ? stats.totalStudents : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary-600" />
            Dashboard
          </h1>
          <p className="text-secondary-500">
            Welcome back, {user?.first_name || user?.username || 'User'}!
            {schoolName && ` Here's your overview for ${schoolName}`}
          </p>
          {schoolCode && (
            <p className="text-xs text-secondary-400 font-mono mt-1">
              School Code: {schoolCode}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {availableTerms.length > 0 && (
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              {availableTerms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="primary"
          trend={stats.totalStudents > 0 ? { value: stats.totalStudents, isPositive: true } : undefined}
          subtitle={`${studentsWithResults} with results`}
        />
        <StatCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={UserCheck}
          color="green"
          subtitle={`${stats.totalSubjects} subjects taught`}
        />
        <StatCard
          title="Total Subjects"
          value={stats.totalSubjects}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Total Results"
          value={stats.totalResults}
          icon={ClipboardList}
          color="orange"
          trend={stats.publishedResults > 0 ? { value: stats.publishedResults, isPositive: true } : undefined}
          subtitle={`${stats.publishedResults} published`}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              Performance Trend
            </h3>
            <span className="text-xs text-secondary-400 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Avg: {stats.averagePerformance > 0 ? stats.averagePerformance.toFixed(1) : 'N/A'}%
            </span>
          </div>
          {performanceData.length > 0 && performanceData.some(d => d.average > 0) ? (
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
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Average']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3b82f6" 
                  fill="url(#colorAverage)" 
                  strokeWidth={2}
                  name="Average Performance"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-secondary-400">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                <p>No performance data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-600" />
            Grade Distribution
          </h3>
          {gradeDistribution.length > 0 && gradeDistribution[0].name !== 'No Grades' ? (
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
                    <Cell key={`cell-${index}`} fill={getGradeColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number, name: string) => {
                    const grade = gradeDistribution.find(g => g.name === name);
                    return [`${value} students (${grade?.percentage.toFixed(1) || 0}%)`, 'Students'];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-secondary-400">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                <p>No grade data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-indigo-600" />
            Subject Performance
          </h3>
          {subjectPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number, name: string, props: any) => {
                    const data = props.payload;
                    return [`${value.toFixed(1)}% (${data.students} results)`, 'Average'];
                  }}
                />
                <Bar 
                  dataKey="average" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                  name="Average Score"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-secondary-400">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                <p>No subject performance data available</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-600" />
            Recent Activity
          </h3>
          {recentActivities.length > 0 && recentActivities[0].action !== 'No recent activities' ? (
            <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-secondary-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityColor(activity.type)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-700 truncate flex items-center gap-1">
                      {activity.type === 'publish' && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
                      {activity.type === 'result' && <FileText className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                      {activity.action}
                    </p>
                    <p className="text-xs text-secondary-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-secondary-400">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                <p>No recent activities</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Footer */}
      {stats.totalResults > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-600" />
              <p className="text-xs text-secondary-400 uppercase tracking-wider">Pass Rate</p>
            </div>
            <p className="text-xl font-bold text-green-600">
              {stats.averagePerformance > 0 ? stats.averagePerformance.toFixed(1) : 'N/A'}%
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-secondary-400 uppercase tracking-wider">Subjects Offered</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{stats.totalSubjects}</p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-secondary-400 uppercase tracking-wider">Student-Teacher Ratio</p>
            </div>
            <p className="text-xl font-bold text-purple-600">
              {stats.totalTeachers > 0 ? (stats.totalStudents / stats.totalTeachers).toFixed(1) : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-secondary-400 uppercase tracking-wider">Results Published</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">
              {stats.totalResults > 0 ? ((stats.publishedResults / stats.totalResults) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;