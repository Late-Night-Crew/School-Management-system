// src/views/Admin/services/studentService.js
import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;
const getAuthHeader = () => ({ Authorization: `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` });

// --- Students CRUD ---
export async function fetchStudents() {
  try {
    const { data } = await axios.get(`${NSMS_URL}/admin/students`, { headers: getAuthHeader() });
    return data;
  } catch (error) {
    console.error("❌ Error fetching students:", error.response?.data || error.message);
    throw error;
  }
}

export async function createStudent(student) {
  try {
    const { data } = await axios.post(`${NSMS_URL}/admin/students`, student, { headers: getAuthHeader() });
    return data;
  } catch (error) {
    console.error("❌ Error creating student:", error.response?.data || error.message);
    throw error;
  }
}

export async function updateStudent(id, student) {
  try {
    const { data } = await axios.put(`${NSMS_URL}/admin/students/${id}`, student, { headers: getAuthHeader() });
    return data;
  } catch (error) {
    console.error("❌ Error updating student:", error.response?.data || error.message);
    throw error;
  }
}

export async function deleteStudent(id) {
  try {
    const { data } = await axios.delete(`${NSMS_URL}/admin/students/${id}`, { headers: getAuthHeader() });
    return data;
  } catch (error) {
    console.error("❌ Error deleting student:", error.response?.data || error.message);
    throw error;
  }
}

// --- Regions ---
export async function fetchRegions() {
  try {
    const { data } = await axios.get(`${NSMS_URL}/admin/regions`, { headers: getAuthHeader() });
    return data;
  } catch (error) {
    console.error("❌ Error fetching regions:", error.response?.data || error.message);
    throw error;
  }
}

// --- Schools by region ---
export async function fetchSchoolsByRegion(regionId) {
  try {
    const { data } = await axios.get(`${NSMS_URL}/admin/schools?region_id=${regionId}`, { headers: getAuthHeader() });
    return data;
  } catch (error) {
    console.error("❌ Error fetching schools by region:", error.response?.data || error.message);
    throw error;
  }
}
