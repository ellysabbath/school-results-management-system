import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, TrendingUp, Award, Calendar, Download,
  ArrowUp, ArrowDown, BookOpen, Users, UserCheck,
  Clock, Star, Target, Brain, Zap, School,
  PieChart, Activity, Globe, Filter, Eye,
  CheckCircle, XCircle, AlertCircle, RefreshCw,
  Loader2, Hash, ArrowRight, FileText, BarChart,
  Search,
  X,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
import { 
  resultService, 
  studentService, 
  subjectService, 
  teacherService, 
  schoolService, 
  termService 
} from '../../api/schoolApi';
import toast from 'react-hot-toast';

// ============================================
// INTERFACES
// ============================================

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  admission_number: string;
  student_class: string;
  email?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  student_class: string;
  teacher_name?: string;
  teacher: number | null;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  department: string;
  subjects: string[];
}

interface Result {
  id: number;
  student: number;
  subject: number;
  term: number;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  grade_point: number;
  exam_type: string;
  teacher_remarks: string;
  is_published: boolean;
  student_name?: string;
  subject_name?: string;
  term_name?: string;
}

interface Term {
  id: number;
  name: string;
  academic_year: string;
  is_current: boolean;
}

// ============================================
// GRADE COLOR HELPER
// ============================================

const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A': 'bg-green-100 text-green-700',
    'B+': 'bg-blue-100 text-blue-700',
    'B': 'bg-blue-50 text-blue-600',
    'C+': 'bg-yellow-100 text-yellow-700',
    'C': 'bg-yellow-50 text-yellow-600',
    'D': 'bg-orange-100 text-orange-700',
    'E': 'bg-red-50 text-red-600',
    'F': 'bg-red-100 text-red-700',
  };
  return colors[grade] || 'bg-gray-100 text-gray-500';
};

const getStatusColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 65) return 'text-blue-600';
  if (percentage >= 50) return 'text-yellow-600';
  if (percentage >= 40) return 'text-orange-600';
  return 'text-red-600';
};

const COLORS = ['#22c55e', '#60a5fa', '#f59e0b', '#fb923c', '#ef4444'];

// ============================================
// MAIN COMPONENT
// ============================================

const CommonAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school } = useAuth();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter States
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'overview' | 'subjects' | 'students' | 'teachers'>('overview');
  
  // School Search States
  const [searchSchoolCode, setSearchSchoolCode] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<{
    code: string;
    name: string;
    id: number;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Derived data for charts
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userSchoolCode = school?.school_code || user?.school_id || null;
  const userEmail = user?.email || '';
  const userSchoolId = school?.id || (user?.school_id ? parseInt(user.school_id) : null);

  // Statistics
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalSubjects = subjects.length;
  const publishedResults = results.filter(r => r.is_published);
  const totalResults = publishedResults.length;
  const averageScore = publishedResults.length > 0 
    ? publishedResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / publishedResults.length 
    : 0;
  const passRate = publishedResults.length > 0 
    ? (publishedResults.filter(r => (r.percentage || 0) >= 40).length / publishedResults.length) * 100 
    : 0;

  // Get unique classes
  const classes = ['all', ...new Set(students.map(s => s.student_class).filter(Boolean))];
  const subjectOptions = subjects.map(s => ({ id: s.id, name: s.name }));
  const termOptions = terms;

  // ============================================
  // FETCH MY SCHOOL BY ADMIN EMAIL
  // ============================================

  const fetchMySchoolByAdminEmail = useCallback(async () => {
    if (!userEmail) {
      toast.error('No email found for logged in user');
      return;
    }

    setIsLoadingMySchool(true);
    setSearchError(null);

    try {
      console.log('[CommonAnalytics] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[CommonAnalytics] My school response:', response);
      
      const results = response.results || response;
      
      if (results && results.length > 0) {
        const schoolData = results[0];
        const schoolCode = schoolData.school_code;
        
        if (schoolCode) {
          setSearchSchoolCode(schoolCode);
          setCurrentSchoolInfo({
            code: schoolData.school_code,
            name: schoolData.name,
            id: schoolData.id
          });
          await fetchData(schoolCode);
          toast.success(`Loaded analytics from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[CommonAnalytics] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchData = useCallback(async (schoolCode: string) => {
    if (!schoolCode) {
      toast.error('School code is required');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[CommonAnalytics] Fetching data for school code:', schoolCode);
      
      // Fetch students
      const studentsResponse = await studentService.getStudentsBySchoolCode(schoolCode);
      console.log('[CommonAnalytics] Students response:', studentsResponse);
      
      let studentData: Student[] = [];
      if (studentsResponse.status === 'success' && studentsResponse.data) {
        const groupedData = studentsResponse.data;
        if (groupedData.length > 0) {
          studentData = groupedData[0].students || [];
        }
      } else if (Array.isArray(studentsResponse)) {
        studentData = studentsResponse;
      } else if (studentsResponse.results) {
        studentData = studentsResponse.results;
      }
      setStudents(studentData);
      
      // Fetch subjects
      const subjectsResponse = await subjectService.getSubjects({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[CommonAnalytics] Subjects response:', subjectsResponse);
      
      let subjectData: Subject[] = [];
      if (subjectsResponse.results) {
        subjectData = subjectsResponse.results;
      } else if (Array.isArray(subjectsResponse)) {
        subjectData = subjectsResponse;
      }
      setSubjects(subjectData);
      
      // Fetch teachers
      const teachersResponse = await teacherService.getTeachers({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[CommonAnalytics] Teachers response:', teachersResponse);
      
      let teacherData: Teacher[] = [];
      if (teachersResponse.results) {
        teacherData = teachersResponse.results;
      } else if (Array.isArray(teachersResponse)) {
        teacherData = teachersResponse;
      }
      setTeachers(teacherData);
      
      // Fetch terms
      if (userSchoolId) {
        try {
          const termsResponse = await termService.getTermsBySchool(userSchoolId.toString());
          console.log('[CommonAnalytics] Terms response:', termsResponse);
          
          let termData: Term[] = [];
          if (termsResponse.results) {
            termData = termsResponse.results;
          } else if (Array.isArray(termsResponse)) {
            termData = termsResponse;
          }
          setTerms(termData);
          
          // Auto-select current or first term
          const current = termData.find(t => t.is_current);
          if (current) {
            setCurrentTerm(current);
            setSelectedTerm(current.id);
          } else if (termData.length > 0) {
            setCurrentTerm(termData[0]);
            setSelectedTerm(termData[0].id);
          }
        } catch (err) {
          console.log('Could not fetch terms:', err);
        }
      }
      
      // Fetch results
      const resultsResponse = await resultService.getResults({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[CommonAnalytics] Results response:', resultsResponse);
      
      let resultData: Result[] = [];
      if (resultsResponse.results) {
        resultData = resultsResponse.results;
      } else if (Array.isArray(resultsResponse)) {
        resultData = resultsResponse;
      } else if (resultsResponse.data) {
        resultData = resultsResponse.data;
      }
      
      // Add subject names to results
      const resultsWithNames = resultData.map(r => {
        const subject = subjectData.find(s => s.id === r.subject);
        const term = terms.find(t => t.id === r.term);
        return {
          ...r,
          subject_name: subject?.name || 'Unknown',
          term_name: term?.name || 'Unknown',
        };
      });
      
      setResults(resultsWithNames);
      
      // Process data for charts
      processChartData(studentData, subjectData, resultsWithNames, teacherData);
      
      toast.success(`Loaded ${resultsWithNames.length} results`);
      
    } catch (error: any) {
      console.error('[CommonAnalytics] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [userSchoolId]);

  // ============================================
  // PROCESS CHART DATA
  // ============================================

  const processChartData = (
    studentData: Student[],
    subjectData: Subject[],
    resultData: Result[],
    teacherData: Teacher[]
  ) => {
    // Filter by selected term
    const filteredResults = selectedTerm 
      ? resultData.filter(r => r.term === selectedTerm && r.is_published)
      : resultData.filter(r => r.is_published);
    
    // Class Performance
    const classesList = [...new Set(studentData.map(s => s.student_class).filter(Boolean))];
    const classPerf = classesList.map(cls => {
      const studentsInClass = studentData.filter(s => s.student_class === cls);
      const studentIds = studentsInClass.map(s => s.id);
      const classResults = filteredResults.filter(r => studentIds.includes(r.student));
      const avg = classResults.length > 0 
        ? classResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / classResults.length 
        : 0;
      return { class: cls, average: avg, students: studentsInClass.length };
    });
    setClassPerformance(classPerf);
    
    // Grade Distribution
    const gradeDist = [
      { name: 'A (80-100%)', value: filteredResults.filter(r => (r.percentage || 0) >= 80).length },
      { name: 'B (65-79%)', value: filteredResults.filter(r => (r.percentage || 0) >= 65 && (r.percentage || 0) < 80).length },
      { name: 'C (50-64%)', value: filteredResults.filter(r => (r.percentage || 0) >= 50 && (r.percentage || 0) < 65).length },
      { name: 'D (40-49%)', value: filteredResults.filter(r => (r.percentage || 0) >= 40 && (r.percentage || 0) < 50).length },
      { name: 'F (0-39%)', value: filteredResults.filter(r => (r.percentage || 0) < 40).length },
    ];
    setGradeDistribution(gradeDist);
    
    // Subject Performance
    const subjPerf = subjectData.map(sub => {
      const subResults = filteredResults.filter(r => r.subject === sub.id);
      const avg = subResults.length > 0 
        ? subResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / subResults.length 
        : 0;
      return { 
        subject: sub.name, 
        average: avg, 
        students: subResults.length,
        passing: subResults.filter(r => (r.percentage || 0) >= 40).length,
        failing: subResults.filter(r => (r.percentage || 0) < 40).length,
      };
    });
    setSubjectPerformance(subjPerf);
    
    // Top Students
    const top = studentData.map(student => {
      const studentResults = filteredResults.filter(r => r.student === student.id);
      const avg = studentResults.length > 0 
        ? studentResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / studentResults.length 
        : 0;
      return { 
        ...student, 
        average: avg, 
        subjects: studentResults.length 
      };
    }).sort((a, b) => b.average - a.average).slice(0, 5);
    setTopStudents(top);
    
    // Monthly Trend (simulated from data)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trend = months.map((month, idx) => {
      // Simulate trend based on actual data
      const baseValue = averageScore || 65;
      const variation = (idx - 2) * 3;
      return { month, avg: Math.min(100, Math.max(0, baseValue + variation + Math.random() * 5)) };
    });
    setMonthlyTrend(trend);
  };

  // ============================================
  // AUTO-LOAD ON PAGE LOAD
  // ============================================

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      fetchMySchoolByAdminEmail();
    } else {
      setIsInitialLoading(false);
    }
  }, [isAuthenticated, userEmail, fetchMySchoolByAdminEmail]);

  // ============================================
  // UPDATE CHARTS ON FILTER CHANGE
  // ============================================

  useEffect(() => {
    if (students.length > 0 && subjects.length > 0 && results.length > 0) {
      processChartData(students, subjects, results, teachers);
    }
  }, [selectedTerm]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    fetchMySchoolByAdminEmail();
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    setStudents([]);
    setSubjects([]);
    setTeachers([]);
    setResults([]);
    setTerms([]);
    setCurrentTerm(null);
    setSelectedTerm(null);
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchError(null);
    setClassPerformance([]);
    setGradeDistribution([]);
    setSubjectPerformance([]);
    setTopStudents([]);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      fetchData(currentSchoolInfo.code);
    }
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  const handleExportReport = async () => {
    if (results.length === 0) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    try {
      // Create CSV data
      const headers = ['Student', 'Subject', 'Term', 'Marks', 'Total', 'Percentage', 'Grade', 'Status', 'Remarks'];
      const rows = results.map(r => [
        r.student_name || 'Unknown',
        r.subject_name || 'Unknown',
        r.term_name || 'Unknown',
        r.marks_obtained,
        r.total_marks,
        r.percentage?.toFixed(1) + '%' || 'N/A',
        r.grade || 'N/A',
        r.is_published ? 'Published' : 'Draft',
        r.teacher_remarks || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${currentSchoolInfo?.code}_${new Date().toISOString().split('T')[0]}.csv`;
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
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading analytics...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view analytics
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            {userEmail && (
              <button
                onClick={handleMySchool}
                disabled={isLoadingMySchool}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isLoadingMySchool ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Continue with my school
              </button>
            )}
          </div>
        </div>
      );
    }

    if (!currentSchoolInfo && hasSearched) {
      return (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">School Not Found</h3>
          <p className="text-secondary-500 mt-1">
            {searchError || 'No school found with the code you entered.'}
          </p>
          <button
            onClick={handleClearSearch}
            className="mt-4 px-4 py-2 text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="text-center py-16">
        <BarChart3 className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">No Data Available</h3>
        <p className="text-secondary-500 mt-1">
          No data available for this school.
        </p>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view analytics</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading analytics...</span>
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
            <BarChart3 className="w-6 h-6 text-primary-600" />
            School Analytics
          </h1>
          <p className="text-secondary-500">Comprehensive overview of school performance</p>
          {currentSchoolInfo && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <School className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-secondary-700">
                {currentSchoolInfo.name}
              </span>
              <span className="text-xs font-mono bg-primary-50 px-2 py-0.5 rounded text-primary-600 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {currentSchoolInfo.code}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentSchoolInfo && (
            <button 
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          <select
            value={selectedTerm || ''}
            onChange={(e) => {
              setSelectedTerm(e.target.value ? parseInt(e.target.value) : null);
            }}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
          >
            <option value="">Select Term</option>
            {termOptions.map(term => (
              <option key={term.id} value={term.id}>
                {term.name} {term.is_current && '(Current)'}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportReport}
            disabled={isExporting || results.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 shadow-sm shadow-primary-200"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export Report
          </button>
        </div>
      </div>

      {/* ==========================================
          SEARCH BY SCHOOL CODE
          ========================================== */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-secondary-200">
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
                Enter a 5-character school code
              </p>
            </div>
          </div>

          {/* My School Button */}
          {userEmail && !currentSchoolInfo && !isLoading && !isInitialLoading && (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-px flex-1 bg-secondary-200" />
              <button
                onClick={handleMySchool}
                disabled={isLoadingMySchool}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {isLoadingMySchool ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Continue with my school
              </button>
              <div className="h-px flex-1 bg-secondary-200" />
            </div>
          )}

          {/* Current School Info */}
          {currentSchoolInfo && !searchError && (
            <div className="mt-3 bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <School className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">
                    {currentSchoolInfo.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    Code: {currentSchoolInfo.code} • ID: {currentSchoolInfo.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                className="p-1.5 hover:bg-primary-100 rounded-lg transition-colors"
                title="Refresh"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 text-primary-600 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* ==========================================
            VIEW TYPE SELECTOR
            ========================================== */}
        {currentSchoolInfo && (
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-2">
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
        )}

        {/* ==========================================
            STATS CARDS
            ========================================== */}
        {currentSchoolInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Students</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : totalStudents}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Average Score</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : averageScore.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Pass Rate</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : passRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Results</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : totalResults}
                  </p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            FILTERS
            ========================================== */}
        {currentSchoolInfo && (
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-4 items-center">
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
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
            >
              <option value="">All Subjects</option>
              {subjectOptions.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            <span className="text-sm text-secondary-400 ml-auto">
              Showing data for {currentTerm?.name || 'selected term'}
            </span>
          </div>
        )}

        {/* ==========================================
            ANALYTICS CONTENT
            ========================================== */}
        {isLoading ? (
          renderLoadingState()
        ) : !currentSchoolInfo ? (
          renderEmptyState()
        ) : (
          <>
            {/* Overview View */}
            {viewType === 'overview' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 pt-0">
                  <div className="bg-white rounded-xl border border-secondary-200 p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Class Performance Comparison</h3>
                    {classPerformance.length === 0 ? (
                      <div className="text-center py-8 text-secondary-400">
                        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                        <p className="text-sm">No data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <ReBarChart data={classPerformance}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="class" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="average" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average %" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-secondary-200 p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Grade Distribution</h3>
                    {gradeDistribution.every(d => d.value === 0) ? (
                      <div className="text-center py-8 text-secondary-400">
                        <PieChart className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                        <p className="text-sm">No data available</p>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 pt-0">
                  <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Performance Trend</h3>
                    {monthlyTrend.length === 0 ? (
                      <div className="text-center py-8 text-secondary-400">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                        <p className="text-sm">No trend data available</p>
                      </div>
                    ) : (
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
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-secondary-200 p-6">
                    <h3 className="font-semibold text-secondary-900 mb-4">Top 5 Students</h3>
                    {topStudents.length === 0 ? (
                      <div className="text-center py-8 text-secondary-400">
                        <Star className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                        <p className="text-sm">No data available</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topStudents.map((student, idx) => (
                          <div key={student.id} className="flex items-center gap-3 p-2 hover:bg-secondary-50 rounded-lg transition-colors">
                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-xs">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-secondary-900 truncate">
                                {student.full_name || `${student.first_name} ${student.last_name}`}
                              </p>
                              <p className="text-xs text-secondary-400">{student.student_class}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${getStatusColor(student.average)}`}>
                                {student.average.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Subjects View */}
            {viewType === 'subjects' && (
              <div className="bg-white rounded-xl border border-secondary-200 p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">Subject Performance</h3>
                {subjectPerformance.length === 0 ? (
                  <div className="text-center py-8 text-secondary-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                    <p className="text-sm">No subject data available</p>
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* Students View */}
            {viewType === 'students' && (
              <div className="bg-white rounded-xl border border-secondary-200 p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">Student Performance</h3>
                {students.length === 0 ? (
                  <div className="text-center py-8 text-secondary-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                    <p className="text-sm">No student data available</p>
                  </div>
                ) : (
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
                        {students.map((student) => {
                          const studentResults = results.filter(r => 
                            r.student === student.id && r.is_published
                          );
                          const avg = studentResults.length > 0 
                            ? studentResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / studentResults.length 
                            : 0;
                          const grade = avg >= 80 ? 'A' : avg >= 65 ? 'B' : avg >= 50 ? 'C' : avg >= 40 ? 'D' : 'F';
                          
                          return (
                            <tr key={student.id} className="hover:bg-secondary-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-xs">
                                    {student.first_name[0]}{student.last_name[0]}
                                  </div>
                                  <span className="text-sm font-medium text-secondary-900">
                                    {student.full_name || `${student.first_name} ${student.last_name}`}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-sm text-secondary-600">{student.student_class}</td>
                              <td className="py-3 px-4 text-sm text-secondary-600">{studentResults.length}</td>
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
                )}
              </div>
            )}

            {/* Teachers View */}
            {viewType === 'teachers' && (
              <div className="bg-white rounded-xl border border-secondary-200 p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">Teacher Performance</h3>
                {teachers.length === 0 ? (
                  <div className="text-center py-8 text-secondary-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                    <p className="text-sm">No teacher data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teachers.map((teacher) => {
                      const teacherSubjects = subjects.filter(s => s.teacher === teacher.id);
                      const teacherResults = results.filter(r => 
                        teacherSubjects.some(s => s.id === r.subject) && r.is_published
                      );
                      const avg = teacherResults.length > 0 
                        ? teacherResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / teacherResults.length 
                        : 0;
                      
                      return (
                        <div key={teacher.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium">
                              {teacher.first_name[0]}{teacher.last_name[0]}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-secondary-900">{teacher.full_name || `${teacher.first_name} ${teacher.last_name}`}</p>
                              <p className="text-xs text-secondary-400">{teacher.department}</p>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-xs text-secondary-400">Subjects</p>
                              <p className="font-medium">{teacherSubjects.length}</p>
                            </div>
                            <div>
                              <p className="text-xs text-secondary-400">Results</p>
                              <p className="font-medium">{teacherResults.length}</p>
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
                          {teacherSubjects.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-secondary-100">
                              <div className="flex flex-wrap gap-1">
                                {teacherSubjects.map(s => (
                                  <span key={s.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommonAnalytics;