import React, { useEffect, useState, useMemo } from "react";
import { Modal, Button, Form, Table, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import {
  fetchSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from "../services/schoolService";
import { fetchregions } from "../services/divisionService";
import { fetchDistricts } from "../services/districtService";

export default function ManageSchools() {
  const [schools, setSchools] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    schoolNumber: "",
    region_id: "",
    district_id: "",
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    loadSchools();
    loadRegions();
    loadDistricts();
  }, []);

  const loadSchools = async () => {
    setLoadingSchools(true);
    try {
      const data = await fetchSchools();
      setSchools(data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await fetchregions();
      setRegions(data || []);
    } catch (error) {
      alert("Failed to load regions");
    }
  };

  const loadDistricts = async () => {
    try {
      const data = await fetchDistricts();
      setDistricts(data || []);
    } catch (error) {
      alert("Failed to load districts");
    }
  };

  const handleShowModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        name: school.name,
        schoolNumber: school.schoolNumber || "",
        region_id: districts.find(d => d.id === school.district_id)?.region_id || "",
        district_id: school.district_id,
      });
    } else {
      setEditingSchool(null);
      setFormData({ name: "", schoolNumber: "", region_id: "", district_id: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSchool(null);
    setFormData({ name: "", schoolNumber: "", region_id: "", district_id: "" });
  };

  const handleSaveSchool = async () => {
    if (!formData.name || !formData.district_id) {
      alert("Please fill all required fields");
      return;
    }
    try {
      setSavingSchool(true);
      if (editingSchool) {
        await updateSchool(editingSchool.id, formData);
      } else {
        await createSchool(formData);
      }
      await loadSchools();
      handleCloseModal();
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingSchool(false);
    }
  };

  const handleDeleteSchool = async (id) => {
    try {
      setLoadingSchools(true);
      await deleteSchool(id);
      await loadSchools();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingSchools(false);
    }
  };

  // Show confirmation modal
  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmModal.onConfirm) confirmModal.onConfirm();
    setConfirmModal({ ...confirmModal, show: false });
  };

  const handleCancel = () => {
    setConfirmModal({ ...confirmModal, show: false });
  };

  const filteredSchools = useMemo(
    () =>
      schools.filter((school) =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [schools, searchTerm]
  );

  const filteredDistricts = useMemo(
    () =>
      formData.region_id
        ? districts.filter((d) => Number(d.region_id) === Number(formData.region_id))
        : [],
    [districts, formData.region_id]
  );

  const getRegionName = (districtId) => {
    const district = districts.find((d) => d.id === districtId);
    if (!district) return "-";
    const region = regions.find((r) => r.id === district.region_id);
    return region?.name || "-";
  };

  const getDistrictName = (districtId) =>
    districts.find((d) => d.id === districtId)?.name || "-";

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">Manage Schools</h4>
        <Button variant="primary" onClick={() => handleShowModal()}>
          <i className="bi bi-plus-lg me-2"></i> Add School
        </Button>
      </div>

      <div className="mb-3" style={{ maxWidth: "350px" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search School..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loadingSchools && (
        <div className="text-center my-3">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loadingSchools && (
        <Table hover responsive bordered className="shadow-sm">
          <thead className="table-light text-center">
            <tr>
              <th>#</th>
              <th>School Name</th>
              <th>School Number</th>
              <th>Region</th>
              <th>District</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.length > 0 ? (
              filteredSchools.map((school, index) => (
                <tr key={school.id}>
                  <td className="text-center">{index + 1}</td>
                  <td>{school.name}</td>
                  <td>{school.schoolNumber}</td>
                  <td>{getRegionName(school.district_id)}</td>
                  <td>{getDistrictName(school.district_id)}</td>
                  <td className="text-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleShowModal(school)}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() =>
                        showConfirm(
                          "Are you sure you want to delete this school?",
                          () => handleDeleteSchool(school.id)
                        )
                      }
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
                  No schools found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      {/* School Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingSchool ? "Edit School" : "Add School"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Region (Division)</Form.Label>
              <Form.Select
                value={formData.region_id}
                onChange={(e) =>
                  setFormData({ ...formData, region_id: Number(e.target.value), district_id: "" })
                }
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>District</Form.Label>
              <Form.Select
                value={formData.district_id}
                onChange={(e) =>
                  setFormData({ ...formData, district_id: Number(e.target.value) })
                }
                disabled={!formData.region_id}
              >
                <option value="">
                  {formData.region_id ? "Select District" : "Select Region first"}
                </option>
                {filteredDistricts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>School Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter school name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>School Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter school number"
                value={formData.schoolNumber}
                onChange={(e) =>
                  setFormData({ ...formData, schoolNumber: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveSchool} disabled={savingSchool}>
            {savingSchool ? <Spinner animation="border" size="sm" /> : editingSchool ? "Update" : "Save"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal */}
      <Modal show={confirmModal.show} onHide={handleCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>{confirmModal.message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
