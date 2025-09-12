<template>
  <div class="mx-auto max-w-4xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">
          Comprobante de orden
        </h1>
        <p class="text-sm text-brand-700">ID: {{ orderId }}</p>
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
    <div v-if="pendingOrder" class="text-brand-700">Cargando comprobante…</div>
    <div v-else-if="errorOrder" class="text-terra-500">
      No se pudo cargar la orden.
    </div>

    <!-- Previsualización de factura -->
    <div v-else>
      <Card variant="elevated" title="Previsualización">
        <div
          ref="invoiceRef"
          class="mx-auto max-w-[800px] rounded-md bg-white p-6 text-ink-900 shadow"
        >
          <!-- Encabezado de factura -->
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
              <div class="mt-2 text-xs text-brand-700">
                {{ order?.restaurant?.name }}
              </div>
              <div class="text-xs text-brand-700">
                ID Restaurante: {{ order?.restaurant?.id }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-semibold">FACTURA</div>
              <div class="text-xs text-brand-700">
                Orden:
                <span class="font-medium text-brand-900">{{ order?.id }}</span>
              </div>
              <div class="text-xs text-brand-700">
                Fecha:
                <span class="font-medium text-brand-900">{{
                  formatDate(order?.date || order?.createdAt || null)
                }}</span>
              </div>
              <div class="mt-1">
                <span
                  v-if="order?.isPaid"
                  class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white"
                  >Pagada</span
                >
                <span
                  v-else-if="order?.isCanceled"
                  class="rounded px-2 py-0.5 text-xs bg-terra-500 text-white"
                  >Cancelada</span
                >
                <span
                  v-else
                  class="rounded px-2 py-0.5 text-xs bg-gold-500/20 text-brand-900 border border-gold-500/40"
                  >Abierta</span
                >
              </div>
            </div>
          </div>

          <!-- Cliente -->
          <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-brand-700">Cliente</div>
              <div class="font-medium text-brand-900">
                <template v-if="order?.nit">NIT: {{ order?.nit }}</template>
                <template v-else>Consumidor final</template>
              </div>
            </div>
            <div class="text-right">
              <div class="text-brand-700">Atendido por</div>
              <div class="font-medium text-brand-900">
                Empleado: {{ order?.employeeId || "—" }}
              </div>
            </div>
          </div>

          <!-- Detalle -->
          <div class="mt-6 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-sand-300 text-left">
                  <th class="py-2">#</th>
                  <th class="py-2">Descripción</th>
                  <th class="py-2 text-right">Precio</th>
                  <th class="py-2 text-center">Cant.</th>
                  <th class="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(l, i) in order?.orderLines || []"
                  :key="l.id"
                  class="border-b border-sand-100"
                >
                  <td class="py-2 align-top">{{ i + 1 }}</td>
                  <td class="py-2 align-top">
                    <div class="font-medium">{{ l.menuItem?.name }}</div>
                    <div class="text-xs text-brand-700">
                      {{ l.menuItem?.description }}
                    </div>
                  </td>
                  <td class="py-2 align-top text-right">
                    Q {{ formatCurrency(l.price) }}
                  </td>
                  <td class="py-2 align-top text-center">{{ l.quantity }}</td>
                  <td class="py-2 align-top text-right">
                    Q {{ formatCurrency(l.subtotal) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totales -->
          <div class="mt-4 flex items-start justify-end">
            <div class="w-full max-w-xs space-y-1 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-brand-700">Subtotal</span>
                <span class="font-medium text-brand-900"
                  >Q {{ formatCurrency(order?.total ?? 0) }}</span
                >
              </div>
              <!-- Impuestos / descuentos podrían ir aquí -->
              <div
                class="flex items-center justify-between border-t border-sand-300 pt-2 text-base"
              >
                <span class="font-semibold text-brand-900">Total</span>
                <span class="font-semibold text-brand-900"
                  >Q {{ formatCurrency(order?.total ?? 0) }}</span
                >
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
                formatDate(order?.updatedAt || order?.createdAt || null)
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
definePageMeta({ middleware: ["auth"] });
import { computed, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useToast } from "~/composables/useToast";
import { useAuth } from "~/composables/useAuth";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useEmployeeService } from "~/services/employee";
import { useOrderService } from "~/services/order";
import { useClientService } from "~/services/client";
import type { Order } from "~/services/order";

const toast = useToast();
const route = useRoute();
const { user } = useAuth();
const { hasAnyRole, redirectIfUnauthorized, boolToRedirect } = useUseRoles();
const permitedRoles = [
  Roles.ADMIN,
  Roles.RESTAURANT_EMPLOYEE,
  Roles.RESTAURANT_MANAGER,
  Roles.CUSTOMER,
];
redirectIfUnauthorized(permitedRoles, "/");

const orderSvc = useOrderService();
const employeeSvc = useEmployeeService();
const clientSvc = useClientService();

// Id de orden de la ruta
const orderId = String(route.params.id);

// Datos de la orden
const {
  data: orderData,
  pending: pendingOrder,
  error: errorOrder,
} = await useAsyncData(
  () => `order:${orderId}`,
  () => orderSvc.getById(orderId),
  { server: true }
);
const order = computed<Order | null>(() => (orderData.value as any) || null);

const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]));
const isCustomer = computed(() => hasAnyRole([Roles.CUSTOMER]));

const { data: clientData } = await useAsyncData(
  () => `client:${user.value?.clientId ?? ""}`,
  () =>
    isCustomer.value && user.value?.clientId
      ? clientSvc.getById(String(user.value.clientId))
      : Promise.resolve(null),
  { watch: [() => user.value?.clientId] }
);

const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ""}`,
  () =>
    user.value?.employeeId
      ? employeeSvc.getById(String(user.value.employeeId))
      : Promise.resolve(null)
);
watchEffect(() => {
  if (isCustomer.value) return; // los clientes no tienen restricción por restaurante del empleado
  const rid = order.value?.restaurant?.id;
  const empRid = (employeeData.value as any)?.restaurantId;
  if (rid && empRid && rid !== empRid && !isAdmin.value) {
    boolToRedirect(true, "/");
  }
});

watchEffect(() => {
  if (!order.value) return;

  // Solo se permiten órdenes pagadas en esta vista
  if (!order.value.isPaid) {
    boolToRedirect(true, isCustomer.value ? "/consumos" : "/");
    return;
  }

  // Si es cliente, verificar que el NIT de la orden coincida con el del cliente
  if (isCustomer.value) {
    const clientNit = (clientData.value as any)?.nit || null;
    const orderNit = order.value?.nit || null;
    if (!clientNit || !orderNit || clientNit !== orderNit) {
      boolToRedirect(true, "/consumos");
    }
  }
});

const backPath = computed(() =>
  isCustomer.value
    ? "/consumos"
    : `/ordenes/${order.value?.restaurant?.id ?? ""}`
);

// PDF / impresión
const invoiceRef = ref<HTMLElement | null>(null);
const downloading = ref(false);

function formatCurrency(n: number | string | null | undefined) {
  return Number(n || 0).toFixed(2);
}
function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

async function downloadPdf() {
  if (!invoiceRef.value) return;
  try {
    downloading.value = true;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 8,
      filename: `comprobante-${order.value?.id || "orden"}.pdf`,
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
/* Opcional: estilos mínimos para impresión */
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
