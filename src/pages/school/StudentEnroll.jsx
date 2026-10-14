import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getActiveAcademicYear } from "../../api/academicYears";
import { listDistricts } from "../../api/districts";
import { getSchool, listSchools } from "../../api/schools";
import { listSubjects } from "../../api/subjects";
import {
    createSchoolStudent,
    deleteSchoolStudent,
    findSimilarSchoolStudents,
    listAllSchoolStudents,
    updateSchoolStudent,
} from "../../api/schoolPortal";
import ToastNote from "../../components/ToastNote";
import TypeToConfirm from "../../components/TypeToConfirm";
import DuplicateLearnerDialog from "../../components/DuplicateLearnerDialog";
import TablePagination from "../../components/TablePagination";
import {
    Badge,
    Button,
    Card,
    EmptyState,
    Field,
    IconButton,
    Input,
    Notice,
    Page,
    Person,
    SearchInput,
    Select,
    Switch,
    Table,
} from "../../components/ui";
import styles from "./StudentEnroll.module.css";

export default function StudentEnroll() {
    const { schoolId } = useParams();
    // The Students page links here with ?edit=<studentId> to edit a student
    const [searchParams, setSearchParams] = useSearchParams();
    const BLANK = {
        firstname:"", middlename:"", lastname:"",
        studentNumber:"", gender:"", dateOfBirth:"", class:"", nationalId:"", jceNumber:"",
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
    const [modal,                setModal]                = useState({ show:false, student:null });
    const [duplicates,           setDuplicates]           = useState(null); // { matches, payload } awaiting confirmation
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
        fetchCurrentSchool(schoolId);
    }, [schoolId]);

    const fetchStudents           = async () => {
        try {
            const list = await listAllSchoolStudents(schoolId);
            setStudents(list);
            openRequestedEdit(list);
        } catch (e) {
            setToast({ show:true, message:`Failed to load students: ${e.message}`, variant:"danger" });
        }
    };
    const openRequestedEdit = (list) => {
        const editId = searchParams.get("edit");
        if (!editId) return;
        const student = list.find(s => String(s.id) === editId);
        if (student) handleEdit(student);
        setSearchParams({}, { replace: true });
    };
    const fetchDistricts          = async () => { try { const d = await listDistricts(); setDistricts(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchSchools            = async (id) => { try { const d = await listSchools({ district_id: id }); setSchools(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchSubjects           = async () => { try { const d = await listSubjects(); setSubjects(Array.isArray(d)?d:[]); } catch(e){console.error(e);} };
    const fetchActiveAcademicYear = async () => { try { const d = await getActiveAcademicYear(); setActiveAcademicYear(d); } catch(e){console.error(e);} };
    const fetchCurrentSchool      = async (id) => {
        try { const d = await getSchool(id); setCurrentSchool(d.name||""); setForm(p=>({...p, currentSchool:d.name||""})); }
        catch(e){console.error(e);}
    };

    const handleDistrictChange = (id) => { set("previousDistrict", id); set("previousSchool",""); fetchSchools(id); };
    const toggleSubject = (id) => set("selectedSubjects", form.selectedSubjects.includes(id) ? form.selectedSubjects.filter(s=>s!==id) : [...form.selectedSubjects, id]);
    const toggleAll = () => set("selectedSubjects", form.selectedSubjects.length === subjects.length ? [] : subjects.map(s=>s.id));

    const resetForm = () => { setIsEditing(false); setEditingId(null); setForm({...BLANK, currentSchool}); };

    // Saves the learner; called directly, or after the possible-duplicate warning
    const save = async (payload) => {
        try {
            if (isEditing) {
                await updateSchoolStudent(schoolId, editingId, payload);
                setToast({ show:true, message:"Student updated successfully!", variant:"success" });
            } else {
                await createSchoolStudent(schoolId, payload);
                setToast({ show:true, message:"Student enrolled successfully!", variant:"success" });
            }
            setDuplicates(null);
            resetForm(); fetchStudents();
        } catch(err) {
            setDuplicates(null);
            setToast({ show:true, message: err.message, variant:"danger" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!activeAcademicYear) {
                setToast({ show:true, message:"No active academic year found. Please contact administrator.", variant:"danger" });
                return;
            }
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
                subject_ids: form.selectedSubjects, status: "active", academic_year_id: parseInt(activeAcademicYear.id),
                national_id: form.nationalId, jce_number: form.jceNumber
            };
            // Same name plus same date of birth or guardian phone: warn before saving
            const matches = await findSimilarSchoolStudents(schoolId, {
                first_name: form.firstname, last_name: form.lastname, date_of_birth: form.dateOfBirth,
                guardian_phone: form.guardianPhone, exclude_id: isEditing ? editingId : null,
            });
            if (matches.length) { setDuplicates({ matches, payload }); return; }
            await save(payload);
        } catch(err) {
            setToast({ show:true, message: err.message, variant:"danger" });
        }
    };

    const handleEdit = (s) => {
        const parts = s.guardian_name ? s.guardian_name.split(' ') : [];
        setIsEditing(true); setEditingId(s.id);
        setForm({
            firstname: s.first_name||"", middlename: s.middle_name||"", lastname: s.last_name||"",
            studentNumber: s.student_number||"", gender: s.gender||"",
            nationalId: s.national_id||"", jceNumber: s.jce_number||"",
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

    const handleDelete = (student) => setModal({ show:true, student });
    const confirmDelete = async () => {
        try { await deleteSchoolStudent(schoolId, modal.student.id); setToast({ show:true, message:"Student deleted.", variant:"success" }); fetchStudents(); }
        catch(e) { setToast({ show:true, message:e.message, variant:"danger" }); }
        finally { setModal({ show:false, student:null }); }
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
        <Page
            icon="bi-mortarboard-fill"
            title="Student Enrollment"
            subtitle="Manage student records and subject allocation"
            stats={[{ label: "Enrolled", value: students.length }]}
            tabs={[
                { key: "form", label: isEditing ? "Edit Student" : "New Enrollment", icon: "bi-pencil-square" },
                { key: "students", label: "All Students", icon: "bi-list-ul", count: students.length },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <ToastNote show={toast.show} onClose={()=>setToast({...toast,show:false})} message={toast.message} variant={toast.variant}/>
            <DuplicateLearnerDialog
                matches={duplicates?.matches}
                onCancel={()=>setDuplicates(null)}
                onConfirm={()=>save(duplicates.payload)}
            />
            <TypeToConfirm
                show={modal.show}
                onHide={()=>setModal({show:false,student:null})}
                onConfirm={confirmDelete}
                name={modal.student ? `${modal.student.first_name} ${modal.student.last_name}` : ""}
                title="Delete Student"
                confirmLabel="Delete student"
            >
                Deleting <strong>{modal.student?.first_name} {modal.student?.last_name}</strong> permanently erases their marks,
                subject choices and transfer history. If the student is moving to another school, start a transfer instead.
            </TypeToConfirm>

            {/* ══ ENROLLMENT FORM ══ */}
            {activeTab === 'form' && (
                <form onSubmit={handleSubmit} className={styles.form}>

                    {isEditing && (
                        <Notice tone="blue" icon="bi-pencil-square">
                            <span>Editing student — ID <strong>{editingId}</strong>. Changes will update existing record.</span>
                            <Button variant="ghost" size="sm" icon="bi-x-lg" onClick={resetForm}>Cancel</Button>
                        </Notice>
                    )}

                    {/* ─ Student Details ─ */}
                    <Card accent="blue" icon="bi-person-circle" title="Student Details" subtitle="Personal and academic information">
                        <div className="ui-grid">
                            <div className="ui-grid ui-cols-3">
                                <Field label="First Name" required><Input type="text" placeholder="e.g. Chisomo" value={form.firstname} onChange={e=>set('firstname',e.target.value)} required/></Field>
                                <Field label="Middle Name"><Input type="text" placeholder="Optional" value={form.middlename} onChange={e=>set('middlename',e.target.value)}/></Field>
                                <Field label="Last Name" required><Input type="text" placeholder="e.g. Banda" value={form.lastname} onChange={e=>set('lastname',e.target.value)} required/></Field>
                            </div>
                            <div className="ui-grid ui-cols-4">
                                <Field label="Student No." required>
                                    <Input type="text" placeholder="e.g. 2024-001" value={form.studentNumber} onChange={e=>set('studentNumber',e.target.value)} required/>
                                </Field>
                                <Field label="Gender" required>
                                    <div className={styles.pills}>
                                        {["Male","Female"].map(g=>(
                                            <label key={g} className={`${styles.pill} ${form.gender===g ? styles.pillOn : ''}`}>
                                                <input type="radio" name="gender" value={g} checked={form.gender===g} onChange={e=>set('gender',e.target.value)} required/>
                                                <span className={styles.dot}></span>{g}
                                            </label>
                                        ))}
                                    </div>
                                </Field>
                                <Field label="Date of Birth" required><Input type="date" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} required/></Field>
                                <Field label="Class" required>
                                    <Select value={form.class} onChange={e=>set('class',e.target.value)} required>
                                        <option value="">Select class…</option>
                                        {CLASSES.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                                    </Select>
                                </Field>
                            </div>
                            <div className="ui-grid ui-cols-2">
                                <Field label="National ID" hint="8 letters and numbers. Leave empty if the learner does not have one yet (common in Form 1)">
                                    <Input type="text" placeholder="e.g. AB12CD34" maxLength={8} value={form.nationalId} onChange={e=>set('nationalId',e.target.value.toUpperCase())}/>
                                </Field>
                                <Field label="JCE Number" hint="Given when the learner registers for JCE in Form 2">
                                    <Input type="text" placeholder="Optional" maxLength={30} value={form.jceNumber} onChange={e=>set('jceNumber',e.target.value.toUpperCase())}/>
                                </Field>
                            </div>
                            <div className="ui-grid ui-cols-3">
                                <Field label="Previous District">
                                    <Select value={form.previousDistrict} onChange={e=>handleDistrictChange(e.target.value)}>
                                        <option value="">Select district…</option>
                                        {districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                                    </Select>
                                </Field>
                                <Field label="Previous School">
                                    <Select value={form.previousSchool} onChange={e=>set('previousSchool',e.target.value)} disabled={!form.previousDistrict}>
                                        <option value="">Select school…</option>
                                        {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                                    </Select>
                                </Field>
                                <Field label="Current School">
                                    <Input type="text" value={form.currentSchool} readOnly/>
                                </Field>
                            </div>
                            <div className="ui-grid ui-cols-3">
                                <Field label="Academic Year" required>
                                    <Input type="text" value={activeAcademicYear ? `${activeAcademicYear.year} (${activeAcademicYear.start_date} - ${activeAcademicYear.end_date})` : "Loading..."} readOnly/>
                                </Field>
                            </div>
                            <div>
                                <Switch checked={form.disability} onChange={checked=>set('disability',checked)}>
                                    Student has a disability or special need
                                </Switch>
                                {form.disability && (
                                    <div className={styles.disabilityDetail}>
                                        <Field label="Disability Details">
                                            <Input type="text" placeholder="Describe condition…" value={form.disabilityDetails} onChange={e=>set('disabilityDetails',e.target.value)}/>
                                        </Field>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* ─ Guardian Details ─ */}
                    <Card accent="green" icon="bi-people-fill" title="Guardian / Parent Details" subtitle="Emergency contact and relationship">
                        <div className="ui-grid">
                            <div className="ui-grid ui-cols-3">
                                <Field label="First Name" required><Input type="text" placeholder="Guardian's first name" value={form.guardianFirstname} onChange={e=>set('guardianFirstname',e.target.value)} required/></Field>
                                <Field label="Middle Name"><Input type="text" placeholder="Optional" value={form.guardianMiddlename} onChange={e=>set('guardianMiddlename',e.target.value)}/></Field>
                                <Field label="Last Name" required><Input type="text" placeholder="Guardian's last name" value={form.guardianLastname} onChange={e=>set('guardianLastname',e.target.value)} required/></Field>
                            </div>
                            <div className="ui-grid ui-cols-4">
                                <Field label="Phone" required><Input type="tel" placeholder="+265 XXX XXX XXX" value={form.guardianPhone} onChange={e=>set('guardianPhone',e.target.value)} required/></Field>
                                <Field label="Alt. Phone"><Input type="tel" placeholder="Optional" value={form.guardianAltPhone} onChange={e=>set('guardianAltPhone',e.target.value)}/></Field>
                                <Field label="Email"><Input type="email" placeholder="guardian@email.com" value={form.guardianEmail} onChange={e=>set('guardianEmail',e.target.value)}/></Field>
                                <Field label="Relationship" required>
                                    <Select value={form.guardianRelationship} onChange={e=>set('guardianRelationship',e.target.value)} required>
                                        <option value="">Select…</option>
                                        {["Father","Mother","Guardian","Other"].map(r=><option key={r} value={r.toLowerCase()}>{r}</option>)}
                                    </Select>
                                </Field>
                            </div>
                        </div>
                    </Card>

                    {/* ─ Subjects ─ */}
                    <Card
                        accent="amber"
                        icon="bi-stack"
                        title="Subject Selection"
                        subtitle="Choose subjects student will take this term"
                        actions={
                            <>
                                {form.selectedSubjects.length > 0 && <Badge tone="amber">{form.selectedSubjects.length} selected</Badge>}
                                <button type="button" className={`${styles.selectAll} ${allSel ? styles.checked : ''}`} onClick={toggleAll}>
                                    <span className={styles.check}>{allSel?'✓':''}</span>
                                    {allSel ? 'Deselect All' : 'Select All'}
                                </button>
                            </>
                        }
                        footer={
                            <>
                                <Button variant="ghost" icon="bi-arrow-counterclockwise" onClick={resetForm}>Reset Form</Button>
                                <Button type="submit" icon="bi-check-circle-fill">{isEditing ? 'Update Student' : 'Enroll Student'}</Button>
                            </>
                        }
                    >
                        {subjects.length === 0 ? (
                            <div className="ui-loading">Loading subjects...</div>
                        ) : (
                            <div className={styles.subjects}>
                                {subjects.map(sub=>{
                                    const on = form.selectedSubjects.includes(sub.id);
                                    return (
                                        <button type="button" key={sub.id} className={`${styles.subject} ${on ? styles.checked : ''}`} aria-pressed={on} onClick={()=>toggleSubject(sub.id)}>
                                            <span className={styles.subjectName}>{sub.name}</span>
                                            <span className={styles.check}>{on?'✓':''}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </form>
            )}

            {/* ══ STUDENTS LIST ══ */}
            {activeTab === 'students' && (
                <Card
                    accent="blue"
                    icon="bi-list-ul"
                    title="All Students"
                    subtitle={`${filtered.length} / ${students.length} students`}
                    actions={<SearchInput value={searchTerm} onChange={v=>{setSearchTerm(v);setCurrentPage(1);}} placeholder="Search by name or student number…"/>}
                    flush
                >
                    {pageRows.length === 0 ? (
                        <EmptyState title="No students found">Try adjusting your search or enroll a new student</EmptyState>
                    ) : (
                        <Table nowrap>
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
                                    <th className="end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map(s=>(
                                    <tr key={s.id}>
                                        <td><Person name={`${s.first_name} ${s.last_name}`}/></td>
                                        <td><Badge tone="slate">{s.student_number||'—'}</Badge></td>
                                        <td><Badge tone="blue">{s.form_level||'—'}</Badge></td>
                                        <td>{s.gender||'—'}</td>
                                        <td className="num">{s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : '—'}</td>
                                        <td>{s.previous_school || '—'}</td>
                                        <td><Badge tone="green">{s.status||'Active'}</Badge></td>
                                        <td>{s.disability ? <Badge tone="red"><i className="bi bi-exclamation-triangle-fill"></i>Yes</Badge> : '—'}</td>
                                        <td>{s.guardian_name||'—'}</td>
                                        <td className="num">{s.guardian_phone||'—'}</td>
                                        <td><Badge tone="amber">{s.subject_ids?.length||0} subj.</Badge></td>
                                        <td className="end">
                                            <IconButton kind="edit" title={`Edit ${s.first_name} ${s.last_name}`} tip="Edit student" onClick={()=>handleEdit(s)}/>
                                            <IconButton kind="delete" title={`Delete ${s.first_name} ${s.last_name}`} tip="Delete student" onClick={()=>handleDelete(s)}/>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                    <TablePagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage}/>
                </Card>
            )}
        </Page>
    );
}
