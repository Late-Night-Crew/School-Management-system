import React, { useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function DivisionManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [divisions, setDivisions] = useState([
    { id: 1, name: "Northern Division", },
    { id: 2, name: "Central Division", },
    { id: 3, name: "Southern Division" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
  });

  // Open modal (Add/Edit)
  const handleShowModal = (division = null) => {
    if (division) {
      setEditingDivision(division);
      setFormData({
        name: division.name,
      });
    } else {
      setEditingDivision(null);
      setFormData({
        name: "",
      });
    }
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDivision(null);
  };

  // Save Division
  const handleSaveDivision = () => {
    if (!formData.name) {
      alert("Please fill the name fields.");
      return;
    }

    if (editingDivision) {
      setDivisions(
        divisions.map((div) =>
          div.id === editingDivision.id ? { ...div, ...formData } : div
        )
      );
    } else {
      const newDivision = {
        id: Date.now(),
        ...formData,
      };
      setDivisions([...divisions, newDivision]);
    }
    handleCloseModal();
  };

  // Delete Division
  const handleDeleteDivision = (id) => {
    if (window.confirm("Are you sure you want to delete this division?")) {
      setDivisions(divisions.filter((div) => div.id !== id));
    }
  };

  // Filter Divisions
  const filteredDivisions = divisions.filter((division) =>
    division.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">Division Management</h4>
        <Button
          variant="primary"
          className="d-flex align-items-center"
          onClick={() => handleShowModal()}
        >
          <i className="bi bi-plus-lg me-2"></i> Add Division
        </Button>
      </div>

      {/* Search Input */}
      <div className="mb-3" style={{ maxWidth: "350px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search Division..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Division Table */}
      <Table hover responsive bordered className="shadow-sm">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Division Name</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDivisions.length > 0 ? (
            filteredDivisions.map((division, index) => (
              <tr key={division.id}>
                <td>{index + 1}</td>
                <td>{division.name}</td>
                <td className="text-center">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleShowModal(division)}
                  >
                    <i className="bi bi-pencil-square"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteDivision(division.id)}
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No divisions found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingDivision ? "Edit Division" : "Add Division"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Division Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter division name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </Form.Group>

            
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveDivision}>
            {editingDivision ? "Update" : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
