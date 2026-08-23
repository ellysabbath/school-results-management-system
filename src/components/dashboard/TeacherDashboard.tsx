import React from 'react';
import { Users, BookOpen, ClipboardList, Clock, TrendingUp, Award, Calendar, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../common/StatCard';
import { mockStudents, mockSubjects, mockResults } from '../../utils/mockData';

const TeacherDashboard: React.FC = () => {
  const teacherSubjects = mockSubjects.filter(s => s.teacherId === 't1');
  const teacherStudents = mockStudents.filter(s => s.class === 'Grade 10A');
  const pendingResults = mockResults.filter(r => !r.isPublished && r.subjectId === 'sub1');
  const publishedResults = mockResults.filter(r => r.isPublished && r.subjectId === 'sub1');

  const classPerformance = [
    { name: 'Alice', score: 85 },
    { name: 'Bob', score: 62 },
    { name: 'Charlie', score: 28 },
    { name: 'Diana', score: 95 },
    { name: 'Ethan', score: 76 },
    { name: 'Fiona', score: 70 },
    { name: 'George', score: 55 },
    { name: 'Hannah', score: 68 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Teacher Dashboard</h1>
        <p className="text-secondary-500">Welcome back, John! Here's your teaching overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Students"
          value={teacherStudents.length}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="My Subjects"
          value={teacherSubjects.length}
          icon={BookOpen}
          color="green"
        />
        <StatCard
          title="Pending Results"
          value={pendingResults.length}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Published Results"
          value={publishedResults.length}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-secondary-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-secondary-900">Class Performance - Grade 10A</h3>
            <span className="text-sm text-secondary-500">Mathematics</span>
          </div>
          <div className="space-y-3">
            {classPerformance.map((student, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-xs font-medium text-secondary-600">
                  {student.name[0]}
                </div>
                <span className="flex-1 text-sm text-secondary-700">{student.name}</span>
                <div className="flex-1 max-w-[200px]">
                  <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        student.score >= 80 ? 'bg-green-500' :
                        student.score >= 60 ? 'bg-blue-500' :
                        student.score >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${student.score}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-secondary-700 min-w-[40px] text-right">
                  {student.score}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Today's Schedule</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                <Clock className="w-4 h-4 text-primary-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">Grade 10A - Mathematics</p>
                  <p className="text-xs text-secondary-500">9:00 AM - 10:00 AM</p>
                </div>
                <span className="text-xs bg-primary-200 text-primary-700 px-2 py-1 rounded-full">Ongoing</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                <Clock className="w-4 h-4 text-secondary-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">Grade 10B - Mathematics</p>
                  <p className="text-xs text-secondary-500">11:00 AM - 12:00 PM</p>
                </div>
                <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded-full">Upcoming</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
                <Clock className="w-4 h-4 text-secondary-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900">Grade 11A - Mathematics</p>
                  <p className="text-xs text-secondary-500">2:00 PM - 3:00 PM</p>
                </div>
                <span className="text-xs bg-secondary-200 text-secondary-700 px-2 py-1 rounded-full">Upcoming</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-secondary-200 p-6">
            <h3 className="font-semibold text-secondary-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium text-primary-700">
                <ClipboardList className="w-4 h-4 mx-auto mb-1" />
                Enter Results
              </button>
              <button className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium text-green-700">
                <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                View Analytics
              </button>
              <button className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium text-purple-700">
                <Award className="w-4 h-4 mx-auto mb-1" />
                Generate Reports
              </button>
              <button className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium text-yellow-700">
                <Calendar className="w-4 h-4 mx-auto mb-1" />
                View Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;