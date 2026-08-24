// src/pages/ContactManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';

import { 
  Mail, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
 
  Tag,
  Flag,
  Edit,
  Reply,
  Send,
  X,
 
  Inbox,
  
  Archive,
  
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { contactService } from '../api/contactApi';
import toast from 'react-hot-toast';

// ============================================
// INTERFACES
// ============================================

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed' | 'spam';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'feature' | 'bug' | 'feedback' | 'partnership' | 'other';
  admin_notes: string | null;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  responded_by_name?: string;
  assigned_to_name?: string;
}

interface ContactStats {
  total: number;
  pending: number;
  in_progress: number;
  resolved: number;
  closed: number;
  spam: number;
  unread: number;
  recent: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

// ============================================
// STATUS & PRIORITY HELPERS
// ============================================

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
  spam: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  in_progress: <Loader2 className="w-3 h-3 animate-spin" />,
  resolved: <CheckCircle className="w-3 h-3" />,
  closed: <Archive className="w-3 h-3" />,
  spam: <XCircle className="w-3 h-3" />,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  low: <Flag className="w-3 h-3" />,
  medium: <Flag className="w-3 h-3" />,
  high: <Flag className="w-3 h-3" />,
  urgent: <Flag className="w-3 h-3" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  technical: 'Technical Support',
  billing: 'Billing/Pricing',
  feature: 'Feature Request',
  bug: 'Bug Report',
  feedback: 'Feedback',
  partnership: 'Partnership',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-600',
  technical: 'bg-blue-100 text-blue-600',
  billing: 'bg-green-100 text-green-600',
  feature: 'bg-purple-100 text-purple-600',
  bug: 'bg-red-100 text-red-600',
  feedback: 'bg-yellow-100 text-yellow-600',
  partnership: 'bg-indigo-100 text-indigo-600',
  other: 'bg-gray-100 text-gray-600',
};

// ============================================
// MAIN COMPONENT
// ============================================

const ContactManagement: React.FC = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // Data States
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [stats, setStats] = useState<ContactStats | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;
  
  // Modal States
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  
  // Form States
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<string>('resolved');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Expanded Row State
  const [expandedContact, setExpandedContact] = useState<number | null>(null);

  // ============================================
  // FETCH DATA
  // ============================================

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await contactService.getContacts({
        page: currentPage,
        page_size: itemsPerPage,
      });
      
      const results = response.results || response;
      const contactsData = results.results || results || [];
      setContacts(contactsData);
      setFilteredContacts(contactsData);
      setTotalResults(results.count || contactsData.length);
      setTotalPages(Math.ceil((results.count || contactsData.length) / itemsPerPage));
      
    } catch (error: any) {
      console.error('[ContactManagement] Error fetching contacts:', error);
      toast.error(error.response?.data?.message || 'Failed to load contacts');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await contactService.getContactStats();
      setStats(response);
    } catch (error: any) {
      console.error('[ContactManagement] Error fetching stats:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([fetchContacts(), fetchStats()]);
  }, [fetchContacts, fetchStats]);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let filtered = [...contacts];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.subject?.toLowerCase().includes(term) ||
        c.message?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(c => c.priority === filterPriority);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(c => c.category === filterCategory);
    }
    
    if (filterRead !== 'all') {
      const isRead = filterRead === 'read';
      filtered = filtered.filter(c => c.is_read === isRead);
    }
    
    setFilteredContacts(filtered);
    setTotalResults(filtered.length);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [contacts, searchTerm, filterStatus, filterPriority, filterCategory, filterRead]);

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await contactService.deleteContact(id);
      toast.success('Contact deleted successfully');
      await loadData();
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('[ContactManagement] Error deleting contact:', error);
      toast.error(error.response?.data?.message || 'Failed to delete contact');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      toast.error('No contacts selected');
      return;
    }

    setIsDeleting(true);
    try {
      await contactService.bulkDeleteContacts(ids);
      toast.success(`${ids.length} contacts deleted successfully`);
      setSelectedIds(new Set());
      setSelectAll(false);
      await loadData();
      setIsBulkDeleteModalOpen(false);
    } catch (error: any) {
      console.error('[ContactManagement] Error bulk deleting:', error);
      toast.error(error.response?.data?.message || 'Failed to delete contacts');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await contactService.updateContact(id, { status });
      toast.success(`Status updated to ${status}`);
      await loadData();
    } catch (error: any) {
      console.error('[ContactManagement] Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await contactService.respondToContact(id, '');
      await loadData();
    } catch (error: any) {
      console.error('[ContactManagement] Error marking as read:', error);
    }
  };

  const handleSendResponse = async (id: number) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setIsSubmitting(true);
    try {
      await contactService.respondToContact(id, responseText, responseStatus);
      toast.success('Response sent successfully');
      setResponseText('');
      setIsResponseModalOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('[ContactManagement] Error sending response:', error);
      toast.error(error.response?.data?.message || 'Failed to send response');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // SELECTION HANDLERS
  // ============================================

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
    } else {
      const ids = getPaginatedContacts().map(c => c.id);
      setSelectedIds(new Set(ids));
    }
    setSelectAll(!selectAll);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getPaginatedContacts = () => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredContacts.slice(start, end);
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

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
        {STATUS_ICONS[status] || STATUS_ICONS.pending}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}>
        {PRIORITY_ICONS[priority] || PRIORITY_ICONS.medium}
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[category] || CATEGORY_COLORS.other}`}>
        <Tag className="w-3 h-3" />
        {CATEGORY_LABELS[category] || category}
      </span>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading contacts...</span>
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
            <Mail className="w-6 h-6 text-primary-600" />
            Contact Management
          </h1>
          <p className="text-secondary-500">Manage all contact inquiries and support requests</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadData();
            }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm text-secondary-600"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ==========================================
          STATS CARDS
          ========================================== */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-secondary-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.in_progress}</p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Unread</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.unread}</p>
          </div>
          <div className="bg-white rounded-lg border border-secondary-200 p-4">
            <p className="text-xs text-secondary-400 uppercase tracking-wider">Recent (7d)</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.recent}</p>
          </div>
        </div>
      )}

      {/* ==========================================
          FILTERS
          ========================================== */}
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search by name, email, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="spam">Spam</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
          >
            <option value="all">All Read Status</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>

          {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all' || filterRead !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPriority('all');
                setFilterCategory('all');
                setFilterRead('all');
              }}
              className="px-3 py-2 text-xs text-red-600 hover:text-red-800 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}
        </div>

        {/* ==========================================
            CONTACTS TABLE
            ========================================== */}
        <div className="overflow-x-auto">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900">No Contacts Found</h3>
              <p className="text-secondary-500 mt-1">No contact inquiries matching your filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">#</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subject</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Priority</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {getPaginatedContacts().map((contact, index) => {
                  const globalIndex = ((currentPage - 1) * itemsPerPage) + index + 1;
                  const isSelected = selectedIds.has(contact.id);
                  const isExpanded = expandedContact === contact.id;

                  return (
                    <React.Fragment key={contact.id}>
                      <tr className={`hover:bg-secondary-50 transition-colors ${!contact.is_read ? 'bg-blue-50/30' : ''}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(contact.id)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-sm text-secondary-500">{globalIndex}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 font-medium text-xs">
                              {contact.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-secondary-900">{contact.name}</p>
                              <p className="text-xs text-secondary-400">{contact.email}</p>
                            </div>
                            {!contact.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Unread" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-secondary-700 max-w-xs truncate">{contact.subject}</p>
                        </td>
                        <td className="py-3 px-4">
                          {getCategoryBadge(contact.category)}
                        </td>
                        <td className="py-3 px-4">
                          {getPriorityBadge(contact.priority)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(contact.status)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-secondary-500">{formatDate(contact.created_at)}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedContact(contact);
                                setIsViewModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-blue-500 hover:text-blue-700" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedContact(contact);
                                setResponseText('');
                                setResponseStatus('resolved');
                                setIsResponseModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                              title="Send Response"
                            >
                              <Reply className="w-4 h-4 text-green-500 hover:text-green-700" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(contact.id, contact.status === 'resolved' ? 'pending' : 'resolved')}
                              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                              title={contact.status === 'resolved' ? 'Reopen' : 'Resolve'}
                            >
                              {contact.status === 'resolved' ? (
                                <Clock className="w-4 h-4 text-yellow-500 hover:text-yellow-700" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500 hover:text-green-700" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedContact(contact);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                            </button>
                            <button
                              onClick={() => setExpandedContact(isExpanded ? null : contact.id)}
                              className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                              title={isExpanded ? 'Hide Details' : 'View Details'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-secondary-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-secondary-400" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="py-4 px-4 bg-secondary-50">
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-secondary-900 mb-2">Message</h4>
                                  <p className="text-sm text-secondary-600 bg-white p-3 rounded-lg border border-secondary-200">
                                    {contact.message}
                                  </p>
                                  {contact.response && (
                                    <div className="mt-3">
                                      <h4 className="font-semibold text-secondary-900 mb-2">Response</h4>
                                      <p className="text-sm text-secondary-600 bg-green-50 p-3 rounded-lg border border-green-200">
                                        {contact.response}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-secondary-900 mb-2">Details</h4>
                                  <div className="bg-white p-3 rounded-lg border border-secondary-200 space-y-2">
                                    <p className="text-sm">
                                      <span className="font-medium">Created:</span>{' '}
                                      <span className="text-secondary-600">{formatDate(contact.created_at)}</span>
                                    </p>
                                    {contact.responded_at && (
                                      <p className="text-sm">
                                        <span className="font-medium">Responded:</span>{' '}
                                        <span className="text-secondary-600">{formatDate(contact.responded_at)}</span>
                                      </p>
                                    )}
                                    {contact.ip_address && (
                                      <p className="text-sm">
                                        <span className="font-medium">IP Address:</span>{' '}
                                        <span className="text-secondary-600">{contact.ip_address}</span>
                                      </p>
                                    )}
                                    {contact.user_agent && (
                                      <p className="text-sm">
                                        <span className="font-medium">User Agent:</span>{' '}
                                        <span className="text-secondary-600 text-xs">{contact.user_agent}</span>
                                      </p>
                                    )}
                                    {contact.admin_notes && (
                                      <p className="text-sm">
                                        <span className="font-medium">Admin Notes:</span>{' '}
                                        <span className="text-secondary-600">{contact.admin_notes}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ==========================================
            PAGINATION
            ========================================== */}
        {filteredContacts.length > 0 && (
          <div className="p-4 border-t border-secondary-200 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-secondary-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} contacts
              </p>
              {selectedIds.size > 0 && (
                <span className="text-sm text-primary-600 font-medium">
                  {selectedIds.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-secondary-400" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pageNum => (
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
              ))}
              {totalPages > 5 && <span className="text-secondary-400">...</span>}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
          VIEW CONTACT MODAL
          ========================================== */}
      {isViewModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-600" />
                  Contact Details
                </h2>
                <p className="text-sm text-secondary-500">
                  {selectedContact.name} - {selectedContact.email}
                </p>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedContact.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Priority</p>
                  <div className="mt-1">{getPriorityBadge(selectedContact.priority)}</div>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Category</p>
                  <div className="mt-1">{getCategoryBadge(selectedContact.category)}</div>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Date</p>
                  <p className="text-sm font-medium text-secondary-900">{formatDate(selectedContact.created_at)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-secondary-700">Subject</h4>
                <p className="text-base text-secondary-900 bg-gray-50 p-3 rounded-lg">{selectedContact.subject}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-secondary-700">Message</h4>
                <p className="text-sm text-secondary-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{selectedContact.message}</p>
              </div>

              {selectedContact.response && (
                <div>
                  <h4 className="text-sm font-semibold text-secondary-700">Response</h4>
                  <p className="text-sm text-secondary-600 bg-green-50 p-3 rounded-lg whitespace-pre-wrap border border-green-200">
                    {selectedContact.response}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setResponseText('');
                    setResponseStatus('resolved');
                    setIsResponseModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedContact(selectedContact);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          RESPONSE MODAL
          ========================================== */}
      {isResponseModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-green-600" />
                  Send Response
                </h2>
                <p className="text-sm text-secondary-500">
                  To: {selectedContact.name} ({selectedContact.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setIsResponseModalOpen(false);
                  setResponseText('');
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Response <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Type your response here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Update Status
                </label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="resolved">Resolved</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setIsResponseModalOpen(false);
                    setResponseText('');
                  }}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendResponse(selectedContact.id)}
                  disabled={isSubmitting || !responseText.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Response
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          DELETE CONFIRMATION MODAL
          ========================================== */}
      {isDeleteModalOpen && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold text-secondary-900">Delete Contact</h3>
              </div>
              <p className="text-secondary-600">
                Are you sure you want to delete this contact inquiry from{' '}
                <span className="font-semibold">{selectedContact.name}</span>?
                This action cannot be undone.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-secondary-500">
                  <span className="font-medium">Subject:</span> {selectedContact.subject}
                </p>
                <p className="text-sm text-secondary-500">
                  <span className="font-medium">Date:</span> {formatDate(selectedContact.created_at)}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(selectedContact.id)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          BULK DELETE MODAL
          ========================================== */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold text-secondary-900">Bulk Delete</h3>
              </div>
              <p className="text-secondary-600">
                Are you sure you want to delete <span className="font-semibold">{selectedIds.size}</span> selected contacts?
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;