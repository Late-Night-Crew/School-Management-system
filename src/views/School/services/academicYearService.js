import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

const AcademicYearService = {
  // Fetch all academic years for a specific school
  fetchAllAcademicYears: async (schoolId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/school/${schoolId}/AcademicYear`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching academic years:", error);
      throw error;
    }
  },

  // Get the active academic year for a specific school
  getActiveAcademicYear: async (schoolId) => {
    try {
      const years = await AcademicYearService.fetchAllAcademicYears(schoolId);
      const active = years.find(y => y.status && y.status.toLowerCase() === "active");
      return active || null;
    } catch (error) {
      console.error("Error getting active academic year:", error);
      throw error;
    }
  },

  // Get academic year by ID for a specific school
  getAcademicYearById: async (schoolId, yearId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/school/${schoolId}/AcademicYear/${yearId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching academic year ${yearId}:`, error);
      throw error;
    }
  },

  // Create a new academic year for a specific school
  createAcademicYear: async (schoolId, data) => {
    try {
      const response = await axios.post(
        `${NSMS_URL}/school/${schoolId}/AcademicYear`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating academic year:", error);
      throw error;
    }
  },

  // Update an academic year for a specific school
  updateAcademicYear: async (schoolId, id, data) => {
    try {
      const response = await axios.put(
        `${NSMS_URL}/school/${schoolId}/AcademicYear/${id}`,
        data,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating academic year ${id}:`, error);
      throw error;
    }
  },

  // Delete an academic year for a specific school
  deleteAcademicYear: async (schoolId, id) => {
    try {
      const response = await axios.delete(
        `${NSMS_URL}/school/${schoolId}/AcademicYear/${id}`,
        { headers: getAuthHeaders() }
        
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting academic year ${id}:`, error);
      throw error;
    }
  },
};

export default AcademicYearService;