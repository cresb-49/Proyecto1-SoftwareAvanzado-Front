<template>
  <div class="mx-auto max-w-4xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-brand-800">Actividad de cliente</h1>
        <p class="text-sm text-brand-700">Verificación de parámetros, existencia del cliente y previsualización</p>
      </div>
      <Button size="sm" variant="secondary" to="/reportes">← Regresar</Button>
    </header>

    <!-- Estado de consulta -->
    <Card variant="elevated" title="Parámetros recibidos">
      <div class="grid gap-2 text-sm">
        <div><span class="font-medium">NIT:</span> <span class="font-mono">{{ nit || '—' }}</span></div>
        <div class="grid grid-cols-2 gap-2">
          <div><span class="font-medium">Inicio:</span> <span class="font-mono">{{ startAt || '—' }}</span></div>
          <div><span class="font-medium">Fin:</span> <span class="font-mono">{{ endAt || '—' }}</span></div>
        </div>
        <div v-if="!queryValid" class="mt-2 rounded-md border border-terra-500/50 bg-terra-500/10 p-2 text-terra-500">
          {{ queryErrorMsg }}
        </div>
        <div v-else class="mt-2 rounded-md border border-sage-500/50 bg-sage-500/10 p-2 text-sage-700">
          Parámetros válidos. Se puede consultar el reporte.
        </div>
      </div>

      <template #footer>
        <div class="text-xs text-brand-700">
          Ejemplo esperado: <code>?nit=7348295-3&amp;start=2025-08-01&amp;end=2025-10-31</code>
        </div>
      </template>
    </Card>

    <!-- Bloque: parámetros inválidos -->
    <Card v-if="!queryValid" variant="outline" title="Faltan o son inválidos los parámetros">
      <p class="text-sm text-brand-700">Asegúrate de incluir <strong>nit</strong>, <strong>start</strong> y <strong>end</strong> en el querystring. El formato de fechas debe ser <code>YYYY-MM-DD</code> y la fecha de inicio no puede ser posterior a la de fin (puede ser el mismo día).</p>
      <template #footer>
        <div class="flex items-center justify-end">
          <Button variant="secondary" to="/reportes">Volver a reportes</Button>
        </div>
      </template>
    </Card>

    <!-- Carga / error de cliente -->
    <div v-else>
      <div v-if="pendingClient" class="rounded-md border border-sand-300 bg-white p-4 text-brand-700">Verificando cliente…</div>
      <div v-else-if="clientNotFound" class="rounded-md border border-sand-300 bg-white p-4">
        <p class="text-brand-800">No existe información para el cliente con NIT <span class="font-mono">{{ nit }}</span>.</p>
        <div class="mt-3 flex items-center justify-end">
          <Button variant="secondary" to="/reportes">Regresar</Button>
        </div>
      </div>

      <!-- Cliente encontrado + acciones de reporte -->
      <Card v-else variant="elevated" title="Cliente encontrado" :subtitle="clientSubtitle">
        <div class="grid gap-4">
          <!-- Preview de payload (simplificado) -->
          <div class="grid gap-1 text-sm">
            <div><span class="text-brand-700">Rango:</span> <span class="font-medium text-brand-900">{{ prettyRange }}</span></div>
          </div>

          <div class="flex items-center justify-end gap-2">
            <Button variant="secondary" @click="recheck">Revalidar</Button>
            <Button variant="primary" :loading="sending" @click="sendReport">Generar reporte</Button>
          </div>
        </div>
      </Card>

      <!-- Previsualización del reporte -->
      <Card v-if="report" variant="elevated" title="Previsualización del reporte" :subtitle="reportSubtitle" class="mt-4">
        <div ref="pdfRef" class="grid gap-4">
          <!-- Resumen -->
          <div class="grid gap-2 rounded-md border border-sand-300 bg-white p-3 text-sm">
            <div class="grid grid-cols-2 gap-2">
              <div><span class="text-brand-700">Cliente:</span> <span class="font-medium text-brand-900">{{ report.clientName }} {{ report.clientLastName }}</span></div>
              <div class="text-right"><span class="text-brand-700">NIT:</span> <span class="font-mono">{{ report.clientNit }}</span></div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div>
                <div class="text-brand-700">Total gastado</div>
                <div class="font-semibold text-brand-900">{{ money(report.totalSpent) }}</div>
              </div>
              <div>
                <div class="text-brand-700">Pendiente de pago</div>
                <div class="font-semibold text-terra-500">{{ money(report.totalUnpaid) }}</div>
              </div>
              <div class="text-right">
                <div class="text-brand-700">Generado</div>
                <div class="font-medium text-brand-900">{{ dateTime(report.generatedAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Listados -->
          <div class="grid gap-6">
            <!-- Reservaciones -->
            <div>
              <h3 class="mb-2 text-sm font-semibold text-brand-800">Reservaciones ({{ (report.reservations || []).length }})</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-sand-300 text-left">
                      <th class="py-2">#</th>
                      <th class="py-2">Establecimiento</th>
                      <th class="py-2">Descripción</th>
                      <th class="py-2 text-right">Monto</th>
                      <th class="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(r, i) in (report.reservations || [])" :key="i" class="border-b border-sand-100">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2">{{ r.establishmentName }}</td>
                      <td class="py-2">{{ r.description }}</td>
                      <td class="py-2 text-right">{{ money(r.amountSpent) }}</td>
                      <td class="py-2">
                        <span v-if="r.paid" class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white">Pagada</span>
                        <span v-else class="rounded px-2 py-0.5 text-xs bg-gold-400 text-ink-900">Pendiente</span>
                      </td>
                    </tr>
                    <tr v-if="(report.reservations || []).length === 0">
                      <td colspan="5" class="py-3 text-center text-brand-700">Sin reservaciones en el rango.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Órdenes -->
            <div>
              <h3 class="mb-2 text-sm font-semibold text-brand-800">Órdenes ({{ (report.orders || []).length }})</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-sand-300 text-left">
                      <th class="py-2">#</th>
                      <th class="py-2">Establecimiento</th>
                      <th class="py-2">Descripción</th>
                      <th class="py-2 text-right">Monto</th>
                      <th class="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(o, i) in (report.orders || [])" :key="i" class="border-b border-sand-100">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td class="py-2">{{ o.establishmentName }}</td>
                      <td class="py-2">{{ o.description }}</td>
                      <td class="py-2 text-right">{{ money(o.amountSpent) }}</td>
                      <td class="py-2">
                        <span v-if="o.paid" class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white">Pagada</span>
                        <span v-else class="rounded px-2 py-0.5 text-xs bg-gold-400 text-ink-900">Pendiente</span>
                      </td>
                    </tr>
                    <tr v-if="(report.orders || []).length === 0">
                      <td colspan="5" class="py-3 text-center text-brand-700">Sin órdenes en el rango.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button variant="primary" size="sm" :loading="downloading" @click="downloadPdf">Descargar PDF</Button>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })

import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import { useToast } from '~/composables/useToast'

import { useClientService } from '~/services/client'
import { useReportService } from '~/services/report'
import type { CustomerActivityReport } from '~/services/report'

const toast = useToast()
const route = useRoute()

// Query params
const nit = computed(() => String(route.query.nit || ''))
const start = computed(() => String(route.query.start || ''))
const end = computed(() => String(route.query.end || ''))

// Validación de fechas y consistencia
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
function parseISO(d: string) { return ISO_DATE.test(d) ? new Date(d + 'T00:00:00') : null }

// Construcción de rangos completos de día para LocalDateTime del backend
function toStartOfDay(s: string) { return ISO_DATE.test(s) ? `${s}T00:00:00` : '' }
function toEndOfDay(s: string) { return ISO_DATE.test(s) ? `${s}T23:59:59` : '' }
const startDate = computed(() => parseISO(start.value))
const endDate = computed(() => parseISO(end.value))
const startAt = computed(() => toStartOfDay(start.value))
const endAt = computed(() => toEndOfDay(end.value))

const queryValid = computed(() => !!nit.value && !!startDate.value && !!endDate.value && startDate.value.getTime() <= endDate.value.getTime())
const queryErrorMsg = computed(() => {
  if (!nit.value) return 'Falta NIT.'
  if (!startDate.value || !endDate.value) return 'Formato de fecha inválido. Usa YYYY-MM-DD.'
  if (startDate.value.getTime() > endDate.value.getTime()) return 'La fecha de inicio no puede ser posterior a la de fin.'
  return ''
})

const fmtDate = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium' })
const fmtDateTime = new Intl.DateTimeFormat('es-GT', { dateStyle: 'short', timeStyle: 'short' })
const fmtMoney = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })

const prettyRange = computed(() => !startDate.value || !endDate.value ? '—' : `${fmtDate.format(startDate.value)} – ${fmtDate.format(endDate.value)}`)
function dateTime(v?: string | null) { if (!v) return '—'; try { return fmtDateTime.format(new Date(v)) } catch { return '—' } }
function money(v?: number | null) { return fmtMoney.format(Number(v || 0)) }

// Verificación de cliente por NIT
const clientSvc = useClientService?.()
const reportSvc = useReportService?.()
const pendingClient = ref(false)
const clientNotFound = ref(false)
const client = ref<any>(null)

async function checkClient() {
  if (!queryValid.value || !clientSvc) return
  pendingClient.value = true
  clientNotFound.value = false
  client.value = null
  try {
    const data = await clientSvc.getByNit(nit.value)
    client.value = data
  } catch (e:any) {
    clientNotFound.value = true
  } finally {
    pendingClient.value = false
  }
}

watch(queryValid, (ok) => { if (ok) checkClient() })
if (queryValid.value) await checkClient()

const clientSubtitle = computed(() => {
  const c = client.value
  if (!c) return `NIT ${nit.value}`
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
  return name ? `${name} — NIT ${nit.value}` : `NIT ${nit.value}`
})


// Reporte
const sending = ref(false)
const report = ref<CustomerActivityReport | null>(null)
const reportSubtitle = computed(() => report.value ? `Del ${fmtDate.format(new Date(report.value.consultedStartDate))} al ${fmtDate.format(new Date(report.value.consultedEndDate))}` : '')

// PDF export state and function
const pdfRef = ref<HTMLElement | null>(null)
const downloading = ref(false)

const pdfFileName = computed(() => {
  const n = (nit.value || 'cliente').replace(/\s+/g, '-')
  const s = (start.value || 'inicio')
  const e = (end.value || 'fin')
  return `actividad-${n}-${s}-a-${e}.pdf`
})

async function downloadPdf() {
  if (!pdfRef.value) return
  try {
    downloading.value = true
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 8,
      filename: pdfFileName.value,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } as any
    await html2pdf().set(opt).from(pdfRef.value).save()
  } catch (e) {
    toast.error('No se pudo generar el PDF')
  } finally {
    downloading.value = false
  }
}

async function sendReport() {
  if (!queryValid.value || clientNotFound.value || !reportSvc) return
  try {
    sending.value = true
    report.value = null
    const res = await reportSvc.getCustomerActivity(nit.value, startAt.value, endAt.value)
    report.value = res
    toast.success('Reporte generado')
  } catch (e:any) {
    toast.error('No se pudo generar el reporte')
  } finally {
    sending.value = false
  }
}

function recheck() { checkClient() }
</script>

<style scoped></style>