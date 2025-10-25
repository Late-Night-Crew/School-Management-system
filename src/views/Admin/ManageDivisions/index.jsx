import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table, Spinner } from "react-bootstrap";
import {
  fetchregions,
  fetchregionDetails,
  deleteregion,
  updateregion,
  createregion
} from "../services/divisionService";

export default function DivisionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => { loadRegions(); }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const data = await fetchregions();
      setRegions(data || []);
    } catch (error) {
      console.error("Error fetching regions:", error);
      alert("Failed to load divisions.");
    } finally { setLoading(false); }
  };

  const handleShowModal = async (division = null) => {
    if (division) {
      try {
        const details = await fetchregionDetails(division.id);
        setEditingDivision(division);
        setFormData({ name: details?.name || division.name });
      } catch (err) {
        console.error("Failed to fetch details:", err);
        alert("Could not fetch division details.");
      }
    } else {
      setEditingDivision(null);
      setFormData({ name: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingDivision(null); };

  const handleSaveDivision = async () => {
    if (!formData.name.trim()) { alert("Please fill in the name field."); return; }
    try {
      setSaving(true);
      if (editingDivision) {
        await updateregion(editingDivision.id, formData);
        setRegions((prev) => prev.map((r) => r.id === editingDivision.id ? { ...r, ...formData } : r));
      } else {
        const newRegion = await createregion(formData);
        setRegions((prev) => [...prev, newRegion]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving division:", error);
      alert("Failed to save division.");
    } finally { setSaving(false); }
  };

  const handleDeleteDivision = async (id) => {
    if (!window.confirm("Are you sure you want to delete this division?")) return;
    try {
      await deleteregion(id);
      setRegions((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting division:", error);
      alert("Failed to delete division.");
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-bold mb-0 small">Division Management</h5>
        <Button size="sm" variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-lg me-1"></i> Add
        </Button>
      </div>

      {/* Search Input */}
      <div className="mb-2" style={{ maxWidth: "250px" }}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search Division..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Division Table */}
      {loading ? (
        <div className="text-center my-2">
          <Spinner animation="border" size="sm" />
          <p className="mt-1 small text-muted">Loading divisions...</p>
        </div>
      ) : (
        <Table hover responsive bordered size="sm" className="shadow-sm align-middle text-sm mb-2">
          <thead className="table-light small">
            <tr className="text-center">
              <th>#</th>
              <th>Division Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegions.length > 0 ? (
              filteredRegions.map((region, index) => (
                <tr key={region.id} className="small">
                  <td className="text-center">{index + 1}</td>
                  <td>{region.name}</td>
                  <td className="text-center">
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => handleShowModal(region)}>
                      <i className="bi bi-pencil-square"></i>
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDeleteDivision(region.id)}>
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-muted small">No regions found.</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title className="small fw-semibold">{editingDivision ? "Edit Division" : "Add Division"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label className="small">Division Name</Form.Label>
              <Form.Control
                size="sm"
                type="text"
                placeholder="Enter division name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="py-1">
          <Button size="sm" variant="secondary" onClick={handleCloseModal}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={handleSaveDivision} disabled={saving}>
            {saving ? <Spinner animation="border" size="sm" className="me-1" /> : editingDivision ? "Update" : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
