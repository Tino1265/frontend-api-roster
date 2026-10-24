<script setup lang="ts">
import { useNotify } from "@/composables/useNotify";

const { estado } = useNotify();
</script>

<template>
  <v-app>
    <router-view />
    <v-snackbar v-model="estado.visible" :color="estado.color" :timeout="4000" location="top right">
      {{ estado.texto }}
    </v-snackbar>
  </v-app>
</template>