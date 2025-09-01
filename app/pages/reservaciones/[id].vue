<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <!-- Top toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button
        size="sm"
        variant="secondary"
        :to="
          user?.roleName === Roles.CUSTOMER
            ? '/reservaciones/reservas'
            : '/reservaciones'
        "
        >← Regresar</Button
      >
      <div class="flex items-center gap-2">
        <Button
          v-if="canCheckIn"
          size="sm"
          variant="primary"
          :loading="loading.checkin"
          @click="onCheckIn"
          >Check-in</Button
        >
        <Button
          v-if="canCheckOut"
          size="sm"
          variant="warning"
          :loading="loading.checkout"
          @click="onCheckOut"
          >Check-out</Button
        >
        <Button
          v-if="canMarkPaid"
          size="sm"
          variant="success"
          :loading="loading.paid"
          @click="onMarkPaid"
          >Marcar pagada</Button
        >
      </div>
    </div>

    <!-- Estados -->
    <div
      v-if="pending"
      class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700"
    >
      Cargando reservación…
    </div>
    <div
      v-else-if="error"
      class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600"
    >
      Ocurrió un error al cargar la reservación.
    </div>

    <!-- Contenido -->
    <div v-else class="space-y-6">
      <!-- Resumen -->
      <Card variant="elevated">
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h1 class="text-lg font-semibold text-brand-900">Reservación</h1>
              <p class="text-sm text-brand-700">ID: {{ reservation.id }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="rounded-full bg-sand-100 px-2 py-1 text-xs text-brand-800"
                >{{ stateText }}</span
              >
              <span
                class="rounded-full px-2 py-1 text-xs"
                :class="
                  reservation.paid
                    ? 'bg-sage-500 text-white'
                    : 'bg-sand-100 text-brand-800'
                "
                >{{ reservation.paid ? "Pagada" : "Pendiente de pago" }}</span
              >
            </div>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Check-in</h3>
            <p class="text-brand-900">{{ fmtDate(reservation.checkInDate) }}</p>
          </div>
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Check-out</h3>
            <p class="text-brand-900">
              {{ fmtDate(reservation.checkOutDate) }}
            </p>
          </div>
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Noches</h3>
            <p class="text-brand-900">{{ nights }}</p>
          </div>
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Cliente</h3>
            <p class="text-brand-900">{{ customerLabel }}</p>
          </div>
          <!-- NIT o Contacto -->
          <div v-if="reservation.nit" class="sm:col-span-2">
            <h3 class="mb-1 text-sm font-medium text-brand-800">NIT</h3>
            <p class="text-brand-900">{{ reservation.nit }}</p>
          </div>
          <div v-else class="sm:col-span-2">
            <h3 class="mb-1 text-sm font-medium text-brand-800">Contacto</h3>
            <div class="grid gap-2 sm:grid-cols-2">
              <p class="text-brand-900">
                <span class="font-medium">Nombre:</span>
                {{ reservation.contactName || "—" }}
              </p>
              <p class="text-brand-900">
                <span class="font-medium">Teléfono:</span>
                {{ reservation.contactPhone || "—" }}
              </p>
              <p class="text-brand-900 sm:col-span-2">
                <span class="font-medium">Correo:</span>
                {{ reservation.contactEmail || "—" }}
              </p>
              <p class="text-brand-900 sm:col-span-2">
                <span class="font-medium">Documento:</span>
                {{ reservation.contactIDNumber || "—" }}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Relacionados -->
      <Card variant="elevated">
        <template #header>
          <h2 class="text-base font-semibold text-brand-900">
            Información relacionada
          </h2>
        </template>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Hotel</h3>
            <div
              class="flex items-center justify-between rounded-md border border-sand-300 bg-sand-50 px-3 py-2"
            >
              <div class="font-medium text-brand-900">
                {{ hotel?.name || reservation.hotelId }}
              </div>
              <NuxtLink
                :to="`/hoteles/${reservation.hotelId}`"
                class="text-sm text-sapphire-700 hover:underline"
                >Ver</NuxtLink
              >
            </div>
          </div>
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Habitación</h3>
            <div
              class="flex items-center justify-between rounded-md border border-sand-300 bg-sand-50 px-3 py-2"
            >
              <div class="font-medium text-brand-900">{{ roomLabel }}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useReservationService } from "~/services/reservations";
import { useHotelService } from "~/services/hotels";
import { useRoomService } from "~/services/rooms";
import { useToast } from "~/composables/useToast";

const route = useRoute();
const toast = useToast();
const { user } = useAuth();
const reservationService = useReservationService();
const hotelService = useHotelService();
const roomService = useRoomService();
const id = String(route.params.id);

// Cargar reservación
const {
  data: reservationData,
  pending,
  error,
  refresh,
} = await useAsyncData(
  () => `reservation:${id}`,
  () => reservationService.getById(id),
  { server: true }
);
const reservation = computed<any>(() => reservationData.value || {});

// Cargar hotel y habitación
const { data: hotel } = await useAsyncData(
  () => `reservation:hotel:${reservation.value?.hotelId || "-"}`,
  () =>
    reservation.value?.hotelId
      ? hotelService.getById(String(reservation.value.hotelId))
      : Promise.resolve(null),
  { watch: [reservation] }
);
const { data: room } = await useAsyncData(
  () => `reservation:room:${reservation.value?.roomId || "-"}`,
  () =>
    reservation.value?.roomId
      ? roomService.getById(String(reservation.value.roomId))
      : Promise.resolve(null),
  { watch: [reservation] }
);

// Etiquetas
const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});
const roomLabel = computed(() => {
  const r: any = room.value;
  if (!r) return reservation.value?.roomId || "—";
  const price = Number(r.price);
  return `#${r.number} — ${
    Number.isFinite(price) ? currency.format(price) : "s/t"
  }`;
});
const customerLabel = computed(() => {
  const r: any = reservation.value;
  if (!r) return "—";
  return r.nit ? `NIT ${r.nit}` : "Consumidor final";
});

// Fechas y estado
const dt = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
});
const fmtDate = (v: string | Date) => (v ? dt.format(new Date(v)) : "—");
const nights = computed(() => {
  const a = reservation.value?.checkInDate
    ? new Date(reservation.value.checkInDate)
    : null;
  const b = reservation.value?.checkOutDate
    ? new Date(reservation.value.checkOutDate)
    : null;
  if (!a || !b) return 0;
  const diff = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 ? Math.floor(diff) : 0;
});
const stateText = computed(() => {
  const s = Number(reservation.value?.state);
  return (
    (
      { 0: "Confirmada", 1: "Check-in", 2: "Check-out" } as Record<
        number,
        string
      >
    )[s] || "—"
  );
});

// Acciones permitidas
const canCheckIn = computed(() => Number(reservation.value?.state) === 0);
const canCheckOut = computed(() => Number(reservation.value?.state) === 1);
const canMarkPaid = computed(() => !reservation.value?.paid);

// Acciones
const loading = ref({ checkin: false, checkout: false, paid: false });

async function onCheckIn() {
  try {
    loading.value.checkin = true;
    await reservationService.checkIn(id);
    toast.success("Check-in realizado");
    await refresh();
  } finally {
    loading.value.checkin = false;
  }
}
async function onCheckOut() {
  try {
    loading.value.checkout = true;
    await reservationService.checkOut(id);
    toast.success("Check-out realizado");
    await refresh();
  } finally {
    loading.value.checkout = false;
  }
}
async function onMarkPaid() {
  try {
    loading.value.paid = true;
    await reservationService.pay(id);
    toast.success("Pago registrado");
    await refresh();
  } finally {
    loading.value.paid = false;
  }
}
</script>

<style scoped></style>
