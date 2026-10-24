<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import api, { esListaVacia } from "@/services/api";
import { useNotify } from "@/composables/useNotify";

const router = useRouter();
const { exito, error } = useNotify();

const TIPOS = ["Principal", "Academy"];
const headers: any[] = [
  { title: "Nombre", key: "nombre" },
  { title: "Juego", key: "juego" },
  { title: "Tipo", key: "tipo" },
  { title: "Temporada", key: "temporada" },
  { title: "Acciones", key: "acciones", sortable: false, align: "end" },
];

const rosters = ref<any[]>([]);
const cargando = ref(false);
const filtros = reactive({ tipo: null as string | null, temporada: "" });

async function cargar() {
  cargando.value = true;
  try {
    const params: any = {};
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.temporada) params.temporada = filtros.temporada;
    const { data } = await api.get("/rosters", { params });
    rosters.value = data;
  } catch (e) {
    if (esListaVacia(e)) rosters.value = [];
    else error(e);
  } finally {
    cargando.value = false;
  }
}

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
const formulario = reactive({ nombre: "", juego: "League of legends", tipo: "", temporada: "" });
const requerido = (v: string) => !!v || "Campo obligatorio";

function abrirNuevo() {
  editandoId.value = null;
  Object.assign(formulario, { nombre: "", juego: "League of legends", tipo: "", temporada: "" });
  dialogo.value = true;
}

function abrirEditar(r: any) {
  editandoId.value = r.id;
  Object.assign(formulario, { nombre: r.nombre, juego: r.juego, tipo: r.tipo, temporada: r.temporada });
  dialogo.value = true;
}

async function guardar() {
  const { valid } = await form.value.validate();
  if (!valid) return;
  guardando.value = true;
  try {
    if (editandoId.value) {
      await api.put(`/rosters/${editandoId.value}`, { ...formulario });
      exito("Roster actualizado");
    } else {
      await api.post("/rosters", { ...formulario });
      exito("Roster creado");
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
    await api.delete(`/rosters/${eliminando.value.id}`);
    exito("Roster eliminado");
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
      <h1 class="text-xl font-semibold">Rosters</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirNuevo">Nuevo roster</v-btn>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <v-select v-model="filtros.tipo" :items="TIPOS" label="Tipo" variant="outlined" density="comfortable" clearable hide-details />
      <v-text-field v-model="filtros.temporada" label="Temporada" variant="outlined" density="comfortable" clearable hide-details />
    </div>

    <v-card class="mt-4">
      <v-data-table :headers="headers" :items="rosters" :loading="cargando" no-data-text="No hay rosters">
        <template #item.tipo="{ item }">
          <v-chip :color="item.tipo === 'Principal' ? 'primary' : 'secondary'" size="small">{{ item.tipo }}</v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn icon="mdi-account-multiple" variant="text" size="small" title="Ver jugadores" @click="router.push(`/rosters/${item.id}`)" />
          <v-btn icon="mdi-pencil" variant="text" size="small" @click="abrirEditar(item)" />
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="eliminando = item" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Crear / editar -->
    <v-dialog v-model="dialogo" max-width="500">
      <v-card>
        <v-card-title>{{ editandoId ? "Editar roster" : "Nuevo roster" }}</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="formulario.nombre" label="Nombre" :rules="[requerido]" />
            <v-text-field v-model="formulario.juego" label="Juego" :rules="[requerido]" />
            <v-select v-model="formulario.tipo" :items="TIPOS" label="Tipo" :rules="[requerido]" />
            <v-text-field v-model="formulario.temporada" label="Temporada" :rules="[requerido]" />
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
        <v-card-title>Eliminar roster</v-card-title>
        <v-card-text>
          ¿Eliminar el roster <strong>{{ eliminando?.nombre }}</strong>? Los jugadores no se eliminan, solo dejan de estar en él.
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