import axios from "axios";
import {
  AUTH_TOKEN_KEY,
  DISPLAY_NAME_KEY,
  USER_ROLE_KEY,
  USER_ID_KEY,
  USER_EMAIL_KEY,
  REGION_ID_KEY,
  DISTRICT_ID_KEY,
  SCHOOL_ID_KEY,
  IS_SUPER_ADMIN_KEY,
} from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${NSMS_URL}/login`, { email, password });

      if (response.status === 200) {
        const {
          token,
          display_name,
          role,
          user_id,
          email: userEmail,
          region_id,
          district_id,
          school_id,
          is_super_admin,
        } = response.data;

        console.log("Login response role:", role); // debug

        // Store all user data
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(DISPLAY_NAME_KEY, display_name || "User");
        localStorage.setItem(USER_ROLE_KEY, role);
        localStorage.setItem(USER_ID_KEY, user_id);
        localStorage.setItem(USER_EMAIL_KEY, userEmail || "");
        localStorage.setItem(REGION_ID_KEY, region_id || "");
        localStorage.setItem(DISTRICT_ID_KEY, district_id || "");
        localStorage.setItem(SCHOOL_ID_KEY, school_id || "");
        localStorage.setItem(IS_SUPER_ADMIN_KEY, is_super_admin ? "true" : "false");

        return response.data;
      } else {
        throw new Error(`Login failed with status ${response.status}`);
      }
    } catch (error) {
      const apiError = error.response?.data;
      const message =
        apiError?.detail ||
        apiError?.title ||
        "Login failed. Please try again.";
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(DISPLAY_NAME_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(REGION_ID_KEY);
    localStorage.removeItem(DISTRICT_ID_KEY);
    localStorage.removeItem(SCHOOL_ID_KEY);
    localStorage.removeItem(IS_SUPER_ADMIN_KEY);
  },
};

export default AuthService;
