import React, { useState, useEffect } from "react";
import { AUTH_TOKEN_KEY } from "../constants/storageKeys";
import "./AddSubjects.css";

export default function AddSubjects() {
    const [activeTab, setActiveTab] = useState("add");
    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [classSubjects, setClassSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Add Subject Form State
    const [subjectForm, setSubjectForm] = useState({
        name: "",
        code: "",
        description: ""
    });

    // Assign Subject Form State
    const [assignForm, setAssignForm] = useState({
        subjectId: "",
        class: "",
        optional: false
    });

    useEffect(() => {
        fetchSubjects();
        fetchClasses();
        fetchClassSubjects();
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

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/classes", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setClasses(data || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
        }
    };

    const fetchClassSubjects = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/class-subjects", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setClassSubjects(data || []);
        } catch (error) {
            console.error("Error fetching class subjects:", error);
        }
    };

    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
            alert("Please fill all required fields");
            return;
        }
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/subjects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(subjectForm)
            });
            if (response.ok) {
                alert("Subject added successfully!");
                setSubjectForm({ name: "", code: "", description: "" });
                fetchSubjects();
            }
        } catch (error) {
            console.error("Error adding subject:", error);
            alert("Failed to add subject");
        }
    };

    const handleAssignSubject = async (e) => {
        e.preventDefault();
        if (!assignForm.subjectId || !assignForm.class) {
            alert("Please select subject and class");
            return;
        }
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/class-subjects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    subjectId: assignForm.subjectId,
                    class: assignForm.class,
                    optional: assignForm.optional
                })
            });
            if (response.ok) {
                alert("Subject assigned successfully!");
                setAssignForm({ subjectId: "", class: "", optional: false });
                fetchClassSubjects();
            }
        } catch (error) {
            console.error("Error assigning subject:", error);
            alert("Failed to assign subject");
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (window.confirm("Are you sure you want to delete this subject?")) {
            try {
                const token = localStorage.getItem(AUTH_TOKEN_KEY);
                const response = await fetch(`/api/subjects/${subjectId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    alert("Subject deleted successfully!");
                    fetchSubjects();
                }
            } catch (error) {
                console.error("Error deleting subject:", error);
            }
        }
    };

    const handleDeleteAssignment = async (classSubjectId) => {
        if (window.confirm("Are you sure you want to remove this assignment?")) {
            try {
                const token = localStorage.getItem(AUTH_TOKEN_KEY);
                const response = await fetch(`/api/class-subjects/${classSubjectId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    alert("Assignment removed successfully!");
                    fetchClassSubjects();
                }
            } catch (error) {
                console.error("Error removing assignment:", error);
            }
        }
    };

    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSubjects.slice(indexOfFirstItem, indexOfLastItem);

    const classOptions = ["Form 1", "Form 1A", "Form 1B", "Form 1C", "Form 1D", "Form 2", "Form 2A", "Form 2B", "Form 2C", "Form 2D", "Form 3", "Form 3A", "Form 3B", "Form 3C", "Form 3D", "Form 4", "Form 4A", "Form 4B", "Form 4C", "Form 4D"];

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <h2 className="mb-4 text-center">Subject Management</h2>

                    {/* Bootstrap Tabs */}
                    <ul className="nav nav-tabs mb-4" id="subjectTabs" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'add' ? 'active' : ''}`}
                                id="add-tab"
                                type="button"
                                role="tab"
                                onClick={() => setActiveTab('add')}
                            >
                                <i className="bi bi-plus-circle-fill me-2"></i>Add Subject
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'assign' ? 'active' : ''}`}
                                id="assign-tab"
                                type="button"
                                role="tab"
                                onClick={() => setActiveTab('assign')}
                            >
                                <i className="bi bi-diagram-2-fill me-2"></i>Assign Subject
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
                                id="list-tab"
                                type="button"
                                role="tab"
                                onClick={() => setActiveTab('list')}
                            >
                                <i className="bi bi-list-check me-2"></i>Subject List ({subjects.length})
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content">
                        {/* Add Subject Tab */}
                        {activeTab === 'add' && (
                            <div className="tab-pane fade show active">
                                <form onSubmit={handleAddSubject} className="bg-light p-4 rounded shadow-sm">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-book me-2 text-primary"></i>Subject Name
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                placeholder="e.g., Mathematics"
                                                value={subjectForm.name}
                                                onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-tag me-2 text-success"></i>Subject Code
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg"
                                                placeholder="e.g., MATH001"
                                                value={subjectForm.code}
                                                onChange={(e) => setSubjectForm(prev => ({ ...prev, code: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-12 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-file-text me-2 text-info"></i>Description (Optional)
                                            </label>
                                            <textarea
                                                className="form-control form-control-lg"
                                                placeholder="Subject description..."
                                                rows="3"
                                                value={subjectForm.description}
                                                onChange={(e) => setSubjectForm(prev => ({ ...prev, description: e.target.value }))}
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <button type="submit" className="btn btn-primary btn-lg px-5">
                                            <i className="bi bi-plus-circle me-2"></i>Add Subject
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Assign Subject Tab */}
                        {activeTab === 'assign' && (
                            <div className="tab-pane fade show active">
                                <form onSubmit={handleAssignSubject} className="bg-light p-4 rounded shadow-sm mb-4">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-book me-2 text-primary"></i>Subject
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={assignForm.subjectId}
                                                onChange={(e) => setAssignForm(prev => ({ ...prev, subjectId: e.target.value }))}
                                                required
                                            >
                                                <option value="">Select Subject</option>
                                                {subjects.map(subject => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.name} ({subject.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-mortarboard me-2 text-success"></i>Class
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={assignForm.class}
                                                onChange={(e) => setAssignForm(prev => ({ ...prev, class: e.target.value }))}
                                                required
                                            >
                                                <option value="">Select Class</option>
                                                {classOptions.map(cls => (
                                                    <option key={cls} value={cls}>{cls}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-12 mb-3">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={assignForm.optional}
                                                    onChange={(e) => setAssignForm(prev => ({ ...prev, optional: e.target.checked }))}
                                                    id="optionalCheck"
                                                />
                                                <label className="form-check-label" htmlFor="optionalCheck">
                                                    <i className="bi bi-star me-2"></i>Optional Subject
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <button type="submit" className="btn btn-success btn-lg px-5">
                                            <i className="bi bi-check-circle me-2"></i>Assign Subject
                                        </button>
                                    </div>
                                </form>

                                {/* Assignments Table */}
                                {classSubjects.length > 0 && (
                                    <div className="bg-white p-4 rounded shadow-sm">
                                        <h5 className="mb-3">
                                            <i className="bi bi-list-check me-2 text-info"></i>Current Assignments
                                        </h5>
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th><i className="bi bi-book me-1"></i>Subject</th>
                                                        <th><i className="bi bi-mortarboard me-1"></i>Class</th>
                                                        <th><i className="bi bi-star me-1"></i>Type</th>
                                                        <th><i className="bi bi-gear me-1"></i>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {classSubjects.map(assignment => {
                                                        const subject = subjects.find(s => s.id === assignment.subjectId);
                                                        return (
                                                            <tr key={assignment.id}>
                                                                <td className="fw-semibold">{subject?.name}</td>
                                                                <td>{assignment.class}</td>
                                                                <td>
                                                                    {assignment.optional ? (
                                                                        <span className="badge bg-warning">Optional</span>
                                                                    ) : (
                                                                        <span className="badge bg-primary">Required</span>
                                                                    )}
                                                                </td>
                                                                <td>
                                                                    <button
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => handleDeleteAssignment(assignment.id)}
                                                                        title="Remove Assignment"
                                                                    >
                                                                        <i className="bi bi-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Subject List Tab */}
                        {activeTab === 'list' && (
                            <div className="tab-pane fade show active">
                                <div className="bg-white p-4 rounded shadow-sm">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">
                                            <i className="bi bi-list-check me-2 text-primary"></i>All Subjects
                                        </h5>
                                        <div className="input-group" style={{ maxWidth: '300px' }}>
                                            <span className="input-group-text">
                                                <i className="bi bi-search"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search subjects..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th><i className="bi bi-hash me-1"></i>Code</th>
                                                    <th><i className="bi bi-book me-1"></i>Name</th>
                                                    <th><i className="bi bi-file-text me-1"></i>Description</th>
                                                    <th><i className="bi bi-gear me-1"></i>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map(subject => (
                                                    <tr key={subject.id}>
                                                        <td className="fw-semibold">{subject.code}</td>
                                                        <td>{subject.name}</td>
                                                        <td>{subject.description || '-'}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDeleteSubject(subject.id)}
                                                                title="Delete Subject"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {filteredSubjects.length === 0 && (
                                        <div className="text-center py-5">
                                            <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                                            <p className="text-muted mt-2">No subjects found.</p>
                                        </div>
                                    )}

                                    {filteredSubjects.length > itemsPerPage && (
                                        <nav className="mt-4">
                                            <ul className="pagination justify-content-center">
                                                {Array.from({ length: Math.ceil(filteredSubjects.length / itemsPerPage) }, (_, i) => (
                                                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </nav>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
