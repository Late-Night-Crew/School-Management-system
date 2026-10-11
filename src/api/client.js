import axios from "axios";
import { clearSession, getToken, setMustChangePassword } from "../auth/session";

// Error thrown by every API call; `message` is safe to show to the user.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// The backend reports errors as problem details: { title, detail }
function errorMessage(error) {
  if (!error.response) {
    return error.request ? "Cannot reach the server. Check your connection and try again." : error.message;
  }
  const { data, status } = error.response;
  return data?.detail || data?.message || data?.title || `Request failed (${status})`;
}

const client = axios.create({ baseURL: import.meta.env.VITE_NSMS_URL });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // An expired or rejected token, or a deactivated account, ends the session
    // (but a failed login does not)
    if (status === 401 && error.config?.url !== "/login") {
      clearSession();
      window.location.hash = "#/login";
    }
    // A temporary password must be changed before anything else
    if (status === 403 && error.response.data?.type?.endsWith("/PasswordChangeRequired")) {
      setMustChangePassword(true);
      window.location.hash = "#/change-password";
    }
    return Promise.reject(new ApiError(errorMessage(error), status));
  }
);

// Response helpers for the API modules
export const data = (response) => response.data;
export const list = (response) => (Array.isArray(response.data) ? response.data : []);

// Drops empty values so they are not sent as query parameters
export const params = (filters = {}) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value != null));

export default client;
