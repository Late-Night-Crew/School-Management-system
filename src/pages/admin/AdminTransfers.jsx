import { useEffect, useState } from "react";

import {
  approveTransfer,
  createTransfer,
  finalizeTransfer,
  listIncomingTransfers,
  listOutgoingTransfers,
  rejectTransfer,
} from "../../api/transfers";
import { listSchools } from "../../api/schools";
import { listStudents } from "../../api/students";
import DataState from "../../components/DataState";
import TransferStatusBadge from "../../components/TransferStatusBadge";
import { formatDate } from "../../utils/format";
import { Button, Card, Dialog, Field, Input, Notice, Page, SearchInput, Select, Table, Textarea } from "../../components/ui";
import styles from "./AdminTransfers.module.css";

const TABS = [
  { key: "create", label: "Create Transfer", icon: "bi-plus-circle" },
  { key: "incoming", label: "Incoming Transfers", icon: "bi-box-arrow-in-down" },
  { key: "outgoing", label: "Outgoing Transfers", icon: "bi-box-arrow-up" },
];
const NOTICE_TONES = { success: "green", warning: "amber", danger: "red" };
const CONFIRM_TITLES = {
  create: "Create Transfer",
  approve: "Approve Transfer",
  finalize: "Finalize Transfer",
  reject: "Reject Transfer",
};

export default function AdminTransfers() {
  const [activeTab, setActiveTab] = useState("create");
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [outgoingTransfers, setOutgoingTransfers] = useState([]);
  
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [savingTransfer, setSavingTransfer] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  
  const [formData, setFormData] = useState({
    student_id: "",
    from_school: "",
    to_school: "",
    date_initiated: new Date().toISOString().split("T")[0],
    reason: "",
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: "",
    action: null,
    onConfirm: null,
  });

  const [alertState, setAlertState] = useState({
    show: false,
    variant: "success",
    message: "",
  });

  useEffect(() => {
    loadSchools();
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      if (activeTab === "incoming") {
        loadIncomingTransfers(selectedSchool);
      } else if (activeTab === "outgoing") {
        loadOutgoingTransfers(selectedSchool);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSchool, activeTab]);

  const loadSchools = async () => {
    setLoadingSchools(true);
    try {
      const data = await listSchools();
      setSchools(data || []);
    } catch (error) {
      showAlert("danger", error.message);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await listStudents();
      setStudents(data || []);
    } catch (error) {
      showAlert("danger", error.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadIncomingTransfers = async (schoolId) => {
    setLoadingTransfers(true);
    try {
      const data = await listIncomingTransfers(schoolId);
      setIncomingTransfers(data || []);
    } catch (error) {
      showAlert("danger", error.message);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const loadOutgoingTransfers = async (schoolId) => {
    setLoadingTransfers(true);
    try {
      const data = await listOutgoingTransfers(schoolId);
      setOutgoingTransfers(data || []);
    } catch (error) {
      showAlert("danger", error.message);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const reloadTransfers = () => {
    if (selectedSchool) {
      loadIncomingTransfers(selectedSchool);
      loadOutgoingTransfers(selectedSchool);
    }
  };

  const showAlert = (variant, message) => {
    setAlertState({ show: true, variant, message });
    setTimeout(() => setAlertState({ show: false, variant: "", message: "" }), 4000);
  };

  const handleShowRejectModal = (transfer) => {
    setSelectedTransfer(transfer);
    setRejectReason("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTransfer(null);
    setRejectReason("");
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Picking a student fills in their current school as the origin
      if (name === "student_id") {
        const student = students.find((s) => s.id === Number(value));
        if (student?.school_id) next.from_school = String(student.school_id);
      }
      return next;
    });
  };

  const handleCreateTransfer = () => {
    if (!formData.student_id || !formData.from_school || !formData.to_school) {
      showAlert("warning", "Please fill all required fields");
      return;
    }

    setConfirmModal({
      show: true,
      message: `Are you sure you want to create a transfer request for this student?`,
      action: "create",
      onConfirm: async () => {
        setSavingTransfer(true);
        try {
          await createTransfer({
            student_id: Number(formData.student_id),
            from_school: Number(formData.from_school),
            to_school: Number(formData.to_school),
            date_initiated: new Date(formData.date_initiated).toISOString(),
            reason: formData.reason,
          });
          showAlert("success", "Transfer request created successfully");
          setFormData({
            student_id: "",
            from_school: "",
            to_school: "",
            date_initiated: new Date().toISOString().split("T")[0],
            reason: "",
          });
          setSelectedSchool(String(formData.to_school));
          setActiveTab("incoming");
        } catch (error) {
          showAlert("danger", error.message);
        } finally {
          setSavingTransfer(false);
          setConfirmModal({ show: false, message: "", action: null, onConfirm: null });
        }
      },
    });
  };

  const handleApproveTransfer = (transfer) => {
    setConfirmModal({
      show: true,
      message: `Approve transfer request for ${transferStudentName(transfer)}?`,
      action: "approve",
      onConfirm: async () => {
        setSavingTransfer(true);
        try {
          await approveTransfer(transfer.id);
          showAlert("success", "Transfer approved successfully");
          reloadTransfers();
        } catch (error) {
          showAlert("danger", error.message);
        } finally {
          setSavingTransfer(false);
          setConfirmModal({ show: false, message: "", action: null, onConfirm: null });
        }
      },
    });
  };

  const handleFinalizeTransfer = (transfer) => {
    setConfirmModal({
      show: true,
      message: `Finalize transfer for ${transferStudentName(transfer)}?`,
      action: "finalize",
      onConfirm: async () => {
        setSavingTransfer(true);
        try {
          await finalizeTransfer(transfer.id);
          showAlert("success", "Transfer finalized successfully");
          reloadTransfers();
        } catch (error) {
          showAlert("danger", error.message);
        } finally {
          setSavingTransfer(false);
          setConfirmModal({ show: false, message: "", action: null, onConfirm: null });
        }
      },
    });
  };

  const handleRejectTransfer = () => {
    if (!rejectReason.trim()) {
      showAlert("warning", "Please provide a rejection reason");
      return;
    }

    setConfirmModal({
      show: true,
      message: `Reject transfer for ${transferStudentName(selectedTransfer)}?`,
      action: "reject",
      onConfirm: async () => {
        setSavingTransfer(true);
        try {
          await rejectTransfer(selectedTransfer.id, rejectReason);
          showAlert("success", "Transfer rejected successfully");
          handleCloseModal();
          reloadTransfers();
        } catch (error) {
          showAlert("danger", error.message);
        } finally {
          setSavingTransfer(false);
          setConfirmModal({ show: false, message: "", action: null, onConfirm: null });
        }
      },
    });
  };

  const getSchoolName = (schoolId) => {
    const school = schools.find((s) => s.id === Number(schoolId));
    return school ? school.name : `School #${schoolId}`;
  };

  // Prefer the names returned by the API; fall back to the loaded lists
  const transferStudentName = (transfer) =>
    transfer.student_name || getStudentName(transfer.student_id);

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === Number(studentId));
    return student ? `${student.first_name} ${student.last_name}` : `Student #${studentId}`;
  };

  const filteredIncomingTransfers = incomingTransfers.filter((transfer) => {
    const studentName = transferStudentName(transfer).toLowerCase();
    return studentName.includes(searchTerm.toLowerCase());
  });

  const filteredOutgoingTransfers = outgoingTransfers.filter((transfer) => {
    const studentName = transferStudentName(transfer).toLowerCase();
    return studentName.includes(searchTerm.toLowerCase());
  });

  const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

  const isIncoming = activeTab === "incoming";
  const transfers = isIncoming ? incomingTransfers : outgoingTransfers;
  const visibleTransfers = isIncoming ? filteredIncomingTransfers : filteredOutgoingTransfers;

  const transferActions = (transfer) => {
    const status = transfer.status.toLowerCase();
    if (isIncoming && status === "pending") {
      return (
        <>
          <Button
            variant="success"
            size="sm"
            icon="bi-check-circle"
            onClick={() => handleApproveTransfer(transfer)}
            disabled={savingTransfer}
            title="Approve transfer"
          >
            Approve
          </Button>{" "}
          <Button
            variant="danger"
            size="sm"
            icon="bi-x-circle"
            onClick={() => handleShowRejectModal(transfer)}
            disabled={savingTransfer}
            title="Reject transfer"
          >
            Reject
          </Button>
        </>
      );
    }
    if (status === "accepted") {
      return (
        <Button
          size="sm"
          icon="bi-check2-circle"
          onClick={() => handleFinalizeTransfer(transfer)}
          disabled={savingTransfer}
          title="Finalize transfer"
        >
          Finalize
        </Button>
      );
    }
    // Incoming transfers in an unrecognised state get no actions and no label
    if (isIncoming && status !== "completed" && status !== "rejected") return null;
    return <span>No actions</span>;
  };

  return (
    <Page
      icon="bi-arrow-left-right"
      title="Student Transfers"
      subtitle="Create transfer requests between schools and review each school's incoming and outgoing requests."
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {alertState.show && (
        <Notice tone={NOTICE_TONES[alertState.variant]}>
          <span>{alertState.message}</span>
          <Button variant="ghost" size="sm" icon="bi-x-lg" onClick={() => setAlertState({ ...alertState, show: false })}>
            Dismiss
          </Button>
        </Notice>
      )}

      {activeTab === "create" && (
        <Card
          accent="blue"
          icon="bi-send"
          title="New Transfer Request"
          subtitle="Picking a student fills in their current school"
          footer={
            !(loadingStudents || loadingSchools) && (
              <Button icon="bi-plus-circle" onClick={handleCreateTransfer} disabled={savingTransfer}>
                {savingTransfer ? "Creating…" : "Create Transfer"}
              </Button>
            )
          }
        >
          <DataState loading={loadingStudents || loadingSchools}>
            <div className="ui-grid ui-cols-2">
              <Field label="Student" required className="ui-span-all">
                <Select name="student_id" value={formData.student_id} onChange={handleFormChange} required>
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} (ID: {student.student_number})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="From School" required>
                <Select name="from_school" value={formData.from_school} onChange={handleFormChange} required>
                  <option value="">Select origin school...</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="To School" required>
                <Select name="to_school" value={formData.to_school} onChange={handleFormChange} required>
                  <option value="">Select destination school...</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date Initiated">
                <Input type="date" name="date_initiated" value={formData.date_initiated} onChange={handleFormChange} />
              </Field>
              <Field label="Reason" className="ui-span-all">
                <Textarea
                  rows={3}
                  name="reason"
                  value={formData.reason}
                  onChange={handleFormChange}
                  placeholder="Enter reason for transfer (optional)"
                />
              </Field>
            </div>
          </DataState>
        </Card>
      )}

      {activeTab !== "create" && (
        <>
          <Card accent="slate" icon="bi-funnel" title="Filters" subtitle="Choose a school to see its transfer requests">
            <div className="ui-grid ui-cols-2">
              <Field label="School">
                <Select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
                  <option value="">Select school to view transfers...</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Student">
                <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by student name..." />
              </Field>
            </div>
          </Card>

          <Card
            accent={isIncoming ? "green" : "amber"}
            icon={isIncoming ? "bi-box-arrow-in-down" : "bi-box-arrow-up"}
            title={isIncoming ? "Incoming Transfers" : "Outgoing Transfers"}
            subtitle={
              selectedSchool
                ? `${isIncoming ? "Requests to join" : "Requests to leave"} ${getSchoolName(selectedSchool)}`
                : "No school selected"
            }
            flush
          >
            <DataState
              loading={loadingTransfers}
              empty={transfers.length === 0}
              emptyIcon="bi-arrow-left-right"
              emptyMessage={isIncoming ? "No incoming transfer requests" : "No outgoing transfer requests"}
            >
              <Table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>{isIncoming ? "From School" : "To School"}</th>
                    <th>Date Initiated</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th className="end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td className="strong">{transferStudentName(transfer)}</td>
                      <td>
                        {isIncoming
                          ? transfer.from_school_name || getSchoolName(transfer.from_school)
                          : transfer.to_school_name || getSchoolName(transfer.to_school)}
                      </td>
                      <td>{formatDate(transfer.date_initiated)}</td>
                      <td>
                        <TransferStatusBadge status={transfer.status} />
                      </td>
                      <td>{transfer.reason || "N/A"}</td>
                      <td className="end">{transferActions(transfer)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </DataState>
          </Card>
        </>
      )}

      <Dialog
        show={activeTab !== "create" && selectedTransfer !== null && showModal}
        onHide={handleCloseModal}
        title="Reject Transfer Request"
        icon="bi-x-circle"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon="bi-x-circle"
              onClick={handleRejectTransfer}
              disabled={savingTransfer || !rejectReason.trim()}
            >
              {savingTransfer ? "Rejecting…" : "Reject Transfer"}
            </Button>
          </>
        }
      >
        <Field label="Rejection Reason" required>
          <Textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejecting this transfer..."
            required
          />
        </Field>
      </Dialog>

      <Dialog
        show={confirmModal.show}
        onHide={closeConfirm}
        title={CONFIRM_TITLES[confirmModal.action] || "Confirm Action"}
        icon="bi-question-circle"
        footer={
          <>
            <Button variant="ghost" onClick={closeConfirm}>
              Cancel
            </Button>
            <Button
              variant={confirmModal.action === "reject" ? "danger" : "primary"}
              onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
              disabled={savingTransfer}
            >
              {savingTransfer ? "Processing…" : "Confirm"}
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>{confirmModal.message}</p>
      </Dialog>
    </Page>
  );
}
