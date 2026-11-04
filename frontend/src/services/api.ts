const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiUrl =
  configuredApiUrl ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000/api" : "");

if (!apiUrl) {
  throw new Error(
    "Missing VITE_API_URL. Set it in the frontend hosting environment to your deployed Laravel API URL, ending in /api."
  );
}

export const API_URL = apiUrl.replace(/\/+$/, "");

