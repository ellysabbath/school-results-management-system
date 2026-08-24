import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Eye, MoreVertical, Download, 
  ChevronLeft, ChevronRight, Building2, Mail, Phone,
  CheckCircle, XCircle, AlertCircle, Clock, Loader2,
  PlusCircle, Edit, Trash2, Hash, Users, BookOpen,
  FileText, User, RefreshCw, School
} from 'lucide-react';
import { schoolService, studentService, teacherService, subjectService, resultService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import SchoolModal from '../../components/modals/SchoolModal';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

interface School {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  plan: string;
  status: string;
  admin_name: string;
  admin_email: string;
  school_code?: string;
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  total_results: number;
  created_at: string;
  updated_at: string;
  last_active: string;
}

interface SchoolStats {
  students: number;
  teachers: number;
  subjects: number;
  results: number;
}

const AllSchools: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSchools, setTotalSchools] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [schoolStats, setSchoolStats] = useState<Record<number, SchoolStats>>({});
  const [isLoadingStats, setIsLoadingStats] = useState<Record<number, boolean>>({});
  const itemsPerPage = 10;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    suspended: 0,
  });

  // Fetch schools
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage,
        page_size: itemsPerPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }
      if (filterPlan !== 'all') {
        params.plan = filterPlan;
      }
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await schoolService.getSchools(params);
      
      let schoolData: School[] = [];
      let totalCount = 0;
      
      if (response.results) {
        schoolData = response.results;
        totalCount = response.count;
      } else {
        schoolData = response;
        totalCount = response.length;
      }
      
      setSchools(schoolData);
      setTotalSchools(totalCount);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));

      // Fetch stats for each school
      await fetchStatsForSchools(schoolData);

      // Calculate summary stats
      const activeCount = schoolData.filter((s: School) => s.status === 'active').length;
      const expiredCount = schoolData.filter((s: School) => s.status === 'expired').length;
      const suspendedCount = schoolData.filter((s: School) => s.status === 'suspended').length;

      setStats({
        total: schoolData.length,
        active: activeCount,
        expired: expiredCount,
        suspended: suspendedCount,
      });

    } catch (error: any) {
      console.error('Error fetching schools:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch schools');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, filterPlan, filterStatus, itemsPerPage]);

  // Fetch stats for each school
  const fetchStatsForSchools = async (schoolData: School[]) => {
    for (const school of schoolData) {
      const schoolId = school.id;
      const schoolCode = school.school_code;
      
      if (!schoolCode) continue;
      
      setIsLoadingStats(prev => ({ ...prev, [schoolId]: true }));
      
      try {
        // Fetch students count
        const studentsResponse = await studentService.getStudents({
          school_code: schoolCode,
          page_size: 1
        });
        const studentsCount = studentsResponse.count || studentsResponse.results?.length || 0;
        
        // Fetch teachers count
        const teachersResponse = await teacherService.getTeachers({
          school_code: schoolCode,
          page_size: 1
        });
        const teachersCount = teachersResponse.count || teachersResponse.results?.length || 0;
        
        // Fetch subjects count
        const subjectsResponse = await subjectService.getSubjects({
          school_code: schoolCode,
          page_size: 1
        });
        const subjectsCount = subjectsResponse.count || subjectsResponse.results?.length || 0;
        
        // Fetch results count
        const resultsResponse = await resultService.getResults({
          school_code: schoolCode,
          page_size: 1
        });
        const resultsCount = resultsResponse.count || resultsResponse.results?.length || 0;
        
        setSchoolStats(prev => ({
          ...prev,
          [schoolId]: {
            students: studentsCount,
            teachers: teachersCount,
            subjects: subjectsCount,
            results: resultsCount,
          }
        }));
        
      } catch (error) {
        console.error(`Failed to fetch stats for school ${schoolId}:`, error);
        // Set default values on error
        setSchoolStats(prev => ({
          ...prev,
          [schoolId]: {
            students: 0,
            teachers: 0,
            subjects: 0,
            results: 0,
          }
        }));
      } finally {
        setIsLoadingStats(prev => ({ ...prev, [schoolId]: false }));
      }
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleAddSchool = () => {
    setSelectedSchool(null);
    setIsAddModalOpen(true);
  };

  const handleEditSchool = (school: School) => {
    setSelectedSchool(school);
    setIsEditModalOpen(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSelectedSchool(school);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSchool) return;
    
    setIsDeleting(true);
    try {
      await schoolService.deleteSchool(selectedSchool.id);
      toast.success(`School "${selectedSchool.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setSelectedSchool(null);
      fetchSchools();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete school');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    fetchSchools();
  };

  const handleRefresh = () => {
    fetchSchools();
  };

  const getPlanColor = (plan: string): string => {
    const colors: Record<string, string> = {
      trial: 'bg-blue-100 text-blue-700',
      starter: 'bg-green-100 text-green-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-yellow-100 text-yellow-700',
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
  };

  const getPlanLabel = (plan: string): string => {
    const labels: Record<string, string> = {
      trial: 'Trial',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return labels[plan] || plan;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      suspended: 'bg-yellow-100 text-yellow-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const plans = ['all', 'trial', 'starter', 'professional', 'enterprise'];
  const statuses = ['all', 'active', 'expired', 'suspended'];

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" />
            All Schools
          </h1>
          <p className="text-secondary-500">Manage all schools in the system</p>
          {user && (
            <p className="text-xs text-secondary-400">
              Logged in as: {user.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={handleAddSchool}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add School
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Total Schools</p>
          <p className="text-xl font-bold text-secondary-900">
            {isLoading ? '...' : stats.total}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Active</p>
          <p className="text-xl font-bold text-green-600">
            {isLoading ? '...' : stats.active}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Expired</p>
          <p className="text-xl font-bold text-red-600">
            {isLoading ? '...' : stats.expired}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Suspended</p>
          <p className="text-xl font-bold text-yellow-600">
            {isLoading ? '...' : stats.suspended}
          </p>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search schools by name, admin, email, or school code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterPlan}
              onChange={(e) => {
                setFilterPlan(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              {plans.map(plan => (
                <option key={plan} value={plan}>
                  {plan === 'all' ? 'All Plans' : plan.charAt(0).toUpperCase() + plan.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <span className="ml-2 text-secondary-500">Loading schools...</span>
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900">No schools found</h3>
              <p className="text-secondary-500 mt-1">
                {searchTerm ? 'Try adjusting your search or filters' : 'Get started by adding your first school'}
              </p>
              <button
                onClick={handleAddSchool}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Add School
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">School Code</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">School</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Admin</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Students</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Teachers</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subjects</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Results</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Joined</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {schools.map((school) => {
                  const stats = schoolStats[school.id] || { students: 0, teachers: 0, subjects: 0, results: 0 };
                  const isLoadingStat = isLoadingStats[school.id];
                  
                  return (
                    <tr key={school.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-primary-500" />
                          <span className="font-mono font-medium text-primary-600 text-sm">
                            {school.school_code || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-secondary-900 text-sm">{school.name}</p>
                          <div className="flex items-center gap-2 text-xs text-secondary-400">
                            <Mail className="w-3 h-3" />
                            <span>{school.email}</span>
                          </div>
                          {school.phone && (
                            <div className="flex items-center gap-2 text-xs text-secondary-400">
                              <Phone className="w-3 h-3" />
                              <span>{school.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-secondary-700">{school.admin_name || 'N/A'}</p>
                          <p className="text-xs text-secondary-400">{school.admin_email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(school.plan)}`}>
                          {getPlanLabel(school.plan)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {isLoadingStat ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>{stats.students}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {isLoadingStat ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-purple-500" />
                            <span>{stats.teachers}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {isLoadingStat ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-green-500" />
                            <span>{stats.subjects}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {isLoadingStat ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-orange-500" />
                            <span>{stats.results}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(school.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(school.status)}`}>
                            {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-500">
                        {formatDate(school.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/system/schools/${school.id}`}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="View School"
                          >
                            <Eye className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </Link>
                          <button
                            onClick={() => handleEditSchool(school)}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="Edit School"
                          >
                            <Edit className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchool(school)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete School"
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && schools.length > 0 && (
          <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-secondary-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalSchools)} of {totalSchools} schools
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
      <SchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        mode="add"
      />

      <SchoolModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        school={selectedSchool}
        mode="edit"
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedSchool(null);
        }}
        onConfirm={confirmDelete}
        title="Delete School"
        message={`Are you sure you want to delete "${selectedSchool?.name}"?`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AllSchools;