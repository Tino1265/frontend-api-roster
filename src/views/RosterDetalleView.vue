<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api, { esListaVacia } from "@/services/api";
import { useNotify } from "@/composables/useNotify";

const route = useRoute();
const router = useRouter();
const id = route.params.id;
const { exito, error } = useNotify();

const headers: any[] = [
  { title: "Nickname", key: "nickname" },
  { title: "Rol de juego", key: "rol" },
  { title: "Rol en el roster", key: "rol_en_roster" },
  { title: "Acciones", key: "acciones", sortable: false, align: "end" },
];

const roster = ref<any>(null);
const todos = ref<any[]>([]);
const cargando = ref(false);

// Aplana el rol que viene dentro de la tabla intermedia (Roster_Jugador)
const filas = computed<any[]>(() =>
  (roster.value?.jugadores ?? []).map((j: any) => ({
    ...j,
    rol_en_roster: j.Roster_Jugador?.rol_en_roster,
  }))
);
const titulares = computed(() => filas.value.filter((j: any) => j.rol_en_roster === "Titular").length);

// Jugadores que todavía no están en este roster
const disponibles = computed(() =>
  todos.value
    .filter((j) => !filas.value.some((f: any) => f.id === j.id))
    .map((j) => ({ title: `${j.nickname} (${j.rol})`, value: j.id }))
);

async function cargarRoster() {
  cargando.value = true;
  try {
    const { data } = await api.get(`/rosters/${id}`);
    roster.value = data;
  } catch (e) {
    error(e);
    router.push("/rosters");
  } finally {
    cargando.value = false;
  }
}

async function cargarJugadores() {
  try {
    const { data } = await api.get("/jugadores");
    todos.value = data;
  } catch (e) {
    if (esListaVacia(e)) todos.value = [];
    else error(e);
  }
}

onMounted(async () => {
  await cargarRoster();
  await cargarJugadores();
});

// ----- Asignar jugador -----
const dialogo = ref(false);
const asignando = ref(false);
const nuevo = reactive({ id_jugador: null as number | null, rol_en_roster: "Suplente" });

function abrirAsignar() {
  nuevo.id_jugador = null;
  nuevo.rol_en_roster = "Suplente";
  dialogo.value = true;
}

async function asignar() {
  if (!nuevo.id_jugador) {
    error({ message: "Elige un jugador" });
    return;
  }
  asignando.value = true;
  try {
    await api.post(`/rosters/${id}/jugadores`, { ...nuevo });
    exito("Jugador asignado");
    dialogo.value = false;
    await cargarRoster();
  } catch (e) {
    error(e); // aquí llegan las reglas: máximo 5 titulares, rol repetido, etc.
  } finally {
    asignando.value = false;
  }
}

// ----- Cambiar rol -----
async function cambiarRol(j: any) {
  const rol = j.rol_en_roster === "Titular" ? "Suplente" : "Titular";
  try {
    await api.put(`/rosters/${id}/jugadores/${j.id}`, { rol_en_roster: rol });
    exito(`${j.nickname} ahora es ${rol}`);
    await cargarRoster();
  } catch (e) {
    error(e);
  }
}

// ----- Quitar del roster -----
const quitando = ref<any>(null);
const borrando = ref(false);

async function quitar() {
  borrando.value = true;
  try {
    await api.delete(`/rosters/${id}/jugadores/${quitando.value.id}`);
    exito("Jugador quitado del roster");
    quitando.value = null;
    await cargarRoster();
  } catch (e) {
    error(e);
  } finally {
    borrando.value = false;
  }
}
</script>

<template>
  <div>
    <v-btn variant="text" prepend-icon="mdi-arrow-left" class="mb-2" @click="router.push('/rosters')">
      Volver a rosters
    </v-btn>

    <v-card v-if="roster" class="mb-4">
      <v-card-title>{{ roster.nombre }}</v-card-title>
      <v-card-subtitle>{{ roster.juego }} · {{ roster.tipo }} · Temporada {{ roster.temporada }}</v-card-subtitle>
      <v-card-text>
        <v-chip :color="titulares === 5 ? 'success' : 'warning'">Titulares: {{ titulares }}/5</v-chip>
      </v-card-text>
    </v-card>

    <div class="flex items-center mb-2">
        <h2 class="text-lg font-medium">Jugadores del roster</h2>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-account-plus" @click="abrirAsignar">Asignar jugador</v-btn>
    </div>

    <v-card>
      <v-data-table :headers="headers" :items="filas" :loading="cargando" no-data-text="Este roster no tiene jugadores">
        <template #item.rol_en_roster="{ item }">
          <v-chip :color="item.rol_en_roster === 'Titular' ? 'primary' : 'grey'" size="small">
            {{ item.rol_en_roster }}
          </v-chip>
        </template>
        <template #item.acciones="{ item }">
          <v-btn size="small" variant="tonal" class="mr-2" @click="cambiarRol(item)">
            Pasar a {{ item.rol_en_roster === "Titular" ? "Suplente" : "Titular" }}
          </v-btn>
          <v-btn icon="mdi-account-remove" variant="text" size="small" color="error" title="Quitar del roster" @click="quitando = item" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Asignar jugador -->
    <v-dialog v-model="dialogo" max-width="500">
      <v-card>
        <v-card-title>Asignar jugador</v-card-title>
        <v-card-text>
          <v-select
            v-model="nuevo.id_jugador"
            :items="disponibles"
            label="Jugador"
            no-data-text="No quedan jugadores disponibles"
          />
          <v-select v-model="nuevo.rol_en_roster" :items="['Titular', 'Suplente']" label="Rol en el roster" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialogo = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="asignando" @click="asignar">Asignar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirmar quitar -->
    <v-dialog :model-value="!!quitando" max-width="420" @update:model-value="quitando = null">
      <v-card>
        <v-card-title>Quitar del roster</v-card-title>
        <v-card-text>
          ¿Quitar a <strong>{{ quitando?.nickname }}</strong> de este roster? El jugador no se elimina.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="quitando = null">Cancelar</v-btn>
          <v-btn color="error" :loading="borrando" @click="quitar">Quitar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>