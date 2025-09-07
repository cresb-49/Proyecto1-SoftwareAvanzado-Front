<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-8">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/reportes">← Regresar</Button>
      <h1 class="text-xl font-semibold text-brand-900">Reporte · Habitaciones populares</h1>
      <div />
    </div>

    <!-- Parámetros -->
    <Card variant="elevated" title="Parámetros">
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="sm:col-span-1">
          <Select
            v-model="mode"
            :options="modeOptions"
            label="Tipo de consulta *"
            placeholder="Selecciona tipo…"
            size="md"
          />
        </div>

        <div class="sm:col-span-2" v-if="mode === 'HOTEL'">
          <Select
            v-model="selectedHotelId"
            :options="hotelOptions"
            label="Hotel"
            placeholder="Selecciona un hotel…"
            size="md"
            clearable
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

      <!-- Global -->
      <div v-else-if="mode === 'GLOBAL' && globalReport" ref="pdfRef">
        <div class="mb-3 text-sm text-brand-700">
          Generado: <span class="font-medium text-brand-900">{{ formatDate(globalReport.generatedAt) }}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-sand-300 text-left">
                <th class="py-2 px-2">#</th>
                <th class="py-2 px-2">Hotel</th>
                <th class="py-2 px-2">Habitación</th>
                <th class="py-2 px-2 text-right">Precio</th>
                <th class="py-2 px-2 text-center">Reservas</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in globalReport.rooms"
                :key="`${r.id}-${i}`"
                class="border-b border-sand-100"
              >
                <td class="py-2 px-2">{{ i + 1 }}</td>
                <td class="py-2 px-2">{{ r.hotelName }}</td>
                <td class="py-2 px-2">#{{ r.number }}</td>
                <td class="py-2 px-2 text-right">Q {{ currency(r.price) }}</td>
                <td class="py-2 px-2 text-center">{{ r.reservations }}</td>
              </tr>
              <tr v-if="!globalReport.rooms?.length">
                <td class="py-3 px-2 text-center text-brand-700" colspan="5">Sin datos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Por hotel -->
      <div v-else-if="mode === 'HOTEL' && byHotelReport" ref="pdfRef">
        <div class="mb-1 text-sm text-brand-700">
          Hotel: <span class="font-medium text-brand-900">{{ byHotelReport.hotelName }}</span>
        </div>
        <div class="mb-3 text-sm text-brand-700">
          Generado: <span class="font-medium text-brand-900">{{ formatDate(byHotelReport.generatedAt) }}</span>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-sand-300 text-left">
                <th class="py-2 px-2">#</th>
                <th class="py-2 px-2">Habitación</th>
                <th class="py-2 px-2 text-right">Precio</th>
                <th class="py-2 px-2 text-center">Reservas</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in byHotelReport.rooms"
                :key="`${r.id}-${i}`"
                class="border-b border-sand-100"
              >
                <td class="py-2 px-2">{{ i + 1 }}</td>
                <td class="py-2 px-2">#{{ r.number }}</td>
                <td class="py-2 px-2 text-right">Q {{ currency(r.price) }}</td>
                <td class="py-2 px-2 text-center">{{ r.reservations }}</td>
              </tr>
              <tr v-if="!byHotelReport.rooms?.length">
                <td class="py-3 px-2 text-center text-brand-700" colspan="4">Sin datos</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="text-brand-700">Configura los parámetros y presiona <strong>Consultar</strong>.</div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" @click="onPrint">Imprimir</Button>
          <Button variant="primary" size="sm" :loading="downloading" :disabled="!canExport" @click="onDownloadPdf">Descargar PDF</Button>
        </div>
      </template>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })

import { ref, computed } from 'vue'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Select from '~/components/ui/Select.vue'
import { useToast } from '~/composables/useToast'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import { useReportService } from '~/services/report'
import { useHotelService } from '~/services/hotels'

const { redirectIfUnauthorized } = useUseRoles()
redirectIfUnauthorized([Roles.ADMIN, Roles.MANAGER], '/')

const toast = useToast()
const reportSvc = useReportService()
const hotelSvc = useHotelService()

type Mode = 'GLOBAL' | 'HOTEL'
const mode = ref<Mode>('GLOBAL')
const modeOptions = [
  { label: 'Global (todos los hoteles)', value: 'GLOBAL' },
  { label: 'Por hotel', value: 'HOTEL' },
]

// Catálogo de hoteles
const { data: hotelsData } = await useAsyncData(
  'popular-rooms:hotels',
  () => hotelSvc.getAll?.(),
  { server: true }
)
const hotelOptions = computed(() => {
  const val = hotelsData.value as any
  const items = Array.isArray(val) ? val : (val?.items || [])
  return items.map((h:any) => ({ label: h.name, value: h.id }))
})
const selectedHotelId = ref<string | null>(null)

// Estado de consulta
const loading = ref(false)
const errorMsg = ref('')

// Resultados
const globalReport = ref<any | null>(null)
const byHotelReport = ref<any | null>(null)

function onClear() {
  selectedHotelId.value = null
  errorMsg.value = ''
  globalReport.value = null
  byHotelReport.value = null
}

async function onFetch() {
  errorMsg.value = ''
  globalReport.value = null
  byHotelReport.value = null
  try {
    loading.value = true
    if (mode.value === 'GLOBAL') {
      globalReport.value = await reportSvc.getRoomPopularity()
    } else {
      if (!selectedHotelId.value) {
        toast.error('Selecciona un hotel')
        return
      }
      byHotelReport.value = await reportSvc.getPopularRoomByHotel(String(selectedHotelId.value))
    }
  } catch (e:any) {
    errorMsg.value = e?.data?.message || 'No se pudo generar el reporte'
  } finally {
    loading.value = false
  }
}

const currencyFmt = new Intl.NumberFormat('es-GT', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })
function currency(n: number | string) {
  return currencyFmt.format(Number(n || 0))
}
const dateFmt = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
function formatDate(s?: string) {
  if (!s) return '—'
  const d = new Date(s)
  return isNaN(d.getTime()) ? String(s) : dateFmt.format(d)
}

const pdfRef = ref<HTMLElement | null>(null)
const downloading = ref(false)
const canExport = computed(() => (mode.value === 'GLOBAL' && !!globalReport.value) || (mode.value === 'HOTEL' && !!byHotelReport.value))

function onPrint() {
  window.print()
}

async function onDownloadPdf() {
  if (!pdfRef.value) return
  try {
    downloading.value = true
    const html2pdf = (await import('html2pdf.js')).default
    const baseName = mode.value === 'GLOBAL' ? 'habitaciones-populares-global' : `habitaciones-populares-${byHotelReport.value?.hotelName || selectedHotelId.value || 'hotel'}`
    const opt = {
      margin: 8,
      filename: `${baseName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as any
    await html2pdf().set(opt).from(pdfRef.value).save()
  } catch (e: any) {
    toast.error('No se pudo generar el PDF')
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped></style>