import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

const SubjectService = {
  // Fetch all subjects from the database
  fetchAllSubjects: async () => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/subjects`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching subjects:", error);
      throw error;
    }
  },

  // Get a single subject by ID
  getSubjectById: async (subjectId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/subjects/${subjectId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching subject ${subjectId}:`, error);
      throw error;
    }
  },
};

export default SubjectService;
