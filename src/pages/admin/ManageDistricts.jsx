import { useEffect, useState } from "react";

import { listRegions } from "../../api/regions";
import { createDistrict, deleteDistrict, listDistricts, updateDistrict } from "../../api/districts";
import ConfirmModal from "../../components/ConfirmModal";
import DataState from "../../components/DataState";
import TablePagination from "../../components/TablePagination";
import { Button, Card, Dialog, Field, IconButton, Input, Notice, Page, SearchInput, Select, Table } from "../../components/ui";

const NOTICE_TONES = { success: "green", warning: "amber", danger: "red" };

export default function ManageDistricts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", region_id: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // fewer items per page to avoid overflow

  const [alert, setAlert] = useState({ show: false, message: "", variant: "success" });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: "", onConfirm: null });

  useEffect(() => {
    loadDistricts();
    loadRegions();
  }, []);

  const showAlert = (message, variant = "success", timeout = 3000) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert((current) => ({ ...current, show: false })), timeout);
  };

  const loadDistricts = async () => {
    setLoading(true);
    try {
      const data = await listDistricts();
      setDistricts(data || []);
    } catch (error) {
      showAlert(`Failed to load districts: ${error.message}`, "danger");
    } finally {
      setLoading(false);
    }
  };

  const loadRegions = async () => {
    try {
      const data = await listRegions();
      setRegions(data || []);
    } catch (error) {
      showAlert(`Failed to load regions: ${error.message}`, "danger");
    }
  };

  const handleShowModal = (district = null) => {
    if (district) {
      setEditingDistrict(district);
      setFormData({ name: district.name, region_id: district.region_id });
    } else {
      setEditingDistrict(null);
      setFormData({ name: "", region_id: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDistrict(null);
    setFormData({ name: "", region_id: "" });
  };

  const handleSaveDistrict = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.region_id) {
      showAlert("Please fill in all fields", "warning");
      return;
    }
    try {
      setLoading(true);
      const payload = { name: formData.name, region_id: Number(formData.region_id) };
      if (editingDistrict) {
        await updateDistrict(editingDistrict.id, payload);
        showAlert("District updated successfully!");
      } else {
        await createDistrict(payload);
        showAlert("District created successfully!");
      }
      await loadDistricts();
      handleCloseModal();
    } catch (error) {
      showAlert(`Failed to save district: ${error.message}`, "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDistrict = (id) => {
    setConfirmModal({
      show: true,
      message: "Are you sure you want to delete this district?",
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteDistrict(id);
          await loadDistricts();
          showAlert("District deleted successfully!", "success");
        } catch (error) {
          showAlert(`Failed to delete district: ${error.message}`, "danger");
        } finally {
          setLoading(false);
          setConfirmModal({ ...confirmModal, show: false });
        }
      },
    });
  };

  const handleConfirm = () => { if (confirmModal.onConfirm) confirmModal.onConfirm(); };
  const handleCancelConfirm = () => { setConfirmModal({ ...confirmModal, show: false }); };

  // Filtering & pagination
  const filteredDistricts = districts.filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredDistricts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedDistricts = filteredDistricts.slice(startIndex, startIndex + itemsPerPage);

  const getRegionName = (region_id) => regions.find((r) => r.id === region_id)?.name || "-";

  return (
    <Page
      icon="bi-geo-alt-fill"
      title="Districts"
      subtitle="Districts within each division. Schools are registered under a district."
      stats={[
        { label: "Districts", value: districts.length },
        { label: "Divisions", value: regions.length },
      ]}
      actions={
        <Button variant="ghost" icon="bi-plus-lg" onClick={() => handleShowModal()}>
          Add District
        </Button>
      }
    >
      {alert.show && <Notice tone={NOTICE_TONES[alert.variant]}>{alert.message}</Notice>}

      <Card
        accent="blue"
        icon="bi-list-ul"
        title="All Districts"
        subtitle={`${filteredDistricts.length} of ${districts.length} shown`}
        actions={<SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search districts…" />}
        flush
      >
        <DataState
          loading={loading}
          empty={displayedDistricts.length === 0}
          emptyMessage={searchTerm ? "No districts match your search." : "No districts found."}
        >
          <Table>
            <thead>
              <tr>
                <th>District Name</th>
                <th>Division</th>
                <th className="end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDistricts.map((district) => (
                <tr key={district.id}>
                  <td className="strong">{district.name}</td>
                  <td>{getRegionName(district.region_id)}</td>
                  <td className="end">
                    <IconButton kind="edit" title={`Edit ${district.name}`} onClick={() => handleShowModal(district)} />
                    <IconButton kind="delete" title={`Delete ${district.name}`} onClick={() => handleDeleteDistrict(district.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TablePagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage} />
        </DataState>
      </Card>

      <Dialog
        show={showModal}
        onHide={handleCloseModal}
        title={editingDistrict ? "Edit District" : "Add District"}
        icon="bi-geo-alt"
        as="form"
        onSubmit={handleSaveDistrict}
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
            <Button type="submit" icon="bi-check-lg" disabled={loading}>
              {editingDistrict ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <div className="ui-grid">
          <Field label="District Name" required>
            <Input
              placeholder="Enter district name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Field>
          <Field label="Division" required>
            <Select value={formData.region_id} onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}>
              <option value="">Select Division</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>

      <ConfirmModal
        show={confirmModal.show}
        onHide={handleCancelConfirm}
        onConfirm={handleConfirm}
        title="Delete District"
        confirmLabel="Delete"
        body={confirmModal.message}
      />
    </Page>
  );
}
