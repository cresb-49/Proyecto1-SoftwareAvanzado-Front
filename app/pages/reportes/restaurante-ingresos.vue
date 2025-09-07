<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-6">
    <!-- Header / actions -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold" style="color: #1f2937">
          Reporte de ingresos — Restaurante
        </h1>
        <p class="text-sm" style="color: #374151">
          {{ restaurantName || "—" }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" to="/reportes">← Reportes</Button>
      </div>
    </header>

    <!-- Parámetros / validaciones -->
    <Card
      variant="elevated"
      title="Parámetros de consulta"
      subtitle="Rango y restaurante"
    >
      <form class="grid gap-4 sm:grid-cols-4 items-end" @submit.prevent="applyParams">
        <div class="sm:col-span-2">
          <Select
            v-model="qRestaurantId"
            :options="restaurantOptions"
            label="Restaurante"
            placeholder="Elige un restaurante…"
            clearable
          />
        </div>
        <InputDate v-model="qStart" label="Inicio" />
        <InputDate v-model="qEnd" label="Fin" />
        <div class="sm:col-span-4 flex items-center gap-2">
          <Button type="submit" variant="primary" :disabled="!qRestaurantId || !qStart || !qEnd || invalidRange">Consultar</Button>
          <span v-if="invalidRange" class="text-xs" style="color:#7f1d1d">Rango inválido: inicio debe ser ≤ fin.</span>
        </div>
      </form>
    </Card>

    <!-- Estados -->
    <div
      v-if="pending"
      class="rounded-md border p-4"
      style="background: #ffffff; border-color: #e5e7eb; color: #374151"
    >
      Cargando reporte…
    </div>
    <div
      v-else-if="error"
      class="rounded-md border p-4"
      style="background: #ffffff; border-color: #fecaca; color: #7f1d1d"
    >
      Ocurrió un error al cargar el reporte.
    </div>

    <!-- No params -->
    <div
      v-else-if="!restaurantId || !start || !end || invalidRange"
      class="rounded-md border p-4"
      style="background: #ffffff; border-color: #e5e7eb; color: #374151"
    >
      <div class="font-medium" style="color: #111827">
        Parámetros incompletos o rango inválido
      </div>
      <p class="text-sm mt-1">
        Usa la forma
        <code
          >restaurante-ingresos?restaurantId=&amp;start=YYYY-MM-DD&amp;end=YYYY-MM-DD</code
        >.
      </p>
      <div class="mt-3">
        <Button size="sm" variant="secondary" to="/reportes">Volver</Button>
      </div>
    </div>

    <!-- Resultado (preview imprimible) -->
    <div v-else ref="invoiceRef" class="space-y-6">
      <!-- Ficha del restaurante (incluida en PDF) -->
      <section class="rounded-md border p-4" style="background:#ffffff; border-color:#e5e7eb; color:#111827">
        <div class="grid gap-2 sm:grid-cols-2">
          <div>
            <div class="text-xs" style="color:#6b7280">Restaurante</div>
            <div class="font-medium">{{ restaurantName || '—' }}</div>
          </div>
          <div>
            <div class="text-xs" style="color:#6b7280">ID</div>
            <div class="font-mono text-xs">{{ restaurantId }}</div>
          </div>
          <div class="sm:col-span-2">
            <div class="text-xs" style="color:#6b7280">Dirección</div>
            <div>{{ restaurantAddress || '—' }}</div>
          </div>
          <div class="sm:col-span-2">
            <div class="text-xs" style="color:#6b7280">Descripción</div>
            <div>{{ restaurantDescription || '—' }}</div>
          </div>
          <div>
            <div class="text-xs" style="color:#6b7280">Calificación</div>
            <div class="font-medium">{{ restaurantRatingDisplay }}</div>
          </div>
        </div>
      </section>
      <!-- Resumen -->
      <section class="grid gap-4 sm:grid-cols-4">
        <div
          class="rounded-md border p-4"
          style="background: #ffffff; border-color: #e5e7eb"
        >
          <div class="text-xs" style="color: #6b7280">Órdenes</div>
          <div class="mt-1 text-2xl font-semibold" style="color: #111827">
            {{ totalOrders }}
          </div>
        </div>
        <div
          class="rounded-md border p-4"
          style="background: #ffffff; border-color: #e5e7eb"
        >
          <div class="text-xs" style="color: #6b7280">Ingresos</div>
          <div class="mt-1 text-2xl font-semibold" style="color: #111827">
            {{ currency.format(totalRevenue) }}
          </div>
        </div>
        <div
          class="rounded-md border p-4"
          style="background: #ffffff; border-color: #e5e7eb"
        >
          <div class="text-xs" style="color: #6b7280">Ticket promedio</div>
          <div class="mt-1 text-2xl font-semibold" style="color: #111827">
            {{ currency.format(avgTicket) }}
          </div>
        </div>
        <div
          class="rounded-md border p-4"
          style="background: #ffffff; border-color: #e5e7eb"
        >
          <div class="text-xs" style="color: #6b7280">Última orden</div>
          <div class="mt-1 text-sm font-medium" style="color: #111827">
            {{ lastOrderAtDisplay }}
          </div>
        </div>
      </section>

      <!-- Detalle de órdenes -->
      <Card
        variant="elevated"
        :title="`Órdenes (${orders.length})`"
        subtitle="Detalle de ingresos por orden"
      >
        <div class="overflow-x-auto">
          <table
            class="w-full"
            style="font-size: 13px; border-collapse: collapse"
          >
            <thead>
              <tr style="text-align: left; border-bottom: 1px solid #e5e7eb">
                <th class="py-2 pr-2">ID</th>
                <th class="py-2 pr-2">Cliente</th>
                <th class="py-2 pr-2">NIT</th>
                <th class="py-2 pr-2">Fecha</th>
                <th class="py-2 pr-2 text-right">Total</th>
                <th class="py-2 pr-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="o in orders"
                :key="o.orderId"
                style="border-bottom: 1px solid #f3f4f6"
              >
                <td class="py-2 align-top font-mono text-xs">
                  {{ o.orderId }}
                </td>
                <td class="py-2 align-top">
                  {{ o.clientName || (o.nit ? "Cliente" : "Consumidor final") }}
                </td>
                <td class="py-2 align-top">{{ o.nit || "—" }}</td>
                <td class="py-2 align-top">
                  {{ formatDate(o.date || o.paidAt || null) }}
                </td>
                <td class="py-2 align-top text-right">
                  {{ currency.format(Number(o.totalAmount || 0)) }}
                </td>
                <td class="py-2 align-top">
                  <span
                    v-if="o.paid"
                    class="rounded px-2 py-0.5 text-xs"
                    style="background: #8fa382; color: #ffffff"
                    >Pagada</span
                  >
                  <span
                    v-else
                    class="rounded px-2 py-0.5 text-xs"
                    style="
                      background: rgba(201, 162, 39, 0.2);
                      color: #1f2937;
                      border: 1px solid rgba(201, 162, 39, 0.4);
                    "
                    >Pendiente</span
                  >
                </td>
              </tr>
              <tr v-if="!orders.length">
                <td colspan="6" class="py-3 text-center" style="color: #6b7280">
                  Sin órdenes en el rango.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <template #footer>
          <div
            class="flex items-center justify-between text-sm"
            style="color: #6b7280"
          >
            <span>Generado: {{ generatedAtDisplay }}</span>
            <span>Rango: {{ startDisplay }} — {{ endDisplay }}</span>
          </div>
        </template>
      </Card>
      <div class="flex items-center justify-end gap-2 print:hidden">
        <Button size="sm" variant="secondary" @click="printPage">Imprimir</Button>
        <Button size="sm" variant="primary" @click="downloadPdf" :loading="downloading">Descargar PDF</Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import Select from "~/components/ui/Select.vue";
import InputDate from "~/components/ui/InputDate.vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import {
  useReportService,
  type RestaurantReport,
  type OrderRestaurantReport,
} from "~/services/report";
import { useRestaurantService } from "~/services/restaurants";
import { useToast } from "~/composables/useToast";

const { redirectIfUnauthorized } = useUseRoles();
redirectIfUnauthorized([Roles.ADMIN, Roles.MANAGER], "/");

const route = useRoute();
const router = useRouter();
const toast = useToast();
const svc = useReportService();
const restaurantSvc = useRestaurantService();

const qRestaurantId = ref(String(route.query.restaurantId || ''));
const qStart = ref(String(route.query.start || ''));
const qEnd = ref(String(route.query.end || ''));

const restaurantId = computed(() => qRestaurantId.value);
const start = computed(() => qStart.value);
const end = computed(() => qEnd.value);

// Normalizar a LocalDateTime esperado por backend
function toStartIso(d: string) {
  // YYYY-MM-DDT00:00:00
  return d ? `${d}T00:00:00` : "";
}
function toEndIso(d: string) {
  // YYYY-MM-DDT23:59:59
  return d ? `${d}T23:59:59` : "";
}
const startIso = computed(() => toStartIso(start.value));
const endIso = computed(() => toEndIso(end.value));

async function applyParams () {
  await router.replace({ query: {
    restaurantId: qRestaurantId.value || '',
    start: qStart.value || '',
    end: qEnd.value || ''
  } })
}

// Validaciones de rango
function parseDateOnly(d: string) {
  const m = /^\d{4}-\d{2}-\d{2}$/.test(d);
  return m ? new Date(d + "T00:00:00") : null;
}
const invalidRange = computed(() => {
  const s = parseDateOnly(start.value);
  const e = parseDateOnly(end.value);
  if (!s || !e) return true;
  return s.getTime() > e.getTime();
});

// Cargar catálogo de restaurantes
const { data: restaurantsData } = await useAsyncData(
  'rep:restaurants:all',
  () => restaurantSvc.getAll?.(),
  { server: true }
)
const restaurantOptions = computed(() => {
  const val: any = restaurantsData.value
  const items = Array.isArray(val) ? val : (val?.items || [])
  return items.map((r: any) => ({ label: r.name, value: r.id }))
})

// Cargar nombre de restaurante
const { data: restData } = await useAsyncData(
  () =>
    `rep:restaurant:${restaurantId.value}`,
  () =>
    restaurantId.value
      ? restaurantSvc.getById(restaurantId.value)
      : Promise.resolve(null),
  { watch: [restaurantId] }
);
const restaurantName = computed(() => (restData.value as any)?.name || "");
const restaurantAddress = computed(() => (restData.value as any)?.address || "");
const restaurantDescription = computed(() => (restData.value as any)?.description || "");
const restaurantRatingNum = computed(() => Number((restData.value as any)?.rating ?? 0));
const restaurantRatingDisplay = computed(() => {
  const r = restaurantRatingNum.value;
  return Number.isFinite(r) && r > 0 ? `${r.toFixed(1)} / 5` : "—";
});

// Cargar reporte
const { data, pending, error } = await useAsyncData(
  () =>
    `rep:restaurant:revenue:${restaurantId.value}:${startIso.value}:${endIso.value}`,
  () =>
    restaurantId.value && startIso.value && endIso.value && !invalidRange.value
      ? svc.getRevenueByRestaurant(
          restaurantId.value,
          startIso.value,
          endIso.value
        )
      : Promise.resolve(null),
  { watch: [restaurantId, startIso, endIso, invalidRange], server: true }
);

// Normalización
const report = computed<RestaurantReport | null>(
  () => (data.value as any) || null
);
const orders = computed<OrderRestaurantReport[]>(() => {
  const raw = (report.value as any)?.orders;
  if (!Array.isArray(raw)) return [];
  return raw.map((o: any) => ({
    orderId: o.orderId || o.id,
    clientName: o.clientName || (o.nit ? "Cliente" : "Consumidor final"),
    nit: o.nit ?? null,
    date: o.date || o.paidAt || null,
    totalAmount: Number(o.totalAmount ?? o.total ?? 0),
    paidAt: o.paidAt || null,
    isPaid: o.isPaid ?? o.paid ?? true,
    paid: o.isPaid ?? o.paid ?? true, // por compatibilidad
  }));
});

const totalOrders = computed(() => orders.value.length);
const totalRevenue = computed(() =>
  orders.value.reduce((a, o) => a + Number(o.totalAmount || 0), 0)
);
const avgTicket = computed(() =>
  totalOrders.value ? totalRevenue.value / totalOrders.value : 0
);
const lastOrderAt = computed(() => {
  return orders.value.reduce((acc: string | null, o) => {
    const d = o.date || o.paidAt || null;
    if (!d) return acc;
    if (!acc) return d;
    return new Date(d) > new Date(acc) ? d : acc;
  }, null as string | null);
});

const dt = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
});
const dtd = new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" });
const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : dt.format(d);
}

const startDisplay = computed(() => {
  const d = parseDateOnly(start.value);
  return d ? dtd.format(d) : "—";
});
const endDisplay = computed(() => {
  const d = parseDateOnly(end.value);
  return d ? dtd.format(d) : "—";
});
const lastOrderAtDisplay = computed(() => formatDate(lastOrderAt.value));
const generatedAtDisplay = computed(() => {
  const g = (report.value as any)?.generatedAt;
  if (!g) return "—";
  const d = new Date(g);
  return isNaN(d.getTime()) ? "—" : dt.format(d);
});

// Export (PDF / print)
const invoiceRef = ref<HTMLElement | null>(null);
const downloading = ref(false);
async function downloadPdf() {
  if (!invoiceRef.value) return;
  try {
    downloading.value = true;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 8,
      filename: `restaurante-ingresos-${
        restaurantName.value || restaurantId.value
      }.pdf`,
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

<style>
@media print {
  header,
  .no-print {
    display: none !important;
  }
}
</style>
