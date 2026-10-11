import { useState } from "react";

import { updateRegionOffice, updateSchoolOffice } from "../../api/accounts";
import { formatPhone } from "../../utils/format";
import { Button, Dialog, Field, Input, Notice } from "../../components/ui";

const PHONE_HINT = "Any Malawi format, e.g. 0991 234 567 or 01 789 123.";

function OfficeDialog({ title, initial, fields, save, onHide, onSaved }) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await save(values);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Dialog
      show
      onHide={onHide}
      title={title}
      icon="bi-pencil-square"
      as="form"
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" icon="bi-save" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      {error && <Notice tone="red">{error}</Notice>}
      <div className="ui-grid ui-cols-2" style={{ marginTop: error ? 12 : 0 }}>
        {fields.map((field) => (
          <Field key={field.name} label={field.label} hint={field.hint} className={field.wide ? "ui-span-all" : ""}>
            <Input
              type={field.type || "text"}
              value={values[field.name]}
              maxLength={field.maxLength || 255}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </Field>
        ))}
      </div>
    </Dialog>
  );
}

export function EditRegionOfficeDialog({ region, onHide, onSaved }) {
  return (
    <OfficeDialog
      title={`${region.name} Division Office`}
      initial={{
        phone: formatPhone(region.office.phone),
        email: region.office.email || "",
        postal_address: region.office.postal_address || "",
        physical_address: region.office.physical_address || "",
      }}
      fields={[
        { name: "phone", label: "Office phone", type: "tel", hint: PHONE_HINT, maxLength: 25 },
        { name: "email", label: "Office email", type: "email", maxLength: 150 },
        { name: "postal_address", label: "Postal address", placeholder: "e.g. P.O. Box 131, Mzuzu", wide: true },
        { name: "physical_address", label: "Physical location", placeholder: "Where visitors can find the office", wide: true },
      ]}
      save={(values) => updateRegionOffice(region.id, values)}
      onHide={onHide}
      onSaved={onSaved}
    />
  );
}

export function EditSchoolOfficeDialog({ school, onHide, onSaved }) {
  return (
    <OfficeDialog
      title={school.name}
      initial={{
        phone: formatPhone(school.office.phone),
        email: school.office.email || "",
        postal_address: school.office.postal_address || "",
        head_teacher_name: school.head_teacher_name || "",
        head_teacher_phone: formatPhone(school.head_teacher_phone),
      }}
      fields={[
        { name: "phone", label: "School phone", type: "tel", hint: PHONE_HINT, maxLength: 25 },
        { name: "email", label: "School email", type: "email", maxLength: 150 },
        { name: "postal_address", label: "Postal address", placeholder: "e.g. P.O. Box 20, Karonga", wide: true },
        { name: "head_teacher_name", label: "Head teacher", maxLength: 150 },
        { name: "head_teacher_phone", label: "Head teacher's phone", type: "tel", hint: PHONE_HINT, maxLength: 25 },
      ]}
      save={(values) => updateSchoolOffice(school.id, values)}
      onHide={onHide}
      onSaved={onSaved}
    />
  );
}
