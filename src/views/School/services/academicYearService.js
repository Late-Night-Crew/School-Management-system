import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

const AcademicYearService = {
  // Fetch all academic years
  fetchAllAcademicYears: async () => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/academic_years`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching academic years:", error);
      throw error;
    }
  },

  // Get the active academic year
  getActiveAcademicYear: async () => {
    try {
      const years = await AcademicYearService.fetchAllAcademicYears();
      const active = years.find(y => y.status && y.status.toLowerCase() === "active");
      return active || null;
    } catch (error) {
      console.error("Error getting active academic year:", error);
      throw error;
    }
  },

  // Get academic year by ID
  getAcademicYearById: async (yearId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/academic_years/${yearId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching academic year ${yearId}:`, error);
      throw error;
    }
  },
};

export default AcademicYearService;
