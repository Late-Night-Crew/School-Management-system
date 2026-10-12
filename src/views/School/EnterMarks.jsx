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

export default function EnterMarks() {
    const [activeTab, setActiveTab] = useState("enter");
    const [students, setStudents] = useState([]);
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
        setSubjects(MOCK_SUBJECTS);
    };

    const fetchStudents = async () => {
        setStudents(MOCK_STUDENTS);
    };

    // Filter Logic: Class + optional Subject column filter
    const filteredStudents = students.filter(s => s.class === selectedClass);

    // Apply selectedSubject filter to columns shown in the table
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
        if (value === "" || isNaN(parsed)) {
            setMarks(prev => { const next = { ...prev }; delete next[key]; return next; });
        } else {
            const numValue = Math.min(100, Math.max(0, parsed));
            setMarks(prev => ({ ...prev, [key]: numValue }));
        }
    };

    const getGradeInfo = (mark) => {
        if (mark === undefined || mark === null) return { grade: '-', cls: 'em-badge-none' };
        if (mark >= 90) return { grade: 'A', cls: 'em-badge-A' };
        if (mark >= 80) return { grade: 'B', cls: 'em-badge-B' };
        if (mark >= 70) return { grade: 'C', cls: 'em-badge-C' };
        if (mark >= 60) return { grade: 'D', cls: 'em-badge-D' };
        if (mark >= 40) return { grade: 'E', cls: 'em-badge-E' };
        return { grade: 'F', cls: 'em-badge-F' };
    };

    const getRowAverageGrade = (studentId) => {
        const student = MOCK_STUDENTS.find(s => s.id === studentId);
        if (!student) return { grade: '-', cls: 'em-badge-none' };

        const studentMarks = subjects
            .filter(sub => student.subject_ids.includes(sub.id))
            .map(sub => marks[`${studentId}-${sub.id}`])
            .filter(m => m !== undefined && m > 0);

        if (studentMarks.length === 0) return { grade: '-', cls: 'em-badge-none' };
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
            <ToastNote show={toast.show} onClose={() => setToast({ ...toast, show: false })} message={toast.message} variant={toast.variant} />

            <div className="em-wrapper">
                {/* Header */}
                <div className="em-header">
                    <div className="em-header-icon"><i className="bi bi-grid-3x3-gap"></i></div>
                    <div className="em-header-text">
                        <div className="em-header-title">Gradebook Matrix</div>
                        <div className="em-header-sub">Enter marks for all students and subjects</div>
                    </div>
                    <div className="em-header-stat">
                        {/* Optional stat in header if needed */}
                        <div className="em-stat-num">{students.length}</div>
                        <div className="em-stat-lbl">Total</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="em-tabs-bar">
                    <div className="em-tabs">
                        <button className={`em-tab ${activeTab === 'enter' ? 'em-active' : ''}`} onClick={() => setActiveTab('enter')}>
                            <i className="bi bi-pencil-square em-tab-icon"></i> Enter Marks
                        </button>
                        <button className={`em-tab ${activeTab === 'stats' ? 'em-active' : ''}`} onClick={() => { setActiveTab('stats'); calculateStats(); }}>
                            <i className="bi bi-graph-up em-tab-icon"></i> Analytics
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="em-body">

                    {/* --- ENTER MARKS TAB --- */}
                    {activeTab === 'enter' && (
                        <>
                            {/* Filters */}
                            <div className="em-controls">
                                <div className="em-controls-inner">
                                    <div className="em-field">
                                        <label className="em-label">Select Class</label>
                                        <select className="em-select" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setCurrentPage(1); }}>
                                            <option value="">Choose Class...</option>
                                            {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="em-field">
                                        <label className="em-label">Subject</label>
                                        <select className="em-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                                            <option value="All Subjects">All Subjects</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Matrix Table */}
                            {selectedClass && filteredStudents.length > 0 ? (
                                <div className="em-table-container">
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                                        <button className="em-btn-primary" onClick={handleSubmit}>
                                            <i className="bi bi-check-lg"></i> Save All Marks
                                        </button>
                                    </div>
                                    <table className="em-table">
                                        <thead>
                                            <tr>
                                                <th className="em-th em-sticky-left">
                                                    Student Info
                                                </th>
                                                {visibleSubjects.map(sub => (
                                                    <th key={sub.id} className="em-th">
                                                        {sub.name}
                                                    </th>
                                                ))}
                                                <th className="em-th">Avg</th>
                                                <th className="em-th">Save</th>
                                                <th className="em-th">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentStudents.map(student => {
                                                const avgGrade = getRowAverageGrade(student.id);
                                                return (
                                                    <tr key={student.id}>
                                                        <td className="em-td em-sticky-left">
                                                            <div className="em-student-info">
                                                                <div className="em-main-name">{student.firstname} {student.lastname}</div>
                                                                <div className="em-sub-name">{student.middlename || '-'}</div>
                                                                <div className="em-meta">
                                                                    <span className="em-num">{student.student_number}</span>
                                                                    <span className="em-class-badge">{student.class}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {visibleSubjects.map(sub => {
                                                            const key = `${student.id}-${sub.id}`;
                                                            const mark = marks[key];
                                                            const gradeInfo = getGradeInfo(mark);
                                                            const takesSubject = student.subject_ids.includes(sub.id);

                                                            return (
                                                                <td key={key} className="em-td">
                                                                    {takesSubject ? (
                                                                        <div className="em-mark-cell">
                                                                            <input
                                                                                type="number"
                                                                                className="em-mark-input"
                                                                                min="0" max="100"
                                                                                placeholder="-"
                                                                                value={mark !== undefined ? mark : ''}
                                                                                onChange={e => handleMarkChange(student.id, sub.id, e.target.value)}
                                                                            />
                                                                            {mark !== undefined && mark > 0 && (
                                                                                <span className={`em-grade-badge ${gradeInfo.cls}`}>
                                                                                    {gradeInfo.grade}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ color: '#e2e8f0', fontSize: 20, fontWeight: 'bold' }}>—</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}

                                                        <td className="em-td" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                            {avgGrade.grade !== '-' ? (
                                                                <span className={`em-grade-badge ${avgGrade.cls}`}>{avgGrade.grade}</span>
                                                            ) : <span>-</span>}
                                                        </td>

                                                        <td className="em-td" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                            <button className="em-btn-small" onClick={() => saveStudentMarks(student.id)}>
                                                                <i className="bi bi-save"></i>
                                                            </button>
                                                        </td>

                                                        <td className="em-td" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                <button className="em-btn-icon" title="Edit Student" onClick={() => handleEditStudent(student)}>
                                                                    <i className="bi bi-pencil-fill"></i>
                                                                </button>
                                                                <button className="em-btn-icon em-btn-danger" title="Delete Student" onClick={() => handleDeleteStudent(student)}>
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
                                    <div className="em-pagination">
                                        <div className="em-pagination-info">
                                            Page {currentPage} of {totalPages} ({filteredStudents.length} Students)
                                        </div>
                                        <div className="em-page-btns">
                                            <button className="em-page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <button
                                                    key={i}
                                                    className={`em-page-btn ${currentPage === i + 1 ? 'em-page-active' : ''}`}
                                                    onClick={() => handlePageChange(i + 1)}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button className="em-page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="em-empty-state">
                                    <i className="bi bi-grid-3x3-gap em-empty-icon"></i>
                                    <h3>No Students Found</h3>
                                    <p>Please select a class to view the gradebook.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* --- STATS TAB --- */}
                    {activeTab === 'stats' && (
                        <div className="em-fade-up">
                            {stats ? (
                                <div className="em-card">
                                    <h4 className="em-card-title">
                                        <i className="bi bi-graph-up me-2"></i> Performance Overview
                                    </h4>
                                    <div className="em-stats-grid">
                                        <div className="em-stat-box">
                                            <div className="em-stat-val">{stats.avg}</div>
                                            <div className="em-stat-lbl">Average Mark</div>
                                        </div>
                                        <div className="em-stat-box">
                                            <div className="em-stat-val em-stat-high">{stats.high}</div>
                                            <div className="em-stat-lbl">Highest Mark</div>
                                        </div>
                                        <div className="em-stat-box">
                                            <div className="em-stat-val em-stat-low">{stats.low}</div>
                                            <div className="em-stat-lbl">Lowest Mark</div>
                                        </div>
                                        <div className="em-stat-box">
                                            <div className="em-stat-val em-stat-pass">{stats.passRate}%</div>
                                            <div className="em-stat-lbl">Pass Rate ({stats.passes}/{stats.total})</div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="em-empty-state">
                                    <i className="bi bi-bar-chart em-empty-icon"></i>
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