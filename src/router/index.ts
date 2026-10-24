import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AdminLayout from "@/layouts/AdminLayout.vue";
import LoginView from "@/views/LoginView.vue";
import JugadoresView from "@/views/JugadoresView.vue";
import RostersView from "@/views/RostersView.vue";
import RosterDetalleView from "@/views/RosterDetalleView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView },
    {
      path: "/",
      component: AdminLayout,
      redirect: "/jugadores",
      children: [
        { path: "jugadores", component: JugadoresView },
        { path: "rosters", component: RostersView },
        { path: "rosters/:id", component: RosterDetalleView },
      ],
    },
  ],
});

// Solo entra el admin. La seguridad real la sigue dando el backend.
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.cargado) await auth.cargarSesion();

  if (to.path === "/login") return auth.esAdmin ? "/" : true;
  return auth.esAdmin ? true : "/login";
});

export default router;