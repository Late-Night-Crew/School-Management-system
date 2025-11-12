import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Table, Button, Modal, Form } from "react-bootstrap";
import {
  fetchAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear
} from "../services/academicYearService";

const ManageAcademicYears = () => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [formData, setFormData] = useState({
    year: "",
    start_date: "",
    end_date: "",
    status: "Active"
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAcademicYears();
    setAcademicYears(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (year = null) => {
    setEditingYear(year);
    if (year) {
      setFormData({
        year: year.year,
        start_date: year.start_date,
        end_date: year.end_date,
        status: year.status
      });
    } else {
      setFormData({
        year: "",
        start_date: "",
        end_date: "",
        status: "Active"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!formData.year || !formData.start_date || !formData.end_date) {
      alert("Please fill all required fields");
      return;
    }

    let result;
    if (editingYear) {
      result = await updateAcademicYear(editingYear.id, formData);
    } else {
      result = await createAcademicYear(formData);
    }

    if (result) {
      loadData();
      handleCloseModal();
    } else {
      alert("Failed to save academic year");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this academic year?")) return;
    const success = await deleteAcademicYear(id);
    if (success) loadData();
    else alert("Failed to delete academic year");
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Academic Years</h2>
        <Button variant="primary" onClick={() => handleOpenModal()}>Add Academic Year</Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Year</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" className="text-center">Loading...</td></tr>
          ) : academicYears.length === 0 ? (
            <tr><td colSpan="5" className="text-center">No academic years found</td></tr>
          ) : (
            academicYears.map((ay) => (
              <tr key={ay.id}>
                <td>{ay.year}</td>
                <td>{ay.start_date}</td>
                <td>{ay.end_date}</td>
                <td>{ay.status}</td>
                <td>
                  <Button size="sm" variant="info" className="me-2" onClick={() => handleOpenModal(ay)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(ay.id)}>Delete</Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingYear ? "Edit Academic Year" : "Add Academic Year"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Year</Form.Label>
              <Form.Control type="number" name="year" value={formData.year} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>{editingYear ? "Update" : "Create"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManageAcademicYears;
