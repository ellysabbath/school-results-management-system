import React from 'react';
import { Award, TrendingUp, Calendar, Clock, Download, CheckCircle, BookOpen, BarChart3 } from 'lucide-react';
import { mockResults, mockSubjects } from '../../utils/mockData';
import { getGradeColor } from '../../utils/mockData';

const StudentDashboard: React.FC = () => {
  const studentResults = mockResults.filter(r => r.studentId === 's1');
  const publishedResults = studentResults.filter(r => r.isPublished);
  const average = publishedResults.reduce((acc, r) => acc + r.percentage, 0) / publishedResults.length;

  const recentResults = publishedResults.slice(0, 4);

  const subjectPerformance = publishedResults.map(r => ({
    subject: r.subjectName,
    score: r.percentage,
    grade: r.grade,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Welcome back, Alice! 👋</h1>
          <p className="text-secondary-500">Here's your academic overview for Fall 2026.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
          <Download className="w-4 h-4" />
          Download Report Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Overall Average</p>
              <p className="text-3xl font-bold text-secondary-900">{average.toFixed(1)}%</p>
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
              <p className="text-3xl font-bold text-secondary-900">Biology</p>
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
              <p className="text-sm text-secondary-500">Subjects Completed</p>
              <p className="text-3xl font-bold text-secondary-900">{publishedResults.length}</p>
              <p className="text-xs text-secondary-400">Out of 4 subjects</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-500">Grade</p>
              <p className="text-3xl font-bold text-secondary-900">A-</p>
              <p className="text-xs text-secondary-400">Good standing</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Your Results - Fall 2026</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Marks</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Percentage</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Grade</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {recentResults.map((result) => (
                  <tr key={result.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-secondary-700">{result.subjectName}</td>
                    <td className="py-3 px-4 text-sm text-secondary-600">{result.marksObtained}/{result.totalMarks}</td>
                    <td className="py-3 px-4 text-sm font-medium text-secondary-700">{result.percentage}%</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                        {result.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-500">{result.teacherRemarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Performance Summary</h3>
          <div className="space-y-3">
            {subjectPerformance.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-secondary-600">{item.subject}</span>
                  <span className="font-medium text-secondary-900">{item.score}%</span>
                </div>
                <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      item.score >= 80 ? 'bg-green-500' :
                      item.score >= 60 ? 'bg-blue-500' :
                      item.score >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-secondary-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-secondary-500">Overall Performance</span>
              <span className="font-semibold text-secondary-900">{average.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary-200 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${average}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-primary-600" />
          <div>
            <h4 className="font-semibold text-secondary-900">Next Exam: Final Exams</h4>
            <p className="text-sm text-secondary-600">December 10, 2026 - 10:00 AM</p>
            <p className="text-xs text-primary-600 mt-1">2 weeks remaining</p>
          </div>
        </div>
        <button className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
          View Schedule
        </button>
      </div>
    </div>
  );
};

export default StudentDashboard;