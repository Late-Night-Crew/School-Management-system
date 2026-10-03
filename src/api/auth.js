import client, { data } from "./client";
import { clearSession, saveSession } from "../auth/session";

// Signs in and stores the session; resolves to the login response
export async function login(email, password) {
  const response = await client.post("/login", { email, password }).then(data);
  saveSession(response);
  return response;
}

export const logout = clearSession;
