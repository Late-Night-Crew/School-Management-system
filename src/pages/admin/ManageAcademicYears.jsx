import { useEffect, useState } from "react";
import {
  createAcademicYear,
  deleteAcademicYear,
  listAcademicYears,
  updateAcademicYear,
} from "../../api/academicYears";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import { formatDate } from "../../utils/format";
import { Badge, Button, Card, Field, IconButton, Input, Notice, Page, Select, Table } from "../../components/ui";

// Must match the academic_years.status check constraint in the database
const STATUSES = ["Upcoming", "Active", "Completed"];
const STATUS_TONES = { Upcoming: "blue", Active: "green", Completed: "slate" };
const NOTICE_TONES = { success: "green", warning: "amber", danger: "red" };

const ManageAcademicYears = () => {
  const [academics, setAcademics] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [deleting, setDeleting] = useState(null);
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
      const data = await listAcademicYears();
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
      start_date: item.start_date,
      end_date: item.end_date,
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
  
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      showAlert("danger", "End date must be after the start date.");
      return;
    }
  
    try {
      // Ensure 'year' is sent as an integer
      const payload = { ...formData, year: parseInt(formData.year, 10) };
  
      if (editingItem) {
        await updateAcademicYear(editingItem.id, payload);
        showAlert("success", `Academic Year ${payload.year} updated successfully.`);
      } else {
        await createAcademicYear(payload);
        showAlert("success", `Academic Year ${payload.year} created successfully.`);
      }
  
      fetchAcademics();
      handleClear();
    } catch (err) {
      showAlert("danger", err.message || "Error saving record.");
    }
  };
  

  const handleDelete = async () => {
    const id = deleting.id;
    setDeleting(null);
    try {
      await deleteAcademicYear(id);
      showAlert("warning", "Record deleted successfully.");
      fetchAcademics();
    } catch (err) {
      showAlert("danger", err.message || "Error deleting record.");
    }
  };

  const activeYear = academics.find((a) => a.status === "Active");

  return (
    <Page
      icon="bi-calendar4-week"
      title="Academic Years"
      subtitle="School years and their dates. Schools record enrolment and marks against the active year."
      stats={[
        { label: "Years", value: academics.length },
        { label: "Active", value: activeYear ? activeYear.year : "None" },
      ]}
    >
      {alert.message && <Notice tone={NOTICE_TONES[alert.type]}>{alert.message}</Notice>}

      <form onSubmit={handleSubmit}>
        <Card
          accent={editingItem ? "amber" : "green"}
          icon={editingItem ? "bi-pencil-square" : "bi-plus-circle"}
          title={editingItem ? `Update Academic Year ${editingItem.year}` : "Create New Academic Year"}
          subtitle="The end date must be after the start date"
          footer={
            <>
              {editingItem && (
                <Button variant="ghost" onClick={handleClear}>
                  Cancel
                </Button>
              )}
              <Button type="submit" icon={editingItem ? "bi-check-lg" : "bi-plus-lg"}>
                {editingItem ? "Save Changes" : "Create Record"}
              </Button>
            </>
          }
        >
          <div className="ui-grid ui-cols-4">
            <Field label="Year" required>
              <Input
                type="number"
                name="year"
                placeholder="e.g., 2026"
                value={formData.year}
                onChange={handleChange}
                required
                min="2000"
              />
            </Field>
            <Field label="Start Date" required>
              <Input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
            </Field>
            <Field label="End Date" required>
              <Input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
            </Field>
            <Field label="Status" required>
              <Select name="status" value={formData.status} onChange={handleChange} required>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      </form>

      <Card accent="blue" icon="bi-list-ul" title="All Academic Years" flush>
        <DataState loading={loading} empty={academics.length === 0} emptyMessage="No academic years found.">
          <Table>
            <thead>
              <tr>
                <th className="num">ID</th>
                <th>Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {academics.map((item) => (
                <tr key={item.id}>
                  <td className="num">{item.id}</td>
                  <td className="strong">
                    {item.year} {editingItem?.id === item.id && <Badge tone="amber">Editing</Badge>}
                  </td>
                  <td>{formatDate(item.start_date)}</td>
                  <td>{formatDate(item.end_date)}</td>
                  <td><Badge tone={STATUS_TONES[item.status]}>{item.status}</Badge></td>
                  <td className="end">
                    <IconButton kind="edit" title={`Edit ${item.year}`} onClick={() => handleEdit(item)} />
                    <IconButton kind="delete" title={`Delete ${item.year}`} onClick={() => setDeleting(item)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataState>
      </Card>

      <ConfirmModal
        show={!!deleting}
        onHide={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Academic Year"
        confirmLabel="Delete"
        body={deleting && `Are you sure you want to delete academic year ${deleting.year}?`}
      />
    </Page>
  );
};

export default ManageAcademicYears;
