<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-6">
    <!-- Header / acciones -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">Reporte de restaurante</h1>
        <p class="text-sm text-brand-700">ID: {{ id }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" to="/reportes">← Reportes</Button>
      </div>
    </header>

    <!-- Estados de carga -->
    <div v-if="pending" class="rounded-md border border-sand-300 bg-white px-4 py-3 text-brand-700">Cargando reporte…</div>
    <div v-else-if="error" class="rounded-md border border-terra-500 bg-white px-4 py-3 text-terra-600">No se pudo cargar el reporte.</div>

    <!-- Previsualización (área exportable) -->
    <div v-else>
      <Card variant="elevated" title="Previsualización">
        <!-- Nota: para evitar problemas con html2pdf y colores OKLCH, usamos colores hex vía style inline dentro del contenedor -->
        <div ref="previewRef" class="mx-auto w-full max-w-[900px] rounded-md p-6 shadow" style="background:#ffffff;color:#1f2937;">
          <!-- Encabezado -->
          <div class="flex items-start justify-between gap-4" style="border-bottom:1px solid #e5e7eb;padding-bottom:12px;">
            <div>
              <div style="font-size:22px;font-weight:600;color:#3b241a;">Comer y Dormir</div>
              <div style="font-size:12px;color:#6b7280;">Reporte de restaurante</div>
              <div class="mt-2" style="font-size:12px;color:#6b7280;">{{ report?.restaurantName }}</div>
              <div style="font-size:12px;color:#6b7280;">{{ report?.restaurantAddress }}</div>
            </div>
            <div class="text-right">
              <div style="font-size:14px;font-weight:600;">RESUMEN</div>
              <div style="font-size:12px;color:#6b7280;">Generado: <span style="color:#111827;font-weight:500;">{{ formatDate(report?.generatedAt) }}</span></div>
              <div class="mt-1" v-if="report">
                <span class="rounded px-2 py-0.5 text-xs" style="background:#F2E9DE;color:#3b241a;border:1px solid #E6D9C8;">Total órdenes: {{ report.totalOrders }}</span>
              </div>
            </div>
          </div>

          <!-- Detalle restaurante -->
          <div class="mt-4 grid gap-1" style="font-size:14px;">
            <div><span style="color:#6b7280;">Descripción:</span> <span style="color:#1f2937;">{{ report?.restaurantDescription || '—' }}</span></div>
            <div class="flex items-center gap-2">
              <span style="color:#6b7280;">Valoración:</span>
              <span style="color:#1f2937;font-weight:600;">{{ (report?.restaurantRating ?? 0).toFixed(1) }}/5</span>
            </div>
          </div>

          <!-- Tabla de órdenes -->
          <div class="mt-6 overflow-x-auto">
            <table class="w-full" style="font-size:13px;border-collapse:collapse;">
              <thead>
                <tr style="text-align:left;border-bottom:1px solid #e5e7eb;">
                  <th class="py-2 pr-2">#</th>
                  <th class="py-2 pr-2">Orden</th>
                  <th class="py-2 pr-2">Cliente</th>
                  <th class="py-2 pr-2">NIT</th>
                  <th class="py-2 pr-2">Fecha</th>
                  <th class="py-2 pr-2">Total</th>
                  <th class="py-2 pr-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(o, i) in (report?.orders || [])" :key="o.orderId" style="border-bottom:1px solid #f3f4f6;">
                  <td class="py-2 align-top">{{ i + 1 }}</td>
                  <td class="py-2 align-top font-medium">{{ o.orderId }}</td>
                  <td class="py-2 align-top">{{ o.clientName || '—' }}</td>
                  <td class="py-2 align-top">{{ o.nit || '—' }}</td>
                  <td class="py-2 align-top">{{ formatDate(o.date) }}</td>
                  <td class="py-2 align-top">Q {{ formatCurrency(o.totalAmount) }}</td>
                  <td class="py-2 align-top">
                    <span v-if="o.paid" class="rounded px-2 py-0.5 text-xs">Pagada</span>
                    <span v-else class="rounded px-2 py-0.5 text-xs">Pendiente</span>
                  </td>
                </tr>
                <tr v-if="!report || (report.orders || []).length === 0">
                  <td colspan="7" class="py-4 text-center" style="color:#6b7280;">Sin órdenes registradas.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totales -->
          <div class="mt-4 flex items-start justify-end">
            <div class="w-full max-w-sm space-y-1" style="font-size:14px;">
              <div class="flex items-center justify-between">
                <span style="color:#6b7280;">Órdenes</span>
                <span style="color:#111827;font-weight:600;">{{ report?.totalOrders || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center" style="font-size:12px;color:#6b7280;">
            Resumen generado por el módulo de reportes — Comer y Dormir
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between text-sm text-brand-700">
            <span>Generado: {{ formatDate(report?.generatedAt) }}</span>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="secondary" @click="onPrint">Imprimir</Button>
              <Button size="sm" variant="primary" :loading="downloading" @click="onDownloadPdf">Descargar PDF</Button>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import { useReportService } from '~/services/report'

const { redirectIfUnauthorized } = useUseRoles()
const permitedRoles = [Roles.ADMIN, Roles.MANAGER]
redirectIfUnauthorized(permitedRoles, '/')

const route = useRoute()
const id = computed(() => String(route.params.id || ''))

const reportSvc = useReportService()
const { data: reportData, pending, error } = await useAsyncData(
  () => `report:restaurant:${id.value}`,
  () => id.value ? reportSvc.restaurantReport(id.value) : Promise.resolve(null),
  { watch: [id], server: true }
)
const report = computed(() => reportData.value as any)

// utils
const currency = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })
const dt = new Intl.DateTimeFormat('es-GT', { dateStyle: 'short', timeStyle: 'short' })
function formatCurrency(v: number | string | null | undefined) { return Number(v || 0).toFixed(2) }
function formatDate(v?: string | null) { if (!v) return '—'; try { return dt.format(new Date(v)) } catch { return String(v) } }

// PDF / impresión
const previewRef = ref<HTMLElement | null>(null)
const downloading = ref(false)

function onPrint() { window.print() }

async function onDownloadPdf() {
  if (!previewRef.value) return
  try {
    downloading.value = true
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 8,
      filename: `reporte-restaurante-${id.value}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    } as any
    await html2pdf().set(opt).from(previewRef.value).save()
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
@media print {
  header, .no-print { display: none !important; }
  .shadow { box-shadow: none !important; }
}
</style>