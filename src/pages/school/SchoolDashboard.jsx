import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { listAcademicYears } from "../../api/academicYears";
import { getSchoolInsights } from "../../api/insights";
import { getSchool } from "../../api/schools";
import { schoolPromotionBase } from "../../api/promotion";
import { listTermReports } from "../../api/termReports";
import {
  getSchoolDashboard,
  listSchoolExamResults,
  listSchoolIncomingTransfers,
  listSchoolOutgoingTransfers,
} from "../../api/schoolPortal";
import { getSession } from "../../auth/session";
import { formatDate, formatRate } from "../../utils/format";
import InsightsPanel from "../../components/charts/InsightsPanel";
import DataState from "../../components/DataState";
import TransferStatusBadge from "../../components/TransferStatusBadge";
import { Button, Card, Notice, Page, StatTile } from "../../components/ui";
import styles from "./SchoolDashboard.module.css";

const DAY_MONTH = { day: "numeric", month: "short" };

// Value of a settled promise, or the fallback if it failed
const valueOr = (result, fallback) => (result.status === "fulfilled" ? result.value : fallback);

const SchoolDashboard = () => {
    const { schoolId } = useParams();
    const displayName = getSession()?.displayName || "School Manager";

    const [loading, setLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);
    const [stats, setStats] = useState(null);
    const [school, setSchool] = useState(null);
    const [activeYear, setActiveYear] = useState(null);
    const [latestResult, setLatestResult] = useState(null);
    const [recentTransfers, setRecentTransfers] = useState([]);
    const [insights, setInsights] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [statsRes, schoolRes, yearsRes, resultsRes, incomingRes, termRes, outgoingRes, insightsRes] = await Promise.allSettled([
                getSchoolDashboard(schoolId),
                getSchool(schoolId),
                listAcademicYears(),
                listSchoolExamResults(schoolId),
                listSchoolIncomingTransfers(schoolId),
                listTermReports(schoolPromotionBase(false, schoolId)),
                listSchoolOutgoingTransfers(schoolId),
                getSchoolInsights(schoolId),
            ]);
            setInsights(valueOr(insightsRes, null));

            setStatsError(statsRes.status === "rejected");
            setStats(valueOr(statsRes, null));
            setSchool(valueOr(schoolRes, null));

            const years = valueOr(yearsRes, []);
            setActiveYear(years.find((y) => y.status === "Active") || null);

            // Latest exam result: the newest saved Term 3 report (calculated from the JCE/MSCE
            // results), otherwise the newest rate recorded by hand before term reports
            const yearById = Object.fromEntries(years.map((y) => [y.id, y]));
            const calculated = valueOr(termRes, [])
                .filter((r) => r.term === 3 && !r.live)
                .map((r) => ({ ...r, year: yearById[r.academic_year_id] }));
            const recorded = valueOr(resultsRes, []).map((r) => ({ ...r, year: yearById[r.academic_year_id] }));
            const results = [...calculated, ...recorded].sort((a, b) => (b.year?.year || 0) - (a.year?.year || 0));
            setLatestResult(results[0] || null);

            const transfers = [
                ...valueOr(incomingRes, []).map((t) => ({ ...t, direction: "in" })),
                ...valueOr(outgoingRes, []).map((t) => ({ ...t, direction: "out" })),
            ].sort((a, b) => new Date(b.date_initiated) - new Date(a.date_initiated));
            setRecentTransfers(transfers.slice(0, 5));

            setLoading(false);
        };
        load();
    }, [schoolId]);

    const total = stats?.student_count || 0;
    const male = stats?.male_count || 0;
    const female = stats?.female_count || 0;
    const pendingIncoming = stats?.pending_incoming_count || 0;
    const pendingTotal = pendingIncoming + (stats?.pending_outgoing_count || 0);
    const value = (n) => (loading ? "…" : statsError ? "-" : n.toLocaleString());

    const quickActions = [
        {
            label: "Review Transfers",
            hint: pendingIncoming ? `${pendingIncoming} incoming request${pendingIncoming !== 1 ? "s" : ""} waiting` : "No requests waiting",
            path: "transfers",
        },
        { label: "Register Students", hint: activeYear ? `Enrolling for ${activeYear.year}` : "Needs an active academic year", path: "register" },
        { label: "View Students", hint: `${total.toLocaleString()} enrolled`, path: "students" },
        { label: "Academic Years", hint: "Calendar set by the Ministry", path: "academicyear" },
    ];

    return (
        <Page
            icon="bi-speedometer2"
            title={school?.name || "School Overview"}
            subtitle={`Welcome back, ${displayName}. Here is your school at a glance.`}
        >
            {statsError && <Notice tone="red">Could not load school statistics. Please refresh the page.</Notice>}

            <div className="ui-grid ui-cols-4">
                <StatTile
                    label="Total Enrolled"
                    value={value(total)}
                    icon="bi-people-fill"
                    tone="blue"
                    detail={`${value(male)} male · ${value(female)} female · ${value(stats?.disability_count || 0)} with disability`}
                    loading={loading}
                />
                <StatTile
                    label="Transfer Requests"
                    value={value((stats?.incoming_transfer_count || 0) + (stats?.outgoing_transfer_count || 0))}
                    icon="bi-arrow-left-right"
                    tone="purple"
                    detail={`In ${value(stats?.incoming_transfer_count || 0)} · Out ${value(stats?.outgoing_transfer_count || 0)} · Pending ${value(pendingTotal)}`}
                    loading={loading}
                />
                <StatTile
                    label="Academic Year"
                    value={activeYear ? activeYear.year : "None active"}
                    icon="bi-calendar-check"
                    tone="green"
                    detail={activeYear && `${formatDate(activeYear.start_date, DAY_MONTH)} → ${formatDate(activeYear.end_date, DAY_MONTH)}`}
                    loading={loading}
                />
                <StatTile
                    label="Exam Pass Rates"
                    value={latestResult ? latestResult.year?.year || "Recorded" : "Not recorded"}
                    icon="bi-award-fill"
                    tone="amber"
                    detail={latestResult && `JCE ${formatRate(latestResult.jce_pass_rate)} · MSCE ${formatRate(latestResult.msce_pass_rate)}`}
                    loading={loading}
                />
            </div>

            {insights && <InsightsPanel insights={insights} />}

            <div className="ui-split">
                <div className={styles.stack}>
                    <Card
                        accent="blue"
                        icon="bi-arrow-left-right"
                        title="Recent Transfers"
                        subtitle="Latest requests to and from your school"
                        actions={<Button variant="ghost" size="sm" to={`/school/${schoolId}/transfers`}>View all</Button>}
                    >
                        <DataState loading={loading} empty={recentTransfers.length === 0} emptyMessage="No transfers yet.">
                            <ul className="ui-list">
                                {recentTransfers.map((t) => (
                                    <li className="ui-list-item" key={`${t.direction}-${t.id}`}>
                                        <span className={`${styles.direction} ui-tone-${t.direction === "in" ? "green" : "amber"}`}>
                                            <i className={`bi ${t.direction === "in" ? "bi-arrow-down-right" : "bi-arrow-up-right"}`} />
                                        </span>
                                        <div className="ui-list-main">
                                            <div className="ui-list-title">{t.student_name}</div>
                                            <div className="ui-list-sub">
                                                {t.direction === "in" ? `From ${t.from_school_name}` : `To ${t.to_school_name}`}
                                                {" · "}{formatDate(t.date_initiated, DAY_MONTH)}
                                            </div>
                                        </div>
                                        <TransferStatusBadge status={t.status} />
                                    </li>
                                ))}
                            </ul>
                        </DataState>
                    </Card>
                </div>

                {/* Wrapped so the card keeps its own height beside the taller column */}
                <div>
                    <Card accent="green" icon="bi-lightning-charge" title="Quick Actions" subtitle="Common tasks">
                        {quickActions.map((action) => (
                            <Link key={action.path} to={`/school/${schoolId}/${action.path}`} className="ui-action-link">
                                <div>
                                    <div className="ui-action-link-title">{action.label}</div>
                                    <div className="ui-action-link-sub">{action.hint}</div>
                                </div>
                                <i className="bi bi-chevron-right" />
                            </Link>
                        ))}
                    </Card>
                </div>
            </div>
        </Page>
    );
};

export default SchoolDashboard;
