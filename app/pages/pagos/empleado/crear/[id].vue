<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-6">
    <!-- Título -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-brand-800">Crear pago semanal (empleado)</h1>
        <p class="text-sm text-brand-700">Selecciona un <strong>lunes</strong> para generar el pago del empleado indicado.</p>
        <p class="mt-1 text-xs text-brand-700">Empleado ID: <span class="font-mono">{{ employeeId }}</span></p>
      </div>
      <Button variant="secondary" size="sm" @click="goBack">← Regresar</Button>
    </header>

    <!-- Estado de carga / error del empleado -->
    <div v-if="pendingEmp" class="rounded-md border border-sand-300 bg-white p-4 text-brand-700">Cargando empleado…</div>
    <div v-else-if="errorEmp" class="rounded-md border border-terra-500 bg-white p-4 text-terra-600">No se pudo cargar la información del empleado.</div>

    <!-- Resumen del empleado -->
    <Card v-else variant="elevated" title="Empleado" subtitle="Datos para confirmar antes de generar el pago">
      <div class="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <div class="text-brand-700">Usuario</div>
          <div class="font-medium text-brand-900">{{ userLabel || '—' }}</div>
        </div>
        <div>
          <div class="text-brand-700">Nombre</div>
          <div class="font-medium text-brand-900">{{ fullName }}</div>
        </div>
        <div>
          <div class="text-brand-700">Teléfono</div>
          <div class="font-medium text-brand-900">{{ userPhone }}</div>
        </div>
        <div>
          <div class="text-brand-700">Rol</div>
          <div class="font-medium text-brand-900">{{ userRole }}</div>
        </div>
        <div>
          <div class="text-brand-700">Hotel</div>
          <div class="font-medium text-brand-900">{{ hotelName }}</div>
        </div>
        <div>
          <div class="text-brand-700">Restaurante</div>
          <div class="font-medium text-brand-900">{{ restaurantName }}</div>
        </div>
        <div class="sm:col-span-2">
          <div class="text-brand-700">Salario semanal</div>
          <div class="font-semibold text-brand-900">{{ salaryDisplay }}</div>
        </div>
      </div>
    </Card>

    <!-- Formulario de generación de pago -->
    <Card variant="elevated" title="Generar pago" subtitle="La fecha debe caer en lunes">
      <form class="grid gap-4" @submit.prevent="onSubmit">
        <InputDate
          v-model="weekStart"
          label="Semana (lunes) *"
          placeholder="YYYY-MM-DD"
          :error="errors.weekStart"
          size="md"
        />
        <p class="-mt-2 text-xs text-brand-700">* Debe ser lunes. Puedes autocompletar el próximo lunes.</p>

        <div class="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" @click="setNextMonday">Usar próximo lunes</Button>
          <Button type="submit" variant="primary" :loading="loading">Generar pago</Button>
        </div>
      </form>
    </Card>

    <!-- Resultado -->
    <Card v-if="created" variant="soft">
      <template #title>Resultado</template>
      <div class="space-y-1 text-brand-800 text-sm">
        <p>Pago creado con ID: <span class="font-mono">{{ created?.id }}</span></p>
        <p>Semana (inicio): <strong>{{ formatYMD(created?.weekStart) }}</strong></p>
        <p>Monto: <strong>{{ formatCurrency(created?.amount) }}</strong></p>
        <p>Estado: <span v-if="created?.paid" class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white">Pagado</span>
          <span v-else class="rounded px-2 py-0.5 text-xs bg-gold-500/20 text-brand-900 border border-gold-500/40">Pendiente</span>
        </p>
      </div>
      <template #footer>
        <div class="flex items-center justify-end">
          <Button size="sm" variant="secondary" :to="`/pagos/empleado/${employeeId}`">Ver historial</Button>
        </div>
      </template>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import InputDate from '~/components/ui/InputDate.vue'
import { useToast } from '~/composables/useToast'
import { useWeeklyPaymentService } from '~/services/weekly-payments'
import type { WeeklyPayment } from '~/services/weekly-payments'
import { useEmployeeService } from '~/services/employee'
import { useUserService } from '~/services/users'
import { useHotelService } from '~/services/hotels'
import { useRestaurantService } from '~/services/restaurants'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const router = useRouter()
const employeeId = computed(() => String(route.params.id || ''))

const toast = useToast()
const svc = useWeeklyPaymentService()
const empSvc = useEmployeeService()
const userSvc = useUserService()
const hotelSvc = useHotelService()
const restaurantSvc = useRestaurantService()

// Helpers de formato (defínelos antes de usarlos en computeds)
const dOnly = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium' })
const currencyFmt = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })
function formatYMD(v?: string | null) {
  if (!v) return '—'
  const d = v.length > 10 ? new Date(v) : new Date(`${v}T00:00:00`)
  return isNaN(d.getTime()) ? v : dOnly.format(d)
}
function formatCurrency(n: number | string | null | undefined) {
  return currencyFmt.format(Number(n || 0))
}

// Cargar empleado y sus entidades relacionadas
const { data: empData, pending: pendingEmp, error: errorEmp } = await useAsyncData(
  () => `employee:${employeeId.value}`,
  () => employeeId.value ? empSvc.getById(employeeId.value) : Promise.resolve(null),
  { watch: [employeeId] }
)

const { data: userData } = await useAsyncData(
  () => `employee:user:${(empData.value as any)?.userId || ''}`,
  () => (empData.value as any)?.userId ? userSvc.getById(String((empData.value as any).userId)) : Promise.resolve(null),
  { watch: [empData] }
)

const { data: hotelData } = await useAsyncData(
  () => `employee:hotel:${(empData.value as any)?.hotelId || ''}`,
  () => (empData.value as any)?.hotelId ? hotelSvc.getById(String((empData.value as any).hotelId)) : Promise.resolve(null),
  { watch: [empData] }
)

const { data: restaurantData } = await useAsyncData(
  () => `employee:restaurant:${(empData.value as any)?.restaurantId || ''}`,
  () => (empData.value as any)?.restaurantId ? restaurantSvc.getById(String((empData.value as any).restaurantId)) : Promise.resolve(null),
  { watch: [empData] }
)

// Labels calculados
const userLabel = computed(() => {
  const u: any = userData.value
  if (!u) return ''
  return `${u.username || ''}`.trim()
})
const userRole = computed(() => (userData.value as any)?.roleName || '—')
const fullName = computed(() => {
  const u: any = userData.value || {}
  const fn = (u.firstNames || '').trim()
  const ln = (u.lastNames || '').trim()
  return (fn || ln) ? `${fn} ${ln}`.trim() : '—'
})
const userPhone = computed(() => (userData.value as any)?.phone || '—')
const hotelName = computed(() => (hotelData.value as any)?.name || '—')
const restaurantName = computed(() => (restaurantData.value as any)?.name || '—')
const salaryDisplay = computed(() => formatCurrency((empData.value as any)?.semanalSalary || 0))

// Form state
const weekStart = ref<string>('')
const loading = ref(false)
const created = ref<WeeklyPayment | null>(null)

const errors = reactive<{ weekStart: string }>({ weekStart: '' })

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalDateTimeStartOfDay(dateStr: string) {
  // LocalDateTime: yyyy-MM-dd'T'HH:mm:ss
  return `${dateStr}T00:00:00`
}

function isMonday(dateStr: string) {
  if (!dateStr) return false
  const d = new Date(`${dateStr}T00:00:00`)
  return d.getDay() === 1 // 1 = lunes
}

function setNextMonday() {
  const today = new Date()
  const day = today.getDay() // 0=dom,1=lun,...
  const delta = (1 - day + 7) % 7 // 0 si hoy es lunes; si no, días hasta próximo lunes
  const next = new Date(today)
  next.setDate(today.getDate() + delta)
  weekStart.value = toYMD(next)
}

function validate() {
  errors.weekStart = ''
  if (!weekStart.value) {
    errors.weekStart = 'Selecciona una fecha'
  } else if (!isMonday(weekStart.value)) {
    errors.weekStart = 'La fecha debe ser un lunes'
  }
  return !errors.weekStart
}

async function onSubmit() {
  created.value = null
  if (!validate()) return
  try {
    loading.value = true
    const payloadDate = toLocalDateTimeStartOfDay(weekStart.value)
    const res = await svc.createPaymentEmployee(payloadDate, employeeId.value)
    created.value = res
    toast.success('Pago generado')
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo generar el pago'
    toast.error('Error', { description: msg })
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<style scoped></style>