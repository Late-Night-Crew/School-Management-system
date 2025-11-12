import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

export async function fetchacademics() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.get(`${NSMS_URL}/admin/academic_years`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to fetch academic years";
        throw new Error("Failed to fetch academic years");
    }
}

export async function fetchacademicById(academicId) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.get(`${NSMS_URL}/admin/academic_years/${academicId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to fetch academic year";
        throw new Error("Failed to fetch academic year");
    }
}

export async function createacademic(academicData) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.post(`${NSMS_URL}/admin/academic_years`, academicData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to create academic year";
        throw new Error("Failed to create academic year");
    }
}
export async function updateacademic(academicId, academicData) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.put(`${NSMS_URL}/admin/academic_years/${academicId}`, academicData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to update academic year";
        throw new Error("Failed to update academic year");
    }
}
export async function deleteacademic(academicId) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.delete(`${NSMS_URL}/admin/academic_years/${academicId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to delete academic year";
        throw new Error("Failed to delete academic year");
    }
}

