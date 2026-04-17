import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return { Authorization: `Bearer ${token}` };
};

// Create a transfer request
export async function createTransfer(data) {
  try {
    // Convert date to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
    const dateInitiated = new Date(data.date_initiated);
    const isoDate = dateInitiated.toISOString();

    const payload = {
      student_id: Number(data.student_id),
      from_school: Number(data.from_school),
      to_school: Number(data.to_school),
      date_initiated: isoDate,
      reason: data.reason || "",
    };
    const response = await axios.post(`${NSMS_URL}/school/transfers`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error creating transfer:", error);
    throw new Error(error.response?.data?.message || "Failed to create transfer");
  }
}

// Get incoming transfers for a school
export async function getIncomingTransfers(schoolId) {
  try {
    const response = await axios.get(
      `${NSMS_URL}/school/transfers/incoming/${schoolId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return (response.data || []).map((t) => ({
      ...t,
      from_school: t.from_school,
      to_school: t.to_school,
    }));
  } catch (error) {
    console.error("Error fetching incoming transfers:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch incoming transfers");
  }
}

// Get outgoing transfers for a school
export async function getOutgoingTransfers(schoolId) {
  try {
    const response = await axios.get(
      `${NSMS_URL}/school/transfers/outgoing/${schoolId}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return (response.data || []).map((t) => ({
      ...t,
      from_school: t.from_school,
      to_school: t.to_school,
    }));
  } catch (error) {
    console.error("Error fetching outgoing transfers:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch outgoing transfers");
  }
}

// Get a single transfer by ID
export async function getTransferByID(transferId) {
  try {
    const response = await axios.get(`${NSMS_URL}/school/transfers/${transferId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching transfer:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch transfer");
  }
}

// Approve a transfer
export async function approveTransfer(transferId) {
  try {
    const response = await axios.put(
      `${NSMS_URL}/school/transfers/${transferId}/approve`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error approving transfer:", error);
    throw new Error(error.response?.data?.message || "Failed to approve transfer");
  }
}

// Finalize a transfer
export async function finalizeTransfer(transferId) {
  try {
    const response = await axios.patch(
      `${NSMS_URL}/school/transfers/${transferId}/finalize`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error finalizing transfer:", error);
    throw new Error(error.response?.data?.message || "Failed to finalize transfer");
  }
}

// Reject a transfer
export async function rejectTransfer(transferId, reason) {
  try {
    const response = await axios.patch(
      `${NSMS_URL}/school/transfers/${transferId}/reject`,
      { reason },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting transfer:", error);
    throw new Error(error.response?.data?.message || "Failed to reject transfer");
  }
}
