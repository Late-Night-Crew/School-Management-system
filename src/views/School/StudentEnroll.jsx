import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SchoolStudentService from "./services/studentService";
import SchoolService from "./services/schoolService";
import { SCHOOL_ID_KEY } from "../constants/storageKeys";

export default function StudentEnroll() {
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 7;
    const [activeTab, setActiveTab] = useState("form");

    // Form states
    const [formData, setFormData] = useState({
        firstname: "",
        middlename: "",
        lastname: "",
        studentNumber: "",
        gender: "",
        dateOfBirth: "",
        class: "",
        previousDistrict: "",
        previousSchool: "",
        currentSchool: "",
        disability: false,
        disabilityDetails: "",
        guardianFirstname: "",
        guardianMiddlename: "",
        guardianLastname: "",
        guardianPhone: "",
        guardianAltPhone: "",
        guardianEmail: "",
        guardianRelationship: ""
    });

    const [districts, setDistricts] = useState([]);
    const [schools, setSchools] = useState([]);
    const [currentSchool, setCurrentSchool] = useState("");

    useEffect(() => {
        // Fetch students for this school
        fetchStudents();
        // Fetch districts
        fetchDistricts();
        // Get current school
        const schoolId = localStorage.getItem("schoolId");
        if (schoolId) {
            fetchCurrentSchool(schoolId);
        }
    }, []);

    const fetchStudents = async () => {
        try {
            const data = await SchoolStudentService.fetchStudentsForSchool();
            setStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchDistricts = async () => {
        try {
            const data = await SchoolService.fetchDistricts();
            setDistricts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching districts:", error);
        }
    };

    const fetchSchools = async (districtId) => {
        try {
            const data = await SchoolService.fetchSchoolsByDistrict(districtId);
            setSchools(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching schools:", error);
        }
    };

    const fetchCurrentSchool = async (schoolId) => {
        try {
            const data = await SchoolService.getSchoolById(schoolId);
            setCurrentSchool(data.name || "");
            setFormData(prev => ({ ...prev, currentSchool: data.name || "" }));
        } catch (error) {
            console.error("Error fetching current school:", error);
        }
    };

    const handleDistrictChange = (districtId) => {
        setFormData(prev => ({ ...prev, previousDistrict: districtId, previousSchool: "" }));
        fetchSchools(districtId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const schoolId = localStorage.getItem(SCHOOL_ID_KEY);
            
            // Map form data to backend schema
            const submitData = {
                first_name: formData.firstname,
                last_name: formData.lastname,
                gender: formData.gender,
                date_of_birth: formData.dateOfBirth,
                form_level: parseInt(formData.class) || 0,
                school_id: parseInt(schoolId),
                student_number: formData.studentNumber,
                guardian_name: `${formData.guardianFirstname} ${formData.guardianLastname}`,
                previous_school: formData.previousSchool,
                status: "active",
                academic_year_id: 1
            };
            
            await SchoolStudentService.createStudent(submitData);
            
            alert("Student enrolled successfully!");
            setFormData({
                firstname: "",
                middlename: "",
                lastname: "",
                studentNumber: "",
                gender: "",
                dateOfBirth: "",
                class: "",
                previousDistrict: "",
                previousSchool: "",
                currentSchool: currentSchool,
                disability: false,
                disabilityDetails: "",
                guardianFirstname: "",
                guardianMiddlename: "",
                guardianLastname: "",
                guardianPhone: "",
                guardianAltPhone: "",
                guardianEmail: "",
                guardianRelationship: ""
            });
            fetchStudents();
        } catch (error) {
            console.error("Error enrolling student:", error);
            alert("Error: " + error.message);
        }
    };

    const filteredStudents = students.filter(student =>
        (student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (student.student_number?.includes(searchTerm) || false)
    );

    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleEdit = (student) => {
        // Populate form with student data for editing
        setFormData({
            firstname: student.first_name || "",
            middlename: student.middle_name || "",
            lastname: student.last_name || "",
            studentNumber: student.student_number || "",
            gender: student.gender || "",
            dateOfBirth: student.date_of_birth ? student.date_of_birth.split('T')[0] : "", // Format for date input
            class: student.form_level || "",
            previousDistrict: student.previous_district || "",
            previousSchool: student.previous_school || "",
            currentSchool: currentSchool,
            disability: false,
            disabilityDetails: "",
            guardianFirstname: "",
            guardianMiddlename: "",
            guardianLastname: student.guardian_name || "",
            guardianPhone: student.guardianPhone,
            guardianAltPhone: student.guardianAltPhone || "",
            guardianEmail: student.guardianEmail || "",
            guardianRelationship: student.guardianRelationship
        });
        // If previous district is set, fetch schools
        if (student.previousDistrict) {
            fetchSchools(student.previousDistrict);
        }
    };

    const handleDelete = async (studentId) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await SchoolStudentService.deleteStudent(studentId);
                alert("Student deleted successfully!");
                fetchStudents();
            } catch (error) {
                console.error("Error deleting student:", error);
                alert("Error: " + error.message);
            }
        }
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <h2 className="mb-4 text-center">Student Enrollment Management</h2>
                    
                    {/* Bootstrap Tabs */}
                    <ul className="nav nav-tabs mb-4" id="enrollmentTabs" role="tablist">
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link ${activeTab === 'form' ? 'active' : ''}`} 
                                id="form-tab" 
                                type="button" 
                                role="tab" 
                                onClick={() => setActiveTab('form')}
                            >
                                <i className="bi bi-person-plus-fill me-2"></i>Enrollment Form
                            </button>
                        </li>
                        <li className="nav-item" role="presentation">
                            <button 
                                className={`nav-link ${activeTab === 'students' ? 'active' : ''}`} 
                                id="students-tab" 
                                type="button" 
                                role="tab" 
                                onClick={() => setActiveTab('students')}
                            >
                                <i className="bi bi-table me-2"></i>Enrolled Students ({students.length})
                            </button>
                        </li>
                    </ul>

                    <div className="tab-content">
                        {/* Enrollment Form Tab */}
                        {activeTab === 'form' && (
                            <div className="tab-pane fade show active">
                                <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow-sm">
                                    {/* Student Information Section */}
                                    <div className="mb-4 p-3 bg-white rounded-3 border">
                                        <h5 className="mb-3 text-primary">
                                            <i className="bi bi-person-circle me-2"></i>Student Information
                                        </h5>
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">First Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.firstname}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">Middle Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.middlename}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, middlename: e.target.value }))}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.lastname}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Student Number</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.studentNumber}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, studentNumber: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Gender</label>
                                                <div className="d-flex gap-3 mt-2">
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="gender"
                                                            value="Male"
                                                            checked={formData.gender === "Male"}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                                        />
                                                        <label className="form-check-label">Male</label>
                                                    </div>
                                                    <div className="form-check">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="gender"
                                                            value="Female"
                                                            checked={formData.gender === "Female"}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                                        />
                                                        <label className="form-check-label">Female</label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Date of Birth</label>
                                                <input
                                                    type="date"
                                                    className="form-control form-control-lg"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Class</label>
                                                <select
                                                    className="form-select form-select-lg"
                                                    value={formData.class}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                                                    required
                                                >
                                                    <option value="">Select Class</option>
                                                    {["Form 1", "Form 1A", "Form 1B", "Form 1C", "Form 1D", "Form 2", "Form 2A", "Form 2B", "Form 2C", "Form 2D", "Form 3", "Form 3A", "Form 3B", "Form 3C", "Form 3D", "Form 4", "Form 4A", "Form 4B", "Form 4C", "Form 4D"].map(cls => (
                                                        <option key={cls} value={cls}>{cls}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">Previous District</label>
                                                <select
                                                    className="form-select form-select-lg"
                                                    value={formData.previousDistrict}
                                                    onChange={(e) => handleDistrictChange(e.target.value)}
                                                >
                                                    <option value="">Select District</option>
                                                    {districts.map(district => (
                                                        <option key={district.id} value={district.id}>{district.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">Previous School</label>
                                                <select
                                                    className="form-select form-select-lg"
                                                    value={formData.previousSchool}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, previousSchool: e.target.value }))}
                                                    disabled={!formData.previousDistrict}
                                                >
                                                    <option value="">Select School</option>
                                                    {schools.map(school => (
                                                        <option key={school.id} value={school.id}>{school.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">Current School</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.currentSchool}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label fw-semibold">Disability</label>
                                                <div className="form-check mb-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={formData.disability}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, disability: e.target.checked }))}
                                                    />
                                                    <label className="form-check-label">Has Disability</label>
                                                </div>
                                                {formData.disability && (
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Disability Details"
                                                        value={formData.disabilityDetails}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, disabilityDetails: e.target.value }))}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guardian Information Section */}
                                    <div className="mb-4 p-3 bg-white rounded-3 border">
                                        <h5 className="mb-3 text-success">
                                            <i className="bi bi-people-fill me-2"></i>Guardian Information
                                        </h5>
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">First Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.guardianFirstname}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardianFirstname: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">Middle Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.guardianMiddlename}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardianMiddlename: e.target.value }))}
                                                />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label fw-semibold">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control form-control-lg"
                                                    value={formData.guardianLastname}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardianLastname: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Phone</label>
                                                <input
                                                    type="tel"
                                                    className="form-control form-control-lg"
                                                    value={formData.guardianPhone}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardianPhone: e.target.value }))}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Alt Phone</label>
                                                <input
                                                    type="tel"
                                                    className="form-control form-control-lg"
                                                    value={formData.guardianAltPhone}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardianAltPhone: e.target.value }))}
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Email (Optional)</label>
                                                <input
                                                    type="email"
                                                    className="form-control form-control-lg"
                                                    value={formData.guardianEmail}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardianEmail: e.target.value }))}
                                                />
                                            </div>
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label fw-semibold">Relationship</label>
                                                <select
                                                    className="form-select form-select-lg"
                                                    value={formData.guardianRelationship}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, guardianRelationship: e.target.value }))}
                                                    required
                                                >
                                                    <option value="">Select Relationship</option>
                                                    <option value="Father">Father</option>
                                                    <option value="Mother">Mother</option>
                                                    <option value="Guardian">Guardian</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <button type="submit" className="btn btn-primary btn-lg px-5">
                                            <i className="bi bi-person-plus me-2"></i>Enroll Student
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Enrolled Students Tab */}
                        {activeTab === 'students' && (
                            <div className="tab-pane fade show active">
                                <div className="bg-white p-4 rounded shadow-sm">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h4 className="mb-0">
                                            <i className="bi bi-table me-2"></i>Enrolled Students
                                        </h4>
                                        <div className="input-group" style={{ maxWidth: '300px' }}>
                                            <span className="input-group-text">
                                                <i className="bi bi-search"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Search students..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead className="table-dark">
                                                <tr>
                                                    <th><i className="bi bi-person me-1"></i>Name</th>
                                                    <th><i className="bi bi-hash me-1"></i>Student Number</th>
                                                    <th><i className="bi bi-mortarboard me-1"></i>Class</th>
                                                    <th><i className="bi bi-gender-ambiguous me-1"></i>Gender</th>
                                                    <th><i className="bi bi-calendar me-1"></i>Date of Birth</th>
                                                    <th><i className="bi bi-building me-1"></i>Previous </th>
                                                    <th><i className="bi bi-info-circle me-1"></i>Current </th>
                                                    <th><i className="bi bi-universal-access me-1"></i>Disability</th>
                                                    <th><i className="bi bi-people me-1"></i>Guardian</th>
                                                    <th><i className="bi bi-gear me-1"></i>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentStudents.map(student => (
                                                    <tr key={student.id}>
                                                        <td className="fw-semibold">{student.student_number || "N/A"}</td>
                                                        <td>{student.first_name} {student.last_name}</td>
                                                        <td><span className="badge bg-primary">{student.form_level || "N/A"}</span></td>
                                                        <td>{student.gender || "N/A"}</td>
                                                        <td>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "N/A"}</td>
                                                        <td>{student.previous_school || 'N/A'}</td>
                                                        <td>
                                                            <span className="badge bg-success">{student.status || "Active"}</span>
                                                        </td>
                                                        <td>{student.guardian_name || "N/A"}</td>
                                                        <td>
                                                            <div className="btn-group" role="group">
                                                                <button 
                                                                    className="btn btn-sm btn-outline-warning" 
                                                                    onClick={() => {
                                                                        handleEdit(student);
                                                                        setActiveTab('form');
                                                                    }}
                                                                    title="Edit Student"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button 
                                                                    className="btn btn-sm btn-outline-danger" 
                                                                    onClick={() => handleDelete(student.id)}
                                                                    title="Delete Student"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    {filteredStudents.length === 0 && (
                                        <div className="text-center py-5">
                                            <i className="bi bi-search text-muted" style={{ fontSize: '3rem' }}></i>
                                            <p className="text-muted mt-2">No students found matching your search.</p>
                                        </div>
                                    )}
                                    
                                    {filteredStudents.length > studentsPerPage && (
                                        <nav className="mt-4">
                                            <ul className="pagination justify-content-center">
                                                {Array.from({ length: Math.ceil(filteredStudents.length / studentsPerPage) }, (_, i) => (
                                                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => paginate(i + 1)}>{i + 1}</button>
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