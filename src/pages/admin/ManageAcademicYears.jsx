import { useEffect, useState } from "react";
import {
  createAcademicYear,
  deleteAcademicYear,
  listAcademicYears,
  listTermDates,
  updateAcademicYear,
} from "../../api/academicYears";
import TermDatesDialog from "./TermDatesDialog";
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
  const [termDates, setTermDates] = useState([]);
  const [datingYear, setDatingYear] = useState(null);
  const blankTerms = () => [1, 2, 3].map((term) => ({ term, start_date: "", end_date: "" }));
  const [formData, setFormData] = useState({
    year: "",
    start_date: "",
    end_date: "",
    status: "Upcoming",
  });
  // A new year must say when each term runs (edit an existing year's terms with the calendar icon)
  const [terms, setTerms] = useState(blankTerms);
  const setTerm = (term, field) => (e) =>
    setTerms((list) => list.map((t) => (t.term === term ? { ...t, [field]: e.target.value } : t)));

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: "", message: "" }), 3000);
  };

  const fetchTermDates = () => listTermDates().then(setTermDates, () => setTermDates([]));

  // --- Data Fetching ---
  const fetchAcademics = async () => {
    setLoading(true);
    fetchTermDates();
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
    setTerms(blankTerms());
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
        if (terms.some((t) => !t.start_date || !t.end_date)) {
          showAlert("danger", "Give the start and end date of all three terms.");
          return;
        }
        await createAcademicYear({ ...payload, terms });
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
          subtitle={
            editingItem
              ? "Change the year's dates; its term dates are edited with the calendar icon in the list"
              : "Set when the year and each of its three terms start and end. Schools cannot move to the next term before it ends, and are reminded as it ends."
          }
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
          {!editingItem && (
            <div className="ui-grid ui-cols-3 mt-3">
              {terms.map((t) => (
                <div key={t.term} className="ui-grid ui-cols-2">
                  <Field label={`Term ${t.term} starts`} required>
                    <Input type="date" min={formData.start_date} max={formData.end_date} value={t.start_date} onChange={setTerm(t.term, "start_date")} required />
                  </Field>
                  <Field label={`Term ${t.term} ends`} required>
                    <Input type="date" min={t.start_date || formData.start_date} max={formData.end_date} value={t.end_date} onChange={setTerm(t.term, "end_date")} required />
                  </Field>
                </div>
              ))}
            </div>
          )}
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
                <th>Terms</th>
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
                  <td>
                    {termDates
                      .filter((t) => t.academic_year_id === item.id)
                      .map((t) => (
                        <div key={t.term} className="ui-hint">
                          Term {t.term}: {formatDate(t.start_date, { day: "numeric", month: "short" })} – {formatDate(t.end_date, { day: "numeric", month: "short" })}
                        </div>
                      ))}
                    {!termDates.some((t) => t.academic_year_id === item.id) && <span className="ui-hint">Not set</span>}
                  </td>
                  <td className="end">
                    <IconButton kind="view" icon="bi-calendar3-range" title={`Set term dates for ${item.year}`} tip="Term dates" onClick={() => setDatingYear(item)} />
                    <IconButton kind="edit" title={`Edit ${item.year}`} onClick={() => handleEdit(item)} />
                    <IconButton kind="delete" title={`Delete ${item.year}`} onClick={() => setDeleting(item)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataState>
      </Card>

      <TermDatesDialog
        year={datingYear}
        dates={termDates}
        onHide={() => setDatingYear(null)}
        onSaved={(message) => {
          setDatingYear(null);
          fetchTermDates();
          showAlert("success", message);
        }}
      />

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
