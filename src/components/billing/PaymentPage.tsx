import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, Lock, Shield, Check, AlertCircle, Loader2,
  Wallet, Building2, Smartphone, Banknote, Calendar, User,
  Mail, Phone, MapPin, FileText, Receipt, CheckCircle2,
  XCircle, Clock, DollarSign, Zap, Sparkles, Crown, Star,
  Upload, School, Hash, Send, CheckCircle, UserCircle, 
  Briefcase, PhoneCall, MessageCircle, Smartphone as SmartphoneIcon,
  CreditCard as CreditCardIcon, Building, Globe, Home,
  File, Image, Paperclip, Download, Printer
} from 'lucide-react';
import { paymentService } from '../../api/schoolApi';
import toast from 'react-hot-toast';

interface PaymentFormData {
  schoolName: string;
  schoolCode: string;
  email: string;
  phone: string;
  amount: number;
  planId: number;
  planName: string;
  telecomCompany: string;
  transactionReference: string;
  attachment: File | null;
  attachmentName: string;
}

interface TransactionStage {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  icon: React.ReactNode;
}

interface TeslaTransaction {
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
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { planId?: number; planName?: string; price?: number } || {};
  
  const [formData, setFormData] = useState<PaymentFormData>({
    schoolName: '',
    schoolCode: '',
    email: '',
    phone: '',
    amount: state.price || 0,
    planId: state.planId || 0,
    planName: state.planName || '',
    telecomCompany: '',
    transactionReference: '',
    attachment: null,
    attachmentName: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransactionStarted, setIsTransactionStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [savedTransaction, setSavedTransaction] = useState<TeslaTransaction | null>(null);

  // Telecom companies with React Icons
  const telecomCompanies = [
    { 
      id: 'vodacom', 
      name: 'Vodacom', 
      icon: <SmartphoneIcon className="w-5 h-5 text-green-600" />,
      color: 'bg-green-100 border-green-300 text-green-700',
      ussd: '*150*00#'
    },
    { 
      id: 'tigo', 
      name: 'Tigo', 
      icon: <SmartphoneIcon className="w-5 h-5 text-red-600" />,
      color: 'bg-red-100 border-red-300 text-red-700',
      ussd: '*150*01#'
    },
    { 
      id: 'airtel', 
      name: 'Airtel', 
      icon: <SmartphoneIcon className="w-5 h-5 text-yellow-600" />,
      color: 'bg-yellow-100 border-yellow-300 text-yellow-700',
      ussd: '*150*60#'
    },
    { 
      id: 'halotel', 
      name: 'Halotel', 
      icon: <SmartphoneIcon className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-100 border-blue-300 text-blue-700',
      ussd: '*150*88#'
    },
    { 
      id: 'ttcl', 
      name: 'TTCL', 
      icon: <Phone className="w-5 h-5 text-purple-600" />,
      color: 'bg-purple-100 border-purple-300 text-purple-700',
      ussd: '*150*44#'
    },
    { 
      id: 'zantel', 
      name: 'Zantel', 
      icon: <SmartphoneIcon className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-100 border-orange-300 text-orange-700',
      ussd: '*150*02#'
    },
  ];

  // Transaction stages based on selected telecom
  const getTransactionStages = (): TransactionStage[] => {
    const selectedTelecom = telecomCompanies.find(t => t.id === formData.telecomCompany);
    
    const baseStages = [
      {
        id: 1,
        name: 'Initiating Transaction',
        description: 'Connecting to payment gateway...',
        status: 'pending' as const,
        icon: <Send className="w-5 h-5" />,
      },
      {
        id: 2,
        name: 'Processing Payment',
        description: 'Verifying payment details...',
        status: 'pending' as const,
        icon: <Loader2 className="w-5 h-5" />,
      },
      {
        id: 3,
        name: 'Confirming Transaction',
        description: 'Awaiting confirmation from bank...',
        status: 'pending' as const,
        icon: <MessageCircle className="w-5 h-5" />,
      },
      {
        id: 4,
        name: 'Completing Payment',
        description: 'Finalizing your subscription...',
        status: 'pending' as const,
        icon: <CheckCircle className="w-5 h-5" />,
      },
    ];

    if (selectedTelecom) {
      return [
        {
          id: 0,
          name: `Dial ${selectedTelecom.ussd}`,
          description: `Dial the USSD code on your ${selectedTelecom.name} phone`,
          status: 'pending' as const,
          icon: <PhoneCall className="w-5 h-5" />,
        },
        ...baseStages,
      ];
    }
    
    return baseStages;
  };

  const [transactionStages, setTransactionStages] = useState<TransactionStage[]>([]);

  // Generate payment reference
  useEffect(() => {
    const generateReference = () => {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `PAY-${timestamp}-${random}`;
    };
    setPaymentReference(generateReference());
  }, []);

  // Initialize transaction stages when telecom is selected
  useEffect(() => {
    if (formData.telecomCompany) {
      const stages = getTransactionStages();
      setTransactionStages(stages.map(s => ({ ...s, status: 'pending' as const })));
      setCurrentStage(0);
    }
  }, [formData.telecomCompany]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a JPEG, PNG, or PDF file');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        attachment: file,
        attachmentName: file.name,
      }));
      
      toast.success(`File "${file.name}" uploaded successfully`);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      attachment: null,
      attachmentName: '',
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.schoolName || formData.schoolName.trim().length < 2) {
      newErrors.schoolName = 'Please enter the school name';
    }
    if (!formData.schoolCode || formData.schoolCode.trim().length < 2) {
      newErrors.schoolCode = 'Please enter the school code';
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Please enter the amount';
    }
    if (!formData.telecomCompany) {
      newErrors.telecomCompany = 'Please select a telecom company';
    }
    if (!formData.transactionReference || formData.transactionReference.trim().length < 3) {
      newErrors.transactionReference = 'Please enter the transaction reference';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Save transaction to backend
  const saveTransaction = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('school_code', formData.schoolCode);
      formDataToSend.append('admin_email', formData.email);
      formDataToSend.append('admin_name', formData.schoolName);
      formDataToSend.append('admin_phone', formData.phone);
      formDataToSend.append('amount', formData.amount.toString());
      formDataToSend.append('payment_method', formData.telecomCompany);
      formDataToSend.append('telecom_provider', formData.telecomCompany);
      formDataToSend.append('transaction_reference', formData.transactionReference);
      
      if (formData.planId) {
        formDataToSend.append('plan_id', formData.planId.toString());
      }
      if (formData.planName) {
        formDataToSend.append('plan_name', formData.planName);
      }
      if (formData.attachment) {
        formDataToSend.append('receipt_attachment', formData.attachment);
        formDataToSend.append('receipt_filename', formData.attachmentName);
      }
      if (formData.notes) {
        formDataToSend.append('notes', formData.notes);
      }

      const response = await paymentService.createTransaction(formDataToSend);
      console.log('[PaymentPage] Transaction saved:', response);
      
      setTransactionId(response.data.id);
      setSavedTransaction(response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('[PaymentPage] Failed to save transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to save transaction');
      throw error;
    }
  };

  // Update transaction stage
  const updateTransactionStage = async (action: string, data?: any) => {
    if (!transactionId) return;
    
    try {
      const response = await paymentService.processTransaction(transactionId, action, data);
      console.log('[PaymentPage] Stage updated:', response);
      return response;
    } catch (error: any) {
      console.error('[PaymentPage] Failed to update stage:', error);
    }
  };

  const startTransaction = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before proceeding');
      return;
    }

    setIsProcessing(true);
    setIsTransactionStarted(true);
    setShowConfirmation(true);

    try {
      // 1. Save transaction to backend
      const transaction = await saveTransaction();
      
      if (!transaction) {
        throw new Error('Failed to create transaction');
      }

      // 2. Simulate transaction stages
      let stageIndex = 0;
      const stages = transactionStages;
      
      const interval = setInterval(async () => {
        if (stageIndex < stages.length) {
          // Update current stage to processing
          setTransactionStages(prev => 
            prev.map((s, idx) => ({
              ...s,
              status: idx === stageIndex ? 'processing' as const : s.status
            }))
          );
          setCurrentStage(stageIndex);
          
          // Update backend stage
          const stageNames = ['ussd_dialed', 'processing', 'confirming', 'completed'];
          if (stageIndex < stageNames.length) {
            await updateTransactionStage(stageNames[stageIndex]);
          }
          
          // After 2 seconds, mark as completed
          setTimeout(async () => {
            setTransactionStages(prev => 
              prev.map((s, idx) => ({
                ...s,
                status: idx === stageIndex ? 'completed' as const : s.status
              }))
            );
            
            stageIndex++;
            
            if (stageIndex === stages.length) {
              clearInterval(interval);
              setTransactionComplete(true);
              setIsProcessing(false);
              
              // Complete transaction in backend
              await updateTransactionStage('complete');
              
              toast.success('Payment completed successfully!');
            }
          }, 2000);
        }
      }, 3000);
      
    } catch (error: any) {
      console.error('[PaymentPage] Transaction failed:', error);
      toast.error(error.message || 'Transaction failed');
      setIsProcessing(false);
      
      // Mark as failed in backend
      if (transactionId) {
        await updateTransactionStage('fail', { reason: error.message });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransaction();
  };

  // Get selected telecom
  const selectedTelecom = telecomCompanies.find(t => t.id === formData.telecomCompany);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-secondary-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-primary-600" />
            Make Payment
          </h1>
          <p className="text-secondary-500">
            Complete your payment to activate your subscription
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            {!showConfirmation ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Plan Summary */}
                {formData.planName && (
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary-900">Selected Plan</p>
                        <h3 className="text-lg font-bold text-primary-900">{formData.planName}</h3>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-primary-700">Amount</p>
                        <p className="text-xl font-bold text-primary-900">
                          {formatCurrency(formData.amount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* School Information */}
                <div>
                  <h3 className="text-sm font-medium text-secondary-900 mb-3 flex items-center gap-2">
                    <School className="w-4 h-4 text-primary-600" />
                    School Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        School Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="text"
                          name="schoolName"
                          value={formData.schoolName}
                          onChange={handleInputChange}
                          placeholder="Enter school name"
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.schoolName ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                          }`}
                        />
                      </div>
                      {errors.schoolName && (
                        <p className="text-xs text-red-500 mt-1">{errors.schoolName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        School Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="text"
                          name="schoolCode"
                          value={formData.schoolCode}
                          onChange={handleInputChange}
                          placeholder="e.g., SCH-001"
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.schoolCode ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                          }`}
                        />
                      </div>
                      {errors.schoolCode && (
                        <p className="text-xs text-red-500 mt-1">{errors.schoolCode}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-medium text-secondary-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary-600" />
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="school@example.com"
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+255 712 345 678"
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="text-sm font-medium text-secondary-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary-600" />
                    Payment Details
                  </h3>
                  <div className="space-y-4">
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
                              errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                            }`}
                            min="0"
                            step="100"
                          />
                        </div>
                        {errors.amount && (
                          <p className="text-xs text-red-500 mt-1">{errors.amount}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Telecom Company <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="telecomCompany"
                          value={formData.telecomCompany}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.telecomCompany ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                          }`}
                        >
                          <option value="">Select Telecom</option>
                          {telecomCompanies.map((telecom) => (
                            <option key={telecom.id} value={telecom.id}>
                              {telecom.name}
                            </option>
                          ))}
                        </select>
                        {errors.telecomCompany && (
                          <p className="text-xs text-red-500 mt-1">{errors.telecomCompany}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">
                        Transaction Reference <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                          type="text"
                          name="transactionReference"
                          value={formData.transactionReference}
                          onChange={handleInputChange}
                          placeholder="Enter transaction reference number"
                          className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.transactionReference ? 'border-red-500 focus:ring-red-500' : 'border-secondary-200'
                          }`}
                        />
                      </div>
                      {errors.transactionReference && (
                        <p className="text-xs text-red-500 mt-1">{errors.transactionReference}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Attachment */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Payment Receipt / Attachment
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors relative">
                    {formData.attachment ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <File className="w-8 h-8 text-primary-600" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-secondary-900">{formData.attachmentName}</p>
                            <p className="text-xs text-secondary-400">
                              {(formData.attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={removeFile}
                          className="p-1 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-secondary-400 mx-auto mb-2" />
                        <p className="text-sm text-secondary-500">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-secondary-400 mt-1">
                          JPEG, PNG, PDF (Max 5MB)
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      name="attachment"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept=".jpg,.jpeg,.png,.pdf"
                    />
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700">
                    Your payment information is secure and encrypted.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Proceed with Payment
                    </>
                  )}
                </button>
              </form>
            ) : (
              // Transaction Stages View
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-secondary-900">Transaction Progress</h3>
                  <span className="text-sm font-mono text-secondary-500">
                    Ref: {savedTransaction?.transaction_code || paymentReference}
                  </span>
                </div>

                {selectedTelecom && (
                  <div className={`p-3 rounded-lg border ${selectedTelecom.color}`}>
                    <div className="flex items-center gap-3">
                      {selectedTelecom.icon}
                      <div>
                        <p className="text-sm font-medium">Payment via {selectedTelecom.name}</p>
                        <p className="text-xs opacity-75">Reference: {formData.transactionReference}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {transactionStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                        stage.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : stage.status === 'processing'
                          ? 'bg-blue-50 border-blue-200 animate-pulse'
                          : stage.status === 'failed'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-secondary-50 border-secondary-200'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        stage.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : stage.status === 'processing'
                          ? 'bg-blue-100 text-blue-600'
                          : stage.status === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-secondary-200 text-secondary-400'
                      }`}>
                        {stage.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : stage.status === 'processing' ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : stage.status === 'failed' ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          stage.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          stage.status === 'completed'
                            ? 'text-green-700'
                            : stage.status === 'processing'
                            ? 'text-blue-700'
                            : stage.status === 'failed'
                            ? 'text-red-700'
                            : 'text-secondary-500'
                        }`}>
                          {stage.name}
                        </p>
                        <p className={`text-sm ${
                          stage.status === 'completed'
                            ? 'text-green-600'
                            : stage.status === 'processing'
                            ? 'text-blue-600'
                            : stage.status === 'failed'
                            ? 'text-red-600'
                            : 'text-secondary-400'
                        }`}>
                          {stage.status === 'completed' 
                            ? '✓ Completed' 
                            : stage.status === 'processing'
                            ? 'Processing...'
                            : stage.status === 'failed'
                            ? '✗ Failed'
                            : stage.description}
                        </p>
                      </div>
                      {stage.status === 'completed' && (
                        <div className="text-green-600">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {transactionComplete && (
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700">Payment Successful!</h3>
                    <p className="text-sm text-green-600 mt-1">
                      Your payment has been processed successfully.
                    </p>
                    {savedTransaction?.transaction_code && (
                      <p className="text-xs text-green-500 mt-1 font-mono">
                        Transaction Code: {savedTransaction.transaction_code}
                      </p>
                    )}
                    <div className="mt-4 space-x-3">
                      <button
                        onClick={() => navigate('/billing')}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        View Billing
                      </button>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                      >
                        Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">School</span>
                <span className="font-medium text-secondary-900">
                  {formData.schoolName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Plan</span>
                <span className="font-medium text-secondary-900">
                  {formData.planName || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Telecom</span>
                <span className="font-medium text-secondary-900">
                  {selectedTelecom?.name || 'N/A'}
                </span>
              </div>
              <div className="border-t border-secondary-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-secondary-900 font-medium">Total</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(formData.amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-3">Security</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">Encrypted Connection</p>
                  <p className="text-xs text-secondary-400">256-bit SSL encryption</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-secondary-900">PCI Compliant</p>
                  <p className="text-xs text-secondary-400">Strict security standards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Telecoms */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h4 className="text-sm font-medium text-secondary-900 mb-3">Supported Telecoms</h4>
            <div className="flex flex-wrap gap-2">
              {telecomCompanies.map((telecom) => (
                <div
                  key={telecom.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${telecom.color}`}
                >
                  {telecom.icon}
                  {telecom.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;