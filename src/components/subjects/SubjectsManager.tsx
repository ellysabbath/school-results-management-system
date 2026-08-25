import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit, Trash2, BookOpen, User, X,
  School, Hash, Loader2, AlertCircle, RefreshCw, 
  Filter, ChevronLeft, ChevronRight, ArrowRight
} from 'lucide-react';
import { subjectService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import SubjectModal from '../../components/modals/SubjectModal';

// ============================================
// INTERFACES
// ============================================

interface Subject {
  id: number;
  code: string;
  name: string;
  description: string;
  max_marks: number;
  passing_marks: number;
  student_class: string;
  is_active: boolean;
  school: number;
  teacher: number | null;
  teacher_name?: string;
  school_code?: string;
  school_name?: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  status: string;
  total_schools: number;
  total_subjects: number;
  data: {
    school_code: string;
    school_name: string;
    school_id: number;
    count: number;
    subjects: Subject[];
  }[];
}

// ============================================
// MAIN COMPONENT
// ============================================

const SubjectManager: React.FC = () => {
  const { user, isAuthenticated, school } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubjects, setTotalSubjects] = useState(0);
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
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userSchoolCode = school?.school_code || user?.school_id || null;
  const userSchoolId = school?.id || (user?.school_id ? parseInt(user.school_id) : null);
  const userEmail = user?.email || '';

  // ============================================
  // FETCH SUBJECTS BY SCHOOL CODE
  // ============================================

  const fetchSubjectsBySchoolCode = useCallback(async (schoolCode: string) => {
    // Validate input
    if (!schoolCode || schoolCode.trim() === '') {
      toast.error('Please enter a school code');
      return;
    }

    // Validate format
    const cleanCode = schoolCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(cleanCode)) {
      toast.error('School code must be 5 characters (letters and numbers only)');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      console.log('[SubjectManager] Fetching subjects for school code:', cleanCode);
      
      const response: ApiResponse = await subjectService.getSubjectsGroupedBySchool(cleanCode);
      
      console.log('[SubjectManager] API Response:', response);

      if (response?.status === 'success' && response.data && response.data.length > 0) {
        const schoolData = response.data[0];
        
        setCurrentSchoolInfo({
          code: schoolData.school_code,
          name: schoolData.school_name,
          id: schoolData.school_id
        });

        const subjectData = schoolData.subjects || [];
        
        const subjectsWithCode = subjectData.map(s => ({
          ...s,
          school_code: schoolData.school_code,
          school_name: schoolData.school_name
        }));
        
        setSubjects(subjectsWithCode);
        setFilteredSubjects(subjectsWithCode);
        setTotalSubjects(subjectsWithCode.length);
        setTotalPages(Math.ceil(subjectsWithCode.length / itemsPerPage));
        
        // Extract unique classes
        const classList = [...new Set(subjectsWithCode.map(s => s.student_class).filter(Boolean))];
        setClasses(classList);
        
        if (subjectsWithCode.length === 0) {
          toast.error(`No subjects found in ${schoolData.school_name}`);
          setSearchError(`No subjects found in ${schoolData.school_name}`);
        } else {
          toast.success(`Found ${subjectsWithCode.length} subject(s) from ${schoolData.school_name}`);
          setSearchError(null);
        }
        
      } else {
        const errorMsg = `School with code "${cleanCode}" not found or has no subjects`;
        setSearchError(errorMsg);
        toast.error(errorMsg);
        resetState();
      }
      
    } catch (error: any) {
      console.error('[SubjectManager] Error fetching subjects:', error);
      
      let errorMsg = 'Failed to fetch subjects';
      
      if (error.response?.status === 404) {
        errorMsg = `School with code "${cleanCode}" not found`;
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      setSearchError(errorMsg);
      toast.error(errorMsg);
      resetState();
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

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
      console.log('[SubjectManager] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[SubjectManager] My school response:', response);
      
      const results = response.results || response;
      
      if (results && results.length > 0) {
        const schoolData = results[0];
        const schoolCode = schoolData.school_code;
        
        if (schoolCode) {
          setSearchSchoolCode(schoolCode);
          await fetchSubjectsBySchoolCode(schoolCode);
          toast.success(`Loaded subjects from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[SubjectManager] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
    }
  }, [userEmail, fetchSubjectsBySchoolCode]);

  // ============================================
  // AUTO-LOAD ON PAGE LOAD
  // ============================================

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      // Try to auto-load my school
      fetchMySchoolByAdminEmail();
    } else {
      setIsInitialLoading(false);
    }
  }, [isAuthenticated, userEmail, fetchMySchoolByAdminEmail]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const resetState = () => {
    setSubjects([]);
    setFilteredSubjects([]);
    setTotalSubjects(0);
    setTotalPages(1);
    setClasses([]);
    setCurrentSchoolInfo(null);
    setCurrentPage(1);
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    fetchSubjectsBySchoolCode(searchSchoolCode);
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    resetState();
    setHasSearched(false);
    setSearchTerm('');
    setSelectedClass('all');
    setSearchError(null);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      setSearchError(null);
      fetchSubjectsBySchoolCode(currentSchoolInfo.code);
    }
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  // ============================================
  // MODAL HANDLERS - OPEN WITHOUT SCHOOL CODE
  // ============================================

  const handleAddSubject = () => {
    // Always open modal, even without school code
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSubject) return;
    
    setIsDeleting(true);
    try {
      await subjectService.deleteSubject(selectedSubject.id);
      toast.success(`Subject "${selectedSubject.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedSubject(null);
      if (currentSchoolInfo?.code) {
        fetchSubjectsBySchoolCode(currentSchoolInfo.code);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    if (currentSchoolInfo?.code) {
      fetchSubjectsBySchoolCode(currentSchoolInfo.code);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ============================================
  // FILTERS
  // ============================================

  useEffect(() => {
    let filtered = [...subjects];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term) ||
        s.teacher_name?.toLowerCase().includes(term) ||
        s.student_class?.toLowerCase().includes(term)
      );
    }
    
    if (selectedClass !== 'all') {
      filtered = filtered.filter(s => s.student_class === selectedClass);
    }
    
    setFilteredSubjects(filtered);
  }, [searchTerm, selectedClass, subjects]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getInitials = (name: string): string => {
    if (!name) return 'S';
    return name.charAt(0).toUpperCase();
  };

  const getStatusBadge = (isActive: boolean): string => {
    return isActive 
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const getStatusText = (isActive: boolean): string => {
    return isActive ? 'Active' : 'Inactive';
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading subjects...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a valid school code above to view its subjects
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
            <button
              onClick={handleAddSubject}
              className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
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
            {searchError || 'No school found with the code you entered. Please try again.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
            <button
              onClick={handleClearSearch}
              className="px-4 py-2 text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Try Again
            </button>
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

    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">
          {searchTerm ? 'No subjects match your search' : `No subjects found in ${currentSchoolInfo?.name}`}
        </h3>
        <p className="text-secondary-500 mt-1">
          {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first subject'}
        </p>
        <button
          onClick={handleAddSubject}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Add Subject
        </button>
      </div>
    );
  };

  const renderSubjectCard = (subject: Subject) => (
    <div key={subject.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-blue-700 font-medium">
            {getInitials(subject.name)}
          </div>
          <div>
            <h4 className="font-medium text-secondary-900">{subject.name}</h4>
            <p className="text-xs text-secondary-400">{subject.code}</p>
            <p className="text-xs text-primary-600 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {currentSchoolInfo?.code || subject.school_code || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleEditSubject(subject)}
            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
            title="Edit Subject"
          >
            <Edit className="w-4 h-4 text-secondary-400" />
          </button>
          <button
            onClick={() => handleDeleteSubject(subject)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Subject"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
      
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <User className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
          <span className="truncate">{subject.teacher_name || 'Not Assigned'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <School className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
          <span>{subject.student_class}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <span className="text-secondary-400">Marks:</span>
          <span>Passing: {subject.passing_marks} / {subject.max_marks}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <span className="text-secondary-400">Status:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(subject.is_active)}`}>
            {getStatusText(subject.is_active)}
          </span>
        </div>
        {subject.description && (
          <div className="flex items-start gap-2 text-sm text-secondary-600">
            <span className="text-secondary-400 flex-shrink-0">Description:</span>
            <span className="text-xs line-clamp-2">{subject.description}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderPagination = () => (
    <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
      <p className="text-sm text-secondary-500">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
        {Math.min(currentPage * itemsPerPage, totalSubjects)} of {totalSubjects} subjects
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
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <User className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view subjects</p>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading your school data...</span>
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
            <BookOpen className="w-6 h-6 text-primary-600" />
            Subjects
          </h1>
          <p className="text-secondary-500">Search subjects by school code</p>
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
              <span className="text-xs text-secondary-400">(ID: {currentSchoolInfo.id})</span>
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
            onClick={handleAddSubject}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>
      </div>

      {/* ==========================================
          STATS CARDS
          ========================================== */}
      {totalSubjects > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Subjects</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">
              {isLoading ? '...' : totalSubjects}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {isLoading ? '...' : subjects.filter(s => s.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Classes</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {isLoading ? '...' : classes.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {isLoading ? '...' : subjects.filter(s => !s.is_active).length}
            </p>
          </div>
        </div>
      )}

      {/* ==========================================
          SEARCH AND FILTERS
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
                Enter a 5-character school code (letters and numbers only)
              </p>
            </div>
          </div>

          {/* My School Button - Below the search */}
          {userEmail && !currentSchoolInfo && !isLoading && (
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

        {/* Search and Filters */}
        {currentSchoolInfo && !searchError && (
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search subjects by name, code, teacher..."
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
            {classes.length > 0 && (
              <div className="relative min-w-[150px]">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-8 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            )}
            {(searchTerm || selectedClass !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClass('all');
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
            SUBJECT LIST CONTENT
            ========================================== */}
        <div className="p-4">
          {isLoading ? (
            renderLoadingState()
          ) : filteredSubjects.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map(renderSubjectCard)}
            </div>
          )}
        </div>

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {!isLoading && filteredSubjects.length > 0 && renderPagination()}
      </div>

      {/* ==========================================
          MODALS
          ========================================== */}
      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubject(null);
        }}
        onSuccess={handleModalSuccess}
        subject={editingSubject}
        mode={editingSubject ? 'edit' : 'add'}
        schoolId={currentSchoolInfo?.id || userSchoolId || undefined}
        schoolCode={currentSchoolInfo?.code || userSchoolCode || undefined}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSubject(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Subject"
        message={`Are you sure you want to delete "${selectedSubject?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SubjectManager;