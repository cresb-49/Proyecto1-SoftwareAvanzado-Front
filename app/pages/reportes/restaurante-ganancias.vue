<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-8">
    <!-- Toolbar -->
    <header class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-brand-800">Reporte: Ganancias por restaurante</h1>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" to="/reportes">← Reportes</Button>
      </div>
    </header>

    <!-- Parámetros -->
    <Card variant="elevated">
      <template #title>Parámetros</template>
      <div class="grid items-end gap-4 sm:grid-cols-4">
        <div class="sm:col-span-2">
          <Select
            v-model="form.restaurantId"
            :options="restaurantOptions"
            label="Restaurante *"
            placeholder="Selecciona un restaurante…"
            :error="errors.restaurantId"
            size="md"
            clearable
          />
        </div>
        <InputDate
          v-model="form.start"
          label="Inicio *"
          :error="errors.start"
          size="md"
        />
        <InputDate
          v-model="form.end"
          label="Fin *"
          :error="errors.end"
          size="md"
        />
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" @click="onClear">Limpiar</Button>
          <Button variant="primary" size="sm" :loading="loading" @click="onGenerate">Generar</Button>
        </div>
      </template>
    </Card>

    <!-- Estados -->
    <div v-if="loading" class="text-brand-700">Generando reporte…</div>
    <div v-else-if="errorMsg" class="rounded-md border border-terra-500 bg-white p-4 text-terra-600">{{ errorMsg }}</div>

    <!-- Previsualización del reporte -->
    <div v-if="report">
      <Card variant="elevated" title="Previsualización">
        <!-- Área exportable -->
        <div ref="invoiceRef" class="mx-auto max-w-[1000px] rounded-md bg-white p-6 text-ink-900 shadow">
          <!-- Encabezado -->
          <div class="flex items-start justify-between gap-4 border-b border-sand-300 pb-4">
            <div>
              <div class="text-2xl font-semibold text-brand-800">Comer y Dormir</div>
              <div class="text-sm text-brand-700">Reporte de ganancias por restaurante</div>
              <div class="mt-2 text-xs text-brand-700">Restaurante: <span class="font-medium text-brand-900">{{ report.restaurantName }}</span></div>
              <div class="text-xs text-brand-700">Rango: <span class="font-medium text-brand-900">{{ displayRange }}</span></div>
            </div>
            <div class="text-right">
              <div class="text-lg font-semibold">GANANCIAS</div>
              <div class="text-xs text-brand-700">Generado: <span class="font-medium text-brand-900">{{ formatDate(report.generatedAt) }}</span></div>
              <div class="text-xs text-brand-700">ID Restaurante: <span class="font-medium text-brand-900">{{ report.restaurantId }}</span></div>
            </div>
          </div>

          <!-- Resumen -->
          <div class="mt-4 grid gap-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-brand-700">Total de líneas (órdenes)</span>
              <span class="font-medium text-brand-900">{{ report.orders?.length || 0 }}</span>
            </div>
            <div class="flex items-center justify-between text-base">
              <span class="font-semibold text-brand-900">Ganancia total</span>
              <span class="font-semibold text-brand-900">Q {{ formatCurrency(report.totalProfit) }}</span>
            </div>
          </div>

          <!-- Detalle -->
          <div class="mt-6 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-sand-300 text-left">
                  <th class="py-2">#</th>
                  <th class="py-2">Linea de Orden</th>
                  <th class="py-2 text-center">Cant.</th>
                  <th class="py-2 text-right">Precio</th>
                  <th class="py-2 text-right">Costo</th>
                  <th class="py-2 text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(o, i) in report.orders" :key="`${o.orderId}-${i}`" class="border-b border-sand-100">
                  <td class="py-2 align-top">{{ i + 1 }}</td>
                  <td class="py-2 align-top font-medium">{{ o.orderId }}</td>
                  <td class="py-2 align-top text-center">{{ o.quantity }}</td>
                  <td class="py-2 align-top text-right">Q {{ formatCurrency(o.price) }}</td>
                  <td class="py-2 align-top text-right">Q {{ formatCurrency(o.cost) }}</td>
                  <td class="py-2 align-top text-right">Q {{ formatCurrency(o.profit) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-4 text-center text-xs text-brand-700">
            * Los totales corresponden al período consultado.
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between text-sm text-brand-700">
            <span>Vista previa lista para exportar.</span>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="secondary" @click="printPage">Imprimir</Button>
              <Button size="sm" variant="primary" :loading="downloading" @click="downloadPdf">Descargar PDF</Button>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Select from '~/components/ui/Select.vue'
import InputDate from '~/components/ui/InputDate.vue'
import { useToast } from '~/composables/useToast'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import { useRestaurantService } from '~/services/restaurants'
import { useReportService } from '~/services/report'
import type { RestaurantProfitReport } from '~/services/report'

const { redirectIfUnauthorized } = useUseRoles()
redirectIfUnauthorized([Roles.ADMIN, Roles.MANAGER], '/')

const toast = useToast()
const route = useRoute()
const router = useRouter()

// --- Helpers de fecha ---
function toStartOfDayISO(d: string) {
  // Espera 'YYYY-MM-DD' y devuelve 'YYYY-MM-DDT00:00:00'
  return d ? `${d}T00:00:00` : ''
}
function toEndOfDayISO(d: string) {
  return d ? `${d}T23:59:59` : ''
}
const fmtDate = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
function formatDate(v?: string | null) {
  if (!v) return '—'
  try { return fmtDate.format(new Date(v)) } catch { return String(v) }
}
function formatCurrency(n: number | string | null | undefined) {
  return Number(n || 0).toFixed(2)
}

// --- Catálogo de restaurantes ---
const restaurantSvc = useRestaurantService()
const { data: restaurantsData } = await useAsyncData(
  'reports:restaurants',
  () => restaurantSvc.getAll?.(),
  { server: true }
)
const restaurantOptions = computed(() => {
  const col: any = restaurantsData.value
  const items = Array.isArray(col) ? col : (col?.items || [])
  return items.map((r: any) => ({ label: r.name, value: r.id }))
})

// --- Formulario ---
const form = ref<{ restaurantId: string | null; start: string | null; end: string | null }>({
  restaurantId: null,
  start: null,
  end: null
})

// Prefill desde query
watchEffect(() => {
  const q = route.query
  form.value.restaurantId = (q.restaurantId as string) || form.value.restaurantId
  form.value.start = (q.start as string) || form.value.start
  form.value.end = (q.end as string) || form.value.end
})

const errors = ref<{ restaurantId?: string; start?: string; end?: string }>({})
const loading = ref(false)
const errorMsg = ref('')
const report = ref<RestaurantProfitReport | null>(null)

function validate() {
  errors.value = {}
  if (!form.value.restaurantId) errors.value.restaurantId = 'Requerido'
  if (!form.value.start) errors.value.start = 'Requerido'
  if (!form.value.end) errors.value.end = 'Requerido'
  if (form.value.start && form.value.end && form.value.start > form.value.end) {
    errors.value.end = 'Fin debe ser ≥ Inicio'
  }
  return Object.keys(errors.value).length === 0
}

const reportSvc = useReportService()

async function onGenerate() {
  if (!validate()) return
  try {
    loading.value = true
    errorMsg.value = ''
    report.value = await reportSvc.getProfitByRestaurant(
      String(form.value.restaurantId),
      toStartOfDayISO(String(form.value.start)),
      toEndOfDayISO(String(form.value.end))
    )
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'No se pudo generar el reporte'
    report.value = null
  } finally {
    loading.value = false
  }
}

function onClear() {
  report.value = null
  errorMsg.value = ''
  form.value = { restaurantId: null, start: null, end: null }
}

// Rango legible para el header
const displayRange = computed(() => {
  const s = form.value.start ? form.value.start.split('-').reverse().join('/') : '—'
  const e = form.value.end ? form.value.end.split('-').reverse().join('/') : '—'
  return `${s} – ${e}`
})

// Exportar PDF (solo la previsualización)
const invoiceRef = ref<HTMLElement | null>(null)
const downloading = ref(false)
async function downloadPdf() {
  if (!invoiceRef.value) return
  try {
    downloading.value = true
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 8,
      filename: `Reporte-Ganancias-Restaurante-${form.value.restaurantId || 'reporte'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as any
    await html2pdf().set(opt).from(invoiceRef.value).save()
  } catch (e) {
    toast.error('No se pudo generar el PDF')
  } finally {
    downloading.value = false
  }
}

function printPage() { window.print() }
</script>

<style scoped>
@media print {
  header { display: none !important; }
  .shadow { box-shadow: none !important; }
}
</style>