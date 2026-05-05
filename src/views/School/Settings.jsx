import React, { useState } from "react";
import { useParams } from "react-router-dom";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* SCOPED STYLING TO PREVENT GLOBAL CONFLICTS */
/* All classes prefixed with .ss- */

.ss-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: #F3F4F6;
  min-height: 100vh;
  color: #1e293b;
  padding: 2rem;
}

.ss-container {
  max-width: 900px;
  margin: 0 auto;
}

.ss-card {
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 2.5rem;
  margin-bottom: 2rem;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* HEADER */
.ss-header {
  margin-bottom: 2rem;
}

.ss-header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.025em;
}

.ss-header p {
  color: #64748b;
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
}

/* PROFILE SECTION SPECIFIC */
.ss-profile-layout {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.ss-avatar-large {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  font-weight: 800;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
  flex-shrink: 0;
}

.ss-profile-info {
  flex-grow: 1;
}

.ss-profile-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.ss-profile-role {
  display: inline-block;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

/* FORMS & READ ONLY GRID */
.ss-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.ss-form-group {
  margin-bottom: 1.5rem;
}

.ss-label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.ss-input, .ss-select {
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

.ss-input:focus, .ss-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.ss-input:disabled, .ss-select:disabled {
  background-color: #f8fafc;
  color: #94a3b8;
  border-color: #e2e8f0;
  cursor: not-allowed;
  font-weight: 500;
}

/* TOGGLES */
.ss-setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  border: 1px solid #f1f5f9;
  border-radius: 0.75rem;
  background: #fff;
  transition: all 0.2s;
}

.ss-setting-row:hover {
  border-color: #cbd5e1;
}

.ss-setting-info h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.ss-setting-info p {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.ss-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
}

.ss-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.ss-slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e2e8f0;
  transition: .4s;
  border-radius: 34px;
}

.ss-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.ss-switch input:checked + .ss-slider {
  background-color: #2563eb;
}

.ss-switch input:checked + .ss-slider:before {
  transform: translateX(22px);
}

/* SECTION HEADERS */
.ss-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ss-section-title i {
  color: #2563eb;
  font-size: 1.25rem;
}

/* BUTTON */
.ss-btn-save {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 0.75rem 2.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
}

.ss-btn-save:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}
`;

const SchoolSettings = () => {
    const { schoolId } = useParams();
    
    // My Profile State
    const [profile, setProfile] = useState({
        displayName: "Sarah Mitchell",
        username: "sarah.manager",
        phone: "+1 (555) 987-6543",
        email: "sarah.mitchell@greenvalley.edu"
    });

    // General Settings (Read Only)
    const [schoolInfo, setSchoolInfo] = useState({
        schoolName: "Green Valley High",
        schoolCode: "GVH-2024",
        district: "Lilongwe Urban",
        division: "Zone 3"
    });

    // System Settings
    const [systemConfig, setSystemConfig] = useState({
        smsAlerts: true,
        transferAlerts: true, // Added Transfer Alerts
        logoutTime: "30"
    });

    const handleSave = () => {
        console.log("Saving settings...", { profile, schoolInfo, systemConfig });
        alert("Settings saved successfully!");
    };

    return (
        <>
            <style>{CSS}</style>
            <div className="ss-wrapper">
                <div className="ss-container">
                    
                    {/* Header */}
                    <div className="ss-header">
                        <h1>School Manager Settings</h1>
                        <p>Manage your profile, school configuration, and system access.</p>
                    </div>

                    {/* SECTION 1: MY PROFILE */}
                    <div className="ss-card">
                        <div className="ss-section-title">
                            <i className="bi bi-person-circle"></i> My Profile
                        </div>
                        <div className="ss-profile-layout">
                            <div className="ss-avatar-large">
                                {profile.displayName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="ss-profile-info">
                                <h2 className="ss-profile-name">{profile.displayName}</h2>
                                <span className="ss-profile-role">School Manager</span>
                                
                                <div className="ss-grid-2">
                                    <div className="ss-form-group">
                                        <label className="ss-label">Username</label>
                                        <input type="text" className="ss-input" value={profile.username} disabled />
                                    </div>
                                    <div className="ss-form-group">
                                        <label className="ss-label">Phone Number</label>
                                        <input type="tel" className="ss-input" value={profile.phone} disabled />
                                    </div>
                                    <div className="ss-form-group" style={{ gridColumn: "1 / -1" }}>
                                        <label className="ss-label">Email Address</label>
                                        <input type="email" className="ss-input" value={profile.email} disabled />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: GENERAL SCHOOL SETTINGS */}
                    <div className="ss-card">
                        <div className="ss-section-title">
                            <i className="bi bi-building"></i> General School Information
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            School details are managed by the system administrator.
                        </p>
                        <div className="ss-grid-2">
                            <div className="ss-form-group">
                                <label className="ss-label">School Name</label>
                                <input type="text" className="ss-input" value={schoolInfo.schoolName} disabled />
                            </div>
                            <div className="ss-form-group">
                                <label className="ss-label">School Code</label>
                                <input type="text" className="ss-input" value={schoolInfo.schoolCode} disabled />
                            </div>
                            <div className="ss-form-group">
                                <label className="ss-label">District</label>
                                <input type="text" className="ss-input" value={schoolInfo.district} disabled />
                            </div>
                            <div className="ss-form-group">
                                <label className="ss-label">Division</label>
                                <input type="text" className="ss-input" value={schoolInfo.division} disabled />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: SYSTEM CONFIGURATION */}
                    <div className="ss-card">
                        <div className="ss-section-title">
                            <i className="bi bi-gear"></i> System Configuration
                        </div>
                        
                        <div className="ss-grid-2">
                            <div>
                                <label className="ss-label" style={{ marginBottom: '0.5rem' }}>Auto-Logout Timer</label>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>System logs out inactive users after this duration.</p>
                                <select 
                                    className="ss-select"
                                    value={systemConfig.logoutTime}
                                    onChange={e => setSystemConfig({...systemConfig, logoutTime: e.target.value})}
                                >
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                    <option value="60">1 Hour</option>
                                    <option value="0">Never</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                                <div className="ss-setting-row" style={{ padding: '0.75rem', marginBottom: 0 }}>
                                    <div className="ss-setting-info">
                                        <h4 style={{ fontSize: '0.9rem' }}>SMS Alerts</h4>
                                    </div>
                                    <label className="ss-switch">
                                        <input type="checkbox" checked={systemConfig.smsAlerts} onChange={() => setSystemConfig({...systemConfig, smsAlerts: !systemConfig.smsAlerts})} />
                                        <span className="ss-slider"></span>
                                    </label>
                                </div>
                                <div className="ss-setting-row" style={{ padding: '0.75rem', marginBottom: 0 }}>
                                    <div className="ss-setting-info">
                                        <h4 style={{ fontSize: '0.9rem' }}>Transfer Alerts</h4>
                                    </div>
                                    <label className="ss-switch">
                                        <input type="checkbox" checked={systemConfig.transferAlerts} onChange={() => setSystemConfig({...systemConfig, transferAlerts: !systemConfig.transferAlerts})} />
                                        <span className="ss-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <button className="ss-btn-save" onClick={handleSave}>
                                <i className="bi bi-check-lg"></i> Save All Changes
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default SchoolSettings;