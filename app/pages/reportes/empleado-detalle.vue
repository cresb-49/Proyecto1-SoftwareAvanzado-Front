<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-6">
    <!-- Toolbar -->
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-brand-900">Detalle de Empleados por Establecimiento</h1>
      <Button size="sm" variant="secondary" to="/reportes">← Regresar</Button>
    </header>

    <!-- Filtros -->
    <Card variant="elevated" title="Parámetros">
      <form class="grid gap-4 sm:grid-cols-3" @submit.prevent="onFetch">
        <div class="sm:col-span-1">
          <Select
            v-model="type"
            :options="typeOptions"
            label="Tipo de establecimiento *"
            placeholder="Selecciona…"
            :error="errors.type"
            size="md"
            clearable
          />
        </div>
        <div class="sm:col-span-2">
          <InputText
            v-model="establishmentId"
            label="ID de establecimiento *"
            placeholder="UUID del hotel/restaurante"
            :error="errors.id"
            size="md"
          />
        </div>
        <div class="sm:col-span-3 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" @click="onClear">Limpiar</Button>
          <Button variant="primary" :loading="loading" type="submit">Consultar</Button>
        </div>
      </form>
    </Card>

    <!-- Estados -->
    <div v-if="loading" class="rounded-lg border border-sand-300 bg-white p-4 text-brand-700">Generando reporte…</div>
    <div v-else-if="errorMsg" class="rounded-lg border border-terra-500 bg-white p-4 text-terra-600">{{ errorMsg }}</div>

    <!-- Resultado -->
    <Card
      v-if="report"
      variant="elevated"
      title="Previsualización"
      :subtitle="reportSubtitle"
      class="mt-2"
    >
      <div ref="pdfRef" class="space-y-4">
        <!-- Encabezado -->
        <div class="grid gap-1 text-sm">
          <div class="text-brand-900">
            <span class="font-medium">Establecimiento:</span>
            {{ report?.establishmentName }} ({{ report?.establishmentType }})
          </div>
          <div class="text-brand-900">
            <span class="font-medium">ID:</span> {{ report?.establishmentId }}
          </div>
          <div class="text-brand-700">
            <span class="font-medium text-brand-800">Generado:</span> {{ formatDate(report?.generatedAt) }}
          </div>
          <div class="text-brand-700">
            <span class="font-medium text-brand-800">Total semanal en salarios:</span>
            {{ currency.format(report?.weeklySalary || 0) }}
          </div>
        </div>

        <!-- Tabla -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-sand-300 text-left">
                <th class="py-2 px-2">#</th>
                <th class="py-2 px-2">Empleado</th>
                <th class="py-2 px-2">Rol</th>
                <th class="py-2 px-2">Estado</th>
                <th class="py-2 px-2 text-right">Salario semanal</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(e, i) in report?.employeeDetails || []"
                :key="e.employeeId"
                class="border-b border-sand-100"
              >
                <td class="py-2 px-2 align-top">{{ i + 1 }}</td>
                <td class="py-2 px-2 align-top">
                  <div class="font-medium text-brand-900">{{ e.firstName }} {{ e.lastName }}</div>
                  <div class="text-xs text-brand-700">ID: {{ e.employeeId }}</div>
                </td>
                <td class="py-2 px-2 align-top">{{ e.roleName }}</td>
                <td class="py-2 px-2 align-top">
                  <span
                    :class="e.active ? 'bg-sage-500 text-white' : 'bg-terra-500 text-white'"
                    class="inline-flex items-center rounded px-2 py-0.5 text-xs"
                  >
                    {{ e.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="py-2 px-2 align-top text-right">
                  {{ currency.format(e.salary || 0) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <Button size="sm" variant="primary" :loading="downloading" @click="downloadPdf">Descargar PDF</Button>
        </div>
      </template>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })

import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import InputText from '~/components/ui/InputText.vue'
import Select from '~/components/ui/Select.vue'
import { useToast } from '~/composables/useToast'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import { useReportService } from '~/services/report'
import type { EmployeeDetailByEstablishmentReport } from '~/services/report'

const { redirectIfUnauthorized } = useUseRoles()
redirectIfUnauthorized([Roles.ADMIN, Roles.MANAGER], '/')

const toast = useToast()
const route = useRoute()
const router = useRouter()
const reportSvc = useReportService()

// Form state
const type = ref<'HOTEL' | 'RESTAURANT' | null>(null)
const establishmentId = ref<string>('')

// Prefill from query
watchEffect(() => {
  const qt = String(route.query.type || '').toUpperCase()
  type.value = qt === 'HOTEL' || qt === 'RESTAURANT' ? (qt as any) : type.value
  establishmentId.value = String(route.query.id || establishmentId.value || '')
})

// Options / errors
const typeOptions = [
  { value: 'HOTEL', label: 'HOTEL' },
  { value: 'RESTAURANT', label: 'RESTAURANT' }
]
const errors = ref<{ type: string; id: string }>({ type: '', id: '' })

// Result
const report = ref<EmployeeDetailByEstablishmentReport | null>(null)
const loading = ref(false)
const errorMsg = ref('')

// Helpers
const currency = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })
const dt = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
function formatDate(v?: string) {
  if (!v) return '—'
  try { return dt.format(new Date(v)) } catch { return '—' }
}
const reportSubtitle = computed(() => {
  if (!report.value) return ''
  return `Empleados listados: ${report.value.employeeDetails?.length || 0}`
})

// Actions
function validate() {
  errors.value.type = type.value ? '' : 'Requerido'
  errors.value.id = establishmentId.value?.trim() ? '' : 'Requerido'
  return !errors.value.type && !errors.value.id
}

async function onFetch() {
  if (!validate()) return
  try {
    loading.value = true
    errorMsg.value = ''
    // Persist parameters in URL
    router.replace({ query: { type: type.value!, id: establishmentId.value.trim() } })
    report.value = await reportSvc.getEmployeeDetailByEstablishment(
      establishmentId.value.trim(),
      type.value as 'HOTEL' | 'RESTAURANT'
    )
    if (!report.value) {
      errorMsg.value = 'No se encontraron datos para los parámetros indicados.'
    }
  } catch (e: any) {
    errorMsg.value = e?.data?.message || 'No se pudo generar el reporte.'
    toast.error('Error', { description: errorMsg.value })
  } finally {
    loading.value = false
  }
}

function onClear() {
  type.value = null
  establishmentId.value = ''
  report.value = null
  errorMsg.value = ''
  router.replace({ query: {} })
}

// Auto-consulta si vienen parámetros válidos
watchEffect(() => {
  const qt = String(route.query.type || '').toUpperCase()
  const qid = String(route.query.id || '')
  if ((qt === 'HOTEL' || qt === 'RESTAURANT') && qid) {
    if (!loading.value && !report.value) {
      // evitar loop infinito
      onFetch()
    }
  }
})

// PDF export
const pdfRef = ref<HTMLElement | null>(null)
const downloading = ref(false)
const pdfName = computed(() => {
  const t = type.value || 'ESTABLECIMIENTO'
  const id = establishmentId.value || 'ID'
  return `reporte-empleados-${t.toLowerCase()}-${id}.pdf`
})
async function downloadPdf() {
  if (!pdfRef.value) return
  try {
    downloading.value = true
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: 8,
      filename: pdfName.value,
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
</script>

<style scoped>
/* Opcional: estilos mínimos de tabla/imprimir si se necesita */
</style>