import { API_URL } from "./api";

export interface Customer {
  id: number;
  name: string;
  email: string;
}

export interface Admin {
  id: number;
  name: string;
  email: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: Customer | Admin;
}

const TOKEN_KEY = "smartstay_customer_token";
const USER_KEY = "smartstay_customer";

const ADMIN_TOKEN_KEY = "smartstay_admin_token";
const ADMIN_USER_KEY = "smartstay_admin";

async function authRequest(
  endpoint: string,
  data: Record<string, string>
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Authentication failed.");
  }

  return result as AuthResponse;
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<"customer" | "admin"> {
  // Clear any previous session before logging in.
  logoutCustomer();
  logoutAdmin();

  // Try customer login first.
  try {
    const result = await authRequest("/login", data);

    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));

    window.dispatchEvent(new Event("customer-auth-changed"));

    return "customer";
  } catch {
    // If customer login fails, try administrator login.
  }

  // Try administrator login.
  const result = await authRequest("/admin/login", data);

  localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(result.user));

  window.dispatchEvent(new Event("admin-auth-changed"));

  return "admin";
}

export function registerCustomer(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> {
  return authRequest("/register", data);
}

export function logoutCustomer(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("customer-auth-changed"));
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  window.dispatchEvent(new Event("admin-auth-changed"));
}

export function getCustomerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getStoredCustomer(): Customer | null {
  const user = localStorage.getItem(USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user) as Customer;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getStoredAdmin(): Admin | null {
  const user = localStorage.getItem(ADMIN_USER_KEY);

  if (!user) return null;

  try {
    return JSON.parse(user) as Admin;
  } catch {
    localStorage.removeItem(ADMIN_USER_KEY);
    return null;
  }
}
