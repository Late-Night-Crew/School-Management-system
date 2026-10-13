import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { listDistricts } from "../../api/districts";
import { listRegions } from "../../api/regions";
import {
  createSchoolRequest,
  getSchoolRequest,
  notifySchoolRequestsChanged,
  submitSchoolRequest,
  updateSchoolRequest,
} from "../../api/schoolRequests";
import useAsync from "../../hooks/useAsync";
import DataState from "../../components/DataState";
import ToastNote from "../../components/ToastNote";
import { Button, Card, Field, IconButton, Input, Notice, Page, Segmented, Select, Table, Textarea } from "../../components/ui";
import { getSession } from "../../auth/session";
import { downloadRequestPdf } from "./requestPdf";
import { FORMS, LOCATIONS, VENUES, emptyForm, requestsBase, totalEnrolment, withDefaults } from "./shared";
import styles from "./SchoolRequests.module.css";

// Sets a value at a dotted path ("head_teacher.name") in a copy of the form
function setPath(form, path, value) {
  const [key, child] = path.split(".");
  return child ? { ...form, [key]: { ...form[key], [child]: value } } : { ...form, [key]: value };
}

const numberOrNull = (text) => (text === "" ? null : Number(text));

// The online registration form for a new Open Secondary School, filled in by the
// division officer. Saved as a draft until submitted to MCDE.
export default function SchoolRequestForm() {
  const { requestId } = useParams();
  const session = getSession();
  const base = requestsBase(session);
  const navigate = useNavigate();
  const isNew = !requestId;

  const lookups = useAsync(useCallback(() => Promise.all([listDistricts(), listRegions()]), []));
  const existing = useAsync(useCallback(() => (isNew ? Promise.resolve(null) : getSchoolRequest(requestId)), [isNew, requestId]));
  const [districtsAll = [], regions = []] = lookups.data || [];
  const districts = districtsAll
    .filter((d) => String(d.region_id) === String(session.regionId))
    .sort((a, b) => a.name.localeCompare(b.name));
  const regionName = regions.find((r) => String(r.id) === String(session.regionId))?.name || "";

  const [form, setForm] = useState(emptyForm);
  const [savedId, setSavedId] = useState(requestId ? Number(requestId) : null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  useEffect(() => {
    if (existing.data) setForm(withDefaults(existing.data.form));
  }, [existing.data]);

  const set = (path) => (value) => setForm((f) => setPath(f, path, value));
  const onText = (path) => (e) => set(path)(e.target.value);

  const setFacilitator = (index, field, value) =>
    setForm((f) => ({ ...f, facilitators: f.facilitators.map((row, i) => (i === index ? { ...row, [field]: value } : row)) }));
  const addFacilitator = () =>
    setForm((f) => ({ ...f, facilitators: [...f.facilitators, { name: "", qualification: "", subject_combination: "" }] }));
  const removeFacilitator = (index) =>
    setForm((f) => ({ ...f, facilitators: f.facilitators.filter((_, i) => i !== index) }));

  const setMember = (index, value) =>
    setForm((f) => ({ ...f, pta_members: f.pta_members.map((name, i) => (i === index ? value : name)) }));
  const addMember = () => setForm((f) => ({ ...f, pta_members: [...f.pta_members, ""] }));
  const removeMember = (index) => setForm((f) => ({ ...f, pta_members: f.pta_members.filter((_, i) => i !== index) }));

  const payload = () => ({ ...form, district_id: Number(form.district_id) || 0 });

  // Saves the form and returns the saved request
  const save = async () => {
    const saved = savedId ? await updateSchoolRequest(savedId, payload()) : await createSchoolRequest(payload());
    setSavedId(saved.id);
    notifySchoolRequestsChanged();
    return saved;
  };

  const run = (label, action) => async () => {
    setBusy(label);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy("");
    }
  };

  const handleSave = run("save", async () => {
    const saved = await save();
    setToast({ show: true, message: "Draft saved.", variant: "success" });
    if (isNew) navigate(`${base}/${saved.id}/edit`, { replace: true });
  });

  const handleSubmit = run("submit", async () => {
    const saved = await save();
    await submitSchoolRequest(saved.id);
    notifySchoolRequestsChanged();
    navigate(`${base}/${saved.id}`, { state: { message: "Request submitted to MCDE." } });
  });

  const handleDownload = () =>
    downloadRequestPdf({
      ...(existing.data || {}),
      id: savedId || "draft",
      status: "Draft",
      submitted_at: "",
      submitted_by_name: "",
      region_name: regionName,
      district_name: districts.find((d) => String(d.id) === String(form.district_id))?.name || "",
      form: payload(),
    });

  // Only drafts can be edited
  if (existing.data && existing.data.status !== "Draft") {
    return <Navigate to={`${base}/${requestId}`} replace />;
  }

  return (
    <Page
      icon="bi-building-add"
      title={isNew ? "New School Request" : `Edit Request: ${form.school_name || "Untitled draft"}`}
      subtitle="Registration form for an Open Secondary School. Save as you go; submit when every part is filled in."
      actions={
        <Button variant="ghost" icon="bi-arrow-left" to={savedId ? `${base}/${savedId}` : base}>
          Back
        </Button>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />
      <DataState
        loading={lookups.loading || existing.loading}
        error={lookups.error || existing.error}
        onRetry={() => {
          lookups.reload();
          existing.reload();
        }}
      >
        {error && <Notice tone="red">{error}</Notice>}

        <div className={styles.partLabel}>Part A · Host institution</div>

        <Card accent="blue" icon="bi-building" title="School" subtitle="The school that will host the Open Secondary School">
          <div className="ui-grid ui-cols-3">
            <Field label="School name" required>
              <Input value={form.school_name} maxLength={100} onChange={onText("school_name")} placeholder="e.g. Bangwe Open Secondary School" />
            </Field>
            <Field label="District" required>
              <Select value={form.district_id || ""} onChange={(e) => set("district_id")(Number(e.target.value))}>
                <option value="">Choose a district</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Division">
              <Input value={regionName} readOnly />
            </Field>
          </div>
          <Field label="Location" required className="mt-3">
            <Segmented options={LOCATIONS} value={form.location} onChange={set("location")} />
          </Field>
        </Card>

        <Card accent="blue" icon="bi-geo-alt" title="School details" subtitle="Address and the head teacher of the host institution">
          <div className="ui-grid">
            <Field label="Address" required>
              <Textarea rows={3} maxLength={1000} value={form.address} onChange={onText("address")} placeholder="Postal and physical address" />
            </Field>
            <div className="ui-grid ui-cols-3">
              <Field label="Head teacher's name" required>
                <Input value={form.head_teacher.name} maxLength={150} onChange={onText("head_teacher.name")} />
              </Field>
              <Field label="Phone number" required hint="e.g. 0991 234 567">
                <Input type="tel" value={form.head_teacher.phone} maxLength={30} onChange={onText("head_teacher.phone")} />
              </Field>
              <Field label="Email address">
                <Input type="email" value={form.head_teacher.email} maxLength={150} onChange={onText("head_teacher.email")} />
              </Field>
            </div>
          </div>
        </Card>

        <Card accent="blue" icon="bi-house-door" title="Place to run the OSS" subtitle="Choose one, then give the name of the place">
          <div className="ui-grid ui-cols-2">
            <Field label="Place" required>
              <Select value={form.venue_type} onChange={onText("venue_type")}>
                <option value="">Choose where it will run</option>
                {VENUES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Name of the place" required>
              <Input
                value={form.venue_name}
                maxLength={255}
                onChange={onText("venue_name")}
                placeholder={form.venue_type === "HOST_SCHOOL" ? form.school_name || "Name of the host school" : "e.g. Bangwe Primary School"}
                disabled={!form.venue_type}
              />
            </Field>
          </div>
        </Card>

        <Card
          accent="blue"
          icon="bi-people"
          title="Teachers/facilitators available"
          subtitle="Everyone who will teach at the OSS"
          actions={
            <Button variant="ghost" size="sm" icon="bi-plus-lg" onClick={addFacilitator} disabled={form.facilitators.length >= 30}>
              Add facilitator
            </Button>
          }
          flush
        >
          <Table compact>
            <thead>
              <tr>
                <th>No.</th>
                <th>Name</th>
                <th>Qualification</th>
                <th>Subject combination</th>
                <th className="end">Remove</th>
              </tr>
            </thead>
            <tbody>
              {form.facilitators.map((row, i) => (
                <tr key={i}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <Input value={row.name} maxLength={150} aria-label={`Facilitator ${i + 1} name`} onChange={(e) => setFacilitator(i, "name", e.target.value)} />
                  </td>
                  <td>
                    <Input value={row.qualification} maxLength={150} aria-label={`Facilitator ${i + 1} qualification`} placeholder="e.g. Diploma in Education" onChange={(e) => setFacilitator(i, "qualification", e.target.value)} />
                  </td>
                  <td>
                    <Input value={row.subject_combination} maxLength={150} aria-label={`Facilitator ${i + 1} subjects`} placeholder="e.g. Mathematics/Physics" onChange={(e) => setFacilitator(i, "subject_combination", e.target.value)} />
                  </td>
                  <td className="end">
                    <IconButton
                      kind="delete"
                      title={`Remove facilitator ${i + 1}`}
                      onClick={() => removeFacilitator(i)}
                      disabled={form.facilitators.length === 1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card
          accent="blue"
          icon="bi-person-badge"
          title="Recommended coordinator for the open secondary school"
          subtitle="Once the school is registered, the coordinator gets an account to register its learners"
        >
          <div className="ui-grid ui-cols-2">
            <Field label="Name" required>
              <Input value={form.coordinator.name} maxLength={150} onChange={onText("coordinator.name")} />
            </Field>
            <Field label="Qualifications">
              <Input value={form.coordinator.qualifications} maxLength={255} onChange={onText("coordinator.qualifications")} />
            </Field>
            <Field label="Email" required hint="They sign in to the system with this email">
              <Input type="email" value={form.coordinator.email} maxLength={150} onChange={onText("coordinator.email")} />
            </Field>
            <Field label="Phone number" hint="e.g. 0991 234 567">
              <Input type="tel" value={form.coordinator.phone} maxLength={30} onChange={onText("coordinator.phone")} />
            </Field>
          </div>
        </Card>

        <Card accent="blue" icon="bi-bar-chart" title="Initial enrolment" subtitle={`Total: ${totalEnrolment(form.enrolment)} students`}>
          <div className="ui-grid ui-cols-4">
            {FORMS.map((key, i) => (
              <Field key={key} label={`Form ${i + 1}`} required>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.enrolment[key] ?? ""}
                  placeholder="0"
                  onChange={(e) => set(`enrolment.${key}`)(numberOrNull(e.target.value))}
                />
              </Field>
            ))}
          </div>
          <div className="ui-grid ui-cols-3 mt-3">
            <Field label="Distance from the next open secondary school (km)" required>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={form.distance_km ?? ""}
                onChange={(e) => set("distance_km")(numberOrNull(e.target.value))}
              />
            </Field>
          </div>
        </Card>

        <div className={styles.partLabel}>Part B · Endorsements</div>

        <Card
          accent="purple"
          icon="bi-people-fill"
          title="PTA/Board of Governors"
          subtitle="The members who agreed to host the OSS"
          actions={
            <Button variant="ghost" size="sm" icon="bi-plus-lg" onClick={addMember} disabled={form.pta_members.length >= 30}>
              Add member
            </Button>
          }
        >
          <div className="ui-grid ui-cols-2">
            {form.pta_members.map((name, i) => (
              <div key={i} className={styles.memberRow}>
                <Input value={name} maxLength={150} aria-label={`PTA/Board member ${i + 1}`} placeholder={`Member ${i + 1}`} onChange={(e) => setMember(i, e.target.value)} />
                <IconButton
                  kind="delete"
                  title={`Remove PTA/Board member ${i + 1}`}
                  onClick={() => removeMember(i)}
                  disabled={form.pta_members.length === 1}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card accent="purple" icon="bi-diagram-3" title="Education Division Manager (EDM)">
          <p className="mb-0" style={{ fontSize: 14, color: "var(--ui-text-body)" }}>
            Submitting this request records the {regionName || "division"} division&apos;s recommendation, with your name and the
            date. MCDE then accepts it and gives the registration number.
          </p>
        </Card>

        <div className={styles.actionBar}>
          <Button variant="ghost" icon="bi-download" onClick={handleDownload}>
            Download copy
          </Button>
          <div className={styles.actionBarEnd}>
            <Button variant="ghost" icon="bi-save" onClick={handleSave} disabled={!!busy}>
              {busy === "save" ? "Saving…" : "Save draft"}
            </Button>
            <Button icon="bi-send" onClick={handleSubmit} disabled={!!busy}>
              {busy === "submit" ? "Submitting…" : "Submit to MCDE"}
            </Button>
          </div>
        </div>
      </DataState>
    </Page>
  );
}
