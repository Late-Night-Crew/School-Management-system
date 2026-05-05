import React from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* SCOPED STYLING */
/* All classes prefixed with .sd- */

.sd-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background-color: #F3F4F6;
  min-height: 100vh;
  color: #1e293b;
  padding: 2rem;
}

.sd-container {
  max-width: 1300px;
  margin: 0 auto;
}

/* HEADER */
.sd-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.sd-title h1 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.025em;
}

.sd-title p {
  color: #64748b;
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
}

.sd-badge {
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* KPI GRID */
.sd-grid-4 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* CARDS */
.sd-card {
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(226, 232, 240, 0.8);
  padding: 1.25rem; /* Reduced from 1.5rem */
  transition: transform 0.2s;
  position: relative;
  overflow: hidden;
}

.sd-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.sd-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem; /* Reduced from 1rem */
}

.sd-icon-box {
  width: 34px; /* Reduced from 40px */
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem; /* Reduced from 1.25rem */
}

.icon-blue { background: #eff6ff; color: #2563eb; }
.icon-green { background: #dcfce7; color: #16a34a; }
.icon-purple { background: #f3e8ff; color: #9333ea; }
.icon-orange { background: #ffedd5; color: #c2410c; }

.sd-label {
  font-size: 0.75rem; /* Reduced from 0.8rem */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  font-weight: 700;
  margin-bottom: 0.25rem; /* Reduced from 0.5rem */
}

.sd-main-value {
  font-size: 1.8rem; /* Reduced from 2rem */
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  margin-bottom: 0.75rem; /* Reduced from 1rem */
}

/* COMPACT BREAKDOWN ROWS (One Line) */
.sd-breakdown {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem; /* Reduced from 1rem */
  padding-top: 0.75rem; /* Reduced from 1rem */
  border-top: 1px solid #f1f5f9;
}

.sd-stat-item {
  display: flex;
  align-items: center;
  gap: 0.3rem; /* Reduced from 0.4rem */
  font-size: 0.8rem; /* Reduced from 0.85rem */
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
}

.sd-stat-item i {
  font-size: 0.9rem; /* Reduced from 1rem */
}

/* Text Colors for specificity */
.text-male { color: #2563eb; }
.text-female { color: #db2777; }
.text-disabled { color: #71717a; }
.text-inbound { color: #16a34a; }
.text-outbound { color: #ea580c; }
.text-pending { color: #d97706; }

.text-arrow { color: #94a3b8; font-size: 0.9rem; margin: 0 0.5rem; }

/* CHARTS SECTION */
.sd-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.sd-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* CSS PIE CHART */
.sd-pie-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 2rem;
}

.sd-pie-chart {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: conic-gradient(
    #2563eb 0% 60%, 
    #ec4899 60% 98%, 
    #94a3b8 98% 100%
  );
  position: relative;
}

/* Inner donut hole */
.sd-pie-chart::after {
  content: "";
  position: absolute;
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.sd-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sd-legend-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #475569;
}

.sd-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

/* BOTTOM GRID */
.sd-bottom-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .sd-bottom-grid { grid-template-columns: 1fr; }
}

/* LISTS */
.sd-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sd-list-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0; /* Reduced padding */
  border-bottom: 1px solid #f1f5f9;
}

.sd-list-item:last-child {
  border-bottom: none;
}

.sd-list-icon {
  width: 32px; /* Reduced */
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem; /* Reduced */
  font-size: 1rem;
  flex-shrink: 0;
}

.sd-list-content h4 {
  margin: 0;
  font-size: 0.9rem; /* Reduced */
  font-weight: 600;
  color: #0f172a;
}

.sd-list-content p {
  margin: 0.2rem 0 0 0;
  font-size: 0.75rem; /* Reduced */
  color: #64748b;
}

/* QUICK ACTIONS */
.sd-action-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem; /* Reduced */
  margin-bottom: 0.5rem; /* Reduced */
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.sd-action-btn:hover {
  border-color: #2563eb;
  background: #eff6ff;
}

.sd-action-btn div {
  font-weight: 600;
  font-size: 0.85rem; /* Reduced */
  color: #334155;
}
`;

const SchoolDashboard = () => {
    return (
        <>
            <style>{CSS}</style>
            <div className="sd-wrapper">
                <div className="sd-container">
                    
                    {/* HEADER */}
                    <div className="sd-header">
                        <div className="sd-title">
                            <h1>School Overview</h1>
                            <p>Welcome back, School Manager. Here is your daily overview.</p>
                        </div>
                        <div className="sd-badge">School Manager Role</div>
                    </div>

                    {/* STATS CARDS GRID */}
                    <div className="sd-grid-4">
                        
                        {/* 1. STUDENT ENROLLMENT (Compact) */}
                        <div className="sd-card">
                            <div className="sd-card-header">
                                <div className="sd-icon-box icon-blue">
                                    <i className="bi bi-people-fill"></i>
                                </div>
                            </div>
                            <div className="sd-label">Total Enrolled</div>
                            <div className="sd-main-value">1,284</div>
                            
                            {/* Compact One Line Stats */}
                            <div className="sd-breakdown">
                                <div className="sd-stat-item">
                                    <i className="bi bi-gender-male text-male"></i>
                                    <span>642</span>
                                </div>
                                <div className="sd-stat-item">
                                    <i className="bi bi-gender-female text-female"></i>
                                    <span>628</span>
                                </div>
                                <div className="sd-stat-item">
                                    <i className="bi bi-person-wheelchair text-disabled"></i>
                                    <span>14</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. TRANSFERS (Compact) */}
                        <div className="sd-card">
                            <div className="sd-card-header">
                                <div className="sd-icon-box icon-purple">
                                    <i className="bi bi-arrow-left-right-circle-fill"></i>
                                </div>
                            </div>
                            <div className="sd-label">Transfer Requests</div>
                            <div className="sd-main-value">5</div>
                            
                            {/* Compact One Line Stats */}
                            <div className="sd-breakdown">
                                <div className="sd-stat-item">
                                    <i className="bi bi-arrow-down-right text-inbound"></i>
                                    <span>Inbound 3</span>
                                </div>
                                <div className="sd-stat-item">
                                    <i className="bi bi-arrow-up-right text-outbound"></i>
                                    <span>Outbound 2</span>
                                </div>
                                <div className="sd-stat-item">
                                    <i className="bi bi-clock text-pending"></i>
                                    <span>Pending 1</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. ACADEMIC YEAR (Compact) */}
                        <div className="sd-card">
                            <div className="sd-card-header">
                                <div className="sd-icon-box icon-green">
                                    <i className="bi bi-calendar-check"></i>
                                </div>
                            </div>
                            <div className="sd-label">Academic Year</div>
                            <div className="sd-main-value" style={{fontSize: '1.4rem'}}>24/25</div> {/* Shortened text */}
                            
                            {/* Compact One Line Stats */}
                            <div className="sd-breakdown">
                                <div className="sd-stat-item">
                                    <span>Jan 10</span>
                                </div>
                                <div className="sd-stat-item">
                                    <i className="bi bi-arrow-right-short text-arrow"></i>
                                </div>
                                <div className="sd-stat-item">
                                    <span>Apr 15</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. PASS RATE (Compact) */}
                        <div className="sd-card">
                            <div className="sd-card-header">
                                <div className="sd-icon-box icon-orange">
                                    <i className="bi bi-pie-chart-fill"></i>
                                </div>
                            </div>
                            <div className="sd-label">Overall Pass Rate</div>
                            <div className="sd-main-value">87%</div>
                            
                            {/* Compact Grid Stats */}
                            <div className="sd-breakdown" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem'}}>
                                <div className="sd-stat-item">F1: 89%</div>
                                <div className="sd-stat-item">F2: 85%</div>
                                <div className="sd-stat-item">F3: 82%</div>
                                <div className="sd-stat-item">F4: 92%</div>
                            </div>
                        </div>

                    </div>

                    {/* ADVANCED CHARTS ROW */}
                    <div className="sd-charts-grid">
                        
                        {/* PIE CHART */}
                        <div className="sd-card">
                            <h3 className="sd-section-title"><i className="bi bi-pie-chart" style={{color: '#2563eb'}}></i> Gender Distribution</h3>
                            <div className="sd-pie-container">
                                <div className="sd-pie-chart"></div>
                                <div className="sd-legend">
                                    <div className="sd-legend-item">
                                        <div className="sd-dot" style={{backgroundColor: '#2563eb'}}></div> Males (50%)
                                    </div>
                                    <div className="sd-legend-item">
                                        <div className="sd-dot" style={{backgroundColor: '#ec4899'}}></div> Females (49%)
                                    </div>
                                    <div className="sd-legend-item">
                                        <div className="sd-dot" style={{backgroundColor: '#94a3b8'}}></div> Special Needs (1%)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ATTENDANCE TREND */}
                        <div className="sd-card">
                            <h3 className="sd-section-title"><i className="bi bi-bar-chart-line" style={{color: '#2563eb'}}></i> Attendance Trend (Term 2)</h3>
                            <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '130px', padding: '0 1rem'}}> {/* Reduced height */}
                                {/* Week 1 */}
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '10%'}}>
                                    <div style={{height: '80%', width: '100%', backgroundColor: '#dbeafe', borderRadius: '4px'}}></div>
                                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>W1</span>
                                </div>
                                {/* Week 2 */}
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '10%'}}>
                                    <div style={{height: '85%', width: '100%', backgroundColor: '#93c5fd', borderRadius: '4px'}}></div>
                                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>W2</span>
                                </div>
                                {/* Week 3 */}
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '10%'}}>
                                    <div style={{height: '75%', width: '100%', backgroundColor: '#60a5fa', borderRadius: '4px'}}></div>
                                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>W3</span>
                                </div>
                                {/* Week 4 */}
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '10%'}}>
                                    <div style={{height: '90%', width: '100%', backgroundColor: '#3b82f6', borderRadius: '4px'}}></div>
                                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>W4</span>
                                </div>
                                {/* Week 5 */}
                                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '10%'}}>
                                    <div style={{height: '82%', width: '100%', backgroundColor: '#93c5fd', borderRadius: '4px'}}></div>
                                    <span style={{fontSize: '0.75rem', color: '#64748b'}}>W5</span>
                                </div>
                            </div>
                            <div style={{marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b'}}>
                                Average attendance: <span style={{fontWeight: '700', color: '#0f172a'}}>84%</span>
                            </div>
                        </div>

                    </div>

                    {/* BOTTOM SECTION */}
                    <div className="sd-bottom-grid">
                        
                        {/* LATEST NOTICES */}
                        <div className="sd-card">
                            <h3 className="sd-section-title"><i className="bi bi-bell" style={{color: '#2563eb'}}></i> Latest Notices</h3>
                            <ul className="sd-list">
                                <li className="sd-list-item">
                                    <div className="sd-list-icon">
                                        <i className="bi bi-calendar-event"></i>
                                    </div>
                                    <div className="sd-list-content">
                                        <h4>Termly performance review scheduled</h4>
                                        <p>Next week Tuesday, 9:00 AM • Staff Room</p>
                                    </div>
                                </li>
                                <li className="sd-list-item">
                                    <div className="sd-list-icon">
                                        <i className="bi bi-house-door"></i>
                                    </div>
                                    <div className="sd-list-content">
                                        <h4>Household outreach update</h4>
                                        <p>Completed for 96% of students in Zone A.</p>
                                    </div>
                                </li>
                                <li className="sd-list-item">
                                    <div className="sd-list-icon">
                                        <i className="bi bi-file-earmark-text"></i>
                                    </div>
                                    <div className="sd-list-content">
                                        <h4>Curriculum Revision Required</h4>
                                        <p>Ministry guidelines updated for Form 2 Science.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* QUICK ACTIONS */}
                        <div className="sd-card">
                            <h3 className="sd-section-title"><i className="bi bi-lightning" style={{color: '#2563eb'}}></i> Quick Actions</h3>
                            
                            <div className="sd-action-btn">
                                <div>
                                    <div>Review Transfers</div>
                                    <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>5 pending requests</div>
                                </div>
                                <i className="bi bi-chevron-right"></i>
                            </div>

                            <div className="sd-action-btn">
                                <div>
                                    <div>Enter Marks</div>
                                    <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Exams period open</div>
                                </div>
                                <i className="bi bi-chevron-right"></i>
                            </div>

                            <div className="sd-action-btn">
                                <div>
                                    <div>Generate Reports</div>
                                    <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Pass rate analysis</div>
                                </div>
                                <i className="bi bi-chevron-right"></i>
                            </div>

                            <div className="sd-action-btn">
                                <div>
                                    <div>Update School Profile</div>
                                    <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>Settings</div>
                                </div>
                                <i className="bi bi-chevron-right"></i>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        </>
    );
};

export default SchoolDashboard;