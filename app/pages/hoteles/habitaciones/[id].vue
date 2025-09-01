<template>
  <div class="mx-auto max-w-5xl px-4 py-6">
    <!-- Top toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" :to="`/hoteles`">← Regresar</Button>
      <Button
        v-if="canManageHotels"
        variant="primary"
        size="sm"
        :to="`/habitaciones/crear?hotelId=${hotelId}`"
      >
        Crear habitación
      </Button>
    </div>

    <!-- Hotel header -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-semibold text-brand-900">
        Habitaciones de {{ hotel?.name || 'Hotel' }}
      </h1>
      <span v-if="rooms?.length" class="text-sm text-brand-700">
        Total: <strong class="text-brand-900">{{ rooms.length }}</strong>
      </span>
    </div>

    <!-- Loading / Error states -->
    <div v-if="loadingHotel || loadingRooms" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">
      Cargando…
    </div>
    <div v-else-if="loadingHotelError || loadingRoomsError" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">
      Ocurrió un error al cargar los datos.
    </div>

    <!-- Table -->
    <div v-else>
      <Table
        :columns="cols"
        :items="rooms"
        :loading="false"
        :page-size="10"
        v-model:page="page"
        v-model:search="search"
        size="md"
      >
        <template #title>Listado de habitaciones</template>

        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Button
              v-if="canManageHotels"
              size="sm"
              variant="warning"
              :to="`/habitaciones/editar/${row.id}`"
            >
              Editar
            </Button>
          </div>
        </template>
      </Table>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { ref, computed } from "vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useHotelService } from "~/services/hotels";
import { useRoomService, type Room } from "~/services/rooms";

import Button from "~/components/ui/Button.vue";
import Table, { type Column } from "~/components/ui/Table.vue";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER];
const canManageHotels = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const route = useRoute();
const hotelId = String(route.params.id);

const hotelService = useHotelService();
const roomService = useRoomService();

// Hotel (para mostrar el nombre)
const {
  data: hotel,
  pending: loadingHotel,
  error: loadingHotelError,
} = await useAsyncData(() => `hotel:${hotelId}`, () => hotelService.getById(hotelId), { server: true });

// Rooms del hotel
const {
  data: roomsData,
  pending: loadingRooms,
  error: loadingRoomsError,
} = await useAsyncData(() => `rooms:hotel:${hotelId}`, () => roomService.getByHotel(hotelId), { server: true });

const rooms = computed<Room[]>(() => roomsData.value || []);

// Tabla
const page = ref(1);
const search = ref("");

const currency = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

const cols: Column<Room>[] = [
  { key: "number", label: "Número", sortable: true },
  { key: "price", label: "Precio", sortable: true, align: "right", format: (v) => currency.format(v) },
  { key: "maintenancePrice", label: "Mantenimiento", sortable: true, align: "right", format: (v) => currency.format(v) },
  { key: "acciones", label: "Acciones", align: "right" },
];
</script>
