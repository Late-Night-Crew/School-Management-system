import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

// Fetch all students
export async function fetchStudents() {
  try {
    const response = await axios.get(`${NSMS_URL}/admin/students`, { headers: getAuthHeaders() });
    return response.data; // expected: array of admin/managestudents
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
}

// Get a single student by ID
export async function getStudentById(id) {
  try {
    const response = await axios.get(`${NSMS_URL}/admin/students/${id}`, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error fetching student ${id}:`, error);
    return null;
  }
}

// Create a new student
export async function createStudent(studentData) {
  try {
    const response = await axios.post(`${NSMS_URL}/admin/students`, studentData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error("Error creating student:", error);
    return null;
  }
}

// Update an existing student
export async function updateStudent(id, studentData) {
  try {
    const response = await axios.put(`${NSMS_URL}/admin/students/${id}`, studentData, { headers: getAuthHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error updating student ${id}:`, error);
    return null;
  }
}

// Delete a student
export async function deleteStudent(id) {
  try {
    await axios.delete(`${NSMS_URL}/admin/students/${id}`, { headers: getAuthHeaders() });
    return true;
  } catch (error) {
    console.error(`Error deleting student ${id}:`, error);
    return false;
  }
}
