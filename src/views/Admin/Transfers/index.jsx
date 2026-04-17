import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table, Spinner, Tabs, Tab, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import {
  createTransfer,
  getIncomingTransfers,
  getOutgoingTransfers,
  approveTransfer,
  finalizeTransfer,
  rejectTransfer,
} from "../services/transferService";
import { fetchSchools } from "../services/schoolService";
import { fetchStudents } from "../services/studentService";

export default function ManageTransfers() {
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
      const data = await fetchSchools();
      setSchools(data || []);
    } catch (error) {
      showAlert("error", error.message);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const data = await fetchStudents();
      setStudents(data || []);
    } catch (error) {
      showAlert("error", error.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadIncomingTransfers = async (schoolId) => {
    setLoadingTransfers(true);
    try {
      const data = await getIncomingTransfers(schoolId);
      setIncomingTransfers(data || []);
    } catch (error) {
      showAlert("error", error.message);
    } finally {
      setLoadingTransfers(false);
    }
  };

  const loadOutgoingTransfers = async (schoolId) => {
    setLoadingTransfers(true);
    try {
      const data = await getOutgoingTransfers(schoolId);
      setOutgoingTransfers(data || []);
    } catch (error) {
      showAlert("error", error.message);
    } finally {
      setLoadingTransfers(false);
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
          await createTransfer(formData);
          showAlert("success", "Transfer request created successfully");
          setFormData({
            student_id: "",
            from_school: "",
            to_school: "",
            date_initiated: new Date().toISOString().split("T")[0],
            reason: "",
          });
          setActiveTab("incoming");
          if (formData.to_school) {
            loadIncomingTransfers(formData.to_school);
          }
        } catch (error) {
          showAlert("error", error.message);
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
      message: `Approve transfer request for ${getStudentName(transfer.student_id)}?`,
      action: "approve",
      onConfirm: async () => {
        setSavingTransfer(true);
        try {
          await approveTransfer(transfer.id);
          showAlert("success", "Transfer approved successfully");
          if (selectedSchool) {
            loadIncomingTransfers(selectedSchool);
          }
        } catch (error) {
          showAlert("error", error.message);
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
      message: `Finalize transfer for ${getStudentName(transfer.student_id)}?`,
      action: "finalize",
      onConfirm: async () => {
        setSavingTransfer(true);
        try {
          await finalizeTransfer(transfer.id);
          showAlert("success", "Transfer finalized successfully");
          if (selectedSchool) {
            loadIncomingTransfers(selectedSchool);
          }
        } catch (error) {
          showAlert("error", error.message);
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
      message: `Reject transfer for ${getStudentName(selectedTransfer.student_id)}?`,
      action: "reject",
      onConfirm: async () => {
        setSavingTransfer(true);
        try {
          await rejectTransfer(selectedTransfer.id, rejectReason);
          showAlert("success", "Transfer rejected successfully");
          handleCloseModal();
          if (selectedSchool) {
            loadIncomingTransfers(selectedSchool);
          }
        } catch (error) {
          showAlert("error", error.message);
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

  const getStudentName = (studentId) => {
    const student = students.find((s) => s.id === Number(studentId));
    return student ? `${student.first_name} ${student.last_name}` : `Student #${studentId}`;
  };

  const filteredIncomingTransfers = incomingTransfers.filter((transfer) => {
    const studentName = getStudentName(transfer.student_id).toLowerCase();
    return studentName.includes(searchTerm.toLowerCase());
  });

  const filteredOutgoingTransfers = outgoingTransfers.filter((transfer) => {
    const studentName = getStudentName(transfer.student_id).toLowerCase();
    return studentName.includes(searchTerm.toLowerCase());
  });

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "badge bg-warning text-dark";
      case "accepted":
        return "badge bg-info";
      case "approved":
        return "badge bg-success";
      case "finalized":
        return "badge bg-primary";
      case "rejected":
        return "badge bg-danger";
      default:
        return "badge bg-secondary";
    }
  };

  return (
    <div className="p-4">
      <h1 className="mb-4">
        <i className="bi bi-arrow-left-right"></i> Student Transfers Management
      </h1>

      {alertState.show && (
        <Alert variant={alertState.variant} onClose={() => setAlertState({ ...alertState, show: false })} dismissible>
          {alertState.message}
        </Alert>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
        {/* Create Transfer Tab */}
        <Tab eventKey="create" title="Create Transfer">
          <div className="card p-4 mt-4">
            <h5 className="mb-4">New Transfer Request</h5>
            {loadingStudents || loadingSchools ? (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Student <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select a student...</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} (ID: {student.student_number})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    From School <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="from_school"
                    value={formData.from_school}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select origin school...</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    To School <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="to_school"
                    value={formData.to_school}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select destination school...</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Date Initiated</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_initiated"
                    value={formData.date_initiated}
                    onChange={handleFormChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="reason"
                    value={formData.reason}
                    onChange={handleFormChange}
                    placeholder="Enter reason for transfer (optional)"
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  onClick={handleCreateTransfer}
                  disabled={savingTransfer}
                >
                  {savingTransfer ? (
                    <>
                      <Spinner size="sm" className="me-2" animation="border" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>Create Transfer
                    </>
                  )}
                </Button>
              </Form>
            )}
          </div>
        </Tab>

        {/* Incoming Transfers Tab */}
        <Tab eventKey="incoming" title="Incoming Transfers">
          <div className="mt-4">
            <div className="mb-3 d-flex gap-2">
              <Form.Select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-auto"
              >
                <option value="">Select school to view transfers...</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-auto"
              />
            </div>

            {loadingTransfers ? (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : incomingTransfers.length === 0 ? (
              <Alert variant="info">No incoming transfer requests</Alert>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Student</th>
                      <th>From School</th>
                      <th>Date Initiated</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncomingTransfers.map((transfer) => (
                      <tr key={transfer.id}>
                        <td>{getStudentName(transfer.student_id)}</td>
                        <td>{getSchoolName(transfer.from_school)}</td>
                        <td>{new Date(transfer.date_initiated).toLocaleDateString()}</td>
                        <td>
                          <span className={getStatusBadgeClass(transfer.status)}>
                            {transfer.status}
                          </span>
                        </td>
                        <td>{transfer.reason || "N/A"}</td>
                        <td>
                          {transfer.status.toLowerCase() === "pending" && (
                            <div className="btn-group" role="group">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleApproveTransfer(transfer)}
                                disabled={savingTransfer}
                                title="Approve transfer"
                              >
                                <i className="bi bi-check-circle"></i> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleShowRejectModal(transfer)}
                                disabled={savingTransfer}
                                title="Reject transfer"
                              >
                                <i className="bi bi-x-circle"></i> Reject
                              </Button>
                            </div>
                          )}
                          {transfer.status.toLowerCase() === "approved" && (
                            <Button
                              size="sm"
                              variant="info"
                              onClick={() => handleFinalizeTransfer(transfer)}
                              disabled={savingTransfer}
                              title="Finalize transfer"
                            >
                              <i className="bi bi-check2-circle"></i> Finalize
                            </Button>
                          )}
                          {(transfer.status.toLowerCase() === "finalized" || 
                            transfer.status.toLowerCase() === "rejected") && (
                            <span className="text-muted">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Tab>

        {/* Outgoing Transfers Tab */}
        <Tab eventKey="outgoing" title="Outgoing Transfers">
          <div className="mt-4">
            <div className="mb-3 d-flex gap-2">
              <Form.Select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-auto"
              >
                <option value="">Select school to view transfers...</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-auto"
              />
            </div>

            {loadingTransfers ? (
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            ) : outgoingTransfers.length === 0 ? (
              <Alert variant="info">No outgoing transfer requests</Alert>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Student</th>
                      <th>To School</th>
                      <th>Date Initiated</th>
                      <th>Status</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutgoingTransfers.map((transfer) => (
                      <tr key={transfer.id}>
                        <td>{getStudentName(transfer.student_id)}</td>
                        <td>{getSchoolName(transfer.to_school)}</td>
                        <td>{new Date(transfer.date_initiated).toLocaleDateString()}</td>
                        <td>
                          <span className={getStatusBadgeClass(transfer.status)}>
                            {transfer.status}
                          </span>
                        </td>
                        <td>{transfer.reason || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* Reject Modal */}
      <Modal show={activeTab !== "create" && selectedTransfer !== null && showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Transfer Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Rejection Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejecting this transfer..."
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRejectTransfer}
            disabled={savingTransfer || !rejectReason.trim()}
          >
            {savingTransfer ? (
              <>
                <Spinner size="sm" className="me-2" animation="border" />
                Rejecting...
              </>
            ) : (
              "Reject Transfer"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={confirmModal.show} onHide={() => setConfirmModal({ ...confirmModal, show: false })}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmModal.message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => confirmModal.onConfirm && confirmModal.onConfirm()}
            disabled={savingTransfer}
          >
            {savingTransfer ? (
              <>
                <Spinner size="sm" className="me-2" animation="border" />
                Processing...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
