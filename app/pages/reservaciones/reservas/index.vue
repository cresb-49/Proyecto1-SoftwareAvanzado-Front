<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-brand-800">Mis reservaciones</h1>
      <Button size="sm" variant="secondary" to="/reservaciones"
        >← Regresar</Button
      >
    </header>

    <!-- Estado de carga/errores de cliente -->
    <div
      v-if="pendingClient"
      class="rounded-md border border-sand-300 bg-sand-50 px-3 py-2 text-sm text-brand-700"
    >
      Cargando datos de cliente…
    </div>
    <div
      v-else-if="errorClient"
      class="rounded-md border border-terra-500 bg-white px-3 py-2 text-sm text-terra-600"
    >
      No se pudo cargar la información del cliente.
    </div>

    <!-- Información de usuario -->
    <Card
      variant="elevated"
      title="Cuenta de usuario"
      subtitle="Datos básicos de tu sesión"
    >
      <div class="grid gap-2 text-sm text-brand-900 sm:grid-cols-2">
        <p>
          <span class="text-brand-700">Usuario:</span>
          {{ user?.username || "—" }}
        </p>
        <p>
          <span class="text-brand-700">Correo:</span> {{ user?.email || "—" }}
        </p>
        <p>
          <span class="text-brand-700">Nit:</span> {{ client?.nit || "—" }}
        </p>
      </div>
    </Card>

    <!-- Filtro / búsqueda -->
    <Card
      variant="elevated"
      title="Buscar reservaciones"
      subtitle="Filtra por NIT y/o Hotel"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <Select
            v-model="selectedHotelId"
            :options="hotelOptions"
            label="Hotel"
            placeholder="Todos"
            clearable
            size="md"
          />
        </div>
        <div class="sm:col-span-2 flex flex-wrap items-center gap-2 pt-1">
          <Button variant="primary" @click="onSearch" :loading="pendingSearch">Buscar</Button>
          <Button variant="secondary" @click="onClear" :disabled="pendingSearch">Limpiar</Button>
        </div>
      </div>
    </Card>

    <!-- Resultados -->
    <Card
      variant="outline"
      title="Resultados"
      subtitle="Reservaciones encontradas"
    >
      <div v-if="pendingSearch" class="text-brand-700 text-sm">
        Buscando reservaciones…
      </div>
      <div v-else-if="reservations.length === 0" class="text-brand-700 text-sm">
        Sin resultados.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-sand-300 text-left">
              <th class="py-2 px-2">#</th>
              <th class="py-2 px-2">Hotel</th>
              <th class="py-2 px-2">Habitación</th>
              <th class="py-2 px-2">Check-in</th>
              <th class="py-2 px-2">Check-out</th>
              <th class="py-2 px-2 text-center">Pagada</th>
              <th class="py-2 px-2 text-right">Total</th>
              <th class="py-2 px-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in reservations"
              :key="r.id"
              class="border-b border-sand-100"
            >
              <td class="py-2 px-2">{{ i + 1 }}</td>
              <td class="py-2 px-2">{{ hotelNameById(r.hotelId) }}</td>
              <td class="py-2 px-2">{{ formatRoomLabel(r.roomId) }}</td>
              <td class="py-2 px-2">{{ formatDate(r.checkInDate) }}</td>
              <td class="py-2 px-2">{{ formatDate(r.checkOutDate) }}</td>
              <td class="py-2 px-2 text-center">
                <span
                  :class="
                    r.paid
                      ? 'bg-sage-500 text-white'
                      : 'bg-gold-400 text-ink-900'
                  "
                  class="inline-flex rounded px-2 py-0.5 text-xs"
                >
                  {{ r.paid ? "Sí" : "No" }}
                </span>
              </td>
              <td class="py-2 px-2 text-right">
                Q {{ formatCurrency(r.total) }}
              </td>
              <td class="py-2 px-2 text-right">
                <Button
                  v-if="r.paid"
                  size="sm"
                  variant="info"
                  :to="`/reservaciones/comprobante/${r.id}`"
                >
                  Comprobante
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { computed } from "vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useAuth } from "~/composables/useAuth";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useClientService } from "~/services/client";
import type { Client } from "~/services/client";

import { ref, watchEffect } from "vue";
import InputText from "~/components/ui/InputText.vue";
import Select from "~/components/ui/Select.vue";
import { useReservationService } from "~/services/reservations";
import { useHotelService } from "~/services/hotels";
import { useRoomService } from "~/services/rooms";
import { useToast } from "~/composables/useToast";
import type { Reservation } from "~/services/reservations";

// Solo clientes pueden acceder
const { redirectIfUnauthorized } = useUseRoles();
redirectIfUnauthorized([Roles.CUSTOMER], "/");

// Usuario autenticado
const { user } = useAuth();

// Cliente asociado (por clientId del usuario)
const clients = useClientService();
const clientId = computed(() => String(user.value?.clientId || ""));

const {
  data: clientData,
  pending: pendingClient,
  error: errorClient,
} = await useAsyncData(
  () => `client:${clientId.value || "none"}`,
  () =>
    clientId.value ? clients.getById(clientId.value) : Promise.resolve(null),
  { watch: [clientId], server: true }
);

const client = computed<Client | null>(() => (clientData.value as any) || null);

const toast = useToast();
const reservationSvc = useReservationService();
const hotelSvc = useHotelService();
const roomSvc = useRoomService();
const roomMap = ref<Record<string, number>>({}); // id -> room number

// Filtros
const nit = ref<string>("");
watchEffect(() => {
  if (!nit.value && client.value?.nit) nit.value = client.value.nit;
});
const selectedHotelId = ref<string | null>(null);

// Resultados
const reservations = ref<Reservation[]>([]);
const pendingSearch = ref(false);

// Catálogo de hoteles
const { data: hotelsData } = await useAsyncData(
  "reservaciones:hotels",
  () => hotelSvc.getAll?.(),
  { server: true }
);
const hotelMap = computed<Record<string, string>>(() => {
  const arr: any[] = Array.isArray(hotelsData.value)
    ? (hotelsData.value as any)
    : hotelsData.value || [];
  const map: Record<string, string> = {};
  arr.forEach((h: any) => {
    map[h.id] = h.name;
  });
  return map;
});
const hotelOptions = computed(() =>
  Object.entries(hotelMap.value).map(([value, label]) => ({ value, label }))
);
function hotelNameById(id: string) {
  return hotelMap.value[id] || id;
}

async function resolveRooms(list: Reservation[]) {
  const ids = Array.from(new Set(list.map((r) => r.roomId).filter(Boolean)));
  if (ids.length === 0) {
    roomMap.value = {};
    return;
  }
  try {
    const rooms = (await roomSvc.getByIds(ids)) as any[];
    const map: Record<string, number> = {};
    rooms.forEach((rm: any) => {
      if (rm?.id) map[rm.id] = Number(rm.number);
    });
    roomMap.value = map;
  } catch (e) {
    roomMap.value = {};
  }
}

function formatRoomLabel(roomId: string) {
  const num = roomMap.value[roomId];
  return `#${num != null ? num : roomId.slice(0, 8)}`;
}

// Formatos
function formatCurrency(n: number | string | null | undefined) {
  return Number(n || 0).toFixed(2);
}
function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? String(v)
    : new Intl.DateTimeFormat("es-GT", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(d);
}

// Acciones
async function onSearch() {
  if (!nit.value && !selectedHotelId.value) {
    toast.error("Ingrese un NIT o seleccione un hotel");
    return;
  }
  pendingSearch.value = true;
  try {
    let data: Reservation[] = [];
    if (nit.value && selectedHotelId.value) {
      data = (await reservationSvc.getReservationsByNitAndHotel(
        nit.value,
        selectedHotelId.value
      )) as any;
    } else if (nit.value) {
      data = (await reservationSvc.getReservationsByNit(nit.value)) as any;
    } else if (selectedHotelId.value) {
      data = (await reservationSvc.reservationsByHotel(
        selectedHotelId.value
      )) as any;
    }
    reservations.value = Array.isArray(data) ? data : data || [];
    await resolveRooms(reservations.value);
  } catch (e: any) {
    reservations.value = [];
    toast.error("No se pudieron obtener reservaciones");
  } finally {
    pendingSearch.value = false;
  }
}
function onClear() {
  nit.value = client.value?.nit || "";
  selectedHotelId.value = null;
  reservations.value = [];
  roomMap.value = {};
}
</script>

<style></style>
