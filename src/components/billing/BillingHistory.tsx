import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, FileText, CheckCircle, XCircle, Clock, Eye,
  Plus, Search, Filter, Edit, Trash2, Save, X, Loader2,
  RefreshCw, AlertCircle, CreditCard, Calendar, DollarSign,
  ChevronLeft, ChevronRight, Printer
} from 'lucide-react';
import { subscriptionService } from '../../api/schoolApi';
import toast from 'react-hot-toast';
import DeleteConfirmModal from '../../components/modals/DeleteConfirmModal';

interface Payment {
  id: number;
  subscription: number;
  school: number;
  school_name?: string;
  user: number | null;
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  status: string;
  description: string;
  invoice_number: string;
  paid_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: number;
  school: number;
  school_name: string;
  plan: number;
  plan_name: string;
  plan_display_name: string;
  status: string;
}

interface PaymentFormData {
  amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  description: string;
  status: string;
  subscription_id: number;
}

const BillingHistory: React.FC = () => {
  const navigate = useNavigate();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    currency: 'TZS',
    payment_method: 'card',
    payment_provider: 'stripe',
    description: '',
    status: 'pending',
    subscription_id: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [stats, setStats] = useState({
    totalSpent: 0,
    totalInvoices: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0,
    failedCount: 0,
  });

  // Fetch subscriptions for the dropdown
  const fetchSubscriptions = useCallback(async () => {
    setIsLoadingSubscriptions(true);
    try {
      const response = await subscriptionService.getSubscriptions();
      console.log('[BillingHistory] Subscriptions response:', response);
      
      let subData = [];
      if (response.results) {
        subData = response.results;
      } else if (Array.isArray(response)) {
        subData = response;
      }
      
      setSubscriptions(subData);
      
      // If there's at least one subscription, set it as default
      if (subData.length > 0) {
        setFormData(prev => ({
          ...prev,
          subscription_id: subData[0].id
        }));
      }
    } catch (error: any) {
      console.error('[BillingHistory] Failed to fetch subscriptions:', error);
      // Don't show toast error here, it's not critical
    } finally {
      setIsLoadingSubscriptions(false);
    }
  }, []);

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await subscriptionService.getPayments({ page_size: 100 });
      console.log('[BillingHistory] Payments response:', response);
      
      let paymentData = [];
      if (response.results) {
        paymentData = response.results;
      } else if (Array.isArray(response)) {
        paymentData = response;
      }
      
      setPayments(paymentData);
      setFilteredPayments(paymentData);
      
      const paid = paymentData.filter((p: Payment) => 
        p.status === 'paid' || p.status === 'completed'
      );
      const pending = paymentData.filter((p: Payment) => p.status === 'pending');
      const failed = paymentData.filter((p: Payment) => p.status === 'failed');
      
      setStats({
        totalSpent: paid.reduce((acc: number, p: Payment) => acc + p.amount, 0),
        totalInvoices: paymentData.length,
        pendingAmount: pending.reduce((acc: number, p: Payment) => acc + p.amount, 0),
        paidCount: paid.length,
        pendingCount: pending.length,
        failedCount: failed.length,
      });
      
    } catch (error: any) {
      console.error('[BillingHistory] Failed to fetch payments:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchPayments();
    fetchSubscriptions();
  }, [fetchPayments, fetchSubscriptions]);

  // Filter payments
  useEffect(() => {
    let filtered = [...payments];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.description?.toLowerCase().includes(term) ||
        p.invoice_number?.toLowerCase().includes(term) ||
        p.payment_method?.toLowerCase().includes(term) ||
        p.school_name?.toLowerCase().includes(term)
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
      amount: 0,
      currency: 'TZS',
      payment_method: 'card',
      payment_provider: 'stripe',
      description: '',
      status: 'pending',
      subscription_id: subscriptions.length > 0 ? subscriptions[0].id : 0,
    });
    setFormErrors({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    if (!formData.payment_method) {
      errors.payment_method = 'Payment method is required';
    }
    if (!formData.payment_provider) {
      errors.payment_provider = 'Payment provider is required';
    }
    if (!formData.subscription_id || formData.subscription_id === 0) {
      errors.subscription_id = 'Please select a subscription';
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
        subscription_id: formData.subscription_id,
        amount: formData.amount,
        currency: formData.currency,
        payment_method: formData.payment_method,
        payment_provider: formData.payment_provider,
        description: formData.description || '',
      };
      
      console.log('[BillingHistory] Creating payment with data:', data);
      await subscriptionService.createPayment(data);
      toast.success('Payment added successfully!');
      setIsAddModalOpen(false);
      resetForm();
      fetchPayments();
    } catch (error: any) {
      console.error('[BillingHistory] Failed to add payment:', error);
      console.error('[BillingHistory] Error response:', error.response?.data);
      
      // Show detailed error message
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
        currency: formData.currency,
        payment_method: formData.payment_method,
        payment_provider: formData.payment_provider,
        description: formData.description,
        status: formData.status,
      };
      
      await subscriptionService.updatePayment(selectedPayment.id, data);
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
      await subscriptionService.deletePayment(selectedPayment.id);
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
      amount: payment.amount,
      currency: payment.currency || 'TZS',
      payment_method: payment.payment_method || 'card',
      payment_provider: payment.payment_provider || 'stripe',
      description: payment.description || '',
      status: payment.status || 'pending',
      subscription_id: payment.subscription,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid':
      case 'completed':
        return 'bg-green-50 text-green-600';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600';
      case 'failed':
        return 'bg-red-50 text-red-600';
      case 'refunded':
        return 'bg-gray-50 text-gray-600';
      default:
        return 'bg-secondary-50 text-secondary-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'paid':
      case 'completed':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
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
  const statusOptions = ['all', 'pending', 'paid', 'completed', 'failed', 'refunded'];

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
            <h1 className="text-2xl font-bold text-secondary-900">Billing History</h1>
            <p className="text-secondary-500">View and manage your payment history</p>
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
            onClick={() => toast.info('Print feature coming soon')}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
            disabled={subscriptions.length === 0}
          >
            <Plus className="w-4 h-4" />
            Add Payment
          </button>
        </div>
      </div>

      {subscriptions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-yellow-800">No Subscriptions Found</h3>
          <p className="text-xs text-yellow-600 mt-1">
            You need to create a subscription first before adding payments.
          </p>
          <button
            onClick={() => navigate('/subscriptions')}
            className="mt-2 px-4 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Go to Subscriptions
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Total Spent</p>
          <p className="text-lg font-bold text-secondary-900">
            {isLoading ? '...' : formatCurrency(stats.totalSpent)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Total Invoices</p>
          <p className="text-lg font-bold text-secondary-900">
            {isLoading ? '...' : stats.totalInvoices}
          </p>
          <div className="flex gap-2 text-xs mt-1">
            <span className="text-green-600">{stats.paidCount} Paid</span>
            <span className="text-yellow-600">{stats.pendingCount} Pending</span>
            <span className="text-red-600">{stats.failedCount} Failed</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Pending Amount</p>
          <p className="text-lg font-bold text-yellow-600">
            {isLoading ? '...' : formatCurrency(stats.pendingAmount)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-secondary-200 p-4">
          <p className="text-xs text-secondary-400">Next Payment</p>
          <p className="text-lg font-bold text-secondary-900">
            {formatCurrency(59000)}
          </p>
          <p className="text-xs text-secondary-400 mt-1">Due on September 1, 2026</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by description, invoice, method..."
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
                {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
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
              disabled={subscriptions.length === 0}
            >
              Add Payment
            </button>
            {subscriptions.length === 0 && (
              <p className="text-xs text-secondary-400 mt-2">
                You need to create a subscription first
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Invoice</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {getPaginatedPayments().map((payment) => (
                    <tr key={payment.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-primary-600">
                          {payment.invoice_number || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-700">
                        {payment.description || 'Payment'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {payment.payment_method?.charAt(0).toUpperCase() + payment.payment_method?.slice(1) || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
                          <button
                            onClick={() => toast.info('View invoice coming soon')}
                            className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="View Invoice"
                          >
                            <FileText className="w-4 h-4 text-secondary-400 hover:text-secondary-600" />
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
              {/* Subscription Selection */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Subscription <span className="text-red-500">*</span>
                </label>
                <select
                  name="subscription_id"
                  value={formData.subscription_id}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.subscription_id ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isSaving || isLoadingSubscriptions}
                >
                  <option value="0">Select Subscription</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.school_name} - {sub.plan_display_name} ({sub.status})
                    </option>
                  ))}
                </select>
                {formErrors.subscription_id && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.subscription_id}</p>
                )}
                {subscriptions.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    No subscriptions available. Please create a subscription first.
                  </p>
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
                    step="0.01"
                    disabled={isSaving}
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="TZS">TZS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
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
                  <option value="card">Credit/Debit Card</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                </select>
                {formErrors.payment_method && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.payment_method}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Payment Provider <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_provider"
                  value={formData.payment_provider}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.payment_provider ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isSaving}
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="flutterwave">Flutterwave</option>
                  <option value="paystack">Paystack</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
                {formErrors.payment_provider && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.payment_provider}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter payment description"
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={isSaving}
                />
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
                  disabled={isSaving || subscriptions.length === 0}
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
                <p className="text-sm text-secondary-500">Update payment details</p>
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
                    step="0.01"
                    disabled={isSaving}
                  />
                </div>
                {formErrors.amount && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="TZS">TZS</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
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
                  <option value="card">Credit/Debit Card</option>
                  <option value="mobile">Mobile Money</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                </select>
                {formErrors.payment_method && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.payment_method}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Payment Provider <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_provider"
                  value={formData.payment_provider}
                  onChange={handleFormChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formErrors.payment_provider ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                  }`}
                  disabled={isSaving}
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="flutterwave">Flutterwave</option>
                  <option value="paystack">Paystack</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
                {formErrors.payment_provider && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.payment_provider}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isSaving}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter payment description"
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