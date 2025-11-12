import axios from "axios";
import {
  AUTH_TOKEN_KEY,
  DISPLAY_NAME_KEY,
  USER_ROLE_KEY,
} from "../../constants/storageKeys";

const NSMS_URL = import.meta.env.VITE_NSMS_URL;

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${NSMS_URL}/login`, { email, password });

      if (response.status === 200) {
        const { token, display_name, role } = response.data;

        console.log("Login response role:", role); // debug

        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(DISPLAY_NAME_KEY, display_name || "User");
        localStorage.setItem(USER_ROLE_KEY, role);

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
};

export default AuthService;
