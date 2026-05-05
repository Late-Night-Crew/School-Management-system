import React, { useState, useEffect } from "react";
import { AUTH_TOKEN_KEY } from "../constants/storageKeys";

// ─── MOCK DATA (replace with API calls) ───────────────────────────────────────
const MOCK_ACADEMIC_YEARS = [
    { id: 1, year: "2023", term: 1, begin_month: "January",  end_month: "April",  status: "completed" },
    { id: 2, year: "2023", term: 2, begin_month: "May",      end_month: "August", status: "completed" },
    { id: 3, year: "2024", term: 1, begin_month: "January",  end_month: "April",  status: "active"    },
    { id: 4, year: "2024", term: 2, begin_month: "May",      end_month: "August", status: "upcoming"  },
    { id: 5, year: "2024", term: 3, begin_month: "September",end_month: "December",status: "upcoming" },
];

const MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
];

const TERMS = [
    { value: 1, label: "Term 1" },
    { value: 2, label: "Term 2" },
    { value: 3, label: "Term 3" },
];

const YEAR_RANGE = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() + i));

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ay-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #eef1f7;
  min-height: 100vh;
  color: #1a1d2e;
  display: flex;
  flex-direction: column;
}

/* ── HEADER ── */
.ay-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2563a8 55%, #3b82c4 100%);
  padding: 26px 36px;
  display: flex;
  align-items: center;
  gap: 18px;
  flex-shrink: 0;
}
.ay-header-icon {
  width: 52px; height: 52px; border-radius: 15px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #fff; flex-shrink: 0;
}
.ay-header-text h2 { font-size: 21px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.ay-header-sub { font-size: 12.5px; color: rgba(255,255,255,0.6); margin-top: 3px; }

/* ── TABS ── */
.ay-tabs-bar { padding: 20px 36px 0; }
.ay-tabs {
  display: inline-flex; gap: 4px;
  background: #fff; border-radius: 50px;
  padding: 5px; box-shadow: 0 2px 14px rgba(0,0,0,0.09);
}
.ay-tab {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 22px; border-radius: 50px; border: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 600; color: #6b7280;
  background: transparent; cursor: pointer;
  transition: all 0.22s ease; white-space: nowrap;
}
.ay-tab:hover { color: #374151; }
.ay-tab.active {
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  color: #fff; box-shadow: 0 4px 14px rgba(37,99,168,0.38);
}

/* ── BODY ── */
.ay-body { padding: 24px 36px; flex-grow: 1; display: flex; flex-direction: column; gap: 20px; }

/* ── FORM CARD ── */
.ay-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
.ay-card-header {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex; align-items: center; gap: 12px;
}
.ay-card-header-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 15px; flex-shrink: 0;
}
.ay-card-title { font-size: 15px; font-weight: 800; color: #111827; }
.ay-card-sub { font-size: 12px; color: #6b7280; font-weight: 500; margin-top: 2px; }
.ay-card-body { padding: 24px; }

/* ── FORM GRID ── */
.ay-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
}
.f-col { display: flex; flex-direction: column; gap: 6px; }
.lbl {
  font-size: 10.5px; font-weight: 700; letter-spacing: 0.7px;
  text-transform: uppercase; color: #9ca3af;
}
.sel, .inp {
  background: #fff; border: 1.5px solid #e2e8f0;
  border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 600; color: #1a1d2e;
  padding: 12px 16px; outline: none; width: 100%;
  transition: all 0.18s; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  appearance: none; -webkit-appearance: none;
}
.sel:hover { background: #eff6ff; color: #2563a8; border-color: #93c5fd; }
.sel:focus, .inp:focus {
  background: #fff; border-color: #2563a8;
  box-shadow: 0 0 0 4px rgba(37,99,168,0.15);
}
.sel-wrap { position: relative; }
.sel-wrap::after {
  content: '▼'; position: absolute; right: 14px; top: 50%;
  transform: translateY(-50%); color: #2563a8;
  pointer-events: none; font-size: 11px; font-weight: bold;
}

/* Term Pill Selector */
.term-pills { display: flex; gap: 10px; flex-wrap: wrap; }
.term-pill {
  flex: 1; min-width: 80px;
  padding: 12px 10px; border-radius: 12px; border: 1.5px solid #e2e8f0;
  background: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 700; color: #6b7280;
  cursor: pointer; transition: all 0.2s; text-align: center;
}
.term-pill:hover { border-color: #93c5fd; color: #2563a8; background: #eff6ff; }
.term-pill.active {
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  border-color: #2563a8; color: #fff;
  box-shadow: 0 4px 14px rgba(37,99,168,0.32);
}
.term-pill-num {
  font-family: 'DM Mono', monospace;
  font-size: 22px; font-weight: 500; display: block; margin-bottom: 2px;
}

/* ── FORM ACTIONS ── */
.ay-form-actions {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #f1f5f9;
}
.btn-prim {
  display: inline-flex; align-items: center; gap: 7px;
  background: linear-gradient(135deg, #1e3a5f, #2563a8);
  color: #fff; border: none; border-radius: 10px;
  padding: 11px 22px; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,168,0.3);
}
.btn-prim:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(37,99,168,0.42); }
.btn-prim:active { transform: translateY(0); }
.btn-prim:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
.btn-sec {
  display: inline-flex; align-items: center; gap: 7px;
  background: #fff; color: #374151;
  border: 1.5px solid #e2e8f0; border-radius: 10px;
  padding: 11px 22px; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.btn-sec:hover { background: #f8fafc; border-color: #cbd5e1; }

/* ── TABLE ── */
.table-container {
  background: #fff; border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  overflow: auto; border: 1px solid #e5e7eb;
}
.ay-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.ay-th {
  background: #f8fafc; padding: 14px 16px;
  font-size: 11px; font-weight: 800; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.5px;
  white-space: nowrap; border-bottom: 2px solid #e5e7eb;
  text-align: left;
}
.ay-td {
  padding: 14px 16px; font-size: 13px; color: #374151;
  border-bottom: 1px solid #f1f5f9; white-space: nowrap;
}
tr:last-child .ay-td { border-bottom: none; }
tr:hover .ay-td { background: #fafbff; }

/* Term badge */
.term-bdg {
  display: inline-flex; align-items: center; gap: 6px;
  background: #eff6ff; color: #1e40af;
  font-weight: 700; font-size: 12px; padding: 4px 12px;
  border-radius: 20px;
}
.term-bdg-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #2563a8; flex-shrink: 0;
}

/* Year mono */
.yr-mono {
  font-family: 'DM Mono', monospace; font-size: 13px;
  font-weight: 500; color: #1a1d2e;
}

/* Month range */
.month-range {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; color: #374151;
}
.month-arrow { color: #94a3b8; }

/* Status badge */
.status-bdg {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
}
.status-active   { background: #dcfce7; color: #15803d; }
.status-completed{ background: #f1f5f9; color: #64748b; }
.status-upcoming { background: #fef9c3; color: #a16207; }

/* ── ROW ACTIONS ── */
.row-act-btns { display: flex; gap: 6px; }
.icon-btn {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid #e5e7eb; background: #fff; color: #374151;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; transition: all 0.18s;
}
.icon-btn:hover { background: #eff6ff; color: #2563a8; border-color: #93c5fd; }
.icon-btn.danger:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }

/* ── EMPTY STATE ── */
.ay-empty {
  text-align: center; padding: 60px 20px; color: #94a3b8;
}
.ay-empty i { font-size: 48px; opacity: 0.35; display: block; margin-bottom: 16px; }
.ay-empty h3 { font-size: 17px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
.ay-empty p { font-size: 13px; }

/* ── TOAST ── */
.ay-toast-wrap {
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.ay-toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; border-radius: 12px; min-width: 260px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.12); font-size: 13px; font-weight: 600;
  pointer-events: all; animation: toastIn 0.28s cubic-bezier(.34,1.56,.64,1) both;
}
.ay-toast.success { background: #fff; border-left: 4px solid #22c55e; color: #15803d; }
.ay-toast.danger  { background: #fff; border-left: 4px solid #ef4444; color: #dc2626; }
.ay-toast.info    { background: #fff; border-left: 4px solid #2563a8; color: #1e40af; }
.ay-toast-close {
  margin-left: auto; background: none; border: none;
  font-size: 16px; cursor: pointer; color: inherit; opacity: 0.5;
  line-height: 1;
}
.ay-toast-close:hover { opacity: 1; }
@keyframes toastIn { from { opacity:0; transform: translateX(24px); } to { opacity:1; transform: translateX(0); } }

/* ── CONFIRM MODAL ── */
.ay-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.45);
  z-index: 9000; display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.18s ease both;
}
.ay-modal {
  background: #fff; border-radius: 20px; padding: 28px;
  width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  animation: scaleIn 0.22s cubic-bezier(.34,1.56,.64,1) both;
}
.ay-modal h3 { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 8px; }
.ay-modal p  { font-size: 13px; color: #6b7280; line-height: 1.6; margin-bottom: 20px; }
.ay-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
@keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
@keyframes scaleIn { from { opacity:0; transform: scale(0.92); } to { opacity:1; transform: scale(1); } }

/* Responsive */
@media (max-width: 768px) {
  .ay-header { padding: 18px 16px; }
  .ay-tabs-bar { padding: 16px 16px 0; }
  .ay-body { padding: 16px; gap: 14px; }
  .ay-form-grid { grid-template-columns: 1fr 1fr; }
  .ay-card-body { padding: 16px; }
  .ay-form-actions { flex-direction: column; }
  .btn-prim, .btn-sec { width: 100%; justify-content: center; }
}
@media (max-width: 480px) {
  .ay-form-grid { grid-template-columns: 1fr; }
  .term-pills { flex-direction: column; }
}
`;

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
    const [activeTab, setActiveTab] = useState("list");
    const [records, setRecords]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [saving,  setSaving]      = useState(false);
    const [editId,  setEditId]      = useState(null);
    const [confirm, setConfirm]     = useState(null); // { id }
    const [toasts,  setToasts]      = useState([]);

    // Form state
    const EMPTY_FORM = { term: null, year: "", begin_month: "", end_month: "" };
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});

    // ── Toasts ──────────────────────────────────────────────────────────────
    const pushToast = (message, variant = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, variant }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    // ── Data Fetch ───────────────────────────────────────────────────────────
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setRecords(MOCK_ACADEMIC_YEARS);
            setLoading(false);
        }, 600);
    }, []);

    // ── Validation ───────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!form.term)        errs.term        = "Select a term.";
        if (!form.year)        errs.year        = "Select a year.";
        if (!form.begin_month) errs.begin_month = "Select beginning month.";
        if (!form.end_month)   errs.end_month   = "Select end month.";
        if (form.begin_month && form.end_month) {
            const bi = MONTHS.indexOf(form.begin_month);
            const ei = MONTHS.indexOf(form.end_month);
            if (ei <= bi) errs.end_month = "End month must be after beginning month.";
        }
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit (Create / Update) ─────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        await new Promise(r => setTimeout(r, 500)); // simulate API

        if (editId) {
            setRecords(prev => prev.map(r =>
                r.id === editId
                    ? { ...r, term: form.term, year: form.year, begin_month: form.begin_month, end_month: form.end_month }
                    : r
            ));
            pushToast(`Term ${form.term} — ${form.year} updated successfully!`, "success");
        } else {
            const newRecord = {
                id: Date.now(),
                term: form.term,
                year: form.year,
                begin_month: form.begin_month,
                end_month: form.end_month,
                status: "upcoming",
            };
            setRecords(prev => [...prev, newRecord]);
            pushToast(`Term ${form.term} — ${form.year} created successfully!`, "success");
        }

        setSaving(false);
        resetForm();
        setActiveTab("list");
    };

    // ── Edit ─────────────────────────────────────────────────────────────────
    const handleEdit = (rec) => {
        setEditId(rec.id);
        setForm({ term: rec.term, year: rec.year, begin_month: rec.begin_month, end_month: rec.end_month });
        setFormErrors({});
        setActiveTab("form");
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDeleteConfirm = (id) => setConfirm({ id });
    const handleDeleteExecute = async () => {
        await new Promise(r => setTimeout(r, 300));
        setRecords(prev => prev.filter(r => r.id !== confirm.id));
        setConfirm(null);
        pushToast("Academic year record deleted.", "info");
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
            <style>{CSS}</style>

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
                                    { label: 'Total Records', val: records.length, icon: 'bi-stack', color: '#2563a8' },
                                    { label: 'Active Term',   val: records.filter(r => r.status === 'active').length,    icon: 'bi-play-circle-fill', color: '#15803d' },
                                    { label: 'Upcoming',      val: records.filter(r => r.status === 'upcoming').length,  icon: 'bi-clock-fill',       color: '#a16207' },
                                    { label: 'Completed',     val: records.filter(r => r.status === 'completed').length, icon: 'bi-check-circle-fill',color: '#64748b' },
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
                                                {records.map((rec, idx) => (
                                                    <tr key={rec.id}>
                                                        <td className="ay-td" style={{ color: '#94a3b8', fontSize: 12, fontFamily: "'DM Mono',monospace" }}>
                                                            {String(idx + 1).padStart(2, '0')}
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
                                                                <i className="bi bi-calendar-event" style={{ color: '#2563a8' }}></i>
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
                                        marginTop: 22, padding: '14px 18px', background: '#eff6ff',
                                        border: '1.5px solid #bfdbfe', borderRadius: 12,
                                        display: 'flex', alignItems: 'center', gap: 12
                                    }}>
                                        <i className="bi bi-eye-fill" style={{ color: '#2563a8', fontSize: 16 }}></i>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
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