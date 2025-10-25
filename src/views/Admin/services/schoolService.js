import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

// Fetch all schools and normalize data
export async function fetchSchools() {
  try {
    const response = await axios.get(`${NSMS_URL}/admin/schools`, {
      headers: getAuthHeaders(),
    });
    return (response.data || []).map((s) => ({
      ...s,
      schoolNumber: s.school_number,
      district_id: Number(s.district_id),
    }));
  } catch (error) {
    console.error("Error fetching schools:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch schools");
  }
}

// Create a new school (district_id only)
export async function createSchool(data) {
  try {
    const schoolData = {
      name: data.name,
      school_number: data.schoolNumber,
      district_id: data.district_id,
    };
    const response = await axios.post(`${NSMS_URL}/admin/schools`, schoolData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating school:", error);
    throw new Error(error.response?.data?.message || "Failed to create school");
  }
}

// Update an existing school
export async function updateSchool(id, data) {
  try {
    const schoolData = {
      name: data.name,
      school_number: data.schoolNumber,
      district_id: data.district_id,
    };
    const response = await axios.put(`${NSMS_URL}/admin/schools/${id}`, schoolData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error updating school:", error);
    throw new Error(error.response?.data?.message || "Failed to update school");
  }
}

// Delete a school
export async function deleteSchool(id) {
  try {
    const response = await axios.delete(`${NSMS_URL}/admin/schools/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting school:", error);
    throw new Error(error.response?.data?.message || "Failed to delete school");
  }
}
