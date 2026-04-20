import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

const TransferService = {
  // Fetch students for a school
  fetchStudentsForSchool: async (schoolId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/students?school_id=${schoolId}`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  // Create a transfer request
  createTransferRequest: async (transferData) => {
    try {
      const response = await axios.post(
        `${NSMS_URL}/school/transfers`,
        transferData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating transfer request:", error);
      throw error;
    }
  },

  // Get incoming transfers for a school
  getIncomingTransfers: async (schoolId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/school/transfers/incoming/${schoolId}`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching incoming transfers:", error);
      throw error;
    }
  },

  // Get outgoing transfers for a school
  getOutgoingTransfers: async (schoolId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/school/transfers/outgoing/${schoolId}`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching outgoing transfers:", error);
      throw error;
    }
  },

  // Get transfer by ID
  getTransferById: async (transferId) => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/school/transfers/${transferId}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching transfer:", error);
      throw error;
    }
  },

  // Approve a transfer
  approveTransfer: async (transferId) => {
    try {
      const response = await axios.put(
        `${NSMS_URL}/school/transfers/${transferId}/approve`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error approving transfer:", error);
      throw error;
    }
  },

  // Reject a transfer
  rejectTransfer: async (transferId) => {
    try {
      const response = await axios.patch(
        `${NSMS_URL}/school/transfers/${transferId}/reject`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting transfer:", error);
      throw error;
    }
  },

  // Finalize a transfer
  finalizeTransfer: async (transferId) => {
    try {
      const response = await axios.patch(
        `${NSMS_URL}/school/transfers/${transferId}/finalize`,
        {},
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error("Error finalizing transfer:", error);
      throw error;
    }
  },

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
      console.error("Error fetching schools:", error);
      throw error;
    }
  },

  // Fetch all schools
  fetchAllSchools: async () => {
    try {
      const response = await axios.get(
        `${NSMS_URL}/admin/schools`,
        { headers: getAuthHeaders() }
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Error fetching schools:", error);
      throw error;
    }
  },
};

export default TransferService;
