import React, { useState, useEffect, useCallback } from 'react';

import { 
  Search, Download, Printer, BookOpen, Award, TrendingUp, BarChart3,
  School, Hash, Loader2, AlertCircle, RefreshCw, 
  ArrowRight, User, FileText, CheckCircle,
  ChevronLeft, ChevronRight,
  X
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

const ResultView: React.FC = () => {
  const { user, isAuthenticated, school } = useAuth();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [filteredResults, setFilteredResults] = useState<Result[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;
  
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

  const userEmail = user?.email || '';
  const userSchoolId = school?.id || (user?.school_id ? parseInt(user.school_id) : null);

  // Calculate stats from published results
  const publishedResults = allResults.filter(r => r.is_published);
  const average = publishedResults.length > 0
    ? publishedResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / publishedResults.length
    : 0;

  // Find best subject
  const bestSubject = publishedResults.length > 0
    ? publishedResults.reduce((best, current) => 
        (current.percentage || 0) > (best.percentage || 0) ? current : best
      )
    : null;

  // Get subject options for filter
  const subjectOptions = subjects.map(s => ({ id: s.id, name: s.name }));

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
      console.log('[ResultView] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[ResultView] My school response:', response);
      
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
      console.error('[ResultView] Error fetching my school:', error);
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
      console.log('[ResultView] Fetching data for school code:', schoolCode);
      
      // Fetch students to find the current student
      const studentsResponse = await studentService.getStudentsBySchoolCode(schoolCode);
      console.log('[ResultView] Students response:', studentsResponse);
      
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
        console.log('[ResultView] Current student:', currentStudent);
      } else {
        toast.error('No student found for your account');
      }
      
      // Fetch subjects
      const subjectsResponse = await subjectService.getSubjects({
        school_code: schoolCode,
        page_size: 100
      });
      console.log('[ResultView] Subjects response:', subjectsResponse);
      
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
          console.log('[ResultView] Terms response:', termsResponse);
          
          let termData: Term[] = [];
          if (termsResponse.results) {
            termData = termsResponse.results;
          } else if (Array.isArray(termsResponse)) {
            termData = termsResponse;
          }
          setTerms(termData);
          
          // Auto-select first term
          if (termData.length > 0 && !selectedTerm) {
            const currentTerm = termData.find(t => t.is_current);
            setSelectedTerm(currentTerm ? currentTerm.id : termData[0].id);
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
        console.log('[ResultView] Results response:', resultsResponse);
        
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
        
        setAllResults(resultsWithNames);
        setFilteredResults(resultsWithNames);
        setTotalResults(resultsWithNames.length);
        setTotalPages(Math.ceil(resultsWithNames.length / itemsPerPage));
      }
      
      toast.success(`Loaded ${allResults.length} results`);
      
    } catch (error: any) {
      console.error('[ResultView] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch results');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [userEmail, userSchoolId, terms]);

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
  // FILTER RESULTS
  // ============================================

  useEffect(() => {
    let filtered = [...allResults];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.subject_name?.toLowerCase().includes(term) ||
        r.grade?.toLowerCase().includes(term) ||
        r.teacher_remarks?.toLowerCase().includes(term) ||
        r.student_name?.toLowerCase().includes(term)
      );
    }
    
    if (selectedTerm) {
      filtered = filtered.filter(r => r.term === selectedTerm);
    }
    
    if (selectedSubject) {
      filtered = filtered.filter(r => r.subject === selectedSubject);
    }
    
    if (selectedStatus !== 'all') {
      const isPublished = selectedStatus === 'published';
      filtered = filtered.filter(r => r.is_published === isPublished);
    }
    
    setFilteredResults(filtered);
    setTotalResults(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [searchTerm, selectedTerm, selectedSubject, selectedStatus, allResults]);

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
    setAllResults([]);
    setFilteredResults([]);
    setTerms([]);
    setSelectedTerm(null);
    setSelectedSubject(null);
    setSelectedStatus('all');
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchTerm('');
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

  const handleExportPDF = async () => {
    if (filteredResults.length === 0) {
      toast.error('No results available to export');
      return;
    }

    setIsExporting(true);
    try {
      // Create CSV data
      const headers = ['Subject', 'Marks', 'Total', 'Percentage', 'Grade', 'Points', 'Status', 'Remarks'];
      const rows = filteredResults.map(r => [
        r.subject_name || 'Unknown',
        r.marks_obtained,
        r.total_marks,
        r.percentage?.toFixed(1) + '%' || 'N/A',
        r.grade || 'N/A',
        r.grade_point?.toFixed(1) || '0.0',
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
      a.download = `results_${studentData?.admission_number || 'student'}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Results exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    } finally {
      setIsExporting(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginatedResults = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredResults.slice(start, end);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading results...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view your results
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
          No results available for your account.
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
          <p className="text-secondary-500">You need to be logged in to view results</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading your results...</span>
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
            My Results
          </h1>
          <p className="text-secondary-500">View your academic performance</p>
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
                {studentData.full_name || studentData.first_name}
              </span>
              <span className="text-xs text-secondary-500">
                {studentData.admission_number}
              </span>
              <span className="text-xs text-secondary-500">
                {studentData.student_class}
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
            onClick={() => toast('Print feature coming soon', { icon: '🖨️' })}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting || filteredResults.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export
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
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
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
                  <p className="text-2xl font-bold text-secondary-900 truncate">
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
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : publishedResults.length}
                  </p>
                  <p className="text-xs text-secondary-400">Out of {allResults.length} total</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-secondary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-400 uppercase tracking-wider">Overall Grade</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
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
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            FILTERS
            ========================================== */}
        {currentSchoolInfo && (
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by subject, grade, remarks..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <select
              value={selectedTerm || ''}
              onChange={(e) => {
                setSelectedTerm(e.target.value ? parseInt(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">All Terms</option>
              {terms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.is_current && '(Current)'}
                </option>
              ))}
            </select>
            
            <select
              value={selectedSubject || ''}
              onChange={(e) => {
                setSelectedSubject(e.target.value ? parseInt(e.target.value) : null);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="">All Subjects</option>
              {subjectOptions.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            
            {(searchTerm || selectedTerm || selectedSubject || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTerm(null);
                  setSelectedSubject(null);
                  setSelectedStatus('all');
                }}
                className="px-3 py-2 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* ==========================================
            RESULTS TABLE
            ========================================== */}
        <div className="overflow-x-auto">
          {isLoading ? (
            renderLoadingState()
          ) : filteredResults.length === 0 ? (
            renderEmptyState()
          ) : (
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Marks</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Percentage</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Points</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {getPaginatedResults().map((result, index) => {
                  const globalIndex = ((currentPage - 1) * itemsPerPage) + index + 1;
                  
                  return (
                    <tr key={result.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-secondary-500">
                        {globalIndex}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-secondary-400" />
                          <span className="text-sm font-medium text-secondary-900">
                            {result.subject_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {result.marks_obtained}/{result.total_marks}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-secondary-700">
                        {result.percentage?.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                          {result.grade || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {result.grade_point?.toFixed(1) || '0.0'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          result.is_published 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          {result.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-500">
                        {result.teacher_remarks || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {!isLoading && filteredResults.length > 0 && (
          <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-secondary-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-secondary-400" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-secondary-100 text-secondary-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-secondary-400">...</span>}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-secondary-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultView;