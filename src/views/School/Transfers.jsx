import React, { useState, useEffect } from "react";
import { AUTH_TOKEN_KEY } from "../constants/storageKeys";
import "./Transfers.css";

export default function SchoolTransfers() {
    const [activeTab, setActiveTab] = useState("initiate");
    const [transfers, setTransfers] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [schools, setSchools] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [filteredSchools, setFilteredSchools] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Student search and selection
    const [studentSearch, setStudentSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentSearchResults, setStudentSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Initiate Transfer Form State
    const [initiateForm, setInitiateForm] = useState({
        studentId: "",
        toSchoolId: "",
        districtId: "",
        reason: "",
        transferDate: ""
    });

    useEffect(() => {
        fetchTransfers();
        fetchIncomingRequests();
        fetchSchools();
        fetchDistricts();
    }, []);

    // Filter schools when district changes
    useEffect(() => {
        if (initiateForm.districtId) {
            const filtered = schools.filter(school => school.district_id === parseInt(initiateForm.districtId));
            setFilteredSchools(filtered);
        } else {
            setFilteredSchools(schools);
        }
    }, [initiateForm.districtId, schools]);

    const fetchTransfers = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/school/transfers", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setTransfers(data || []);
        } catch (error) {
            console.error("Error fetching transfers:", error);
        }
    };

    const fetchIncomingRequests = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/api/school/incoming-transfers", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setIncomingRequests(data || []);
        } catch (error) {
            console.error("Error fetching incoming requests:", error);
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

    const fetchSchools = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/admin/schools", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setSchools(data || []);
        } catch (error) {
            console.error("Error fetching schools:", error);
        }
    };

    const fetchDistricts = async () => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/admin/districts", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setDistricts(data || []);
        } catch (error) {
            console.error("Error fetching districts:", error);
        }
    };

    const searchStudents = async (query) => {
        if (!query.trim()) {
            setStudentSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            // Search by student number or name
            const params = new URLSearchParams();
            if (!isNaN(query)) {
                // If it's a number, search by student number
                params.append('student_number', query);
            } else {
                // If it's text, search by first name or last name
                params.append('first_name', query);
                params.append('last_name', query);
            }

            const response = await fetch(`/admin/students?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setStudentSearchResults(data || []);
        } catch (error) {
            console.error("Error searching students:", error);
            setStudentSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setInitiateForm(prev => ({ ...prev, studentId: student.id }));
        setStudentSearch(`${student.first_name} ${student.last_name} (${student.student_number})`);
        setStudentSearchResults([]);
    };

    const clearStudentSelection = () => {
        setSelectedStudent(null);
        setInitiateForm(prev => ({ ...prev, studentId: "" }));
        setStudentSearch("");
        setStudentSearchResults([]);
    };

    const handleInitiateTransfer = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !initiateForm.toSchoolId || !initiateForm.reason) {
            alert("Please select a student, destination school, and reason");
            return;
        }

        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch("/school/transfers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: selectedStudent.id,
                    to_school: parseInt(initiateForm.toSchoolId),
                    date_initiated: initiateForm.transferDate,
                    reason: initiateForm.reason
                })
            });

            if (response.ok) {
                alert("Transfer request initiated successfully!");
                setInitiateForm({ studentId: "", toSchoolId: "", districtId: "", reason: "", transferDate: "" });
                clearStudentSelection();
                fetchTransfers();
            } else {
                const error = await response.json();
                alert(error.message || "Failed to initiate transfer");
            }
        } catch (error) {
            console.error("Error initiating transfer:", error);
            alert("Failed to initiate transfer");
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchStudents(studentSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [studentSearch]);

    const handleAcceptTransfer = async (transferId, action) => {
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const response = await fetch(`/api/transfers/${transferId}/${action}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert(`Transfer ${action}ed successfully!`);
                fetchIncomingRequests();
                fetchTransfers();
            }
        } catch (error) {
            console.error(`Error ${action}ing transfer:`, error);
            alert(`Failed to ${action} transfer`);
        }
    };

    const filteredTransfers = transfers.filter(transfer =>
        transfer.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.fromSchool?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.toSchool?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTransfers.slice(indexOfFirstItem, indexOfLastItem);

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'completed': 'info',
            'initiated': 'primary'
        };
        return statusMap[status?.toLowerCase()] || 'secondary';
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <h2 className="mb-4 text-center">Transfer Management</h2>

                    {/* Bootstrap Tabs */}
                    <ul className="nav nav-tabs mb-4" id="transferTabs" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'initiate' ? 'active' : ''}`}
                                id="initiate-tab"
                                type="button"
                                role="tab"
                                onClick={() => setActiveTab('initiate')}
                            >
                                <i className="bi bi-send-fill me-2"></i>Initiate Transfer
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'accept' ? 'active' : ''}`}
                                id="accept-tab"
                                type="button"
                                role="tab"
                                onClick={() => setActiveTab('accept')}
                            >
                                <i className="bi bi-check-circle-fill me-2"></i>Accept Requests
                                {incomingRequests.length > 0 && (
                                    <span className="badge bg-danger ms-2">{incomingRequests.length}</span>
                                )}
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button
                                className={`nav-link ${activeTab === 'transfers' ? 'active' : ''}`}
                                id="transfers-tab"
                                type="button"
                                role="tab"
                                onClick={() => setActiveTab('transfers')}
                            >
                                <i className="bi bi-table me-2"></i>All Transfers ({transfers.length})
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content">
                        {/* Initiate Transfer Tab */}
                        {activeTab === 'initiate' && (
                            <div className="tab-pane fade show active">
                                <form onSubmit={handleInitiateTransfer} className="bg-light p-4 rounded shadow-sm">
                                    <div className="row">
                                        {/* Student Search Section */}
                                        <div className="col-12 mb-4">
                                            <div className="student-search-section bg-white p-4 rounded shadow-sm">
                                                <h5 className="mb-3">
                                                    <i className="bi bi-search me-2 text-primary"></i>Search Student
                                                </h5>
                                                <div className="position-relative">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-lg"
                                                        placeholder="Enter student name or student number..."
                                                        value={studentSearch}
                                                        onChange={(e) => setStudentSearch(e.target.value)}
                                                    />
                                                    {isSearching && (
                                                        <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Search Results Dropdown */}
                                                {studentSearchResults.length > 0 && (
                                                    <div className="search-results mt-2 border rounded bg-white shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                        {studentSearchResults.map(student => (
                                                            <div
                                                                key={student.id}
                                                                className="search-result-item p-3 border-bottom cursor-pointer hover-bg-light"
                                                                onClick={() => selectStudent(student)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <i className="bi bi-person-circle me-3 text-primary fs-4"></i>
                                                                    <div>
                                                                        <div className="fw-semibold">
                                                                            {student.first_name} {student.last_name}
                                                                        </div>
                                                                        <small className="text-muted">
                                                                            Student #: {student.student_number} | Form {student.form_level}
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Selected Student Profile */}
                                                {selectedStudent && (
                                                    <div className="student-profile mt-3 p-4 bg-primary text-white rounded shadow-sm">
                                                        <div className="d-flex align-items-start">
                                                            <i className="bi bi-person-circle fs-1 me-4 text-white"></i>
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-2">Student Profile</h6>
                                                                <div className="row">
                                                                    <div className="col-md-6">
                                                                        <p className="mb-1"><strong>Name:</strong> {selectedStudent.first_name} {selectedStudent.last_name}</p>
                                                                        <p className="mb-1"><strong>Student Number:</strong> {selectedStudent.student_number}</p>
                                                                        <p className="mb-1"><strong>Form Level:</strong> {selectedStudent.form_level}</p>
                                                                        <p className="mb-1"><strong>Gender:</strong> {selectedStudent.gender}</p>
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <p className="mb-1"><strong>Date of Birth:</strong> {new Date(selectedStudent.date_of_birth).toLocaleDateString()}</p>
                                                                        <p className="mb-1"><strong>Guardian:</strong> {selectedStudent.guardian_name}</p>
                                                                        <p className="mb-1"><strong>Previous School:</strong> {selectedStudent.previous_school}</p>
                                                                        <p className="mb-1"><strong>Status:</strong> {selectedStudent.status}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-light ms-3"
                                                                onClick={clearStudentSelection}
                                                                title="Clear selection"
                                                            >
                                                                <i className="bi bi-x"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        {/* District Selection */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-geo-alt me-2 text-info"></i>Select District
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={initiateForm.districtId}
                                                onChange={(e) => setInitiateForm(prev => ({
                                                    ...prev,
                                                    districtId: e.target.value,
                                                    toSchoolId: "" // Clear school selection when district changes
                                                }))}
                                            >
                                                <option value="">Choose District (Optional)</option>
                                                {districts.map(district => (
                                                    <option key={district.id} value={district.id}>
                                                        {district.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* School Selection */}
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-building me-2 text-success"></i>Transfer To School
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={initiateForm.toSchoolId}
                                                onChange={(e) => setInitiateForm(prev => ({ ...prev, toSchoolId: e.target.value }))}
                                                required
                                            >
                                                <option value="">
                                                    {initiateForm.districtId ? "Choose School" : "Select District First"}
                                                </option>
                                                {filteredSchools.map(school => (
                                                    <option key={school.id} value={school.id}>
                                                        {school.name} ({school.school_number})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-calendar me-2 text-info"></i>Transfer Date
                                            </label>
                                            <input
                                                type="date"
                                                className="form-control form-control-lg"
                                                value={initiateForm.transferDate}
                                                onChange={(e) => setInitiateForm(prev => ({ ...prev, transferDate: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-semibold">
                                                <i className="bi bi-file-text me-2 text-warning"></i>Reason for Transfer
                                            </label>
                                            <select
                                                className="form-select form-select-lg"
                                                value={initiateForm.reason}
                                                onChange={(e) => setInitiateForm(prev => ({ ...prev, reason: e.target.value }))}
                                                required
                                            >
                                                <option value="">Select Reason</option>
                                                <option value="Family relocation">Family relocation</option>
                                                <option value="School performance">School performance</option>
                                                <option value="Distance">Distance</option>
                                                <option value="Personal reasons">Personal reasons</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg px-5"
                                            disabled={!selectedStudent}
                                        >
                                            <i className="bi bi-send me-2"></i>Initiate Transfer Request
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Accept Requests Tab */}
                        {activeTab === 'accept' && (
                            <div className="tab-pane fade show active">
                                <div className="bg-white p-4 rounded shadow-sm">
                                    <h5 className="mb-4">
                                        <i className="bi bi-inbox-fill me-2 text-primary"></i>Incoming Transfer Requests
                                    </h5>

                                    {incomingRequests.length === 0 ? (
                                        <div className="text-center py-5">
                                            <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                                            <p className="text-muted mt-2">No incoming transfer requests</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th><i className="bi bi-person me-1"></i>Student</th>
                                                        <th><i className="bi bi-building me-1"></i>From School</th>
                                                        <th><i className="bi bi-calendar me-1"></i>Transfer Date</th>
                                                        <th><i className="bi bi-file-text me-1"></i>Reason</th>
                                                        <th><i className="bi bi-gear me-1"></i>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {incomingRequests.map(request => (
                                                        <tr key={request.id}>
                                                            <td className="fw-semibold">
                                                                {request.studentName}
                                                                <br />
                                                                <small className="text-muted">{request.studentNumber}</small>
                                                            </td>
                                                            <td>{request.fromSchool}</td>
                                                            <td>{new Date(request.transferDate).toLocaleDateString()}</td>
                                                            <td>{request.reason}</td>
                                                            <td>
                                                                <div className="btn-group" role="group">
                                                                    <button
                                                                        className="btn btn-sm btn-success"
                                                                        onClick={() => handleAcceptTransfer(request.id, 'accept')}
                                                                        title="Accept Transfer"
                                                                    >
                                                                        <i className="bi bi-check"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => handleAcceptTransfer(request.id, 'reject')}
                                                                        title="Reject Transfer"
                                                                    >
                                                                        <i className="bi bi-x"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* All Transfers Tab */}
                        {activeTab === 'transfers' && (
                            <div className="tab-pane fade show active">
                                <div className="bg-white p-4 rounded shadow-sm">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">
                                            <i className="bi bi-table me-2 text-primary"></i>All Transfer Records
                                        </h5>
                                        <div className="input-group" style={{ maxWidth: '300px' }}>
                                            <span className="input-group-text">
                                                <i className="bi bi-search"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search transfers..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th><i className="bi bi-person me-1"></i>Student</th>
                                                    <th><i className="bi bi-building me-1"></i>From School</th>
                                                    <th><i className="bi bi-building me-1"></i>To School</th>
                                                    <th><i className="bi bi-calendar me-1"></i>Transfer Date</th>
                                                    <th><i className="bi bi-file-text me-1"></i>Reason</th>
                                                    <th><i className="bi bi-flag me-1"></i>Status</th>
                                                    <th><i className="bi bi-clock me-1"></i>Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentItems.map(transfer => (
                                                    <tr key={transfer.id}>
                                                        <td className="fw-semibold">
                                                            {transfer.studentName}
                                                            <br />
                                                            <small className="text-muted">{transfer.studentNumber}</small>
                                                        </td>
                                                        <td>{transfer.fromSchool}</td>
                                                        <td>{transfer.toSchool}</td>
                                                        <td>{new Date(transfer.transferDate).toLocaleDateString()}</td>
                                                        <td>{transfer.reason}</td>
                                                        <td>
                                                            <span className={`badge bg-${getStatusBadge(transfer.status)}`}>
                                                                {transfer.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td>{new Date(transfer.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {filteredTransfers.length === 0 && (
                                        <div className="text-center py-5">
                                            <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                                            <p className="text-muted mt-2">No transfers found matching your search.</p>
                                        </div>
                                    )}

                                    {filteredTransfers.length > itemsPerPage && (
                                        <nav className="mt-4">
                                            <ul className="pagination justify-content-center">
                                                {Array.from({ length: Math.ceil(filteredTransfers.length / itemsPerPage) }, (_, i) => (
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
