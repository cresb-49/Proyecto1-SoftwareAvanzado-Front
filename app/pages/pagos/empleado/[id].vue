<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-brand-800">Pagos del empleado</h1>
        <p class="text-sm text-brand-700">Empleado ID: <span class="font-mono">{{ employeeId }}</span></p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="secondary" size="sm" @click="goBack">← Regresar</Button>
      </div>
    </header>

    <!-- Tabla de pagos -->
    <Card variant="elevated" title="Historial de pagos" subtitle="Pagos semanales registrados">
      <div v-if="pending" class="text-brand-700">Cargando pagos…</div>
      <div v-else-if="error" class="text-terra-500">No se pudieron cargar los pagos.</div>
      <div v-else>
        <div v-if="(payments || []).length === 0" class="text-sm text-brand-700">No hay pagos registrados para este empleado.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-sand-300 text-left">
                <th class="py-2 px-2">#</th>
                <th class="py-2 px-2">Semana (inicio)</th>
                <th class="py-2 px-2 text-right">Monto</th>
                <th class="py-2 px-2">Estado</th>
                <th class="py-2 px-2">Pagado el</th>
                <th class="py-2 px-2">Creado</th>
                <th class="py-2 px-2">Actualizado</th>
                <th class="py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in payments" :key="p.id" class="border-b border-sand-100">
                <td class="py-2 px-2 align-top">{{ i + 1 }}</td>
                <td class="py-2 px-2 align-top">{{ formatYMD(p.weekStart) }}</td>
                <td class="py-2 px-2 align-top text-right">{{ formatCurrency(p.amount) }}</td>
                <td class="py-2 px-2 align-top">
                  <span v-if="p.paid" class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white">Pagado</span>
                  <span v-else class="rounded px-2 py-0.5 text-xs bg-gold-500/20 text-brand-900 border border-gold-500/40">Pendiente</span>
                </td>
                <td class="py-2 px-2 align-top">{{ formatDateTime(p.paidAt) }}</td>
                <td class="py-2 px-2 align-top">{{ formatDateTime(p.createdAt) }}</td>
                <td class="py-2 px-2 align-top">{{ formatDateTime(p.updatedAt) }}</td>
                <td class="py-2 px-2 align-top">
                  <div class="flex flex-wrap items-center gap-2">
                    <Button
                      v-if="!p.paid"
                      size="sm"
                      variant="primary"
                      :loading="payingId === p.id"
                      @click="onPayById(p.id)"
                    >Marcar pagado</Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import { useWeeklyPaymentService } from '~/services/weekly-payments'
import type { WeeklyPayment } from '~/services/weekly-payments'
import { useToast } from '~/composables/useToast'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const svc = useWeeklyPaymentService()

const employeeId = computed(() => String(route.params.id || ''))

// Cargar pagos por empleado
const { data, pending, error, refresh } = await useAsyncData(
  () => `weekly-payments:employee:${employeeId.value}`,
  () => employeeId.value ? svc.getPaymentsByEmployee(employeeId.value) : Promise.resolve([] as WeeklyPayment[]),
  { watch: [employeeId] }
)

const payments = computed<WeeklyPayment[]>(() => (data.value as any) || [])

// Acciones
const payingId = ref<string | null>(null)
async function onPayById(id: string) {
  if (!id) return
  try {
    payingId.value = id
    await svc.payPaymentById(id)
    toast.success('Pago marcado como pagado')
    await refresh()
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo marcar como pagado'
    toast.error('Error', { description: msg })
  } finally {
    payingId.value = null
  }
}

// Utilidades de formato
const dt = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
const dOnly = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium' })
const currency = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })

function formatDateTime(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '—' : dt.format(d)
}

function formatYMD(v?: string | null) {
  if (!v) return '—'
  // weekStart puede venir como 'YYYY-MM-DD' o LocalDateTime
  const d = v.length > 10 ? new Date(v) : new Date(`${v}T00:00:00`)
  return isNaN(d.getTime()) ? v : dOnly.format(d)
}

function formatCurrency(n: number | string | null | undefined) {
  return currency.format(Number(n || 0))
}

function goBack() {
  router.back()
}
</script>

<style scoped></style>