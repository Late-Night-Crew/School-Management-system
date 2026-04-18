import React, { useState, useEffect } from "react";
import { AUTH_TOKEN_KEY } from "../constants/storageKeys";
import "./EnterMarks.css";

export default function EnterMarks() {
    const [activeTab, setActiveTab] = useState("enter");
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [marks, setMarks] = useState({});
    const [classStats, setClassStats] = useState(null);
    const [schoolStats, setSchoolStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const classOptions = ["Form 1", "Form 1A", "Form 1B", "Form 1C", "Form 1D", "Form 2", "Form 2A", "Form 2B", "Form 2C", "Form 2D", "Form 3", "Form 3A", "Form 3B", "Form 3C", "Form 3D", "Form 4", "Form 4A", "Form 4B", "Form 4C", "Form 4D"];

    useEffect(() => {
        fetchSubjects();
        fetchStudents();
    }, []);

    const fetchSubjects = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/subjects", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setSubjects(data || []);
        } catch (error) {
            console.error("Error fetching subjects:", error);
        }
    };

    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/school/students", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setStudents(data || []);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const handleMarksChange = (studentId, value) => {
        const numValue = Math.min(100, Math.max(0, parseInt(value) || 0));
        setMarks(prev => ({ ...prev, [studentId]: numValue }));
    };

    const handleSubmitMarks = async (e) => {
        e.preventDefault();
        if (!selectedClass || !selectedSubject) {
            alert("Please select class and subject");
            return;
        }

        const marksData = Object.entries(marks).map(([studentId, mark]) => ({
            studentId: parseInt(studentId),
            subjectId: parseInt(selectedSubject),
            mark: mark
        }));

        if (marksData.length === 0) {
            alert("Please enter marks for at least one student");
            return;
        }

        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/marks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    class: selectedClass,
                    subjectId: selectedSubject,
                    marks: marksData
                })
            });

            if (response.ok) {
                alert("Marks submitted successfully!");
                setMarks({});
                calculateStatistics();
            }
        } catch (error) {
            console.error("Error submitting marks:", error);
            alert("Failed to submit marks");
        }
    };

    const calculateStatistics = () => {
        // Get students in selected class
        const classStudents = students.filter(s => s.class === selectedClass);
        const classMarks = classStudents
            .map(s => marks[s.id] || 0)
            .filter(m => m > 0);

        if (classMarks.length === 0) return;

        // Class Statistics
        const classAverage = classMarks.length > 0 ? (classMarks.reduce((a, b) => a + b, 0) / classMarks.length).toFixed(2) : 0;
        const classHighest = Math.max(...classMarks);
        const classLowest = Math.min(...classMarks);
        const classPassCount = classMarks.filter(m => m >= 40).length;
        const classPassPercentage = ((classPassCount / classMarks.length) * 100).toFixed(2);

        setClassStats({
            average: classAverage,
            highest: classHighest,
            lowest: classLowest,
            passCount: classPassCount,
            passPercentage: classPassPercentage,
            totalStudents: classStudents.length,
            studentsWithMarks: classMarks.length
        });

        // Overall School Statistics (simplified - uses all current marks)
        const allMarks = Object.values(marks).filter(m => m > 0);
        if (allMarks.length > 0) {
            const schoolAverage = (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(2);
            const schoolHighest = Math.max(...allMarks);
            const schoolLowest = Math.min(...allMarks);
            const schoolPassCount = allMarks.filter(m => m >= 40).length;
            const schoolPassPercentage = ((schoolPassCount / allMarks.length) * 100).toFixed(2);

            setSchoolStats({
                average: schoolAverage,
                highest: schoolHighest,
                lowest: schoolLowest,
                passCount: schoolPassCount,
                passPercentage: schoolPassPercentage,
                totalEntries: allMarks.length
            });
        }
    };

    const filteredStudents = students
        .filter(s => s.class === selectedClass)
        .filter(s => s.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.studentNumber.includes(searchTerm));

    const getMarkGrade = (mark) => {
        if (mark >= 90) return { grade: 'A', color: 'success' };
        if (mark >= 80) return { grade: 'B', color: 'info' };
        if (mark >= 70) return { grade: 'C', color: 'primary' };
        if (mark >= 60) return { grade: 'D', color: 'warning' };
        if (mark >= 40) return { grade: 'E', color: 'danger' };
        return { grade: 'F', color: 'dark' };
    };

    const getPassFailStatus = (mark) => {
        return mark >= 40 ? { status: 'PASS', color: 'success' } : { status: 'FAIL', color: 'danger' };
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <h2 className="mb-4 text-center">Mark Entry & Statistics</h2>

                    {/* Bootstrap Tabs */}
                    <ul className="nav nav-tabs mb-4" id="marksTabs" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'enter' ? 'active' : ''}`}
                                id="enter-tab"
                                type="button"
                                role="tab"
                                onClick={() => setActiveTab('enter')}
                            >
                                <i className="bi bi-pencil-square me-2"></i>Enter Marks
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'statistics' ? 'active' : ''}`}
                                id="statistics-tab"
                                type="button"
                                role="tab"
                                onClick={() => {
                                    setActiveTab('statistics');
                                    calculateStatistics();
                                }}
                            >
                                <i className="bi bi-graph-up me-2"></i>Statistics
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content">
                        {/* Enter Marks Tab */}
                        {activeTab === 'enter' && (
                            <div className="tab-pane fade show active">
                                <form onSubmit={handleSubmitMarks} className="bg-light p-4 rounded shadow-sm mb-4">
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-mortarboard me-2 text-primary"></i>Select Class
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={selectedClass}
                                                onChange={(e) => {
                                                    setSelectedClass(e.target.value);
                                                    setMarks({});
                                                    setSearchTerm("");
                                                }}
                                                required
                                            >
                                                <option value="">Choose Class</option>
                                                {classOptions.map(cls => (
                                                    <option key={cls} value={cls}>{cls}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-book me-2 text-success"></i>Select Subject
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                required
                                            >
                                                <option value="">Choose Subject</option>
                                                {subjects.map(subject => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name} ({subject.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-search me-2 text-info"></i>Search Student
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                placeholder="Name or number..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                disabled={!selectedClass}
                                            />
                                        </div>
                                    </div>
                                </form>

                                {selectedClass && selectedSubject && (
                                    <div className="bg-white p-4 rounded shadow-sm mb-4">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5 className="mb-0">
                                                <i className="bi bi-people me-2 text-primary"></i>
                                                Students in {selectedClass}
                                            </h5>
                                            <span className="badge bg-primary">
                                                {filteredStudents.length} students
                                            </span>
                                        </div>

                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th><i className="bi bi-hash me-1"></i>Number</th>
                                                        <th><i className="bi bi-person me-1"></i>Name</th>
                                                        <th style={{ width: '200px' }}>
                                                            <i className="bi bi-pencil me-1"></i>Marks (0-100)
                                                        </th>
                                                        <th><i className="bi bi-star me-1"></i>Grade</th>
                                                        <th><i className="bi bi-check-circle me-1"></i>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredStudents.map(student => {
                                                        const studentMark = marks[student.id] || 0;
                                                        const gradeInfo = getMarkGrade(studentMark);
                                                        const statusInfo = getPassFailStatus(studentMark);
                                                        return (
                                                            <tr key={student.id}>
                                                                <td className="fw-semibold">{student.studentNumber}</td>
                                                                <td>{student.firstname} {student.lastname}</td>
                                                                <td>
                                                                    <div className="input-group">
                                                                        <input
                                                                            type="number"
                                                                            className="form-control"
                                                                            min="0"
                                                                            max="100"
                                                                            value={studentMark}
                                                                            onChange={(e) => handleMarksChange(student.id, e.target.value)}
                                                                            placeholder="0"
                                                                        />
                                                                        <span className="input-group-text">/100</span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    {studentMark > 0 && (
                                                                        <span className={`badge bg-${gradeInfo.color}`}>
                                                                            {gradeInfo.grade}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    {studentMark > 0 && (
                                                                        <span className={`badge bg-${statusInfo.color}`}>
                                                                            {statusInfo.status}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="text-center mt-4">
                                            <button type="submit" className="btn btn-success btn-lg px-5" onClick={handleSubmitMarks}>
                                                <i className="bi bi-check-circle me-2"></i>Submit Marks
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!selectedClass && (
                                    <div className="alert alert-info text-center" role="alert">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Please select a class and subject to begin entering marks
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Statistics Tab */}
                        {activeTab === 'statistics' && (
                            <div className="tab-pane fade show active">
                                {classStats ? (
                                    <div className="row">
                                        {/* Class Statistics */}
                                        <div className="col-12 mb-4">
                                            <div className="bg-white p-4 rounded shadow-sm">
                                                <h4 className="mb-4 text-primary">
                                                    <i className="bi bi-graph-up me-2"></i>Class Statistics: {selectedClass}
                                                </h4>
                                                <div className="row">
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-primary text-white p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">Average Mark</h6>
                                                            <h2 className="mb-0">{classStats.average}</h2>
                                                            <small>/100</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-success text-white p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">Highest Mark</h6>
                                                            <h2 className="mb-0">{classStats.highest}</h2>
                                                            <small>/100</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-warning text-dark p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">Lowest Mark</h6>
                                                            <h2 className="mb-0">{classStats.lowest}</h2>
                                                            <small>/100</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-info text-white p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">Pass Rate</h6>
                                                            <h2 className="mb-0">{classStats.passPercentage}%</h2>
                                                            <small>{classStats.passCount}/{classStats.studentsWithMarks}</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Breakdown */}
                                        <div className="col-12 mb-4">
                                            <div className="bg-white p-4 rounded shadow-sm">
                                                <h5 className="mb-4 text-success">
                                                    <i className="bi bi-bar-chart me-2"></i>Performance Breakdown
                                                </h5>
                                                <div className="row text-center">
                                                    <div className="col-md-2">
                                                        <div className="performance-item">
                                                            <div className="grade-badge bg-success">A</div>
                                                            <p className="mt-2">90-100</p>
                                                            <h5>{Object.values(marks).filter(m => m >= 90).length}</h5>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="performance-item">
                                                            <div className="grade-badge bg-info">B</div>
                                                            <p className="mt-2">80-89</p>
                                                            <h5>{Object.values(marks).filter(m => m >= 80 && m < 90).length}</h5>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="performance-item">
                                                            <div className="grade-badge bg-primary">C</div>
                                                            <p className="mt-2">70-79</p>
                                                            <h5>{Object.values(marks).filter(m => m >= 70 && m < 80).length}</h5>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="performance-item">
                                                            <div className="grade-badge bg-warning text-dark">D</div>
                                                            <p className="mt-2">60-69</p>
                                                            <h5>{Object.values(marks).filter(m => m >= 60 && m < 70).length}</h5>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="performance-item">
                                                            <div className="grade-badge bg-danger">E</div>
                                                            <p className="mt-2">40-59</p>
                                                            <h5>{Object.values(marks).filter(m => m >= 40 && m < 60).length}</h5>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="performance-item">
                                                            <div className="grade-badge bg-dark">F</div>
                                                            <p className="mt-2">0-39</p>
                                                            <h5>{Object.values(marks).filter(m => m < 40).length}</h5>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="alert alert-warning text-center" role="alert">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        Enter marks first to view statistics
                                    </div>
                                )}

                                {/* School Performance Summary */}
                                {schoolStats && (
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="bg-white p-4 rounded shadow-sm">
                                                <h4 className="mb-4 text-info">
                                                    <i className="bi bi-building me-2"></i>Overall School Performance
                                                </h4>
                                                <div className="row">
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-secondary text-white p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">School Average</h6>
                                                            <h2 className="mb-0">{schoolStats.average}</h2>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-success text-white p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">School Highest</h6>
                                                            <h2 className="mb-0">{schoolStats.highest}</h2>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-warning text-dark p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">School Lowest</h6>
                                                            <h2 className="mb-0">{schoolStats.lowest}</h2>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3 mb-3">
                                                        <div className="stat-card bg-teal text-white p-4 rounded text-center">
                                                            <h6 className="text-uppercase mb-2">School Pass Rate</h6>
                                                            <h2 className="mb-0">{schoolStats.passPercentage}%</h2>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .stat-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                }
                .grade-badge {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto;
                    font-size: 24px;
                    font-weight: bold;
                    color: white;
                }
                .performance-item {
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 10px;
                }
                .bg-teal {
                    background-color: #17a2b8 !important;
                }
            `}</style>
        </div>
    );
}
