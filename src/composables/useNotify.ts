import { reactive } from "vue";

const estado = reactive({ visible: false, texto: "", color: "success" });

// Extrae un mensaje legible de los distintos formatos de error del backend
export function mensajeDe(e: any): string {
  const d = e?.response?.data;
  if (!d) return e?.message || "No se pudo conectar con el servidor";
  if (typeof d === "string") return d;
  if (d.message) return d.message;
  if (d.mensaje) return d.mensaje;
  if (typeof d.error === "string") return d.error;
  if (Array.isArray(d.errors)) return d.errors.map((x: any) => x.msg || x.message || String(x)).join(". ");
  if (typeof d.errors === "string") return d.errors;
  return "Ocurrió un error";
}

export function useNotify() {
  const mostrar = (texto: string, color: string) => {
    estado.texto = texto;
    estado.color = color;
    estado.visible = true;
  };
  return {
    estado,
    exito: (texto: string) => mostrar(texto, "success"),
    error: (e: any) => mostrar(mensajeDe(e), "error"),
  };
}