import React, { useState } from 'react';
import { 
  Search, Filter, CheckCircle, XCircle, Clock, Printer, 
  Download, Save, Send, Eye, Edit, Trash2, Plus, Trash
} from 'lucide-react';
import { mockStudents, mockSubjects, mockResults } from '../../utils/mockData';
import { getGradeColor } from '../../utils/mockData';
import toast from 'react-hot-toast';

// ============================================
// TANZANIA CURRICULUM SUBJECTS
// ============================================
const TANZANIA_SUBJECTS = [
  { id: 'sub1', code: 'MATH', name: 'Mathematics' },
  { id: 'sub2', code: 'ENG', name: 'English Language' },
  { id: 'sub3', code: 'KISW', name: 'Kiswahili' },
  { id: 'sub4', code: 'BIO', name: 'Biology' },
  { id: 'sub5', code: 'CHEM', name: 'Chemistry' },
  { id: 'sub6', code: 'PHYS', name: 'Physics' },
  { id: 'sub7', code: 'HIST', name: 'History' },
  { id: 'sub8', code: 'GEOG', name: 'Geography' },
  { id: 'sub9', code: 'CIV', name: 'Civics' },
  { id: 'sub10', code: 'COMM', name: 'Commerce' },
  { id: 'sub11', code: 'BOOK', name: 'Bookkeeping' },
  { id: 'sub12', code: 'AGRI', name: 'Agriculture' },
  { id: 'sub13', code: 'ICT', name: 'Information and Computer Studies' },
  { id: 'sub14', code: 'FINE', name: 'Fine Arts' },
  { id: 'sub15', code: 'MUSIC', name: 'Music' },
  { id: 'sub16', code: 'PE', name: 'Physical Education' },
  { id: 'sub17', code: 'ARAB', name: 'Arabic' },
  { id: 'sub18', code: 'FREN', name: 'French' },
];

// ============================================
// GRADE CALCULATION FUNCTIONS
// ============================================
const calculateGrade = (marks: number, totalMarks: number = 100): { grade: string; percentage: number } => {
  const percentage = (marks / totalMarks) * 100;
  
  // Tanzania Secondary Education Grade Scale
  let grade = '';
  if (percentage >= 90) grade = 'A';
  else if (percentage >= 80) grade = 'B+';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C+';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'D';
  else if (percentage >= 30) grade = 'E';
  else grade = 'F';
  
  return { grade, percentage };
};

const getGradePoint = (grade: string): number => {
  const points: Record<string, number> = {
    'A': 5.0,
    'B+': 4.5,
    'B': 4.0,
    'C+': 3.5,
    'C': 3.0,
    'D': 2.0,
    'E': 1.0,
    'F': 0.0,
  };
  return points[grade] || 0;
};

const getGradeDescription = (grade: string): string => {
  const descriptions: Record<string, string> = {
    'A': 'Excellent',
    'B+': 'Very Good',
    'B': 'Good',
    'C+': 'Above Average',
    'C': 'Average',
    'D': 'Below Average',
    'E': 'Pass',
    'F': 'Fail',
  };
  return descriptions[grade] || '';
};

interface StudentResult {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  class: string;
  subjects: {
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    marks: number;
    totalMarks: number;
    grade: string;
    percentage: number;
    remarks: string;
  }[];
  overallAverage: number;
  overallGrade: string;
  totalPoints: number;
}

const ResultEntry: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('Fall 2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectId, setNewSubjectId] = useState('');

  const classes = ['all', ...new Set(mockStudents.map(s => s.class))];
  const terms = ['Fall 2026', 'Spring 2026', 'Fall 2025'];

  const filteredStudents = mockStudents.filter(student => {
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Initialize student results
  const initializeStudentResults = (studentId: string) => {
    const existing = studentResults.find(r => r.studentId === studentId);
    if (existing) return existing;

    const student = mockStudents.find(s => s.id === studentId);
    if (!student) return null;

    const newResult: StudentResult = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      class: student.class,
      subjects: [],
      overallAverage: 0,
      overallGrade: 'N/A',
      totalPoints: 0,
    };

    setStudentResults(prev => [...prev, newResult]);
    return newResult;
  };

  // Add subject to student results
  const addSubjectToStudent = (studentId: string, subjectId: string) => {
    const subject = TANZANIA_SUBJECTS.find(s => s.id === subjectId);
    if (!subject) return;

    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        const existingSubject = result.subjects.find(s => s.subjectId === subjectId);
        if (existingSubject) return result;

        return {
          ...result,
          subjects: [
            ...result.subjects,
            {
              subjectId: subject.id,
              subjectName: subject.name,
              subjectCode: subject.code,
              marks: 0,
              totalMarks: 100,
              grade: 'N/A',
              percentage: 0,
              remarks: '',
            }
          ],
        };
      }
      return result;
    }));

    toast.success(`Added ${subject.name} to student`);
  };

  // Remove subject from student results
  const removeSubjectFromStudent = (studentId: string, subjectId: string) => {
    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        return {
          ...result,
          subjects: result.subjects.filter(s => s.subjectId !== subjectId),
        };
      }
      return result;
    }));
    toast.success('Subject removed');
  };

  // Update marks for a subject
  const updateMarks = (studentId: string, subjectId: string, marks: number) => {
    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        const updatedSubjects = result.subjects.map(subject => {
          if (subject.subjectId === subjectId) {
            const { grade, percentage } = calculateGrade(marks, subject.totalMarks);
            return {
              ...subject,
              marks,
              grade,
              percentage,
            };
          }
          return subject;
        });

        // Calculate overall average and grade
        const validSubjects = updatedSubjects.filter(s => s.marks > 0);
        const totalPercentage = validSubjects.reduce((sum, s) => sum + s.percentage, 0);
        const overallAverage = validSubjects.length > 0 ? totalPercentage / validSubjects.length : 0;
        const { grade: overallGrade } = calculateGrade(overallAverage, 100);
        const totalPoints = validSubjects.reduce((sum, s) => sum + getGradePoint(s.grade), 0);

        return {
          ...result,
          subjects: updatedSubjects,
          overallAverage,
          overallGrade: validSubjects.length > 0 ? overallGrade : 'N/A',
          totalPoints,
        };
      }
      return result;
    }));
  };

  // Update remarks for a subject
  const updateRemarks = (studentId: string, subjectId: string, remarks: string) => {
    setStudentResults(prev => prev.map(result => {
      if (result.studentId === studentId) {
        return {
          ...result,
          subjects: result.subjects.map(subject => {
            if (subject.subjectId === subjectId) {
              return { ...subject, remarks };
            }
            return subject;
          }),
        };
      }
      return result;
    }));
  };

  const handlePublish = () => {
    toast.success('Results published successfully! Students can now view their results.');
  };

  const handleSave = () => {
    toast.success('Results saved as draft.');
  };

  const handleViewStudent = (studentId: string) => {
    setSelectedStudent(studentId === selectedStudent ? null : studentId);
    initializeStudentResults(studentId);
  };

  const getStudentResult = (studentId: string) => {
    return studentResults.find(r => r.studentId === studentId);
  };

  const getAvailableSubjects = (studentId: string) => {
    const result = getStudentResult(studentId);
    const existingIds = result?.subjects.map(s => s.subjectId) || [];
    return TANZANIA_SUBJECTS.filter(s => !existingIds.includes(s.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Result Entry</h1>
          <p className="text-secondary-500">Enter and manage student results - Tanzania Curriculum</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-white font-medium rounded-lg hover:bg-secondary-700 transition-colors text-sm"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Send className="w-4 h-4" />
            Publish Results
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="p-4 border-b border-secondary-200 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
          >
            {classes.map(cls => (
              <option key={cls} value={cls}>
                {cls === 'all' ? 'All Classes' : cls}
              </option>
            ))}
          </select>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
          >
            {terms.map(term => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Student</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Admission</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Class</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Subjects</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Average</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Grade</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Points</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filteredStudents.map((student) => {
                const result = getStudentResult(student.id);
                const isExpanded = selectedStudent === student.id;

                return (
                  <React.Fragment key={student.id}>
                    <tr className="hover:bg-secondary-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center text-secondary-600 font-medium text-xs">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <span className="text-sm font-medium text-secondary-900">
                            {student.firstName} {student.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">{student.admissionNumber}</td>
                      <td className="py-3 px-4 text-sm text-secondary-600">{student.class}</td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {result ? result.subjects.length : 0} subjects
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-secondary-900">
                        {result && result.subjects.length > 0 ? result.overallAverage.toFixed(1) + '%' : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {result && result.subjects.length > 0 && result.overallGrade !== 'N/A' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.overallGrade)}`}>
                            {result.overallGrade}
                          </span>
                        ) : (
                          <span className="text-sm text-secondary-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-secondary-600">
                        {result && result.subjects.length > 0 ? result.totalPoints.toFixed(1) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleViewStudent(student.id)}
                          className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          {isExpanded ? 'Hide' : 'Enter Results'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row - Subject Entry */}
                    {isExpanded && result && (
                      <tr>
                        <td colSpan={8} className="py-4 px-4 bg-secondary-50">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-secondary-900">
                                Results for {student.firstName} {student.lastName} - {selectedTerm}
                              </h4>
                              <div className="flex items-center gap-2">
                                {getAvailableSubjects(student.id).length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={newSubjectId}
                                      onChange={(e) => setNewSubjectId(e.target.value)}
                                      className="px-3 py-1.5 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                      <option value="">Add Subject...</option>
                                      {getAvailableSubjects(student.id).map(sub => (
                                        <option key={sub.id} value={sub.id}>
                                          {sub.name} ({sub.code})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => {
                                        if (newSubjectId) {
                                          addSubjectToStudent(student.id, newSubjectId);
                                          setNewSubjectId('');
                                        }
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                      Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Subject Entry Table */}
                            <div className="bg-white rounded-lg border border-secondary-200 overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-secondary-100">
                                  <tr>
                                    <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Subject</th>
                                    <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Code</th>
                                    <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Marks</th>
                                    <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Total</th>
                                    <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">%</th>
                                    <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Grade</th>
                                    <th className="text-left py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Remarks</th>
                                    <th className="text-right py-2 px-3 text-xs font-medium text-secondary-500 uppercase">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                  {result.subjects.map((subject) => (
                                    <tr key={subject.subjectId} className="hover:bg-secondary-50 transition-colors">
                                      <td className="py-2 px-3 text-sm text-secondary-700">{subject.subjectName}</td>
                                      <td className="py-2 px-3 text-sm text-secondary-500">{subject.subjectCode}</td>
                                      <td className="py-2 px-3">
                                        <input
                                          type="number"
                                          value={subject.marks}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            updateMarks(student.id, subject.subjectId, Math.min(100, Math.max(0, val)));
                                          }}
                                          className="w-16 px-2 py-1 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                          min="0"
                                          max="100"
                                        />
                                      </td>
                                      <td className="py-2 px-3 text-sm text-secondary-500">{subject.totalMarks}</td>
                                      <td className="py-2 px-3 text-sm font-medium text-secondary-700">
                                        {subject.marks > 0 ? subject.percentage.toFixed(1) + '%' : '-'}
                                      </td>
                                      <td className="py-2 px-3">
                                        {subject.marks > 0 ? (
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(subject.grade)}`}>
                                            {subject.grade}
                                          </span>
                                        ) : (
                                          <span className="text-sm text-secondary-400">-</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3">
                                        <input
                                          type="text"
                                          value={subject.remarks}
                                          onChange={(e) => updateRemarks(student.id, subject.subjectId, e.target.value)}
                                          placeholder="Add remarks"
                                          className="w-full px-2 py-1 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                        />
                                      </td>
                                      <td className="py-2 px-3 text-right">
                                        <button
                                          onClick={() => removeSubjectFromStudent(student.id, subject.subjectId)}
                                          className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                          <Trash className="w-4 h-4 text-red-400 hover:text-red-600" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                  {result.subjects.length === 0 && (
                                    <tr>
                                      <td colSpan={8} className="py-8 text-center text-secondary-400">
                                        <p>No subjects added yet. Click "Add Subject" to enter results.</p>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Summary */}
                            {result.subjects.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                  <p className="text-xs text-secondary-400">Subjects</p>
                                  <p className="text-lg font-bold text-secondary-900">{result.subjects.length}</p>
                                </div>
                                <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                  <p className="text-xs text-secondary-400">Average</p>
                                  <p className="text-lg font-bold text-secondary-900">
                                    {result.overallAverage.toFixed(1)}%
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                  <p className="text-xs text-secondary-400">Overall Grade</p>
                                  <p className={`text-lg font-bold ${result.overallGrade !== 'N/A' ? getGradeColor(result.overallGrade) : 'text-secondary-400'}`}>
                                    {result.overallGrade}
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg border border-secondary-200 p-3 text-center">
                                  <p className="text-xs text-secondary-400">Total Points</p>
                                  <p className="text-lg font-bold text-secondary-900">
                                    {result.totalPoints.toFixed(1)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultEntry;