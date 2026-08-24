import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Download, 
  ChevronLeft, ChevronRight, User, Mail, Phone, 
  Loader2, Building2,
  School, Hash, RefreshCw, X,
  ChevronDown, ChevronUp, Users, AlertCircle,
  ArrowRight
} from 'lucide-react';
import { studentService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';
import StudentModal from '../../components/modals/StudentModal';

// ============================================
// TYPES & INTERFACES
// ============================================

interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  full_name?: string;
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
  avatar: string | null;
  created_at: string;
  updated_at: string;
  user: number | null;
}

interface GroupedSchool {
  school_code: string;
  school_name: string;
  school_id: number;
  count: number;
  students: Student[];
}

interface ApiResponse {
  status: string;
  total_schools: number;
  total_students: number;
  data: GroupedSchool[];
}

// ============================================
// MAIN COMPONENT
// ============================================

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school } = useAuth();

  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Data States
  const [groupedStudents, setGroupedStudents] = useState<GroupedSchool[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [currentSchoolInfo, setCurrentSchoolInfo] = useState<{
    code: string;
    name: string;
    id: number;
  } | null>(null);

  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMySchool, setIsLoadingMySchool] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());

  // Search States
  const [searchSchoolCode, setSearchSchoolCode] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalStudentsCount, setTotalStudentsCount] = useState<number>(0);
  const ITEMS_PER_PAGE = 10;

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ============================================
  // DERIVED VALUES
  // ============================================

  const userSchoolCode = school?.school_code || user?.school_id || null;
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
      console.log('[StudentList] Fetching my school by admin email:', userEmail);
      
      const response = await schoolService.getSchools({
        admin_email: userEmail,
        page_size: 1
      });
      
      console.log('[StudentList] My school response:', response);
      
      const results = response.results || response;
      
      if (results && results.length > 0) {
        const schoolData = results[0];
        const schoolCode = schoolData.school_code;
        
        if (schoolCode) {
          setSearchSchoolCode(schoolCode);
          await fetchStudentsBySchoolCode(schoolCode);
          toast.success(`Loaded students from ${schoolData.name}`);
        } else {
          toast.error('School code not found for your school');
        }
      } else {
        toast.error('No school found for your account. Please contact administrator.');
      }
    } catch (error: any) {
      console.error('[StudentList] Error fetching my school:', error);
      toast.error(error.response?.data?.message || 'Failed to load your school');
    } finally {
      setIsLoadingMySchool(false);
      setIsInitialLoading(false);
    }
  }, [userEmail]);

  // ============================================
  // FETCH STUDENTS BY SCHOOL CODE
  // ============================================

  const fetchStudentsBySchoolCode = useCallback(async (schoolCode: string) => {
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
      const response: ApiResponse = await studentService.getStudentsBySchoolCode(cleanCode);

      console.log('[StudentList] Response:', response);

      if (response?.status === 'success') {
        const groupedData = response.data || [];
        setGroupedStudents(groupedData);

        const students = groupedData.flatMap(group => group.students || []);
        setAllStudents(students);
        setTotalStudentsCount(response.total_students || students.length);
        setTotalPages(Math.ceil((response.total_students || students.length) / ITEMS_PER_PAGE));

        const classes = [...new Set(students.map(s => s.student_class).filter(Boolean))];
        setAvailableClasses(classes);

        const allSchoolCodes = new Set(groupedData.map(g => g.school_code));
        setExpandedSchools(allSchoolCodes);

        if (groupedData.length > 0) {
          const school = groupedData[0];
          setCurrentSchoolInfo({
            code: school.school_code,
            name: school.school_name,
            id: school.school_id
          });
        }

        if (response.total_students === 0) {
          toast.info(`No students found in ${schoolCode}`);
          setSearchError(`No students found in ${schoolCode}`);
        } else {
          toast.success(`Found ${response.total_students} students from ${schoolCode}`);
          setSearchError(null);
        }
      } else {
        setGroupedStudents([]);
        setAllStudents([]);
        setTotalStudentsCount(0);
        setTotalPages(1);
        setAvailableClasses([]);
        setExpandedSchools(new Set());
        setCurrentSchoolInfo(null);
        setSearchError('No students found for this school code');
        toast.error('No students found for this school code');
      }
    } catch (error: any) {
      console.error('[StudentList] Error fetching students:', error);

      let errorMsg = 'Failed to fetch students';
      
      if (error.response?.status === 404) {
        errorMsg = `School with code "${schoolCode}" not found`;
      } else if (error.response?.status === 400) {
        errorMsg = 'Invalid school code format';
      } else if (error.response?.status === 401) {
        errorMsg = 'Session expired. Please login again.';
        navigate('/login');
        return;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      setSearchError(errorMsg);
      toast.error(errorMsg);
      
      setGroupedStudents([]);
      setAllStudents([]);
      setTotalStudentsCount(0);
      setTotalPages(1);
      setAvailableClasses([]);
      setExpandedSchools(new Set());
      setCurrentSchoolInfo(null);
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
  // HANDLERS
  // ============================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    fetchStudentsBySchoolCode(searchSchoolCode);
  };

  const handleClearSearch = () => {
    setSearchSchoolCode('');
    setGroupedStudents([]);
    setAllStudents([]);
    setTotalStudentsCount(0);
    setTotalPages(1);
    setAvailableClasses([]);
    setExpandedSchools(new Set());
    setCurrentSchoolInfo(null);
    setHasSearched(false);
    setSearchError(null);
  };

  const handleMySchool = async () => {
    await fetchMySchoolByAdminEmail();
  };

  const handleRefresh = () => {
    if (currentSchoolInfo?.code) {
      fetchStudentsBySchoolCode(currentSchoolInfo.code);
    }
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================

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
      if (currentSchoolInfo?.code) {
        fetchStudentsBySchoolCode(currentSchoolInfo.code);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    if (currentSchoolInfo?.code) {
      fetchStudentsBySchoolCode(currentSchoolInfo.code);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleSchoolExpand = (schoolCode: string) => {
    setExpandedSchools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(schoolCode)) {
        newSet.delete(schoolCode);
      } else {
        newSet.add(schoolCode);
      }
      return newSet;
    });
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const getInitials = (firstName: string, lastName: string): string => {
    if (!firstName && !lastName) return 'S';
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getStatusBadge = (isActive: boolean): string => {
    return isActive 
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  };

  const getStatusText = (isActive: boolean): string => {
    return isActive ? 'Active' : 'Inactive';
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      <span className="ml-3 text-secondary-500">Loading students...</span>
    </div>
  );

  const renderEmptyState = () => {
    if (!currentSchoolInfo && !hasSearched && !isInitialLoading) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-secondary-300" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900">Search for a School</h3>
          <p className="text-secondary-500 mt-1 text-sm">
            Enter a school code above to view students
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
              onClick={handleAddStudent}
              className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
            >
              <Plus className="w-4 h-4" />
              Add Student
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
          <p className="text-secondary-500 mt-1 text-sm">
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
        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-secondary-300" />
        </div>
        <h3 className="text-lg font-medium text-secondary-900">
          No students found in {currentSchoolInfo?.name}
        </h3>
        <p className="text-secondary-500 mt-1 text-sm">
          Get started by adding your first student
        </p>
        <button
          onClick={handleAddStudent}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Add Student
        </button>
      </div>
    );
  };

  const renderStudentCard = (student: Student, schoolCode: string) => (
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
              {schoolCode}
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
          <Mail className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
          <span className="truncate">{student.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <Phone className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
          <span>{student.guardian_phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <User className="w-3.5 h-3.5 text-secondary-400 flex-shrink-0" />
          <span>Guardian: {student.guardian_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-secondary-600">
          <span className="text-secondary-400">Status:</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(student.is_active)}`}>
            {getStatusText(student.is_active)}
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
  );

  const renderSchoolGroup = (group: GroupedSchool) => (
    <div key={group.school_code} className="border border-secondary-200 rounded-xl overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 bg-secondary-50 hover:bg-secondary-100 cursor-pointer transition-colors"
        onClick={() => toggleSchoolExpand(group.school_code)}
      >
        <div className="flex items-center gap-3">
          <School className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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

      {expandedSchools.has(group.school_code) && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.students.map(student => renderStudentCard(student, group.school_code))}
        </div>
      )}
    </div>
  );

  const renderStudentList = () => (
    <div className="space-y-6">
      {groupedStudents.map(renderSchoolGroup)}
    </div>
  );

  const renderPagination = () => (
    <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
      <p className="text-sm text-secondary-500">
        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
        {Math.min(currentPage * ITEMS_PER_PAGE, totalStudentsCount)} of {totalStudentsCount} students
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
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view students</p>
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
            <Users className="w-6 h-6 text-primary-600" />
            Students
          </h1>
          <p className="text-secondary-500 text-sm flex items-center gap-2 flex-wrap">
            <span>Search students by school code</span>
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
      {totalStudentsCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">
              {isLoading ? '...' : totalStudentsCount}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {isLoading ? '...' : allStudents.filter(s => s.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Classes</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {isLoading ? '...' : availableClasses.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Inactive</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {isLoading ? '...' : allStudents.filter(s => !s.is_active).length}
            </p>
          </div>
        </div>
      )}

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
                Enter a 5-character school code to view its students
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

        {/* ==========================================
            STUDENT LIST CONTENT
            ========================================== */}
        <div className="p-4">
          {isLoading ? (
            renderLoadingState()
          ) : groupedStudents.length === 0 ? (
            renderEmptyState()
          ) : (
            renderStudentList()
          )}
        </div>

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {!isLoading && allStudents.length > 0 && renderPagination()}
      </div>

      {/* ==========================================
          MODALS
          ========================================== */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="add"
        schoolId={currentSchoolInfo?.id}
      />

      <StudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        student={selectedStudent}
        mode="edit"
        schoolId={currentSchoolInfo?.id}
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