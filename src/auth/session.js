// The logged-in user's session, kept in localStorage.
// Everything that reads or writes auth data goes through this module.

const KEYS = {
  token: "authToken",
  displayName: "displayName",
  role: "role",
  userId: "userId",
  email: "userEmail",
  regionId: "regionId",
  districtId: "districtId",
  schoolId: "schoolId",
  mustChangePassword: "mustChangePassword",
};

// Roles issued by the backend in the login response and the JWT "role" claim
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  REGIONAL_ADMIN: "REGIONAL_ADMIN",
  SCHOOL_MANAGER: "SCHOOL_MANAGER",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.REGIONAL_ADMIN]: "Regional Admin",
  [ROLES.SCHOOL_MANAGER]: "School Manager",
};

// Stores the body of a successful POST /login response
export function saveSession(login) {
  const values = {
    token: login.token,
    displayName: login.display_name || "User",
    role: login.role,
    userId: login.user_id,
    email: login.email,
    regionId: login.region_id,
    districtId: login.district_id,
    schoolId: login.school_id,
    mustChangePassword: login.must_change_password ? "true" : "",
  };
  Object.entries(values).forEach(([name, value]) => {
    localStorage.setItem(KEYS[name], value == null ? "" : String(value));
  });
}

export function clearSession() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

export const getToken = () => localStorage.getItem(KEYS.token);

// Reads the token's expiry (ms since epoch) without verifying it; the backend
// verifies the signature on every request. Returns 0 for an unreadable token.
function tokenExpiresAt(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return exp ? exp * 1000 : Infinity;
  } catch {
    return 0;
  }
}

// The logged-in user, or null when there is no token or it has expired
export function getSession() {
  const token = getToken();
  if (!token || tokenExpiresAt(token) <= Date.now()) return null;
  const read = (name) => localStorage.getItem(KEYS[name]) || "";
  return {
    token,
    role: read("role").toUpperCase(),
    displayName: read("displayName") || "User",
    email: read("email"),
    userId: read("userId"),
    regionId: read("regionId"),
    districtId: read("districtId"),
    schoolId: read("schoolId"),
    mustChangePassword: read("mustChangePassword") === "true",
  };
}

// Records whether the account still has a temporary password that must be changed
export function setMustChangePassword(value) {
  localStorage.setItem(KEYS.mustChangePassword, value ? "true" : "");
}

// Landing page for the session's role, or null if the account cannot use the app
export function homePath(session) {
  switch (session?.role) {
    case ROLES.SUPER_ADMIN:
      return "/admin/dashboard";
    case ROLES.REGIONAL_ADMIN:
      return session.regionId ? `/regional/${session.regionId}/dashboard` : null;
    case ROLES.SCHOOL_MANAGER:
      return session.schoolId ? `/school/${session.schoolId}/dashboard` : null;
    default:
      return null;
  }
}

// Whether the session may open a page: admins under /admin, regional admins
// under their own /regional/:id, school managers under their own /school/:id
export function canAccess(pathname, session) {
  if (!session) return false;
  const [section, id] = pathname.split("/").filter(Boolean);
  switch (section) {
    case "admin":
      return session.role === ROLES.SUPER_ADMIN;
    case "regional":
      return session.role === ROLES.REGIONAL_ADMIN && id === session.regionId;
    case "school":
      return session.role === ROLES.SCHOOL_MANAGER && id === session.schoolId;
    default:
      return false;
  }
}
