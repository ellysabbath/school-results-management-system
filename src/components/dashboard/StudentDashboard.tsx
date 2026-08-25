import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Award, TrendingUp, Calendar, Clock, Download, 
  CheckCircle, BookOpen, BarChart3, User, School, 
  Hash, Loader2, AlertCircle, RefreshCw, ArrowRight,
  FileText, GraduationCap, Eye, LogOut, Home,
  ChevronRight, Users, Mail, Phone,
  Search,
  X,
  Armchair,
  CircleCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { resultService, studentService, subjectService, schoolService, termService } from '../../api/schoolApi';
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
  email?: string;
  guardian_name?: string;
  guardian_phone?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  student_class: string;
  teacher_name?: string;
}

interface Result {
  id: number;
  student: number;
  subject: number;
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
  created_at: string;
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

// ============================================
// MAIN COMPONENT
// ============================================

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school, logout } = useAuth();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [publishedResults, setPublishedResults] = useState<Result[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  
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

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userSchoolCode = school?.school_code || user?.school_id || null;
  const userEmail = user?.email || '';
  const userSchoolId = school?.id || (user?.school_id ? parseInt(user.school_id) : null);
  const userRole = user?.role || '';
  const userId = user?.id || null;

  // Calculate stats from published results
  const average = publishedResults.length > 0
    ? publishedResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / publishedResults.length
    : 0;

  // Find best subject
  const bestSubject = publishedResults.length > 0
    ? publishedResults.reduce((best, current) => 
        (current.percentage || 0) > (best.percentage || 0) ? current : best
      )
    : null;

  // Get recent results (last 4)
  const recentResults = publishedResults.slice(0, 4);

  // Subject performance for summary
  const subjectPerformance = publishedResults.map(r => ({
    subject: r.subject_name || 'Unknown',
    score: r.percentage || 0,
    grade: r.grade || 'N/A',
  }));

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
      console.log('[StudentDashboard] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[StudentDashboard] My school response:', response);
      
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
          await fetchStudentData(schoolCode);
          toast.success(`Loaded data from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[StudentDashboard] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH STUDENT DATA
  // ============================================

  const fetchStudentData = useCallback(async (schoolCode: string) => {
    if (!schoolCode) {
      toast.error('School code is required');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[StudentDashboard] Fetching data for school code:', schoolCode);
      
      // Fetch students to find the current student
      const studentsResponse = await studentService.getStudentsBySchoolCode(schoolCode);
      console.log('[StudentDashboard] Students response:', studentsResponse);
      
      let studentDataList: Student[] = [];
      if (studentsResponse.status === 'success' && studentsResponse.data) {
        const groupedData = studentsResponse.data;
        if (groupedData.length > 0) {
          studentDataList = groupedData[0].students || [];
        }
      } else if (Array.isArray(studentsResponse)) {
        studentDataList = studentsResponse;
      } else if (studentsResponse.results) {
        studentDataList = studentsResponse.results;
      }
      
      // Find the current student (by email or first student)
      let currentStudent: Student | null = null;
      if (userEmail) {
        currentStudent = studentDataList.find(s => s.email === userEmail) || null;
      }
      if (!currentStudent && studentDataList.length > 0) {
        currentStudent = studentDataList[0];
      }
      
      if (currentStudent) {
        setStudentData(currentStudent);
        console.log('[StudentDashboard] Current student:', currentStudent);
      } else {
        toast.warning('No student found for your account');
      }
      
      // Fetch subjects
      const subjectsResponse = await subjectService.getSubjects({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[StudentDashboard] Subjects response:', subjectsResponse);
      
      let subjectData: Subject[] = [];
      if (subjectsResponse.results) {
        subjectData = subjectsResponse.results;
      } else if (Array.isArray(subjectsResponse)) {
        subjectData = subjectsResponse;
      }
      setSubjects(subjectData);
      
      // Fetch results for the student
      if (currentStudent) {
        const resultsResponse = await resultService.getResults({
          school_code: schoolCode,
          student: currentStudent.id,
          page_size: 100
        });
        console.log('[StudentDashboard] Results response:', resultsResponse);
        
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
          return {
            ...r,
            subject_name: subject?.name || 'Unknown',
          };
        });
        
        setResults(resultsWithNames);
        
        // Filter published results
        const published = resultsWithNames.filter(r => r.is_published);
        setPublishedResults(published);
        
        // Fetch terms
        if (userSchoolId) {
          try {
            const termsResponse = await termService.getTermsBySchool(userSchoolId.toString());
            console.log('[StudentDashboard] Terms response:', termsResponse);
            
            let termData: Term[] = [];
            if (termsResponse.results) {
              termData = termsResponse.results;
            } else if (Array.isArray(termsResponse)) {
              termData = termsResponse;
            }
            setTerms(termData);
            
            // Find current term
            const current = termData.find(t => t.is_current);
            if (current) {
              setCurrentTerm(current);
            } else if (termData.length > 0) {
              setCurrentTerm(termData[0]);
            }
          } catch (err) {
            console.log('Could not fetch terms:', err);
          }
        }
      }
      
      toast.success(`Loaded ${publishedResults.length} results`);
      
    } catch (error: any) {
      console.error('[StudentDashboard] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [userEmail, userSchoolId]);

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
    setStudentData(null);
    setSubjects([]);
    setResults([]);
    setPublishedResults([]);
    setTerms([]);
    setCurrentTerm(null);
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchError(null);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      fetchStudentData(currentSchoolInfo.code);
    }
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  const handleDownloadReport = async () => {
    if (publishedResults.length === 0) {
      toast.error('No published results available to download');
      return;
    }

    try {
      // Create CSV data
      const headers = ['Subject', 'Marks', 'Total', 'Percentage', 'Grade', 'Points', 'Remarks'];
      const rows = publishedResults.map(r => [
        r.subject_name || 'Unknown',
        r.marks_obtained,
        r.total_marks,
        r.percentage?.toFixed(1) + '%' || 'N/A',
        r.grade || 'N/A',
        r.grade_point?.toFixed(1) || '0.0',
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
      a.download = `report_card_${studentData?.admission_number || 'student'}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report card downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report card');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading your data...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view your dashboard
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
        <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">No Results Found</h3>
        <p className="text-secondary-500 mt-1">
          No published results available for your account.
        </p>
        <p className="text-xs text-secondary-400 mt-1">
          {studentData ? `Student: ${studentData.full_name || studentData.first_name}` : ''}
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
          <p className="text-secondary-500">You need to be logged in to view your dashboard</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading your data...</span>
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
          <h1 className="text-2xl font-bold text-secondary-900">
            Welcome back, {studentData?.first_name || user?.first_name || 'Student'}! <CircleCheck className='text-success'/>
          </h1>
          <h1>My Results</h1>
          <p className="text-secondary-500">
            Here's your academic overview
            {currentTerm && ` for ${currentTerm.name}`}
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
          {studentData && (
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-secondary-500">
                Admission: {studentData.admission_number}
              </span>
              <span className="text-xs text-secondary-500">
                Class: {studentData.student_class}
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
            onClick={handleDownloadReport}
            disabled={publishedResults.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 shadow-sm shadow-primary-200"
          >
            <Download className="w-4 h-4" />
            Download Report Card
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
            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Overall Average</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : average.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Best Subject</p>
                  <p className="text-3xl font-bold text-secondary-900 truncate">
                    {isLoading ? '...' : bestSubject?.subject_name || 'N/A'}
                  </p>
                  {bestSubject && (
                    <p className="text-xs text-green-600 mt-1">{bestSubject.percentage?.toFixed(1)}%</p>
                  )}
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Published Results</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : publishedResults.length}
                  </p>
                  <p className="text-xs text-secondary-400">Out of {results.length} subjects</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Grade</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : (() => {
                      const avg = average;
                      if (avg >= 90) return 'A';
                      if (avg >= 80) return 'B+';
                      if (avg >= 70) return 'B';
                      if (avg >= 60) return 'C+';
                      if (avg >= 50) return 'C';
                      if (avg >= 40) return 'D';
                      if (avg >= 30) return 'E';
                      return 'F';
                    })()}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {average >= 70 ? 'Good standing' : average >= 50 ? 'Average' : 'Needs improvement'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-yellow-600" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 pt-0">
            {/* Results Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">
                Your Results {currentTerm && `- ${currentTerm.name}`}
              </h3>
              {publishedResults.length === 0 ? (
                <div className="text-center py-8 text-secondary-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                  <p className="text-sm">No published results available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Subject</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Marks</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Percentage</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Grade</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.map((result) => (
                        <tr key={result.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-secondary-700">
                            {result.subject_name || 'Unknown'}
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-600">
                            {result.marks_obtained}/{result.total_marks}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-secondary-700">
                            {result.percentage?.toFixed(1)}%
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                              {result.grade || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-secondary-500">
                            {result.teacher_remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {publishedResults.length > 4 && (
                    <div className="mt-4 text-center">
                      <button 
                        onClick={() => navigate('/results-management')}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View all {publishedResults.length} results →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl border border-secondary-200 p-6">
              <h3 className="font-semibold text-secondary-900 mb-4">Performance Summary</h3>
              {subjectPerformance.length === 0 ? (
                <div className="text-center py-8 text-secondary-400">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {subjectPerformance.map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-secondary-600 truncate">{item.subject}</span>
                          <span className="font-medium text-secondary-900">{item.score.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              item.score >= 80 ? 'bg-green-500' :
                              item.score >= 60 ? 'bg-blue-500' :
                              item.score >= 40 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(item.score, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-secondary-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary-500">Overall Performance</span>
                      <span className="font-semibold text-secondary-900">{average.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary-200 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${Math.min(average, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-secondary-400 mt-1">
                      <span>Highest: {subjectPerformance.length > 0 ? Math.max(...subjectPerformance.map(s => s.score)).toFixed(1) : '0'}%</span>
                      <span>Lowest: {subjectPerformance.length > 0 ? Math.min(...subjectPerformance.map(s => s.score)).toFixed(1) : '0'}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            NEXT EXAM / ANNOUNCEMENT
            ========================================== */}
        {currentSchoolInfo && (
          <div className="p-4 pt-0">
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-primary-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-secondary-900">Stay Updated</h4>
                  <p className="text-sm text-secondary-600">
                    {publishedResults.length > 0 
                      ? `You have ${publishedResults.length} published results. Keep up the good work!`
                      : 'Check back later for your results.'}
                  </p>
                  {currentTerm && (
                    <p className="text-xs text-primary-600 mt-1">
                      Current Term: {currentTerm.name} ({currentTerm.academic_year})
                    </p>
                  )}
                  {studentData && (
                    <p className="text-xs text-secondary-500 mt-1">
                      {studentData.full_name || studentData.first_name} • {studentData.student_class}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => navigate('/results-management')}
                className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                View All Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;