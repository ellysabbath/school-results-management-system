import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen, User, X, Save } from 'lucide-react';
import { mockSubjects, mockTeachers } from '../../utils/mockData';
import toast from 'react-hot-toast';

const SubjectManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);
  
  const filteredSubjects = mockSubjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      toast.success('Subject deleted successfully');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(editingSubject ? 'Subject updated!' : 'Subject added!');
    setShowModal(false);
    setEditingSubject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Subjects</h1>
          <p className="text-secondary-500">Manage all subjects offered in your school</p>
        </div>
        <button
          onClick={() => {
            setEditingSubject(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search subjects by name, code, teacher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredSubjects.map((subject) => (
            <div key={subject.id} className="border border-secondary-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-secondary-900">{subject.name}</h4>
                    <p className="text-xs text-secondary-400">{subject.code}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingSubject(subject);
                      setShowModal(true);
                    }}
                    className="p-1.5 hover:bg-secondary-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4 text-secondary-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <User className="w-3.5 h-3.5 text-secondary-400" />
                  <span>{subject.teacherName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <span className="text-secondary-400">Class:</span>
                  <span>{subject.class}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-600">
                  <span className="text-secondary-400">Passing:</span>
                  <span>{subject.passingMarks} / {subject.maxMarks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-secondary-900">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSubject(null);
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-secondary-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    defaultValue={editingSubject?.name || ''}
                    required
                    className="input-field"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    defaultValue={editingSubject?.code || ''}
                    required
                    className="input-field"
                    placeholder="e.g., MATH101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Class *
                  </label>
                  <input
                    type="text"
                    defaultValue={editingSubject?.class || ''}
                    required
                    className="input-field"
                    placeholder="e.g., Grade 10A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Teacher *
                  </label>
                  <select
                    defaultValue={editingSubject?.teacherId || ''}
                    required
                    className="input-field"
                  >
                    <option value="">Select Teacher</option>
                    {mockTeachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Max Marks *
                  </label>
                  <input
                    type="number"
                    defaultValue={editingSubject?.maxMarks || 100}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    defaultValue={editingSubject?.passingMarks || 40}
                    required
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Description
                  </label>
                  <textarea
                    defaultValue={editingSubject?.description || ''}
                    rows={3}
                    className="input-field"
                    placeholder="Brief description of the subject"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-secondary-200">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSubject(null);
                  }}
                  className="px-6 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManager;