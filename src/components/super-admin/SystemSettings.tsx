import React, { useState } from 'react';
import { 
  Save, Server, Shield, Bell, Mail, Globe, 
  DollarSign, CreditCard, Users, Lock, AlertCircle,
  Check, X, Settings as SettingsIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // General
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultTrialDays: 30,
    currency: 'USD',
    
    // Payment
    paymentGateway: 'stripe' as 'stripe' | 'paypal' | 'both',
    
    // Email
    fromEmail: 'noreply@schoolmanager.com',
    fromName: 'SchoolManager',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    
    // Notifications
    newRegistration: true,
    paymentSuccess: true,
    paymentFailure: true,
    subscriptionExpiry: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('System settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary-600" />
          System Settings
        </h1>
        <p className="text-secondary-500">Configure global system settings and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Server className="w-4 h-4" />
            General Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Default Trial Days
              </label>
              <input
                type="number"
                name="defaultTrialDays"
                value={settings.defaultTrialDays}
                onChange={handleChange}
                className="input-field"
                min="1"
                max="90"
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
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="NGN">NGN (₦)</option>
                <option value="KES">KES (KSh)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="allowNewRegistrations"
                  checked={settings.allowNewRegistrations}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Allow new school registrations</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Maintenance mode (system offline)</span>
              </label>
              {settings.maintenanceMode && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs text-yellow-700">Maintenance mode is enabled. Only admins can access the system.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Payment Gateway
              </label>
              <select
                name="paymentGateway"
                value={settings.paymentGateway}
                onChange={handleChange}
                className="input-field"
              >
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                From Email
              </label>
              <input
                type="email"
                name="fromEmail"
                value={settings.fromEmail}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                From Name
              </label>
              <input
                type="text"
                name="fromName"
                value={settings.fromName}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                name="smtpHost"
                value={settings.smtpHost}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                SMTP Port
              </label>
              <input
                type="number"
                name="smtpPort"
                value={settings.smtpPort}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="newRegistration"
                checked={settings.newRegistration}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Notify on new school registration</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="paymentSuccess"
                checked={settings.paymentSuccess}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Notify on successful payment</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="paymentFailure"
                checked={settings.paymentFailure}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Notify on payment failure</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="subscriptionExpiry"
                checked={settings.subscriptionExpiry}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Notify on subscription expiry</span>
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                name="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={handleChange}
                className="input-field"
                min="5"
                max="480"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Max Login Attempts
              </label>
              <input
                type="number"
                name="maxLoginAttempts"
                value={settings.maxLoginAttempts}
                onChange={handleChange}
                className="input-field"
                min="3"
                max="10"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Enable two-factor authentication for all users</span>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save All Settings
          </button>
          <button
            type="button"
            className="px-6 py-2.5 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
          >
            Reset to Default
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;