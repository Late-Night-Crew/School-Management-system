import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ToastNote from "../../components/ToastNote";


import SchoolService from "./services/schoolService";
import SchoolStudentService from "./services/studentService";

// --- HELPER COMPONENTS ---
const initials = (fn, ln) => `${(fn||'?')[0]}${(ln||'?')[0]}`.toUpperCase();

export default function SchoolTransfers() {
    const { schoolId } = useParams();
   
    const [activeTab, setActiveTab] = useState("initiate");
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingTransfers, setOutgoingTransfers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [filteredSchools, setFilteredSchools] = useState([]);
    const [students, setStudents] = useState([]); // Replaces MOCK_STUDENTS for search
    
    const [studentSearch, setStudentSearch] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [viewStudent, setViewStudent] = useState(null); 
    
    const [initiateForm, setInitiateForm] = useState({ 
        studentId: "", toSchoolId: "", districtId: "", reason: "", transferDate: "" 
    });
    
    const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
    
    const [incomingPage, setIncomingPage] = useState(1);
    const [outgoingPage, setOutgoingPage] = useState(1);
    const itemsPerPage = 7;

    // --- DATA FETCHING ---
    useEffect(() => {
        fetchDistricts();
        fetchStudents();
        fetchIncomingRequests();
        fetchOutgoingTransfers();
    }, [schoolId]);

    const fetchStudents = async () => {
        try {
            const data = await SchoolStudentService.fetchStudentsForSchool();
            setStudents(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Error fetching students", error); }
    };

    const fetchDistricts = async () => {
        try {
            const data = await SchoolService.fetchDistricts();
            setDistricts(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Error fetching districts", error); }
    };

    const fetchSchoolsByDistrict = async (districtId) => {
        try {
            const data = await SchoolService.fetchSchoolsByDistrict(districtId);
            setFilteredSchools(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Error fetching schools", error); }
    };

    const fetchIncomingRequests = async () => {
        try {
            // Assuming TransferService.getIncomingRequests exists
            // const data = await TransferService.getIncomingRequests(schoolId);
            // setIncomingRequests(data);
            setIncomingRequests([]); // Placeholder until service is connected
        } catch (error) { console.error(error); }
    };

    const fetchOutgoingTransfers = async () => {
        try {
            // const data = await TransferService.getOutgoingTransfers(schoolId);
            // setOutgoingTransfers(data);
            setOutgoingTransfers([]); // Placeholder
        } catch (error) { console.error(error); }
    };

    // --- HANDLERS ---
    const handleDistrictChange = (id) => {
        setInitiateForm(prev => ({ ...prev, districtId: id, toSchoolId: "" }));
        if (!id) {
            setFilteredSchools([]); 
            return;
        }
        fetchSchoolsByDistrict(id);
    };

    const getStatusBadgeClass = (status) => {
        switch(status?.toLowerCase()) {
            case 'completed': return 'st-badge-success';
            case 'approved': return 'st-badge-primary';
            case 'rejected': return 'st-badge-danger';
            case 'initiated': return 'st-badge-warning';
            default: return 'st-badge-muted';
        }
    };

    const clearStudentSelection = () => {
        setSelectedStudent(null);
        setViewStudent(null);
        setStudentSearch("");
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setViewStudent(student); 
        setInitiateForm(prev => ({ ...prev, studentId: student.id, toSchoolId: "", districtId: "", reason: "", transferDate: "" }));
        setStudentSearch("");
    };

    const handleInitiateTransfer = async (e) => {
        if(e) e.preventDefault();
        if (!selectedStudent || !initiateForm.toSchoolId || !initiateForm.reason || !initiateForm.transferDate) {
            setToast({ show: true, message: "Please fill in all required fields.", variant: "warning" });
            return;
        }
        try {
            // await TransferService.createTransferRequest({
            //     student_id: selectedStudent.id,
            //     to_school_id: parseInt(initiateForm.toSchoolId),
            //     date_initiated: initiateForm.transferDate,
            //     reason: initiateForm.reason
            // });
            setToast({ show: true, message: "Transfer request submitted successfully!", variant: "success" });
            setInitiateForm({ studentId: "", toSchoolId: "", districtId: "", reason: "", transferDate: "" });
            setSelectedStudent(null);
            fetchOutgoingTransfers();
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: "Error initiating transfer.", variant: "danger" });
        }
    };

    const handleTransferAction = async (transferId, action) => {
        try {
            // if (action === "accept") await TransferService.approveTransfer(transferId);
            // else if (action === "reject") await TransferService.rejectTransfer(transferId);
            // else if (action === "finalize") await TransferService.finaliseTransfer(transferId);

            setToast({ show: true, message: `Transfer ${action}ed successfully!`, variant: "success" });
            fetchIncomingRequests();
            fetchOutgoingTransfers();
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: "Error processing action.", variant: "danger" });
        }
    };

    // Pagination Logic
    const indexOfLastIncomingItem = incomingPage * itemsPerPage;
    const indexOfFirstIncomingItem = indexOfLastIncomingItem - itemsPerPage;
    const currentIncomingItems = incomingRequests.slice(indexOfFirstIncomingItem, indexOfLastIncomingItem);

    const indexOfLastOutgoingItem = outgoingPage * itemsPerPage;
    const indexOfFirstOutgoingItem = indexOfLastOutgoingItem - itemsPerPage;
    const currentOutgoingItems = outgoingTransfers.slice(indexOfFirstOutgoingItem, indexOfLastOutgoingItem);

    const filteredTransfers = outgoingTransfers.filter(t => {
        if (!studentSearch) return true;
        return t.reason?.toLowerCase().includes(studentSearch.toLowerCase()) || 
               t.status?.toLowerCase().includes(studentSearch.toLowerCase()) ||
               (t.firstname && t.firstname.toLowerCase().includes(studentSearch.toLowerCase()));
    });

    return (
        <>
            <ToastNote show={toast.show} onClose={() => setToast({ ...toast, show: false })} message={toast.message} variant={toast.variant} />
            
            <div className="st-wrapper">
                {/* HEADER */}
                <div className="st-header">
                    <div className="st-header-content">
                        <div className="st-header-text">
                            <div className="st-header-title">School Transfers</div>
                            <div className="st-header-sub">Manage student movement between institutions seamlessly.</div>
                        </div>
                       
                    </div>
                </div>

                {/* TABS */}
                <div className="st-tabs-bar">
                    <button className={`st-tab ${activeTab === 'initiate' ? 'st-active' : ''}`} onClick={() => setActiveTab('initiate')}>
                        <i className="bi bi-send"></i> Initiate Transfer
                    </button>
                    <button className={`st-tab ${activeTab === 'accept' ? 'st-active' : ''}`} onClick={() => setActiveTab('accept')}>
                        <i className="bi bi-inbox"></i> Incoming Requests
                        {incomingRequests.length > 0 && <span className="st-tab-badge">{incomingRequests.length}</span>}
                    </button>
                    <button className={`st-tab ${activeTab === 'transfers' ? 'st-active' : ''}`} onClick={() => setActiveTab('transfers')}>
                        <i className="bi bi-clock-history"></i> Transfer History
                    </button>
                </div>

                {/* INITIATE TAB */}
                {activeTab === 'initiate' && (
                    <div className="st-fade-up">
                        {/* Search Section */}
                        <div className="st-card">
                            <div className="st-card-body">
                                <div className="st-field">
                                    <label className="st-label">Find Student</label>
                                    <div className="st-search-wrapper">
                                        <input
                                            type="text"
                                            className="st-input"
                                            placeholder="Search by name or student number..."
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Search Results Dropdown */}
                                {studentSearch && !selectedStudent && (
                                    <div className="st-search-results">
                                        {students.filter(s => 
                                            (s.firstname + " " + s.lastname).toLowerCase().includes(studentSearch.toLowerCase()) ||
                                            (s.student_number && s.student_number.includes(studentSearch))
                                        ).length > 0 ? (
                                            students.filter(s => 
                                                (s.firstname + " " + s.lastname).toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                (s.student_number && s.student_number.includes(studentSearch))
                                            ).map(s => (
                                                <div key={s.id} className="st-result-item" onClick={() => handleSelectStudent(s)}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div className="st-avatar st-avatar-sm">
                                                            {initials(s.firstname, s.lastname)}
                                                        </div>
                                                        <div>
                                                            <div className="st-result-name">{s.firstname} {s.lastname}</div>
                                                            <div className="st-result-meta">{s.student_number} • {s.form_level}</div>
                                                        </div>
                                                    </div>
                                                    <i className="bi bi-chevron-right" style={{ color: '#cbd5e1' }}></i>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="st-empty-message">No students found matching "{studentSearch}"</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Student Form */}
                        {selectedStudent && (
                            <div className="st-card">
                                <div className="st-card-head">
                                    <div className="st-head-title">
                                        <i className="bi bi-person-check-fill" style={{ color: '#198754', marginRight: 8 }}></i> 
                                        Initiate Transfer for {selectedStudent.firstname}
                                    </div>
                                    <button className="st-btn-icon-sm" onClick={clearStudentSelection} title="Clear Selection">
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="st-card-body">
                                    <form onSubmit={handleInitiateTransfer}>
                                        <div className="st-grid st-grid-2">
                                            <div className="st-field">
                                                <label className="st-label">Transfer Date</label>
                                                <input 
                                                    type="date" 
                                                    className="st-input" 
                                                    value={initiateForm.transferDate} 
                                                    onChange={e => setInitiateForm({...initiateForm, transferDate: e.target.value})} 
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="st-field">
                                                <label className="st-label">District</label>
                                                <select 
                                                    className="st-select" 
                                                    value={initiateForm.districtId} 
                                                    onChange={e => handleDistrictChange(e.target.value)}
                                                >
                                                    <option value="">Select District</option>
                                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="st-field">
                                                <label className="st-label">Destination School</label>
                                                <select 
                                                    className="st-select" 
                                                    value={initiateForm.toSchoolId} 
                                                    onChange={e => setInitiateForm({...initiateForm, toSchoolId: e.target.value})} 
                                                    required 
                                                    disabled={!initiateForm.districtId}
                                                >
                                                    <option value="">Select School</option>
                                                    {filteredSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="st-field" style={{ gridColumn: '1 / -1' }}>
                                                <label className="st-label">Reason for Transfer</label>
                                                <input 
                                                    type="text" 
                                                    className="st-input" 
                                                    placeholder="e.g. Relocation, Academic preference..." 
                                                    value={initiateForm.reason} 
                                                    onChange={e => setInitiateForm({...initiateForm, reason: e.target.value})} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div className="st-form-actions">
                                            <button type="submit" className="st-btn st-btn-primary">
                                                <i className="bi bi-send"></i> Submit Transfer Request
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ACCEPT TAB */}
                {activeTab === 'accept' && (
                    <div className="st-fade-up">
                        <div className="st-card">
                             <div className="st-card-body">
                                <div className="st-field">
                                    <input
                                        type="text"
                                        className="st-input"
                                        placeholder="Filter requests by name or status..."
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="st-table-wrapper">
                                <table className="st-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>From School</th>
                                            <th>Date Initiated</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentIncomingItems.length > 0 ? currentIncomingItems.map(request => (
                                            <tr key={request.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div className="st-avatar st-avatar-sm">
                                                            {initials(request.firstname, request.lastname)}
                                                        </div>
                                                        <div>
                                                            <div className="st-table-name">{request.firstname} {request.lastname}</div>
                                                            <div className="st-table-sub">{request.student_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{request.from_school_name || '-'}</td>
                                                <td>{request.date_initiated ? new Date(request.date_initiated).toLocaleDateString() : '-'}</td>
                                                <td><span className={`st-badge ${getStatusBadgeClass(request.status)}`}>{request.status}</span></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        {request.status === 'initiated' && (
                                                            <>
                                                                <button className="st-btn st-btn-ghost st-btn-sm" onClick={() => handleTransferAction(request.id, 'reject')}>Reject</button>
                                                                <button className="st-btn st-btn-primary st-btn-sm" onClick={() => handleTransferAction(request.id, 'accept')}>Approve</button>
                                                            </>
                                                        )}
                                                        {request.status === 'approved' && (
                                                            <button className="st-btn st-btn-success st-btn-sm" onClick={() => handleTransferAction(request.id, 'finalize')}>Finalize</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5">
                                                    <div className="st-table-empty">
                                                        <i className="bi bi-inbox"></i>
                                                        <div>No incoming requests found.</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {incomingRequests.length > itemsPerPage && (
                                <div className="st-pagination">
                                    {/* Simple pagination controls could go here */}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TRANSFERS HISTORY TAB */}
                {activeTab === 'transfers' && (
                    <div className="st-fade-up">
                        <div className="st-card">
                            <div className="st-card-head">
                                <div className="st-head-title">Outgoing Transfers</div>
                                <select className="st-select st-select-sm">
                                    <option>All Status</option>
                                    <option>Completed</option>
                                    <option>Pending</option>
                                </select>
                            </div>
                            <div className="st-table-wrapper">
                                <table className="st-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>To School</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransfers.length > 0 ? filteredTransfers.map(transfer => (
                                            <tr key={transfer.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div className="st-avatar st-avatar-sm">
                                                            {initials(transfer.firstname, transfer.lastname)}
                                                        </div>
                                                        <div>
                                                            <div className="st-table-name">{transfer.firstname} {transfer.lastname}</div>
                                                            <div className="st-table-sub">{transfer.student_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{transfer.to_school_name || 'N/A'}</td>
                                                <td>{transfer.transfer_date || '-'}</td>
                                                <td><span className={`st-badge ${getStatusBadgeClass(transfer.status)}`}>{transfer.status}</span></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="st-icon-btn" title="View Details"><i className="bi bi-eye"></i></button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5">
                                                    <div className="st-table-empty">
                                                        <i className="bi bi-table"></i>
                                                        <div>No transfer history found.</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}