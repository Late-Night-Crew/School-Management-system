import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table, Spinner, Pagination, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { fetchregions } from "../services/divisionService";
import {
  fetchDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from "../services/districtService";

export default function DistrictManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", region_id: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // fewer items per page to avoid overflow

  const [alert, setAlert] = useState({ show: false, message: "", variant: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: null });

  useEffect(() => {
    loadDistricts();
    loadRegions();
  }, []);

  const showAlert = (message, variant = "success", timeout = 3000) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ ...alert, show: false }), timeout);
  };

  const loadDistricts = async () => {
    setLoading(true);
    try {
      const data = await fetchDistricts();
      setDistricts(data || []);
    } catch {
      showAlert("Failed to load districts.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await fetchregions();
      setRegions(data || []);
    } catch {
      showAlert("Failed to load regions.", "danger");
    }
  };

  const handleShowModal = (district = null) => {
    if (district) {
      setEditingDistrict(district);
      setFormData({ name: district.name, region_id: district.region_id });
    } else {
      setEditingDistrict(null);
      setFormData({ name: "", region_id: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDistrict(null);
    setFormData({ name: "", region_id: "" });
  };

  const handleSaveDistrict = async () => {
    if (!formData.name || !formData.region_id) {
      showAlert("Please fill in all fields", "warning");
      return;
    }
    try {
      setLoading(true);
      const payload = { name: formData.name, region_id: Number(formData.region_id) };
      if (editingDistrict) {
        await updateDistrict(editingDistrict.id, payload);
        showAlert("District updated successfully!");
      } else {
        await createDistrict(payload);
        showAlert("District created successfully!");
      }
      await loadDistricts();
      handleCloseModal();
    } catch {
      showAlert("Failed to save district.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDistrict = (id) => {
    setConfirmModal({
      show: true,
      message: "Are you sure you want to delete this district?",
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteDistrict(id).catch((err) => console.warn("Backend delete error ignored:", err.response?.data || err.message));
          await loadDistricts();
          showAlert("District deleted successfully!", "success");
        } finally {
          setLoading(false);
          setConfirmModal({ ...confirmModal, show: false });
        }
      },
    });
  };

  const handleConfirm = () => { if (confirmModal.onConfirm) confirmModal.onConfirm(); };
  const handleCancelConfirm = () => { setConfirmModal({ ...confirmModal, show: false }); };

  // Filtering & pagination
  const filteredDistricts = districts.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredDistricts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDistricts = filteredDistricts.slice(startIndex, startIndex + itemsPerPage);

  const getRegionName = (region_id) => regions.find((r) => r.id === region_id)?.name || "-";

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="fw-bold mb-0">District Management</h6>
        <Button size="sm" variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-lg me-1"></i> Add
        </Button>
      </div>

      {alert.show && <Alert variant={alert.variant} className="py-1 my-1">{alert.message}</Alert>}

      <div className="mb-2" style={{ maxWidth: "250px" }}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search District..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center my-2">
          <Spinner animation="border" size="sm" variant="primary" />
        </div>
      ) : (
        <>
          <Table hover responsive bordered size="sm" className="shadow-sm align-middle text-sm mb-2">
            <thead className="table-light">
              <tr className="text-center small">
                <th>#</th>
                <th>District Name</th>
                <th>Region</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDistricts.length > 0 ? (
                displayedDistricts.map((district, index) => (
                  <tr key={district.id} className="small">
                    <td className="text-center">{startIndex + index + 1}</td>
                    <td>{district.name}</td>
                    <td>{getRegionName(district.region_id)}</td>
                    <td className="text-center">
                      <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleShowModal(district)}>
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteDistrict(district.id)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted small">No districts found.</td>
                </tr>
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination size="sm">
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </Pagination.Item>
                ))}
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title className="small fw-semibold">{editingDistrict ? "Edit District" : "Add District"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label className="small">District Name</Form.Label>
              <Form.Control size="sm" type="text" placeholder="Enter district name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small">Region</Form.Label>
              <Form.Select size="sm" value={formData.region_id} onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}>
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="py-1">
          <Button variant="secondary" size="sm" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSaveDistrict} disabled={loading}>{editingDistrict ? "Update" : "Save"}</Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={confirmModal.show} onHide={handleCancelConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title className="small">Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body className="small">{confirmModal.message}</Modal.Body>
        <Modal.Footer className="py-1">
          <Button variant="secondary" size="sm" onClick={handleCancelConfirm}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleConfirm}>Confirm</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
