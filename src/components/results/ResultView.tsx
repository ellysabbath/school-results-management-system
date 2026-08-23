import React, { useState } from 'react';
import { 
  Search, Filter, Download, Printer, Eye, ChevronDown,
  Calendar, BookOpen, Award, TrendingUp, BarChart3
} from 'lucide-react';
import { mockResults, mockStudents } from '../../utils/mockData';
import { getGradeColor } from '../../utils/mockData';

const ResultView: React.FC = () => {
  const [selectedTerm, setSelectedTerm] = useState('Fall 2026');
  const [selectedStudent, setSelectedStudent] = useState('');
  
  const studentResults = mockResults.filter(r => r.studentId === 's1' && r.term === selectedTerm);
  const publishedResults = studentResults.filter(r => r.isPublished);
  const average = publishedResults.length > 0 
    ? publishedResults.reduce((acc, r) => acc + r.percentage, 0) / publishedResults.length 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">My Results</h1>
          <p className="text-secondary-500">View your academic performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Overall Average</p>
              <p className="text-2xl font-bold text-secondary-900">{average.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-primary-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Best Subject</p>
              <p className="text-2xl font-bold text-secondary-900">Biology</p>
              <p className="text-xs text-green-600 mt-1">92%</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Term</p>
              <p className="text-2xl font-bold text-secondary-900">Fall 2026</p>
              <p className="text-xs text-secondary-400">Semester 1</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Grade</p>
              <p className="text-2xl font-bold text-secondary-900">A-</p>
              <p className="text-xs text-secondary-400">Good standing</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
            >
              <option value="Fall 2026">Fall 2026</option>
              <option value="Spring 2026">Spring 2026</option>
              <option value="Fall 2025">Fall 2025</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-secondary-500">Showing 4 subjects</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subject</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Marks</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Percentage</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Remarks</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {studentResults.map((result) => (
                <tr key={result.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-secondary-900">{result.subjectName}</td>
                  <td className="py-3 px-4 text-sm text-secondary-600">{result.marksObtained}/{result.totalMarks}</td>
                  <td className="py-3 px-4 text-sm font-medium text-secondary-700">{result.percentage}%</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                      {result.grade}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-secondary-500">{result.teacherRemarks || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.isPublished ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {result.isPublished ? 'Published' : 'Draft'}
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

export default ResultView;