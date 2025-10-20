import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  PencilSquare,
  TrashFill,
  PlusCircle,
  ArrowCounterclockwise,
} from "react-bootstrap-icons";
import divisions from "../Manageuser/divisions"; // 👈 import divisions data

export default function ManageSchool() {
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    number: "",
    division: "",
    district: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);

  // show temporary alert
  const showAlert = (message, type = "info") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 2500);
  };

  // handle form field changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    // Reset district when division changes
    if (e.target.name === "division") {
      setForm((prev) => ({ ...prev, district: "" }));
    }
  };

  // handle submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.number || !form.division || !form.district) {
      showAlert("⚠️ Please fill in all required fields!", "warning");
      return;
    }

    if (isEditing) {
      setSchools((prev) =>
        prev.map((school) => (school.id === form.id ? form : school))
      );
      showAlert("✅ School updated successfully!", "success");
      setIsEditing(false);
    } else {
      setSchools([...schools, { ...form, id: Date.now() }]);
      showAlert("🎉 School added successfully!", "success");
    }

    setForm({ id: null, name: "", number: "", division: "", district: "" });
  };

  // handle edit
  const handleEdit = (school) => {
    setForm(school);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // handle delete
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this school?")) {
      setSchools((prev) => prev.filter((school) => school.id !== id));
      showAlert("🗑️ School deleted successfully!", "danger");
    }
  };

  // handle reset
  const handleReset = () => {
    setForm({ id: null, name: "", number: "", division: "", district: "" });
    setIsEditing(false);
  };

  // get district options for selected division
  const districtOptions = divisions[form.division] || [];

  return (
    <div className="container py-4">
      <div className="text-center mb-4">
        <h2 className="fw-bold text-primary">Manage Schools</h2>
      </div>

      {/* Bootstrap Alert */}
      {alert && (
        <div
          className={`alert alert-${alert.type} text-center fw-semibold`}
          role="alert"
        >
          {alert.message}
        </div>
      )}

      {/* Form Section */}
      <div className="card shadow-sm mb-5">
        <div className="card-header bg-primary text-white fw-semibold">
          {isEditing ? "Edit School" : "Add New School"}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">School Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter school name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">School Number</label>
                <input
                  type="text"
                  name="number"
                  value={form.number}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="Enter school number"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Division</label>
                <select
                  name="division"
                  value={form.division}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">-- Select Division --</option>
                  {Object.keys(divisions).map((division, index) => (
                    <option key={index} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">District</label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className="form-select"
                  disabled={!form.division}
                >
                  <option value="">
                    {form.division
                      ? "-- Select District --"
                      : "Select a Division first"}
                  </option>
                  {districtOptions.map((district, index) => (
                    <option key={index} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 d-flex justify-content-center gap-3 mt-3">
                <button type="submit" className="btn btn-primary px-4">
                  <PlusCircle className="me-2" size={18} />
                  {isEditing ? "Update School" : "Add School"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary px-4"
                >
                  <ArrowCounterclockwise className="me-2" size={18} /> Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Table Section */}
      <div className="card shadow-sm">
        <div className="card-header bg-light fw-semibold">
          <i className="bi bi-list-task me-2"></i> Schools List
        </div>
        <div className="card-body">
          {schools.length === 0 ? (
            <p className="text-center text-muted py-4">
              No schools added yet. Use the form above to add one.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-bordered align-middle">
                <thead className="table-primary text-center">
                  <tr>
                    <th>#</th>
                    <th>School Name</th>
                    <th>School Number</th>
                    <th>Division</th>
                    <th>District</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((school, index) => (
                    <tr key={school.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{school.name}</td>
                      <td>{school.number}</td>
                      <td>{school.division}</td>
                      <td>{school.district}</td>
                      <td className="text-center">
                        <button
                          onClick={() => handleEdit(school)}
                          className="btn btn-warning btn-sm me-2 text-white"
                        >
                          <PencilSquare size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(school.id)}
                          className="btn btn-danger btn-sm"
                        >
                          <TrashFill size={16} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
