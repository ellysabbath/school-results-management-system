import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Mail, Phone, Download, 
  Loader2, User, AlertCircle,
  ChevronLeft, ChevronRight, Filter, Building2, Award,
  Calendar, BookOpen, School, X, Hash,
  RefreshCw, ArrowRight
} from 'lucide-react';
import { teacherService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import TeacherModal from '../../components/modals/TeacherModal';

// ============================================
// INTERFACES
// ============================================

interface Teacher {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  designation: string;
  qualification: string;
  joining_date: string;
  phone: string;
  subjects: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  school: number;
  school_code?: string;
  full_name?: string;
  user?: number | null;
}

interface ApiResponse {
  status: string;
  total_schools: number;
  total_teachers: number;
  data: {
    school_code: string;
    school_name: string;
    school_id: number;
    count: number;
    teachers: Teacher[];
  }[];
}

// ============================================
// COMPONENT
// ============================================

const TeacherList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school } = useAuth();
  
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  
  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
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

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ============================================
  // DERIVED VALUES
  // ============================================

  
  const userSchoolId = school?.id || (user?.school_id ? parseInt(user.school_id) : null);
  const userEmail = user?.email || '';

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
      console.log('[TeacherList] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[TeacherList] My school response:', response);
      
      const results = response.results || response;
      
      if (results && results.length > 0) {
        const schoolData = results[0];
        const schoolCode = schoolData.school_code;
        
        if (schoolCode) {
          setSearchSchoolCode(schoolCode);
          await fetchTeachersBySchoolCode(schoolCode);
          toast.success(`Loaded teachers from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[TeacherList] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH TEACHERS BY SCHOOL CODE
  // ============================================

  const fetchTeachersBySchoolCode = useCallback(async (schoolCode: string) => {
    // Validate input
    if (!schoolCode || schoolCode.trim() === '') {
      toast.error('Please enter a school code');
      return;
    }

    // Validate format - should be 5 characters alphanumeric
    const cleanCode = schoolCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(cleanCode)) {
      toast.error('School code must be 5 characters (letters and numbers only)');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      console.log('[TeacherList] Fetching teachers for school code:', cleanCode);
      
      const response: ApiResponse = await teacherService.getTeachersGroupedBySchool(cleanCode);
      
      console.log('[TeacherList] API Response:', response);

      if (response?.status === 'success' && response.data && response.data.length > 0) {
        const schoolData = response.data[0];
        
        setCurrentSchoolInfo({
          code: schoolData.school_code,
          name: schoolData.school_name,
          id: schoolData.school_id
        });

        const teacherData = schoolData.teachers || [];
        
        const teachersWithCode = teacherData.map(t => ({
          ...t,
          school_code: schoolData.school_code
        }));
        
        setTeachers(teachersWithCode);
        setFilteredTeachers(teachersWithCode);
        setTotalTeachers(teachersWithCode.length);
        setTotalPages(Math.ceil(teachersWithCode.length / itemsPerPage));
        
        const depts = [...new Set(teachersWithCode.map(t => t.department).filter(Boolean))];
        setDepartments(depts);
        
        if (teachersWithCode.length === 0) {
          toast.error(`No teachers found in ${schoolData.school_name}`);
          setSearchError(`No teachers found in ${schoolData.school_name}`);
        } else {
          toast.success(`Found ${teachersWithCode.length} teacher(s) from ${schoolData.school_name}`);
          setSearchError(null);
        }
        
      } else if (response?.status === 'success' && response.data && response.data.length === 0) {
        const errorMsg = `School with code "${cleanCode}" has no teachers`;
        setSearchError(errorMsg);
        toast.error(errorMsg);
        resetState();
      } else {
        const errorMsg = `School with code "${cleanCode}" not found`;
        setSearchError(errorMsg);
        toast.error(errorMsg);
        resetState();
      }
      
    } catch (error: any) {
      console.error('[TeacherList] Error fetching teachers:', error);
      
      let errorMsg = 'Failed to fetch teachers';
      
      if (error.response?.status === 404) {
        errorMsg = `School with code "${cleanCode}" not found`;
      } else if (error.response?.status === 400) {
        errorMsg = 'Invalid school code format';
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
        navigate('/login');
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
  }, [navigate]);

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
  // HELPER FUNCTIONS
  // ============================================

  const resetState = () => {
    setTeachers([]);
    setFilteredTeachers([]);
    setTotalTeachers(0);
    setTotalPages(1);
    setDepartments([]);
    setCurrentSchoolInfo(null);
    setCurrentPage(1);
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    fetchTeachersBySchoolCode(searchSchoolCode);
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    resetState();
    setHasSearched(false);
    setSearchTerm('');
    setSelectedDepartment('all');
    setSearchError(null);
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      setSearchError(null);
      fetchTeachersBySchoolCode(currentSchoolInfo.code);
    }
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  // ============================================
  // MODAL HANDLERS - OPEN WITHOUT SCHOOL CODE
  // ============================================

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setIsAddModalOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTeacher) return;
    
    setIsDeleting(true);
    try {
      await teacherService.deleteTeacher(selectedTeacher.id);
      toast.success(`Teacher "${selectedTeacher.first_name} ${selectedTeacher.last_name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedTeacher(null);
      if (currentSchoolInfo?.code) {
        fetchTeachersBySchoolCode(currentSchoolInfo.code);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    if (currentSchoolInfo?.code) {
      fetchTeachersBySchoolCode(currentSchoolInfo.code);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getInitials = (firstName: string, lastName: string): string => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    return 'T';
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================
  // FILTERS
  // ============================================

  useEffect(() => {
    let filtered = [...teachers];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.first_name?.toLowerCase().includes(term) ||
        t.last_name?.toLowerCase().includes(term) ||
        t.email?.toLowerCase().includes(term) ||
        t.department?.toLowerCase().includes(term) ||
        t.employee_id?.toLowerCase().includes(term)
      );
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(t => t.department === selectedDepartment);
    }
    
    setFilteredTeachers(filtered);
  }, [searchTerm, selectedDepartment, teachers]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-2 text-secondary-500">Loading teachers...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-12">
          <School className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1">
            Enter a valid school code above to view its teachers
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
              onClick={handleAddTeacher}
              className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
            >
              <Plus className="w-4 h-4" />
              Add Teacher
            </button>
          </div>
        </div>
      );
    }

    if (!currentSchoolInfo && hasSearched) {
      return (
        <div className="text-center py-12">
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
      <div className="text-center py-12">
        <User className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-secondary-900">
          {searchTerm ? 'No teachers match your search' : `No teachers found in ${currentSchoolInfo?.name}`}
        </h3>
        <p className="text-secondary-500 mt-1">
          {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first teacher'}
        </p>
        <button
          onClick={handleAddTeacher}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Add Teacher
        </button>
      </div>
    );
  };

  const renderTeacherCard = (teacher: Teacher) => (
    <div key={teacher.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-purple-700 font-medium text-lg">
            {getInitials(teacher.first_name, teacher.last_name)}
          </div>
          <div>
            <h4 className="font-medium text-secondary-900">
              {teacher.first_name} {teacher.last_name}
            </h4>
            <p className="text-sm text-secondary-500">{teacher.department}</p>
            <p className="text-xs text-secondary-400">{teacher.designation || 'Teacher'}</p>
            <p className="text-xs text-primary-600 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              {currentSchoolInfo?.code || teacher.school_code || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => handleEditTeacher(teacher)}
            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
            title="Edit Teacher"
          >
            <Edit className="w-4 h-4 text-secondary-400" />
          </button>
          <button
            onClick={() => handleDeleteTeacher(teacher)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Teacher"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Mail className="w-3.5 h-3.5 text-secondary-400" />
          <span className="truncate">{teacher.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Phone className="w-3.5 h-3.5 text-secondary-400" />
          <span>{teacher.phone || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Building2 className="w-3.5 h-3.5 text-secondary-400" />
          <span>ID: {teacher.employee_id}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Calendar className="w-3.5 h-3.5 text-secondary-400" />
          <span>Joined: {formatDate(teacher.joining_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Award className="w-3.5 h-3.5 text-secondary-400" />
          <span>{teacher.qualification || 'No qualification'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <span className="text-secondary-400">Status:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            teacher.is_active 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {teacher.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {teacher.subjects && teacher.subjects.length > 0 ? (
            teacher.subjects.map((subject, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5" />
                {subject}
              </span>
            ))
          ) : (
            <span className="text-xs text-secondary-400">No subjects assigned</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderPagination = () => (
    <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
      <p className="text-sm text-secondary-500">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
        {Math.min(currentPage * itemsPerPage, totalTeachers)} of {totalTeachers} teachers
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
          <p className="text-secondary-500">You need to be logged in to view teachers</p>
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
            <User className="w-6 h-6 text-primary-600" />
            Teachers
          </h1>
          <p className="text-secondary-500">Search teachers by school code</p>
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
            onClick={() => toast.success('Export feature coming soon')}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleAddTeacher}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* ==========================================
          STATS CARDS
          ========================================== */}
      {totalTeachers > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Teachers</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">
              {isLoading ? '...' : totalTeachers}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {isLoading ? '...' : teachers.filter(t => t.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Departments</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {isLoading ? '...' : departments.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {isLoading ? '...' : teachers.filter(t => !t.is_active).length}
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

        {/* Search and Filters - Only show if school exists and no error */}
        {currentSchoolInfo && !searchError && (
          <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search teachers by name, email, department..."
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
            <div className="relative min-w-[150px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-8 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            {(searchTerm || selectedDepartment !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDepartment('all');
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
            TEACHER LIST CONTENT
            ========================================== */}
        <div className="p-4">
          {isLoading ? (
            renderLoadingState()
          ) : filteredTeachers.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map(renderTeacherCard)}
            </div>
          )}
        </div>

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {!isLoading && filteredTeachers.length > 0 && renderPagination()}
      </div>

      {/* ==========================================
          MODALS
          ========================================== */}
      <TeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="add"
        schoolId={currentSchoolInfo?.id || userSchoolId || undefined}
      />

      <TeacherModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        teacher={selectedTeacher}
        mode="edit"
        schoolId={currentSchoolInfo?.id || userSchoolId || undefined}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTeacher(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Teacher"
        message={`Are you sure you want to delete "${selectedTeacher?.first_name} ${selectedTeacher?.last_name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TeacherList;