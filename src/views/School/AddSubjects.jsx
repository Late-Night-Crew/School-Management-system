import React, { useState, useEffect } from "react";
import ToastNote from "../../components/ToastNote";
import { AUTH_TOKEN_KEY } from "../constants/storageKeys";

export default function AddSubjects() {

    /* ──────────────────────────────────────────────────────────
       STATE
    ────────────────────────────────────────────────────────── */
    const [activeTab, setActiveTab] = useState("add");

    const [subjects, setSubjects] = useState([]);
    const [classes, setClasses] = useState([]);
    const [classSubjects, setClassSubjects] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [isFetching, setIsFetching] = useState(false);

    /* Pagination */
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    /* Add Subject Form */
    const [subjectForm, setSubjectForm] = useState({
        name: "",
        code: "",
    });

    /* Assign Subject Form */
    const [assignForm, setAssignForm] = useState({
        subjectId: "",
        class: "",
        optional: false
    });

    const [toast, setToast] = useState({
        show: false,
        message: "",
        variant: "success"
    });

    /* ──────────────────────────────────────────────────────────
       EFFECTS
    ────────────────────────────────────────────────────────── */
    useEffect(() => {
        fetchSubjects();
        fetchClasses();
        fetchClassSubjects();
    }, []);

    /* ──────────────────────────────────────────────────────────
       TOAST
    ────────────────────────────────────────────────────────── */
    const showToast = (message, variant = "success") => {
        setToast({
            show: true,
            message,
            variant
        });

        setTimeout(() => {
            setToast(prev => ({
                ...prev,
                show: false
            }));
        }, 3000);
    };

    const hideToast = () => {
        setToast(prev => ({
            ...prev,
            show: false
        }));
    };

    /* ──────────────────────────────────────────────────────────
       FETCH DATA
    ────────────────────────────────────────────────────────── */
    const fetchSubjects = async () => {
        setIsFetching(true);

        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);

            const response = await fetch("/api/subjects", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            setSubjects(data || []);

        } catch (error) {
            console.error(error);
            showToast("Failed to load subjects", "danger");
        } finally {
            setIsFetching(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);

            const response = await fetch("/api/classes", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            setClasses(data || []);

        } catch (error) {
            console.error(error);
        }
    };

    const fetchClassSubjects = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);

            const response = await fetch("/api/class-subjects", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            setClassSubjects(data || []);

        } catch (error) {
            console.error(error);
        }
    };

    /* ──────────────────────────────────────────────────────────
       ADD SUBJECT
    ────────────────────────────────────────────────────────── */
    const handleAddSubject = async (e) => {
        e.preventDefault();

        if (!subjectForm.name.trim() || !subjectForm.code.trim()) {
            showToast("Please fill in Name and Code.", "warning");
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
                showToast("Subject added successfully!");

                setSubjectForm({
                    name: "",
                    code: "",
                });

                fetchSubjects();
            }

        } catch (error) {
            console.error(error);
            showToast("Failed to add subject.", "danger");
        }
    };

    /* ──────────────────────────────────────────────────────────
       ASSIGN SUBJECT
    ────────────────────────────────────────────────────────── */
    const handleAssignSubject = async (e) => {
        e.preventDefault();

        if (!assignForm.subjectId || !assignForm.class) {
            showToast("Please select Subject and Class.", "warning");
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
                body: JSON.stringify(assignForm)
            });

            if (response.ok) {
                showToast("Subject assigned successfully!");

                setAssignForm({
                    subjectId: "",
                    class: "",
                    optional: false
                });

                fetchClassSubjects();
            }

        } catch (error) {
            console.error(error);
            showToast("Failed to assign subject.", "danger");
        }
    };

    /* ──────────────────────────────────────────────────────────
       DELETE SUBJECT
    ────────────────────────────────────────────────────────── */
    const handleDeleteSubject = async (subjectId) => {

        if (!window.confirm("Delete this subject?")) return;

        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);

            const response = await fetch(`/api/subjects/${subjectId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast("Subject deleted successfully!");

                fetchSubjects();
                fetchClassSubjects();
            }

        } catch (error) {
            console.error(error);
            showToast("Failed to delete subject.", "danger");
        }
    };

    /* ──────────────────────────────────────────────────────────
       DELETE ASSIGNMENT
    ────────────────────────────────────────────────────────── */
    const handleDeleteAssignment = async (assignmentId) => {

        if (!window.confirm("Remove this assignment?")) return;

        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);

            const response = await fetch(`/api/class-subjects/${assignmentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                showToast("Assignment removed successfully!");

                fetchClassSubjects();
            }

        } catch (error) {
            console.error(error);
            showToast("Failed to remove assignment.", "danger");
        }
    };

    /* ──────────────────────────────────────────────────────────
       FILTERING
    ────────────────────────────────────────────────────────── */
    const filteredSubjects = subjects.filter(sub =>
        sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    /* ──────────────────────────────────────────────────────────
       PAGINATION
    ────────────────────────────────────────────────────────── */
    const indexOfLastItem = currentPage * itemsPerPage;

    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const currentItems = filteredSubjects.slice(
        indexOfFirstItem,
        indexOfLastItem
    );

    const totalPages = Math.ceil(
        filteredSubjects.length / itemsPerPage
    );

    /* ──────────────────────────────────────────────────────────
       RENDER
    ────────────────────────────────────────────────────────── */
    return (
        <>
            <ToastNote
                show={toast.show}
                onClose={hideToast}
                message={toast.message}
                variant={toast.variant}
            />

            <div className="sr-wrapper">

                {/* HEADER */}
                <div className="sr-header">

                    <div className="sr-header-left">

                        <div className="sr-header-icon">
                            <i className="bi bi-journal-plus"></i>
                        </div>

                        <div className="sr-header-text">
                            <div className="sr-header-title">
                                Subject Management
                            </div>

                            <div className="sr-header-sub">
                                Add, Assign & Manage Subjects
                            </div>
                        </div>

                    </div>

                    <div className="sr-header-right">

                        <div className="sr-badge">
                            Total: {subjects.length}
                        </div>

                        <button
                            className="sr-btn-action"
                            title="Settings"
                        >
                            <i className="bi bi-gear"></i>
                        </button>

                    </div>

                </div>

                {/* TABS */}
                <div className="sr-tabs">

                    <button
                        className={`sr-tab-btn ${
                            activeTab === "add"
                                ? "sr-tab-btn--active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("add")}
                    >
                        <i className="bi bi-plus-circle-fill"></i>
                        Add Subject
                    </button>

                    <button
                        className={`sr-tab-btn ${
                            activeTab === "assign"
                                ? "sr-tab-btn--active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("assign")}
                    >
                        <i className="bi bi-diagram-2"></i>
                        Assign Subject
                    </button>

                    <button
                        className={`sr-tab-btn ${
                            activeTab === "list"
                                ? "sr-tab-btn--active"
                                : ""
                        }`}
                        onClick={() => setActiveTab("list")}
                    >
                        <i className="bi bi-list-check"></i>
                        Subject List

                        <span className="sr-tab-badge">
                            {filteredSubjects.length}
                        </span>
                    </button>

                </div>

                {/* ADD SUBJECT */}
                {activeTab === "add" && (

                    <div className="sr-card fade-up">

                        <div className="sr-card-head">
                            <div>
                                <div className="sr-card-title">
                                    Add Subject
                                </div>

                                <div className="sr-card-sub">
                                    Create a new subject
                                </div>
                            </div>
                        </div>

                        <div className="sr-card-body">

                            <form
                                onSubmit={handleAddSubject}
                                className="sr-grid sr-grid-2"
                            >

                                <div className="sr-field">
                                    <label className="sr-label">
                                        Subject Name
                                    </label>

                                    <input
                                        type="text"
                                        className="sr-input"
                                        placeholder="Mathematics"
                                        value={subjectForm.name}
                                        onChange={(e) =>
                                            setSubjectForm({
                                                ...subjectForm,
                                                name: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className="sr-field">
                                    <label className="sr-label">
                                        Subject Code
                                    </label>

                                    <input
                                        type="text"
                                        className="sr-input"
                                        placeholder="MATH-101"
                                        value={subjectForm.code}
                                        onChange={(e) =>
                                            setSubjectForm({
                                                ...subjectForm,
                                                code: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div
                                    className="sr-field"
                                    style={{ gridColumn: "1 / -1" }}
                                >
                                

                                    
                                </div>

                                <div
                                    className="sr-field"
                                    style={{ gridColumn: "1 / -1" }}
                                >
                                    <div className="sr-actions">

                                        <button
                                            type="submit"
                                            className="sr-btn sr-btn-primary"
                                        >
                                            <i className="bi bi-plus-circle"></i>
                                            Create Subject
                                        </button>

                                    </div>
                                </div>

                            </form>

                        </div>

                    </div>
                )}

                {/* ASSIGN SUBJECT */}
                {activeTab === "assign" && (

                    <div className="sr-card fade-up">

                        <div className="sr-card-head">

                            <div>
                                <div className="sr-card-title">
                                    Assign Subject
                                </div>

                                <div className="sr-card-sub">
                                    Link subjects to classes
                                </div>
                            </div>

                        </div>

                        <div className="sr-card-body">

                            <form onSubmit={handleAssignSubject}>

                                <div className="sr-grid sr-grid-2">

                                    <div className="sr-field">
                                        <label className="sr-label">
                                            Subject
                                        </label>

                                        <select
                                            className="sr-select"
                                            value={assignForm.subjectId}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    subjectId: e.target.value
                                                })
                                            }
                                        >
                                            <option value="">
                                                Select Subject
                                            </option>

                                            {subjects.map(sub => (
                                                <option
                                                    key={sub.id}
                                                    value={sub.id}
                                                >
                                                    {sub.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="sr-field">
                                        <label className="sr-label">
                                            Class
                                        </label>

                                        <select
                                            className="sr-select"
                                            value={assignForm.class}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    class: e.target.value
                                                })
                                            }
                                        >
                                            <option value="">
                                                Select Class
                                            </option>
                                            

                                            {classes.map(cls => (
                                                <option
                                                    key={cls.id}
                                                    value={cls.id}
                                                >
                                                    {cls.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                </div>

                                <div
                                    style={{
                                        marginTop: "18px"
                                    }}
                                >
                                    <label
                                        style={{
                                            display: "flex",
                                            gap: "10px",
                                            alignItems: "center"
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={assignForm.optional}
                                            onChange={(e) =>
                                                setAssignForm({
                                                    ...assignForm,
                                                    optional: e.target.checked
                                                })
                                            }
                                        />

                                        Optional Subject
                                    </label>
                                </div>

                                <div className="sr-actions">

                                    <button
                                        type="submit"
                                        className="sr-btn sr-btn-primary"
                                    >
                                        <i className="bi bi-diagram-2"></i>
                                        Assign Subject
                                    </button>

                                </div>

                            </form>

                            {/* ASSIGNMENTS */}
                            {classSubjects.length > 0 && (

                                <div className="sr-table-wrap">

                                    <table className="sr-table">

                                        <thead>
                                            <tr>
                                                <th>Subject</th>
                                                <th>Class</th>
                                                <th>Type</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {classSubjects.map(assignment => {

                                                const subject = subjects.find(
                                                    s => s.id === assignment.subjectId
                                                );

                                                return (
                                                    <tr key={assignment.id}>

                                                        <td>
                                                            {subject?.name}
                                                        </td>

                                                        <td>
                                                            {assignment.class}
                                                        </td>

                                                        <td>
                                                            {assignment.optional
                                                                ? "Optional"
                                                                : "Required"}
                                                        </td>

                                                        <td>

                                                            <button
                                                                className="sr-btn-ghost sr-btn-danger-ghost"
                                                                onClick={() =>
                                                                    handleDeleteAssignment(
                                                                        assignment.id
                                                                    )
                                                                }
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
                            )}

                        </div>

                    </div>
                )}

                {/* SUBJECT LIST */}
                {activeTab === "list" && (

                    <div className="sr-card fade-up">

                        <div className="sr-card-head">

                            <div>
                                <div className="sr-card-title">
                                    All Subjects
                                </div>

                                <div className="sr-card-sub">
                                    Manage existing subjects
                                </div>
                            </div>

                        </div>

                        <div className="sr-card-body">

                            {/* SEARCH */}
                            <div
                                className="sr-field"
                                style={{ marginBottom: "18px" }}
                            >
                                <input
                                    type="text"
                                    className="sr-input"
                                    placeholder="Search subjects..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>

                            {filteredSubjects.length > 0 ? (
                                <>
                                    <div className="sr-table-wrap">

                                        <table className="sr-table">

                                            <thead>
                                                <tr>
                                                    <th>Code</th>
                                                    <th>Name</th>
                                                    
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>

                                            <tbody>

                                                {currentItems.map(subject => (

                                                    <tr key={subject.id}>

                                                        <td>
                                                            {subject.code}
                                                        </td>

                                                        <td>
                                                            <strong>
                                                                {subject.name}
                                                            </strong>
                                                        </td>

                                                        

                                                        <td>

                                                            <button
                                                                className="sr-btn-ghost sr-btn-danger-ghost"
                                                                onClick={() =>
                                                                    handleDeleteSubject(
                                                                        subject.id
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>

                                                        </td>

                                                    </tr>
                                                ))}

                                            </tbody>

                                        </table>

                                    </div>

                                    {/* PAGINATION */}
                                    <div className="sr-pagination">

                                        <button
                                            className="sr-page-btn"
                                            disabled={currentPage === 1}
                                            onClick={() =>
                                                setCurrentPage(prev =>
                                                    Math.max(prev - 1, 1)
                                                )
                                            }
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>

                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => (
                                                <button
                                                    key={i + 1}
                                                    className={`sr-page-btn ${
                                                        currentPage === i + 1
                                                            ? "sr-page-active"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        setCurrentPage(i + 1)
                                                    }
                                                >
                                                    {i + 1}
                                                </button>
                                            )
                                        )}

                                        <button
                                            className="sr-page-btn"
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            onClick={() =>
                                                setCurrentPage(prev =>
                                                    Math.min(
                                                        prev + 1,
                                                        totalPages
                                                    )
                                                )
                                            }
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>

                                    </div>
                                </>
                            ) : (

                                <div className="sr-empty-state">

                                    <i className="bi bi-search"></i>

                                    <h3>No subjects found</h3>

                                    <p>
                                        Adjust your search term.
                                    </p>

                                </div>
                            )}

                        </div>

                    </div>
                )}

            </div>
        </>
    );
}