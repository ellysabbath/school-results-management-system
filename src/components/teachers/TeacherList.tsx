import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, Mail, Phone, Download, 
  Loader2, User, AlertCircle, XCircle, CheckCircle,
  ChevronLeft, ChevronRight, Filter, Building2, Award,
  Calendar, BookOpen, School, X, Hash, Shield,
  RefreshCw
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

interface SchoolData {
  id: number;
  name: string;
  email: string;
  admin_name: string;
  admin_email: string;
  school_code?: string;
}

// ============================================
// COMPONENT
// ============================================

const TeacherList: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [departments, setDepartments] = useState<string[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolData | null>(null);
  const [isLoadingSchool, setIsLoadingSchool] = useState(true);
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get user data
  const userRole = user?.role || '';
  const userEmail = user?.email || '';
  const schoolCode = user?.school_id || user?.schoolId || user?.school?.id || null;

  // ============================================
  // LOAD SCHOOL INFO - NO CACHE
  // ============================================

  const loadSchoolInfo = async () => {
    // Only fetch if authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      setIsLoadingSchool(false);
      return;
    }

    setIsLoadingSchool(true);
    try {
      let school = null;

      // Try by school_code first
      if (schoolCode) {
        const response = await schoolService.getSchools({ 
          school_code: schoolCode,
          page_size: 1
        });
        const results = response.results || response;
        if (results && results.length > 0) {
          school = results[0];
        }
      }

      // Try by admin email
      if (!school && userEmail) {
        const response = await schoolService.getSchools({ 
          admin_email: userEmail,
          page_size: 1
        });
        const results = response.results || response;
        if (results && results.length > 0) {
          school = results[0];
        }
      }

      if (school) {
        setSchoolInfo(school);
        await loadTeachers(school.id);
      } else {
        toast.warning('No school found for your account. Please contact administrator.');
        setSchoolInfo(null);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch school info:', error);
      toast.error('Failed to load school information');
      setSchoolInfo(null);
      setIsLoading(false);
    } finally {
      setIsLoadingSchool(false);
    }
  };

  // ============================================
  // LOAD TEACHERS - NO CACHE
  // ============================================

  const loadTeachers = async (schoolId?: number) => {
    const targetSchoolId = schoolId || schoolInfo?.id;
    
    if (!isAuthenticated || !targetSchoolId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: itemsPerPage,
        school: targetSchoolId,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedDepartment !== 'all') params.department = selectedDepartment;

      const response = await teacherService.getTeachers(params);
      
      let teacherData: Teacher[] = [];
      
      if (response.results) {
        teacherData = response.results.filter(t => t.school === targetSchoolId);
      } else if (Array.isArray(response)) {
        teacherData = response.filter(t => t.school === targetSchoolId);
      }
      
      setTeachers(teacherData);
      setFilteredTeachers(teacherData);
      setTotalTeachers(teacherData.length);
      setTotalPages(Math.ceil(teacherData.length / itemsPerPage));
      
      const depts = [...new Set(teacherData.map(t => t.department).filter(Boolean))];
      setDepartments(depts);
      
    } catch (error: any) {
      console.error('Error fetching teachers:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch teachers');
      setTeachers([]);
      setFilteredTeachers([]);
      setTotalTeachers(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  // Load data on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      loadSchoolInfo();
    } else {
      setIsLoading(false);
      setIsLoadingSchool(false);
      setTeachers([]);
      setFilteredTeachers([]);
      setSchoolInfo(null);
    }
  }, [isAuthenticated]);

  // Apply filters when search or department changes
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedDepartment, teachers]);

  // ============================================
  // FILTERS
  // ============================================

  const applyFilters = () => {
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
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = () => {
    if (schoolInfo) {
      loadTeachers(schoolInfo.id);
      toast.success('Data refreshed');
    }
  };

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
      if (schoolInfo) {
        await loadTeachers(schoolInfo.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    if (schoolInfo) {
      loadTeachers(schoolInfo.id);
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
  // RENDER
  // ============================================

  // If not authenticated, show login message
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <User className="w-6 h-6 text-primary-600" />
            Teachers
          </h1>
          <p className="text-secondary-500">
            Manage all teachers in your school
            {userRole === 'super_admin' && (
              <span className="text-xs text-secondary-400 ml-2">(Super Admin)</span>
            )}
            {userRole === 'school_admin' && (
              <span className="text-xs text-primary-600 ml-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                School Admin
              </span>
            )}
          </p>
          {schoolInfo && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <School className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-medium text-secondary-700">
                {schoolInfo.name}
              </span>
              <span className="text-xs font-mono bg-primary-50 px-2 py-0.5 rounded text-primary-600 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {schoolInfo.school_code || 'No Code'}
              </span>
              <span className="text-xs text-secondary-400">(ID: {schoolInfo.id})</span>
            </div>
          )}
          {isLoadingSchool && (
            <div className="flex items-center gap-2 mt-1">
              <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
              <span className="text-sm text-secondary-500">Loading school info...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={() => toast.info('Export feature coming soon')}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleAddTeacher}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {totalTeachers > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400">Total Teachers</p>
            <p className="text-xl font-bold text-secondary-900">
              {isLoading ? '...' : totalTeachers}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400">Active</p>
            <p className="text-xl font-bold text-green-600">
              {isLoading ? '...' : teachers.filter(t => t.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400">Departments</p>
            <p className="text-xl font-bold text-purple-600">
              {isLoading ? '...' : departments.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400">Subjects</p>
            <p className="text-xl font-bold text-blue-600">
              {isLoading ? '...' : teachers.reduce((acc, t) => acc + (t.subjects?.length || 0), 0)}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
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
        </div>

        {/* Teacher Cards Grid */}
        <div className="p-4">
          {isLoadingSchool ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <span className="ml-2 text-secondary-500">Loading school information...</span>
            </div>
          ) : !schoolInfo ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900">No School Found</h3>
              <p className="text-secondary-500 mt-1">
                No school is associated with your account. Please contact your administrator.
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <span className="ml-2 text-secondary-500">Loading teachers...</span>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900">
                {searchTerm ? 'No teachers match your search' : `No teachers found in ${schoolInfo.name}`}
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
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
                          {schoolInfo.school_code}
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
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredTeachers.length > 0 && (
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
        )}
      </div>

      {/* Modals */}
      <TeacherModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="add"
        schoolId={schoolInfo?.id}
      />

      <TeacherModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        teacher={selectedTeacher}
        mode="edit"
        schoolId={schoolInfo?.id}
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