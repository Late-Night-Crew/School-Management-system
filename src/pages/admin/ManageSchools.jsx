import { useEffect, useState, useMemo } from "react";

import {
  closeSchool,
  createSchool,
  deleteSchool,
  getSchoolUsage,
  listSchools,
  reopenSchool,
  transferAllStudents,
  updateSchool,
} from "../../api/schools";
import { listRegions } from "../../api/regions";
import { listDistricts } from "../../api/districts";
import DataState from "../../components/DataState";
import ToastNote from "../../components/ToastNote";
import { Badge, Button, Card, Dialog, Field, IconButton, Input, Page, SearchInput, Segmented, Select, Table, Tip } from "../../components/ui";
import { formatDate } from "../../utils/format";
import { SchoolDialog } from "./StructureDialogs";

const SCHOOL_API = {
  getUsage: getSchoolUsage,
  remove: deleteSchool,
  close: closeSchool,
  reopen: reopenSchool,
  transferAll: transferAllStudents,
};

const STATUS_FILTERS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
];

// The form uses camelCase schoolNumber; the API expects school_number
const toSchoolPayload = (form) => ({
  name: form.name,
  school_number: form.schoolNumber,
  district_id: Number(form.district_id),
});

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

  const [statusFilter, setStatusFilter] = useState("open");
  // { school, mode: "delete" | "close" | "reopen" } while the dialog is open
  const [acting, setActing] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  useEffect(() => {
    loadSchools();
    loadRegions();
    loadDistricts();
  }, []);

  const loadSchools = async () => {
    setLoadingSchools(true);
    try {
      const data = await listSchools();
      setSchools(data || []);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingSchools(false);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await listRegions();
      setRegions(data || []);
    } catch (error) {
      alert(`Failed to load regions: ${error.message}`);
    }
  };

  const loadDistricts = async () => {
    try {
      const data = await listDistricts();
      setDistricts(data || []);
    } catch (error) {
      alert(`Failed to load districts: ${error.message}`);
    }
  };

  const handleShowModal = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        name: school.name,
        schoolNumber: school.school_number || "",
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

  const handleSaveSchool = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.district_id) {
      alert("Please fill all required fields");
      return;
    }
    try {
      setSavingSchool(true);
      if (editingSchool) {
        await updateSchool(editingSchool.id, toSchoolPayload(formData));
      } else {
        await createSchool(toSchoolPayload(formData));
      }
      await loadSchools();
      handleCloseModal();
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingSchool(false);
    }
  };

  const handleActionDone = async (message) => {
    setActing(null);
    setToast({ show: true, message, variant: "success" });
    await loadSchools();
  };

  const filteredSchools = useMemo(
    () =>
      schools.filter(
        (school) =>
          school.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          (statusFilter === "all" || (statusFilter === "closed") === Boolean(school.closed_at))
      ),
    [schools, searchTerm, statusFilter]
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
    <Page
      icon="bi-building-fill"
      title="Schools"
      subtitle="Every registered school, with the district and division it belongs to."
      stats={[
        { label: "Open", value: schools.filter((s) => !s.closed_at).length },
        { label: "Closed", value: schools.filter((s) => s.closed_at).length },
      ]}
      actions={
        <Button variant="ghost" icon="bi-plus-lg" onClick={() => handleShowModal()}>
          Add School
        </Button>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Schools"
        subtitle={`${filteredSchools.length} of ${schools.length} shown`}
        actions={
          <>
            <Segmented options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search schools…" />
          </>
        }
        flush
      >
        <DataState
          loading={loadingSchools}
          empty={filteredSchools.length === 0}
          emptyMessage={searchTerm || statusFilter !== "all" ? "No schools match your search." : "No schools found."}
        >
          <Table>
            <thead>
              <tr>
                <th>School Name</th>
                <th>School Number</th>
                <th>Division</th>
                <th>District</th>
                <th>Status</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school) => (
                <tr key={school.id}>
                  <td className="strong">{school.name}</td>
                  <td>{school.school_number ? <Badge tone="blue">{school.school_number}</Badge> : "-"}</td>
                  <td>{getRegionName(school.district_id)}</td>
                  <td>{getDistrictName(school.district_id)}</td>
                  <td>
                    {school.closed_at ? (
                      <Tip text={`Closed on ${formatDate(school.closed_at)}`}>
                        <span>
                          <Badge tone="slate">Closed</Badge>
                        </span>
                      </Tip>
                    ) : (
                      <Badge tone="green">Open</Badge>
                    )}
                  </td>
                  <td className="end">
                    <IconButton kind="edit" title={`Edit ${school.name}`} tip="Edit school" onClick={() => handleShowModal(school)} />
                    <IconButton
                      kind="view"
                      icon="bi-people"
                      title={`Transfer all students from ${school.name}`}
                      tip="Transfer all students"
                      onClick={() => setActing({ school, mode: "transfer" })}
                    />
                    {school.closed_at ? (
                      <IconButton
                        kind="save"
                        icon="bi-door-open"
                        title={`Reopen ${school.name}`}
                        tip="Reopen school"
                        onClick={() => setActing({ school, mode: "reopen" })}
                      />
                    ) : (
                      <IconButton
                        kind="view"
                        icon="bi-door-closed"
                        title={`Close ${school.name}`}
                        tip="Close school"
                        onClick={() => setActing({ school, mode: "close" })}
                      />
                    )}
                    <IconButton kind="delete" title={`Delete ${school.name}`} tip="Delete school" onClick={() => setActing({ school, mode: "delete" })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </DataState>
      </Card>

      <Dialog
        show={showModal}
        onHide={handleCloseModal}
        title={editingSchool ? "Edit School" : "Add School"}
        icon="bi-building"
        as="form"
        onSubmit={handleSaveSchool}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" icon="bi-check-lg" disabled={savingSchool}>
              {savingSchool ? "Saving…" : editingSchool ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <div className="ui-grid ui-cols-2">
          <Field label="Division" required>
            <Select
              value={formData.region_id}
              onChange={(e) =>
                setFormData({ ...formData, region_id: Number(e.target.value), district_id: "" })
              }
            >
              <option value="">Select Division</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="District" required>
            <Select
              value={formData.district_id}
              onChange={(e) =>
                setFormData({ ...formData, district_id: Number(e.target.value) })
              }
              disabled={!formData.region_id}
            >
              <option value="">
                {formData.region_id ? "Select District" : "Select Division first"}
              </option>
              {filteredDistricts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="School Name" required>
            <Input
              placeholder="Enter school name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Field>
          <Field label="School Number">
            <Input
              placeholder="Enter school number"
              value={formData.schoolNumber}
              onChange={(e) =>
                setFormData({ ...formData, schoolNumber: e.target.value })
              }
            />
          </Field>
        </div>
      </Dialog>

      <SchoolDialog
        school={acting?.school}
        mode={acting?.mode}
        api={SCHOOL_API}
        targets={schools
          .filter((s) => !s.closed_at)
          .map((s) => ({ id: s.id, label: `${s.name} (${getDistrictName(s.district_id)})` }))
          .sort((a, b) => a.label.localeCompare(b.label))}
        onHide={() => setActing(null)}
        onChanged={handleActionDone}
      />
    </Page>
  );
}
