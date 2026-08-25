import React, { useState } from 'react';
import { 
  Save, Building2, Mail, Phone, MapPin, Globe, 
  Bell, Shield, Palette,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const SchoolSettings: React.FC = () => {
  const { user, school } = useAuth();
  
  const [settings, setSettings] = useState({
    schoolName: school?.name || '',
    email: school?.email || user?.email || '',
    phone: user?.phone || '',  // Use user phone as fallback since SchoolInfo may not have phone
    address: (school as any)?.address || '',
    timezone: 'Africa/Dar_es_Salaam',
    dateFormat: 'DD/MM/YYYY',
    academicYearStart: new Date().getFullYear() + '-09-01',
    academicYearEnd: (new Date().getFullYear() + 1) + '-06-30',
    allowStudentRegistration: true,
    allowParentAccess: true,
    emailNotifications: true,
    smsNotifications: false,
    themeColor: 'blue',
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
    toast.success('Settings updated successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">School Settings</h1>
        <p className="text-secondary-500">Manage your school profile and preferences</p>
        {school && (
          <p className="text-xs text-secondary-400 mt-1">
            {school.name} {school.school_code && `(${school.school_code})`}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            School Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                School Name *
              </label>
              <input
                type="text"
                name="schoolName"
                value={settings.schoolName}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                School Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  required
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="url"
                  name="website"
                  placeholder="https://www.school.edu"
                  className="input-field pl-10"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-secondary-400" />
                <textarea
                  name="address"
                  value={settings.address}
                  onChange={handleChange}
                  rows={2}
                  className="input-field pl-10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance & Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Theme Color
              </label>
              <select
                name="themeColor"
                value={settings.themeColor}
                onChange={handleChange}
                className="input-field"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="orange">Orange</option>
                <option value="red">Red</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Date Format
              </label>
              <select
                name="dateFormat"
                value={settings.dateFormat}
                onChange={handleChange}
                className="input-field"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Timezone
              </label>
              <select
                name="timezone"
                value={settings.timezone}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Africa/Dar_es_Salaam">East Africa Time (EAT)</option>
                <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                <option value="Africa/Kampala">East Africa Time (EAT)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Academic Year
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="academicYearStart"
                  value={settings.academicYearStart}
                  onChange={handleChange}
                  className="input-field text-sm"
                />
                <input
                  type="date"
                  name="academicYearEnd"
                  value={settings.academicYearEnd}
                  onChange={handleChange}
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Settings
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={settings.emailNotifications}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Email notifications for results and updates</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="smsNotifications"
                checked={settings.smsNotifications}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">SMS notifications for critical alerts</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="text-sm font-semibold text-secondary-700 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Access Control
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allowStudentRegistration"
                checked={settings.allowStudentRegistration}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Allow student self-registration</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allowParentAccess"
                checked={settings.allowParentAccess}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">Allow parent access to student results</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
          <button
            type="button"
            onClick={() => {
              setSettings({
                schoolName: school?.name || '',
                email: school?.email || user?.email || '',
                phone: user?.phone || '',  // Use user phone as fallback
                address: (school as any)?.address || '',
                timezone: 'Africa/Dar_es_Salaam',
                dateFormat: 'DD/MM/YYYY',
                academicYearStart: new Date().getFullYear() + '-09-01',
                academicYearEnd: (new Date().getFullYear() + 1) + '-06-30',
                allowStudentRegistration: true,
                allowParentAccess: true,
                emailNotifications: true,
                smsNotifications: false,
                themeColor: 'blue',
              });
              toast('Settings reset', { icon: '🔄' });
            }}
            className="px-6 py-2.5 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchoolSettings;