<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-8">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/reportes">← Regresar</Button>
      <h1 class="text-xl font-semibold text-brand-900">Reporte · Ingresos por hotel</h1>
      <div />
    </div>

    <!-- Parámetros -->
    <Card variant="elevated" title="Parámetros">
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="sm:col-span-1">
          <Select
            v-model="hotelId"
            :options="hotelOptions"
            label="Hotel *"
            placeholder="Selecciona un hotel…"
            size="md"
            clearable
          />
        </div>
        <div class="sm:col-span-1">
          <InputDate
            v-model="start"
            label="Inicio *"
            placeholder="AAAA-MM-DD"
            :error="errors.start"
            size="md"
          />
        </div>
        <div class="sm:col-span-1">
          <InputDate
            v-model="end"
            label="Fin *"
            placeholder="AAAA-MM-DD"
            :error="errors.end"
            size="md"
          />
        </div>
        <div class="sm:col-span-3 flex items-center justify-end gap-2">
          <Button variant="secondary" @click="onClear">Limpiar</Button>
          <Button variant="primary" :loading="loading" @click="onFetch">Consultar</Button>
        </div>
      </div>
    </Card>

    <!-- Resultado -->
    <Card variant="elevated" title="Resultado" subtitle="Previsualización del reporte">
      <!-- Estados -->
      <div v-if="loading" class="text-brand-700">Cargando reporte…</div>
      <div v-else-if="errorMsg" class="text-terra-500">{{ errorMsg }}</div>

      <div v-else-if="report" ref="pdfRef" class="space-y-6">
        <!-- Encabezado del hotel -->
        <div class="flex flex-wrap items-start justify-between gap-4 border-b border-sand-300 pb-4">
          <div>
            <div class="text-2xl font-semibold text-brand-800">{{ hotelName }}</div>
            <div class="text-sm text-brand-700">{{ hotelAddress }}</div>
            <div class="text-sm text-brand-700">Rango: <span class="font-medium text-brand-900">{{ formatDate(start) }}</span> — <span class="font-medium text-brand-900">{{ formatDate(end) }}</span></div>
          </div>
          <div class="text-right">
            <div class="text-xs text-brand-700">Generado</div>
            <div class="font-mono text-sm text-brand-900">{{ formatDateTime(report.generatedAt) }}</div>
            <div class="mt-1 text-sm text-brand-700">Calificación: <span class="font-medium text-brand-900">{{ report.hotelRating?.toFixed?.(1) ?? report.hotelRating }}</span></div>
          </div>
        </div>

        <!-- Resumen -->
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-md border border-sand-300 bg-sand-50 p-3">
            <div class="text-xs text-brand-700">Total de reservaciones</div>
            <div class="text-lg font-semibold text-brand-900">{{ report.orders?.length || 0 }}</div>
          </div>
          <div class="rounded-md border border-sand-300 bg-sand-50 p-3">
            <div class="text-xs text-brand-700">Ingresos totales</div>
            <div class="text-lg font-semibold text-brand-900">Q {{ currency(report.totalRevenue) }}</div>
          </div>
          <div class="rounded-md border border-sand-300 bg-sand-50 p-3">
            <div class="text-xs text-brand-700">Hotel</div>
            <div class="text-sm font-medium text-brand-900">{{ report.hotelName }}</div>
          </div>
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-sand-300 text-left">
                <th class="py-2 px-2">#</th>
                <th class="py-2 px-2">Reserva</th>
                <th class="py-2 px-2">Cliente</th>
                <th class="py-2 px-2">NIT</th>
                <th class="py-2 px-2 text-center">Noches</th>
                <th class="py-2 px-2">Check-in</th>
                <th class="py-2 px-2">Check-out</th>
                <th class="py-2 px-2 text-right">Total</th>
                <th class="py-2 px-2 text-center">Estado</th>
                <th class="py-2 px-2">Pagado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in report.orders || []" :key="r.reservationId" class="border-b border-sand-100">
                <td class="py-2 px-2">{{ i + 1 }}</td>
                <td class="py-2 px-2 font-mono">{{ r.reservationId }}</td>
                <td class="py-2 px-2">{{ r.clientName || 'Consumidor final' }}</td>
                <td class="py-2 px-2">{{ r.nit || '—' }}</td>
                <td class="py-2 px-2 text-center">{{ r.nights }}</td>
                <td class="py-2 px-2">{{ formatDateTime(r.checkIn) }}</td>
                <td class="py-2 px-2">{{ formatDateTime(r.checkOut) }}</td>
                <td class="py-2 px-2 text-right">Q {{ currency(r.totalAmount) }}</td>
                <td class="py-2 px-2 text-center">
                  <span v-if="r.paid" class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white">Pagada</span>
                  <span v-else class="rounded px-2 py-0.5 text-xs bg-gold-500/20 text-brand-900 border border-gold-500/40">Pendiente</span>
                </td>
                <td class="py-2 px-2">{{ r.paidAt ? formatDateTime(r.paidAt) : '—' }}</td>
              </tr>
              <tr v-if="!report.orders?.length">
                <td class="py-3 px-2 text-center text-brand-700" colspan="10">Sin datos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="text-brand-700">Configura los parámetros y presiona <strong>Consultar</strong>.</div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" @click="onPrint">Imprimir</Button>
          <Button variant="primary" size="sm" :loading="downloading" :disabled="!report" @click="onDownloadPdf">Descargar PDF</Button>
        </div>
      </template>
    </Card>
  </div>
</template>
<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })

import { ref, computed, watchEffect, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Select from '~/components/ui/Select.vue'
import InputDate from '~/components/ui/InputDate.vue'
import { useToast } from '~/composables/useToast'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import { useReportService } from '~/services/report'
import { useHotelService } from '~/services/hotels'

const { redirectIfUnauthorized } = useUseRoles()
redirectIfUnauthorized([Roles.ADMIN, Roles.MANAGER], '/')

const route = useRoute()
const router = useRouter()
const toast = useToast()
const reportSvc = useReportService()
const hotelSvc = useHotelService()

// Parámetros
const hotelId = ref<string | null>(null)
const start = ref<string>('')
const end = ref<string>('')

const errors = ref<{ start: string; end: string }>({ start: '', end: '' })

// Pre-cargar desde query
watchEffect(() => {
  const q = route.query
  if (typeof q.hotelId === 'string') hotelId.value = q.hotelId
  if (typeof q.start === 'string') start.value = q.start
  if (typeof q.end === 'string') end.value = q.end
})

// Catálogo de hoteles
const { data: hotelsData } = await useAsyncData('report:hotels', () => hotelSvc.getAll?.(), { server: true })
const hotelOptions = computed(() => {
  const arr = Array.isArray(hotelsData.value) ? (hotelsData.value as any[]) : ((hotelsData.value as any)?.items || [])
  return arr.map((h: any) => ({ label: h.name, value: h.id }))
})

// Info de hotel actual
const hotelInfo = ref<any>(null)
const hotelName = computed(() => hotelInfo.value?.name || 'Hotel')
const hotelAddress = computed(() => hotelInfo.value?.address || '')

// Datos del reporte
const report = ref<any | null>(null)
const loading = ref(false)
const errorMsg = ref('')

// Área para PDF
const pdfRef = ref<HTMLElement | null>(null)
const downloading = ref(false)

function normalizeStart(d: string) { return d ? `${d}T00:00:00` : '' }
function normalizeEnd(d: string) { return d ? `${d}T23:59:59` : '' }

function validate() {
  errors.value.start = start.value ? '' : 'Requerido'
  errors.value.end = end.value ? '' : 'Requerido'
  if (start.value && end.value) {
    if (new Date(start.value) > new Date(end.value)) {
      errors.value.end = 'Fin debe ser ≥ inicio'
    }
  }
  return !errors.value.start && !errors.value.end
}

async function onFetch() {
  if (!hotelId.value) { toast.error('Selecciona un hotel'); return }
  if (!validate()) return
  try {
    loading.value = true
    errorMsg.value = ''
    // Persistir query
    router.replace({ query: { hotelId: hotelId.value, start: start.value, end: end.value } })
    // Llamar reporte
    report.value = await reportSvc.getRevenueByHotel(String(hotelId.value), normalizeStart(start.value), normalizeEnd(end.value))
    // Info del hotel
    hotelInfo.value = await hotelSvc.getById(String(hotelId.value))
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'No se pudo generar el reporte'
    report.value = null
  } finally {
    loading.value = false
  }
}

function onClear() {
  hotelId.value = null
  start.value = ''
  end.value = ''
  report.value = null
  errorMsg.value = ''
  router.replace({ query: {} })
}

function currency(n: any) { return Number(n || 0).toFixed(2) }
const dt = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium' })
const dtFull = new Intl.DateTimeFormat('es-GT', { dateStyle: 'short', timeStyle: 'short' })
function formatDate(d?: string) { if (!d) return '—'; try { return dt.format(new Date(d)) } catch { return d! } }
function formatDateTime(d?: string) { if (!d) return '—'; try { return dtFull.format(new Date(d)) } catch { return d! } }

async function onDownloadPdf() {
  if (!report.value || !pdfRef.value) return
    // Forzar estilos seguros para PDF (evita oklab/oklch)
    pdfRef.value.classList.add('pdf-safe')
    await nextTick()
  try {
    downloading.value = true
    const html2pdf = (await import('html2pdf.js')).default
    const opt: any = {
      margin: 8,
      filename: `hotel-ingresos-${hotelName.value}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    await html2pdf().set(opt).from(pdfRef.value).save()
  } catch (e) {
    toast.error('No se pudo generar el PDF')
    console.log(e);
  } finally {
    pdfRef.value?.classList.remove('pdf-safe')
    downloading.value = false
  }
}
function onPrint() { window.print() }

// Auto-consulta si vienen los 3 query params
onMounted(() => {
  const q = route.query
  if (q.hotelId && q.start && q.end) onFetch()
})
</script>

<style scoped>
@media print {
  /* Oculta la barra superior en impresión */
  .space-y-8 > .flex:first-child { display: none !important; }
}

/* PDF-safe reset: fuerza colores compatibles para html2pdf/html2canvas */
.pdf-safe, .pdf-safe * {
  color: #1f2937 !important;            /* ink-900 */
  background-color: #ffffff00 !important; /* fondo blanco */
  border-color: #e5e7eb00 !important;     /* borde claro */
  box-shadow: none !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  filter: none !important;
}
</style>