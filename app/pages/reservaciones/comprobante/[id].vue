<template>
  <div class="mx-auto max-w-4xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">
          Comprobante de reservación
        </h1>
        <p class="text-sm text-brand-700">ID: {{ reservationId }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" :to="backPath">← Regresar</Button>
        <Button
          size="sm"
          variant="primary"
          @click="downloadPdf"
          :loading="downloading"
          >Descargar PDF</Button
        >
      </div>
    </header>

    <!-- Estados -->
    <div v-if="pendingReservation" class="text-brand-700">
      Cargando comprobante…
    </div>
    <div v-else-if="errorReservation" class="text-terra-500">
      No se pudo cargar la reservación.
    </div>

    <!-- Previsualización de factura -->
    <div v-else>
      <Card variant="elevated" title="Previsualización">
        <div
          ref="invoiceRef"
          class="mx-auto max-w-[800px] rounded-md bg-white p-6 text-ink-900 shadow"
        >
          <!-- Encabezado -->
          <div
            class="flex items-start justify-between gap-4 border-b border-sand-300 pb-4"
          >
            <div>
              <div class="text-2xl font-semibold text-brand-800">
                Comer y Dormir
              </div>
              <div class="text-sm text-brand-700">
                Servicios de hotel y restaurantes
              </div>
              <div class="mt-2 text-xs text-brand-700">{{ hotelName }}</div>
              <div class="text-xs text-brand-700">
                ID Hotel: {{ reservation?.hotelId }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-semibold">FACTURA</div>
              <div class="text-xs text-brand-700">
                Reserva:
                <span class="font-medium text-brand-900">{{
                  reservation?.id
                }}</span>
              </div>
              <div class="text-xs text-brand-700">
                Fecha:
                <span class="font-medium text-brand-900">{{
                  formatDate(
                    reservation?.paidAt ||
                      reservation?.updatedAt ||
                      reservation?.createdAt ||
                      null
                  )
                }}</span>
              </div>
              <div class="mt-1">
                <span
                  v-if="reservation?.paid"
                  class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white"
                  >Pagada</span
                >
                <span
                  v-else
                  class="rounded px-2 py-0.5 text-xs bg-gold-500/20 text-brand-900 border border-gold-500/40"
                  >No pagada</span
                >
              </div>
            </div>
          </div>

          <!-- Huésped -->
          <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-brand-700">Huésped</div>
              <div class="font-medium text-brand-900">
                <template v-if="reservation?.nit"
                  >NIT: {{ reservation?.nit }}</template
                >
                <template v-else>Consumidor final</template>
              </div>
            </div>
            <div class="text-right">
              <div class="text-brand-700">Fechas</div>
              <div class="font-medium text-brand-900">
                {{ formatDate(reservation?.checkInDate ?? "") }} →
                {{ formatDate(reservation?.checkOutDate ?? "") }}
                <span class="ml-1 text-xs text-brand-700"
                  >({{ nights }} noche(s))</span
                >
              </div>
            </div>
          </div>

          <!-- Contacto (cuando no hay NIT) -->
          <div
            v-if="!reservation?.nit"
            class="mt-2 grid grid-cols-2 gap-4 text-xs"
          >
            <div>
              <span class="text-brand-700">Nombre:</span>
              <span class="text-brand-900">{{
                reservation?.contactName || "—"
              }}</span>
            </div>
            <div>
              <span class="text-brand-700">Teléfono:</span>
              <span class="text-brand-900">{{
                reservation?.contactPhone || "—"
              }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-brand-700">Correo:</span>
              <span class="text-brand-900">{{
                reservation?.contactEmail || "—"
              }}</span>
            </div>
            <div class="col-span-2">
              <span class="text-brand-700">Documento:</span>
              <span class="text-brand-900">{{
                reservation?.contactIDNumber || "—"
              }}</span>
            </div>
          </div>

          <!-- Habitación -->
          <div class="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-brand-700">Habitación</div>
              <div class="font-medium text-brand-900">{{ roomLabel }}</div>
            </div>
            <div class="text-right">
              <div class="text-brand-700">Tarifa por noche</div>
              <div class="font-medium text-brand-900">
                {{ roomPriceDisplay }}
              </div>
            </div>
          </div>

          <!-- Totales -->
          <div class="mt-6 flex items-start justify-end">
            <div class="w-full max-w-xs space-y-1 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-brand-700">Subtotal</span>
                <span class="font-medium text-brand-900">{{
                  subtotalDisplay
                }}</span>
              </div>
              <div
                class="flex items-center justify-between border-t border-sand-300 pt-2 text-base"
              >
                <span class="font-semibold text-brand-900">Total</span>
                <span class="font-semibold text-brand-900">{{
                  totalDisplay
                }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center text-xs text-brand-700">
            Gracias por su preferencia. — Comer y Dormir
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between text-sm text-brand-700">
            <span
              >Generado:
              {{
                formatDate(
                  reservation?.updatedAt || reservation?.createdAt || null
                )
              }}</span
            >
            <div class="flex items-center gap-2">
              <Button size="sm" variant="secondary" @click="printPage"
                >Imprimir</Button
              >
              <Button
                size="sm"
                variant="primary"
                @click="downloadPdf"
                :loading="downloading"
                >Descargar PDF</Button
              >
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useToast } from "~/composables/useToast";
import { useReservationService } from "~/services/reservations";
import { useHotelService } from "~/services/hotels";
import { useRoomService } from "~/services/rooms";
import type { Reservation as ReservationModel } from "~/services/reservations";
import { useAuth } from "~/composables/useAuth";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useClientService } from "~/services/client";
import type { Client } from "~/services/client";

const toast = useToast();
const route = useRoute();
const reservationId = String(route.params.id || "");

const service = useReservationService();
const hotelSvc = useHotelService();
const roomSvc = useRoomService();

// Roles / usuario y cliente (para validar NIT si es CUSTOMER)
const { user } = useAuth();
const { hasAnyRole } = useUseRoles();
const isCustomer = computed(() => hasAnyRole([Roles.CUSTOMER]));

const clientSvc = useClientService();
const clientId = computed(
  () => (user.value as any)?.clientId || (user.value as any)?.customerId || null
);

const { data: clientData } = await useAsyncData(
  () => `client:${clientId.value || "-"}`,
  () =>
    isCustomer.value && clientId.value
      ? clientSvc.getById(String(clientId.value))
      : Promise.resolve(null),
  { watch: [isCustomer, clientId] }
);
const client = computed<Client | null>(() => (clientData.value as any) || null);

// Datos de la reservación
const {
  data: reservationData,
  pending: pendingReservation,
  error: errorReservation,
} = await useAsyncData(
  () => `reservation:${reservationId}`,
  () => service.getById(reservationId),
  { server: true }
);
const reservation = computed<ReservationModel | null>(
  () => (reservationData.value as any) || null
);

// Redirigir si no está pagada (igual que órdenes)
watchEffect(() => {
  if (reservation.value && !reservation.value.paid) {
    navigateTo("/");
  }
});

// Validar propiedad de la reservación para CUSTOMER: NIT debe coincidir
watchEffect(() => {
  if (!reservation.value) return;
  if (!isCustomer.value) return;
  if (!clientId.value) return; // sin cliente asociado, no validar aún
  if (!client.value) return; // esperar a que cargue el cliente

  const rnit = reservation.value.nit || null;
  const cnit = client.value?.nit || null;
  if (!rnit || !cnit || rnit !== cnit) {
    navigateTo("/reservaciones/reservas");
  }
});

// Hotel y habitación
const { data: hotelData } = await useAsyncData(
  () => `hotel:${reservation.value?.hotelId || ""}`,
  () =>
    reservation.value?.hotelId
      ? hotelSvc.getById(String(reservation.value.hotelId))
      : Promise.resolve(null),
  { watch: [() => reservation.value?.hotelId] }
);

const { data: roomData } = await useAsyncData(
  () => `room:${reservation.value?.roomId || ""}`,
  () =>
    reservation.value?.roomId
      ? roomSvc.getById(String(reservation.value.roomId))
      : Promise.resolve(null),
  { watch: [() => reservation.value?.roomId] }
);

const hotelName = computed(() => (hotelData.value as any)?.name || "Hotel");
const roomLabel = computed(() =>
  roomData.value
    ? `#${(roomData.value as any).number}`
    : String(reservation.value?.roomId || "")
);
const roomNightPrice = computed(() =>
  Number((roomData.value as any)?.price || 0)
);

const dt = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
});
const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : dt.format(d);
}

const nights = computed(() => {
  const ci = reservation.value?.checkInDate
    ? new Date(reservation.value.checkInDate)
    : null;
  const co = reservation.value?.checkOutDate
    ? new Date(reservation.value.checkOutDate)
    : null;
  if (!ci || !co) return 0;
  const ms = co.getTime() - ci.getTime();
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  return d <= 0 ? 1 : d;
});

const subtotal = computed(() => roomNightPrice.value * nights.value);
const subtotalDisplay = computed(() => currency.format(subtotal.value || 0));
const totalDisplay = computed(() =>
  currency.format(Number(reservation.value?.total || 0))
);
const roomPriceDisplay = computed(() =>
  currency.format(roomNightPrice.value || 0)
);

const backPath = computed(() =>
  isCustomer.value ? "/reservaciones/reservas" : "/reservaciones"
);

// PDF / impresión
const invoiceRef = ref<HTMLElement | null>(null);
const downloading = ref(false);

async function downloadPdf() {
  if (!invoiceRef.value) return;
  try {
    downloading.value = true;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 8,
      filename: `comprobante-${reservation.value?.id || "reservacion"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    } as any;
    await html2pdf().set(opt).from(invoiceRef.value).save();
  } catch (e) {
    toast.error("No se pudo generar el PDF");
  } finally {
    downloading.value = false;
  }
}

function printPage() {
  window.print();
}
</script>

<style scoped>
@media print {
  header,
  .no-print {
    display: none !important;
  }
  .shadow {
    box-shadow: none !important;
  }
}
</style>
