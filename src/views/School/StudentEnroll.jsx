import React, { useState, useEffect } from "react";
import SchoolStudentService from "./services/studentService";
import SchoolService from "./services/schoolService";
import SubjectService from "./services/subjectService";
import AcademicYearService from "./services/academicYearService";
import { SCHOOL_ID_KEY } from "../constants/storageKeys";
import ToastNote from "../../components/ToastNote";
import ConfirmModal from "../../components/ConfirmModal";

const initials = (fn, ln) => `${(fn||'?')[0]}${(ln||'?')[0]}`.toUpperCase();

export default function StudentEnroll() {
    const BLANK = {
        firstname:"", middlename:"", lastname:"",
        studentNumber:"", gender:"", dateOfBirth:"", class:"",
        currentSchool:"",
        disability:false, disabilityDetails:"",
        guardianFirstname:"", guardianMiddlename:"", guardianLastname:"",
        guardianPhone:"", guardianAltPhone:"", guardianEmail:"", guardianRelationship:"",
        selectedSubjects:[]
    };

    const [students,             setStudents]             = useState([]);
    const [subjects,             setSubjects]             = useState([]);
    const [searchTerm,           setSearchTerm]           = useState("");
    const [currentPage,          setCurrentPage]          = useState(1);
    const [activeTab,            setActiveTab]            = useState("form");
    const [toast,                setToast]                = useState({ show:false, message:"", variant:"success" });
    const [modal,                setModal]                = useState({ show:false, studentId:null });
    const [isEditing,            setIsEditing]            = useState(false);
    const [editingId,            setEditingId]            = useState(null);
    const [form,                 setForm]                 = useState(BLANK);
    const [currentSchool,        setCurrentSchool]        = useState("");
    const [activeAcademicYear,   setActiveAcademicYear]   = useState(null);

    const set = (k, v) => {
        // Convert value to uppercase if it is a string, unless it is an email field
        if (typeof v === 'string' && k !== 'guardianEmail') {
            v = v.toUpperCase();
        }
        setForm(p => ({ ...p, [k]: v }));
    };

    useEffect(() => {
        fetchStudents(); fetchSubjects(); fetchActiveAcademicYear();
        const id = localStorage.getItem("schoolId");
        if (id) fetchCurrentSchool(id);
    }, []);

    const fetchStudents           = async () => { try { const d = await SchoolStudentService.fetchStudentsForSchool(); setStudents(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchSubjects           = async () => { try { const d = await SubjectService.fetchAllSubjects(); setSubjects(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchActiveAcademicYear = async () => { try { const d = await AcademicYearService.getActiveAcademicYear(); setActiveAcademicYear(d); } catch(e){console.error(e);} };
    const fetchCurrentSchool      = async (id) => {
        try { const d = await SchoolService.getSchoolById(id); setCurrentSchool(d.name||""); setForm(p=>({...p, currentSchool:d.name||""})); }
        catch(e){console.error(e);}
    };

    const toggleSubject = (id) => set("selectedSubjects", form.selectedSubjects.includes(id) ? form.selectedSubjects.filter(s=>s!==id) : [...form.selectedSubjects, id]);
    const toggleAll = () => set("selectedSubjects", form.selectedSubjects.length === subjects.length ? [] : subjects.map(s=>s.id));

    const resetForm = () => { setIsEditing(false); setEditingId(null); setForm({...BLANK, currentSchool}); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!activeAcademicYear) {
                setToast({ show:true, message:"No active academic year found. Please contact administrator.", variant:"danger" });
                return;
            }
            const schoolId = localStorage.getItem(SCHOOL_ID_KEY);
            const payload = {
                first_name: form.firstname, middle_name: form.middlename, last_name: form.lastname,
                student_number: form.studentNumber, gender: form.gender, date_of_birth: form.dateOfBirth,
                form_level: parseInt(form.class), school_id: parseInt(schoolId),
                guardian_firstname: form.guardianFirstname, guardian_middlename: form.guardianMiddlename,
                guardian_lastname: form.guardianLastname,
                guardian_name: `${form.guardianFirstname} ${form.guardianLastname}`,
                guardian_phone: form.guardianPhone, guardian_alt_phone: form.guardianAltPhone,
                guardian_relationship: form.guardianRelationship, guardian_email: form.guardianEmail,
                disability: form.disability, disability_details: form.disabilityDetails,
                subject_ids: form.selectedSubjects, status: "active", academic_year_id: parseInt(activeAcademicYear.id)
            };
            if (isEditing) {
                await SchoolStudentService.updateStudent(editingId, payload);
                setToast({ show:true, message:"Student updated successfully!", variant:"success" });
            } else {
                await SchoolStudentService.createStudent(payload);
                setToast({ show:true, message:"Student enrolled successfully!", variant:"success" });
            }
            resetForm(); fetchStudents();
        } catch(err) {
            setToast({ show:true, message: err.response ? JSON.stringify(err.response.data) : err.message, variant:"danger" });
        }
    };

    const handleEdit = (s) => {
        const parts = s.guardian_name ? s.guardian_name.split(' ') : [];
        setIsEditing(true); setEditingId(s.id);
        setForm({
            firstname: s.first_name||"", middlename: s.middle_name||"", lastname: s.last_name||"",
            studentNumber: s.student_number||"", gender: s.gender||"",
            dateOfBirth: s.date_of_birth ? s.date_of_birth.split('T')[0] : "",
            class: s.form_level ? String(s.form_level) : "",
            currentSchool, disability: s.disability||false, disabilityDetails: s.disability_details||"",
            guardianFirstname: parts[0]||"", guardianMiddlename: "",
            guardianLastname: parts.length > 1 ? parts.slice(1).join(' ') : "",
            guardianPhone: s.guardian_phone||"", guardianAltPhone: s.guardian_alt_phone||"",
            guardianEmail: s.guardian_email||"", guardianRelationship: s.guardian_relationship||"",
            selectedSubjects: s.subject_ids||[]
        });
       
        setActiveTab('form');
    };

    const handleDelete = (id) => setModal({ show:true, studentId:id });
    const confirmDelete = async () => {
        try { await SchoolStudentService.deleteStudent(modal.studentId); setToast({ show:true, message:"Student deleted.", variant:"success" }); fetchStudents(); }
        catch(e) { setToast({ show:true, message:e.message, variant:"danger" }); }
        finally { setModal({ show:false, studentId:null }); }
    };

    const PER_PAGE   = 8;
    const filtered   = students.filter(s =>
        s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name?.toLowerCase().includes(searchTerm.toLowerCase())  ||
        s.student_number?.includes(searchTerm)
    );
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const pageRows   = filtered.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);
    const allSel     = form.selectedSubjects.length === subjects.length;

    const CLASSES = [
        { value: "1", label: "Form 1" },
        { value: "2", label: "Form 2" },
        { value: "3", label: "Form 3" },
        { value: "4", label: "Form 4" }
    ];

    return (
        <>
            <ToastNote show={toast.show} onClose={()=>setToast({...toast,show:false})} message={toast.message} variant={toast.variant}/>
            <ConfirmModal show={modal.show} onHide={()=>setModal({show:false,studentId:null})} onConfirm={confirmDelete} title="Delete Student" body="This action cannot be undone. Are you sure you want to delete this student?"/>

            <div className="gse-wrapper">

                {/* ── Header ── */}
                <div className="gse-header">
                    <div className="gse-header-icon"><i className="bi bi-mortarboard-fill"></i></div>
                    <div className="gse-header-text">
                        <div className="gse-header-title">Student Enrollment</div>
                        <div className="gse-header-sub">Manage student records and subject allocation</div>
                    </div>
                    <div className="gse-header-stat">
                        <div className="gse-stat-num">{students.length}</div>
                        <div className="gse-stat-lbl">Enrolled</div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="gse-tabs-bar">
                    <div className="gse-tabs">
                        <button className={`gse-tab ${activeTab==='form'?'gse-active':''}`} onClick={()=>setActiveTab('form')}>
                            <i className="bi bi-pencil-square"></i> {isEditing ? 'Edit Student' : 'New Enrollment'}
                        </button>
                        <button className={`gse-tab ${activeTab==='students'?'gse-active':''}`} onClick={()=>setActiveTab('students')}>
                            <i className="bi bi-list-ul"></i> All Students <span className="gse-tab-pill">{students.length}</span>
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="gse-body">

                    {/* ══ ENROLLMENT FORM ══ */}
                    {activeTab === 'form' && (
                        <form onSubmit={handleSubmit} className="gse-fade-up">

                            {isEditing && (
                                <div className="gse-edit-banner">
                                    <i className="bi bi-pencil-square me-1"></i> Editing student — ID <strong style={{fontFamily:'DM Mono,monospace'}}>{editingId}</strong>. Changes will update existing record.
                                    <button type="button" className="gse-btn gse-btn-ghost" style={{marginLeft:'auto',padding:'5px 14px',fontSize:12}} onClick={resetForm}><i className="bi bi-x-lg"></i> Cancel</button>
                                </div>
                            )}

                            {/* ─ Student Details ── */}
                            <div className="gse-card gse-card-primary">
                                <div className="gse-card-head">
                                    <div className="gse-card-title-row">
                                        <div className="gse-card-icon gse-icon-primary"><i className="bi bi-person-circle"></i></div>
                                        <div>
                                            <div className="gse-card-title">Student Details</div>
                                            <div className="gse-card-sub">Personal and academic information</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="gse-card-body">
                                    <div className="gse-grid gse-grid-3" style={{marginBottom:14}}>
                                        <div className="gse-field"><label className="gse-label">First Name *</label><input className="gse-input" type="text" placeholder="e.g. Chisomo" value={form.firstname} onChange={e=>set('firstname',e.target.value)} required/></div>
                                        <div className="gse-field"><label className="gse-label">Middle Name</label><input className="gse-input" type="text" placeholder="Optional" value={form.middlename} onChange={e=>set('middlename',e.target.value)}/></div>
                                        <div className="gse-field"><label className="gse-label">Last Name *</label><input className="gse-input" type="text" placeholder="e.g. Banda" value={form.lastname} onChange={e=>set('lastname',e.target.value)} required/></div>
                                    </div>
                                    <div className="gse-grid gse-grid-4" style={{marginBottom:14}}>
                                        <div className="gse-field">
                                            <label className="gse-label">Student No. *</label>
                                            <input className="gse-input" type="text" placeholder="e.g. 2024-001" value={form.studentNumber} onChange={e=>set('studentNumber',e.target.value)} required/>
                                        </div>
                                        <div className="gse-field">
                                            <label className="gse-label">Gender *</label>
                                            <div className="gse-radio-group">
                                                {["Male","Female"].map(g=>(
                                                    <label key={g} className={`gse-radio ${form.gender===g?'gse-radio-on':''}`}>
                                                        <input type="radio" name="gender" value={g} checked={form.gender===g} onChange={e=>set('gender',e.target.value)} required/>
                                                        <span className="gse-radio-dot"></span>{g}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="gse-field"><label className="gse-label">Date of Birth *</label><input className="gse-input" type="date" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} required/></div>
                                        <div className="gse-field">
                                            <label className="gse-label">Class *</label>
                                            <div className="gse-select-wrapper">
                                                <select className="gse-select" value={form.class} onChange={e=>set('class',e.target.value)} required>
                                                    <option value="">Select class…</option>
                                                    {CLASSES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="gse-grid gse-grid-2" style={{marginBottom:14}}>
                                        <div className="gse-field">
                                            <label className="gse-label">Current School</label>
                                            <input className="gse-input" type="text" value={form.currentSchool} readOnly/>
                                        </div>
                                        <div className="gse-field">
                                            <label className="gse-label">Academic Year *</label>
                                            <input className="gse-input" type="text" value={activeAcademicYear ? `${activeAcademicYear.year} (${activeAcademicYear.start_date} - ${activeAcademicYear.end_date})` : "Loading..."} readOnly/>
                                        </div>
                                    </div>

                                    {/* Disability toggle */}
                                    <label className={`gse-disability-row ${form.disability?'gse-dis-on':''}`}>
                                        <input type="checkbox" checked={form.disability} onChange={e=>set('disability',e.target.checked)}/>
                                        <span className="gse-switch"></span>
                                        Student has a disability or special need
                                    </label>
                                    {form.disability && (
                                        <div className="gse-disability-detail">
                                            <label className="gse-label" style={{color:'#b45309',marginBottom:6,display:'block'}}>Disability Details</label>
                                            <input className="gse-input" type="text" placeholder="Describe condition…" value={form.disabilityDetails} onChange={e=>set('disabilityDetails',e.target.value)} style={{borderColor:'#fcd34d'}}/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─ Guardian Details ── */}
                            <div className="gse-card gse-card-secondary">
                                <div className="gse-card-head">
                                    <div className="gse-card-title-row">
                                        <div className="gse-card-icon gse-icon-secondary"><i className="bi bi-people-fill"></i></div>
                                        <div>
                                            <div className="gse-card-title">Guardian / Parent Details</div>
                                            <div className="gse-card-sub">Emergency contact and relationship</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="gse-card-body">
                                    <div className="gse-grid gse-grid-3" style={{marginBottom:14}}>
                                        <div className="gse-field"><label className="gse-label">First Name *</label><input className="gse-input" type="text" placeholder="Guardian's first name" value={form.guardianFirstname} onChange={e=>set('guardianFirstname',e.target.value)} required/></div>
                                        <div className="gse-field"><label className="gse-label">Middle Name</label><input className="gse-input" type="text" placeholder="Optional" value={form.guardianMiddlename} onChange={e=>set('guardianMiddlename',e.target.value)}/></div>
                                        <div className="gse-field"><label className="gse-label">Last Name *</label><input className="gse-input" type="text" placeholder="Guardian's last name" value={form.guardianLastname} onChange={e=>set('guardianLastname',e.target.value)} required/></div>
                                    </div>
                                    <div className="gse-grid gse-grid-4">
                                        <div className="gse-field"><label className="gse-label">Phone *</label><input className="gse-input" type="tel" placeholder="+265 XXX XXX XXX" value={form.guardianPhone} onChange={e=>set('guardianPhone',e.target.value)} required/></div>
                                        <div className="gse-field"><label className="gse-label">Alt. Phone</label><input className="gse-input" type="tel" placeholder="Optional" value={form.guardianAltPhone} onChange={e=>set('guardianAltPhone',e.target.value)}/></div>
                                        <div className="gse-field"><label className="gse-label">Email</label><input className="gse-input" type="email" placeholder="guardian@email.com" value={form.guardianEmail} onChange={e=>set('guardianEmail',e.target.value)}/></div>
                                        <div className="gse-field">
                                            <label className="gse-label">Relationship *</label>
                                            <div className="gse-select-wrapper">
                                                <select className="gse-select" value={form.guardianRelationship} onChange={e=>set('guardianRelationship',e.target.value)} required>
                                                    <option value="">Select…</option>
                                                    {["Father","Mother","Guardian","Other"].map(r=><option key={r} value={r.toLowerCase()}>{r}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─ Subjects ── */}
                            <div className="gse-card gse-card-tertiary">
                                <div className="gse-card-head">
                                    <div className="gse-card-title-row">
                                        <div className="gse-card-icon gse-icon-tertiary"><i className="bi bi-stack"></i></div>
                                        <div>
                                            <div className="gse-card-title">Subject Selection</div>
                                            <div className="gse-card-sub">Choose subjects student will take this term</div>
                                        </div>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                                        {form.selectedSubjects.length > 0 && <span className="gse-count-badge">{form.selectedSubjects.length} selected</span>}
                                        <div className={`gse-select-all-btn ${allSel?'gse-all-selected':''}`} onClick={toggleAll}>
                                            <span className="gse-sa-chk">{allSel?'✓':''}</span>
                                            {allSel ? 'Deselect All' : 'Select All'}
                                        </div>
                                    </div>
                                </div>
                                <div className="gse-card-body">
                                    {subjects.length === 0 ? (
                                        <div style={{textAlign:'center',padding:'32px 16px',color:'#9ca3af'}}>
                                            <i className="bi bi-info-circle" style={{fontSize:'24px',marginBottom:'10px',display:'block'}}></i>
                                            <p style={{fontSize:'13px'}}>Loading subjects...</p>
                                        </div>
                                    ) : (
                                        <div className="gse-subjects-grid">
                                            {subjects.map(sub=>{
                                                const on = form.selectedSubjects.includes(sub.id);
                                                return (
                                                    <div key={sub.id} className={`gse-subject-item ${on?'gse-subj-on':''}`} onClick={()=>toggleSubject(sub.id)}>
                                                        <span className="gse-subject-name">{sub.name}</span>
                                                        <span className="gse-subject-check">{on?'✓':''}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─ Footer ── */}
                            <div className="gse-card gse-card-footer" style={{marginBottom:0}}>
                                <div className="gse-form-footer">
                                    <button type="button" className="gse-btn gse-btn-ghost" onClick={resetForm}><i className="bi bi-arrow-counterclockwise"></i> Reset Form</button>
                                    <button type="submit" className="gse-btn gse-btn-primary">
                                        <i className="bi bi-check-circle-fill"></i> {isEditing ? 'Update Student' : 'Enroll Student'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* ══ STUDENTS LIST ══ */}
                    {activeTab === 'students' && (
                        <div className="gse-fade-up">
                            {/* Search row */}
                            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                                <div className="gse-search-wrapper">
                                    <i className="bi bi-search gse-search-icon"></i>
                                    <input className="gse-search-input" type="text" placeholder="Search by name or student number…" value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setCurrentPage(1);}}/>
                                </div>
                                <span style={{fontSize:12,color:'#94a3b8',fontWeight:600,whiteSpace:'nowrap'}}>
                                    {filtered.length} / {students.length} students
                                </span>
                            </div>

                            <div className="gse-table-wrapper">
                                <table className="gse-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>No.</th>
                                            <th>Class</th>
                                            <th>Gender</th>
                                            <th>D.O.B</th>
                                            <th>Status</th>
                                            <th>Disability</th>
                                            <th>Guardian</th>
                                            <th>Phone</th>
                                            <th>Subjects</th>
                                            <th style={{textAlign:'center',paddingRight:20}}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageRows.map(s=>(
                                            <tr key={s.id}>
                                                <td>
                                                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                                                        <div className="gse-avatar">{initials(s.first_name, s.last_name)}</div>
                                                        <span className="gse-table-name">{s.first_name} {s.last_name}</span>
                                                    </div>
                                                </td>
                                                <td><span className="gse-badge gse-badge-slate">{s.student_number||'—'}</span></td>
                                                <td><span className="gse-badge gse-badge-primary">{s.form_level||'—'}</span></td>
                                                <td style={{fontWeight:500,color:'#374151'}}>{s.gender||'—'}</td>
                                                <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '—'}</td>
                                                <td><span className="gse-badge gse-badge-success">{s.status||'Active'}</span></td>
                                                <td>{s.disability ? <span className="gse-badge gse-badge-danger"><i className="bi bi-exclamation-triangle-fill me-1"></i>Yes</span> : <span style={{color:'#d1d5db'}}>—</span>}</td>
                                                <td style={{fontWeight:500,color:'#374151'}}>{s.guardian_name||'—'}</td>
                                                <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{s.guardian_phone||'—'}</td>
                                                <td><span className="gse-badge gse-badge-warning">{s.subject_ids?.length||0} subj.</span></td>
                                                <td style={{textAlign:'center',paddingRight:20}}>
                                                    <button className="gse-action-btn gse-action-edit" onClick={()=>handleEdit(s)} title="Edit"><i className="bi bi-pencil-fill"></i></button>
                                                    <button className="gse-action-btn gse-action-delete"  onClick={()=>handleDelete(s.id)} title="Delete"><i className="bi bi-trash-fill"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {pageRows.length === 0 && (
                                            <tr><td colSpan={11}>
                                                <div className="gse-empty-state">
                                                    <div className="gse-empty-icon"><i className="bi bi-inbox"></i></div>
                                                    <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>No students found</div>
                                                    <div style={{fontSize:13}}>Try adjusting your search or enroll a new student</div>
                                                </div>
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="gse-pagination">
                                    {Array.from({length:totalPages},(_,i)=>(
                                        <button key={i} className={`gse-page-item ${currentPage===i+1?'gse-page-active':''}`} onClick={()=>setCurrentPage(i+1)}>{i+1}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}