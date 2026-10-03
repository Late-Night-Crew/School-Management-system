import { useEffect, useState, useMemo } from "react";

import { createSchool, deleteSchool, listSchools, updateSchool } from "../../api/schools";
import { listRegions } from "../../api/regions";
import { listDistricts } from "../../api/districts";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import { Badge, Button, Card, Dialog, Field, IconButton, Input, Page, SearchInput, Select, Table } from "../../components/ui";

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
    <Page
      icon="bi-building-fill"
      title="Schools"
      subtitle="Every registered school, with the district and division it belongs to."
      stats={[{ label: "Schools", value: schools.length }]}
      actions={
        <Button variant="ghost" icon="bi-plus-lg" onClick={() => handleShowModal()}>
          Add School
        </Button>
      }
    >
      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Schools"
        subtitle={`${filteredSchools.length} of ${schools.length} shown`}
        actions={<SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search schools…" />}
        flush
      >
        <DataState
          loading={loadingSchools}
          empty={filteredSchools.length === 0}
          emptyMessage={searchTerm ? "No schools match your search." : "No schools found."}
        >
          <Table>
            <thead>
              <tr>
                <th>School Name</th>
                <th>School Number</th>
                <th>Division</th>
                <th>District</th>
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
                  <td className="end">
                    <IconButton kind="edit" title={`Edit ${school.name}`} onClick={() => handleShowModal(school)} />
                    <IconButton
                      kind="delete"
                      title={`Delete ${school.name}`}
                      onClick={() =>
                        showConfirm(
                          "Are you sure you want to delete this school?",
                          () => handleDeleteSchool(school.id)
                        )
                      }
                    />
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

      <ConfirmModal
        show={confirmModal.show}
        onHide={handleCancel}
        onConfirm={handleConfirm}
        title="Delete School"
        confirmLabel="Delete"
        body={confirmModal.message}
      />
    </Page>
  );
}
