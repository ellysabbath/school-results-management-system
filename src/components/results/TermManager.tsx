import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Edit, Trash2, Calendar, Clock, 
  Loader2, User, AlertCircle, RefreshCw, X,
  ChevronLeft, ChevronRight, Filter, Building2,
  School, Hash, CheckCircle, XCircle, Save,
  BookOpen, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { termService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

// ============================================
// INTERFACES
// ============================================

interface Term {
  id: number;
  name: string;
  code: string;
  academic_year: string;
  semester: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  school: number;
  created_at: string;
}

interface SchoolData {
  id: number;
  name: string;
  school_code: string;
  email: string;
  phone: string;
  status: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

const TermManager: React.FC = () => {
  const { user, isAuthenticated, school } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [terms, setTerms] = useState<Term[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<Term[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolData | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSchool, setIsLoadingSchool] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [showOnlyCurrent, setShowOnlyCurrent] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTerms, setTotalTerms] = useState(0);
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
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    academic_year: new Date().getFullYear().toString(),
    semester: 'Semester 1',
    start_date: '',
    end_date: '',
    is_current: false,
    school: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userSchoolCode = school?.school_code || user?.school_id || null;
  const userSchoolId = school?.id || (user?.school_id ? parseInt(user.school_id) : null);
  const userEmail = user?.email || '';

  // Get unique years and semesters for filters
  const years = ['all', ...new Set(terms.map(t => t.academic_year).filter(Boolean))];
  const semesters = ['all', ...new Set(terms.map(t => t.semester).filter(Boolean))];

  // ============================================
  // FETCH SCHOOL BY ADMIN EMAIL
  // ============================================

  const fetchMySchoolByAdminEmail = useCallback(async () => {
    if (!userEmail) {
      toast.error('No email found for logged in user');
      return;
    }

    setIsLoadingSchool(true);
    setSearchError(null);

    try {
      console.log('[TermManager] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[TermManager] My school response:', response);
      
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
          await fetchTerms(schoolData.id);
          toast.success(`Loaded terms from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[TermManager] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingSchool(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH TERMS
  // ============================================

  const fetchTerms = useCallback(async (schoolId?: number) => {
    const targetSchoolId = schoolId || currentSchoolInfo?.id || userSchoolId;
    
    if (!targetSchoolId) {
      toast.error('No school selected');
      return;
    }

    setIsLoading(true);
    try {
      const response = await termService.getTermsBySchool(targetSchoolId.toString());
      console.log('[TermManager] Terms response:', response);
      
      let termData: Term[] = [];
      if (response.results) {
        termData = response.results;
      } else if (Array.isArray(response)) {
        termData = response;
      }
      
      setTerms(termData);
      setFilteredTerms(termData);
      setTotalTerms(termData.length);
      setTotalPages(Math.ceil(termData.length / itemsPerPage));
      
    } catch (error: any) {
      console.error('[TermManager] Error fetching terms:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch terms');
    } finally {
      setIsLoading(false);
    }
  }, [currentSchoolInfo?.id, userSchoolId]);

  // ============================================
  // AUTO-LOAD ON PAGE LOAD
  // ============================================

  useEffect(() => {
    if (isAuthenticated && userEmail) {
      fetchMySchoolByAdminEmail();
    }
  }, [isAuthenticated, userEmail, fetchMySchoolByAdminEmail]);

  // ============================================
  // FILTERS
  // ============================================

  useEffect(() => {
    let filtered = [...terms];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.name?.toLowerCase().includes(term) ||
        t.code?.toLowerCase().includes(term) ||
        t.academic_year?.toLowerCase().includes(term) ||
        t.semester?.toLowerCase().includes(term)
      );
    }
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(t => t.academic_year === selectedYear);
    }
    
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(t => t.semester === selectedSemester);
    }
    
    if (showOnlyCurrent) {
      filtered = filtered.filter(t => t.is_current === true);
    }
    
    setFilteredTerms(filtered);
    setTotalTerms(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);
  }, [searchTerm, selectedYear, selectedSemester, showOnlyCurrent, terms]);

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
    setTerms([]);
    setFilteredTerms([]);
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchTerm('');
    setSelectedYear('all');
    setSelectedSemester('all');
    setShowOnlyCurrent(false);
    setSearchError(null);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.id) {
      fetchTerms(currentSchoolInfo.id);
    }
  };

  // ============================================
  // MODAL HANDLERS
  // ============================================

  const handleAddTerm = () => {
    setEditingTerm(null);
    setFormData({
      name: '',
      code: '',
      academic_year: new Date().getFullYear().toString(),
      semester: 'Semester 1',
      start_date: '',
      end_date: '',
      is_current: false,
      school: currentSchoolInfo?.id || userSchoolId || 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEditTerm = (term: Term) => {
    setEditingTerm(term);
    setFormData({
      name: term.name || '',
      code: term.code || '',
      academic_year: term.academic_year || '',
      semester: term.semester || '',
      start_date: term.start_date || '',
      end_date: term.end_date || '',
      is_current: term.is_current || false,
      school: term.school || currentSchoolInfo?.id || userSchoolId || 0,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDeleteTerm = (term: Term) => {
    setSelectedTerm(term);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTerm) return;
    
    setIsDeleting(true);
    try {
      await termService.deleteTerm(selectedTerm.id);
      toast.success(`Term "${selectedTerm.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedTerm(null);
      if (currentSchoolInfo?.id) {
        fetchTerms(currentSchoolInfo.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete term');
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================
  // FORM HANDLERS
  // ============================================

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Term name is required';
    }
    if (!formData.code.trim()) {
      errors.code = 'Term code is required';
    }
    if (!formData.academic_year.trim()) {
      errors.academic_year = 'Academic year is required';
    }
    if (!formData.semester.trim()) {
      errors.semester = 'Semester is required';
    }
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = 'End date must be after start date';
    }
    if (!formData.school) {
      errors.school = 'School is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);

    try {
      const apiData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        academic_year: formData.academic_year.trim(),
        semester: formData.semester.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_current: formData.is_current,
        school: formData.school,
      };

      if (editingTerm) {
        await termService.updateTerm(editingTerm.id, apiData);
        toast.success('Term updated successfully!');
      } else {
        await termService.createTerm(apiData);
        toast.success('Term created successfully!');
      }

      setIsModalOpen(false);
      setEditingTerm(null);
      if (currentSchoolInfo?.id) {
        fetchTerms(currentSchoolInfo.id);
      }
    } catch (error: any) {
      console.error('Term submission error:', error);
      
      if (error.response?.data) {
        if (error.response.data.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.keys(error.response.data.errors).forEach(key => {
            const messages = error.response.data.errors[key];
            fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages;
          });
          setFormErrors(fieldErrors);
          toast.error('Please fix the field errors');
        } else if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error('Operation failed. Please try again.');
        }
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================
  // GO TO PAGE
  // ============================================

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getPaginatedTerms = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTerms.slice(start, end);
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (isCurrent: boolean): string => {
    return isCurrent 
      ? 'bg-green-100 text-green-700'
      : 'bg-gray-100 text-gray-500';
  };

  const getStatusText = (isCurrent: boolean): string => {
    return isCurrent ? 'Current' : 'Inactive';
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading terms...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched) {
      return (
        <div className="text-center py-16">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a school code above to view its terms
          </p>
          <button
            onClick={handleAddTerm}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Term
          </button>
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
        <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">No Terms Found</h3>
        <p className="text-secondary-500 mt-1">
          No academic terms found for this school. Create your first term.
        </p>
        <button
          onClick={handleAddTerm}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Term
        </button>
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
          <p className="text-secondary-500">You need to be logged in to manage terms</p>
        </div>
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
            <Calendar className="w-6 h-6 text-primary-600" />
            Academic Terms
          </h1>
          <p className="text-secondary-500">Manage academic terms and semesters</p>
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
            onClick={handleAddTerm}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            Add Term
          </button>
        </div>
      </div>

      {/* ==========================================
          STATS CARDS
          ========================================== */}
      {totalTerms > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Terms</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">
              {isLoading ? '...' : totalTerms}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Current</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {isLoading ? '...' : terms.filter(t => t.is_current).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Years</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {isLoading ? '...' : years.filter(y => y !== 'all').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">
              {isLoading ? '...' : terms.filter(t => !t.is_current).length}
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
                Enter a 5-character school code
              </p>
            </div>
          </div>

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

        {/* Filters */}
        {currentSchoolInfo && (
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search terms by name, code, year..."
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
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year === 'all' ? 'All Years' : year}
                </option>
              ))}
            </select>
            
            <select
              value={selectedSemester}
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              {semesters.map(sem => (
                <option key={sem} value={sem}>
                  {sem === 'all' ? 'All Semesters' : sem}
                </option>
              ))}
            </select>
            
            <label className="flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyCurrent}
                onChange={(e) => setShowOnlyCurrent(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              Current Only
            </label>
            
            {(searchTerm || selectedYear !== 'all' || selectedSemester !== 'all' || showOnlyCurrent) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedYear('all');
                  setSelectedSemester('all');
                  setShowOnlyCurrent(false);
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
            TERM LIST
            ========================================== */}
        <div className="p-4">
          {isLoading ? (
            renderLoadingState()
          ) : filteredTerms.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPaginatedTerms().map((term) => (
                <div key={term.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        term.is_current ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Calendar className={`w-5 h-5 ${
                          term.is_current ? 'text-green-600' : 'text-gray-500'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-secondary-900">{term.name}</h4>
                        <p className="text-xs text-secondary-400">{term.code}</p>
                        <p className="text-xs text-secondary-500">{term.academic_year} • {term.semester}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditTerm(term)}
                        className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                        title="Edit Term"
                      >
                        <Edit className="w-4 h-4 text-secondary-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteTerm(term)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Term"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <Calendar className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
                      <span>{formatDate(term.start_date)} - {formatDate(term.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <span className="text-secondary-400">Status:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(term.is_current)}`}>
                        {getStatusText(term.is_current)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <span className="text-secondary-400">Created:</span>
                      <span className="text-xs text-secondary-400">{formatDate(term.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {!isLoading && filteredTerms.length > 0 && (
          <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-secondary-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalTerms)} of {totalTerms} terms
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

      {/* ==========================================
          TERM MODAL
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  {editingTerm ? 'Edit Academic Term' : 'Add Academic Term'}
                </h2>
                <p className="text-sm text-secondary-500">
                  {editingTerm ? 'Update term information' : 'Create a new academic term'}
                </p>
                {currentSchoolInfo && (
                  <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                    <School className="w-3 h-3" />
                    School: {currentSchoolInfo.name} ({currentSchoolInfo.code})
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTerm(null);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Term Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g., Term 1 2026"
                    className={`input-field ${formErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Term Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    placeholder="e.g., T1-2026"
                    className={`input-field uppercase ${formErrors.code ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {formErrors.code && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="academic_year"
                    value={formData.academic_year}
                    onChange={handleFormChange}
                    placeholder="e.g., 2026"
                    className={`input-field ${formErrors.academic_year ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {formErrors.academic_year && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.academic_year}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleFormChange}
                    className={`input-field ${formErrors.semester ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSaving}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                    <option value="Term 4">Term 4</option>
                  </select>
                  {formErrors.semester && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.semester}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleFormChange}
                    className={`input-field ${formErrors.start_date ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {formErrors.start_date && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleFormChange}
                    className={`input-field ${formErrors.end_date ? 'border-red-500 focus:ring-red-500' : ''}`}
                    disabled={isSaving}
                  />
                  {formErrors.end_date && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.end_date}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-secondary-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_current"
                      checked={formData.is_current}
                      onChange={handleFormChange}
                      className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                      disabled={isSaving}
                    />
                    Set as Current Term
                  </label>
                  <p className="text-xs text-secondary-400 mt-1">
                    Only one term can be current at a time. Setting this will automatically unset any other current term.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTerm(null);
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingTerm ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingTerm ? 'Update Term' : 'Add Term'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRM MODAL
          ========================================== */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTerm(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Term"
        message={`Are you sure you want to delete "${selectedTerm?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TermManager;