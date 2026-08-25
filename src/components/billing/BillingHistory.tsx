import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, FileText, CheckCircle, XCircle, Clock, Eye,
  Plus, Search, Filter, Edit, Trash2, Save, X, Loader2,
  RefreshCw, AlertCircle, CreditCard, Calendar, DollarSign,
  ChevronLeft, ChevronRight, Printer,
  File,
  Phone,
  PhoneCall,
  Mail,
  Hash,
  User,
  Building2,
  Smartphone,
  Tag,
  Receipt,
  ExternalLink,
  Upload,
  Lock,
  Wallet,
  TrendingUp
} from 'lucide-react';
import { paymentService, schoolService } from '../../api/schoolApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

interface Payment {
  id: number;
  transaction_code: string;
  school: number;
  school_code: string;
  school_name: string;
  admin_email: string;
  admin_name: string;
  admin_phone: string;
  plan: number;
  plan_name: string;
  plan_price: number;
  currency: string;
  amount: number;
  formatted_amount?: string;
  payment_method: string;
  telecom_provider: string;
  transaction_reference: string;
  status: string;
  current_stage: string;
  stage_progress: number;
  receipt_attachment: string;
  receipt_filename: string;
  initiated_at: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

interface PaymentFormData {
  school_code: string;
  admin_email: string;
  admin_name: string;
  admin_phone: string;
  amount: number;
  payment_method: string;
  telecom_provider: string;
  transaction_reference: string;
  notes: string;
  plan_name: string;
  receipt_attachment_base64?: string;
  receipt_filename?: string;
}

const BillingHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, school } = useAuth();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    school_code: '',
    admin_email: '',
    admin_name: '',
    admin_phone: '',
    amount: 0,
    payment_method: 'vodacom',
    telecom_provider: 'vodacom',
    transaction_reference: '',
    notes: '',
    plan_name: 'professional',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState('');

  const [stats, setStats] = useState({
    totalSpent: 0,
    totalInvoices: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalAmount: 0,
  });

  // Get user email and school info from auth context
  const userEmail = user?.email || '';
  const userSchoolCode = school?.school_code || user?.school_code || '';
  const userSchoolName = school?.name || '';

  // Fetch school data for the logged-in user
  const fetchSchoolData = useCallback(async () => {
    if (!isAuthenticated || !userEmail) return;

    try {
      const response = await schoolService.getSchools({ 
        admin_email: userEmail,
        page_size: 1
      });
      
      let schoolDataList = [];
      if (response.results) {
        schoolDataList = response.results;
      } else if (Array.isArray(response)) {
        schoolDataList = response;
      }
      
      if (schoolDataList && schoolDataList.length > 0) {
        const school = schoolDataList[0];
        setSchoolData(school);
        setFormData(prev => ({
          ...prev,
          school_code: school.school_code || '',
          admin_email: school.admin_email || userEmail,
          admin_name: school.admin_name || '',
          admin_phone: school.phone || '',
        }));
      }
    } catch (error) {
      console.error('[BillingHistory] Failed to fetch school data:', error);
    }
  }, [isAuthenticated, userEmail]);

  // Fetch payments from Tesla API - filtered by admin_email
  const fetchPayments = useCallback(async () => {
    if (!isAuthenticated || !userEmail) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // First fetch the school to get the school code
      const response = await paymentService.getTransactions({ page_size: 100 });
      console.log('[BillingHistory] Payments response:', response);
      
      let paymentData: Payment[] = [];
      if (response.results) {
        paymentData = response.results;
      } else if (Array.isArray(response)) {
        paymentData = response;
      }
      
      // Ensure amount is a number
      paymentData = paymentData.map(p => ({
        ...p,
        amount: typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount,
        plan_price: typeof p.plan_price === 'string' ? parseFloat(p.plan_price) : p.plan_price,
      }));
      
      // Filter transactions by admin_email (logged in user's email)
      const userPayments = paymentData.filter(
        (p: Payment) => p.admin_email?.toLowerCase() === userEmail.toLowerCase()
      );
      
      console.log('[BillingHistory] User payments:', userPayments);
      
      setPayments(userPayments);
      setFilteredPayments(userPayments);
      
      // Calculate stats
      const completed = userPayments.filter((p: Payment) => p.status === 'completed');
      const pending = userPayments.filter((p: Payment) => p.status === 'pending' || p.status === 'processing');
      const failed = userPayments.filter((p: Payment) => p.status === 'failed');
      
      const totalSpent = completed.reduce((acc: number, p: Payment) => {
        const amount = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0;
        return acc + amount;
      }, 0);
      
      const pendingAmount = pending.reduce((acc: number, p: Payment) => {
        const amount = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0;
        return acc + amount;
      }, 0);
      
      const totalAmount = userPayments.reduce((acc: number, p: Payment) => {
        const amount = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0;
        return acc + amount;
      }, 0);
      
      setStats({
        totalSpent: totalSpent,
        totalInvoices: userPayments.length,
        pendingAmount: pendingAmount,
        paidCount: completed.length,
        pendingCount: pending.length,
        failedCount: failed.length,
        totalAmount: totalAmount,
      });
      
    } catch (error: any) {
      console.error('[BillingHistory] Failed to fetch payments:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userEmail]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      Promise.all([fetchSchoolData(), fetchPayments()]);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, userEmail, fetchSchoolData, fetchPayments]);

  // Filter payments
  useEffect(() => {
    let filtered = [...payments];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.school_name?.toLowerCase().includes(term) ||
        p.transaction_code?.toLowerCase().includes(term) ||
        p.transaction_reference?.toLowerCase().includes(term) ||
        p.payment_method?.toLowerCase().includes(term) ||
        p.plan_name?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    if (filterMethod !== 'all') {
      filtered = filtered.filter(p => p.payment_method === filterMethod);
    }
    
    setFilteredPayments(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMethod, payments]);

  const resetForm = () => {
    setFormData({
      school_code: schoolData?.school_code || userSchoolCode || '',
      admin_email: userEmail || '',
      admin_name: schoolData?.admin_name || '',
      admin_phone: schoolData?.phone || '',
      amount: 0,
      payment_method: 'vodacom',
      telecom_provider: 'vodacom',
      transaction_reference: '',
      notes: '',
      plan_name: 'professional',
    });
    setAttachmentFile(null);
    setAttachmentName('');
    setFormErrors({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setAttachmentFile(file);
        setAttachmentName(file.name);
        
        setFormData(prev => ({
          ...prev,
          receipt_attachment_base64: base64,
          receipt_filename: file.name,
        }));
        
        toast.success(`File "${file.name}" uploaded successfully`);
      } catch (error) {
        console.error('Failed to convert file to base64:', error);
        toast.error('Failed to process file');
      }
    }
  };

  const removeFile = () => {
    setAttachmentFile(null);
    setAttachmentName('');
    setFormData(prev => ({
      ...prev,
      receipt_attachment_base64: '',
      receipt_filename: '',
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.school_code || formData.school_code.trim().length < 2) {
      errors.school_code = 'School code is required';
    }
    if (!formData.admin_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      errors.admin_email = 'Please enter a valid email';
    }
    if (!formData.admin_phone || formData.admin_phone.replace(/\D/g, '').length < 10) {
      errors.admin_phone = 'Please enter a valid phone number';
    }
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    if (!formData.payment_method) {
      errors.payment_method = 'Payment method is required';
    }
    if (!formData.transaction_reference || formData.transaction_reference.trim().length < 3) {
      errors.transaction_reference = 'Transaction reference is required';
    }
    if (!formData.plan_name) {
      errors.plan_name = 'Plan name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        ...formData,
        admin_email: userEmail, // Ensure admin_email is set to logged in user
      };
      
      console.log('[BillingHistory] Creating payment with data:', data);
      const response = await paymentService.createTransaction(data);
      console.log('[BillingHistory] Response:', response);
      
      toast.success('Payment added successfully!');
      setIsAddModalOpen(false);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      console.error('[BillingHistory] Failed to add payment:', error);
      console.error('[BillingHistory] Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Failed to add payment';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedPayment) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        amount: formData.amount,
        payment_method: formData.payment_method,
        telecom_provider: formData.telecom_provider,
        transaction_reference: formData.transaction_reference,
        notes: formData.notes,
        status: 'pending',
      };
      
      await paymentService.updateTransaction(selectedPayment.id, data);
      toast.success('Payment updated successfully!');
      setIsEditModalOpen(false);
      setSelectedPayment(null);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      console.error('[BillingHistory] Failed to update payment:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPayment) return;
    
    setIsDeleting(true);
    try {
      await paymentService.deleteTransaction(selectedPayment.id);
      toast.success('Payment deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error: any) {
      console.error('[BillingHistory] Failed to delete payment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete payment');
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormData({
      school_code: payment.school_code || '',
      admin_email: payment.admin_email || userEmail || '',
      admin_name: payment.admin_name || '',
      admin_phone: payment.admin_phone || '',
      amount: payment.amount,
      payment_method: payment.payment_method || 'vodacom',
      telecom_provider: payment.telecom_provider || 'vodacom',
      transaction_reference: payment.transaction_reference || '',
      notes: payment.notes || '',
      plan_name: payment.plan_name || 'professional',
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'processing':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'failed':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'cancelled':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-secondary-50 text-secondary-600 border-secondary-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'processing':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getMethodDisplay = (method: string): string => {
    if (!method) return 'N/A';
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const formatCurrency = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'TZS 0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getPaginatedPayments = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPayments.slice(start, end);
  };

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const paymentMethods = ['all', ...new Set(payments.map(p => p.payment_method).filter(Boolean))];
  const statusOptions = ['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Lock className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to view payment history</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/billing"
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">My Payment History</h1>
            <p className="text-secondary-500">View and manage your payment history</p>
            {schoolData && (
              <p className="text-xs text-secondary-400 mt-1">
                {schoolData.name} ({schoolData.school_code})
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchPayments}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-green-600" />
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Spent</p>
          </div>
          <p className="text-lg font-bold text-secondary-900">
            {isLoading ? '...' : formatCurrency(stats.totalSpent)}
          </p>
          <p className="text-xs text-secondary-400">{stats.paidCount} completed transactions</p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Transactions</p>
          </div>
          <p className="text-lg font-bold text-secondary-900">
            {isLoading ? '...' : stats.totalInvoices}
          </p>
          <div className="flex gap-2 text-xs mt-1 flex-wrap">
            <span className="text-green-600">{stats.paidCount} Completed</span>
            <span className="text-yellow-600">{stats.pendingCount} Pending</span>
            <span className="text-red-600">{stats.failedCount} Failed</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Pending Amount</p>
          </div>
          <p className="text-lg font-bold text-yellow-600">
            {isLoading ? '...' : formatCurrency(stats.pendingAmount)}
          </p>
          <p className="text-xs text-secondary-400">{stats.pendingCount} pending transactions</p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total Amount</p>
          </div>
          <p className="text-lg font-bold text-purple-600">
            {isLoading ? '...' : formatCurrency(stats.totalAmount)}
          </p>
          <p className="text-xs text-secondary-400">Across all transactions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by school, transaction code, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : getStatusLabel(status)}
              </option>
            ))}
          </select>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
          >
            {paymentMethods.map(method => (
              <option key={method} value={method}>
                {method === 'all' ? 'All Methods' : getMethodDisplay(method)}
              </option>
            ))}
          </select>
          {(searchTerm || filterStatus !== 'all' || filterMethod !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterMethod('all');
              }}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear Filters
            </button>
          )}
          <div className="text-sm text-secondary-400 ml-auto">
            {filteredPayments.length} payments
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <span className="ml-2 text-secondary-500">Loading payments...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900">No payments found</h3>
            <p className="text-secondary-500 mt-1">
              {searchTerm ? 'Try adjusting your search or filters' : 'Start by adding your first payment'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Payment
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Transaction Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">School</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Plan</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {getPaginatedPayments().map((payment) => (
                    <tr key={payment.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-primary-600">
                          {payment.transaction_code || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-secondary-900 text-sm">{payment.school_name || 'N/A'}</p>
                          <p className="text-xs text-secondary-400">{payment.school_code || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-secondary-900">
                          {payment.formatted_amount || formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600 capitalize">
                        {payment.plan_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {getMethodDisplay(payment.payment_method)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openViewModal(payment)}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </button>
                          <button
                            onClick={() => openEditModal(payment)}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="Edit Payment"
                          >
                            <Edit className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(payment)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Payment"
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

            {totalPages > 1 && (
              <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-secondary-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
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
          </>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary-600" />
                  Payment Details
                </h2>
                <p className="text-sm text-secondary-500">
                  Transaction: {selectedPayment.transaction_code}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedPayment(null);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                  {selectedPayment.stage_progress > 0 && (
                    <span className="text-xs text-secondary-400">
                      Progress: {selectedPayment.stage_progress}%
                    </span>
                  )}
                </div>
                <span className="text-xs text-secondary-400">
                  {formatDate(selectedPayment.created_at)}
                </span>
              </div>

              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Transaction Code</p>
                  <p className="font-mono font-medium text-secondary-900">
                    {selectedPayment.transaction_code}
                  </p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Transaction Reference</p>
                  <p className="font-medium text-secondary-900">
                    {selectedPayment.transaction_reference || 'N/A'}
                  </p>
                </div>
              </div>

              {/* School Info */}
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-600" />
                  School Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">School Name</p>
                    <p className="font-medium text-secondary-900">
                      {selectedPayment.school_name}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">School Code</p>
                    <p className="font-medium text-secondary-900">
                      {selectedPayment.school_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Info */}
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-600" />
                  Admin Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Admin Name</p>
                    <p className="font-medium text-secondary-900">
                      {selectedPayment.admin_name || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Admin Email</p>
                    <p className="font-medium text-secondary-900">
                      {selectedPayment.admin_email}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Admin Phone</p>
                    <p className="font-medium text-secondary-900">
                      {selectedPayment.admin_phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary-600" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Amount</p>
                    <p className="text-xl font-bold text-primary-600">
                      {selectedPayment.formatted_amount || formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Plan</p>
                    <p className="font-medium text-secondary-900 capitalize">
                      {selectedPayment.plan_name}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Payment Method</p>
                    <p className="font-medium text-secondary-900">
                      {getMethodDisplay(selectedPayment.payment_method)}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Telecom Provider</p>
                    <p className="font-medium text-secondary-900">
                      {getMethodDisplay(selectedPayment.telecom_provider)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {(selectedPayment.notes || selectedPayment.receipt_filename) && (
                <div>
                  <h3 className="text-sm font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    Additional Information
                  </h3>
                  <div className="space-y-3">
                    {selectedPayment.notes && (
                      <div className="p-4 bg-secondary-50 rounded-lg">
                        <p className="text-xs text-secondary-400 mb-1">Notes</p>
                        <p className="text-sm text-secondary-900">{selectedPayment.notes}</p>
                      </div>
                    )}
                    {selectedPayment.receipt_filename && (
                      <div className="p-4 bg-secondary-50 rounded-lg">
                        <p className="text-xs text-secondary-400 mb-1">Receipt Attachment</p>
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-primary-600" />
                          <span className="text-sm text-secondary-900">{selectedPayment.receipt_filename}</span>
                          {selectedPayment.receipt_attachment && (
                            <a
                              href={selectedPayment.receipt_attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div>
                <h3 className="text-sm font-semibold text-secondary-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Initiated At</p>
                    <p className="font-medium text-secondary-900">
                      {formatDate(selectedPayment.initiated_at)}
                    </p>
                  </div>
                  {selectedPayment.completed_at && (
                    <div className="p-4 bg-secondary-50 rounded-lg">
                      <p className="text-xs text-secondary-400 mb-1">Completed At</p>
                      <p className="font-medium text-secondary-900">
                        {formatDate(selectedPayment.completed_at)}
                      </p>
                    </div>
                  )}
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Created At</p>
                    <p className="font-medium text-secondary-900">
                      {formatDate(selectedPayment.created_at)}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Updated At</p>
                    <p className="font-medium text-secondary-900">
                      {formatDate(selectedPayment.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedPayment(null);
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedPayment);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  Add Payment
                </h2>
                <p className="text-sm text-secondary-500">Add a new payment record</p>
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

            <form onSubmit={handleAddPayment} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  School Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="school_code"
                    value={formData.school_code}
                    onChange={handleFormChange}
                    placeholder="Enter school code"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.school_code ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {formErrors.school_code && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.school_code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="email"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={handleFormChange}
                    placeholder="admin@school.com"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.admin_email ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isSaving}
                    readOnly
                  />
                </div>
                {formErrors.admin_email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.admin_email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Admin Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="tel"
                    name="admin_phone"
                    value={formData.admin_phone}
                    onChange={handleFormChange}
                    placeholder="+255 712 345 678"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.admin_phone ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {formErrors.admin_phone && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.admin_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    placeholder="Enter amount"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    min="0"
                    step="100"
                    disabled={isSaving}
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="plan_name"
                  value={formData.plan_name}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.plan_name ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isSaving}
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="trial">Trial</option>
                </select>
                {formErrors.plan_name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.plan_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.payment_method ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isSaving}
                >
                  <option value="vodacom">Vodacom</option>
                  <option value="tigo">Tigo</option>
                  <option value="airtel">Airtel</option>
                  <option value="halotel">Halotel</option>
                  <option value="ttcl">TTCL</option>
                  <option value="zantel">Zantel</option>
                </select>
                {formErrors.payment_method && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.payment_method}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Transaction Reference <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="transaction_reference"
                    value={formData.transaction_reference}
                    onChange={handleFormChange}
                    placeholder="Enter transaction reference"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.transaction_reference ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {formErrors.transaction_reference && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.transaction_reference}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Receipt Attachment (Optional)
                </label>
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors relative">
                  {attachmentFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <File className="w-6 h-6 text-primary-600" />
                        <span className="text-sm text-secondary-700">{attachmentName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-secondary-400 mx-auto mb-2" />
                      <p className="text-sm text-secondary-500">Click to upload receipt</p>
                      <p className="text-xs text-secondary-400">Any file format (No size limit)</p>
                    </>
                  )}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetForm();
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
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Add Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {isEditModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary-600" />
                  Edit Payment
                </h2>
                <p className="text-sm text-secondary-500">
                  {selectedPayment.transaction_code} - {selectedPayment.school_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedPayment(null);
                  resetForm();
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <form onSubmit={handleEditPayment} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleFormChange}
                    placeholder="Enter amount"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    min="0"
                    step="100"
                    disabled={isSaving}
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.payment_method ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isSaving}
                >
                  <option value="vodacom">Vodacom</option>
                  <option value="tigo">Tigo</option>
                  <option value="airtel">Airtel</option>
                  <option value="halotel">Halotel</option>
                  <option value="ttcl">TTCL</option>
                  <option value="zantel">Zantel</option>
                </select>
                {formErrors.payment_method && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.payment_method}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Transaction Reference <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    name="transaction_reference"
                    value={formData.transaction_reference}
                    onChange={handleFormChange}
                    placeholder="Enter transaction reference"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.transaction_reference ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isSaving}
                  />
                </div>
                {formErrors.transaction_reference && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.transaction_reference}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedPayment(null);
                    resetForm();
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPayment(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Payment"
        message={`Are you sure you want to delete this payment record?`}
        description={`This will permanently delete the payment of ${selectedPayment ? formatCurrency(selectedPayment.amount) : ''} for ${selectedPayment?.school_name || ''}. This action cannot be undone.`}
        confirmText="Delete Payment"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default BillingHistory;