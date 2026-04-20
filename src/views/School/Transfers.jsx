import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TransferService from "./services/transferService";
import "./Transfers.css";

export default function SchoolTransfers() {
    const { schoolId } = useParams();
    const [activeTab, setActiveTab] = useState("initiate");
    const [transfers, setTransfers] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingTransfers, setOutgoingTransfers] = useState([]);
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
    const [availableStudents, setAvailableStudents] = useState([]);

    // Initiate Transfer Form State
    const [initiateForm, setInitiateForm] = useState({
        studentId: "",
        toSchoolId: "",
        districtId: "",
        reason: "",
        transferDate: ""
    });

    useEffect(() => {
        if (schoolId) {
            fetchSchoolStudents();
            fetchOutgoingTransfers();
            fetchIncomingRequests();
            fetchDistricts();
            fetchAllSchools();
        }
    }, [schoolId]);

    // Filter schools when district changes
    useEffect(() => {
        if (initiateForm.districtId) {
            const filtered = schools.filter(school => school.district_id === parseInt(initiateForm.districtId));
            setFilteredSchools(filtered);
        } else {
            setFilteredSchools(schools);
        }
    }, [initiateForm.districtId, schools]);

    const fetchSchoolStudents = async () => {
        try {
            const data = await TransferService.fetchStudentsForSchool(schoolId);
            // Filter to ensure only this school's students (safety check)
            const filteredBySchool = data.filter(student => student.school_id === parseInt(schoolId));
            setAvailableStudents(filteredBySchool);
            setStudentSearchResults(filteredBySchool); // Show all students by default
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchOutgoingTransfers = async () => {
        try {
            const data = await TransferService.getOutgoingTransfers(schoolId);
            setOutgoingTransfers(data);
        } catch (error) {
            console.error("Error fetching outgoing transfers:", error);
        }
    };

    const fetchIncomingRequests = async () => {
        try {
            const data = await TransferService.getIncomingTransfers(schoolId);
            setIncomingRequests(data);
        } catch (error) {
            console.error("Error fetching incoming requests:", error);
        }
    };

    const fetchDistricts = async () => {
        try {
            const data = await TransferService.fetchDistricts();
            setDistricts(data);
        } catch (error) {
            console.error("Error fetching districts:", error);
        }
    };

    const fetchAllSchools = async () => {
        try {
            const data = await TransferService.fetchAllSchools();
            setSchools(data);
        } catch (error) {
            console.error("Error fetching schools:", error);
        }
    };

    const searchStudents = (query) => {
        if (!query.trim()) {
            // Show all students when search is empty
            setStudentSearchResults(availableStudents);
            return;
        }

        // Filter available students locally
        const filtered = availableStudents.filter(student =>
            student.first_name?.toLowerCase().includes(query.toLowerCase()) ||
            student.last_name?.toLowerCase().includes(query.toLowerCase()) ||
            student.student_number?.includes(query)
        );

        setStudentSearchResults(filtered);
    };

    const selectStudent = (student) => {
        setSelectedStudent(student);
        setInitiateForm(prev => ({ ...prev, studentId: student.id }));
        setStudentSearch(`${student.first_name} ${student.last_name} (${student.student_number})`);
    };

    const clearStudentSelection = () => {
        setSelectedStudent(null);
        setInitiateForm(prev => ({ ...prev, studentId: "" }));
        setStudentSearch("");
        setStudentSearchResults(availableStudents); // Show all students again
    };

    const handleInitiateTransfer = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !initiateForm.toSchoolId || !initiateForm.reason) {
            alert("Please select a student, destination school, and reason");
            return;
        }

        try {
            await TransferService.createTransferRequest({
                student_id: selectedStudent.id,
                to_school_id: parseInt(initiateForm.toSchoolId),
                date_initiated: initiateForm.transferDate,
                reason: initiateForm.reason
            });

            alert("Transfer request initiated successfully!");
            setInitiateForm({ studentId: "", toSchoolId: "", districtId: "", reason: "", transferDate: "" });
            clearStudentSelection();
            fetchOutgoingTransfers();
        } catch (error) {
            console.error("Error initiating transfer:", error);
            alert("Error: " + error.message);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchStudents(studentSearch);
        }, 500);

        return () => clearTimeout(timer);
    }, [studentSearch, availableStudents]);

    const handleAcceptTransfer = async (transferId, action) => {
        try {
            if (action === "accept") {
                await TransferService.approveTransfer(transferId);
            } else if (action === "reject") {
                await TransferService.rejectTransfer(transferId);
            } else if (action === "finalize") {
                await TransferService.finalizeTransfer(transferId);
            }

            alert(`Transfer ${action}ed successfully!`);
            fetchIncomingRequests();
            fetchOutgoingTransfers();
        } catch (error) {
            console.error(`Error ${action}ing transfer:`, error);
            alert("Error: " + error.message);
        }
    };

    const filteredTransfers = outgoingTransfers.filter(transfer =>
        (transfer.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (transfer.from_school_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (transfer.to_school_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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
                                        {/* Student Search & Table Section */}
                                        <div className="col-12 mb-4">
                                            <div className="student-search-section bg-white p-4 rounded shadow-sm">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <h5 className="mb-0">
                                                        <i className="bi bi-search me-2 text-primary"></i>Select Student
                                                    </h5>
                                                    {selectedStudent && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={clearStudentSelection}
                                                            title="Clear selection"
                                                        >
                                                            <i className="bi bi-x me-1"></i>Clear Selection
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Search Input */}
                                                <div className="mb-3">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-lg"
                                                        placeholder="Search by name or student number..."
                                                        value={studentSearch}
                                                        onChange={(e) => setStudentSearch(e.target.value)}
                                                    />
                                                </div>

                                                {/* Students Table */}
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th><i className="bi bi-person me-1"></i>Name</th>
                                                                <th><i className="bi bi-list-ul me-1"></i>Student #</th>
                                                                <th><i className="bi bi-book me-1"></i>Form</th>
                                                                <th><i className="bi bi-venus-mars me-1"></i>Gender</th>
                                                                <th><i className="bi bi-info-circle me-1"></i>Status</th>
                                                                <th><i className="bi bi-hand-index me-1"></i>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {studentSearchResults.length > 0 ? (
                                                                studentSearchResults.map(student => (
                                                                    <tr key={student.id} className={selectedStudent?.id === student.id ? 'table-primary' : ''}>
                                                                        <td className="fw-semibold">
                                                                            <i className="bi bi-person-circle me-2 text-primary"></i>
                                                                            {student.first_name} {student.last_name}
                                                                        </td>
                                                                        <td>{student.student_number}</td>
                                                                        <td>
                                                                            <span className="badge bg-info">Form {student.form_level}</span>
                                                                        </td>
                                                                        <td>{student.gender}</td>
                                                                        <td>
                                                                            <span className={`badge bg-${student.status === 'active' ? 'success' : 'secondary'}`}>
                                                                                {student.status}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <button
                                                                                type="button"
                                                                                className={`btn btn-sm ${selectedStudent?.id === student.id ? 'btn-primary' : 'btn-outline-primary'}`}
                                                                                onClick={() => selectStudent(student)}
                                                                            >
                                                                                {selectedStudent?.id === student.id ? (
                                                                                    <>
                                                                                        <i className="bi bi-check-circle me-1"></i>Selected
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <i className="bi bi-hand-index me-1"></i>Select
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center text-muted py-4">
                                                                        {availableStudents.length === 0 ? (
                                                                            <>
                                                                                <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                                                                                No students available
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <i className="bi bi-search" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}></i>
                                                                                No students match your search
                                                                            </>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Selected Student Profile */}
                                                {selectedStudent && (
                                                    <div className="student-profile mt-4 p-4 bg-primary text-white rounded shadow-sm">
                                                        <div className="d-flex align-items-start">
                                                            <i className="bi bi-person-circle fs-1 me-4 text-white"></i>
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-3">Selected Student Profile</h6>
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
                                                                        <p className="mb-1"><strong>Previous School:</strong> {selectedStudent.previous_school || 'N/A'}</p>
                                                                        <p className="mb-1"><strong>Status:</strong> {selectedStudent.status}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
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
                                                                {request.student_name}
                                                                <br />
                                                                <small className="text-muted">{request.student_number}</small>
                                                            </td>
                                                            <td>{request.from_school_name}</td>
                                                            <td>{request.date_initiated ? new Date(request.date_initiated).toLocaleDateString() : "N/A"}</td>
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
                                                            {transfer.student_name}
                                                            <br />
                                                            <small className="text-muted">{transfer.student_number}</small>
                                                        </td>
                                                        <td>{transfer.from_school_name}</td>
                                                        <td>{transfer.to_school_name}</td>
                                                        <td>{transfer.date_initiated ? new Date(transfer.date_initiated).toLocaleDateString() : "N/A"}</td>
                                                        <td>{transfer.reason}</td>
                                                        <td>
                                                            <span className={`badge bg-${getStatusBadge(transfer.status)}`}>
                                                                {transfer.status?.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td>{transfer.created_at ? new Date(transfer.created_at).toLocaleDateString() : "N/A"}</td>
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
