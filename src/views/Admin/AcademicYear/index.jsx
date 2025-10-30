import React, { useEffect, useState } from "react";


const AcademicManager = () => {
  const [academics, setAcademics] = useState([]);
  const [editingItem, setEditingItem] = useState(null); // Item being edited
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [formData, setFormData] = useState({
    year: "",
    start_date: "",
    end_date: "",
    status: "Upcoming",
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: "", message: "" }), 3000);
  };

  // --- Data Fetching ---
  const fetchAcademics = async () => {
    setLoading(true);
    try {
      const data = await getAcademics();
      setAcademics(data);
    } catch (err) {
      showAlert("danger", err.message || "Failed to fetch academic years.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademics();
  }, []);

  // --- Form Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      year: item.year,
      start_date: item.start_date, // Ensure API returns YYYY-MM-DD
      end_date: item.end_date,     // Ensure API returns YYYY-MM-DD
      status: item.status,
    });
  };

  const handleClear = () => {
    setEditingItem(null);
    setFormData({
      year: "",
      start_date: "",
      end_date: "",
      status: "Upcoming",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic date validation
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      showAlert("danger", "End date must be after the start date.");
      return;
    }

    try {
      if (editingItem) {
        await updateAcademic(editingItem.id, formData);
        showAlert("success", `Academic Year ${formData.year} updated successfully.`);
      } else {
        await createAcademic(formData);
        showAlert("success", `Academic Year ${formData.year} created successfully.`);
      }
      
      fetchAcademics();
      handleClear();

    } catch (err) {
      showAlert("danger", err.message || "Error saving record.");
    }
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this academic year?")) return;
    try {
      await deleteAcademic(id);
      showAlert("warning", "Record deleted successfully.");
      fetchAcademics();
    } catch (err) {
      showAlert("danger", err.message || "Error deleting record.");
    }
  };

  // Helper for status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case "active": return "badge bg-success";
      case "completed": return "badge bg-secondary";
      case "upcoming": return "badge bg-info text-dark";
      default: return "badge bg-light text-dark";
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4 text-center">📅 Academic Year Management</h2>
      <hr />

      {/* Alert */}
      {alert.message && (
        <div className={`alert alert-${alert.type} fade show`} role="alert">
          {alert.message}
        </div>
      )}

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="border p-4 rounded bg-light shadow-sm mb-4">
        <h5>{editingItem ? "✏️ Update Academic Year" : "➕ Create New Academic Year"}</h5>
        <div className="row g-3 mt-2">
          
          <div className="col-md-3">
            <label className="form-label">Year</label>
            <input 
              type="number" 
              name="year" 
              className="form-control" 
              placeholder="e.g., 2026" 
              value={formData.year} 
              onChange={handleChange} 
              required 
              min="2000"
            />
          </div>
          
          <div className="col-md-3">
            <label className="form-label">Start Date</label>
            <input 
              type="date" 
              name="start_date" 
              className="form-control" 
              value={formData.start_date} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="col-md-3">
            <label className="form-label">End Date</label>
            <input 
              type="date" 
              name="end_date" 
              className="form-control" 
              value={formData.end_date} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select 
              name="status" 
              className="form-control" 
              value={formData.status} 
              onChange={handleChange} 
              required
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <button type="submit" className="btn btn-primary me-2">
            {editingItem ? "Save Changes" : "Create Record"}
          </button>
          {editingItem && (
            <button type="button" className="btn btn-secondary" onClick={handleClear}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table Section */}
      {loading ? (
        <div className="text-center my-5">Loading academic years...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-striped text-center align-middle shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {academics.length > 0 ? (
                academics.map((item) => (
                  <tr key={item.id} className={editingItem?.id === item.id ? "table-info" : ""}>
                    <td>{item.id}</td>
                    <td>{item.year}</td>
                    <td>{item.start_date}</td>
                    <td>{item.end_date}</td>
                    <td><span className={getStatusBadgeClass(item.status)}>{item.status}</span></td>
                    <td>
                      <button 
                        className="btn btn-warning btn-sm me-2" 
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No academic years found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AcademicManager;