import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Mail, Phone, MapPin, 
  Users, UserCheck, BookOpen, ClipboardList,
  Calendar, Edit, MoreVertical, Download,
  CheckCircle, XCircle, AlertCircle, Clock,
  DollarSign, TrendingUp, Award, BarChart3,
  Loader2
} from 'lucide-react';
import { schoolService } from '../../api/schoolApi';
import toast from 'react-hot-toast';
import SchoolModal from '../../components/modals/SchoolModal';

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
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  total_results: number;
  created_at: string;
  updated_at: string;
  last_active: string;
  logo?: string;
  trial_ends_at?: string;
  current_period_ends_at?: string;
}

const SchoolDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSchoolDetails(parseInt(id));
    }
  }, [id]);

  const fetchSchoolDetails = async (schoolId: number) => {
    setIsLoading(true);
    try {
      const response = await schoolService.getSchool(schoolId);
      
      // Handle different response formats
      const schoolData = response.data || response;
      setSchool(schoolData);
    } catch (error: any) {
      console.error('Error fetching school details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch school details');
      // Navigate back if school not found
      if (error.response?.status === 404) {
        setTimeout(() => navigate('/system/schools'), 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    if (id) {
      fetchSchoolDetails(parseInt(id));
    }
    toast.success('School updated successfully!');
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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'suspended':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusTextColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-700';
      case 'expired':
        return 'text-red-700';
      case 'suspended':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200';
      case 'expired':
        return 'bg-red-50 border-red-200';
      case 'suspended':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
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

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-500">Loading school details...</p>
        </div>
      </div>
    );
  }

  // School not found
  if (!school) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-secondary-900">School Not Found</h3>
        <p className="text-secondary-500 mt-1">The school you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/system/schools')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Schools
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/system/schools')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              {school.name}
            </h1>
            <p className="text-secondary-500">School ID: {school.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            Edit School
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border flex items-center justify-between ${getStatusBgColor(school.status)}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon(school.status)}
          <div>
            <p className={`font-medium ${getStatusTextColor(school.status)}`}>
              Status: {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
            </p>
            {school.status === 'active' && school.current_period_ends_at && (
              <p className="text-sm text-secondary-600">
                Subscription valid until {formatDate(school.current_period_ends_at)}
              </p>
            )}
            {school.status === 'active' && school.trial_ends_at && (
              <p className="text-sm text-secondary-600">
                Trial ends on {formatDate(school.trial_ends_at)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Reminder sent to school admin')}
            className="px-3 py-1.5 bg-white border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
          >
            Send Reminder
          </button>
          <button
            onClick={() => toast.info('Subscription management opened')}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            Manage Subscription
          </button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* School Info */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4">School Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary-400">School Name</p>
                <p className="text-sm font-medium text-secondary-900">{school.name}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Plan</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(school.plan)}`}>
                  {getPlanLabel(school.plan)}
                </span>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Email</p>
                <p className="text-sm text-secondary-700 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-secondary-400" />
                  {school.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Phone</p>
                <p className="text-sm text-secondary-700 flex items-center gap-2">
                  <Phone className="w-3 h-3 text-secondary-400" />
                  {school.phone || 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-secondary-400">Address</p>
                <p className="text-sm text-secondary-700 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-secondary-400" />
                  {school.address || 'No address provided'}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Joined</p>
                <p className="text-sm text-secondary-700 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-secondary-400" />
                  {formatDate(school.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Last Active</p>
                <p className="text-sm text-secondary-700 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-secondary-400" />
                  {formatDateTime(school.last_active)}
                </p>
              </div>
            </div>
          </div>

          {/* Admin Info */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4">Administrator</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                {school.admin_name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-medium text-secondary-900">{school.admin_name}</p>
                <p className="text-sm text-secondary-500 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {school.admin_email}
                </p>
                <span className="text-xs text-secondary-400">School Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4">Usage Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-secondary-600">Students</span>
                </div>
                <span className="font-bold text-secondary-900">{school.total_students || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-secondary-600">Teachers</span>
                </div>
                <span className="font-bold text-secondary-900">{school.total_teachers || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-secondary-600">Subjects</span>
                </div>
                <span className="font-bold text-secondary-900">{school.total_subjects || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-secondary-600">Results</span>
                </div>
                <span className="font-bold text-secondary-900">{school.total_results || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate(`/system/schools/${school.id}/students`)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
              >
                <Users className="w-4 h-4" />
                View All Students
              </button>
              <button 
                onClick={() => navigate(`/system/schools/${school.id}/teachers`)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm"
              >
                <UserCheck className="w-4 h-4" />
                View All Teachers
              </button>
              <button 
                onClick={() => navigate(`/system/schools/${school.id}/subjects`)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
              >
                <BookOpen className="w-4 h-4" />
                View All Subjects
              </button>
              <button 
                onClick={() => navigate(`/system/schools/${school.id}/analytics`)}
                className="w-full flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <SchoolModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        school={school}
        mode="edit"
      />
    </div>
  );
};

export default SchoolDetails;