import axios from "axios";
import { AUTH_TOKEN_KEY, SCHOOL_ID_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

const SchoolStudentService = {
  // Fetch all students for the current school
  fetchStudentsForSchool: async (schoolId = null) => {
    try {
      const id = schoolId || localStorage.getItem(SCHOOL_ID_KEY);
      if (!id) throw new Error("School ID not found");
      
      const response = await axios.get(
        `${NSMS_URL}/admin/students?school_id=${id}`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching school students:", error);
      throw error;
    }
  },

  // Get a single student by ID
  getStudentById: async (studentId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/students/${studentId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching student ${studentId}:`, error);
      throw error;
    }
  },

  // Create a new student
  createStudent: async (studentData) => {
    try {
      const response = await axios.post(
        `${NSMS_URL}/admin/students`,
        studentData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  },

  // Update an existing student
  updateStudent: async (studentId, studentData) => {
    try {
      const response = await axios.put(
        `${NSMS_URL}/admin/students/${studentId}`,
        studentData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating student ${studentId}:`, error);
      throw error;
    }
  },

  // Delete a student
  deleteStudent: async (studentId) => {
    try {
      const response = await axios.delete(
        `${NSMS_URL}/admin/students/${studentId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting student ${studentId}:`, error);
      throw error;
    }
  },
};

export default SchoolStudentService;
