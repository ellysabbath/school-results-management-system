import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { mockTeachers } from '../../utils/mockData';
import toast from 'react-hot-toast';

const TeacherForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const existingTeacher = mockTeachers.find(t => t.id === id);
  
  const [formData, setFormData] = useState({
    firstName: existingTeacher?.firstName || '',
    lastName: existingTeacher?.lastName || '',
    email: existingTeacher?.email || '',
    employeeId: existingTeacher?.employeeId || '',
    department: existingTeacher?.department || '',
    designation: existingTeacher?.designation || '',
    qualification: existingTeacher?.qualification || '',
    joiningDate: existingTeacher?.joiningDate || '',
    phone: existingTeacher?.phone || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(isEditing ? 'Teacher updated successfully!' : 'Teacher added successfully!');
    navigate('/teachers');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teachers')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
            </h1>
            <p className="text-secondary-500">
              {isEditing ? 'Update teacher information' : 'Enter teacher details to add to the system'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teachers')}
            className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Update Teacher' : 'Add Teacher'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-secondary-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Employee ID *</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="e.g., EMP-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Department *</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="e.g., Mathematics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Designation</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., Senior Teacher"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Qualification</label>
            <input
              type="text"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., M.Sc. Mathematics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Joining Date</label>
            <input
              type="date"
              name="joiningDate"
              value={formData.joiningDate}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;