import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, ClipboardList, Clock, TrendingUp, Award, 
  Calendar, CheckCircle, School, Hash, Loader2,
  AlertCircle, RefreshCw, ArrowRight, User, BarChart,
  Plus,
  Search,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentService, subjectService, resultService, schoolService } from '../../api/schoolApi';
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
  school_code?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  student_class: string;
  teacher_name?: string;
  teacher: number | null;
  school: number;
}

interface Result {
  id: number;
  student: number;
  subject: number;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  is_published: boolean;
  student_name?: string;
  subject_name?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // School States
  const [searchSchoolCode, setSearchSchoolCode] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<{
    code: string;
    name: string;
    id: number;
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Performance Data
  const [classPerformance, setClassPerformance] = useState<{name: string; score: number}[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<{subject: string; class: string; time: string; status: string}[]>([]);

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userEmail = user?.email || '';
  const userId = user?.id || null;

  // Calculate stats
  const totalStudents = students.length;
  const totalSubjects = teacherSubjects.length;
  const pendingResults = results.filter(r => !r.is_published).length;
  const publishedResults = results.filter(r => r.is_published).length;

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
      console.log('[TeacherDashboard] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[TeacherDashboard] My school response:', response);
      
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
          await fetchDashboardData(schoolCode);
          toast.success(`Loaded data from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[TeacherDashboard] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH DASHBOARD DATA
  // ============================================

  const fetchDashboardData = useCallback(async (schoolCode: string) => {
    if (!schoolCode) {
      toast.error('School code is required');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[TeacherDashboard] Fetching data for school code:', schoolCode);
      
      // Fetch students
      const studentsResponse = await studentService.getStudentsBySchoolCode(schoolCode);
      console.log('[TeacherDashboard] Students response:', studentsResponse);
      
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
      console.log('[TeacherDashboard] Subjects response:', subjectsResponse);
      
      let subjectData: Subject[] = [];
      if (subjectsResponse.results) {
        subjectData = subjectsResponse.results;
      } else if (Array.isArray(subjectsResponse)) {
        subjectData = subjectsResponse;
      }
      
      // Filter subjects for this teacher (if teacher is assigned)
      let teacherSubjectData: Subject[] = [];
      if (userId) {
        teacherSubjectData = subjectData.filter(s => s.teacher === userId);
      } else {
        // If no teacher ID, show first 3 subjects
        teacherSubjectData = subjectData.slice(0, 3);
      }
      setTeacherSubjects(teacherSubjectData);
      
      // Fetch results
      const resultsResponse = await resultService.getResults({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[TeacherDashboard] Results response:', resultsResponse);
      
      let resultData: Result[] = [];
      if (resultsResponse.results) {
        resultData = resultsResponse.results;
      } else if (Array.isArray(resultsResponse)) {
        resultData = resultsResponse;
      } else if (resultsResponse.data) {
        resultData = resultsResponse.data;
      }
      setResults(resultData);
      
      // Generate class performance data
      const performanceData = studentData.slice(0, 8).map(student => {
        // Get average score for this student
        const studentResults = resultData.filter(r => r.student === student.id);
        const avgScore = studentResults.length > 0
          ? studentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / studentResults.length
          : 0;
        return {
          name: student.full_name || `${student.first_name} ${student.last_name}`,
          score: Math.round(avgScore)
        };
      });
      setClassPerformance(performanceData);
      
      // Generate today's schedule from teacher's subjects
      const scheduleData = teacherSubjectData.slice(0, 3).map((subject, index) => {
        const times = ['9:00 AM - 10:00 AM', '11:00 AM - 12:00 PM', '2:00 PM - 3:00 PM'];
        const statuses = ['Ongoing', 'Upcoming', 'Upcoming'];
        return {
          subject: subject.name,
          class: subject.student_class || 'Class',
          time: times[index] || 'TBD',
          status: statuses[index] || 'Upcoming'
        };
      });
      setTodaySchedule(scheduleData);
      
      toast.success(`Loaded ${studentData.length} students and ${subjectData.length} subjects`);
      
    } catch (error: any) {
      console.error('[TeacherDashboard] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [userId]);

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
    setTeacherSubjects([]);
    setResults([]);
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchError(null);
    setClassPerformance([]);
    setTodaySchedule([]);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      fetchDashboardData(currentSchoolInfo.code);
    }
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  const handleEnterResults = () => {
    navigate('/results');
  };

  const handleViewStudents = () => {
    navigate('/students');
  };

  const handleViewSubjects = () => {
    navigate('/subjects');
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading dashboard...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view dashboard
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
        <BarChart className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">No Data Available</h3>
        <p className="text-secondary-500 mt-1">
          No students or subjects found for this school.
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
          <p className="text-secondary-500">You need to be logged in to view the dashboard</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading your dashboard...</span>
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
            <User className="w-6 h-6 text-primary-600" />
            Teacher Dashboard
          </h1>
          <p className="text-secondary-500">
            Welcome back, {user?.first_name || 'Teacher'}! Here's your teaching overview.
          </p>
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
          <button
            onClick={handleEnterResults}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            Enter Results
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
            STATS CARDS
            ========================================== */}
        {currentSchoolInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <div className="bg-white rounded-lg border border-secondary-200 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewStudents}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">My Students</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : totalStudents}
                  </p>
                </div>
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewSubjects}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">My Subjects</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : totalSubjects}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Pending Results</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {isLoading ? '...' : pendingResults}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Published Results</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {isLoading ? '...' : publishedResults}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            DASHBOARD CONTENT
            ========================================== */}
        {isLoading ? (
          renderLoadingState()
        ) : !currentSchoolInfo ? (
          renderEmptyState()
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 pt-0">
            {/* Class Performance */}
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-secondary-900">Class Performance</h3>
                <span className="text-sm text-secondary-500">
                  {teacherSubjects.length > 0 ? teacherSubjects[0]?.name || 'Subjects' : 'All Subjects'}
                </span>
              </div>
              {classPerformance.length === 0 ? (
                <div className="text-center py-8 text-secondary-400">
                  <BarChart className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                  <p className="text-sm">No performance data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classPerformance.map((student, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-xs font-medium text-secondary-600">
                        {student.name[0]}
                      </div>
                      <span className="flex-1 text-sm text-secondary-700 truncate">{student.name}</span>
                      <div className="flex-1 max-w-[200px]">
                        <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              student.score >= 80 ? 'bg-green-500' :
                              student.score >= 60 ? 'bg-blue-500' :
                              student.score >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(student.score, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-secondary-700 min-w-[40px] text-right">
                        {student.score}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {classPerformance.length > 0 && (
                <div className="mt-4 pt-3 border-t border-secondary-200">
                  <div className="flex justify-between text-xs text-secondary-400">
                    <span>Average: {Math.round(classPerformance.reduce((sum, s) => sum + s.score, 0) / classPerformance.length)}%</span>
                    <span>Highest: {Math.max(...classPerformance.map(s => s.score))}%</span>
                    <span>Lowest: {Math.min(...classPerformance.map(s => s.score))}%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Today's Schedule */}
              <div className="bg-white rounded-xl border border-secondary-200 p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">Today's Schedule</h3>
                {todaySchedule.length === 0 ? (
                  <div className="text-center py-6 text-secondary-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                    <p className="text-sm">No classes scheduled today</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaySchedule.map((item, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          item.status === 'Ongoing' 
                            ? 'bg-primary-50 border-primary-200' 
                            : 'bg-secondary-50 border-secondary-200'
                        }`}
                      >
                        <Clock className={`w-4 h-4 ${item.status === 'Ongoing' ? 'text-primary-600' : 'text-secondary-400'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary-900">{item.class} - {item.subject}</p>
                          <p className="text-xs text-secondary-500">{item.time}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'Ongoing' 
                            ? 'bg-primary-200 text-primary-700' 
                            : 'bg-secondary-200 text-secondary-700'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-secondary-200 p-6">
                <h3 className="font-semibold text-secondary-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleEnterResults}
                    className="p-3 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium text-primary-700"
                  >
                    <ClipboardList className="w-4 h-4 mx-auto mb-1" />
                    Enter Results
                  </button>
                  <button 
                    onClick={handleViewStudents}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium text-green-700"
                  >
                    <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                    View Students
                  </button>
                  <button 
                    onClick={handleViewSubjects}
                    className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium text-purple-700"
                  >
                    <Award className="w-4 h-4 mx-auto mb-1" />
                    My Subjects
                  </button>
                  <button className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium text-yellow-700">
                    <Calendar className="w-4 h-4 mx-auto mb-1" />
                    View Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;