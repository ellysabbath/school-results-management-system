import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Loader2, RefreshCw, Search,
  ChevronLeft, ChevronRight, Eye, User, Mail, Phone, 
  Shield, CheckCircle, XCircle, Clock,
  Hash, Building2, UserCircle, Lock, Key,
  Users, UserPlus, UserCheck, UserX
} from 'lucide-react';
import { adminUserService } from '../../api/schoolApi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  role_display: string;
  school_id: string;
  phone: string;
  avatar: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string;
  date_joined: string;
  created_at: string;
  updated_at: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  school_id: string;
  phone: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

const UsersAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
    school_id: '',
    phone: '',
    is_active: true,
    is_email_verified: false,
    is_staff: false,
    is_superuser: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    roleStats: {} as Record<string, number>,
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminUserService.getUsers();
      console.log('[UsersAdmin] Users response:', response);
      
      let userData = [];
      if (response.data && response.data.results) {
        userData = response.data.results;
      } else if (Array.isArray(response)) {
        userData = response;
      } else if (response.data) {
        userData = response.data;
      }
      
      setUsers(userData);
      setFilteredUsers(userData);
      
      // Calculate stats
      const active = userData.filter((u: User) => u.is_active);
      const inactive = userData.filter((u: User) => !u.is_active);
      const verified = userData.filter((u: User) => u.is_email_verified);
      const unverified = userData.filter((u: User) => !u.is_email_verified);
      
      const roleStats: Record<string, number> = {};
      userData.forEach((u: User) => {
        roleStats[u.role] = (roleStats[u.role] || 0) + 1;
      });
      
      setStats({
        totalUsers: userData.length,
        activeUsers: active.length,
        inactiveUsers: inactive.length,
        verifiedUsers: verified.length,
        unverifiedUsers: unverified.length,
        roleStats,
      });
      
    } catch (error: any) {
      console.error('[UsersAdmin] Failed to fetch users:', error);
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users
  useEffect(() => {
    let filtered = [...users];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.first_name?.toLowerCase().includes(term) ||
        u.last_name?.toLowerCase().includes(term) ||
        u.full_name?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term)
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.is_active === (filterStatus === 'active'));
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus, users]);

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'student',
      school_id: '',
      phone: '',
      is_active: true,
      is_email_verified: false,
      is_staff: false,
      is_superuser: false,
    });
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.username || formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!isEditModalOpen && (!formData.password || formData.password.length < 1)) {
      errors.password = 'Password is required';
    }
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsProcessing(true);
    try {
      const data = { ...formData };
      console.log('[UsersAdmin] Creating user:', data);
      const response = await adminUserService.createUser(data);
      console.log('[UsersAdmin] Response:', response);
      
      toast.success('User created successfully!');
      setIsAddModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('[UsersAdmin] Failed to create user:', error);
      const errorData = error.response?.data;
      if (errorData && errorData.errors) {
        const firstError = Object.values(errorData.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : 'Failed to create user');
      } else {
        toast.error(errorData?.message || 'Failed to create user');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedUser) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsProcessing(true);
    try {
      // Remove password field if empty (don't send password if not changing)
      const { password, ...restData } = formData;
      const dataToSend = password ? formData : restData;
      
      console.log('[UsersAdmin] Updating user:', dataToSend);
      const response = await adminUserService.updateUser(selectedUser.id, dataToSend);
      console.log('[UsersAdmin] Response:', response);
      
      toast.success('User updated successfully!');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('[UsersAdmin] Failed to update user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete user
  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    setIsProcessing(true);
    try {
      await adminUserService.deleteUser(selectedUser.id);
      toast.success('User deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('[UsersAdmin] Failed to delete user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle user active status
  const toggleUserStatus = async (user: User) => {
    setIsProcessing(true);
    try {
      await adminUserService.toggleUserActive(user.id);
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully!`);
      fetchUsers();
    } catch (error: any) {
      console.error('[UsersAdmin] Failed to toggle user status:', error);
      toast.error(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open modals
  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      school_id: user.school_id || '',
      phone: user.phone || '',
      is_active: user.is_active,
      is_email_verified: user.is_email_verified,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'super_admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'school_admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'teacher':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'student':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'parent':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'super_admin':
        return <Shield className="w-4 h-4" />;
      case 'school_admin':
        return <Building2 className="w-4 h-4" />;
      case 'teacher':
        return <UserCircle className="w-4 h-4" />;
      case 'student':
        return <Users className="w-4 h-4" />;
      case 'parent':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getVerificationIcon = (isVerified: boolean) => {
    return isVerified ? 
      <CheckCircle className="w-4 h-4 text-green-600" /> : 
      <Clock className="w-4 h-4 text-yellow-600" />;
  };

  const getVerificationLabel = (isVerified: boolean) => {
    return isVerified ? 'Verified' : 'Pending';
  };

  // Pagination
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const roleOptions = ['all', 'super_admin', 'school_admin', 'teacher', 'student', 'parent'];
  const statusOptions = ['all', 'active', 'inactive'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            User Management
          </h1>
          <p className="text-secondary-500">Manage all users in the system</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Total Users</p>
          <p className="text-lg font-bold text-secondary-900">{stats.totalUsers}</p>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-green-600">{stats.activeUsers} Active</span>
            <span className="text-red-600">{stats.inactiveUsers} Inactive</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Email Verification</p>
          <p className="text-lg font-bold text-secondary-900">{stats.verifiedUsers}</p>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-green-600">{stats.verifiedUsers} Verified</span>
            <span className="text-yellow-600">{stats.unverifiedUsers} Pending</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Roles</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(stats.roleStats).slice(0, 3).map(([role, count]) => (
              <span key={role} className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(role)}`}>
                {role}: {count}
              </span>
            ))}
            {Object.keys(stats.roleStats).length > 3 && (
              <span className="text-xs text-secondary-400">+{Object.keys(stats.roleStats).length - 3}</span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Last Activity</p>
          <p className="text-lg font-bold text-secondary-900">
            {users.length > 0 ? formatDate(users[0]?.last_login || users[0]?.created_at) : 'N/A'}
          </p>
          <p className="text-xs text-secondary-400 mt-1">Most recent user activity</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by name, email, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
          >
            {roleOptions.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {(searchTerm || filterRole !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('all');
                setFilterStatus('all');
              }}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear Filters
            </button>
          )}
          <div className="text-sm text-secondary-400 ml-auto">
            {filteredUsers.length} users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <span className="ml-2 text-secondary-500">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900">No users found</h3>
            <p className="text-secondary-500 mt-1">
              {searchTerm ? 'Try adjusting your search or filters' : 'Start by adding your first user'}
            </p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add User
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">User</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Verified</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Joined</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-secondary-900 text-sm">{user.full_name || user.username}</p>
                            <p className="text-xs text-secondary-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {user.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role_display || user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {getStatusIcon(user.is_active)}
                          {getStatusLabel(user.is_active)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.is_email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                          {getVerificationIcon(user.is_email_verified)}
                          {getVerificationLabel(user.is_email_verified)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {formatDate(user.date_joined)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(user)}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              user.is_active ? 'hover:bg-yellow-50' : 'hover:bg-green-50'
                            }`}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {user.is_active ? 
                              <UserX className="w-4 h-4 text-yellow-400 hover:text-yellow-600" /> :
                              <UserCheck className="w-4 h-4 text-green-400 hover:text-green-600" />
                            }
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-secondary-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                        onClick={() => setCurrentPage(pageNum)}
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
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-secondary-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary-600" />
                  Add User
                </h2>
                <p className="text-sm text-secondary-500">Create a new user account</p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  />
                </div>
                {formErrors.username && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="user@example.com"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  />
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.role ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="school_admin">School Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                  {formErrors.role && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+255 712 345 678"
                      className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  School ID
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleInputChange}
                    placeholder="Enter school ID"
                    className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_email_verified"
                    checked={formData.is_email_verified}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Email Verified
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_staff"
                    checked={formData.is_staff}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Staff
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_superuser"
                    checked={formData.is_superuser}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Superuser
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary-600" />
                  Edit User
                </h2>
                <p className="text-sm text-secondary-500">
                  {selectedUser.full_name || selectedUser.username}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.username ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  />
                </div>
                {formErrors.username && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="user@example.com"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Password (Leave blank to keep current)
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.role ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="school_admin">School Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                  {formErrors.role && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+255 712 345 678"
                      className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  School ID
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleInputChange}
                    placeholder="Enter school ID"
                    className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_email_verified"
                    checked={formData.is_email_verified}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Email Verified
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_staff"
                    checked={formData.is_staff}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Staff
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary-700">
                  <input
                    type="checkbox"
                    name="is_superuser"
                    checked={formData.is_superuser}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                    disabled={isProcessing}
                  />
                  Superuser
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-600" />
                  User Details
                </h2>
                <p className="text-sm text-secondary-500">
                  {selectedUser.full_name || selectedUser.username}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* User Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600">
                  {selectedUser.first_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">{selectedUser.full_name || selectedUser.username}</h3>
                  <p className="text-sm text-secondary-500">@{selectedUser.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(selectedUser.role)}`}>
                      {getRoleIcon(selectedUser.role)}
                      {selectedUser.role_display || selectedUser.role}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${selectedUser.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {getStatusIcon(selectedUser.is_active)}
                      {getStatusLabel(selectedUser.is_active)}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${selectedUser.is_email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {getVerificationIcon(selectedUser.is_email_verified)}
                      {getVerificationLabel(selectedUser.is_email_verified)}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Email</p>
                  <p className="font-medium text-secondary-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-secondary-400" />
                    {selectedUser.email}
                  </p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Phone</p>
                  <p className="font-medium text-secondary-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-secondary-400" />
                    {selectedUser.phone || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">School ID</p>
                  <p className="font-medium text-secondary-900 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-secondary-400" />
                    {selectedUser.school_id || 'N/A'}
                  </p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Staff Status</p>
                  <p className="font-medium text-secondary-900">
                    {selectedUser.is_staff ? 'Staff Member' : 'Not Staff'}
                    {selectedUser.is_superuser && ' (Superuser)'}
                  </p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Joined Date</p>
                  <p className="font-medium text-secondary-900">
                    {formatDate(selectedUser.date_joined)}
                  </p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Last Login</p>
                  <p className="font-medium text-secondary-900">
                    {selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Never'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedUser);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.full_name || selectedUser?.username}"?`}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default UsersAdmin;