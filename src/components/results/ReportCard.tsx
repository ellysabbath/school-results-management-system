import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Share2, Calendar, Award, TrendingUp,
  School, Hash, Loader2, AlertCircle, RefreshCw, ArrowRight,
  User, BookOpen, FileText, CheckCircle, XCircle,
  X,
  Search
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
  email?: string;
  school_code?: string;
  date_of_birth?: string;
  guardian_name?: string;
  guardian_phone?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  student_class: string;
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
  created_at: string;
}

interface Term {
  id: number;
  name: string;
  code: string;
  academic_year: string;
  semester: string;
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

const ReportCard: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { user, isAuthenticated, school } = useAuth();

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
  const [isExporting, setIsExporting] = useState(false);
  
  // School Search States
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

  // Calculate stats
  const average = publishedResults.length > 0
    ? publishedResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / publishedResults.length
    : 0;

  const subjectsPassed = publishedResults.filter(r => (r.percentage || 0) >= 40).length;

  // Get overall grade
  const getOverallGrade = (): string => {
    const avg = average;
    if (avg >= 90) return 'A+';
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    if (avg >= 50) return 'D';
    return 'F';
  };

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
      console.log('[ReportCard] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[ReportCard] My school response:', response);
      
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
      console.error('[ReportCard] Error fetching my school:', error);
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
      console.log('[ReportCard] Fetching data for school code:', schoolCode);
      
      // Fetch students
      const studentsResponse = await studentService.getStudentsBySchoolCode(schoolCode);
      console.log('[ReportCard] Students response:', studentsResponse);
      
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
      
      // Find the specific student by ID or first student
      let currentStudent: Student | null = null;
      
      if (studentId) {
        const studentIdNum = parseInt(studentId);
        currentStudent = studentDataList.find(s => s.id === studentIdNum) || null;
      }
      
      if (!currentStudent && studentDataList.length > 0) {
        // If no student found by ID, use the first one or find by email
        if (userEmail) {
          currentStudent = studentDataList.find(s => s.email === userEmail) || null;
        }
        if (!currentStudent) {
          currentStudent = studentDataList[0];
        }
      }
      
      if (currentStudent) {
        setStudentData(currentStudent);
        console.log('[ReportCard] Current student:', currentStudent);
      } else {
        toast.warning('No student found for this ID');
      }
      
      // Fetch subjects
      const subjectsResponse = await subjectService.getSubjects({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[ReportCard] Subjects response:', subjectsResponse);
      
      let subjectData: Subject[] = [];
      if (subjectsResponse.results) {
        subjectData = subjectsResponse.results;
      } else if (Array.isArray(subjectsResponse)) {
        subjectData = subjectsResponse;
      }
      setSubjects(subjectData);
      
      // Fetch terms
      if (userSchoolId) {
        try {
          const termsResponse = await termService.getTermsBySchool(userSchoolId.toString());
          console.log('[ReportCard] Terms response:', termsResponse);
          
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
      
      // Fetch results for the student
      if (currentStudent) {
        const resultsResponse = await resultService.getResults({
          school_code: schoolCode,
          student: currentStudent.id,
          page_size: 100
        });
        console.log('[ReportCard] Results response:', resultsResponse);
        
        let resultData: Result[] = [];
        if (resultsResponse.results) {
          resultData = resultsResponse.results;
        } else if (Array.isArray(resultsResponse)) {
          resultData = resultsResponse;
        } else if (resultsResponse.data) {
          resultData = resultsResponse.data;
        }
        
        // Add subject names and term names to results
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
        
        // Filter published results
        const published = resultsWithNames.filter(r => r.is_published);
        setPublishedResults(published);
      }
      
      toast.success(`Loaded ${publishedResults.length} published results`);
      
    } catch (error: any) {
      console.error('[ReportCard] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [studentId, userEmail, userSchoolId, terms]);

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

  const handleDownloadPDF = async () => {
    if (publishedResults.length === 0) {
      toast.error('No results available to download');
      return;
    }

    setIsExporting(true);
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
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading report card...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view report card
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
          No published results available for this student.
        </p>
        {studentData && (
          <p className="text-xs text-secondary-400 mt-1">
            Student: {studentData.full_name || studentData.first_name}
          </p>
        )}
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
          <p className="text-secondary-500">You need to be logged in to view report card</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading report card...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-primary-600" />
              Report Card
            </h1>
            <p className="text-secondary-500">Academic performance report</p>
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
            onClick={() => toast.info('Share feature coming soon')}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button 
            onClick={() => toast.info('Print feature coming soon')}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting || publishedResults.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm disabled:opacity-50 shadow-sm shadow-primary-200"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download PDF
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
            REPORT CARD
            ========================================== */}
        {isLoading ? (
          renderLoadingState()
        ) : !currentSchoolInfo ? (
          renderEmptyState()
        ) : (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-secondary-200 p-8 max-w-4xl mx-auto shadow-lg">
              {/* Header */}
              <div className="text-center border-b border-secondary-200 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary-900">SchoolManager</h2>
                    <p className="text-sm text-secondary-500">Academic Report Card</p>
                    {currentSchoolInfo && (
                      <p className="text-xs text-secondary-400 mt-1">{currentSchoolInfo.name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondary-400">Academic Year</p>
                    <p className="text-sm font-medium text-secondary-900">
                      {currentTerm?.academic_year || '2026-2027'}
                    </p>
                    <p className="text-xs text-secondary-400 mt-1">School Code</p>
                    <p className="text-xs font-mono text-secondary-600">{currentSchoolInfo.code}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                  <div>
                    <span className="text-secondary-400">Term:</span>
                    <span className="font-medium text-secondary-900 ml-1">
                      {currentTerm?.name || 'Current Term'}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary-400">Date:</span>
                    <span className="font-medium text-secondary-900 ml-1">
                      {formatDate(new Date().toISOString())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="py-6 border-b border-secondary-200">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold">
                    {studentData?.first_name?.[0] || 'S'}{studentData?.last_name?.[0] || 'T'}
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 flex-1">
                    <div>
                      <p className="text-xs text-secondary-400">Student Name</p>
                      <p className="text-sm font-medium text-secondary-900">
                        {studentData?.full_name || `${studentData?.first_name} ${studentData?.last_name}` || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-400">Admission Number</p>
                      <p className="text-sm font-medium text-secondary-900">
                        {studentData?.admission_number || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-400">Class</p>
                      <p className="text-sm font-medium text-secondary-900">
                        {studentData?.student_class || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-400">Guardian</p>
                      <p className="text-sm font-medium text-secondary-900">
                        {studentData?.guardian_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="py-6">
                <h4 className="text-sm font-semibold text-secondary-700 mb-4">Academic Performance</h4>
                {publishedResults.length === 0 ? (
                  <div className="text-center py-8 text-secondary-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-secondary-300" />
                    <p className="text-sm">No published results available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-secondary-50">
                        <tr>
                          <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Subject</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Marks</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Percentage</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Grade</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Points</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {publishedResults.map((result) => (
                          <tr key={result.id}>
                            <td className="py-2 px-3 text-sm font-medium text-secondary-900">
                              {result.subject_name || 'Unknown'}
                            </td>
                            <td className="py-2 px-3 text-sm text-secondary-600">
                              {result.marks_obtained}/{result.total_marks}
                            </td>
                            <td className="py-2 px-3 text-sm font-medium text-secondary-700">
                              {result.percentage?.toFixed(1)}%
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                                {result.grade || 'N/A'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-sm text-secondary-600">
                              {result.grade_point?.toFixed(1) || '0.0'}
                            </td>
                            <td className="py-2 px-3 text-sm text-secondary-500">
                              {result.teacher_remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary */}
              {publishedResults.length > 0 && (
                <div className="pt-6 border-t border-secondary-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-secondary-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-secondary-400">Overall Percentage</p>
                      <p className="text-2xl font-bold text-secondary-900">{average.toFixed(1)}%</p>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-secondary-400">Overall Grade</p>
                      <p className="text-2xl font-bold text-secondary-900">{getOverallGrade()}</p>
                    </div>
                    <div className="bg-secondary-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-secondary-400">Subjects Passed</p>
                      <p className="text-2xl font-bold text-secondary-900">
                        {subjectsPassed}/{publishedResults.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-6 pt-6 border-t border-secondary-200 flex flex-col md:flex-row items-center justify-between text-xs text-secondary-400 gap-2">
                <p>Generated by SchoolManager v2.0</p>
                <div className="flex flex-wrap items-center gap-4">
                  <span>Teacher's Signature: _______________</span>
                  <span>Principal's Signature: _______________</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;