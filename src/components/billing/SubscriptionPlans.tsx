import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, Crown, Sparkles, Star, Zap, CreditCard, TrendingUp, Loader2,
  Plus, Edit, Trash2, X, Save, RefreshCw, Search,
  DollarSign, Users, BookOpen, Award, Shield, 
  Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight,
  Eye, FileText, Printer, Download, Hash, Mail, Phone,
  Building2, Smartphone, Tag, Filter, User, Upload
} from 'lucide-react';
import { paymentService, subscriptionService } from '../../api/schoolApi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

interface Transaction {
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

interface TransactionFormData {
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
  status: string;
  receipt_attachment_base64?: string;
  receipt_filename?: string;
}

const SubscriptionPlans: React.FC = () => {
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Transaction form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>({
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
    status: 'pending',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  
  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  // View modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalTransactions: 0,
    pendingAmount: 0,
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await paymentService.getTransactions({ page_size: 100 });
      console.log('[SubscriptionPlans] Transactions response:', response);
      
      let transactionData = [];
      if (response.results) {
        transactionData = response.results;
      } else if (Array.isArray(response)) {
        transactionData = response;
      }
      
      setTransactions(transactionData);
      setFilteredTransactions(transactionData);
      
      // Calculate stats
      const completed = transactionData.filter((t: Transaction) => t.status === 'completed');
      const pending = transactionData.filter((t: Transaction) => t.status === 'pending' || t.status === 'processing');
      const failed = transactionData.filter((t: Transaction) => t.status === 'failed');
      
      setStats({
        totalSpent: completed.reduce((acc: number, t: Transaction) => acc + t.amount, 0),
        totalTransactions: transactionData.length,
        pendingAmount: pending.reduce((acc: number, t: Transaction) => acc + t.amount, 0),
        completedCount: completed.length,
        pendingCount: pending.length,
        failedCount: failed.length,
      });
    } catch (error: any) {
      console.error('[SubscriptionPlans] Failed to fetch transactions:', error);
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  useEffect(() => {
    let filtered = [...transactions];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.school_name?.toLowerCase().includes(term) ||
        t.transaction_code?.toLowerCase().includes(term) ||
        t.transaction_reference?.toLowerCase().includes(term) ||
        t.plan_name?.toLowerCase().includes(term) ||
        t.admin_email?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    if (filterMethod !== 'all') {
      filtered = filtered.filter(t => t.payment_method === filterMethod);
    }
    
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMethod, transactions]);

  // Reset form
  const resetForm = () => {
    setFormData({
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
      status: 'pending',
    });
    setAttachmentFile(null);
    setAttachmentName('');
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    if (!formData.status) {
      errors.status = 'Status is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsProcessing(true);
    try {
      const data = { ...formData };
      console.log('[SubscriptionPlans] Creating transaction:', data);
      const response = await paymentService.createTransaction(data);
      console.log('[SubscriptionPlans] Response:', response);
      
      toast.success('Transaction created successfully!');
      setIsModalOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error: any) {
      console.error('[SubscriptionPlans] Failed to create transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to create transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update transaction
  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedTransaction) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsProcessing(true);
    try {
      const data = {
        amount: formData.amount,
        payment_method: formData.payment_method,
        telecom_provider: formData.telecom_provider,
        transaction_reference: formData.transaction_reference,
        notes: formData.notes,
        status: formData.status,
      };
      
      await paymentService.updateTransaction(selectedTransaction.id, data);
      toast.success('Transaction updated successfully!');
      setIsModalOpen(false);
      setSelectedTransaction(null);
      resetForm();
      fetchTransactions();
    } catch (error: any) {
      console.error('[SubscriptionPlans] Failed to update transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to update transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete transaction
  const confirmDelete = async () => {
    if (!transactionToDelete) return;
    
    setIsProcessing(true);
    try {
      await paymentService.deleteTransaction(transactionToDelete.id);
      toast.success('Transaction deleted successfully!');
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
      fetchTransactions();
    } catch (error: any) {
      console.error('[SubscriptionPlans] Failed to delete transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedTransaction(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (transaction: Transaction) => {
    setIsEditing(true);
    setSelectedTransaction(transaction);
    setFormData({
      school_code: transaction.school_code || '',
      admin_email: transaction.admin_email || '',
      admin_name: transaction.admin_name || '',
      admin_phone: transaction.admin_phone || '',
      amount: transaction.amount,
      payment_method: transaction.payment_method || 'vodacom',
      telecom_provider: transaction.telecom_provider || 'vodacom',
      transaction_reference: transaction.transaction_reference || '',
      notes: transaction.notes || '',
      plan_name: transaction.plan_name || 'professional',
      status: transaction.status || 'pending',
    });
    setIsModalOpen(true);
  };

  // Open view modal
  const openViewModal = (transaction: Transaction) => {
    setViewingTransaction(transaction);
    setIsViewModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setIsDeleteModalOpen(true);
  };

  const formatCurrency = (amount: number): string => {
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

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
        return 'bg-green-50 text-green-600';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600';
      case 'processing':
        return 'bg-blue-50 text-blue-600';
      case 'failed':
        return 'bg-red-50 text-red-600';
      case 'cancelled':
        return 'bg-gray-50 text-gray-600';
      default:
        return 'bg-secondary-50 text-secondary-600';
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

  const paymentMethods = ['all', ...new Set(transactions.map(t => t.payment_method).filter(Boolean))];
  const statusOptions = ['all', 'pending', 'processing', 'completed', 'failed', 'cancelled'];

  // Pagination
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Loading Transactions...</h3>
          <p className="text-secondary-500">Please wait while we load data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Billing Management</h1>
          <p className="text-secondary-500">Manage all billing transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTransactions}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Total Spent</p>
          <p className="text-lg font-bold text-secondary-900">
            {formatCurrency(stats.totalSpent)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Total Transactions</p>
          <p className="text-lg font-bold text-secondary-900">
            {stats.totalTransactions}
          </p>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-green-600">{stats.completedCount} Completed</span>
            <span className="text-yellow-600">{stats.pendingCount} Pending</span>
            <span className="text-red-600">{stats.failedCount} Failed</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Pending Amount</p>
          <p className="text-lg font-bold text-yellow-600">
            {formatCurrency(stats.pendingAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Average Transaction</p>
          <p className="text-lg font-bold text-secondary-900">
            {stats.totalTransactions > 0 ? formatCurrency(stats.totalSpent / stats.totalTransactions) : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-secondary-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by school, code, reference, email..."
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
                {method === 'all' ? 'All Methods' : method.charAt(0).toUpperCase() + method.slice(1)}
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
            {filteredTransactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900">No transactions found</h3>
            <p className="text-secondary-500 mt-1">
              {searchTerm ? 'Try adjusting your search or filters' : 'Start by adding your first transaction'}
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Transaction
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Code</th>
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
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-primary-600">
                          {transaction.transaction_code || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-secondary-900 text-sm">{transaction.school_name || 'N/A'}</p>
                          <p className="text-xs text-secondary-400">{transaction.school_code || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {transaction.plan_name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {transaction.payment_method?.charAt(0).toUpperCase() + transaction.payment_method?.slice(1) || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(transaction)}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </button>
                          <button
                            onClick={() => openEditModal(transaction)}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(transaction)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Transaction"
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
                  {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
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

      {/* Create/Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  {isEditing ? (
                    <Edit className="w-5 h-5 text-primary-600" />
                  ) : (
                    <Plus className="w-5 h-5 text-primary-600" />
                  )}
                  {isEditing ? 'Edit Transaction' : 'Add Transaction'}
                </h2>
                <p className="text-sm text-secondary-500">
                  {isEditing ? 'Update transaction details' : 'Create a new transaction'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <form onSubmit={isEditing ? handleUpdateTransaction : handleCreateTransaction} className="px-6 py-6 space-y-4">
              {/* School Code */}
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
                    onChange={handleInputChange}
                    placeholder="Enter school code"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.school_code ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isEditing || isProcessing}
                  />
                </div>
                {formErrors.school_code && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.school_code}</p>
                )}
              </div>

              {/* Admin Email */}
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
                    onChange={handleInputChange}
                    placeholder="admin@school.com"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.admin_email ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isEditing || isProcessing}
                  />
                </div>
                {formErrors.admin_email && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.admin_email}</p>
                )}
              </div>

              {/* Admin Phone */}
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
                    onChange={handleInputChange}
                    placeholder="+255 712 345 678"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.admin_phone ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isEditing || isProcessing}
                  />
                </div>
                {formErrors.admin_phone && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.admin_phone}</p>
                )}
              </div>

              {/* Amount and Plan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        formErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                      }`}
                      min="0"
                      step="100"
                      disabled={isProcessing}
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
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.plan_name ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
                  >
                    <option value="starter">Basic</option>
                    <option value="professional">Premium</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="trial">Trial</option>
                  </select>
                  {formErrors.plan_name && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.plan_name}</p>
                  )}
                </div>
              </div>

              {/* Payment Method and Reference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.payment_method ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                    }`}
                    disabled={isProcessing}
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
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      name="transaction_reference"
                      value={formData.transaction_reference}
                      onChange={handleInputChange}
                      placeholder="Enter reference"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        formErrors.transaction_reference ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                      }`}
                      disabled={isProcessing}
                    />
                  </div>
                  {formErrors.transaction_reference && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.transaction_reference}</p>
                  )}
                </div>
              </div>

              {/* Status - Added for editing */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.status ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isProcessing}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {formErrors.status && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.status}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={isProcessing}
                />
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Receipt Attachment (Optional)
                </label>
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-4 text-center hover:border-primary-500 transition-colors relative">
                  {attachmentFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary-600" />
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
                    setIsModalOpen(false);
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
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {isViewModalOpen && viewingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-600" />
                  Transaction Details
                </h2>
                <p className="text-sm text-secondary-500">
                  {viewingTransaction.transaction_code}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewingTransaction(null);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewingTransaction.status)}`}>
                  {getStatusIcon(viewingTransaction.status)}
                  {getStatusLabel(viewingTransaction.status)}
                </span>
                <span className="text-xs text-secondary-400">
                  {formatDate(viewingTransaction.created_at)}
                </span>
              </div>

              {/* Transaction Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Transaction Code</p>
                  <p className="font-mono font-medium text-secondary-900">{viewingTransaction.transaction_code}</p>
                </div>
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Reference</p>
                  <p className="font-medium text-secondary-900">{viewingTransaction.transaction_reference || 'N/A'}</p>
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
                    <p className="font-medium text-secondary-900">{viewingTransaction.school_name}</p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">School Code</p>
                    <p className="font-medium text-secondary-900">{viewingTransaction.school_code}</p>
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
                    <p className="font-medium text-secondary-900">{viewingTransaction.admin_name || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Admin Email</p>
                    <p className="font-medium text-secondary-900">{viewingTransaction.admin_email}</p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Admin Phone</p>
                    <p className="font-medium text-secondary-900">{viewingTransaction.admin_phone}</p>
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
                    <p className="text-xl font-bold text-primary-600">{formatCurrency(viewingTransaction.amount)}</p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Plan</p>
                    <p className="font-medium text-secondary-900">{viewingTransaction.plan_name}</p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Payment Method</p>
                    <p className="font-medium text-secondary-900">{viewingTransaction.payment_method?.charAt(0).toUpperCase() + viewingTransaction.payment_method?.slice(1) || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-secondary-50 rounded-lg">
                    <p className="text-xs text-secondary-400 mb-1">Telecom Provider</p>
                    <p className="font-medium text-secondary-900">{viewingTransaction.telecom_provider?.charAt(0).toUpperCase() + viewingTransaction.telecom_provider?.slice(1) || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {viewingTransaction.notes && (
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Notes</p>
                  <p className="text-sm text-secondary-900">{viewingTransaction.notes}</p>
                </div>
              )}

              {viewingTransaction.receipt_filename && (
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <p className="text-xs text-secondary-400 mb-1">Receipt Attachment</p>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    <span className="text-sm text-secondary-900">{viewingTransaction.receipt_filename}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setViewingTransaction(null);
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(viewingTransaction);
                  }}
                  className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
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
          setTransactionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message={`Are you sure you want to delete this transaction?`}
        description={`This will permanently delete the transaction of ${transactionToDelete ? formatCurrency(transactionToDelete.amount) : ''} for ${transactionToDelete?.school_name || ''}. This action cannot be undone.`}
        confirmText="Delete Transaction"
        isLoading={isProcessing}
        variant="danger"
      />
    </div>
  );
};

export default SubscriptionPlans;