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
  File,
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
  attachmentBase64: string;
  notes: string;
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
    attachmentBase64: '',
    notes: '',
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
  const [showFinalConfirmation, setShowFinalConfirmation] = useState(false);
  const [whatsappNumber] = useState('+255742578691');

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
        // Convert to base64
        const base64 = await fileToBase64(file);
        
        setFormData(prev => ({
          ...prev,
          attachment: file,
          attachmentName: file.name,
          attachmentBase64: base64,
        }));
        
        toast.success(`File "${file.name}" uploaded successfully`);
      } catch (error) {
        console.error('Failed to convert file to base64:', error);
        toast.error('Failed to process file');
      }
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      attachment: null,
      attachmentName: '',
      attachmentBase64: '',
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
      const payload: any = {
        school_code: formData.schoolCode,
        admin_email: formData.email,
        admin_name: formData.schoolName,
        admin_phone: formData.phone,
        amount: formData.amount,
        payment_method: formData.telecomCompany,
        telecom_provider: formData.telecomCompany,
        transaction_reference: formData.transactionReference,
        notes: formData.notes || '',
      };

      if (formData.planId) {
        payload.plan_id = formData.planId;
      }
      if (formData.planName) {
        payload.plan_name = formData.planName;
      }

      // Send file as base64 if available
      if (formData.attachmentBase64) {
        payload.receipt_attachment_base64 = formData.attachmentBase64;
        payload.receipt_filename = formData.attachmentName;
      }

      console.log('[PaymentPage] Sending payload:', payload);

      const response = await paymentService.createTransaction(payload);
      console.log('[PaymentPage] Transaction saved:', response);
      
      setTransactionId(response.data.id);
      setSavedTransaction(response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('[PaymentPage] Failed to save transaction:', error);
      
      // If 404, show the URL issue
      if (error.response?.status === 404) {
        toast.error('Payment endpoint not found. Please check the URL configuration.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save transaction');
      }
      throw error;
    }
  };

  // Send data via WhatsApp
  const sendWhatsAppMessage = () => {
    const message = `
📋 *PAYMENT CONFIRMATION*

*Transaction Details:*
🏫 School: ${formData.schoolName}
📝 School Code: ${formData.schoolCode}
📧 Email: ${formData.email}
📱 Phone: ${formData.phone}
💰 Amount: ${formatCurrency(formData.amount)}
📋 Plan: ${formData.planName || 'N/A'}
📡 Telecom: ${formData.telecomCompany}
🔢 Reference: ${formData.transactionReference}
📎 Attachment: ${formData.attachmentName || 'None'}

*Transaction Code:* ${savedTransaction?.transaction_code || paymentReference}
*Status:* ✅ Completed
*Date:* ${new Date().toLocaleString()}

Thank you for your payment!
    `.trim();

    // Encode message for WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    
    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank');
    
    toast.success('Opening WhatsApp to send confirmation...');
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
          
          // After 2 seconds, mark as completed
          setTimeout(() => {
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
              
              // Show final confirmation modal
              setShowFinalConfirmation(true);
              
              toast.success('Payment completed successfully!');
            }
          }, 2000);
        }
      }, 3000);
      
    } catch (error: any) {
      console.error('[PaymentPage] Transaction failed:', error);
      toast.error(error.message || 'Transaction failed');
      setIsProcessing(false);
      setShowConfirmation(false);
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
                    Payment Receipt / Attachment (Optional)
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
                          Any file format supported (No size limit)
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      name="attachment"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional information..."
                    className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                  />
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

                {transactionComplete && !showFinalConfirmation && (
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700">Payment Successful!</h3>
                    <p className="text-sm text-green-600 mt-1">
                      Your payment has been processed successfully.
                    </p>
                    <button
                      onClick={() => setShowFinalConfirmation(true)}
                      className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Continue
                    </button>
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

      {/* Final Confirmation Modal */}
      {showFinalConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-secondary-900 mb-2">
                Payment Confirmed!
              </h2>
              <p className="text-secondary-500 text-sm mb-4">
                Your payment has been successfully processed.
              </p>

              <div className="bg-secondary-50 rounded-lg p-4 text-left mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Transaction Code:</span>
                    <span className="font-mono font-medium text-secondary-900">
                      {savedTransaction?.transaction_code || paymentReference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">School:</span>
                    <span className="font-medium text-secondary-900">{formData.schoolName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Amount:</span>
                    <span className="font-bold text-primary-600">{formatCurrency(formData.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Telecom:</span>
                    <span className="font-medium text-secondary-900">{selectedTelecom?.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={sendWhatsAppMessage}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Send via WhatsApp
                </button>
                <button
                  onClick={() => navigate('/billing')}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Go to Billing
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 border border-secondary-200 hover:bg-secondary-50 text-secondary-700 font-medium rounded-lg transition-colors"
                >
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;