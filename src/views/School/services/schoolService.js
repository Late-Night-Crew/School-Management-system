import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

const SchoolService = {
  // Fetch all districts
  fetchDistricts: async () => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/districts`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      throw error;
    }
  },

  // Fetch schools by district
  fetchSchoolsByDistrict: async (districtId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/schools?district_id=${districtId}`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error(`Error fetching schools for district ${districtId}:`, error);
      throw error;
    }
  },

  // Fetch school details by ID
  getSchoolById: async (schoolId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/schools/${schoolId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching school ${schoolId}:`, error);
      throw error;
    }
  },
};

export default SchoolService;
