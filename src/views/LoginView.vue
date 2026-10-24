<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { mensajeDe } from "@/composables/useNotify";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const cargando = ref(false);
const mensaje = ref("");

const requerido = (v: string) => !!v || "Campo obligatorio";

async function entrar() {
  mensaje.value = "";
  cargando.value = true;
  try {
    await auth.login(email.value, password.value);
    if (!auth.esAdmin) {
      await auth.logout();
      mensaje.value = "Esta aplicación es solo para administradores";
      return;
    }
    router.push("/");
  } catch (e) {
    mensaje.value = mensajeDe(e);
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <v-card class="w-full max-w-md p-6" elevation="4">
      <h1 class="text-xl font-semibold text-center mb-6">Rosters · Administración</h1>
      <v-form @submit.prevent="entrar">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          variant="outlined"
          autocomplete="username"
          :rules="[requerido]"
        />
        <v-text-field
          v-model="password"
          label="Contraseña"
          type="password"
          variant="outlined"
          autocomplete="current-password"
          :rules="[requerido]"
        />
        <v-alert v-if="mensaje" type="error" variant="tonal" class="mb-4">{{ mensaje }}</v-alert>
        <v-btn type="submit" color="primary" size="large" block :loading="cargando">
          Iniciar sesión
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>