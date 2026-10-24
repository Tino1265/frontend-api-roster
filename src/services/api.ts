import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

const leerCookie = (nombre: string) =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith(nombre + "="))
    ?.split("=")[1];

// En POST, PUT y DELETE agrega el header CSRF que exige el backend
api.interceptors.request.use((config) => {
  const metodo = (config.method || "get").toLowerCase();
  if (!["get", "head", "options"].includes(metodo)) {
    const token = leerCookie("csrf_token");
    if (token) config.headers.set("X-CSRF-Token", token);
  }
  return config;
});

// Si la sesión expira mientras se usa la app, vuelve al login
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url: string = error.config?.url || "";
    if (error.response?.status === 401 && !url.startsWith("/auth/") && location.pathname !== "/login") {
      location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Tu backend responde 400 con el texto "No hay ..." cuando una lista está vacía.
// Si lo cambias a 200 con [], esta función simplemente deja de usarse.
export const esListaVacia = (error: any) =>
  error?.response?.status === 400 &&
  typeof error.response.data === "string" &&
  error.response.data.startsWith("No hay");

export default api;