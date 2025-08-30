<template>
  <div class="mx-auto max-w-6xl px-4 py-6">
    <!-- Header + Filtros -->
    <div
      class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold text-brand-900">Reservaciones</h1>
        <p class="text-sm text-brand-700">
          Filtra por hotel y/o cliente. Si no eliges nada, se muestran todas.
        </p>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <div class="w-60">
          <Select v-if="isAdmin"
            v-model="selectedHotelId"
            :options="hotelOptions"
            label="Hotel"
            placeholder="Todos los hoteles"
            clearable
            size="sm"
            :disabled="!isAdmin"
          />
          <p v-if="!isAdmin && selectedHotelId" class="text-xs text-brand-700">Hotel asignado: {{ hotelNameById[selectedHotelId] || selectedHotelId }}</p>
        </div>
        <Button v-if="canManage" size="sm" variant="primary" :to="createPath">
          Crear reservación
        </Button>
      </div>
    </div>

    <!-- Tabla -->
    <Table
      :columns="cols"
      :items="rows"
      :loading="pending"
      :page-size="10"
      v-model:page="page"
      v-model:search="search"
    >
      <template #title>Listado de reservaciones</template>

      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <Button size="sm" variant="info" :to="`/reservaciones/${row.id}`"
            >Ver</Button
          >
          <Button size="sm" variant="danger" @click="onDelete(row)"
            >Eliminar</Button
          >
        </div>
      </template>
    </Table>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { ref, computed, watchEffect } from "vue";
import Button from "~/components/ui/Button.vue";
import Table, { type Column } from "~/components/ui/Table.vue";
import Select from "~/components/ui/Select.vue";
import { useReservationService } from "~/services/reservations";
import { useHotelService } from "~/services/hotels";
import { useToast } from "~/composables/useToast";
import { useRoomService } from "~/services/rooms";
import { Roles } from "#imports";
import { useUseRoles } from "~/composables/useRoles";
import { useAuth } from "~/composables/useAuth";
import { useEmployeeService } from "~/services/employee";
import { useClientService } from "~/services/client";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const { user } = useAuth();
const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]));
const employeeSvc = useEmployeeService();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER, Roles.HOTEL_EMPLOYEE];
const canManage = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const toast = useToast();
const reservationsSvc = useReservationService();
const hotelsSvc = useHotelService();
const roomService = useRoomService();

// Filtros (declarar antes de watchers que los usan)
const selectedHotelId = ref<string | null>(null);
const selectedCustomerId = ref<string | null>(null);
const page = ref(1);
const search = ref("");

// Cargar empleado (para usuarios no ADMIN) y fijar hotel asignado
const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ''}`,
  () => (user.value?.employeeId ? employeeSvc.getById(String(user.value.employeeId)) : Promise.resolve(null)),
  { server: true }
);
const employeeHotelId = computed<string | null>(() => (employeeData.value as any)?.hotelId ?? null);

watchEffect(() => {
  // Si no es admin, forzamos el hotel asignado
  if (!isAdmin.value && employeeHotelId.value && selectedHotelId.value !== employeeHotelId.value) {
    selectedHotelId.value = employeeHotelId.value;
  }
});

const createPath = computed(() =>
  selectedHotelId.value
    ? `/reservaciones/crear?hotelId=${selectedHotelId.value}`
    : "/reservaciones/crear"
);

// Hoteles para opciones (id -> name)
const { data: hotelsData } = await useAsyncData(
  "hotels:for-reservations:list",
  () => hotelsSvc.getAll?.(),
  { server: true }
);
const hotels = computed<any[]>(() => {
  const val = hotelsData.value as any;
  return Array.isArray(val) ? val : val?.items || [];
});
const hotelOptions = computed(() => {
  const opts = hotels.value.map((h) => ({ label: h.name, value: h.id }));
  if (!isAdmin.value) {
    return opts.filter((o) => !employeeHotelId.value || o.value === employeeHotelId.value);
  }
  return opts;
});
const hotelNameById = computed<Record<string, string>>(() =>
  hotels.value.reduce((acc: Record<string, string>, h: any) => {
    acc[h.id] = h.name;
    return acc;
  }, {})
);

// Cargar reservaciones según los filtros (3 endpoints distintos)
const {
  data: reservationsData,
  pending,
  refresh,
} = await useAsyncData(
  () =>
    `reservations:list:${selectedHotelId.value || "-"}:${
      selectedCustomerId.value || "-"
    }`,
  () => {
    if (selectedHotelId.value && selectedCustomerId.value) {
      return reservationsSvc.reservationsByCustomerAndHotel(
        selectedCustomerId.value,
        selectedHotelId.value
      );
    }
    if (selectedHotelId.value) {
      return reservationsSvc.reservationsByHotel(selectedHotelId.value);
    }
    if (selectedCustomerId.value) {
      return reservationsSvc.reservationsByCustomer(selectedCustomerId.value);
    }
    return reservationsSvc.getAll();
  },
  { watch: [selectedHotelId, selectedCustomerId] }
);

// Rooms por ids (a partir de las reservaciones)
const reservationList = computed<any[]>(() => reservationsData.value || []);
const roomIds = computed<string[]>(() => {
  const ids = reservationList.value
    .map((r: any) => r.roomId)
    .filter(Boolean) as string[];
  return Array.from(new Set(ids));
});
const { data: roomsByIds } = await useAsyncData(
  () => `rooms:by-ids:${roomIds.value.length ? roomIds.value.join(",") : "-"}`,
  () =>
    roomIds.value.length
      ? roomService.getByIds(roomIds.value)
      : Promise.resolve([]),
  { watch: [roomIds] }
);
const roomMap = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {};
  for (const r of (roomsByIds.value || []) as any[]) {
    map[r.id] = r;
  }
  return map;
});

// Formateador de moneda para etiquetas de habitación
const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});

type Row = {
  id: any;
  hotelName: string;
  customerName: string;
  roomId: any;
  roomLabel: string;
  checkInDate: any;
  checkOutDate: any;
  state: any;
};
const mapRow = (r: any): Row => {
  const room = roomMap.value[r.roomId];
  const label = room
    ? `#${room.number} — ${currency.format(Number(room.price))}`
    : r.roomId ?? "—";
  return {
    id: r.id,
    hotelName: hotelNameById.value[r.hotelId] || r.hotelId,
    customerName: r.nit ? `NIT - ${r.nit}` : `${r.contactName}-${r.contactIDNumber}`,
    roomId: r.roomId,
    roomLabel: label,
    checkInDate: r.checkInDate,
    checkOutDate: r.checkOutDate,
    state: r.state,
  };
};

const rows = computed<Row[]>(() => (reservationsData.value || []).map(mapRow));

// Tabla
const dt = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
});
const stateText = (s: number) =>
  ((
    { 0: "Confirmada", 1: "Check-in", 2: "Check-out" } as Record<number, string>
  )[s] || "—");

const cols: Column<Row>[] = [
  { key: "hotelName", label: "Hotel", sortable: true },
  { key: "customerName", label: "Cliente", sortable: true },
  { key: "roomLabel", label: "Habitación", sortable: true },
  {
    key: "checkInDate",
    label: "Check-in",
    format: (v) => dt.format(new Date(v)),
  },
  {
    key: "checkOutDate",
    label: "Check-out",
    format: (v) => dt.format(new Date(v)),
  },
  {
    key: "state",
    label: "Estado",
    format: (v) => stateText(Number(v)),
    sortable: true,
  },
  { key: "acciones", label: "Acciones", align: "right" },
];

function clearFilters() {
  selectedHotelId.value = null;
  selectedCustomerId.value = null;
}

async function onDelete(row: Row) {
  if (!confirm(`¿Eliminar reservación de ${row.customerName}?`)) return;
  await reservationsSvc.deleteReservation(row.id);
  toast.success("Reservación eliminada");
  refresh();
}
</script>

<style scoped></style>
