<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import api, { esListaVacia } from "@/services/api";
import { useNotify } from "@/composables/useNotify";

const { exito, error } = useNotify();

const ROLES = ["Top", "Jungle", "Mid", "ADC", "Support"];
const ESTADOS = ["activo", "inactivo"];
const headers: any[] = [
  { title: "Nickname", key: "nickname" },
  { title: "Nombre real", key: "nombre_real" },
  { title: "País", key: "pais" },
  { title: "Rol", key: "rol" },
  { title: "Estado", key: "estado" },
  { title: "Acciones", key: "acciones", sortable: false, align: "end" },
];

const jugadores = ref<any[]>([]);
const cargando = ref(false);
const filtros = reactive({
  search: "",
  rol: null as string | null,
  estado: null as string | null,
});

async function cargar() {
  cargando.value = true;
  try {
    const params: any = {};
    if (filtros.search) params.search = filtros.search;
    if (filtros.rol) params.rol = filtros.rol;
    if (filtros.estado) params.estado = filtros.estado;
    const { data } = await api.get("/jugadores", { params });
    jugadores.value = data;
  } catch (e) {
    if (esListaVacia(e)) jugadores.value = [];
    else error(e);
  } finally {
    cargando.value = false;
  }
}

// Espera 300 ms después de escribir antes de consultar
let temporizador: any;
watch(filtros, () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(cargar, 300);
});
onMounted(cargar);

// ----- Crear y editar -----
const dialogo = ref(false);
const editandoId = ref<number | null>(null);
const guardando = ref(false);
const form = ref<any>(null);
const formulario = reactive({ nickname: "", nombre_real: "", pais: "", rol: "", estado: "activo" });
const requerido = (v: string) => !!v || "Campo obligatorio";

function abrirNuevo() {
  editandoId.value = null;
  Object.assign(formulario, { nickname: "", nombre_real: "", pais: "", rol: "", estado: "activo" });
  dialogo.value = true;
}

function abrirEditar(j: any) {
  editandoId.value = j.id;
  Object.assign(formulario, {
    nickname: j.nickname,
    nombre_real: j.nombre_real ?? "",
    pais: j.pais ?? "",
    rol: j.rol,
    estado: j.estado,
  });
  dialogo.value = true;
}

async function guardar() {
  const { valid } = await form.value.validate();
  if (!valid) return;
  guardando.value = true;
  try {
    if (editandoId.value) {
      await api.put(`/jugadores/${editandoId.value}`, { ...formulario });
      exito("Jugador actualizado");
    } else {
      await api.post("/jugadores", { ...formulario });
      exito("Jugador creado");
    }
    dialogo.value = false;
    await cargar();
  } catch (e) {
    error(e);
  } finally {
    guardando.value = false;
  }
}

// ----- Eliminar -----
const eliminando = ref<any>(null);
const borrando = ref(false);

async function eliminar() {
  borrando.value = true;
  try {
    await api.delete(`/jugadores/${eliminando.value.id}`);
    exito("Jugador eliminado");
    eliminando.value = null;
    await cargar();
  } catch (e) {
    error(e);
  } finally {
    borrando.value = false;
  }
}
</script>

<template>
  <div>
    <div class="flex items-center mb-4">
        <h1 class="text-xl font-semibold">Jugadores</h1>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirNuevo">Nuevo jugador</v-btn>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <v-text-field v-model="filtros.search" label="Buscar por nickname" prepend-inner-icon="mdi-magnify" variant="outlined" density="comfortable" clearable hide-details />
        <v-select v-model="filtros.rol" :items="ROLES" label="Rol" variant="outlined" density="comfortable" clearable hide-details />
        <v-select v-model="filtros.estado" :items="ESTADOS" label="Estado" variant="outlined" density="comfortable" clearable hide-details />
    </div>

    <v-card class="mt-4">
      <v-data-table :headers="headers" :items="jugadores" :loading="cargando" no-data-text="No hay jugadores">
        <template #item.estado="{ item }">
          <v-chip :color="item.estado === 'activo' ? 'success' : 'grey'" size="small">{{ item.estado }}</v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="abrirEditar(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="eliminando = item" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Crear / editar -->
    <v-dialog v-model="dialogo" max-width="500">
      <v-card>
        <v-card-title>{{ editandoId ? "Editar jugador" : "Nuevo jugador" }}</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="formulario.nickname" label="Nickname" :rules="[requerido]" />
            <v-text-field v-model="formulario.nombre_real" label="Nombre real" />
            <v-text-field v-model="formulario.pais" label="País" />
            <v-select v-model="formulario.rol" :items="ROLES" label="Rol" :rules="[requerido]" />
            <v-select v-model="formulario.estado" :items="ESTADOS" label="Estado" :rules="[requerido]" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialogo = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="guardando" @click="guardar">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmar eliminación -->
    <v-dialog :model-value="!!eliminando" max-width="420" @update:model-value="eliminando = null">
      <v-card>
        <v-card-title>Eliminar jugador</v-card-title>
        <v-card-text>
          ¿Eliminar a <strong>{{ eliminando?.nickname }}</strong>? También se quitará de todos sus rosters.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="eliminando = null">Cancelar</v-btn>
          <v-btn color="error" :loading="borrando" @click="eliminar">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>