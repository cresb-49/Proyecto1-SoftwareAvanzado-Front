<template>
  <div class="mx-auto max-w-xl px-4 py-6 space-y-6">
    <!-- Título -->
    <header>
      <h1 class="text-2xl font-semibold text-brand-800">Crear pagos semanales</h1>
      <p class="text-sm text-brand-700">Selecciona un <strong>lunes</strong> y genera los pagos para todos los empleados.</p>
    </header>

    <!-- Formulario -->
    <Card variant="elevated" title="Generar por semana" subtitle="La fecha debe caer en lunes">
      <form class="grid gap-4" @submit.prevent="onSubmit">
        <InputDate
          v-model="weekStart"
          label="Semana (lunes) *"
          placeholder="YYYY-MM-DD"
          :error="errors.weekStart"
          size="md"
        />
        <p class="-mt-2 text-xs text-brand-700">* Debe ser lunes. Puedes usar el botón para autocompletar el próximo lunes.</p>

        <div class="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" @click="setNextMonday">Usar próximo lunes</Button>
          <Button type="submit" variant="primary" :loading="loading">Generar pagos</Button>
        </div>
      </form>
    </Card>

    <!-- Resultado -->
    <Card v-if="createdCount !== null" variant="soft">
      <template #title>Resultado</template>
      <p class="text-brand-800">Se generaron <strong>{{ createdCount }}</strong> pago(s) para la semana que inicia el <strong>{{ weekStart }}</strong>.</p>
      <p v-if="createdCount === 0" class="mt-1 text-sm text-brand-700">No se creó ningún pago. Es posible que ya existan para esa semana.</p>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import InputDate from '~/components/ui/InputDate.vue'
import { useToast } from '~/composables/useToast'
import { useWeeklyPaymentService } from '~/services/weekly-payments'

const toast = useToast()
const svc = useWeeklyPaymentService()

// Estado del formulario
const weekStart = ref<string>('')
const loading = ref(false)
const createdCount = ref<number | null>(null)

const errors = reactive<{ weekStart: string }>({ weekStart: '' })

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalDateTimeStartOfDay(dateStr: string) {
  // Formato requerido por LocalDateTime: yyyy-MM-dd'T'HH:mm:ss
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
  const delta = (1 - day + 7) % 7 // 0 si hoy es lunes, si no, días hasta el próximo lunes
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
  createdCount.value = null
  if (!validate()) return
  try {
    loading.value = true
    const result = await svc.createPaymentForAllEmployees(toLocalDateTimeStartOfDay(weekStart.value))
    createdCount.value = Array.isArray(result) ? result.length : 0
    toast.success('Pagos generados')
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudieron generar los pagos'
    toast.error('Error', { description: msg })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>