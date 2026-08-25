import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, Server, Shield, Bell, Mail,
  DollarSign,  Lock, AlertCircle,
  Check, X, Settings as SettingsIcon, Loader2,
  RefreshCw, CheckCircle,
  Smartphone, Banknote, Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { systemService } from '../../api/schoolApi';
import toast from 'react-hot-toast';

interface SystemSetting {
  id: number;
  key: string;
  value: any;
  type: string;
  description: string;
  is_public: boolean;
}

interface SettingsState {
  // General
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  default_trial_days: number;
  currency: string;
  
  // Payment - Tanzania Gateways
  payment_gateway: string;
  mpesa_enabled: boolean;
  airtel_money_enabled: boolean;
  yas_enabled: boolean;
  crdb_enabled: boolean;
  nmb_enabled: boolean;
  
  // Payment - Tanzania Mobile Money
  mpesa_api_key: string;
  mpesa_secret_key: string;
  airtel_api_key: string;
  airtel_secret_key: string;
  yas_api_key: string;
  yas_secret_key: string;
  
  // Email
  from_email: string;
  from_name: string;
  smtp_host: string;
  smtp_port: number;
  
  // Notifications
  notify_new_registration: boolean;
  notify_payment_success: boolean;
  notify_payment_failure: boolean;
  notify_subscription_expiry: boolean;
  
  // Security
  two_factor_auth: boolean;
  session_timeout: number;
  max_login_attempts: number;
}

const SystemSettings: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const [settings, setSettings] = useState<SettingsState>({
    maintenance_mode: false,
    allow_new_registrations: true,
    default_trial_days: 30,
    currency: 'TZS',
    payment_gateway: 'mpesa',
    mpesa_enabled: true,
    airtel_money_enabled: false,
    yas_enabled: false,
    crdb_enabled: false,
    nmb_enabled: false,
    mpesa_api_key: '',
    mpesa_secret_key: '',
    airtel_api_key: '',
    airtel_secret_key: '',
    yas_api_key: '',
    yas_secret_key: '',
    from_email: 'noreply@schoolmanager.com',
    from_name: 'SchoolManager',
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    notify_new_registration: true,
    notify_payment_success: true,
    notify_payment_failure: true,
    notify_subscription_expiry: true,
    two_factor_auth: false,
    session_timeout: 60,
    max_login_attempts: 5,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await systemService.getSettings();
      const settingsData = response.results || response;
      
      const newSettings: any = { ...settings };
      
      settingsData.forEach((setting: SystemSetting) => {
        switch (setting.key) {
          case 'maintenance_mode':
            newSettings.maintenance_mode = setting.value;
            break;
          case 'allow_new_registrations':
            newSettings.allow_new_registrations = setting.value;
            break;
          case 'default_trial_days':
            newSettings.default_trial_days = setting.value;
            break;
          case 'currency':
            newSettings.currency = setting.value;
            break;
          case 'payment_gateway':
            newSettings.payment_gateway = setting.value;
            break;
          case 'mpesa_enabled':
            newSettings.mpesa_enabled = setting.value;
            break;
          case 'airtel_money_enabled':
            newSettings.airtel_money_enabled = setting.value;
            break;
          case 'yas_enabled':
            newSettings.yas_enabled = setting.value;
            break;
          case 'crdb_enabled':
            newSettings.crdb_enabled = setting.value;
            break;
          case 'nmb_enabled':
            newSettings.nmb_enabled = setting.value;
            break;
          case 'mpesa_api_key':
            newSettings.mpesa_api_key = setting.value || '';
            break;
          case 'mpesa_secret_key':
            newSettings.mpesa_secret_key = setting.value || '';
            break;
          case 'airtel_api_key':
            newSettings.airtel_api_key = setting.value || '';
            break;
          case 'airtel_secret_key':
            newSettings.airtel_secret_key = setting.value || '';
            break;
          case 'yas_api_key':
            newSettings.yas_api_key = setting.value || '';
            break;
          case 'yas_secret_key':
            newSettings.yas_secret_key = setting.value || '';
            break;
          case 'from_email':
            newSettings.from_email = setting.value;
            break;
          case 'from_name':
            newSettings.from_name = setting.value;
            break;
          case 'smtp_host':
            newSettings.smtp_host = setting.value;
            break;
          case 'smtp_port':
            newSettings.smtp_port = setting.value;
            break;
          case 'notify_new_registration':
            newSettings.notify_new_registration = setting.value;
            break;
          case 'notify_payment_success':
            newSettings.notify_payment_success = setting.value;
            break;
          case 'notify_payment_failure':
            newSettings.notify_payment_failure = setting.value;
            break;
          case 'notify_subscription_expiry':
            newSettings.notify_subscription_expiry = setting.value;
            break;
          case 'two_factor_auth':
            newSettings.two_factor_auth = setting.value;
            break;
          case 'session_timeout':
            newSettings.session_timeout = setting.value;
            break;
          case 'max_login_attempts':
            newSettings.max_login_attempts = setting.value;
            break;
          default:
            break;
        }
      });
      
      setSettings(newSettings);
      
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      setError(error.response?.data?.message || 'Failed to load settings');
      toast.error('Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load settings on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
    setSaved(false);
  };

  // Prepare settings for API
  const prepareSettingsForAPI = () => {
    const settingsArray = [
      { key: 'maintenance_mode', value: settings.maintenance_mode },
      { key: 'allow_new_registrations', value: settings.allow_new_registrations },
      { key: 'default_trial_days', value: settings.default_trial_days },
      { key: 'currency', value: settings.currency },
      { key: 'payment_gateway', value: settings.payment_gateway },
      { key: 'mpesa_enabled', value: settings.mpesa_enabled },
      { key: 'airtel_money_enabled', value: settings.airtel_money_enabled },
      { key: 'yas_enabled', value: settings.yas_enabled },
      { key: 'crdb_enabled', value: settings.crdb_enabled },
      { key: 'nmb_enabled', value: settings.nmb_enabled },
      { key: 'mpesa_api_key', value: settings.mpesa_api_key },
      { key: 'mpesa_secret_key', value: settings.mpesa_secret_key },
      { key: 'airtel_api_key', value: settings.airtel_api_key },
      { key: 'airtel_secret_key', value: settings.airtel_secret_key },
      { key: 'yas_api_key', value: settings.yas_api_key },
      { key: 'yas_secret_key', value: settings.yas_secret_key },
      { key: 'from_email', value: settings.from_email },
      { key: 'from_name', value: settings.from_name },
      { key: 'smtp_host', value: settings.smtp_host },
      { key: 'smtp_port', value: settings.smtp_port },
      { key: 'notify_new_registration', value: settings.notify_new_registration },
      { key: 'notify_payment_success', value: settings.notify_payment_success },
      { key: 'notify_payment_failure', value: settings.notify_payment_failure },
      { key: 'notify_subscription_expiry', value: settings.notify_subscription_expiry },
      { key: 'two_factor_auth', value: settings.two_factor_auth },
      { key: 'session_timeout', value: settings.session_timeout },
      { key: 'max_login_attempts', value: settings.max_login_attempts },
    ];
    
    return settingsArray;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError(null);
    
    try {
      const settingsData = prepareSettingsForAPI();
      const response = await systemService.bulkUpdateSettings(settingsData);
      
      if (response.status === 'success') {
        toast.success('System settings updated successfully!');
        setSaved(true);
        await fetchSettings();
      } else {
        toast.error(response.message || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save settings';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsReset(true);
    setError(null);
    
    const defaultSettings: SettingsState = {
      maintenance_mode: false,
      allow_new_registrations: true,
      default_trial_days: 30,
      currency: 'TZS',
      payment_gateway: 'mpesa',
      mpesa_enabled: true,
      airtel_money_enabled: false,
      yas_enabled: false,
      crdb_enabled: false,
      nmb_enabled: false,
      mpesa_api_key: '',
      mpesa_secret_key: '',
      airtel_api_key: '',
      airtel_secret_key: '',
      yas_api_key: '',
      yas_secret_key: '',
      from_email: 'noreply@schoolmanager.com',
      from_name: 'SchoolManager',
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      notify_new_registration: true,
      notify_payment_success: true,
      notify_payment_failure: true,
      notify_subscription_expiry: true,
      two_factor_auth: false,
      session_timeout: 60,
      max_login_attempts: 5,
    };
    
    try {
      const settingsData = Object.entries(defaultSettings).map(([key, value]) => ({
        key,
        value,
      }));
      
      await systemService.bulkUpdateSettings(settingsData);
      
      setSettings(defaultSettings);
      toast.success('Settings reset to defaults');
      setSaved(true);
      await fetchSettings();
    } catch (error: any) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setIsReset(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900">Please Login</h3>
          <p className="text-secondary-500">You need to be logged in to manage system settings</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-secondary-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary-600" />
            System Settings
          </h1>
          <p className="text-secondary-500">Configure global system settings and preferences</p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm"
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {saved && !error && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>Settings saved successfully!</span>
          <button
            onClick={() => setSaved(false)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-primary-500" />
            General Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Default Trial Days
              </label>
              <input
                type="number"
                name="default_trial_days"
                value={settings.default_trial_days}
                onChange={handleChange}
                className="input-field"
                min="1"
                max="90"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleChange}
                className="input-field"
                disabled={isSaving}
              >
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allow_new_registrations"
                  checked={settings.allow_new_registrations}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  disabled={isSaving}
                />
                <span className="text-sm text-secondary-700">Allow new school registrations</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  disabled={isSaving}
                />
                <span className="text-sm text-secondary-700">Maintenance mode (system offline)</span>
              </label>
              {settings.maintenance_mode && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-yellow-700">Maintenance mode is enabled. Only admins can access the system.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Settings - Tanzania Gateways */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-500" />
            Payment Settings - Tanzania
          </h3>
          
          <div className="space-y-4">
            {/* Default Payment Gateway */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Default Payment Gateway
              </label>
              <select
                name="payment_gateway"
                value={settings.payment_gateway}
                onChange={handleChange}
                className="input-field"
                disabled={isSaving}
              >
                <option value="mpesa">M-Pesa</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="yas">YAS (Yetu SACCOS)</option>
                <option value="crdb">CRDB Bank</option>
                <option value="nmb">NMB Bank</option>
              </select>
            </div>

            {/* Payment Gateway Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-secondary-700">M-Pesa</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="mpesa_enabled"
                      checked={settings.mpesa_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
                {settings.mpesa_enabled && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      name="mpesa_api_key"
                      value={settings.mpesa_api_key}
                      onChange={handleChange}
                      placeholder="M-Pesa API Key"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                    <input
                      type="password"
                      name="mpesa_secret_key"
                      value={settings.mpesa_secret_key}
                      onChange={handleChange}
                      placeholder="M-Pesa Secret Key"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-secondary-700">Airtel Money</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="airtel_money_enabled"
                      checked={settings.airtel_money_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
                {settings.airtel_money_enabled && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      name="airtel_api_key"
                      value={settings.airtel_api_key}
                      onChange={handleChange}
                      placeholder="Airtel Money API Key"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                    <input
                      type="password"
                      name="airtel_secret_key"
                      value={settings.airtel_secret_key}
                      onChange={handleChange}
                      placeholder="Airtel Money Secret Key"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-secondary-700">YAS (Yetu SACCOS)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="yas_enabled"
                      checked={settings.yas_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>
                {settings.yas_enabled && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      name="yas_api_key"
                      value={settings.yas_api_key}
                      onChange={handleChange}
                      placeholder="YAS API Key"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                    <input
                      type="password"
                      name="yas_secret_key"
                      value={settings.yas_secret_key}
                      onChange={handleChange}
                      placeholder="YAS Secret Key"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-secondary-700">CRDB Bank</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="crdb_enabled"
                      checked={settings.crdb_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {settings.crdb_enabled && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      name="crdb_api_key"
                      value=""
                      onChange={handleChange}
                      placeholder="CRDB Client ID"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                    <input
                      type="password"
                      name="crdb_secret"
                      value=""
                      onChange={handleChange}
                      placeholder="CRDB Client Secret"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border border-secondary-200 rounded-lg md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-secondary-700">NMB Bank</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="nmb_enabled"
                      checked={settings.nmb_enabled}
                      onChange={handleChange}
                      className="sr-only peer"
                      disabled={isSaving}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {settings.nmb_enabled && (
                  <div className="mt-3 space-y-2">
                    <input
                      type="text"
                      name="nmb_api_key"
                      value=""
                      onChange={handleChange}
                      placeholder="NMB Merchant ID"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                    <input
                      type="password"
                      name="nmb_secret_key"
                      value=""
                      onChange={handleChange}
                      placeholder="NMB API Key"
                      className="input-field text-sm"
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-secondary-400 mt-2">
              <p>💡 Enable payment gateways and enter API credentials to accept payments.</p>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary-500" />
            Email Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                From Email
              </label>
              <input
                type="email"
                name="from_email"
                value={settings.from_email}
                onChange={handleChange}
                className="input-field"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                From Name
              </label>
              <input
                type="text"
                name="from_name"
                value={settings.from_name}
                onChange={handleChange}
                className="input-field"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                name="smtp_host"
                value={settings.smtp_host}
                onChange={handleChange}
                className="input-field"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                name="smtp_port"
                value={settings.smtp_port}
                onChange={handleChange}
                className="input-field"
                min="1"
                max="9999"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-500" />
            Notification Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notify_new_registration"
                checked={settings.notify_new_registration}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                disabled={isSaving}
              />
              <span className="text-sm text-secondary-700">Notify on new school registration</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notify_payment_success"
                checked={settings.notify_payment_success}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                disabled={isSaving}
              />
              <span className="text-sm text-secondary-700">Notify on successful payment</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notify_payment_failure"
                checked={settings.notify_payment_failure}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                disabled={isSaving}
              />
              <span className="text-sm text-secondary-700">Notify on payment failure</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="notify_subscription_expiry"
                checked={settings.notify_subscription_expiry}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                disabled={isSaving}
              />
              <span className="text-sm text-secondary-700">Notify on subscription expiry</span>
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-500" />
            Security Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                name="session_timeout"
                value={settings.session_timeout}
                onChange={handleChange}
                className="input-field"
                min="5"
                max="480"
                disabled={isSaving}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Max Login Attempts
              </label>
              <input
                type="number"
                name="max_login_attempts"
                value={settings.max_login_attempts}
                onChange={handleChange}
                className="input-field"
                min="3"
                max="10"
                disabled={isSaving}
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="two_factor_auth"
                  checked={settings.two_factor_auth}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                  disabled={isSaving}
                />
                <span className="text-sm text-secondary-700">Enable two-factor authentication for all users</span>
              </label>
              {settings.two_factor_auth && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    Two-factor authentication will be required for all users when logging in.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Settings
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isReset}
            className="flex items-center gap-2 px-6 py-2.5 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700 disabled:opacity-50"
          >
            {isReset ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
            Reset to Default
          </button>
          {saved && !error && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Settings saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;