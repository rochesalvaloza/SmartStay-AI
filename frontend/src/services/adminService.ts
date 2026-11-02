import { API_URL } from "./api";

const getAdminToken = (): string => {
  return localStorage.getItem("smartstay_admin_token") || "";
};

const adminRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const token = getAdminToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Admin request failed.");
  }

  return data;
};

export const getAdminConversations = () =>
  adminRequest("/admin/conversations");

export const getAdminConversation = (conversationId: number) =>
  adminRequest(`/admin/conversations/${conversationId}`);

export const sendAdminReply = (
  conversationId: number,
  message: string
) =>
  adminRequest(`/admin/conversations/${conversationId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export const updateConversationStatus = (
  conversationId: number,
  status: "open" | "closed"
) =>
  adminRequest(`/admin/conversations/${conversationId}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });