import { defineStore } from "pinia";
import api from "@/services/api";

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  perfil: string;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    usuario: null as Usuario | null,
    cargado: false,
  }),
  getters: {
    esAdmin: (state) => state.usuario?.perfil === "admin",
  },
  actions: {
    async login(email: string, password: string) {
      const { data } = await api.post("/auth/login", { email, password });
      this.usuario = data.usuario;
    },
    async cargarSesion() {
      try {
        const { data } = await api.get("/auth/me");
        this.usuario = data;
      } catch {
        this.usuario = null;
      } finally {
        this.cargado = true;
      }
    },
    async logout() {
      try {
        await api.post("/auth/logout");
      } finally {
        this.usuario = null;
      }
    },
  },
});