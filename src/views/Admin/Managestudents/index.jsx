// src/views/Admin/components/ManageStudents.jsx
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table, Spinner, Row, Col } from "react-bootstrap";
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../services/studentService";
import { fetchregions } from "../services/divisionService";
import { fetchSchools } from "../services/schoolService";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [regions, setRegions] = useState([]);
  const [schools, setSchools] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [formData, setFormData] = useState({
    student_number: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    previous_school: "",
    guardian_name: "",
    form_level: 1,
    status: "active",
    school_id: "",
    academic_year_id: 1,
    region_id: "",
  });

  // ✅ Load students, regions, and all schools initially
  useEffect(() => {
    loadStudents();
    loadRegions();
    loadAllSchools();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await fetchregions();
      setRegions(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load regions");
    }
  };

  // ✅ Fetch all schools (for table mapping)
  const loadAllSchools = async () => {
    try {
      const data = await fetchSchools(); // Fetch all schools, no region filter
      setSchools(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load schools");
    }
  };

  // ✅ Load schools for a selected region (for modal dropdown)
  const handleRegionChange = async (regionId) => {
    setFormData((prev) => ({ ...prev, region_id: regionId, school_id: "" }));
    if (!regionId) {
      setSchools([]);
      return;
    }
    try {
      const data = await fetchSchools(regionId);
      setSchools(data);
    } catch (error) {
      console.error(error);
      alert("Failed to load schools for selected region");
    }
  };

  // ✅ Open modal for add/edit
  const handleShowModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        ...student,
        region_id: student.region_id || "",
        form_level: parseInt(student.form_level, 10),
      });
      handleRegionChange(student.region_id);
    } else {
      setEditingStudent(null);
      setFormData({
        student_number: "",
        first_name: "",
        last_name: "",
        gender: "",
        date_of_birth: "",
        previous_school: "",
        guardian_name: "",
        form_level: 1,
        status: "active",
        school_id: "",
        academic_year_id: 1,
        region_id: "",
      });
      setSchools([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "region_id") handleRegionChange(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Save student
  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.student_number) {
      alert("Please fill required fields");
      return;
    }

    try {
      setLoading(true);
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
      } else {
        await createStudent(formData);
      }
      await loadStudents();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert("Failed to save student");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteStudent(id);
      setStudents(students.filter((s) => s.id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete student");
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold">Manage Students</h3>
        <Button variant="primary" onClick={() => handleShowModal()}>
          Add Student
        </Button>
      </div>

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" />
          <p>Loading students...</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark text-center">
            <tr>
              <th>#</th>
              <th>Student No</th>
              <th>Full Name</th>
              <th>Gender</th>
              <th>Form</th>
              <th>School</th>
              <th>Status</th>
              <th>Date of Birth</th>
              <th>Guardian</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {students.length === 0 ? (
              <tr>
                <td colSpan="10">No students found</td>
              </tr>
            ) : (
              students.map((student, index) => {
                const schoolName =
                  schools.find((s) => s.id === student.school_id)?.name || "—";
                return (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.student_number}</td>
                    <td>{`${student.first_name} ${student.last_name}`}</td>
                    <td>{student.gender}</td>
                    <td>{student.form_level}</td>
                    <td>{schoolName}</td>
                    <td>
                      <span
                        className={`badge ${
                          student.status === "active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td>{student.date_of_birth}</td>
                    <td>{student.guardian_name || "—"}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="warning"
                        className="me-2"
                        onClick={() => handleShowModal(student)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(student.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingStudent ? "Edit Student" : "Add Student"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Student Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="student_number"
                    value={formData.student_number}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Form Level</Form.Label>
                  <Form.Select
                    name="form_level"
                    value={formData.form_level}
                    onChange={handleChange}
                  >
                    <option value={1}>Form 1</option>
                    <option value={2}>Form 2</option>
                    <option value={3}>Form 3</option>
                    <option value={4}>Form 4</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date of Birth</Form.Label>
              <Form.Control
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Region</Form.Label>
              <Form.Select
                name="region_id"
                value={formData.region_id}
                onChange={handleChange}
              >
                <option value="">Select Region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>School</Form.Label>
              <Form.Select
                name="school_id"
                value={formData.school_id}
                onChange={handleChange}
              >
                <option value="">Select School</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Guardian Name</Form.Label>
              <Form.Control
                type="text"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleSave}>
            {loading ? <Spinner size="sm" /> : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
