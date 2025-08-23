<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/empleados">← Regresar</Button>
      <div class="text-sm text-brand-700" v-if="userLabel">
        Usuario: <span class="font-medium text-brand-900">{{ userLabel }}</span>
      </div>
    </div>

    <!-- Estados -->
    <div v-if="pending" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">Cargando empleado…</div>
    <div v-else-if="error" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">Ocurrió un error al cargar el empleado.</div>

    <!-- Formulario -->
    <Card v-else variant="elevated" title="Editar empleado" subtitle="Actualiza asignaciones y salario semanal">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Hotel -->
        <div class="sm:col-span-1">
          <div class="flex items-end gap-2">
            <div class="grow">
              <Select
                v-model="form.hotelId"
                :options="hotelOptions"
                label="Hotel"
                placeholder="Selecciona un hotel…"
                :error="errors.hotelId"
                size="md"
                clearable
              />
            </div>
            <Button size="sm" variant="secondary" @click="form.hotelId = null" :disabled="!form.hotelId">Limpiar</Button>
          </div>
        </div>

        <!-- Restaurante -->
        <div class="sm:col-span-1">
          <div class="flex items-end gap-2">
            <div class="grow">
              <Select
                v-model="form.restaurantId"
                :options="restaurantOptions"
                label="Restaurante"
                placeholder="Selecciona un restaurante…"
                :error="errors.restaurantId"
                size="md"
                clearable
              />
            </div>
            <Button size="sm" variant="secondary" @click="form.restaurantId = null" :disabled="!form.restaurantId">Limpiar</Button>
          </div>
        </div>

        <!-- Aviso reglas backend -->
        <div class="sm:col-span-2">
          <p class="text-xs text-brand-700">
            * Hotel y Restaurante pueden ser <em>null</em>, pero <strong>no ambos</strong>. Esta regla se valida en el backend.
          </p>
        </div>

        <!-- Salario semanal -->
        <div class="sm:col-span-2">
          <InputCurrency
            v-model="form.semanalSalary"
            label="Salario semanal *"
            currency="GTQ"
            locale="es-GT"
            :error="errors.semanalSalary"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Debe ser &gt; 0.00 y con hasta 2 decimales.</p>
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 flex items-center justify-end gap-2">
          <Button variant="secondary" @click.prevent="onRestore" :disabled="saving">Restaurar</Button>
          <Button variant="secondary" to="/empleados" :disabled="saving">Cancelar</Button>
          <Button variant="primary" :loading="saving" type="submit">Guardar cambios</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Select from '~/components/ui/Select.vue'
import InputCurrency from '~/components/ui/InputCurrency.vue'
import { useToast } from '~/composables/useToast'
import { useEmployeeService } from '~/services/employee'
import { useHotelService } from '~/services/hotels'
import { useRestaurantService } from '~/services/restaurants'
import { useUserService } from '~/services/users'

const route = useRoute()
const id = String(route.params.id)
const toast = useToast()

const employeeSvc = useEmployeeService()
const hotelSvc = useHotelService()
const restaurantSvc = useRestaurantService()
const userSvc = useUserService()

// Cargar empleado
const { data: empData, pending, error, refresh } = await useAsyncData(
  () => `employee:${id}`,
  () => employeeSvc.getById(id),
  { server: true }
)

// Usuario para mostrar label
const { data: userData } = await useAsyncData(
  () => `employee:user:${empData.value?.userId || '-'}`,
  () => empData.value?.userId ? userSvc.getById(empData.value.userId) : Promise.resolve(null),
  { watch: [empData] }
)
const userLabel = computed(() => {
  const u: any = userData.value
  if (!u) return ''
  return `${u.username} — ${u.roleName || ''}`.trim()
})

// Catálogos
const { data: hotelsData } = await useAsyncData(
  'employee-edit:hotels',
  () => hotelSvc.getAll?.(),
  { server: true }
)
const hotelOptions = computed(() => {
  const val = hotelsData.value as any
  const items = Array.isArray(val) ? val : (val?.items || [])
  return items.map((h:any) => ({ label: h.name, value: h.id }))
})

const { data: restaurantsData } = await useAsyncData(
  'employee-edit:restaurants',
  () => restaurantSvc.getAll?.(),
  { server: true }
)
const restaurantOptions = computed(() => {
  const val = restaurantsData.value as any
  const items = Array.isArray(val) ? val : (val?.items || [])
  return items.map((r:any) => ({ label: r.name, value: r.id }))
})

// Formulario y original
const form = reactive<{ hotelId: string | null, restaurantId: string | null, semanalSalary: number | null }>({
  hotelId: null,
  restaurantId: null,
  semanalSalary: null,
})
const original = ref<{ hotelId: string | null, restaurantId: string | null, semanalSalary: number | null } | null>(null)

watchEffect(() => {
  const e: any = empData.value
  if (!e) return
  form.hotelId = e.hotelId || null
  form.restaurantId = e.restaurantId || null
  form.semanalSalary = Number(e.semanalSalary)
  original.value = { hotelId: form.hotelId, restaurantId: form.restaurantId, semanalSalary: form.semanalSalary }
})

const errors = reactive<Record<string, string>>({ hotelId: '', restaurantId: '', semanalSalary: '' })
const saving = ref(false)

function validate() {
  // salario > 0 con 2 decimales
  const s = Number(form.semanalSalary)
  const validNumber = Number.isFinite(s) && s > 0
  // hasta 2 decimales
  const twoDecimals = /^\d{1,10}(\.\d{1,2})?$/.test(String(form.semanalSalary ?? ''))
  errors.semanalSalary = validNumber && twoDecimals ? '' : 'Debe ser > 0.00 y con hasta 2 decimales'

  // Nota: backend valida que hotelId y restaurantId no sean ambos null
  errors.hotelId = ''
  errors.restaurantId = ''

  return Object.values(errors).every(v => !v)
}

function onRestore() {
  if (!original.value) return
  form.hotelId = original.value.hotelId
  form.restaurantId = original.value.restaurantId
  form.semanalSalary = original.value.semanalSalary
}

async function onSubmit() {
  if (!validate()) return
  try {
    saving.value = true
    await employeeSvc.update(id, {
      id,
      hotelId: form.hotelId,
      restaurantId: form.restaurantId,
      semanalSalary: Number(form.semanalSalary)
    })
    toast.success('Empleado actualizado')
    navigateTo('/empleados')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped></style>
