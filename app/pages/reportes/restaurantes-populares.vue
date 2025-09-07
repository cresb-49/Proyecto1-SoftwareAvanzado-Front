<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-6">
    <!-- Header / acciones -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">
          Restaurantes más populares
        </h1>
        <p class="text-sm text-brand-700">
          Ranking por ingresos / número de órdenes
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" to="/reportes">← Reportes</Button>
      </div>
    </header>

    <!-- Estados de carga -->
    <div
      v-if="pending"
      class="rounded-md border border-sand-300 bg-white px-4 py-3 text-brand-700"
    >
      Cargando reporte…
    </div>
    <div
      v-else-if="error"
      class="rounded-md border border-terra-500 bg-white px-4 py-3 text-terra-600"
    >
      No se pudo cargar el reporte.
    </div>

    <!-- Previsualización (área exportable) -->
    <div v-else>
      <Card variant="elevated" title="Previsualización">
        <!-- Nota: evitar colores CSS no compatibles con html2pdf (oklab/oklch); usar HEX/rgba. -->
        <div
          ref="previewRef"
          class="mx-auto w-full max-w-[980px] rounded-md p-6 shadow"
          style="background: #ffffff; color: #1f2937"
        >
          <!-- Encabezado -->
          <div
            class="flex items-start justify-between gap-4"
            style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px"
          >
            <div>
              <div style="font-size: 22px; font-weight: 600; color: #3b241a">
                Comer y Dormir
              </div>
              <div style="font-size: 12px; color: #6b7280">
                Reporte: Restaurantes más populares
              </div>
              <div class="mt-2" style="font-size: 12px; color: #6b7280">
                Generado:
                <span style="color: #111827; font-weight: 500">{{
                  formatDate(generatedAt)
                }}</span>
              </div>
            </div>
            <div class="text-right">
              <div style="font-size: 14px; font-weight: 600">RESUMEN</div>
              <div style="font-size: 12px; color: #6b7280">
                Total restaurantes:
                <span style="color: #111827; font-weight: 600">{{
                  items.length
                }}</span>
              </div>
            </div>
          </div>

          <!-- Top 3 tarjetas -->
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div
              v-for="(r, i) in top3"
              :key="r.restaurantId"
              class="rounded-md border p-3"
              style="border-color: #e5e7eb; background: #ffffff"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm" style="color: #6b7280">#{{ i + 1 }}</div>
                <span
                  class="rounded px-2 py-0.5 text-xs"
                  :style="r.badgeStyle"
                  >{{ r.badgeText }}</span
                >
              </div>
              <div class="mt-1 text-sm" style="color: #6b7280">
                {{ r.restaurantAddress }}
              </div>
              <div
                class="mt-1 text-[15px] font-semibold"
                style="color: #111827"
              >
                {{ r.restaurantName }}
              </div>
              <div class="mt-2 text-sm">
                <span style="color: #6b7280">Órdenes:</span>
                <span style="color: #111827; font-weight: 600">{{
                  r.ordersCount
                }}</span>
              </div>
              <div class="text-sm">
                <span style="color: #6b7280">Ingresos:</span>
                <span style="color: #111827; font-weight: 600">{{
                  currency.format(r.revenue)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Tabla completa -->
          <div class="mt-6 overflow-x-auto">
            <table
              class="w-full"
              style="font-size: 13px; border-collapse: collapse"
            >
              <thead>
                <tr style="text-align: left; border-bottom: 1px solid #e5e7eb">
                  <th class="py-2 pr-2">#</th>
                  <th class="py-2 pr-2">Restaurante</th>
                  <th class="py-2 pr-2">Dirección</th>
                  <th class="py-2 pr-2 text-center">Órdenes</th>
                  <th class="py-2 pr-2 text-right">Ingresos</th>
                  <th class="py-2 pr-2 text-center">Rating</th>
                  <th class="py-2 pr-2">Última orden</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(r, i) in items"
                  :key="r.restaurantId"
                  style="border-bottom: 1px solid #f3f4f6"
                >
                  <td class="py-2 align-top">{{ i + 1 }}</td>
                  <td class="py-2 align-top font-medium">
                    {{ r.restaurantName }}
                  </td>
                  <td class="py-2 align-top">
                    {{ r.restaurantAddress || "—" }}
                  </td>
                  <td class="py-2 align-top text-center">
                    {{ r.ordersCount }}
                  </td>
                  <td class="py-2 align-top text-right">
                    {{ currency.format(r.revenue) }}
                  </td>
                  <td class="py-2 align-top text-center">
                    {{ (r.restaurantRating ?? 0).toFixed(1) }}
                  </td>
                  <td class="py-2 align-top">
                    {{ formatDate(r.lastOrderAt) }}
                  </td>
                </tr>
                <tr v-if="!items.length">
                  <td
                    colspan="7"
                    class="py-4 text-center"
                    style="color: #6b7280"
                  >
                    Sin datos.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Detalle de órdenes por restaurante -->
          <div class="mt-8">
            <div
              class="mb-2"
              style="font-size: 16px; font-weight: 600; color: #111827"
            >
              Detalle de órdenes por restaurante
            </div>
            <div class="space-y-6">
              <div
                v-for="r in items"
                :key="`orders-${r.restaurantId}`"
                class="rounded-md border p-4"
                style="border-color: #e5e7eb; background: #ffffff"
              >
                <div class="mb-3 flex items-center justify-between">
                  <div class="font-semibold" style="color: #111827">
                    {{ r.restaurantName }}
                  </div>
                  <div class="text-sm" style="color: #6b7280">
                    Órdenes:
                    <span style="color: #111827; font-weight: 600">{{
                      r.orders.length
                    }}</span>
                    · Ingresos:
                    <span style="color: #111827; font-weight: 600">{{
                      currency.format(r.revenue)
                    }}</span>
                  </div>
                </div>
                <div class="overflow-x-auto">
                  <table
                    class="w-full"
                    style="font-size: 13px; border-collapse: collapse"
                  >
                    <thead>
                      <tr
                        style="
                          text-align: left;
                          border-bottom: 1px solid #e5e7eb;
                        "
                      >
                        <th class="py-2 pr-2">ID</th>
                        <th class="py-2 pr-2">Cliente</th>
                        <th class="py-2 pr-2">NIT</th>
                        <th class="py-2 pr-2">Fecha</th>
                        <th class="py-2 pr-2">Total</th>
                        <th class="py-2 pr-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="o in r.orders"
                        :key="o.orderId"
                        style="border-bottom: 1px solid #f3f4f6"
                      >
                        <td class="py-2 align-top font-mono text-xs">
                          {{ o.orderId }}
                        </td>
                        <td class="py-2 align-top">
                          {{
                            o.clientName ||
                            (o.nit ? "Cliente" : "Consumidor final")
                          }}
                        </td>
                        <td class="py-2 align-top">{{ o.nit || "—" }}</td>
                        <td class="py-2 align-top">
                          {{ formatDate(o.date || o.paidAt || null) }}
                        </td>
                        <td class="py-2 align-top">
                          {{ currency.format(o.totalAmount || 0) }}
                        </td>
                        <td class="py-2 align-top">
                          <span
                            v-if="o.paid"
                            class="rounded px-2 py-0.5 text-xs"
                            >Pagada</span
                          >
                          <span v-else class="rounded px-2 py-0.5 text-xs"
                            >Pendiente</span
                          >
                        </td>
                      </tr>
                      <tr v-if="!r.orders.length">
                        <td
                          colspan="6"
                          class="py-3 text-center"
                          style="color: #6b7280"
                        >
                          Sin órdenes registradas.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between text-sm text-brand-700">
            <span>Generado: {{ formatDate(generatedAt) }}</span>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="secondary" @click="onPrint"
                >Imprimir</Button
              >
              <Button
                size="sm"
                variant="primary"
                :loading="downloading"
                @click="onDownloadPdf"
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
import { computed, ref } from "vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useReportService } from "~/services/report";

const { redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.MANAGER];
redirectIfUnauthorized(permitedRoles, "/");

const reportSvc = useReportService();
// Puede devolver un único objeto o una lista, lo normalizamos a arreglo.
const {
  data: rawData,
  pending,
  error,
} = await useAsyncData(
  "report:restaurants:popular",
  () => reportSvc.restaurantReportMostPopular(),
  { server: true }
);

// Normalización
const normalized = computed<any[]>(() => {
  const d: any = rawData.value;
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return [d];
});

// Mapeo a estructura presentable (con métricas)
const items = computed(() =>
  normalized.value
    .map((r: any) => {
      const rawOrders = Array.isArray(r.orders) ? r.orders : [];
      const orders = rawOrders.map((o: any) => ({
        orderId: o.orderId || o.id,
        clientName: o.clientName || (o.nit ? "Cliente" : "Consumidor final"),
        nit: o.nit ?? null,
        date: o.date || o.paidAt || null,
        totalAmount: Number(o.totalAmount ?? o.total ?? 0),
        paidAt: o.paidAt || null,
        paid: o.isPaid ?? o.paid ?? false,
      }));
      const revenue = orders.reduce(
        (acc: number, o: any) => acc + Number(o.totalAmount || 0),
        0
      );
      const lastOrderAt = orders.reduce((acc: string | null, o: any) => {
        const d = o?.date || o?.paidAt || null;
        if (!d) return acc;
        if (!acc) return d;
        return new Date(d) > new Date(acc) ? d : acc;
      }, null as string | null);
      return {
        restaurantId: r.restaurantId || r.id,
        restaurantName: r.restaurantName || r.name,
        restaurantAddress: r.restaurantAddress || r.address || "",
        restaurantRating: r.restaurantRating ?? r.rating ?? 0,
        orders,
        ordersCount: orders.length,
        revenue,
        lastOrderAt,
        badgeText: "TOP",
        badgeStyle: "background:#8FA382;color:#ffffff;",
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.ordersCount - a.ordersCount)
);

const top3 = computed(() => items.value.slice(0, 3));

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});
const dt = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "short",
  timeStyle: "short",
});
const generatedAt = computed(() => {
  const d: any = rawData.value;
  const g = Array.isArray(d)
    ? d[0]?.generatedAt || d[0]?.date || new Date().toISOString()
    : d?.generatedAt || d?.date || new Date().toISOString();
  return g;
});
function formatDate(v?: string | null) {
  if (!v) return "—";
  try {
    return dt.format(new Date(v));
  } catch {
    return String(v);
  }
}

// PDF / impresión
const previewRef = ref<HTMLElement | null>(null);
const downloading = ref(false);
function onPrint() {
  window.print();
}
async function onDownloadPdf() {
  if (!previewRef.value) return;
  try {
    downloading.value = true;
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: 8,
      filename: `reporte-restaurantes-populares.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    } as any;
    await html2pdf().set(opt).from(previewRef.value).save();
  } finally {
    downloading.value = false;
  }
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
