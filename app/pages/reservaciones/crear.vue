<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" :to="cancelPath">← Regresar</Button>
      <div />
    </div>

    <Card
      variant="elevated"
      title="Crear reservación"
      subtitle="Completa la información requerida"
    >
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Cliente (fake mientras se implementa servicio) -->
        <div class="sm:col-span-2">
          <Select
            v-model="form.customerId"
            :options="customerOptions"
            label="Cliente *"
            placeholder="Selecciona un cliente…"
            :error="errors.customerId"
            size="md"
          />
        </div>

        <!-- Hotel (desde URL o seleccionable) -->
        <div class="sm:col-span-2" v-if="fixedHotel">
          <label class="mb-1 block text-sm font-medium text-brand-800"
            >Hotel *</label
          >
          <div
            class="flex items-center justify-between rounded-md border border-sand-300 bg-sand-50 px-3 py-2"
          >
            <div class="font-medium text-brand-900">
              {{ hotel?.name || "—" }}
            </div>
            <NuxtLink
              :to="`/hoteles/${form.hotelId}`"
              class="text-sm text-sapphire-700 hover:underline"
              >Ver hotel</NuxtLink
            >
          </div>
          <p v-if="errors.hotelId" class="mt-1 text-xs text-terra-500">
            {{ errors.hotelId }}
          </p>
        </div>
        <div class="sm:col-span-2" v-else>
          <Select
            v-model="form.hotelId"
            :options="hotelOptions"
            label="Hotel *"
            placeholder="Selecciona un hotel…"
            :error="errors.hotelId"
            size="md"
            clearable
          />
        </div>

        <!-- Habitación (depende de hotel) -->
        <div class="sm:col-span-2">
          <Select
            v-model="form.roomId"
            :options="roomOptions"
            label="Habitación *"
            placeholder="Selecciona una habitación…"
            :disabled="!form.hotelId"
            :error="errors.roomId"
            size="md"
            clearable
          />
        </div>

        <!-- Empleado (auto del usuario o manual si falta) -->
        <div class="sm:col-span-2">
          <template v-if="currentEmployeeId">
            <label class="mb-1 block text-sm font-medium text-brand-800"
              >Empleado *</label
            >
            <div
              class="rounded-md border border-sand-300 bg-sand-50 px-3 py-2 text-brand-900"
            >
              {{ currentEmployeeId }}
            </div>
          </template>
          <template v-else>
            <InputText
              v-model="form.employeeId"
              label="Empleado *"
              placeholder="UUID del empleado"
              :error="errors.employeeId"
              size="md"
            />
          </template>
          <p v-if="errors.employeeId" class="mt-1 text-xs text-terra-500">
            {{ errors.employeeId }}
          </p>
        </div>

        <!-- Fechas -->
        <div>
          <InputDate
            v-model="form.checkInDate"
            label="Check-in *"
            :error="errors.checkInDate"
            size="md"
          />
        </div>
        <div>
          <InputDate
            v-model="form.checkOutDate"
            label="Check-out *"
            :error="errors.checkOutDate"
            size="md"
          />
        </div>

        <!-- Resumen -->
        <div class="sm:col-span-2 text-sm text-brand-700">
          <p>
            Noche(s): <strong class="text-brand-900">{{ nights }}</strong>
          </p>
          <p v-if="selectedRoomPrice !== null">
            Tarifa por noche:
            <strong class="text-brand-900">{{
              formatCurrency(selectedRoomPrice)
            }}</strong>
          </p>
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 flex items-center justify-end gap-2">
          <Button variant="secondary" :to="cancelPath">Cancelar</Button>
          <Button variant="primary" :loading="saving" type="submit"
            >Guardar</Button
          >
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { reactive, ref, computed, watch, watchEffect } from "vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles, useAuth } from "#imports";
import { useHotelService } from "~/services/hotels";
import { useRoomService } from "~/services/rooms";
import { useReservationService } from "~/services/reservations";
import { useToast } from "~/composables/useToast";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import Select from "~/components/ui/Select.vue";
import InputDate from "~/components/ui/InputDate.vue";
import InputText from "~/components/ui/InputText.vue";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER, Roles.CUSTOMER];
const canManage = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const toast = useToast();
const hotelService = useHotelService();
const roomService = useRoomService();
const reservationService = useReservationService();
const route = useRoute();

// Empleado actual (desde auth)
const { user } = useAuth();
const currentEmployeeId = computed<string | null>(() => {
  const u: any = user?.value;
  return (u?.employeeId || u?.id || null) as string | null;
});

// Clientes fake (UUIDs)
const customerOptions = ref([
  { value: "b7b7f1b6-1f75-4d01-9e3e-1b8d5b1a1111", label: "María López" },
  { value: "0f3e2d9a-2a44-4b55-8c1a-9dc7f2a22222", label: "Juan Pérez" },
  { value: "9a8b7c6d-3e21-4f43-9c0b-2e1f3d3a33333", label: "Ana García" },
  { value: "1c2d3e4f-4a5b-6c7d-8e9f-0a1b2c3d44444", label: "Carlos Ruiz" },
  { value: "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f55555", label: "Sofía Martínez" },
]);

// Form
const form = reactive<{
  customerId: string | null;
  hotelId: string | null;
  roomId: string | null;
  employeeId: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
}>({
  customerId: null,
  hotelId: (route.query.hotelId as string) || null,
  roomId: null,
  employeeId: null,
  checkInDate: null,
  checkOutDate: null,
});

const errors = reactive<Record<string, string>>({
  customerId: "",
  hotelId: "",
  roomId: "",
  employeeId: "",
  checkInDate: "",
  checkOutDate: "",
});
const saving = ref(false);

// Cargar hotel si viene por URL y opciones si no
const fixedHotel = computed(() => !!form.hotelId);
const { data: hotel } = await useAsyncData(
  () => `hotel:for-reservation:${String(form.hotelId || "")}`,
  () =>
    form.hotelId
      ? hotelService.getById(String(form.hotelId))
      : Promise.resolve(null),
  { server: true }
);

const { data: hotelsData } = await useAsyncData(
  "hotels:select:reservations",
  () => (!fixedHotel.value ? hotelService.getAll?.() : Promise.resolve(null)),
  { server: true }
);
const hotelOptions = computed(() => {
  const val = hotelsData.value as any;
  const items = Array.isArray(val) ? val : val?.items || [];
  return items.map((h: any) => ({ label: h.name, value: h.id }));
});

// Rooms por hotel
const { data: roomsData, refresh: refreshRooms } = await useAsyncData(
  () => `rooms:by-hotel:${String(form.hotelId || "")}`,
  () =>
    form.hotelId
      ? roomService.getByHotel(String(form.hotelId))
      : Promise.resolve([]),
  { watch: [() => form.hotelId] }
);
const roomOptions = computed(() => {
  const rooms = (roomsData.value || []) as any[];
  return rooms.map((r) => ({
    label: `#${r.number} — ${formatCurrency(Number(r.price))}`,
    value: r.id,
    price: Number(r.price),
  }));
});

// Precio de la habitación seleccionada
const selectedRoomPrice = computed<number | null>(() => {
  const found: any = roomOptions.value.find(
    (o: any) => o.value === form.roomId
  );
  return found ? Number(found.price) : null;
});

// Cálculo de noches
const nights = computed(() => {
  if (!form.checkInDate || !form.checkOutDate) return 0;
  const start = new Date(form.checkInDate as string);
  const end = new Date(form.checkOutDate as string);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 ? Math.floor(diff) : 0;
});

// Helpers
const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});
const formatCurrency = (n: number) => currency.format(n || 0);
const cancelPath = computed(() =>
  user.value?.roleName === Roles.CUSTOMER ? "/reservaciones/reservas" : "/reservaciones"
);

function validate() {
  errors.customerId = form.customerId ? "" : "Requerido";
  errors.hotelId = form.hotelId ? "" : "Requerido";
  errors.roomId = form.roomId ? "" : "Requerido";
  const emp = currentEmployeeId.value ?? form.employeeId;
  errors.employeeId = emp ? "" : "Requerido";

  errors.checkInDate = form.checkInDate ? "" : "Requerido";
  errors.checkOutDate = form.checkOutDate ? "" : "Requerido";

  if (form.checkInDate && form.checkOutDate) {
    const start = new Date(form.checkInDate as string);
    const end = new Date(form.checkOutDate as string);
    if (start.getTime() > end.getTime()) {
      errors.checkOutDate = "Debe ser igual o posterior al check-in";
    }
  }
  return Object.values(errors).every((v) => !v);
}

async function onSubmit() {
  if (!validate()) return;
  try {
    saving.value = true;
    await reservationService.create({
      hotelId: String(form.hotelId),
      roomId: String(form.roomId),
      employeeId: String(currentEmployeeId.value ?? form.employeeId),
      customerId: String(form.customerId),
      checkInDate: new Date(String(form.checkInDate)).toISOString(),
      checkOutDate: new Date(String(form.checkOutDate)).toISOString(),
    });
    toast.success("Reservación creada", {
      description: `Cliente: ${
        customerOptions.value.find((c) => c.value === form.customerId)?.label ||
        ""
      }`,
    });
    navigateTo(cancelPath.value);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped></style>
