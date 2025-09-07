<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-6">
    <!-- Toolbar -->
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-brand-900">Reporte: Ganancias de Hotel</h1>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" to="/reportes">← Regresar</Button>
      </div>
    </header>

    <!-- Parámetros -->
    <Card variant="elevated" title="Parámetros">
      <div class="grid gap-4 sm:grid-cols-4 items-end">
        <Select
          v-model="hotelId"
          :options="hotelOptions"
          label="Hotel *"
          placeholder="Selecciona…"
          :error="hotelError"
          class="sm:col-span-2"
        />
        <InputDate v-model="start" label="Inicio *" :error="errors.start" class="sm:col-span-1" />
        <InputDate v-model="end" label="Fin *" :error="errors.end" class="sm:col-span-1" />
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="secondary" @click="onClear">Limpiar</Button>
          <Button variant="primary" @click="onFetch" :loading="loading">Generar</Button>
        </div>
      </template>
    </Card>

    <!-- Estados -->
    <div v-if="loading" class="text-brand-700">Generando reporte…</div>
    <div v-else-if="errorMsg" class="text-terra-500">{{ errorMsg }}</div>

    <!-- Previsualización -->
    <Card v-else-if="report" variant="elevated" title="Previsualización">
      <div ref="pdfRef" class="space-y-4">
        <!-- Encabezado -->
        <div class="flex items-start justify-between border-b border-sand-300 pb-3">
          <div>
            <div class="text-2xl font-semibold text-brand-800">{{ hotelName }}</div>
            <div class="text-sm text-brand-700">{{ hotelAddress }}</div>
            <div class="text-xs text-brand-700">Rango: {{ formatDate(start) }} — {{ formatDate(end) }}</div>
          </div>
          <div class="text-right text-sm">
            <div class="text-brand-700">Generado</div>
            <div class="font-medium text-brand-900">{{ formatDateTime(report.generatedAt) }}</div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-md border border-sand-300 p-3">
            <div class="text-xs text-brand-700">Total ganancias</div>
            <div class="text-lg font-semibold text-brand-900">Q {{ currency(report.totalProfit) }}</div>
          </div>
          <div class="rounded-md border border-sand-300 p-3">
            <div class="text-xs text-brand-700">Reservaciones</div>
            <div class="text-lg font-semibold text-brand-900">{{ report.reservations?.length || 0 }}</div>
          </div>
          <div class="rounded-md border border-sand-300 p-3">
            <div class="text-xs text-brand-700">Hotel</div>
            <div class="text-lg font-semibold text-brand-900">{{ hotelName }}</div>
          </div>
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-sand-300 text-left">
                <th class="py-2 pr-2">#</th>
                <th class="py-2 pr-2">Reserva</th>
                <th class="py-2 pr-2">Check-in</th>
                <th class="py-2 pr-2">Check-out</th>
                <th class="py-2 pr-2 text-center">Noches</th>
                <th class="py-2 pr-2 text-right">Precio/noche</th>
                <th class="py-2 pr-2 text-right">Mantenimiento</th>
                <th class="py-2 pl-2 text-right">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in report.reservations" :key="r.reservationId" class="border-b border-sand-100">
                <td class="py-2 pr-2 align-top">{{ i + 1 }}</td>
                <td class="py-2 pr-2 align-top font-medium">{{ r.reservationId }}</td>
                <td class="py-2 pr-2 align-top">{{ formatDateTime(r.checkIn) }}</td>
                <td class="py-2 pr-2 align-top">{{ formatDateTime(r.checkOut) }}</td>
                <td class="py-2 pr-2 align-top text-center">{{ r.nights }}</td>
                <td class="py-2 pr-2 align-top text-right">Q {{ currency(r.price) }}</td>
                <td class="py-2 pr-2 align-top text-right">Q {{ currency(r.maintenancePrice) }}</td>
                <td class="py-2 pl-2 align-top text-right font-semibold">Q {{ currency(r.profit) }}</td>
              </tr>
              <tr v-if="!report.reservations?.length">
                <td colspan="8" class="py-4 text-center text-brand-700">Sin datos en el rango seleccionado.</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="7" class="py-3 text-right font-medium">Total</td>
                <td class="py-3 text-right font-semibold">Q {{ currency(report.totalProfit) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between text-sm text-brand-700">
          <span>Rango consultado: {{ formatDate(start) }} — {{ formatDate(end) }}</span>
          <div class="flex items-center gap-2">
            <Button size="sm" variant="secondary" @click="onPrint">Imprimir</Button>
            <Button size="sm" variant="primary" @click="onDownloadPdf" :loading="downloading">Exportar PDF</Button>
          </div>
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
const hotelError = computed(() => (hotelId.value ? '' : 'Requerido'))

// Precargar desde query
watchEffect(() => {
  const q = route.query
  if (typeof q.hotelId === 'string') hotelId.value = q.hotelId
  if (typeof q.start === 'string') start.value = q.start
  if (typeof q.end === 'string') end.value = q.end
})

// Catálogo hoteles
const { data: hotelsData } = await useAsyncData('report:hotels', () => hotelSvc.getAll?.(), { server: true })
const hotelOptions = computed(() => {
  const arr = Array.isArray(hotelsData.value) ? (hotelsData.value as any[]) : ((hotelsData.value as any)?.items || [])
  return arr.map((h: any) => ({ label: h.name, value: h.id }))
})

// Info hotel
const hotelInfo = ref<any>(null)
const hotelName = computed(() => hotelInfo.value?.name || 'Hotel')
const hotelAddress = computed(() => hotelInfo.value?.address || '')

// Datos del reporte
const report = ref<any | null>(null)
const loading = ref(false)
const errorMsg = ref('')

// PDF
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
  return !errors.value.start && !errors.value.end && !!hotelId.value
}

async function onFetch() {
  if (!validate()) return
  try {
    loading.value = true
    errorMsg.value = ''
    // Persistir query
    router.replace({ query: { hotelId: hotelId.value!, start: start.value, end: end.value } })
    // Cargar info hotel
    hotelInfo.value = await hotelSvc.getById(String(hotelId.value))
    // Cargar reporte
    report.value = await reportSvc.getProfitByHotel(String(hotelId.value), normalizeStart(start.value), normalizeEnd(end.value))
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
  try {
    downloading.value = true
    // Modo PDF seguro con colores transparentes
    pdfRef.value.classList.add('pdf-safe')
    await nextTick()

    const html2pdf = (await import('html2pdf.js')).default
    const opt: any = {
      margin: 8,
      filename: `hotel-ganancias-${hotelName.value}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    await html2pdf().set(opt).from(pdfRef.value).save()
  } catch (e) {
    toast.error('No se pudo generar el PDF')
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
  /* Oculta la barra de acciones en impresión */
  .space-y-6 > header { display: none !important; }
}

/* PDF-safe: usar colores transparentes para evitar conflictos en html2pdf/html2canvas */
.pdf-safe, .pdf-safe * {
  color: #1f2937 !important;            /* texto principal */
  background-color: #0000 !important;    /* transparente */
  border-color: #0000 !important;        /* transparente */
  box-shadow: none !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  filter: none !important;
}
</style>