import React, { useState, useEffect } from "react";
import SchoolStudentService from "./services/studentService";
import SchoolService from "./services/schoolService";
import SubjectService from "./services/subjectService";
import AcademicYearService from "./services/academicYearService";
import { SCHOOL_ID_KEY } from "../constants/storageKeys";
import ToastNote from "../../components/ToastNote";
import ConfirmModal from "../../components/ConfirmModal";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.se { font-family: 'Plus Jakarta Sans', sans-serif; background: #eef1f7; min-height: 100vh; color: #1a1d2e; }

/* ── HEADER ── */
.se-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563a8 55%, #3b82c4 100%);
  padding: 26px 36px;
  display: flex; align-items: center; gap: 18px;
  position: relative; overflow: hidden;
}
.se-header::before {
  content: ''; position: absolute; top: -50px; right: -30px;
  width: 200px; height: 200px; border-radius: 50%;
  background: rgba(255,255,255,0.06);
}
.se-header::after {
  content: ''; position: absolute; bottom: -70px; right: 140px;
  width: 150px; height: 150px; border-radius: 50%;
  background: rgba(255,255,255,0.04);
}
.se-header-icon {
  width: 52px; height: 52px; border-radius: 15px;
  background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; flex-shrink: 0; position: relative; z-index: 1; color: #fff;
}
.se-header-text { position: relative; z-index: 1; }
.se-header-title { font-size: 21px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.se-header-sub   { font-size: 12.5px; color: rgba(255,255,255,0.6); margin-top: 3px; }
.se-header-stat  {
  margin-left: auto; position: relative; z-index: 1;
  background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.2);
  border-radius: 14px; padding: 10px 22px; text-align: center;
}
.se-stat-num { font-size: 22px; font-weight: 800; color: #fff; font-family: 'DM Mono', monospace; line-height: 1; }
.se-stat-lbl { font-size: 10px; color: rgba(255,255,255,0.55); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

/* ── TABS ── */
.se-tabs-bar { padding: 20px 36px 0; }
.se-tabs {
  display: inline-flex; gap: 4px;
  background: #fff; border-radius: 50px; padding: 5px;
  box-shadow: 0 2px 14px rgba(0,0,0,0.09);
}
.se-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 22px; border-radius: 50px; border: none;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
  color: #6b7280; background: transparent; cursor: pointer;
  transition: all 0.22s ease; white-space: nowrap;
}
.se-tab:hover { color: #374151; }
.se-tab.active {
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  color: #fff; box-shadow: 0 4px 14px rgba(37,99,168,0.38);
}
.se-tab-pill {
  font-size: 10.5px; font-family: 'DM Mono', monospace;
  background: #f3f4f6; color: #6b7280;
  border-radius: 20px; padding: 1px 9px;
  transition: all 0.22s;
}
.se-tab.active .se-tab-pill { background: rgba(255,255,255,0.2); color: #fff; }

/* ── BODY ── */
.se-body { padding: 22px 36px 40px; }

/* ── SECTION CARDS ── */
.se-card {
  background: #fff; border-radius: 18px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.055);
  margin-bottom: 18px; overflow: hidden;
  border-left: 4px solid transparent;
}
.se-card:focus-within { box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
.c-blue  { border-left-color: #2563a8; }
.c-green { border-left-color: #16a34a; }
.c-amber { border-left-color: #d97706; }
.c-slate { border-left-color: #94a3b8; }

.se-card-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px 0;
}
.se-card-title-row { display: flex; align-items: center; gap: 11px; }
.se-card-icon {
  width: 38px; height: 38px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
}
.ci-blue  { background: #eff6ff; color: #1e40af; }
.ci-green { background: #f0fdf4; color: #16a34a; }
.ci-amber { background: #fffbeb; color: #d97706; }
.se-card-title { font-size: 14px; font-weight: 700; color: #111827; }
.se-card-sub   { font-size: 11.5px; color: #9ca3af; margin-top: 2px; }
.se-card-body  { padding: 16px 24px 22px; }

/* ── GRID ── */
.g { display: grid; gap: 14px; }
.g2 { grid-template-columns: repeat(2, 1fr); }
.g3 { grid-template-columns: repeat(3, 1fr); }
.g4 { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 960px) { .g4 { grid-template-columns: repeat(2,1fr); } .g3 { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 600px)  { .g4,.g3,.g2 { grid-template-columns: 1fr; } }

/* ── FIELDS ── */
.f { display: flex; flex-direction: column; gap: 5px; }
.lbl {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.7px;
  text-transform: uppercase; color: #9ca3af;
}
.inp, .sel {
  background: #f9fafb; border: 1.5px solid #e5e7eb;
  border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13.5px; font-weight: 500; color: #111827;
  padding: 10px 13px; outline: none; width: 100%;
  transition: all 0.18s; appearance: none;
}
.inp::placeholder { color: #d1d5db; font-weight: 400; }
.inp:focus, .sel:focus {
  border-color: #2563a8; background: #fff;
  box-shadow: 0 0 0 3px rgba(37,99,168,0.1);
}
.inp[readonly] { color: #9ca3af; background: #f3f4f6; cursor: default; }
.inp:disabled, .sel:disabled { opacity: 0.4; cursor: not-allowed; }
.sel-w { position: relative; }
.sel-w::after {
  content: '▾'; position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: #9ca3af; pointer-events: none; font-size: 12px;
}
.sel { padding-right: 32px; cursor: pointer; }
.sel option { background: #fff; }

/* ── GENDER PILLS ── */
.rpg { display: flex; gap: 8px; }
.rp {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 10px; cursor: pointer;
  border: 1.5px solid #e5e7eb; background: #f9fafb;
  font-size: 13px; font-weight: 500; color: #6b7280;
  transition: all 0.18s; user-select: none; flex: 1; justify-content: center;
}
.rp input { display: none; }
.rp:hover { border-color: #93c5fd; color: #1f2937; }
.rp.on { background: #eff6ff; border-color: #2563a8; color: #1e3a5f; font-weight: 700; }
.rp-dot {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid currentColor; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.rp.on .rp-dot::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #2563a8; display: block; }

/* ── DISABILITY TOGGLE ── */
.dis-row {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px; border-radius: 10px;
  border: 1.5px solid #e5e7eb; background: #f9fafb;
  font-size: 13px; font-weight: 500; color: #374151;
  cursor: pointer; user-select: none; width: fit-content;
  transition: all 0.18s;
}
.dis-row input { display: none; }
.dis-row.on { border-color: #fbbf24; background: #fffbeb; color: #92400e; }
.sw {
  width: 36px; height: 20px; border-radius: 10px;
  background: #d1d5db; position: relative; flex-shrink: 0; transition: background 0.2s;
}
.sw::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 14px; height: 14px; border-radius: 50%; background: #fff;
  transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.18);
}
.dis-row.on .sw { background: #f59e0b; }
.dis-row.on .sw::after { transform: translateX(16px); }
.dis-detail {
  margin-top: 10px; padding: 12px 14px;
  background: #fffbeb; border: 1.5px solid #fcd34d; border-radius: 10px;
  animation: sld 0.2s ease;
}
@keyframes sld { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

/* ── SUBJECTS ── */
.subjs { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
@media (max-width:960px) { .subjs { grid-template-columns: repeat(3,1fr); } }
@media (max-width:600px)  { .subjs { grid-template-columns: repeat(2,1fr); } }

.subj {
  display: flex; align-items: center; gap: 9px;
  padding: 12px 14px; border-radius: 11px; cursor: pointer;
  border: 1.5px solid #e5e7eb; background: #f9fafb;
  font-size: 12.5px; font-weight: 500; color: #6b7280;
  transition: all 0.18s; user-select: none; /* Removed icon centering logic */
}
.subj:hover { border-color: #93c5fd; color: #1f2937; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.07); }
.subj.on { background: #fffbeb; border-color: #d97706; color: #92400e; font-weight: 600; box-shadow: 0 2px 10px rgba(217,119,6,0.14); }
.subj-name { flex: 1; line-height: 1.3; }
.subj-chk {
  width: 15px; height: 15px; border-radius: 4px; border: 1.5px solid currentColor;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 9px;
}
.subj.on .subj-chk { background: #d97706; border-color: #d97706; color: #fff; }

.sel-all-btn {
  display: flex; align-items: center; gap: 7px; cursor: pointer;
  font-size: 12px; font-weight: 600; color: #6b7280;
  padding: 6px 12px; border-radius: 8px;
  background: #f9fafb; border: 1.5px solid #e5e7eb;
  transition: all 0.18s; user-select: none;
}
.sel-all-btn:hover { color: #374151; border-color: #d1d5db; }
.sel-all-btn.all { color: #92400e; background: #fffbeb; border-color: #d97706; }
.sa-chk { width: 15px; height: 15px; border-radius: 4px; border: 1.5px solid currentColor; display:flex; align-items:center; justify-content:center; font-size: 9px; }
.sel-all-btn.all .sa-chk { background: #d97706; border-color: #d97706; color: #fff; }
.cnt-badge {
  font-size: 11px; font-family: 'DM Mono', monospace;
  background: #fffbeb; border: 1px solid #fde68a;
  color: #d97706; padding: 3px 10px; border-radius: 20px;
}

/* ── FORM FOOTER ── */
.form-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  background: #f8fafc; border-top: 1px solid #f1f5f9;
}

/* ── BUTTONS ── */
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 11px 26px; border-radius: 50px; border: none;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s ease;
}
.btn-prim {
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  color: #fff; box-shadow: 0 4px 16px rgba(37,99,168,0.3);
}
.btn-prim:hover { box-shadow: 0 6px 22px rgba(37,99,168,0.44); transform: translateY(-1px); }
.btn-prim:active { transform: translateY(0); }
.btn-ghost {
  background: #fff; color: #374151;
  border: 1.5px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.btn-ghost:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

/* ── EDIT BANNER ── */
.edit-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 10px; margin-bottom: 16px;
  background: #eff6ff; border: 1px solid #bfdbfe;
  font-size: 12.5px; color: #1e40af; font-weight: 600;
}

/* ── TABLE / STUDENTS TAB ── */
.search-wrap { position: relative; flex: 1; min-width: 240px; }
.search-icon {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
  color: #9ca3af; pointer-events: none; font-size: 14px;
}
.search-inp {
  width: 100%; background: #fff; border: 1.5px solid #e5e7eb;
  border-radius: 12px; padding: 11px 14px 11px 40px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; color: #111827;
  outline: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.18s;
}
.search-inp::placeholder { color: #d1d5db; }
.search-inp:focus { border-color: #2563a8; box-shadow: 0 0 0 3px rgba(37,99,168,0.1); }

.tbl-wrap { border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); background:#fff; overflow-x:auto; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl thead th {
  background: #f8fafc; padding: 12px 14px;
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.7px;
  text-transform: uppercase; color: #94a3b8;
  border-bottom: 1px solid #f1f5f9; white-space: nowrap;
}
.tbl thead th:first-child { padding-left: 20px; }
.tbl tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.12s; }
.tbl tbody tr:last-child { border-bottom: none; }
.tbl tbody tr:hover { background: #f9fafb; }
.tbl td { padding: 12px 14px; font-size: 13px; color: #6b7280; vertical-align: middle; white-space: nowrap; }
.tbl td:first-child { padding-left: 20px; }

.ava {
  width: 38px; height: 38px; border-radius: 11px;
  background: linear-gradient(135deg, #dbeafe, #eff6ff);
  border: 1.5px solid #bfdbfe;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; color: #1e40af;
  flex-shrink: 0; font-family: 'DM Mono', monospace;
}
.tbl-name { font-weight: 700; color: #111827; font-size: 13.5px; }

.bdg {
  display: inline-flex; align-items: center;
  padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600; font-family: 'DM Mono', monospace; white-space: nowrap;
}
.bd-blue  { background: #eff6ff; color: #1e40af; }
.bd-green { background: #f0fdf4; color: #16a34a; }
.bd-amber { background: #fffbeb; color: #d97706; }
.bd-red   { background: #fef2f2; color: #dc2626; }
.bd-slate { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }

.act-btn {
  width: 32px; height: 32px; border-radius: 9px;
  border: 1.5px solid #e5e7eb; background: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 14px; cursor: pointer; transition: all 0.18s; color: #6b7280;
}
.act-btn.edit:hover { border-color: #93c5fd; background: #eff6ff; color: #2563a8; }
.act-btn.del:hover  { border-color: #fca5a5; background: #fef2f2; color: #dc2626; }
.act-btn + .act-btn { margin-left: 5px; }

.empty-st { padding: 56px 24px; text-align: center; color: #94a3b8; }
.empty-ico { font-size: 44px; margin-bottom: 10px; opacity: 0.45; }

/* ── PAGINATION ── */
.pgr { display: flex; justify-content: center; gap: 5px; padding: 18px 0 4px; flex-wrap: wrap; }
.pg {
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  border-radius: 9px; border: 1.5px solid #e5e7eb; background: #fff;
  font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: #6b7280;
  cursor: pointer; transition: all 0.18s;
}
.pg:hover { border-color: #93c5fd; color: #1e40af; }
.pg.on { background: linear-gradient(135deg, #1e3a5f, #2563a8); color: #fff; border-color: transparent; box-shadow: 0 3px 10px rgba(37,99,168,0.3); }

/* ── RESPONSIVE ── */
@media (max-width: 768px) {
  .se-header { padding: 18px 20px; }
  .se-header-title { font-size: 18px; }
  .se-header-stat { display: none; }
  .se-tabs-bar { padding: 14px 16px 0; overflow-x: auto; }
  .se-body { padding: 14px 16px 32px; }
  .se-card-body { padding: 14px 16px 18px; }
  .btn { padding: 10px 18px; font-size: 12px; }
}

.fade-up { animation: fu 0.28s ease both; }
@keyframes fu { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
`;

const initials = (fn, ln) => `${(fn||'?')[0]}${(ln||'?')[0]}`.toUpperCase();

export default function StudentEnroll() {
    const BLANK = {
        firstname:"", middlename:"", lastname:"",
        studentNumber:"", gender:"", dateOfBirth:"", class:"",
        previousDistrict:"", previousSchool:"", currentSchool:"",
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
    const [districts,            setDistricts]            = useState([]);
    const [schools,              setSchools]              = useState([]);
    const [currentSchool,        setCurrentSchool]        = useState("");
    const [activeAcademicYear,   setActiveAcademicYear]   = useState(null);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    useEffect(() => {
        fetchStudents(); fetchDistricts(); fetchSubjects(); fetchActiveAcademicYear();
        const id = localStorage.getItem("schoolId");
        if (id) fetchCurrentSchool(id);
    }, []);

    const fetchStudents           = async () => { try { const d = await SchoolStudentService.fetchStudentsForSchool(); setStudents(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchDistricts          = async () => { try { const d = await SchoolService.fetchDistricts(); setDistricts(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchSchools            = async (id) => { try { const d = await SchoolService.fetchSchoolsByDistrict(id); setSchools(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchSubjects           = async () => { try { const d = await SubjectService.fetchAllSubjects(); setSubjects(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchActiveAcademicYear = async () => { try { const d = await AcademicYearService.getActiveAcademicYear(); setActiveAcademicYear(d); } catch(e){console.error(e);} };
    const fetchCurrentSchool      = async (id) => {
        try { const d = await SchoolService.getSchoolById(id); setCurrentSchool(d.name||""); setForm(p=>({...p, currentSchool:d.name||""})); }
        catch(e){console.error(e);}
    };

    const handleDistrictChange = (id) => { set("previousDistrict", id); set("previousSchool",""); fetchSchools(id); };
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
                previous_school_id: form.previousSchool ? parseInt(form.previousSchool) : null,
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
            class: s.form_level ? String(s.form_level) : "", previousDistrict: s.previous_district||"", previousSchool: s.previous_school||"",
            currentSchool, disability: s.disability||false, disabilityDetails: s.disability_details||"",
            guardianFirstname: parts[0]||"", guardianMiddlename: "",
            guardianLastname: parts.length > 1 ? parts.slice(1).join(' ') : "",
            guardianPhone: s.guardian_phone||"", guardianAltPhone: s.guardian_alt_phone||"",
            guardianEmail: s.guardian_email||"", guardianRelationship: s.guardian_relationship||"",
            selectedSubjects: s.subject_ids||[]
        });
        if (s.previous_district) fetchSchools(s.previous_district);
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
            <style>{CSS}</style>
            <ToastNote show={toast.show} onClose={()=>setToast({...toast,show:false})} message={toast.message} variant={toast.variant}/>
            <ConfirmModal show={modal.show} onHide={()=>setModal({show:false,studentId:null})} onConfirm={confirmDelete} title="Delete Student" body="This action cannot be undone. Are you sure you want to delete this student?"/>

            <div className="se">

                {/* ── Header ── */}
                <div className="se-header">
                    <div className="se-header-icon"><i className="bi bi-mortarboard-fill"></i></div>
                    <div className="se-header-text">
                        <div className="se-header-title">Student Enrollment</div>
                        <div className="se-header-sub">Manage student records and subject allocation</div>
                    </div>
                    <div className="se-header-stat">
                        <div className="se-stat-num">{students.length}</div>
                        <div className="se-stat-lbl">Enrolled</div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="se-tabs-bar">
                    <div className="se-tabs">
                        <button className={`se-tab ${activeTab==='form'?'active':''}`} onClick={()=>setActiveTab('form')}>
                            <i className="bi bi-pencil-square"></i> {isEditing ? 'Edit Student' : 'New Enrollment'}
                        </button>
                        <button className={`se-tab ${activeTab==='students'?'active':''}`} onClick={()=>setActiveTab('students')}>
                            <i className="bi bi-list-ul"></i> All Students <span className="se-tab-pill">{students.length}</span>
                        </button>
                    </div>
                </div>

                {/* ── Content ── */}
                <div className="se-body">

                    {/* ══ ENROLLMENT FORM ══ */}
                    {activeTab === 'form' && (
                        <form onSubmit={handleSubmit} className="fade-up">

                            {isEditing && (
                                <div className="edit-banner">
                                    <i className="bi bi-pencil-square me-1"></i> Editing student — ID <strong style={{fontFamily:'DM Mono,monospace'}}>{editingId}</strong>. Changes will update existing record.
                                    <button type="button" className="btn btn-ghost" style={{marginLeft:'auto',padding:'5px 14px',fontSize:12}} onClick={resetForm}><i className="bi bi-x-lg"></i> Cancel</button>
                                </div>
                            )}

                            {/* ─ Student Details ─ */}
                            <div className="se-card c-blue">
                                <div className="se-card-head">
                                    <div className="se-card-title-row">
                                        <div className="se-card-icon ci-blue"><i className="bi bi-person-circle"></i></div>
                                        <div>
                                            <div className="se-card-title">Student Details</div>
                                            <div className="se-card-sub">Personal and academic information</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="se-card-body">
                                    <div className="g g3" style={{marginBottom:14}}>
                                        <div className="f"><label className="lbl">First Name *</label><input className="inp" type="text" placeholder="e.g. Chisomo" value={form.firstname} onChange={e=>set('firstname',e.target.value)} required/></div>
                                        <div className="f"><label className="lbl">Middle Name</label><input className="inp" type="text" placeholder="Optional" value={form.middlename} onChange={e=>set('middlename',e.target.value)}/></div>
                                        <div className="f"><label className="lbl">Last Name *</label><input className="inp" type="text" placeholder="e.g. Banda" value={form.lastname} onChange={e=>set('lastname',e.target.value)} required/></div>
                                    </div>
                                    <div className="g g4" style={{marginBottom:14}}>
                                        <div className="f">
                                            <label className="lbl">Student No. *</label>
                                            <input className="inp" type="text" placeholder="e.g. 2024-001" value={form.studentNumber} onChange={e=>set('studentNumber',e.target.value)} required/>
                                        </div>
                                        <div className="f">
                                            <label className="lbl">Gender *</label>
                                            <div className="rpg">
                                                {["Male","Female"].map(g=>(
                                                    <label key={g} className={`rp ${form.gender===g?'on':''}`}>
                                                        <input type="radio" name="gender" value={g} checked={form.gender===g} onChange={e=>set('gender',e.target.value)} required/>
                                                        <span className="rp-dot"></span>{g}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="f"><label className="lbl">Date of Birth *</label><input className="inp" type="date" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} required/></div>
                                        <div className="f">
                                            <label className="lbl">Class *</label>
                                            <div className="sel-w">
                                                <select className="sel" value={form.class} onChange={e=>set('class',e.target.value)} required>
                                                    <option value="">Select class…</option>
                                                    {CLASSES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="g g3" style={{marginBottom:14}}>
                                        <div className="f">
                                            <label className="lbl">Previous District</label>
                                            <div className="sel-w">
                                                <select className="sel" value={form.previousDistrict} onChange={e=>handleDistrictChange(e.target.value)}>
                                                    <option value="">Select district…</option>
                                                    {districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="f">
                                            <label className="lbl">Previous School</label>
                                            <div className="sel-w">
                                                <select className="sel" value={form.previousSchool} onChange={e=>set('previousSchool',e.target.value)} disabled={!form.previousDistrict}>
                                                    <option value="">Select school…</option>
                                                    {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="f">
                                            <label className="lbl">Current School</label>
                                            <input className="inp" type="text" value={form.currentSchool} readOnly/>
                                        </div>
                                    </div>
                                    <div className="g g3" style={{marginBottom:14}}>
                                        <div className="f">
                                            <label className="lbl">Academic Year *</label>
                                            <input className="inp" type="text" value={activeAcademicYear ? `${activeAcademicYear.year} (${activeAcademicYear.start_date} - ${activeAcademicYear.end_date})` : "Loading..."} readOnly/>
                                        </div>
                                    </div>
                                    {/* Disability toggle */}
                                    <label className={`dis-row ${form.disability?'on':''}`}>
                                        <input type="checkbox" checked={form.disability} onChange={e=>set('disability',e.target.checked)}/>
                                        <span className="sw"></span>
                                        Student has a disability or special need
                                    </label>
                                    {form.disability && (
                                        <div className="dis-detail">
                                            <label className="lbl" style={{color:'#b45309',marginBottom:6,display:'block'}}>Disability Details</label>
                                            <input className="inp" type="text" placeholder="Describe condition…" value={form.disabilityDetails} onChange={e=>set('disabilityDetails',e.target.value)} style={{borderColor:'#fcd34d'}}/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─ Guardian Details ─ */}
                            <div className="se-card c-green">
                                <div className="se-card-head">
                                    <div className="se-card-title-row">
                                        <div className="se-card-icon ci-green"><i className="bi bi-people-fill"></i></div>
                                        <div>
                                            <div className="se-card-title">Guardian / Parent Details</div>
                                            <div className="se-card-sub">Emergency contact and relationship</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="se-card-body">
                                    <div className="g g3" style={{marginBottom:14}}>
                                        <div className="f"><label className="lbl">First Name *</label><input className="inp" type="text" placeholder="Guardian's first name" value={form.guardianFirstname} onChange={e=>set('guardianFirstname',e.target.value)} required/></div>
                                        <div className="f"><label className="lbl">Middle Name</label><input className="inp" type="text" placeholder="Optional" value={form.guardianMiddlename} onChange={e=>set('guardianMiddlename',e.target.value)}/></div>
                                        <div className="f"><label className="lbl">Last Name *</label><input className="inp" type="text" placeholder="Guardian's last name" value={form.guardianLastname} onChange={e=>set('guardianLastname',e.target.value)} required/></div>
                                    </div>
                                    <div className="g g4">
                                        <div className="f"><label className="lbl">Phone *</label><input className="inp" type="tel" placeholder="+265 XXX XXX XXX" value={form.guardianPhone} onChange={e=>set('guardianPhone',e.target.value)} required/></div>
                                        <div className="f"><label className="lbl">Alt. Phone</label><input className="inp" type="tel" placeholder="Optional" value={form.guardianAltPhone} onChange={e=>set('guardianAltPhone',e.target.value)}/></div>
                                        <div className="f"><label className="lbl">Email</label><input className="inp" type="email" placeholder="guardian@email.com" value={form.guardianEmail} onChange={e=>set('guardianEmail',e.target.value)}/></div>
                                        <div className="f">
                                            <label className="lbl">Relationship *</label>
                                            <div className="sel-w">
                                                <select className="sel" value={form.guardianRelationship} onChange={e=>set('guardianRelationship',e.target.value)} required>
                                                    <option value="">Select…</option>
                                                    {["Father","Mother","Guardian","Other"].map(r=><option key={r} value={r.toLowerCase()}>{r}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ─ Subjects ─ */}
                            <div className="se-card c-amber">
                                <div className="se-card-head">
                                    <div className="se-card-title-row">
                                        <div className="se-card-icon ci-amber"><i className="bi bi-stack"></i></div>
                                        <div>
                                            <div className="se-card-title">Subject Selection</div>
                                            <div className="se-card-sub">Choose subjects student will take this term</div>
                                        </div>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                                        {form.selectedSubjects.length > 0 && <span className="cnt-badge">{form.selectedSubjects.length} selected</span>}
                                        <div className={`sel-all-btn ${allSel?'all':''}`} onClick={toggleAll}>
                                            <span className="sa-chk">{allSel?'✓':''}</span>
                                            {allSel ? 'Deselect All' : 'Select All'}
                                        </div>
                                    </div>
                                </div>
                                <div className="se-card-body">
                                    {subjects.length === 0 ? (
                                        <div style={{textAlign:'center',padding:'32px 16px',color:'#9ca3af'}}>
                                            <i className="bi bi-info-circle" style={{fontSize:'24px',marginBottom:'10px',display:'block'}}></i>
                                            <p style={{fontSize:'13px'}}>Loading subjects...</p>
                                        </div>
                                    ) : (
                                        <div className="subjs">
                                            {subjects.map(sub=>{
                                                const on = form.selectedSubjects.includes(sub.id);
                                                return (
                                                    <div key={sub.id} className={`subj ${on?'on':''}`} onClick={()=>toggleSubject(sub.id)}>
                                                        <span className="subj-name">{sub.name}</span>
                                                        <span className="subj-chk">{on?'✓':''}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ─ Footer ── */}
                            <div className="se-card c-slate" style={{marginBottom:0}}>
                                <div className="form-foot">
                                    <button type="button" className="btn btn-ghost" onClick={resetForm}><i className="bi bi-arrow-counterclockwise"></i> Reset Form</button>
                                    <button type="submit" className="btn btn-prim">
                                        <i className="bi bi-check-circle-fill"></i> {isEditing ? 'Update Student' : 'Enroll Student'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* ══ STUDENTS LIST ══ */}
                    {activeTab === 'students' && (
                        <div className="fade-up">
                            {/* Search row */}
                            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16,flexWrap:'wrap'}}>
                                <div className="search-wrap">
                                    <i className="bi bi-search search-icon"></i>
                                    <input className="search-inp" type="text" placeholder="Search by name or student number…" value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setCurrentPage(1);}}/>
                                </div>
                                <span style={{fontSize:12,color:'#94a3b8',fontWeight:600,whiteSpace:'nowrap'}}>
                                    {filtered.length} / {students.length} students
                                </span>
                            </div>

                            <div className="tbl-wrap">
                                <table className="tbl">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>No.</th>
                                            <th>Class</th>
                                            <th>Gender</th>
                                            <th>D.O.B</th>
                                            <th>Prev. School</th>
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
                                                        <div className="ava">{initials(s.first_name, s.last_name)}</div>
                                                        <span className="tbl-name">{s.first_name} {s.last_name}</span>
                                                    </div>
                                                </td>
                                                <td><span className="bdg bd-slate">{s.student_number||'—'}</span></td>
                                                <td><span className="bdg bd-blue">{s.form_level||'—'}</span></td>
                                                <td style={{fontWeight:500,color:'#374151'}}>{s.gender||'—'}</td>
                                                <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '—'}</td>
                                                <td>{s.previous_school || <span style={{color:'#d1d5db'}}>—</span>}</td>
                                                <td><span className="bdg bd-green">{s.status||'Active'}</span></td>
                                                <td>{s.disability ? <span className="bdg bd-red"><i className="bi bi-exclamation-triangle-fill me-1"></i>Yes</span> : <span style={{color:'#d1d5db'}}>—</span>}</td>
                                                <td style={{fontWeight:500,color:'#374151'}}>{s.guardian_name||'—'}</td>
                                                <td style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{s.guardian_phone||'—'}</td>
                                                <td><span className="bdg bd-amber">{s.subject_ids?.length||0} subj.</span></td>
                                                <td style={{textAlign:'center',paddingRight:20}}>
                                                    <button className="act-btn edit" onClick={()=>handleEdit(s)} title="Edit"><i className="bi bi-pencil-fill"></i></button>
                                                    <button className="act-btn del"  onClick={()=>handleDelete(s.id)} title="Delete"><i className="bi bi-trash-fill"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {pageRows.length === 0 && (
                                            <tr><td colSpan={12}>
                                                <div className="empty-st">
                                                    <div className="empty-ico"><i className="bi bi-inbox"></i></div>
                                                    <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>No students found</div>
                                                    <div style={{fontSize:13}}>Try adjusting your search or enroll a new student</div>
                                                </div>
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="pgr">
                                    {Array.from({length:totalPages},(_,i)=>(
                                        <button key={i} className={`pg ${currentPage===i+1?'on':''}`} onClick={()=>setCurrentPage(i+1)}>{i+1}</button>
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