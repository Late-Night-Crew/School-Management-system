import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ToastNote from "../../components/ToastNote";

// ─── NAV SECTIONS ─────────────────────────────────────────────────────────────
const NAV = [
  { id: "profile",       icon: "bi-person-circle",              label: "My Profile" },
  { id: "school",        icon: "bi-building",                   label: "School Info" },
  { id: "marks",         icon: "bi-grid-3x3-gap",               label: "Marks & Grades" },
];

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="sxp-section-header">
      <div className="sxp-section-header__icon">
        <i className={`bi ${icon}`}></i>
      </div>
      <div>
        <h2 className="sxp-section-header__title">{title}</h2>
        {subtitle && <p className="sxp-section-header__sub">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return <div className={`sxp-card ${className}`}>{children}</div>;
}

function CardHead({ title, subtitle, action }) {
  return (
    <div className="sxp-card__head">
      <div>
        <div className="sxp-card__title">{title}</div>
        {subtitle && <div className="sxp-card__sub">{subtitle}</div>}
      </div>
      {action && <div className="sxp-card__action">{action}</div>}
    </div>
  );
}

function CardBody({ children }) {
  return <div className="sxp-card__body">{children}</div>;
}

// ─── FIELD ────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="sxp-field">
      <label className="sxp-field__label">{label}</label>
      {children}
      {hint && <p className="sxp-field__hint">{hint}</p>}
    </div>
  );
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
function Input({ type = "text", value, placeholder, readOnly }) {
  return (
    <input
      type={type}
      className={`sxp-input${readOnly ? " sxp-input--readonly" : ""}`}
      value={value}
      placeholder={placeholder}
      readOnly={readOnly}
    />
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SchoolSettings() {
  const { schoolId } = useParams();
  const [activeSection, setActiveSection] = useState("profile");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  // ── Profile ──────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState({
    displayName: "Sarah Mitchell",
    username: "sarah.manager",
    phone: "+265 999 123 456",
    email: "sarah.mitchell@greenvalley.edu",
    role: "School Manager",
  });

  // ── School Info ──────────────────────────────────────────────────────────────
  const [schoolInfo] = useState({
    name: "Green Valley High School",
    code: "GVH-2024",
    district: "Lilongwe Urban",
    division: "Zone 3",
    address: "P.O Box 101, Lilongwe",
    phone: "+265 01 123 456",
    email: "info@greenvalley.edu",
    type: "Secondary",
    capacity: "1500",
  });

  // ── Marks & Grades ────────────────────────────────────────────────────────────
  const [marksConfig, setMarksConfig] = useState({
    markingScheme: "percentage",
    passMarkPercent: "50", 
    gradeA: "90",
    gradeB: "80",
    gradeC: "70",
    gradeD: "50", // Pass starts at 50
    gradeF: "0",  // Fail is below 50
  });

  // ── Fetch Grading Config from Database ────────────────────────────────────────
  useEffect(() => {
    // Simulating fetching grading thresholds created in Admin settings
    const fetchGradingScheme = async () => {
        try {
          
            const mockDbResponse = {
                gradeA: "90",
                gradeB: "80",
                gradeC: "70",
                gradeD: "50", 
                gradeF: "0",
                passMarkPercent: "50",
                markingScheme: "percentage"
            };

            // Artificial delay to mimic network request
            setTimeout(() => {
                setMarksConfig(prev => ({
                    ...prev,
                    ...mockDbResponse
                }));
            }, 500);

        } catch (error) {
            console.error("Failed to fetch grading scheme", error);
        }
    };

    fetchGradingScheme();
  }, [schoolId]);

  const GRADE_THRESHOLDS = [
    { key: "gradeA", label: "Grade A  (Excellent)" },
    { key: "gradeB", label: "Grade B (Very Good)" },
    { key: "gradeC", label: "Grade C (Good)" },
    { key: "gradeD", label: "Grade D (Pass)" },
    { key: "gradeF", label: "Grade F (Fail)" }, 
  ];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastNote
        show={toast.show}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
        message={toast.message}
        variant={toast.variant}
      />

      <div className="sxp-shell">

        {/* ── SIDEBAR NAV ── */}
        <aside className="sxp-sidebar">
          <div className="sxp-sidebar__brand">
            <div className="sxp-sidebar__logo">
              <i className="bi bi-gear-wide-connected"></i>
            </div>
            <div>
              <p className="sxp-sidebar__appname">Settings</p>
              <p className="sxp-sidebar__schoolid">School #{schoolId || "—"}</p>
            </div>
          </div>

          <nav className="sxp-sidebar__nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`sxp-navitem${activeSection === item.id ? " sxp-navitem--active" : ""}`}
                onClick={() => setActiveSection(item.id)}
              >
                <i className={`bi ${item.icon} sxp-navitem__icon`}></i>
                <span className="sxp-navitem__label">{item.label}</span>
                {activeSection === item.id && <span className="sxp-navitem__bar"></span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="sxp-main">
          <div className="sxp-content">

            {/* ════════════════ MY PROFILE ════════════════ */}
            {activeSection === "profile" && (
              <div className="sxp-section sxp-fade-in">
                <SectionHeader icon="bi-person-circle" title="My Profile" subtitle="Your personal account information." />

                <Card>
                  <CardHead title="Account Identity" />
                  <CardBody>
                    <div className="sxp-profile-hero">
                      <div className="sxp-avatar-xl">
                        {profile.displayName.split(" ").map((n) => n[0]).join("")}
                        <span className="sxp-avatar-xl__ring"></span>
                      </div>
                      <div className="sxp-profile-hero__info">
                        <p className="sxp-profile-hero__name">{profile.displayName}</p>
                        <span className="sxp-tag sxp-tag--primary">{profile.role}</span>
                      </div>
                    </div>

                    <div className="sxp-grid sxp-grid--2">
                      <Field label="Display Name">
                        <Input value={profile.displayName} readOnly />
                      </Field>
                      <Field label="Username">
                        <Input value={profile.username} readOnly />
                      </Field>
                      <Field label="Phone Number">
                        <Input type="tel" value={profile.phone} readOnly />
                      </Field>
                      <Field label="Email Address">
                        <Input type="email" value={profile.email} readOnly />
                      </Field>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ════════════════ SCHOOL INFO ════════════════ */}
            {activeSection === "school" && (
              <div className="sxp-section sxp-fade-in">
                <SectionHeader icon="bi-building" title="School Information" subtitle="Official school details." />

                <div className="sxp-info-banner">
                  <i className="bi bi-lock-fill"></i>
                  These fields are read-only and managed by the Regional Administrator.
                </div>

                <Card>
                  <CardHead title="Official Details" />
                  <CardBody>
                    <div className="sxp-grid sxp-grid--2">
                      {[
                        { label: "School Name",     value: schoolInfo.name },
                        { label: "School Code",     value: schoolInfo.code },
                        { label: "District",        value: schoolInfo.district },
                        { label: "Division / Zone", value: schoolInfo.division },
                        { label: "Address",         value: schoolInfo.address },
                        { label: "Phone",           value: schoolInfo.phone },
                        { label: "Email",           value: schoolInfo.email },
                        { label: "School Type",     value: schoolInfo.type },
                        { label: "Capacity",        value: schoolInfo.capacity + " students" },
                      ].map(({ label, value }) => (
                        <Field key={label} label={label}>
                          <Input value={value} readOnly />
                        </Field>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ════════════════ MARKS & GRADES ════════════════ */}
            {activeSection === "marks" && (
              <div className="sxp-section sxp-fade-in">
                <SectionHeader icon="bi-grid-3x3-gap" title="Marks & Grades Settings" subtitle="Grading thresholds managed by the Administrator." />

                <Card>
                  <CardHead title="Grading Scale" subtitle="Grading policy: Scores below 50% are considered Fail (Grade F)." />
                  <CardBody>
                    <div className="sxp-grid sxp-grid--2">
                      <Field label="Pass Mark (%)">
                        <Input type="number" value={marksConfig.passMarkPercent} readOnly />
                      </Field>
                      <Field label="Marking Scheme">
                        <div className="sxp-select-wrap">
                            <select className="sxp-select sxp-input--readonly" value={marksConfig.markingScheme} disabled>
                                <option value="percentage">Percentage (0–100)</option>
                            </select>
                            <i className="bi bi-chevron-down sxp-select-chevron"></i>
                        </div>
                      </Field>
                    </div>

                    <div className="sxp-grade-grid">
                      {GRADE_THRESHOLDS.map(({ key, label }) => (
                        <div key={key} className="sxp-grade-row">
                          <div className={`sxp-grade-badge sxp-grade-badge--${key.replace("grade","").toLowerCase()}`}>
                            {key.replace("grade", "")}
                          </div>
                          <span className="sxp-grade-row__label">{label}</span>
                          <div className="sxp-grade-row__input">
                            <Input
                              type="number"
                              value={marksConfig[key]}
                              readOnly
                            />
                            <span className="sxp-grade-row__unit">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}