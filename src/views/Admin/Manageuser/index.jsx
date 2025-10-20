import React, { useState } from "react";
import divisions from "./divisions";

// Example schools data per division and district
const schoolsByDistrict = {
  Southern: {
    Balaka: ["Balaka Primary", "Balaka Secondary"],
    Blantyre: ["Blantyre Primary School", "Blantyre Secondary School"],
    Chikwawa: ["Chikwawa Primary School", "Chikwawa Secondary School"],
    Chiradzulu: ["Chiradzulu School A", "Chiradzulu School B"],
    Machinga: ["Machinga School A", "Machinga School B"],
    Mulanje: ["Mulanje School A", "Mulanje School B"],
    Nsanje: ["Nsanje Primary School", "Nsanje Secondary School"],
    Phalombe: ["Phalombe School A", "Phalombe School B"],
    Thyolo: ["Thyolo School A", "Thyolo School B"],
    Zomba: ["Zomba Primary School", "Zomba Secondary School"],
    Neno: ["Neno School A", "Neno School B"],
    Mwanza: ["Mwanza School A", "Mwanza School B"],
    Mangochi: ["Mangochi School A", "Mangochi School B"],
  },
  Central: {
    Dedza: ["Dedza Primary", "Dedza Secondary"],
    Dowa: ["Dowa Mission School", "Dowa Secondary"],
    Kasungu: ["Kasungu Primary", "Kasungu Secondary School"],
    Lilongwe: ["Lilongwe Primary School", "Lilongwe Secondary School"],
    Mchinji: ["Mchinji School A", "Mchinji School B"],
    Nkhotakota: ["Nkhotakota School A", "Nkhotakota School B"],
    Ntcheu: ["Ntcheu School A", "Ntcheu School B"],
    Ntchisi: ["Ntchisi School A", "Ntchisi School B"],
    Salima: ["Salima School A", "Salima School B"],
  },
  Northern: {
    Chitipa: ["Chitipa School A", "Chitipa School B"],
    Karonga: ["Karonga Secondary", "Karonga Primary"],
    Likoma: ["Likoma School A", "Likoma School B"],
    Mzimba: ["Mzimba School A", "Mzimba School B"],
    "Nkhata Bay": ["Nkhata Bay School A", "Nkhata Bay School B"],
    Rumphi: ["Rumphi Primary School", "Rumphi Secondary School"],
  },
};

export default function ManageUser() {
  const [users, setUsers] = useState([]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    role: "",
    division: "",
    district: "",
    school: "",
    email: "",
    assignedSchools: [],
    assignedDistricts: [],
  });

  // Generate random 6-character password
  const generatePassword = (firstname, lastname) => {
    const lettersPart =
      firstname.slice(0, 3).toLowerCase() + lastname.slice(0, 2).toLowerCase();
    const randomNumbers = Math.floor(100000 + Math.random() * 900000)
      .toString()
      .slice(0, 3);
    return lettersPart + randomNumbers;
  };

  const showAlert = (type, message) => {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "division") {
      const districts = divisions[value] || [];
      setSelectedDistricts(districts);
      setSelectedSchools([]); // Reset schools until district is selected
      setFormData({
        ...formData,
        division: value,
        district: "",
        school: "",
      });
    } else if (name === "district") {
      const schools = schoolsByDistrict[formData.division]?.[value] || [];
      setSelectedSchools(schools);
      setFormData({ ...formData, district: value, school: "" });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { firstname, lastname, role, division, district, email, school } = formData;

    if (!firstname || !lastname || !role || !email || !division) {
      showAlert("danger", "⚠️ Please fill in all required fields.");
      return;
    }

    let assignedSchools = [];
    let assignedDistricts = [];

    if (role === "Division Admin") {
      assignedDistricts = divisions[division] || [];
      assignedSchools = assignedDistricts
        .flatMap((d) => schoolsByDistrict[division]?.[d] || []);
    }

    if (role === "Headteacher" && !school) {
      showAlert("danger", "⚠️ Please select a school for the headteacher.");
      return;
    }

    if (editingUser) {
      const updatedUsers = users.map((u) =>
        u.id === editingUser
          ? { ...formData, id: editingUser, assignedSchools, assignedDistricts }
          : u
      );
      setUsers(updatedUsers);
      showAlert("success", "✅ User updated successfully!");
      setEditingUser(null);
    } else {
      const password = generatePassword(firstname, lastname);
      const newUser = {
        ...formData,
        assignedSchools,
        assignedDistricts,
        password,
        id: Date.now(),
      };
      setUsers([...users, newUser]);
      showAlert("success", "✅ User added successfully!");
    }

    setFormData({
      firstname: "",
      middlename: "",
      lastname: "",
      role: "",
      division: "",
      district: "",
      school: "",
      email: "",
      assignedSchools: [],
      assignedDistricts: [],
    });
    setSelectedDistricts([]);
    setSelectedSchools([]);
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setFormData(user);
    setSelectedDistricts(divisions[user.division] || []);
    if (user.role === "Headteacher" && user.district) {
      setSelectedSchools(schoolsByDistrict[user.division]?.[user.district] || []);
    }
    showAlert("info", "✏️ You are now editing this user.");
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== id));
      showAlert("warning", "⚠️ User deleted successfully!");
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4 text-center fw-bold text-primary">
        <i className="bi bi-person-gear me-2"></i>Manage Users
      </h3>

      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`}>
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ show: false, type: "", message: "" })}
          ></button>
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white fw-semibold">
          {editingUser ? "Edit User" : "Add New User"}
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">First Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Middle Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="middlename"
                  value={formData.middlename}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Last Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Role *</label>
                <select
                  className="form-select"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Role --</option>
                  <option value="Division Admin">Division Admin</option>
                  <option value="Headteacher">Headteacher</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Division *</label>
                <select
                  className="form-select"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Division --</option>
                  <option value="Southern">Southern</option>
                  <option value="Central">Central</option>
                  <option value="Northern">Northern</option>
                </select>
              </div>

              {formData.role !== "Division Admin" && (
                <div className="col-md-4">
                  <label className="form-label fw-semibold">District *</label>
                  <select
                    className="form-select"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select District --</option>
                    {selectedDistricts.map((district, idx) => (
                      <option key={idx} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === "Headteacher" && (
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Select School *</label>
                  <select
                    className="form-select"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select School --</option>
                    {selectedSchools.map((school, idx) => (
                      <option key={idx} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-md-4">
                <label className="form-label fw-semibold">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="text-end mt-4">
              <button type="submit" className="btn btn-success px-4 fw-semibold">
                <i className="bi bi-save me-2"></i>
                {editingUser ? "Update User" : "Add User"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header bg-secondary text-white fw-semibold">
          Users List
        </div>
        <div className="card-body p-0">
          <table className="table table-striped table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Division</th>
                <th>District</th>
                <th>School(s)</th>
                <th>Email</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <i className="bi bi-info-circle me-2"></i>No users added yet.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>
                      {user.firstname} {user.middlename} {user.lastname}
                    </td>
                    <td>{user.role}</td>
                    <td>{user.division}</td>
                    <td>{user.role === "Division Admin" ? user.assignedDistricts?.join(", ") : user.district || "-"}</td>
                    <td>
                      {user.role === "Division Admin"
                        ? user.assignedSchools?.join(", ")
                        : user.school || "-"}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <code>{user.password}</code>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleEdit(user)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(user.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
