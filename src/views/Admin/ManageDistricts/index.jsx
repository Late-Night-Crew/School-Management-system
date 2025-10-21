import React, { useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function DistrictManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [districts, setDistricts] = useState([
    { id: 1, name: "Blantyre", region: "Southern Division" },
    { id: 2, name: "Lilongwe", region: "Central Division" },
    { id: 3, name: "Mzuzu", region: "Northern Division" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    region: "",
  });

  // Open modal (Add or Edit)
  const handleShowModal = (district = null) => {
    if (district) {
      setEditingDistrict(district);
      setFormData({ name: district.name, region: district.region });
    } else {
      setEditingDistrict(null);
      setFormData({ name: "", region: "" });
    }
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDistrict(null);
  };

  // Save District
  const handleSaveDistrict = () => {
    if (!formData.name || !formData.region) {
      alert("Please fill in all fields");
      return;
    }

    if (editingDistrict) {
      // Update existing
      setDistricts(
        districts.map((d) =>
          d.id === editingDistrict.id ? { ...d, ...formData } : d
        )
      );
    } else {
      // Add new
      const newDistrict = {
        id: Date.now(),
        ...formData,
      };
      setDistricts([...districts, newDistrict]);
    }

    handleCloseModal();
  };

  // Delete District
  const handleDeleteDistrict = (id) => {
    if (window.confirm("Are you sure you want to delete this district?")) {
      setDistricts(districts.filter((d) => d.id !== id));
    }
  };

  // Filter Districts by search
  const filteredDistricts = districts.filter((district) =>
    district.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">District Management</h4>
        <Button
          variant="primary"
          className="d-flex align-items-center"
          onClick={() => handleShowModal()}
        >
          <i className="bi bi-plus-lg me-2"></i> Add District
        </Button>
      </div>

      {/* Search Input */}
      <div className="mb-3" style={{ maxWidth: "350px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search District..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Districts Table */}
      <Table hover responsive bordered className="shadow-sm">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>District Name</th>
            <th>Division (Region)</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDistricts.length > 0 ? (
            filteredDistricts.map((district, index) => (
              <tr key={district.id}>
                <td>{index + 1}</td>
                <td>{district.name}</td>
                <td>{district.region}</td>
                <td className="text-center">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowModal(district)}
                  >
                    <i className="bi bi-pencil-square"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteDistrict(district.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No districts found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add/Edit District Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDistrict ? "Edit District" : "Add District"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>District Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter district name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Region (Division)</Form.Label>
              <Form.Select
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
              >
                <option value="">Select Region</option>
                <option value="Northern Region">Northern Division  (Region)</option>
                <option value="Central Region">Central Division  (Region)</option>
                <option value="Southern Region">Southern Division  (Region)</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveDistrict}>
            {editingDistrict ? "Update" : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
