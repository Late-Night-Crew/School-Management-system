import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import ToastNote from "../../components/ToastNote";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import TransferStatusBadge from "../../components/TransferStatusBadge";
import {
    Badge,
    Button,
    Card,
    Dialog,
    Field,
    IconButton,
    Input,
    Page,
    Person,
    SearchInput,
    Select,
    Table,
    Textarea,
} from "../../components/ui";
import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import { listSchools } from "../../api/schools";
import {
    approveSchoolTransfer,
    createSchoolTransfer,
    finalizeSchoolTransfer,
    listSchoolIncomingTransfers,
    listSchoolOutgoingTransfers,
    listSchoolStudents,
    rejectSchoolTransfer,
} from "../../api/schoolPortal";
import usePagination from "../../hooks/usePagination";
import TablePagination from "../../components/TablePagination";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");

// Today as YYYY-MM-DD in local time, for the transfer date field
const today = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const emptyForm = () => ({ regionId: "", toSchoolId: "", reason: "", transferDate: today() });

export default function SchoolTransfers() {
    const { schoolId } = useParams();
    const [activeTab, setActiveTab] = useState("initiate");

    const [students, setStudents] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingTransfers, setOutgoingTransfers] = useState([]);
    const [schools, setSchools] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [regions, setRegions] = useState([]);

    const [studentSearch, setStudentSearch] = useState("");
    const [incomingFilter, setIncomingFilter] = useState("");
    const [historyStatus, setHistoryStatus] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [initiateForm, setInitiateForm] = useState(emptyForm);

    const [busy, setBusy] = useState(false);
    const [confirm, setConfirm] = useState(null); // { title, body, onConfirm }
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

    const showToast = (message, variant = "success") => setToast({ show: true, message, variant });

    const loadTransfers = useCallback(async () => {
        try {
            const [incoming, outgoing] = await Promise.all([
                listSchoolIncomingTransfers(schoolId),
                listSchoolOutgoingTransfers(schoolId),
            ]);
            setIncomingRequests(incoming);
            setOutgoingTransfers(outgoing);
        } catch (error) {
            setToast({ show: true, message: error.message, variant: "danger" });
        }
    }, [schoolId]);

    const loadStudents = useCallback(async () => {
        try {
            setStudents(await listSchoolStudents(schoolId));
        } catch (error) {
            console.error(error);
            setToast({ show: true, message: "Failed to load students.", variant: "danger" });
        }
    }, [schoolId]);

    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [allSchools, allDistricts, allRegions] = await Promise.all([
                    listSchools(),
                    listDistricts(),
                    listRegions(),
                ]);
                setSchools(allSchools);
                setDistricts(allDistricts);
                setRegions(allRegions);
            } catch (error) {
                console.error(error);
                setToast({ show: true, message: "Failed to load divisions, districts and schools.", variant: "danger" });
            }
        };
        loadLookups();
        loadStudents();
        loadTransfers();
    }, [loadStudents, loadTransfers]);

    // Destination schools in the chosen division, grouped by district.
    // A school cannot transfer a student to itself.
    const districtsInRegion = districts
        .filter((d) => d.region_id === Number(initiateForm.regionId))
        .sort((a, b) => a.name.localeCompare(b.name));
    const destinationGroups = districtsInRegion
        .map((district) => ({
            district,
            schools: schools
                .filter((s) => s.district_id === district.id && s.id !== Number(schoolId))
                .sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .filter((group) => group.schools.length > 0);

    const pendingStudentIds = new Set(
        outgoingTransfers.filter((t) => t.status === "Pending").map((t) => t.student_id)
    );

    const searchTerm = studentSearch.trim().toLowerCase();
    const studentMatches = students
        .filter(
            (s) =>
                `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm) ||
                s.student_number?.toLowerCase().includes(searchTerm)
        )
        .sort((a, b) => a.form_level - b.form_level || a.last_name.localeCompare(b.last_name));
    const { page, pageCount, pageItems, setPage } = usePagination(studentMatches, 15);

    const filteredIncoming = incomingRequests.filter((t) =>
        `${t.student_name} ${t.student_number} ${t.from_school_name}`
            .toLowerCase()
            .includes(incomingFilter.trim().toLowerCase())
    );

    const filteredHistory = outgoingTransfers.filter(
        (t) => !historyStatus || t.status === historyStatus
    );

    const closeTransferForm = () => {
        setSelectedStudent(null);
        setInitiateForm(emptyForm());
    };

    const openTransferForm = (student) => {
        setSelectedStudent(student);
        setInitiateForm(emptyForm());
    };

    const handleInitiateTransfer = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !initiateForm.toSchoolId || !initiateForm.reason || !initiateForm.transferDate) {
            showToast("Please fill in all required fields.", "warning");
            return;
        }
        setBusy(true);
        try {
            await createSchoolTransfer(schoolId, {
                student_id: selectedStudent.id,
                to_school: Number(initiateForm.toSchoolId),
                date_initiated: new Date(initiateForm.transferDate).toISOString(),
                reason: initiateForm.reason,
            });
            showToast("Transfer request submitted successfully!");
            closeTransferForm();
            loadTransfers();
        } catch (error) {
            showToast(error.message, "danger");
        } finally {
            setBusy(false);
        }
    };

    const runAction = async (action, successMessage) => {
        setBusy(true);
        try {
            await action();
            showToast(successMessage);
            loadTransfers();
            // Approving moves the student into this school
            loadStudents();
        } catch (error) {
            showToast(error.message, "danger");
        } finally {
            setBusy(false);
        }
    };

    const confirmApprove = (transfer) =>
        setConfirm({
            title: "Approve Transfer",
            body: `Approve the transfer of ${transfer.student_name} from ${transfer.from_school_name}? The student will be moved to your school.`,
            onConfirm: () =>
                runAction(() => approveSchoolTransfer(schoolId, transfer.id), "Transfer approved."),
        });

    const confirmFinalize = (transfer) =>
        setConfirm({
            title: "Finalize Transfer",
            body: `Finalize the transfer of ${transfer.student_name} to ${transfer.to_school_name}? This closes the transfer.`,
            onConfirm: () =>
                runAction(() => finalizeSchoolTransfer(schoolId, transfer.id), "Transfer finalized."),
        });

    const openReject = (transfer) => {
        setRejectTarget(transfer);
        setRejectReason("");
    };

    const submitReject = async () => {
        const transfer = rejectTarget;
        setRejectTarget(null);
        await runAction(
            () => rejectSchoolTransfer(schoolId, transfer.id, rejectReason.trim()),
            "Transfer rejected."
        );
    };

    const pendingIncomingCount = incomingRequests.filter((t) => t.status === "Pending").length;

    return (
        <Page
            icon="bi-arrow-left-right"
            title="School Transfers"
            subtitle="Manage student movement between institutions seamlessly."
            tabs={[
                { key: "initiate", label: "Initiate Transfer", icon: "bi-send" },
                { key: "accept", label: "Incoming Requests", icon: "bi-inbox", count: pendingIncomingCount > 0 ? pendingIncomingCount : null },
                { key: "transfers", label: "Outgoing Transfers", icon: "bi-clock-history" },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            <ToastNote show={toast.show} onClose={() => setToast({ ...toast, show: false })} message={toast.message} variant={toast.variant} />

            <ConfirmModal
                show={!!confirm}
                onHide={() => setConfirm(null)}
                title={confirm?.title}
                body={confirm?.body}
                danger={false}
                onConfirm={() => {
                    const action = confirm.onConfirm;
                    setConfirm(null);
                    action();
                }}
            />

            <Dialog
                show={!!rejectTarget}
                onHide={() => setRejectTarget(null)}
                title="Reject Transfer"
                icon="bi-x-octagon"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
                        <Button variant="danger" onClick={submitReject} disabled={!rejectReason.trim()}>Reject Transfer</Button>
                    </>
                }
            >
                <Field label={`Reason for rejecting ${rejectTarget?.student_name}'s transfer`}>
                    <Textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. No space in the requested form level"
                    />
                </Field>
            </Dialog>

            {/* INITIATE TAB */}
            {activeTab === 'initiate' && (
                <Card
                    accent="blue"
                    icon="bi-people"
                    title="Students"
                    subtitle={`${studentMatches.length} of ${students.length} students · choose a student to transfer`}
                    actions={
                        <SearchInput
                            value={studentSearch}
                            onChange={(value) => {
                                setStudentSearch(value);
                                setPage(1);
                            }}
                            placeholder="Search by name or student number..."
                        />
                    }
                    flush
                >
                    <DataState
                        empty={studentMatches.length === 0}
                        emptyIcon="bi-search"
                        emptyMessage={students.length ? "No students match your search." : "No students enrolled yet."}
                    >
                        <Table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Form</th>
                                    <th>Gender</th>
                                    <th className="end">Transfer</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <Person name={`${s.first_name} ${s.last_name}`} sub={s.student_number} />
                                        </td>
                                        <td>Form {s.form_level}</td>
                                        <td>{s.gender || "-"}</td>
                                        <td className="end">
                                            {pendingStudentIds.has(s.id) ? (
                                                <Badge tone="amber">Transfer pending</Badge>
                                            ) : (
                                                <Button variant="ghost" size="sm" icon="bi-send" onClick={() => openTransferForm(s)}>
                                                    Transfer
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <TablePagination page={page} pageCount={pageCount} onChange={setPage} />
                    </DataState>
                </Card>
            )}

            <Dialog
                show={!!selectedStudent}
                onHide={closeTransferForm}
                title={selectedStudent ? `Transfer ${selectedStudent.first_name} ${selectedStudent.last_name}` : ""}
                icon="bi-send"
                as="form"
                onSubmit={handleInitiateTransfer}
                footer={
                    <>
                        <Button variant="ghost" onClick={closeTransferForm}>Cancel</Button>
                        <Button type="submit" icon="bi-send" disabled={busy}>
                            {busy ? "Submitting..." : "Submit Transfer Request"}
                        </Button>
                    </>
                }
            >
                {selectedStudent && (
                    <div className="ui-grid">
                        <Person
                            name={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                            sub={`${selectedStudent.student_number} · Form ${selectedStudent.form_level}`}
                        />
                        <Field label="Division" required>
                            <Select
                                value={initiateForm.regionId}
                                onChange={(e) => setInitiateForm({ ...initiateForm, regionId: e.target.value, toSchoolId: "" })}
                                required
                            >
                                <option value="">Select division…</option>
                                {regions.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field
                            label="Destination School"
                            required
                            hint={initiateForm.regionId && destinationGroups.length === 0 ? "No other schools in this division." : undefined}
                        >
                            <Select
                                value={initiateForm.toSchoolId}
                                onChange={(e) => setInitiateForm({ ...initiateForm, toSchoolId: e.target.value })}
                                disabled={!initiateForm.regionId}
                                required
                            >
                                <option value="">{initiateForm.regionId ? "Select school…" : "Select a division first"}</option>
                                {destinationGroups.map(({ district, schools: districtSchools }) => (
                                    <optgroup key={district.id} label={district.name}>
                                        {districtSchools.map((school) => (
                                            <option key={school.id} value={school.id}>{school.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Transfer Date" required>
                            <Input
                                type="date"
                                value={initiateForm.transferDate}
                                onChange={(e) => setInitiateForm({ ...initiateForm, transferDate: e.target.value })}
                                required
                            />
                        </Field>
                        <Field label="Reason for Transfer" required>
                            <Textarea
                                rows={3}
                                placeholder="e.g. Relocation, Academic preference..."
                                value={initiateForm.reason}
                                onChange={(e) => setInitiateForm({ ...initiateForm, reason: e.target.value })}
                                required
                            />
                        </Field>
                    </div>
                )}
            </Dialog>

            {/* INCOMING TAB */}
            {activeTab === 'accept' && (
                <Card
                    accent="amber"
                    icon="bi-inbox"
                    title="Incoming Requests"
                    subtitle="Students other schools want to transfer to yours"
                    actions={<SearchInput value={incomingFilter} onChange={setIncomingFilter} placeholder="Filter by student or school..." />}
                    flush
                >
                    <DataState empty={filteredIncoming.length === 0} emptyMessage="No incoming requests found.">
                        <Table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>From School</th>
                                    <th>Date Initiated</th>
                                    <th>Status</th>
                                    <th className="end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIncoming.map(request => (
                                    <tr key={request.id}>
                                        <td><Person name={request.student_name} sub={request.student_number} /></td>
                                        <td>{request.from_school_name || '-'}</td>
                                        <td>{formatDate(request.date_initiated)}</td>
                                        <td><TransferStatusBadge status={request.status} /></td>
                                        <td className="end">
                                            {request.status === 'Pending' ? (
                                                <>
                                                    <Button variant="ghost" size="sm" icon="bi-x-lg" disabled={busy} onClick={() => openReject(request)}>Reject</Button>{" "}
                                                    <Button variant="success" size="sm" icon="bi-check-lg" disabled={busy} onClick={() => confirmApprove(request)}>Approve</Button>
                                                </>
                                            ) : (
                                                <span className="ui-hint">No actions</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </DataState>
                </Card>
            )}

            {/* OUTGOING TAB */}
            {activeTab === 'transfers' && (
                <Card
                    accent="purple"
                    icon="bi-clock-history"
                    title="Outgoing Transfers"
                    subtitle="Transfers your school has requested"
                    actions={
                        <Select value={historyStatus} onChange={(e) => setHistoryStatus(e.target.value)} aria-label="Filter by status">
                            <option value="">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                        </Select>
                    }
                    flush
                >
                    <DataState empty={filteredHistory.length === 0} emptyIcon="bi-table" emptyMessage="No outgoing transfers found.">
                        <Table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>To School</th>
                                    <th>Date Initiated</th>
                                    <th>Status</th>
                                    <th className="end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map(transfer => (
                                    <tr key={transfer.id}>
                                        <td><Person name={transfer.student_name} sub={transfer.student_number} /></td>
                                        <td>{transfer.to_school_name || 'N/A'}</td>
                                        <td>{formatDate(transfer.date_initiated)}</td>
                                        <td>
                                            <TransferStatusBadge status={transfer.status} />
                                            {transfer.rejection_reason && <div className="ui-hint">{transfer.rejection_reason}</div>}
                                        </td>
                                        <td className="end">
                                            {transfer.status === 'Accepted' ? (
                                                <Button variant="success" size="sm" icon="bi-check2-all" disabled={busy} onClick={() => confirmFinalize(transfer)}>Finalize</Button>
                                            ) : (
                                                <span className="ui-hint">No actions</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </DataState>
                </Card>
            )}
        </Page>
    );
}
