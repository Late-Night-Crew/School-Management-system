import axios from "axios";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

export async function fetchregions() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.get(`${NSMS_URL}/admin/regions`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to fetch regions";
        throw new Error("Failed to fetch regions");
    }
}

export async function createregion(regionData) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.post(`${NSMS_URL}/admin/regions`, regionData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to create region";
        throw new Error("Failed to create region");
    }
}

export async function updateregion(regionId, regionData) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.put(`${NSMS_URL}/admin/regions/${regionId}`, regionData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to update region";
        throw new Error("Failed to update region");
    }
}

export async function deleteregion(regionId) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.delete(`${NSMS_URL}/admin/regions/${regionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to delete region";
        throw new Error("Failed to delete region");
    }
}

export async function fetchregionDetails(regionId) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        const response = await axios.get(`${NSMS_URL}/admin/regions/${regionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        error.response?.data?.message || "Failed to fetch region details";
        throw new Error("Failed to fetch region details");
    }
}