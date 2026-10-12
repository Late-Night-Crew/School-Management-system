import React, { useState, useEffect } from "react";
import AcademicYearService from "./services/academicYearService";
import { useParams } from "react-router-dom";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const TERMS = [
    { value: 1, label: "Term 1" },
    { value: 2, label: "Term 2" },
    { value: 3, label: "Term 3" },
];

const YEAR_RANGE = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() + i));

// ─── SUB-COMPONENTS ─────────────────────────────────────────────────────────

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────
function Toast({ toasts, onClose }) {
    return (
        <div className="ay-toast-wrap">
            {toasts.map(t => (
                <div key={t.id} className={`ay-toast ${t.variant}`}>
                    <i className={`bi ${t.variant === 'success' ? 'bi-check-circle-fill' : t.variant === 'danger' ? 'bi-x-circle-fill' : 'bi-info-circle-fill'}`}></i>
                    {t.message}
                    <button className="ay-toast-close" onClick={() => onClose(t.id)}>×</button>
                </div>
            ))}
        </div>
    );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="ay-overlay">
            <div className="ay-modal">
                <h3>{title}</h3>
                <p>{message}</p>
                <div className="ay-modal-actions">
                    <button className="btn-sec" onClick={onCancel}>Cancel</button>
                    <button className="btn-prim" style={{ background: 'linear-gradient(135deg,#991b1b,#dc2626)' }} onClick={onConfirm}>
                        <i className="bi bi-trash-fill"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── STATUS LABEL HELPER ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = { active: 'Active', completed: 'Completed', upcoming: 'Upcoming' };
    return <span className={`status-bdg status-${status}`}>{map[status] || status}</span>;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AcademicYear() {
    
    // FIX 1: Call useParams INSIDE the component to get schoolId from URL
    const { schoolId } = useParams();

    // Guard: Ensure we have an ID before rendering
    if (!schoolId) {
        return <div>Error: School ID missing from URL.</div>;
    }

    const [activeTab, setActiveTab] = useState("list");
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [toasts, setToasts] = useState([]);

    // ─── PAGINATION STATE ───────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ─── PAGINATION LOGIC ─────────────────────────────────────────
    const indexOfLastRecord = currentPage * itemsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - itemsPerPage;
    const currentRecords = records.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(records.length / itemsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleNextPage = () => {
        if (indexOfLastRecord < records.length) setCurrentPage(prev => prev + 1);
    };

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [records.length, totalPages, currentPage]);

    // Form state
    // Matches backend schema: term, year, begin_month, end_month
    const EMPTY_FORM = { term: null, year: '', begin_month: '', end_month: '', status: 'active' };
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});

    // ── Toasts ──────────────────────────────────────────────────────────────
    const pushToast = (message, variant = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, variant }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // ── Data Fetch helper ────────────────────────────────────────────────────
    const fetchRecords = async () => {
        const data = await AcademicYearService.fetchAllAcademicYears(schoolId);
        setRecords(Array.isArray(data) ? data : []);
    };

    // ── Initial load ─────────────────────────────────────────────────────────
    useEffect(() => {
        setLoading(true);
        fetchRecords()
            .catch(() => {
                pushToast("Failed to fetch academic years.", "danger");
                setRecords([]);
            })
            .finally(() => setLoading(false));
    }, [schoolId]); 

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!form.term) errs.term = "Select a term.";
        if (!form.year) errs.year = "Select a year.";
        if (!form.begin_month) errs.begin_month = "Select a beginning month.";
        if (!form.end_month) errs.end_month = "Select an end month.";
        
        if (form.begin_month && form.end_month) {
            if (MONTHS.indexOf(form.end_month) <= MONTHS.indexOf(form.begin_month)) {
                errs.end_month = "End month must be after beginning month.";
            }
        }
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit (Create / Update) ─────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            if (editId) {
                // Service: updateAcademicYear(schoolId, id, data)
                await AcademicYearService.updateAcademicYear(schoolId, editId, form);
                pushToast(`Academic year ${form.year} updated successfully!`, "success");
            } else {
                // Service: createAcademicYear(schoolId, data)
                await AcademicYearService.createAcademicYear(schoolId, form);
                pushToast(`Academic year ${form.year} created successfully!`, "success");
            }
            await fetchRecords();
            resetForm();
            setActiveTab("list");
        } catch (error) {
            pushToast("Failed to save academic year.", "danger");
        } finally {
            setSaving(false);
        }
    };

    // ── Edit ─────────────────────────────────────────────────────────────────
    const handleEdit = (rec) => {
        setEditId(rec.id);
        setForm({
            term: rec.term,
            year: rec.year,
            begin_month: rec.begin_month,
            end_month: rec.end_month,
            status: rec.status || 'active',
        });
        setFormErrors({});
        setActiveTab("form");
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDeleteConfirm = (id) => setConfirm({ id });
    const handleDeleteExecute = async () => {
        try {
            // Service: deleteAcademicYear(schoolId, id)
            await AcademicYearService.deleteAcademicYear(schoolId, confirm.id);
            pushToast("Academic year record deleted.", "info");
            await fetchRecords();
        } catch (error) {
            pushToast("Failed to delete academic year.", "danger");
        } finally {
            setConfirm(null);
        }
    };

    // ── Reset ────────────────────────────────────────────────────────────────
    const resetForm = () => {
        setForm(EMPTY_FORM);
        setFormErrors({});
        setEditId(null);
    };

    const handleNewClick = () => {
        resetForm();
        setActiveTab("form");
    };

    const handleCancel = () => {
        resetForm();
        setActiveTab("list");
    };

    // ── Field change helper ───────────────────────────────────────────────────
    const setField = (key, val) => {
        setForm(prev => ({ ...prev, [key]: val }));
        setFormErrors(prev => ({ ...prev, [key]: undefined }));
    };

    return (
        <>
            {/* Toasts */}
            <Toast toasts={toasts} onClose={removeToast} />

            {/* Confirm Delete Modal */}
            {confirm && (
                <ConfirmModal
                    title="Delete Record"
                    message="Are you sure you want to delete this academic year record? This action cannot be undone."
                    onConfirm={handleDeleteExecute}
                    onCancel={() => setConfirm(null)}
                />
            )}

            <div className="ay-root">

                {/* ── Header ── */}
                <div className="ay-header">
                    <div className="ay-header-icon"><i className="bi bi-calendar3"></i></div>
                    <div className="ay-header-text">
                        <h2>Academic Year Manager</h2>
                        <div className="ay-header-sub">Configure terms, months and academic years</div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="ay-tabs-bar">
                    <div className="ay-tabs">
                        <button className={`ay-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => { setActiveTab('list'); resetForm(); }}>
                            <i className="bi bi-list-ul"></i> All Records
                        </button>
                        <button className={`ay-tab ${activeTab === 'form' ? 'active' : ''}`} onClick={handleNewClick}>
                            <i className="bi bi-plus-circle"></i> {editId ? "Edit Record" : "New Record"}
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="ay-body">

                    {/* ──────────────── LIST TAB ──────────────── */}
                    {activeTab === 'list' && (
                        <>
                            {/* Summary strip */}
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Total Records', val: records.length, icon: 'bi-stack', color: '#198754' },
                                    { label: 'Active Term', val: records.filter(r => r.status === 'active').length, icon: 'bi-play-circle-fill', color: '#15803d' },
                                    { label: 'Upcoming', val: records.filter(r => r.status === 'upcoming').length, icon: 'bi-clock-fill', color: '#a16207' },
                                    { label: 'Completed', val: records.filter(r => r.status === 'completed').length, icon: 'bi-check-circle-fill', color: '#64748b' },
                                ].map(s => (
                                    <div key={s.label} style={{
                                        background: '#fff', borderRadius: 14, padding: '14px 20px',
                                        border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14,
                                        flex: '1 1 140px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                    }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10, background: s.color + '18',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: s.color, fontSize: 18, flexShrink: 0
                                        }}>
                                            <i className={`bi ${s.icon}`}></i>
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{s.val}</div>
                                            <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginTop: 3 }}>{s.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table card */}
                            <div className="ay-card">
                                <div className="ay-card-header" style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div className="ay-card-header-icon"><i className="bi bi-calendar3"></i></div>
                                        <div>
                                            <div className="ay-card-title">Academic Year Records</div>
                                            <div className="ay-card-sub">{records.length} total record{records.length !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <button className="btn-prim" onClick={handleNewClick}>
                                        <i className="bi bi-plus-lg"></i> New Record
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="ay-empty">
                                        <i className="bi bi-hourglass-split"></i>
                                        <h3>Loading…</h3>
                                        <p>Fetching academic year records.</p>
                                    </div>
                                ) : records.length === 0 ? (
                                    <div className="ay-empty">
                                        <i className="bi bi-calendar-x"></i>
                                        <h3>No Records Yet</h3>
                                        <p>Click <strong>New Record</strong> to add the first academic year term.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-container" style={{ borderRadius: 0, border: 'none', boxShadow: 'none' }}>
                                            <table className="ay-table">
                                                <thead>
                                                    <tr>
                                                        <th className="ay-th">#</th>
                                                        <th className="ay-th">Term</th>
                                                        <th className="ay-th">Year</th>
                                                        <th className="ay-th">Period</th>
                                                        <th className="ay-th">Status</th>
                                                        <th className="ay-th">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentRecords.map((rec, idx) => (
                                                        <tr key={rec.id}>
                                                            <td className="ay-td" style={{ color: '#94a3b8', fontSize: 12, fontFamily: "'DM Mono',monospace" }}>
                                                                {String(indexOfFirstRecord + idx + 1).padStart(2, '0')}
                                                            </td>
                                                            <td className="ay-td">
                                                                <span className="term-bdg">
                                                                    <span className="term-bdg-dot"></span>
                                                                    Term {rec.term}
                                                                </span>
                                                            </td>
                                                            <td className="ay-td">
                                                                <span className="yr-mono">{rec.year}</span>
                                                            </td>
                                                            <td className="ay-td">
                                                                <span className="month-range">
                                                                    <i className="bi bi-calendar-event" style={{ color: '#198754' }}></i>
                                                                    {rec.begin_month}
                                                                    <span className="month-arrow">→</span>
                                                                    {rec.end_month}
                                                                </span>
                                                            </td>
                                                            <td className="ay-td">
                                                                <StatusBadge status={rec.status} />
                                                            </td>
                                                            <td className="ay-td">
                                                                <div className="row-act-btns">
                                                                    <button className="icon-btn" title="Edit" onClick={() => handleEdit(rec)}>
                                                                        <i className="bi bi-pencil-fill"></i>
                                                                    </button>
                                                                    <button className="icon-btn danger" title="Delete" onClick={() => handleDeleteConfirm(rec.id)}>
                                                                        <i className="bi bi-trash-fill"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* ─── PAGINATION ─── */}
                                        {totalPages > 1 && (
                                            <div className="ay-pagination">
                                                <button
                                                    className="ay-pag-btn"
                                                    disabled={currentPage === 1}
                                                    onClick={handlePrevPage}
                                                >
                                                    <i className="bi bi-chevron-left"></i> Prev
                                                </button>
                                                <span className="ay-pag-info">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    className="ay-pag-btn"
                                                    disabled={indexOfLastRecord >= records.length}
                                                    onClick={handleNextPage}
                                                >
                                                    Next <i className="bi bi-chevron-right"></i>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {/* ──────────────── FORM TAB ──────────────── */}
                    {activeTab === 'form' && (
                        <div className="ay-card">
                            <div className="ay-card-header">
                                <div className="ay-card-header-icon">
                                    <i className={`bi ${editId ? 'bi-pencil-fill' : 'bi-plus-lg'}`}></i>
                                </div>
                                <div>
                                    <div className="ay-card-title">{editId ? "Edit Academic Year Record" : "Add New Academic Year Record"}</div>
                                    <div className="ay-card-sub">Select a term, beginning month, end month and year</div>
                                </div>
                            </div>

                            <div className="ay-card-body">

                                {/* ── Term Pill Selector ── */}
                                <div className="f-col" style={{ marginBottom: 22 }}>
                                    <label className="lbl">Select Term</label>
                                    <div className="term-pills">
                                        {TERMS.map(t => (
                                            <button
                                                key={t.value}
                                                className={`term-pill ${form.term === t.value ? 'active' : ''}`}
                                                onClick={() => setField('term', t.value)}
                                                type="button"
                                            >
                                                <span className="term-pill-num">{t.value}</span>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    {formErrors.term && (
                                        <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                                            <i className="bi bi-exclamation-circle-fill"></i> {formErrors.term}
                                        </span>
                                    )}
                                </div>

                                {/* ── Year, Begin Month, End Month ── */}
                                <div className="ay-form-grid">

                                    {/* Year */}
                                    <div className="f-col">
                                        <label className="lbl">Academic Year</label>
                                        <div className="sel-wrap">
                                            <select
                                                className="sel"
                                                value={form.year}
                                                onChange={e => setField('year', e.target.value)}
                                            >
                                                <option value="">Select Year…</option>
                                                {YEAR_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        {formErrors.year && (
                                            <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                                                <i className="bi bi-exclamation-circle-fill"></i> {formErrors.year}
                                            </span>
                                        )}
                                    </div>

                                    {/* Beginning Month */}
                                    <div className="f-col">
                                        <label className="lbl">Beginning Month</label>
                                        <div className="sel-wrap">
                                            <select
                                                className="sel"
                                                value={form.begin_month}
                                                onChange={e => setField('begin_month', e.target.value)}
                                            >
                                                <option value="">Select Month…</option>
                                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        {formErrors.begin_month && (
                                            <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                                                <i className="bi bi-exclamation-circle-fill"></i> {formErrors.begin_month}
                                            </span>
                                        )}
                                    </div>

                                    {/* End Month */}
                                    <div className="f-col">
                                        <label className="lbl">End Month</label>
                                        <div className="sel-wrap">
                                            <select
                                                className="sel"
                                                value={form.end_month}
                                                onChange={e => setField('end_month', e.target.value)}
                                            >
                                                <option value="">Select Month…</option>
                                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        {formErrors.end_month && (
                                            <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                                                <i className="bi bi-exclamation-circle-fill"></i> {formErrors.end_month}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Preview strip */}
                                {(form.term && form.year && form.begin_month && form.end_month) && (
                                    <div style={{
                                        marginTop: 22, padding: '14px 18px',
                                        background: '#ebfbee',
                                        border: '1.5px solid #a3cfbb',
                                        borderRadius: 12,
                                        display: 'flex', alignItems: 'center', gap: 12
                                    }}>
                                        <i className="bi bi-eye-fill" style={{ color: '#198754', fontSize: 16 }}></i>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f5132' }}>
                                            Preview:&nbsp;
                                        </span>
                                        <span style={{ fontSize: 13, color: '#1e3a5f' }}>
                                            Term {form.term} · {form.year} · {form.begin_month} → {form.end_month}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="ay-form-actions">
                                <button className="btn-sec" onClick={handleCancel}>
                                    <i className="bi bi-x-lg"></i> Cancel
                                </button>
                                <button className="btn-prim" onClick={handleSubmit} disabled={saving}>
                                    {saving
                                        ? <><i className="bi bi-hourglass-split"></i> Saving…</>
                                        : <><i className={`bi ${editId ? 'bi-check-lg' : 'bi-plus-lg'}`}></i> {editId ? "Update Record" : "Create Record"}</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}