import React, { useState, useEffect, useCallback } from 'react';

import { 
  Search, Download, Printer, BookOpen, Award, TrendingUp, BarChart3,
  School, Hash, Loader2, AlertCircle, RefreshCw, 
  ArrowRight, User, FileText, CheckCircle,
  ChevronLeft, ChevronRight,
  X, Filter, Clock, Star, Medal, GraduationCap
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
  guardian_email?: string;
  school_code?: string;
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
  grade_description?: string;
  school_code?: string;
  school_name?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  school?: number;
  published_by?: number;
}

interface Term {
  id: number;
  name: string;
  code: string;
  academic_year: string;
  semester: string;
  is_current: boolean;
  start_date?: string;
  end_date?: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Result[];
}

// ============================================
// GRADE COLOR HELPER
// ============================================

const getGradeColor = (grade: string): string => {
  const colors: Record<string, string> = {
    'A': 'bg-green-100 text-green-700 border-green-200',
    'B+': 'bg-blue-100 text-blue-700 border-blue-200',
    'B': 'bg-blue-50 text-blue-600 border-blue-100',
    'C+': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'C': 'bg-yellow-50 text-yellow-600 border-yellow-100',
    'D': 'bg-orange-100 text-orange-700 border-orange-200',
    'E': 'bg-red-50 text-red-600 border-red-100',
    'F': 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[grade] || 'bg-gray-100 text-gray-500 border-gray-100';
};

const getGradeBackground = (grade: string): string => {
  const colors: Record<string, string> = {
    'A': 'bg-gradient-to-r from-green-50 to-green-100',
    'B+': 'bg-gradient-to-r from-blue-50 to-blue-100',
    'B': 'bg-gradient-to-r from-blue-50 to-blue-100',
    'C+': 'bg-gradient-to-r from-yellow-50 to-yellow-100',
    'C': 'bg-gradient-to-r from-yellow-50 to-yellow-100',
    'D': 'bg-gradient-to-r from-orange-50 to-orange-100',
    'E': 'bg-gradient-to-r from-red-50 to-red-100',
    'F': 'bg-gradient-to-r from-red-100 to-red-200',
  };
  return colors[grade] || 'bg-gray-50';
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
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [studentOptions, setStudentOptions] = useState<{id: number, name: string, admission: string}[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
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

  // Find worst subject
  const worstSubject = publishedResults.length > 0
    ? publishedResults.reduce((worst, current) => 
        (current.percentage || 0) < (worst.percentage || 0) ? current : worst
      )
    : null;

  // Get subject options for filter
  const subjectOptions = subjects.map(s => ({ id: s.id, name: s.name }));

  // Get overall grade
  const getOverallGrade = (avg: number): string => {
    if (avg >= 90) return 'A';
    if (avg >= 80) return 'B+';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C+';
    if (avg >= 50) return 'C';
    if (avg >= 40) return 'D';
    if (avg >= 30) return 'E';
    return 'F';
  };

  const overallGrade = getOverallGrade(average);

  // ============================================
  // FETCH ALL RESULTS WITH PAGINATION HANDLING
  // ============================================

  const fetchAllResultsForStudent = useCallback(async (studentId: number, schoolCode: string) => {
    setIsLoading(true);
    setAllResults([]);
    setNextPageUrl(null);
    setHasMoreResults(false);
    
    try {
      let allFetchedResults: Result[] = [];
      let nextUrl: string | null = `/report/?school_code=${schoolCode}&student=${studentId}&page_size=100`;
      
      // Fetch all pages
      while (nextUrl) {
        console.log('[ResultView] Fetching results page:', nextUrl);
        
        const response = await schoolApi.get(nextUrl);
        console.log('[ResultView] Results page response:', response.data);
        
        let resultData: Result[] = [];
        let paginationInfo: PaginatedResponse | null = null;
        
        if (response.data.results) {
          paginationInfo = response.data;
          resultData = response.data.results;
          nextUrl = response.data.next;
        } else if (Array.isArray(response.data)) {
          resultData = response.data;
          nextUrl = null;
        } else if (response.data.data) {
          resultData = response.data.data;
          nextUrl = response.data.next || null;
        } else {
          nextUrl = null;
        }
        
        if (resultData.length > 0) {
          // Add subject names and term names to results
          const resultsWithNames = resultData.map(r => {
            const subject = subjects.find(s => s.id === r.subject);
            const term = terms.find(t => t.id === r.term);
            return {
              ...r,
              subject_name: r.subject_name || subject?.name || 'Unknown',
              term_name: r.term_name || term?.name || 'Unknown',
              grade_description: r.grade_description || '',
              school_code: r.school_code || schoolCode,
              school_name: r.school_name || currentSchoolInfo?.name || '',
            };
          });
          
          allFetchedResults = [...allFetchedResults, ...resultsWithNames];
        }
        
        // If no nextUrl, break
        if (!nextUrl) break;
      }
      
      // Sort results: by term (newest first), then by subject name
      const sortedResults = allFetchedResults.sort((a, b) => {
        // First sort by term (newest first)
        if (a.term !== b.term) {
          return (b.term || 0) - (a.term || 0);
        }
        // Then by subject name
        return (a.subject_name || '').localeCompare(b.subject_name || '');
      });
      
      console.log('[ResultView] Total results fetched:', sortedResults.length);
      setAllResults(sortedResults);
      setFilteredResults(sortedResults);
      
      toast.success(`Loaded ${sortedResults.length} results`);
      
    } catch (error: any) {
      console.error('[ResultView] Error fetching results:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  }, [subjects, terms, currentSchoolInfo]);

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
      
      // Fetch students
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
      
      // Set student options for dropdown
      const options = studentDataList.map(s => ({
        id: s.id,
        name: s.full_name || `${s.first_name} ${s.last_name}`,
        admission: s.admission_number
      }));
      setStudentOptions(options);
      
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
        setSelectedStudentId(currentStudent.id);
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
        await fetchAllResultsForStudent(currentStudent.id, schoolCode);
      }
      
    } catch (error: any) {
      console.error('[ResultView] Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch results');
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [userEmail, userSchoolId, fetchAllResultsForStudent]);

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
  }, [userEmail, fetchStudentData]);

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
        r.student_name?.toLowerCase().includes(term) ||
        r.exam_type?.toLowerCase().includes(term) ||
        r.grade_description?.toLowerCase().includes(term)
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
    setStudentOptions([]);
    setSelectedStudentId(null);
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
    setShowFilters(false);
    setNextPageUrl(null);
    setHasMoreResults(false);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code && selectedStudentId) {
      fetchAllResultsForStudent(selectedStudentId, currentSchoolInfo.code);
    } else if (currentSchoolInfo?.code) {
      fetchStudentData(currentSchoolInfo.code);
    }
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  const handleStudentChange = (studentId: number) => {
    setSelectedStudentId(studentId);
    const student = studentOptions.find(s => s.id === studentId);
    if (student) {
      const studentDataObj = {
        id: student.id,
        first_name: student.name.split(' ')[0] || '',
        last_name: student.name.split(' ').slice(1).join(' ') || '',
        full_name: student.name,
        admission_number: student.admission,
        student_class: ''
      };
      setStudentData(studentDataObj);
    }
    if (currentSchoolInfo?.code) {
      fetchAllResultsForStudent(studentId, currentSchoolInfo.code);
    }
  };

  const handleExportCSV = async () => {
    if (filteredResults.length === 0) {
      toast.error('No results available to export');
      return;
    }

    setIsExporting(true);
    try {
      // Create CSV data
      const headers = ['Subject', 'Term', 'Marks', 'Total', 'Percentage', 'Grade', 'Points', 'Status', 'Exam Type', 'Remarks'];
      const rows = filteredResults.map(r => [
        r.subject_name || 'Unknown',
        r.term_name || 'Unknown',
        r.marks_obtained,
        r.total_marks,
        r.percentage?.toFixed(1) + '%' || 'N/A',
        r.grade || 'N/A',
        r.grade_point?.toFixed(1) || '0.0',
        r.is_published ? 'Published' : 'Draft',
        r.exam_type || 'final',
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTerm(null);
    setSelectedSubject(null);
    setSelectedStatus('all');
  };

  const hasActiveFilters = searchTerm || selectedTerm || selectedSubject || selectedStatus !== 'all';

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
          {hasActiveFilters ? 'No results match your filters.' : 'No results available for this student.'}
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Clear Filters
          </button>
        )}
        {studentData && (
          <p className="text-xs text-secondary-400 mt-2">
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
              <span className="text-sm font-medium text-secondary-900">
                {studentData.full_name || studentData.first_name}
              </span>
              <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded">
                {studentData.admission_number}
              </span>
              <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded">
                {studentData.student_class}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {currentSchoolInfo && (
            <>
              {/* Student selector if multiple students */}
              {studentOptions.length > 1 && (
                <select
                  value={selectedStudentId || ''}
                  onChange={(e) => handleStudentChange(parseInt(e.target.value))}
                  className="px-3 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white max-w-[200px]"
                >
                  {studentOptions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.admission})
                    </option>
                  ))}
                </select>
              )}
              
              <button 
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                {filteredResults.length !== allResults.length ? `${filteredResults.length} of ${allResults.length}` : 'All'}
              </span>
            )}
          </button>
          <button 
            onClick={() => toast('Print feature coming soon', { icon: '🖨️' })}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleExportCSV}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-600 uppercase tracking-wider font-medium">Overall Average</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : average.toFixed(1)}%
                  </p>
                  <p className="text-xs text-primary-600 mt-0.5">Based on {publishedResults.length} results</p>
                </div>
                <div className="p-3 bg-primary-200 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 uppercase tracking-wider font-medium">Best Subject</p>
                  <p className="text-lg font-bold text-secondary-900 truncate">
                    {isLoading ? '...' : bestSubject?.subject_name || 'N/A'}
                  </p>
                  {bestSubject && (
                    <p className="text-xs text-green-700 font-medium mt-0.5">{bestSubject.percentage?.toFixed(1)}% ({bestSubject.grade})</p>
                  )}
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 uppercase tracking-wider font-medium">Published Results</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : publishedResults.length}
                  </p>
                  <p className="text-xs text-purple-600">Out of {allResults.length} total</p>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className={`${getGradeBackground(overallGrade)} rounded-xl border p-4 border-opacity-30`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-600 uppercase tracking-wider font-medium">Overall Grade</p>
                  <p className="text-2xl font-bold text-secondary-900 mt-1">
                    {isLoading ? '...' : overallGrade}
                  </p>
                  <p className="text-xs text-secondary-600 font-medium mt-0.5">
                    {average >= 70 ? '🌟 Good standing' : average >= 50 ? '📘 Average' : '📚 Needs improvement'}
                  </p>
                </div>
                <div className="p-3 bg-white bg-opacity-50 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-secondary-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            FILTERS
            ========================================== */}
        {currentSchoolInfo && showFilters && (
          <div className="p-4 border-b border-secondary-200 bg-secondary-50">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search by subject, grade, remarks..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
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
                }}
                className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white min-w-[150px]"
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
                }}
                className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white min-w-[150px]"
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
                }}
                className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white min-w-[130px]"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3 py-2 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            RESULTS TABLE - ALL RESULTS
            ========================================== */}
        <div className="overflow-x-auto">
          {isLoading ? (
            renderLoadingState()
          ) : filteredResults.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {/* Results Summary */}
              <div className="px-4 py-2 border-b border-secondary-200 bg-secondary-50/50 flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs text-secondary-500">
                  Showing <strong className="text-secondary-700">{filteredResults.length}</strong> results
                  {filteredResults.length !== allResults.length && (
                    <span className="text-secondary-400"> (filtered from {allResults.length})</span>
                  )}
                </span>
                <span className="text-xs text-secondary-400 flex items-center gap-3">
                  <span>{filteredResults.filter(r => r.is_published).length} published</span>
                  <span>•</span>
                  <span>{filteredResults.filter(r => !r.is_published).length} draft</span>
                </span>
              </div>
              
              <table className="w-full">
                <thead className="bg-secondary-50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subject</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Term</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Marks</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Percentage</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Points</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {filteredResults.map((result, index) => {
                    return (
                      <tr key={result.id} className={`hover:bg-secondary-50 transition-colors ${result.is_published ? '' : 'opacity-75'}`}>
                        <td className="py-3 px-4 text-sm text-secondary-400">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-secondary-900">
                              {result.subject_name || 'Unknown'}
                            </span>
                            {result.grade_description && (
                              <span className="text-xs text-secondary-400 ml-1">
                                ({result.grade_description})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-secondary-400" />
                            {result.term_name || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600">
                          {result.marks_obtained}/{result.total_marks}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-secondary-700">
                          {result.percentage?.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getGradeColor(result.grade)}`}>
                            {result.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-600">
                          {result.grade_point?.toFixed(1) || '0.0'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.is_published 
                              ? 'bg-green-50 text-green-600 border border-green-200' 
                              : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                          }`}>
                            {result.is_published ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Published
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Draft
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-500 max-w-[200px] truncate">
                          {result.teacher_remarks || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Bottom Summary */}
              <div className="px-4 py-3 border-t border-secondary-200 bg-secondary-50/50 flex justify-between items-center flex-wrap gap-2">
                <span className="text-xs text-secondary-500">
                  Showing all {filteredResults.length} results
                </span>
                <div className="flex items-center gap-3 text-xs text-secondary-400 flex-wrap">
                  <span>Total Subjects: {subjects.length}</span>
                  <span>•</span>
                  <span>Terms: {terms.length}</span>
                  <span>•</span>
                  <span>Average: {average.toFixed(1)}%</span>
                  <span>•</span>
                  <span>Grade: {overallGrade}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultView;