const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

// Local Laravel development URL is used only by Vite's development server.
// Production must set VITE_API_URL in the hosting dashboard (Vercel).
export const API_URL = (
  configuredApiUrl ||
  (import.meta.env.DEV
    ? "http://127.0.0.1:8000/api"
    : "https://YOUR-KOYEB-SERVICE.koyeb.app/api")
).replace(/\/+$/, "");
