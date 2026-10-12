import { useEffect, useState } from "react";

import { createRegion, deleteRegion, getRegion, getRegionUsage, listRegions, moveRegionDistricts, updateRegion } from "../../api/regions";
import DataState from "../../components/DataState";
import ToastNote from "../../components/ToastNote";
import { Button, Card, Dialog, Field, IconButton, Input, Page, SearchInput, Table } from "../../components/ui";
import { DeleteContainerDialog } from "./StructureDialogs";

// A division can only be deleted once its districts have moved to another division
const DELETE_CONFIG = {
  noun: "division",
  childNoun: "district",
  getUsage: getRegionUsage,
  childCount: (usage) => usage.districts,
  extra: (usage) => (usage.schools ? ` with ${usage.schools} school${usage.schools === 1 ? "" : "s"}` : ""),
  move: moveRegionDistricts,
  remove: deleteRegion,
};

export default function ManageDivisions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [toast, setToast] = useState({ show: false, message: "", variant: "success" });

  useEffect(() => { loadRegions(); }, []);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const data = await listRegions();
      setRegions(data || []);
    } catch (error) {
      console.error("Error fetching regions:", error);
      alert(`Failed to load divisions: ${error.message}`);
    } finally { setLoading(false); }
  };

  const handleShowModal = async (division = null) => {
    if (division) {
      try {
        const details = await getRegion(division.id);
        setEditingDivision(division);
        setFormData({ name: details?.name || division.name });
      } catch (err) {
        console.error("Failed to fetch details:", err);
        alert(`Could not fetch division details: ${err.message}`);
      }
    } else {
      setEditingDivision(null);
      setFormData({ name: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingDivision(null); };

  const handleSaveDivision = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert("Please fill in the name field."); return; }
    try {
      setSaving(true);
      if (editingDivision) {
        await updateRegion(editingDivision.id, formData);
        setRegions((prev) => prev.map((r) => r.id === editingDivision.id ? { ...r, ...formData } : r));
      } else {
        const newRegion = await createRegion(formData);
        setRegions((prev) => [...prev, newRegion]);
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving division:", error);
      alert(`Failed to save division: ${error.message}`);
    } finally { setSaving(false); }
  };

  const handleDeleteChanged = (message, deleted) => {
    setToast({ show: true, message, variant: "success" });
    if (deleted) {
      setRegions((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Page
      icon="bi-diagram-3-fill"
      title="Divisions"
      subtitle="Education divisions (regions). Districts and schools are grouped under them."
      stats={[{ label: "Divisions", value: loading ? null : regions.length }]}
      actions={
        <Button variant="ghost" icon="bi-plus-lg" onClick={() => handleShowModal()}>
          Add Division
        </Button>
      }
    >
      <ToastNote {...toast} onClose={() => setToast((t) => ({ ...t, show: false }))} />

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Divisions"
        subtitle={`${filteredRegions.length} of ${regions.length} shown`}
        actions={<SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search divisions…" />}
        flush
      >
        <DataState
          loading={loading}
          empty={filteredRegions.length === 0}
          emptyMessage={searchTerm ? "No divisions match your search." : "No divisions found."}
        >
          <Table>
            <thead>
              <tr>
                <th>Division Name</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegions.map((region) => (
                <tr key={region.id}>
                  <td className="strong">{region.name}</td>
                  <td className="end">
                    <IconButton kind="edit" title={`Edit ${region.name}`} onClick={() => handleShowModal(region)} />
                    <IconButton kind="delete" title={`Delete ${region.name}`} onClick={() => setDeleting(region)} />
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
        title={editingDivision ? "Edit Division" : "Add Division"}
        icon="bi-diagram-3"
        as="form"
        onSubmit={handleSaveDivision}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" icon="bi-check-lg" disabled={saving}>
              {saving ? "Saving…" : editingDivision ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <Field label="Division Name" required>
          <Input
            placeholder="Enter division name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </Field>
      </Dialog>

      <DeleteContainerDialog
        item={deleting}
        config={DELETE_CONFIG}
        targets={regions.filter((r) => r.id !== deleting?.id).map((r) => ({ id: r.id, label: r.name }))}
        accountsPath="/admin/accounts"
        onHide={() => setDeleting(null)}
        onChanged={handleDeleteChanged}
      />
    </Page>
  );
}
