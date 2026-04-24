import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ToastNote from "../../components/ToastNote";

// --- MOCK DATA ---
const MOCK_DISTRICTS = [
    { id: 1, name: "Lilongwe" },
    { id: 2, name: "Blenyre" },
    { id: 3, name: "Blantyre" },
    { id: 4, name: "Bwana" },
    { id: 5, name: "Chitipa" },
    { id: 6, name: "Mbare" },
    { id: 7, name: "Chipata" }
];

const MOCK_SCHOOLS = [
    { id: 1, name: "Capital High School", district_id: 1 },
    { id: 2, name: "City High School", district_id: 1 },
    { id: 3, name: "Valley High School", district_id: 1 },
    { id: 4, name: "Springfield High School", district_id: 1 },
    { id: 5, name: "Hillview High School", district_id: 2 },
    { id: 6, name: "Lake Side High School", district_id: 2 },
    { id: 7, name: "Summit High School", district_id: 3 }
];

const MOCK_STUDENTS = [
    { id: 1, student_number: "2024-001", firstname: "John", middlename: "James", lastname: "Banda", form_level: "Form 1", subject_ids: [1, 2, 3], gender: "Male", date_of_birth: "2000-01-01", guardian_name: "Robert Johnson", guardian_phone: "071234567", school_name: "Capital High School" },
    { id: 2, student_number: "2024-002", firstname: "Jane", middlename: "Marie", lastname: "Smith", form_level: "Form 1", subject_ids: [1, 2, 4], gender: "Female", date_of_birth: "2000-05-15", guardian_name: "Jane Smith", guardian_phone: "098765432", school_name: "City High School" },
    { id: 3, student_number: "2024-003", firstname: "Alice", middlename: "Beth", lastname: "Brown", form_level: "Form 2", subject_ids: [1, 3], gender: "Female", date_of_birth: "2000-05-20", guardian_name: "Michael Brown", guardian_phone: "0912345678", school_name: "Valley High School" },
    { id: 4, student_number: "2024-004", firstname: "Bob", middlename: "Lee", lastname: "White", form_level: "Form 2", subject_ids: [1, 2, 3], gender: "Male", date_of_birth: "2000-06-01", guardian_name: "William Davis", guardian_phone: "012345678", school_name: "Springfield High School" },
];

const MOCK_TRANSFERS = [
    { id: 101, student_id: 1, student_number: "2024-001", firstname: "John", lastname: "Doe", from_school_name: "Lilongwe Academy", to_school_name: "City High School", to_school_id: 2, transfer_date: "2024-01-10", status: "completed", reason: "Family relocation", date_initiated: "2024-01-10T12:00:00", created_at: "2024-01-10T12:00:00", updated_at: "2024-01-10T12:01:00" },
    { id: 102, student_id: 2, student_number: "2024-002", firstname: "Jane", lastname: "Smith", from_school_name: "Blantyre Secondary", to_school_name: "Hillview High School", to_school_id: 3, transfer_date: "2024-02-05", status: "approved", reason: "School performance", date_initiated: "2024-02-05T10:12:00", created_at: "2024-02-05T10:12:01", updated_at: "2024-02-05T10:12:00" },
    { id: 103, student_id: 3, student_number: "2024-003", firstname: "Alice", lastname: "Brown", from_school_name: "Chitiri Primary", to_school_name: "Valley High School", to_school_id: 4, transfer_date: "2024-03-01", status: "rejected", reason: "Personal reasons", date_initiated: "2024-03-01T12:00:00", created_at: "2024-03-01T12:00:00" },
    { id: 104, student_id: 4, student_number: "2024-004", firstname: "Bob", middlename: "Lee", lastname: "White", from_school_name: "Bwana Secondary", to_school_name: "Capital High School", to_school_id: 5, transfer_date: "2024-04-05", status: "initiated", reason: "", date_initiated: "", created_at: "" },
    { id: 105, student_id: 1, student_number: "2024-005", firstname: "Charlie", middlename: "Ray", lastname: "Chaplin", from_school_name: "Mitundu Secondary", to_school_name: "Lake Side High School", to_school_id: 6, transfer_date: "2024-05-05", status: "completed", reason: "Distance", date_initiated: "2024-05-05T10:12:00", created_at: "2024-05-05T10:12:00" },
    { id: 106, student_id: 2, firstname: "David", middlename: "Paul", lastname: "Miller", from_school_name: "Summit High School", to_school_name: "Self", to_school_id: 7, transfer_date: "2024-06-01", status: "completed", reason: "Personal reasons", date_initiated: "2024-06-01T12:00:00", created_at: "2024-06-01T12:00:00" },
];

const MOCK_TRANSFER_DATA = [...MOCK_TRANSFERS];
const MOCK_INBOUND = [...MOCK_STUDENTS];

const MOCK_SUBJECTS = [
    { id: 1, name: "Mathematics" },
    { id: 2, name: "English" },
    { id: 3, name: "Combined Science" },
    { id: 4, name: "History" },
    { id: 5, name: "Geography" },
    { id: 6, name: "Biology" },
    { id: 7, name: "Civic Education" }
];

// --- MOCK SERVICES ---
const SchoolService = {
    fetchAllSchools: async () => new Promise(resolve => setTimeout(() => resolve(MOCK_SCHOOLS), 100)),
    fetchDistricts: async () => new Promise(resolve => setTimeout(() => resolve(MOCK_DISTRICTS), 100)),
    fetchStudentsForSchool: async () => new Promise(resolve => setTimeout(() => resolve(MOCK_STUDENTS), 100)),
};

const TransferService = {
    createTransferRequest: async (data) => new Promise(resolve => setTimeout(() => { MOCK_TRANSFER_DATA.push({ ...data, id: Date.now() }); resolve(); }, 100)),
    getOutgoingTransfers: async () => {
        const outgoing = MOCK_TRANSFER_DATA.filter(t => t.to_school_name && t.to_school_name.toLowerCase() !== "self" && t.status !== 'initiated');
        return new Promise(resolve => setTimeout(() => resolve(outgoing), 100));
    },
    getIncomingTransfers: async () => {
        const incoming = MOCK_TRANSFER_DATA.filter(t => t.to_school_name && t.to_school_name.toLowerCase() === "self" || t.status === 'initiated' || t.status === 'approved');
        return new Promise(resolve => setTimeout(() => resolve(incoming), 100));
    },
    getOutgoingRequests: async () => {
        const outgoing = MOCK_TRANSFER_DATA.filter(t => t.to_school_name && t.to_school_name.toLowerCase() !== "self");
        return new Promise(resolve => setTimeout(() => resolve(outgoing), 100));
    },
    getIncomingRequests: async () => {
        const incoming = MOCK_TRANSFER_DATA.filter(t => t.to_school_name && t.to_school_name.toLowerCase() === "self" || t.status === 'initiated');
        return new Promise(resolve => setTimeout(() => resolve(incoming), 100));
    },
    approveTransfer: async (id) => {
        const reqIndex = MOCK_TRANSFER_DATA.findIndex(t => t.id === id);
        if (reqIndex !== -1) { MOCK_TRANSFER_DATA[reqIndex] = { ...MOCK_TRANSFER_DATA[reqIndex], status: "approved", updated_at: new Date() }; return new Promise(resolve => setTimeout(() => resolve(), 100)); }
    },
    rejectTransfer: async (id) => {
        const reqIndex = MOCK_TRANSFER_DATA.findIndex(t => t.id === id);
        if (reqIndex !== -1) { MOCK_TRANSFER_DATA[reqIndex] = { ...MOCK_TRANSFER_DATA[reqIndex], status: "rejected", updated_at: new Date() }; return new Promise(resolve => setTimeout(() => resolve(), 100)); }
    },
    finaliseTransfer: async (id) => {
        const reqIndex = MOCK_TRANSFER_DATA.findIndex(t => t.id === id);
        if (reqIndex !== -1) { MOCK_TRANSFER_DATA[reqIndex] = { ...MOCK_TRANSFER_DATA[reqIndex], status: "completed", updated_at: new Date() }; return new Promise(resolve => setTimeout(() => resolve(), 100)); }
    }
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* GLOBAL RESET & THEME */
body {
  background-color: #F3F4F6;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #1e293b;
}

/* LAYOUT */
.se-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* HEADER */
.page-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.025em;
}
.header-title p {
  color: #64748b;
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
}

/* TABS */
.modern-tabs {
  background: #ffffff;
  padding: 0.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: inline-flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 0.6rem 1.5rem;
  border-radius: 0.75rem;
  font-family: inherit;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.tab-btn:hover {
  background-color: #f8fafc;
  color: #334155;
}

.tab-btn.active {
  background-color: #2563eb;
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

/* CARDS */
.modern-card {
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
  margin-bottom: 2rem;
  transition: transform 0.2s ease;
}

.modern-card-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modern-card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modern-card-body {
  padding: 2rem;
}

/* TABLES */
.table-wrapper {
  overflow-x: auto;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.modern-table thead th {
  background-color: #f8fafc;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.modern-table tbody tr {
  transition: background-color 0.2s;
}

.modern-table tbody tr:hover {
  background-color: #f8fafc;
}

.modern-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
  font-size: 0.9rem;
}

.modern-table tr:last-child td {
  border-bottom: none;
}

/* BADGES */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.025em;
}

.status-completed { background-color: #dcfce7; color: #166534; }
.status-approved { background-color: #dbeafe; color: #1e40af; }
.status-rejected { background-color: #fee2e2; color: #991b1b; }
.status-initiated { background-color: #ffedd5; color: #9a3412; }

/* FORMS & INPUTS */
.modern-input-group {
  margin-bottom: 1.5rem;
}

.modern-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.modern-input, .modern-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5e1;
  font-family: inherit;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
  background-color: #fff;
}

.modern-input:focus, .modern-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.modern-input:disabled {
  background-color: #f1f5f9;
  color: #94a3b8;
}

/* BUTTONS */
.btn-modern {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.btn-icon-only {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-icon-only:hover {
  background-color: #f1f5f9;
}

/* AVATARS */
.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  font-size: 0.9rem;
  margin-right: 1rem;
  text-transform: uppercase;
}

.bg-gradient-1 { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.bg-gradient-2 { background: linear-gradient(135deg, #ec4899, #db2777); }
.bg-gradient-3 { background: linear-gradient(135deg, #10b981, #059669); }
.bg-gradient-4 { background: linear-gradient(135deg, #f59e0b, #d97706); }

/* LIST ITEMS (Search Results) */
.search-result-item {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-result-item:hover {
  background-color: #f8fafc;
}

.search-result-item:last-child {
  border-bottom: none;
}

/* ANIMATIONS */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
`;

export default function SchoolTransfers() {
    const { schoolId } = useParams();
    const [activeTab, setActiveTab] = useState("initiate");
    
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingTransfers, setOutgoingTransfers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [filteredSchools, setFilteredSchools] = useState([]);
    const [studentSearch, setStudentSearch] = useState("");
    
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [viewStudent, setViewStudent] = useState(null); 
    const [initiateForm, setInitiateForm] = useState({ studentId: "", toSchoolId: "", districtId: "", reason: "", transferDate: "" });
    const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
    
    const [incomingPage, setIncomingPage] = useState(1);
    const [outgoingPage, setOutgoingPage] = useState(1);
    const itemsPerPage = 7;

    useEffect(() => {
        fetchSchools();
        fetchDistricts();
        fetchIncomingRequests();
        fetchOutgoingTransfers();
    }, [schoolId]);

    const fetchSchools = async () => {
        try { setSchools(await SchoolService.fetchAllSchools()); } 
        catch (error) { console.error(error); }
    };

    const fetchDistricts = async () => {
        try { setDistricts(await SchoolService.fetchDistricts()); } 
        catch (error) { console.error(error); }
    };

    const fetchIncomingRequests = async () => {
        try { setIncomingRequests(await TransferService.getIncomingRequests(schoolId)); } 
        catch (error) { console.error(error); }
    };

    const fetchOutgoingTransfers = async () => {
        try { setOutgoingTransfers(await TransferService.getOutgoingTransfers(schoolId)); } 
        catch (error) { console.error(error); }
    };

    const handleDistrictChange = (id) => {
        if (!id) { setFilteredSchools(schools); return; }
        setFilteredSchools(schools.filter(s => s.district_id === parseInt(id)));
    };

    const indexOfLastIncomingItem = incomingPage * itemsPerPage;
    const indexOfFirstIncomingItem = indexOfLastIncomingItem - itemsPerPage;
    const currentIncomingItems = incomingRequests.slice(indexOfFirstIncomingItem, indexOfLastIncomingItem);

    const indexOfLastOutgoingItem = outgoingPage * itemsPerPage;
    const indexOfFirstOutgoingItem = indexOfLastOutgoingItem - itemsPerPage;
    const currentOutgoingItems = outgoingTransfers.slice(indexOfFirstOutgoingItem, indexOfLastOutgoingItem);

    const getStatusBadge = (status) => {
        switch(status?.toLowerCase()) {
            case 'completed': return 'status-completed';
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            case 'initiated': return 'status-initiated';
            default: return 'status-initiated';
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
            await TransferService.createTransferRequest({
                student_id: selectedStudent.id,
                to_school_id: parseInt(initiateForm.toSchoolId),
                date_initiated: initiateForm.transferDate,
                reason: initiateForm.reason
            });
            setToast({ show: true, message: "Transfer request submitted successfully!", variant: "success" });
            setInitiateForm(prev => ({ ...prev, studentId: "", toSchoolId: "", districtId: "", reason: "", transferDate: "" }));
            setSelectedStudent(null);
            fetchOutgoingTransfers();
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: "Error initiating transfer.", variant: "danger" });
        }
    };

    const handleAcceptTransfer = async (transferId, action) => {
        try {
            if (action === "accept") await TransferService.approveTransfer(transferId);
            else if (action === "reject") await TransferService.rejectTransfer(transferId);
            else if (action === "finalize") await TransferService.finaliseTransfer(transferId);

            setToast({ show: true, message: `Transfer ${action}ed successfully!`, variant: "success" });
            fetchIncomingRequests();
            fetchOutgoingTransfers();
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: "Error processing action.", variant: "danger" });
        }
    };

    const filteredTransfers = outgoingTransfers.filter(t => {
        if (!studentSearch) return true;
        return t.reason?.toLowerCase().includes(studentSearch.toLowerCase()) || t.status?.toLowerCase().includes(studentSearch.toLowerCase());
    });

    return (
        <>
            <style>{CSS}</style>
            <ToastNote show={toast.show} onClose={() => setToast({ ...toast, show: false })} message={toast.message} variant={toast.variant} />
            
            <div className="se-container">
                {/* HEADER */}
                <div className="page-header">
                    <div className="header-title">
                        <h1>School Transfers</h1>
                        <p>Manage student movement between institutions seamlessly.</p>
                    </div>
                    <button className="btn-icon-only" style={{ width: '48px', height: '48px', backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '1.2rem' }}>
                        <i className="bi bi-gear"></i>
                    </button>
                </div>

                {/* TABS */}
                <div className="modern-tabs">
                    <button className={`tab-btn ${activeTab === 'initiate' ? 'active' : ''}`} onClick={() => setActiveTab('initiate')}>
                        <i className="bi bi-send"></i> Initiate Transfer
                    </button>
                    <button className={`tab-btn ${activeTab === 'accept' ? 'active' : ''}`} onClick={() => setActiveTab('accept')}>
                        <i className="bi bi-inbox"></i> Incoming Requests
                        {incomingRequests.length > 0 && <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{incomingRequests.length}</span>}
                    </button>
                    <button className={`tab-btn ${activeTab === 'transfers' ? 'active' : ''}`} onClick={() => setActiveTab('transfers')}>
                        <i className="bi bi-clock-history"></i> Transfer History
                    </button>
                </div>

                {/* INITIATE TAB */}
                {activeTab === 'initiate' && (
                    <div className="fade-in">
                        {/* Search Section */}
                        <div className="modern-card">
                            <div className="modern-card-body">
                                <div className="modern-input-group">
                                    <label className="modern-label">Find Student</label>
                                    <div style={{ position: 'relative' }}>
                                        <i className="bi bi-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                                        <input
                                            type="text"
                                            className="modern-input"
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Search by name or student number..."
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Search Results Dropdown */}
                                {studentSearch && !selectedStudent && (
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.75rem', marginTop: '1rem', overflow: 'hidden', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                                        {MOCK_STUDENTS.filter(s => 
                                            (s.firstname + " " + s.lastname).toLowerCase().includes(studentSearch.toLowerCase())
                                        ).length > 0 ? (
                                            MOCK_STUDENTS.filter(s => 
                                                (s.firstname + " " + s.lastname).toLowerCase().includes(studentSearch.toLowerCase())
                                            ).map(s => (
                                                <div key={s.id} className="search-result-item" onClick={() => handleSelectStudent(s)}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div className={`avatar-circle bg-gradient-${s.id % 4 + 1}`}>
                                                            {s.firstname[0]}{s.lastname[0]}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{s.firstname} {s.lastname}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.student_number} &bull; {s.form_level}</div>
                                                        </div>
                                                    </div>
                                                    <i className="bi bi-chevron-right" style={{ color: '#cbd5e1' }}></i>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No students found.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Student Form */}
                        {selectedStudent && (
                            <div className="modern-card fade-in">
                                <div className="modern-card-header" style={{ background: 'linear-gradient(to right, #f8fafc, white)' }}>
                                    <h3><i className="bi bi-person-check-fill" style={{ color: '#2563eb' }}></i> Initiate Transfer for {selectedStudent.firstname}</h3>
                                    <button className="btn-icon-only" onClick={clearStudentSelection} title="Clear Selection">
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                                <div className="modern-card-body">
                                    <form onSubmit={handleInitiateTransfer}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            <div className="modern-input-group">
                                                <label className="modern-label">Transfer Date</label>
                                                <input 
                                                    type="date" 
                                                    className="modern-input" 
                                                    value={initiateForm.transferDate} 
                                                    onChange={e => setInitiateForm({...initiateForm, transferDate: e.target.value})} 
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="modern-input-group">
                                                <label className="modern-label">District</label>
                                                <select 
                                                    className="modern-select" 
                                                    value={initiateForm.districtId} 
                                                    onChange={e => { setInitiateForm({...initiateForm, districtId: e.target.value}); handleDistrictChange(e.target.value); }}
                                                >
                                                    <option value="">Select District</option>
                                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="modern-input-group">
                                                <label className="modern-label">Destination School</label>
                                                <select 
                                                    className="modern-select" 
                                                    value={initiateForm.toSchoolId} 
                                                    onChange={e => setInitiateForm({...initiateForm, toSchoolId: e.target.value})} 
                                                    required 
                                                    disabled={!initiateForm.districtId}
                                                >
                                                    <option value="">Select School</option>
                                                    {(initiateForm.districtId ? filteredSchools : schools).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="modern-input-group" style={{ gridColumn: '1 / -1' }}>
                                                <label className="modern-label">Reason for Transfer</label>
                                                <input 
                                                    type="text" 
                                                    className="modern-input" 
                                                    placeholder="e.g. Relocation, Academic preference..." 
                                                    value={initiateForm.reason} 
                                                    onChange={e => setInitiateForm({...initiateForm, reason: e.target.value})} 
                                                    required 
                                                />
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                                            <button type="submit" className="btn-modern btn-primary">
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
                    <div className="fade-in">
                        <div className="modern-card">
                             <div className="modern-card-body">
                                <div className="modern-input-group" style={{ marginBottom: '2rem' }}>
                                    <input
                                        type="text"
                                        className="modern-input"
                                        placeholder="Filter requests..."
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-wrapper">
                                <table className="modern-table">
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
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div className={`avatar-circle bg-gradient-${request.id % 4 + 1}`} style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
                                                            {request.firstname ? request.firstname[0] : 'S'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{request.firstname} {request.lastname}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{request.student_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{request.from_school_name || '-'}</td>
                                                <td>{request.date_initiated ? new Date(request.date_initiated).toLocaleDateString() : '-'}</td>
                                                <td><span className={`status-badge ${getStatusBadge(request.status)}`}>{request.status}</span></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                        {request.status === 'initiated' && (
                                                            <>
                                                                <button className="btn-modern btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleAcceptTransfer(request.id, 'reject')}>Reject</button>
                                                                <button className="btn-modern btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleAcceptTransfer(request.id, 'accept')}>Approve</button>
                                                            </>
                                                        )}
                                                        {request.status === 'approved' && (
                                                            <button className="btn-modern btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#10b981' }} onClick={() => handleAcceptTransfer(request.id, 'finalize')}>Finalize</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                    <i className="bi bi-inbox" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                                                    No incoming requests found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TRANSFERS HISTORY TAB */}
                {activeTab === 'transfers' && (
                    <div className="fade-in">
                        <div className="modern-card">
                            <div className="modern-card-header">
                                <h3>Outgoing Transfers</h3>
                                <select className="modern-select" style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.85rem' }}>
                                    <option>All Status</option>
                                    <option>Completed</option>
                                    <option>Pending</option>
                                </select>
                            </div>
                            <div className="table-wrapper">
                                <table className="modern-table">
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
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div className={`avatar-circle bg-gradient-${transfer.id % 4 + 1}`} style={{ width: '36px', height: '36px', fontSize: '0.8rem' }}>
                                                            {transfer.firstname ? transfer.firstname[0] : 'S'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#0f172a' }}>{transfer.firstname} {transfer.lastname}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{transfer.student_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{transfer.to_school_name || 'N/A'}</td>
                                                <td>{transfer.transfer_date || '-'}</td>
                                                <td><span className={`status-badge ${getStatusBadge(transfer.status)}`}>{transfer.status}</span></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn-icon-only" title="View Details"><i className="bi bi-eye"></i></button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                                    <i className="bi bi-table" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                                                    No transfer history found.
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