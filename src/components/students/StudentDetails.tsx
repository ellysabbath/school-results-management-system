import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Mail, Phone, Calendar, 
  BookOpen, Award, TrendingUp, Download, Printer, Share2 
} from 'lucide-react';
import { mockStudents, mockResults } from '../../utils/mockData';

const StudentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const student = mockStudents.find(s => s.id === id);
  const studentResults = mockResults.filter(r => r.studentId === id);
  const publishedResults = studentResults.filter(r => r.isPublished);
  const average = publishedResults.length > 0 
    ? publishedResults.reduce((acc, r) => acc + r.percentage, 0) / publishedResults.length 
    : 0;

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary-500">Student not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/students')}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">{student.firstName} {student.lastName}</h1>
            <p className="text-secondary-500">Admission: {student.admissionNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
            <Printer className="w-4 h-4 text-secondary-400" />
          </button>
          <button className="p-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
            <Share2 className="w-4 h-4 text-secondary-400" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary-400">Full Name</p>
                <p className="text-sm font-medium text-secondary-900">{student.firstName} {student.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Admission Number</p>
                <p className="text-sm font-medium text-secondary-900">{student.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Email</p>
                <p className="text-sm font-medium text-secondary-900 flex items-center gap-2">
                  <Mail className="w-3 h-3 text-secondary-400" />
                  {student.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Date of Birth</p>
                <p className="text-sm font-medium text-secondary-900 flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-secondary-400" />
                  {new Date(student.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Gender</p>
                <p className="text-sm font-medium text-secondary-900 capitalize">{student.gender}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Class</p>
                <p className="text-sm font-medium text-secondary-900">{student.class}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-4">Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-secondary-400">Guardian Name</p>
                <p className="text-sm font-medium text-secondary-900">{student.guardianName}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Guardian Phone</p>
                <p className="text-sm font-medium text-secondary-900 flex items-center gap-2">
                  <Phone className="w-3 h-3 text-secondary-400" />
                  {student.guardianPhone}
                </p>
              </div>
              {student.guardianEmail && (
                <div>
                  <p className="text-xs text-secondary-400">Guardian Email</p>
                  <p className="text-sm font-medium text-secondary-900 flex items-center gap-2">
                    <Mail className="w-3 h-3 text-secondary-400" />
                    {student.guardianEmail}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 text-3xl font-bold mx-auto">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mt-3">{student.firstName} {student.lastName}</h3>
            <p className="text-sm text-secondary-500">{student.class}</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <div>
                <p className="text-xs text-secondary-400">Average</p>
                <p className="text-xl font-bold text-secondary-900">{average.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Subjects</p>
                <p className="text-xl font-bold text-secondary-900">{publishedResults.length}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Status</p>
                <span className="inline-block px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="text-sm font-semibold text-secondary-700 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm">
                <BookOpen className="w-4 h-4" />
                View Results
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm">
                <Award className="w-4 h-4" />
                Generate Report Card
              </button>
              <button className="w-full flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm">
                <TrendingUp className="w-4 h-4" />
                Performance Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 p-6">
        <h3 className="text-sm font-semibold text-secondary-700 mb-4">Academic Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase">Term</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase">Exam Type</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase">Marks</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase">Percentage</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase">Grade</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {studentResults.map((result) => (
                <tr key={result.id} className="hover:bg-secondary-50">
                  <td className="py-3 px-4 text-sm text-secondary-700">{result.subjectName}</td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{result.term}</td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{result.examType}</td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{result.marksObtained}/{result.totalMarks}</td>
                  <td className="py-3 px-4 text-sm font-medium text-secondary-700">{result.percentage}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.grade === 'A+' ? 'bg-green-100 text-green-700' :
                      result.grade === 'A' ? 'bg-green-50 text-green-600' :
                      result.grade === 'B+' ? 'bg-blue-50 text-blue-600' :
                      result.grade === 'B' ? 'bg-blue-50 text-blue-600' :
                      result.grade === 'C' ? 'bg-yellow-50 text-yellow-600' :
                      result.grade === 'D' ? 'bg-orange-50 text-orange-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.isPublished ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {result.isPublished ? 'Published' : 'Pending'}
                    </span>
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

export default StudentDetails;