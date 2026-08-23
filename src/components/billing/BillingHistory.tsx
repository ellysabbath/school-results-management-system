import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { mockPayments } from '../../utils/mockData';
import { formatCurrency, formatDate } from '../../utils/helpers';

const BillingHistory: React.FC = () => {
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-50 text-green-600';
      case 'pending': return 'bg-yellow-50 text-yellow-600';
      case 'failed': return 'bg-red-50 text-red-600';
      case 'refunded': return 'bg-gray-50 text-gray-600';
      default: return 'bg-secondary-50 text-secondary-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/billing"
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-secondary-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Billing History</h1>
          <p className="text-secondary-500">View your payment history and invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <p className="text-sm text-secondary-500">Total Spent</p>
          <p className="text-2xl font-bold text-secondary-900">
            {formatCurrency(mockPayments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <p className="text-sm text-secondary-500">Total Invoices</p>
          <p className="text-2xl font-bold text-secondary-900">{mockPayments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <p className="text-sm text-secondary-500">Next Payment</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(59)}</p>
          <p className="text-xs text-secondary-400 mt-1">Due on September 1, 2026</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200">
          <h3 className="font-semibold text-secondary-900">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Method</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {mockPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-secondary-600">
                    {formatDate(payment.date)}
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-700">
                    {payment.description}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-600">
                    {payment.method}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
                      <FileText className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BillingHistory;