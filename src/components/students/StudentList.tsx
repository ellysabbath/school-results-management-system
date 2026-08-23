import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Download, Filter, 
  ChevronLeft, ChevronRight, User, Mail, Phone, 
  Loader2, Building2,
  School, Hash, Shield, RefreshCw, X,
  ChevronDown, ChevronUp, Users
} from 'lucide-react';
import { studentService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import StudentModal from '../../components/modals/StudentModal';

// ============================================
// INTERFACES
// ============================================

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: string;
  student_class: string;
  section: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  enrollment_date: string;
  is_active: boolean;
  school: number;
  school_code?: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

interface GroupedSchool {
  school_code: string;
  school_name: string;
  school_id: number;
  count: number;
  students: Student[];
}

interface SchoolData {
  id: number;
  name: string;
  email: string;
  school_code: string;
}

interface FilterState {
  search: string;
  class: string;
  schoolCode: string;
}

// ============================================
// MAIN COMPONENT
// ============================================

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school } = useAuth();

  // ============================================
  // STATE
  // ============================================
  
  // Data states
  const [groupedStudents, setGroupedStudents] = useState<GroupedSchool[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    class: 'all',
    schoolCode: 'all'
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const itemsPerPage = 10;
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ============================================
  // USER INFO - FIXED: Using only properties that exist on User
  // ============================================
  
  const userRole = useMemo(() => user?.role || '', [user]);
  
  // Get school code from user or school context
  const userSchoolCode = useMemo(() => {
    // Try to get from school context first (set by AuthProvider)
    if (school?.school_code) {
      return school.school_code;
    }
    // Try from user's school_id (could be the school code)
    if (user?.school_id) {
      return user.school_id;
    }
    return null;
  }, [user, school]);
  
  const userSchoolId = useMemo(() => {
    if (school?.id) {
      return school.id;
    }
    if (user?.school_id) {
      return parseInt(user.school_id) || null;
    }
    return null;
  }, [user, school]);

  // ============================================
  // DERIVED DATA
  // ============================================
  
  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || 
           filters.class !== 'all' || 
           (userRole === 'super_admin' && filters.schoolCode !== 'all');
  }, [filters, userRole]);

  // ============================================
  // EFFECTS
  // ============================================
  
  // Load schools for Super Admin
  useEffect(() => {
    if (userRole === 'super_admin') {
      loadSchools();
    }
  }, [userRole]);

  // Auto-expand all schools when data loads
  useEffect(() => {
    if (groupedStudents.length > 0) {
      const allCodes = new Set(groupedStudents.map(g => g.school_code));
      setExpandedSchools(allCodes);
    }
  }, [groupedStudents]);

  // Fetch students when filters or pagination change
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
    }
  }, [filters.search, filters.class, filters.schoolCode, currentPage, isAuthenticated]);

  // ============================================
  // API CALLS
  // ============================================
  
  const loadSchools = async () => {
    setIsLoadingSchools(true);
    try {
      const response = await schoolService.getSchools({ page_size: 100 });
      const schoolData = response.results || response;
      setSchools(schoolData);
    } catch (error) {
      console.error('Failed to load schools:', error);
      toast.error('Failed to load schools');
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const fetchStudents = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsSearching(false);

    try {
      // ============================================
      // USE THE /by-school/ ENDPOINT
      // ============================================
      
      const params: any = {};

      // Apply school code filter
      if (userRole === 'super_admin') {
        // Super Admin: filter by selected school code
        if (filters.schoolCode && filters.schoolCode !== 'all') {
          params.school_code = filters.schoolCode;
          console.log('[StudentList] Super Admin filtering by school_code:', filters.schoolCode);
        }
      } else {
        // Regular/School Admin: filter by user's school code
        if (userSchoolCode) {
          params.school_code = userSchoolCode;
          console.log('[StudentList] Filtering by user school_code:', userSchoolCode);
        } else {
          console.warn('[StudentList] No school_code found for user');
        }
      }

      console.log('[StudentList] Fetching grouped students with params:', params);

      // Use the grouped by school endpoint
      const response = await studentService.getStudentsGroupedBySchool(
        Object.keys(params).length > 0 ? params : undefined
      );
      
      console.log('[StudentList] Grouped response:', response);

      if (response.status === 'success') {
        const groupedData = response.data || [];
        setGroupedStudents(groupedData);
        
        // Extract all students from grouped data
        const allStudents: Student[] = [];
        groupedData.forEach((group: GroupedSchool) => {
          allStudents.push(...group.students);
        });
        setStudents(allStudents);
        setTotalStudents(response.total_students || allStudents.length);
        setTotalPages(Math.ceil((response.total_students || allStudents.length) / itemsPerPage));
        
        // Extract unique classes
        const classList = [...new Set(allStudents.map((s: Student) => s.student_class))];
        setClasses(classList);
      } else {
        setGroupedStudents([]);
        setStudents([]);
        setTotalStudents(0);
        setTotalPages(1);
        setClasses([]);
      }
    } catch (error: any) {
      console.error('[StudentList] Error fetching students:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch students');
      setGroupedStudents([]);
      setStudents([]);
      setTotalStudents(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  
  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleClassChange = (value: string) => {
    setFilters(prev => ({ ...prev, class: value }));
    setCurrentPage(1);
  };

  const handleSchoolCodeChange = (value: string) => {
    setFilters(prev => ({ ...prev, schoolCode: value }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      class: 'all',
      schoolCode: 'all'
    });
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents();
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setIsAddModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedStudent) return;
    
    setIsDeleting(true);
    try {
      await studentService.deleteStudent(selectedStudent.id);
      toast.success(`Student "${selectedStudent.first_name} ${selectedStudent.last_name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    fetchStudents();
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const refreshData = () => {
    fetchStudents();
  };

  const toggleSchoolExpand = (schoolCode: string) => {
    const newExpanded = new Set(expandedSchools);
    if (newExpanded.has(schoolCode)) {
      newExpanded.delete(schoolCode);
    } else {
      newExpanded.add(schoolCode);
    }
    setExpandedSchools(newExpanded);
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  const getInitials = (firstName: string, lastName: string): string => {
    if (!firstName && !lastName) return 'S';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  // ============================================
  // RENDER: Loading State
  // ============================================
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view students</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Main Component
  // ============================================
  
  return (
    <div className="space-y-6">
      {/* ==========================================
          SCHOOL CODE BANNER
          ========================================== */}
      {userSchoolCode && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/20 p-4 md:p-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-dark/70 text-xs font-medium uppercase tracking-wider">
                  {userRole === 'super_admin' ? 'Current School Code' : 'Your School Code'}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-dark font-mono tracking-wider">
                    {userSchoolCode}
                  </span>
                  {userRole !== 'super_admin' && (
                    <span className="px-2 py-0.5 bg-white/20 text-dark text-xs rounded-md">
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                <span>{school?.name || 'Your School'}</span>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/30 text-green-900">
                {userRole === 'super_admin' ? 'Super Admin' : 'School Admin'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          HEADER
          ========================================== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Students
          </h1>
          <p className="text-secondary-500 text-sm flex items-center gap-2 flex-wrap">
            <span>Manage all students</span>
            {userRole === 'super_admin' && (
              <span className="text-xs text-secondary-400 bg-secondary-100 px-2 py-0.5 rounded">
                Super Admin - All Schools
              </span>
            )}
            {userSchoolCode && userRole !== 'super_admin' && (
              <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded flex items-center gap-1">
                <Shield className="w-3 h-3" />
                School Code: {userSchoolCode}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => toast('Export feature coming soon', { icon: '📥' })}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleAddStudent}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm shadow-sm shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* ==========================================
          STATS CARDS
          ========================================== */}
      {totalStudents > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">
              {isLoading ? '...' : totalStudents}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {isLoading ? '...' : students.filter(s => s.is_active).length}
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
              {isLoading ? '...' : students.filter(s => !s.is_active).length}
            </p>
          </div>
        </div>
      )}

      {/* ==========================================
          SEARCH AND FILTERS
          ========================================== */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-secondary-200">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="text"
                placeholder="Search by name, admission, email, guardian..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap text-sm font-medium"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            {filters.search && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="px-4 py-2.5 text-secondary-600 hover:text-secondary-800 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-1 text-sm"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </form>

          <div className="mt-3 flex flex-wrap gap-3 items-center">
            {/* Class Filter */}
            <div className="relative min-w-[150px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
              <select
                value={filters.class}
                onChange={(e) => handleClassChange(e.target.value)}
                className="pl-10 pr-8 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
              >
                <option value="all">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* School Code Filter - Only for Super Admin */}
            {userRole === 'super_admin' && schools.length > 0 && (
              <div className="relative min-w-[180px]">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
                <select
                  value={filters.schoolCode}
                  onChange={(e) => handleSchoolCodeChange(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm appearance-none bg-white"
                  disabled={isLoadingSchools}
                >
                  <option value="all">All Schools</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.school_code}>
                      {school.name} ({school.school_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-2 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear All Filters
              </button>
            )}

            {/* Search Status */}
            {isSearching && (
              <span className="text-xs text-blue-600 flex items-center gap-1 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Searching...
              </span>
            )}
          </div>
        </div>

        {/* ==========================================
            STUDENT LIST - GROUPED BY SCHOOL
            ========================================== */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <span className="ml-3 text-secondary-500">Loading students...</span>
            </div>
          ) : groupedStudents.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-secondary-300" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900">
                {filters.search ? 'No students match your search' : 'No students found'}
              </h3>
              <p className="text-secondary-500 mt-1 text-sm">
                {filters.search 
                  ? 'Try adjusting your search terms or clear filters' 
                  : 'Get started by adding your first student'}
              </p>
              {(hasActiveFilters || filters.search) && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 px-4 py-2 text-primary-600 hover:text-primary-700 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors text-sm"
                >
                  Clear All Filters
                </button>
              )}
              <button
                onClick={handleAddStudent}
                className="mt-3 ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Add Student
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedStudents.map((group) => (
                <div key={group.school_code} className="border border-secondary-200 rounded-xl overflow-hidden">
                  {/* School Header - Clickable to expand/collapse */}
                  <div 
                    className="flex items-center justify-between p-4 bg-secondary-50 hover:bg-secondary-100 cursor-pointer transition-colors"
                    onClick={() => toggleSchoolExpand(group.school_code)}
                  >
                    <div className="flex items-center gap-3">
                      <School className="w-5 h-5 text-primary-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-secondary-900">
                            {group.school_name || group.school_code}
                          </h3>
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-mono rounded">
                            {group.school_code}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-500">
                          {group.count} student{group.count !== 1 ? 's' : ''}
                          {group.school_id && ` • School ID: ${group.school_id}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {expandedSchools.has(group.school_code) ? (
                        <ChevronUp className="w-5 h-5 text-secondary-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-secondary-400" />
                      )}
                    </div>
                  </div>

                  {/* Student Cards - Expandable */}
                  {expandedSchools.has(group.school_code) && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.students.map((student) => (
                        <div key={student.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 font-medium text-lg">
                                {getInitials(student.first_name, student.last_name)}
                              </div>
                              <div>
                                <h4 className="font-medium text-secondary-900">
                                  {student.full_name || `${student.first_name} ${student.last_name}`}
                                </h4>
                                <p className="text-sm text-secondary-500">{student.student_class}</p>
                                <p className="text-xs text-secondary-400 flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  {group.school_code}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditStudent(student)}
                                className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                                title="Edit Student"
                              >
                                <Edit className="w-4 h-4 text-secondary-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Student"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-secondary-600">
                              <Mail className="w-3.5 h-3.5 text-secondary-400" />
                              <span className="truncate">{student.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary-600">
                              <Phone className="w-3.5 h-3.5 text-secondary-400" />
                              <span>{student.guardian_phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary-600">
                              <User className="w-3.5 h-3.5 text-secondary-400" />
                              <span>Guardian: {student.guardian_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-secondary-600">
                              <span className="text-secondary-400">Status:</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(student.is_active)}`}>
                                {student.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            {student.admission_number && (
                              <div className="flex items-center gap-2 text-sm text-secondary-600">
                                <span className="text-secondary-400">Admission:</span>
                                <span className="font-mono text-xs">{student.admission_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {!isLoading && students.length > 0 && (
          <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-secondary-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalStudents)} of {totalStudents} students
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
          MODALS - REMOVED schoolCode prop since it doesn't exist on StudentModal
          ========================================== */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="add"
        schoolId={userRole === 'super_admin' ? undefined : Number(userSchoolId)}
      />

      <StudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        student={selectedStudent}
        mode="edit"
        schoolId={userRole === 'super_admin' ? undefined : Number(userSchoolId)}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStudent(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Student"
        message={`Are you sure you want to delete "${selectedStudent?.first_name} ${selectedStudent?.last_name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StudentList;