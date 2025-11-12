import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

// Fetch all districts
export async function fetchDistricts() {
  const response = await axios.get(`${NSMS_URL}/admin/districts`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Create a new district
export async function createDistrict(data) {
  const payload = {
    name: data.name,
    region_id: Number(data.region_id),
  };
  const response = await axios.post(`${NSMS_URL}/admin/districts`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Update existing district
export async function updateDistrict(id, data) {
  const payload = {
    name: data.name,
    region_id: Number(data.region_id),
  };
  const response = await axios.put(`${NSMS_URL}/admin/districts/${id}`, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

// Delete a district
export async function deleteDistrict(id) {
  const response = await axios.delete(`${NSMS_URL}/admin/districts/${Number(id)}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}
