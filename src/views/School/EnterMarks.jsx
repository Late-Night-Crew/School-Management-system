import React, { useState, useEffect } from "react";
import { AUTH_TOKEN_KEY } from "../constants/storageKeys";
import ToastNote from "../../components/ToastNote";

// Mock Data for Demo (Replace with API calls)
const MOCK_STUDENTS = [
    { id: 1, student_number: "2024-001", firstname: "John", middlename: "James", lastname: "Doe", class: "Form 1", subject_ids: [1, 2, 3] },
    { id: 2, student_number: "2024-002", firstname: "Jane", middlename: "Marie", lastname: "Smith", class: "Form 1", subject_ids: [1, 2, 4] },
    { id: 3, student_number: "2024-003", firstname: "Alice", middlename: "Beth", lastname: "Brown", class: "Form 2", subject_ids: [1, 3] },
    { id: 4, student_number: "2024-004", firstname: "Bob", middlename: "Lee", lastname: "White", class: "Form 1", subject_ids: [1, 2, 3] },
    { id: 5, student_number: "2024-005", firstname: "Charlie", middlename: "Ray", lastname: "Chaplin", class: "Form 1", subject_ids: [1, 2] },
    { id: 6, student_number: "2024-006", firstname: "David", middlename: "Paul", lastname: "Miller", class: "Form 2", subject_ids: [1, 3] },
    { id: 7, student_number: "2024-007", firstname: "Eve", middlename: "Anne", lastname: "Davis", class: "Form 2", subject_ids: [1, 3] },
    { id: 8, student_number: "2024-008", firstname: "Frank", middlename: "George", lastname: "Wilson", class: "Form 3", subject_ids: [1, 2, 3] },
];

const MOCK_SUBJECTS = [
    { id: 1, name: "Mathematics" },
    { id: 2, name: "English" },
    { id: 3, name: "Science" },
    { id: 4, name: "History" },
    { id: 5, name: "Geography" },
    { id: 6, name: "Biology" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }
.se-marks { font-family: 'Plus Jakarta Sans', sans-serif; background: #eef1f7; min-height: 100vh; color: #1a1d2e; display: flex; flex-direction: column; }

/* ── HEADER ── */
.se-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563a8 55%, #3b82c4 100%);
  padding: 26px 36px; display: flex; align-items: center; gap: 18px;
  position: relative; overflow: hidden; flex-shrink: 0;
}
.se-header-icon {
  width: 52px; height: 52px; border-radius: 15px;
  background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0; color: #fff;
}
.se-header-text h2 { font-size: 21px; font-weight: 800; color: #fff; margin: 0; letter-spacing: -0.5px; }
.se-header-sub { font-size: 12.5px; color: rgba(255,255,255,0.6); margin-top: 3px; }

/* ── TABS ── */
.se-tabs-bar { margin: 20px 0px 20px; padding: 0 36px; }
.se-tabs {
  display: inline-flex; gap: 4px; background: #fff; border-radius: 50px; padding: 10px;
  box-shadow: 0 2px 14px rgba(0,0,0,0.09);
}
.se-tab {
  display: flex; align-items: center; gap: 8px; padding: 9px 22px; border-radius: 50px; border: none;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
  color: #6b7280; background: transparent; cursor: pointer;
  transition: all 0.22s ease; white-space: nowrap;
}
.se-tab:hover { color: #374151; }
.se-tab.active {
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  color: #fff; box-shadow: 0 4px 14px rgba(37,99,168,0.38);
}
.se-tab-icon { font-size: 14px; }

/* ── CONTROLS ── */
.se-controls { padding: 16px 36px 0; flex-shrink: 0; display: flex; gap: 16px; align-items: flex-end; background: #fff; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; }
.se-controls-inner { display: flex; gap: 16px; width: 100%; max-width: 700px; }
.f-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.lbl {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.7px;
  text-transform: uppercase; color: #9ca3af;
}
.sel {
  margin-bottom: 10px;
  background: #fff; border: 1.5px solid #2563a8;
  border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 600; color: #1a1d2e;
  padding: 12px 16px; outline: none; width: 100%;
  transition: all 0.18s; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.sel:hover { background: #eff6ff; color: #2563a8; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(37,99,168,0.15); }
.sel:focus { background: #fff; border-color: #2563a8; box-shadow: 0 0 0 4px rgba(37,99,168,0.2); }

/* ── PRIMARY BUTTON ── */
.btn-prim {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  color: #fff; border: none; border-radius: 10px;
  padding: 10px 20px; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,168,0.3);
}
.btn-prim:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,168,0.4); }
.btn-prim:active { transform: translateY(0); }

/* ── BODY & TABLE WRAPPER ── */
.se-body { padding: 0 36px 20px; flex-grow: 1; overflow: hidden; display: flex; flex-direction: column; }
.table-container {
  background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  overflow: auto; border: 1px solid #e5e7eb; position: relative; flex-grow: 1;
}
.marks-table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  table-layout: auto;
}
.marks-th {
  background: #f8fafc; padding: 16px 12px;
  font-size: 11px; font-weight: 800; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.5px;
  white-space: nowrap; border-bottom: 2px solid #e5e7eb;
  position: sticky; top: 0; z-index: 10;
}
.marks-th.sticky-left {
  position: sticky; left: 0; z-index: 21;
  background: linear-gradient(90deg, #f8fafc 95%, #fff 5%);
  border-right: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb;
}
.marks-td {
  padding: 8px 12px; vertical-align: top; border-bottom: 1px solid #f1f5f9;
  font-size: 13px; color: #374151; white-space: nowrap;
}
.marks-td.sticky-left {
  position: sticky; left: 0; z-index: 10; background: #fff;
  border-right: 2px solid #e5e7eb; border-bottom: 1px solid #f1f5f9;
}
.marks-td.subj-col {
  min-width: 110px; text-align: center; padding: 12px 8px;
}

/* ── STUDENT INFO CELLS ── */
.stu-info-container { display: flex; flex-direction: column; gap: 2px; padding: 8px; min-width: 220px; }
.stu-main-name { font-weight: 700; color: #111827; font-size: 13px; }
.stu-sub-name { font-size: 11px; color: #6b7280; font-weight: 500; }
.stu-meta { display: flex; gap: 8px; align-items: center; margin-top: 4px; }
.stu-num { font-family: 'DM Mono', monospace; font-size: 10px; color: #6b7280; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; }
.stu-class { font-weight: 600; color: #2563a8; font-size: 11px; padding: 2px 8px; background: #eff6ff; border-radius: 4px; display: inline-block; }

/* ── MARK INPUT CELL ── */
.mark-cell { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.mark-inp {
  width: 60px; text-align: center; font-family: 'DM Mono', monospace;
  font-size: 15px; font-weight: 700; color: #1a1d2e; padding: 4px;
  border: 1px solid #e2e8f0; border-radius: 6px; outline: none; transition: all 0.2s; background: #fff;
}
.mark-inp:focus { border-color: #2563a8; box-shadow: 0 0 0 4px rgba(37,99,168,0.15); background: #fff; }
.mark-inp:disabled { background: #f9fafb; color: #cbd5e1; cursor: not-allowed; opacity: 0.5; }

/* ── ACTION & GRADE CELLS ── */
.act-cell { text-align: center; white-space: nowrap; border-bottom: 1px solid #f1f5f9; padding: 10px; }
.gr-bdg {
  display: inline-block; padding: 4px 10px; border-radius: 6px;
  font-weight: 800; font-size: 12px; font-family: 'DM Mono', monospace; min-width: 32px;
}
.bg-A { background: #dcfce7; color: #15803d; }
.bg-B { background: #dbeafe; color: #1e40af; }
.bg-C { background: #e0f2fe; color: #1d4ed8; }
.bg-D { background: #fef9c3; color: #b45309; }
.bg-E { background: #ffedd5; color: #9a3412; }
.bg-F { background: #fee2e2; color: #991b1b; }
.bg-N { background: #f3f4f6; color: #94a3b8; }

/* ── STATS GRID ── */
.stat-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-top: 8px;
}
.stat-box {
  background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 14px;
  padding: 20px; text-align: center; transition: all 0.2s;
}
.stat-box:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.stat-val {
  font-family: 'DM Mono', monospace; font-size: 32px; font-weight: 700;
  color: #1a1d2e; line-height: 1;
}
.stat-val.c-high { color: #15803d; }
.stat-val.c-low  { color: #991b1b; }
.stat-val.c-pass { color: #2563a8; }
.stat-lbl { font-size: 12px; font-weight: 600; color: #6b7280; margin-top: 8px; }

/* ── PAGINATION ── */
.pagination-wrapper {
  padding: 16px 36px 0; border-top: 1px solid #e5e7eb; background: #fff;
  display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
}
.pagination-info { font-size: 12px; color: #6b7280; font-weight: 600; }
.page-btns { display: flex; gap: 8px; align-items: center; }
.page-btn {
  background: #fff; border: 1px solid #e5e7eb; color: #374151;
  padding: 6px 14px; border-radius: 8px; font-weight: 600; font-size: 13px;
  cursor: pointer; transition: all 0.2s; min-width: 36px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.page-btn:hover:not(:disabled) { background: #f1f5f9; color: #2563a8; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.page-btn.active { background: #2563a8; color: #fff; border-color: #2563a8; }
.page-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Responsive */
@media (max-width: 1024px) {
  .se-header { padding: 18px 20px; }
  .se-body { padding: 0 16px 24px; }
  .se-controls { flex-direction: column; align-items: stretch; padding: 12px 16px; gap: 10px; }
  .se-controls-inner { max-width: 100%; }
  .pagination-wrapper { flex-direction: column; gap: 10px; padding: 12px 16px; }
  .page-btns { width: 100%; justify-content: center; }
  .marks-td.sticky-left { min-width: 160px; }
  .marks-th.sticky-left { min-width: 160px; }
}
`;

export default function EnterMarks() {
    const [activeTab, setActiveTab] = useState("enter");
    const [students, setStudents] = useState([]);
    // FIX 1: Added missing `subjects` state (was using setSubjects but never declared)
    const [subjects, setSubjects] = useState([]);
    const [marks, setMarks] = useState({});
    const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 5;

    // Filter State
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("All Subjects");

    // Stats State
    const [stats, setStats] = useState(null);

    const classOptions = ["Form 1", "Form 2", "Form 3", "Form 4"];

    useEffect(() => {
        fetchSubjects();
        fetchStudents();
    }, []);

    const fetchSubjects = async () => {
        // FIX 2: Now correctly sets the `subjects` state that was declared above
        setSubjects(MOCK_SUBJECTS);
    };

    const fetchStudents = async () => {
        setStudents(MOCK_STUDENTS);
    };

    // Filter Logic: Class + optional Subject column filter
    const filteredStudents = students.filter(s => s.class === selectedClass);

    // FIX 3: Apply selectedSubject filter to columns shown in the table
    const visibleSubjects = selectedSubject === "All Subjects"
        ? subjects
        : subjects.filter(s => String(s.id) === String(selectedSubject));

    // Pagination Logic
    const totalPages = Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage));
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

    const handleMarkChange = (studentId, subjectId, value) => {
        const key = `${studentId}-${subjectId}`;
        const parsed = parseInt(value);
        // FIX 4: When input is cleared (empty string), store undefined so input shows as blank
        if (value === "" || isNaN(parsed)) {
            setMarks(prev => { const next = { ...prev }; delete next[key]; return next; });
        } else {
            const numValue = Math.min(100, Math.max(0, parsed));
            setMarks(prev => ({ ...prev, [key]: numValue }));
        }
    };

    const getGradeInfo = (mark) => {
        if (mark === undefined || mark === null) return { grade: '-', cls: 'bg-N' };
        if (mark >= 90) return { grade: 'A', cls: 'bg-A' };
        if (mark >= 80) return { grade: 'B', cls: 'bg-B' };
        if (mark >= 70) return { grade: 'C', cls: 'bg-C' };
        if (mark >= 60) return { grade: 'D', cls: 'bg-D' };
        if (mark >= 40) return { grade: 'E', cls: 'bg-E' };
        return { grade: 'F', cls: 'bg-F' };
    };

    // FIX 5: getRowAverageGrade now uses the `subjects` state instead of undefined variable
    const getRowAverageGrade = (studentId) => {
        const student = MOCK_STUDENTS.find(s => s.id === studentId);
        if (!student) return { grade: '-', cls: 'bg-N' };

        const studentMarks = subjects
            .filter(sub => student.subject_ids.includes(sub.id))
            .map(sub => marks[`${studentId}-${sub.id}`])
            .filter(m => m !== undefined && m > 0);

        if (studentMarks.length === 0) return { grade: '-', cls: 'bg-N' };
        const avg = studentMarks.reduce((a, b) => a + b, 0) / studentMarks.length;
        return getGradeInfo(Math.round(avg));
    };

    const calculateStats = () => {
        const allMarks = Object.values(marks).filter(m => m !== undefined && m > 0);
        if (allMarks.length === 0) { setStats(null); return; }

        const avg = (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(1);
        const high = Math.max(...allMarks);
        const low = Math.min(...allMarks);
        const passes = allMarks.filter(m => m >= 40).length;
        const passRate = ((passes / allMarks.length) * 100).toFixed(1);

        setStats({ avg, high, low, passes, passRate, total: allMarks.length });
    };

    const handleSubmit = async () => {
        if (!selectedClass) {
            setToast({ show: true, message: "Please select a Class.", variant: "danger" });
            return;
        }
        try {
            const marksArray = Object.entries(marks).map(([key, mark]) => {
                const [studentId, subjectId] = key.split('-');
                return { studentId: parseInt(studentId), subjectId: parseInt(subjectId), mark };
            });
            console.log("Submitting Matrix Marks:", marksArray);
            setToast({ show: true, message: "All marks saved successfully!", variant: "success" });
        } catch (error) {
            console.error("Error saving marks.", error);
            setToast({ show: true, message: "Error saving marks.", variant: "danger" });
        }
    };

    const saveStudentMarks = async (studentId) => {
        try {
            const marksData = Object.entries(marks)
                .filter(([key]) => key.startsWith(`${studentId}-`))
                .map(([key, mark]) => {
                    const [sId, subId] = key.split('-');
                    return { studentId: parseInt(sId), subjectId: parseInt(subId), mark };
                });
            console.log(`Saving marks for student ${studentId}:`, marksData);
            setToast({ show: true, message: `Saved marks for Student ID ${studentId}`, variant: "success" });
        } catch (error) {
            console.error("Error saving student marks.", error);
            setToast({ show: true, message: "Error saving student marks.", variant: "danger" });
        }
    };

    const handleEditStudent = (student) => {
        console.log("Edit student", student);
        setToast({ show: true, message: "Edit Student clicked", variant: "info" });
    };

    const handleDeleteStudent = (student) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            console.log("Delete student", student);
            setToast({ show: true, message: "Student deleted", variant: "warning" });
            setStudents(students.filter(s => s.id !== student.id));
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    return (
        <>
            <style>{CSS}</style>
            <ToastNote show={toast.show} onClose={() => setToast({ ...toast, show: false })} message={toast.message} variant={toast.variant} />

            <div className="se-marks">
                {/* Header */}
                <div className="se-header">
                    <div className="se-header-icon"><i className="bi bi-grid-3x3-gap"></i></div>
                    <div className="se-header-text">
                        <h2>Gradebook Matrix</h2>
                        <div className="se-header-sub">Enter marks for all students and subjects</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="se-tabs-bar">
                    <div className="se-tabs">
                        <button className={`se-tab ${activeTab === 'enter' ? 'active' : ''}`} onClick={() => setActiveTab('enter')}>
                            <i className="bi bi-pencil-square se-tab-icon"></i> Enter Marks
                        </button>
                        <button className={`se-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => { setActiveTab('stats'); calculateStats(); }}>
                            <i className="bi bi-graph-up se-tab-icon"></i> Analytics
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="se-body">

                    {/* --- ENTER MARKS TAB --- */}
                    {activeTab === 'enter' && (
                        <>
                            {/* Filters */}
                            <div className="se-controls">
                                <div className="se-controls-inner">
                                    <div className="f-col">
                                        <label className="lbl">Select Class</label>
                                        <select className="sel" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setCurrentPage(1); }}>
                                            <option value="">Choose Class...</option>
                                            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="f-col">
                                        <label className="lbl">Subject</label>
                                        <select className="sel" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                                            <option value="All Subjects">All Subjects</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Matrix Table */}
                            {selectedClass && filteredStudents.length > 0 ? (
                                <div className="table-container">
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                        <button className="btn-prim" onClick={handleSubmit}>
                                            <i className="bi bi-check-lg"></i> Save All Marks
                                        </button>
                                    </div>
                                    <table className="marks-table">
                                        <thead>
                                            <tr>
                                                <th className="marks-th sticky-left" style={{ minWidth: '240px', paddingLeft: '40px' }}>
                                                    Student Info
                                                </th>
                                                {/* FIX 3: Render visibleSubjects instead of all MOCK_SUBJECTS */}
                                                {visibleSubjects.map(sub => (
                                                    <th key={sub.id} className="marks-th">
                                                        {sub.name}
                                                    </th>
                                                ))}
                                                <th className="marks-th">Avg Grade</th>
                                                <th className="marks-th">Save</th>
                                                <th className="marks-th">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentStudents.map(student => {
                                                const avgGrade = getRowAverageGrade(student.id);
                                                return (
                                                    <tr key={student.id}>
                                                        <td className="marks-td sticky-left">
                                                            <div className="stu-info-container">
                                                                <div className="stu-main-name">{student.firstname} {student.lastname}</div>
                                                                <div className="stu-sub-name">{student.middlename || '-'}</div>
                                                                <div className="stu-meta">
                                                                    <span className="stu-num">{student.student_number}</span>
                                                                    <span className="stu-class">{student.class}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* FIX 3: Iterate visibleSubjects */}
                                                        {visibleSubjects.map(sub => {
                                                            const key = `${student.id}-${sub.id}`;
                                                            const mark = marks[key];
                                                            const gradeInfo = getGradeInfo(mark);
                                                            const takesSubject = student.subject_ids.includes(sub.id);

                                                            return (
                                                                <td key={key} className="marks-td subj-col">
                                                                    {takesSubject ? (
                                                                        <div className="mark-cell">
                                                                            <input
                                                                                type="number"
                                                                                className="mark-inp"
                                                                                min="0" max="100"
                                                                                placeholder="-"
                                                                                // FIX 4: Correctly handle undefined mark — show empty string
                                                                                value={mark !== undefined ? mark : ''}
                                                                                onChange={e => handleMarkChange(student.id, sub.id, e.target.value)}
                                                                            />
                                                                            {mark !== undefined && mark > 0 && (
                                                                                // FIX 5: Use `cls` not `class` (renamed to avoid JS reserved word clash)
                                                                                <span className={`gr-bdg ${gradeInfo.cls}`}>
                                                                                    {gradeInfo.grade}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ color: '#e2e8f0', fontSize: 18 }}>—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}

                                                        <td className="act-cell">
                                                            {avgGrade.grade !== '-' ? (
                                                                <span className={`gr-bdg ${avgGrade.cls}`}>{avgGrade.grade}</span>
                                                            ) : <span>-</span>}
                                                        </td>

                                                        <td className="act-cell">
                                                            <button className="btn-prim" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => saveStudentMarks(student.id)}>
                                                                <i className="bi bi-save"></i> Save
                                                            </button>
                                                        </td>

                                                        <td className="act-cell">
                                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                <button className="page-btn" title="Edit Student" onClick={() => handleEditStudent(student)}>
                                                                    <i className="bi bi-pencil-fill"></i>
                                                                </button>
                                                                <button className="page-btn" title="Delete Student" onClick={() => handleDeleteStudent(student)}>
                                                                    <i className="bi bi-trash-fill"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* Pagination */}
                                    <div className="pagination-wrapper">
                                        <div className="pagination-info">
                                            Page {currentPage} of {totalPages} ({filteredStudents.length} Students)
                                        </div>
                                        <div className="page-btns">
                                            <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                                <i className="bi bi-chevron-left"></i> Prev
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <button
                                                    key={i}
                                                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(i + 1)}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                                Next <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                    <i className="bi bi-grid-3x3-gap" style={{ fontSize: 48, opacity: 0.4 }}></i>
                                    <h3>No Students Found</h3>
                                    <p>Please select a class to view the gradebook.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* --- STATS TAB --- */}
                    {activeTab === 'stats' && (
                        <div>
                            {stats ? (
                                <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '20px' }}>
                                    <h4 style={{ marginBottom: '20px', fontWeight: 700, color: '#111827' }}>
                                        <i className="bi bi-graph-up me-2"></i> Performance Overview
                                    </h4>
                                    <div className="stat-grid">
                                        <div className="stat-box">
                                            <div className="stat-val">{stats.avg}</div>
                                            <div className="stat-lbl">Average Mark</div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="stat-val c-high">{stats.high}</div>
                                            <div className="stat-lbl">Highest Mark</div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="stat-val c-low">{stats.low}</div>
                                            <div className="stat-lbl">Lowest Mark</div>
                                        </div>
                                        <div className="stat-box">
                                            <div className="stat-val c-pass">{stats.passRate}%</div>
                                            <div className="stat-lbl">Pass Rate ({stats.passes}/{stats.total})</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    <i className="bi bi-bar-chart" style={{ fontSize: 40, opacity: 0.4 }}></i>
                                    <h3>No Data Yet</h3>
                                    <p>Enter marks to generate statistics.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}