<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const { mdAndUp } = useDisplay();
const drawer = ref(mdAndUp.value);

async function salir() {
  await auth.logout();
  router.push("/login");
}
</script>

<template>
  <v-navigation-drawer v-model="drawer">
    <v-list nav>
      <v-list-item prepend-icon="mdi-account-group" title="Jugadores" to="/jugadores" />
      <v-list-item prepend-icon="mdi-shield-account" title="Rosters" to="/rosters" />
    </v-list>
  </v-navigation-drawer>

  <v-app-bar>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-app-bar-title>Panel de administración</v-app-bar-title>
    <span class="mr-4 text-sm">{{ auth.usuario?.nombre }}</span>
    <v-btn prepend-icon="mdi-logout" @click="salir">Salir</v-btn>
  </v-app-bar>

  <v-main>
    <v-container fluid>
      <router-view />
    </v-container>
  </v-main>
</template>