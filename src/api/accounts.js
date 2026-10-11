// Accounts and contacts.
//
// The signed-in user's own account: contact numbers and password. An account with a
// temporary password can only read itself and change its password.
//
// Managing accounts: the super admin manages regional admins and school managers; a
// regional admin manages the school managers in their region. Creating an account or
// resetting a password returns a temporary password that is shown once.
//
// The contact directory: offices and people outside NSMS, with what the caller may see.
import client, { data, list, params } from "./client";

export const getMyAccount = () => client.get("/account/me").then(data);
// { phone, whatsapp }: any common Malawi format; stored as +265...
export const updateMyContact = (contact) => client.put("/account/me/contact", contact).then(data);
export const changeMyPassword = (currentPassword, newPassword) =>
  client.post("/account/password", { current_password: currentPassword, new_password: newPassword });

// filters: { role, region_id }
export const listAccounts = (filters) => client.get("/accounts", { params: params(filters) }).then(list);
// account: { name, email, role, region_id (regional admin) | school_id (school manager), phone, whatsapp }
// Resolves to { account, temporary_password }
export const createAccount = (account) => client.post("/accounts", account).then(data);
export const updateAccount = (id, account) => client.put(`/accounts/${id}`, account).then(data);
export const deactivateAccount = (id, reason) => client.post(`/accounts/${id}/deactivate`, { reason }).then(data);
export const activateAccount = (id) => client.post(`/accounts/${id}/activate`).then(data);
export const resetAccountPassword = (id) => client.post(`/accounts/${id}/reset-password`).then(data);

// { ministry: [person], regions: [{ id, name, office, admin, can_edit, is_own }],
//   schools: [{ id, name, school_number, district_name, region_id, region_name, office,
//               head_teacher_name, head_teacher_phone, managers: [person], can_edit, is_own }] }
export const getDirectory = () => client.get("/contacts/directory").then(data);
// office: { phone, email, postal_address, physical_address }
export const updateRegionOffice = (id, office) => client.put(`/contacts/regions/${id}/office`, office);
// office: { phone, email, postal_address, head_teacher_name, head_teacher_phone }
export const updateSchoolOffice = (id, office) => client.put(`/contacts/schools/${id}/office`, office);
