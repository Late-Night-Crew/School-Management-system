import { useCallback, useState } from "react";

import { createSubject, deleteSubject, listSubjects, updateSubject } from "../../api/subjects";
import useAsync from "../../hooks/useAsync";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import ToastNote from "../../components/ToastNote";
import { Badge, Button, Card, Dialog, Field, IconButton, Input, Page, SearchInput, Table, Textarea } from "../../components/ui";

const BLANK = { code: "", name: "", description: "" };

// Subjects offered nationally. Schools pick from these when registering students,
// and marks are recorded per subject.
export default function ManageSubjects() {
  const subjects = useAsync(useCallback(() => listSubjects(), []));
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null: closed, {}: new, subject: edit
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });
  const showToast = (message, variant = "success") => setToast({ show: true, message, variant });

  const openForm = (subject = {}) => {
    setEditing(subject);
    setForm({ code: subject.code || "", name: subject.name || "", description: subject.description || "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
    };
    setSaving(true);
    try {
      if (editing.id) {
        await updateSubject(editing.id, payload);
        showToast(`${payload.name} updated.`);
      } else {
        await createSubject(payload);
        showToast(`${payload.name} added.`);
      }
      setEditing(null);
      subjects.reload();
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const subject = deleting;
    setDeleting(null);
    try {
      await deleteSubject(subject.id);
      showToast(`${subject.name} deleted.`);
      subjects.reload();
    } catch (err) {
      showToast(err.message, "danger");
    }
  };

  const all = subjects.data || [];
  const term = search.trim().toLowerCase();
  const visible = all.filter((s) => s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term));

  return (
    <Page
      icon="bi-book-half"
      title="Subjects"
      subtitle="Subjects schools can register students for and record marks in."
      stats={[{ label: "Subjects", value: subjects.loading ? null : all.length }]}
      actions={
        <Button variant="ghost" icon="bi-plus-lg" onClick={() => openForm()}>
          Add Subject
        </Button>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Subjects"
        subtitle={`${visible.length} of ${all.length} shown`}
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Search by name or code…" />}
        flush
      >
        <DataState
          loading={subjects.loading}
          error={subjects.error}
          onRetry={subjects.reload}
          empty={visible.length === 0}
          emptyMessage={search ? "No subjects match your search." : "No subjects yet."}
        >
          <Table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Description</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id}>
                  <td><Badge tone="blue">{s.code}</Badge></td>
                  <td className="strong">{s.name}</td>
                  <td>{s.description || "-"}</td>
                  <td className="end">
                    <IconButton kind="edit" title={`Edit ${s.name}`} onClick={() => openForm(s)} />
                    <IconButton kind="delete" title={`Delete ${s.name}`} onClick={() => setDeleting(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataState>
      </Card>

      <Dialog
        show={!!editing}
        onHide={() => setEditing(null)}
        title={editing?.id ? "Edit Subject" : "Add Subject"}
        icon="bi-book"
        as="form"
        onSubmit={handleSave}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit" icon="bi-check-lg" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </>
        }
      >
        <div className="ui-grid">
          <Field label="Code" required>
            <Input
              value={form.code}
              maxLength={50}
              placeholder="e.g. MATH"
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              required
            />
          </Field>
          <Field label="Name" required>
            <Input
              value={form.name}
              maxLength={150}
              placeholder="e.g. Mathematics"
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </Field>
        </div>
      </Dialog>

      <ConfirmModal
        show={!!deleting}
        onHide={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        confirmLabel="Delete"
        body={deleting && `Delete ${deleting.name}? Students lose this subject and every mark recorded in it is deleted.`}
      />
    </Page>
  );
}
