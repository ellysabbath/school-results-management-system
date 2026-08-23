import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Share2, Calendar, Award, TrendingUp } from 'lucide-react';
import { mockStudents, mockResults } from '../../utils/mockData';
import { getGradeColor } from '../../utils/mockData';

const ReportCard: React.FC = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const student = mockStudents.find(s => s.id === studentId) || mockStudents[0];
  const studentResults = mockResults.filter(r => r.studentId === student.id && r.isPublished);
  const average = studentResults.reduce((acc, r) => acc + r.percentage, 0) / studentResults.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Report Card</h1>
            <p className="text-secondary-500">Academic performance report</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Report Card */}
      <div className="bg-white rounded-xl border border-secondary-200 p-8 max-w-4xl mx-auto shadow-lg">
        {/* Header */}
        <div className="text-center border-b border-secondary-200 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">SchoolManager</h2>
              <p className="text-sm text-secondary-500">Academic Report Card</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-secondary-400">Academic Year</p>
              <p className="text-sm font-medium text-secondary-900">2026-2027</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm">
            <div>
              <span className="text-secondary-400">Term:</span>
              <span className="font-medium text-secondary-900 ml-1">Fall 2026</span>
            </div>
            <div>
              <span className="text-secondary-400">Date:</span>
              <span className="font-medium text-secondary-900 ml-1">December 20, 2026</span>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="py-6 border-b border-secondary-200">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 flex-1">
              <div>
                <p className="text-xs text-secondary-400">Student Name</p>
                <p className="text-sm font-medium text-secondary-900">{student.firstName} {student.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Admission Number</p>
                <p className="text-sm font-medium text-secondary-900">{student.admissionNumber}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Class</p>
                <p className="text-sm font-medium text-secondary-900">{student.class}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-400">Roll Number</p>
                <p className="text-sm font-medium text-secondary-900">{student.admissionNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="py-6">
          <h4 className="text-sm font-semibold text-secondary-700 mb-4">Academic Performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Subject</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Marks</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Percentage</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Grade</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {studentResults.map((result) => (
                  <tr key={result.id}>
                    <td className="py-2 px-3 text-sm font-medium text-secondary-900">{result.subjectName}</td>
                    <td className="py-2 px-3 text-sm text-secondary-600">{result.marksObtained}/{result.totalMarks}</td>
                    <td className="py-2 px-3 text-sm font-medium text-secondary-700">{result.percentage}%</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm text-secondary-500">{result.teacherRemarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="pt-6 border-t border-secondary-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-secondary-50 rounded-lg p-4 text-center">
              <p className="text-xs text-secondary-400">Overall Percentage</p>
              <p className="text-2xl font-bold text-secondary-900">{average.toFixed(1)}%</p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4 text-center">
              <p className="text-xs text-secondary-400">Grade</p>
              <p className="text-2xl font-bold text-secondary-900">
                {average >= 90 ? 'A+' : average >= 80 ? 'A' : average >= 70 ? 'B' : average >= 60 ? 'C' : 'D'}
              </p>
            </div>
            <div className="bg-secondary-50 rounded-lg p-4 text-center">
              <p className="text-xs text-secondary-400">Subjects Passed</p>
              <p className="text-2xl font-bold text-secondary-900">
                {studentResults.filter(r => r.percentage >= 40).length}/{studentResults.length}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-secondary-200 flex items-center justify-between text-xs text-secondary-400">
          <p>Generated by SchoolManager v2.0</p>
          <div className="flex items-center gap-4">
            <span>Teacher's Signature: _______________</span>
            <span>Principal's Signature: _______________</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;