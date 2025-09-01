<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/empleados">← Regresar</Button>
      <div class="text-sm text-brand-700" v-if="userLabel">
        Usuario actual: <span class="font-medium text-brand-900">{{ userLabel }}</span>
      </div>
    </div>

    <!-- Estados -->
    <div v-if="pending" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">Cargando empleado…</div>
    <div v-else-if="error" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">Ocurrió un error al cargar el empleado.</div>

    <!-- Formulario -->
    <Card v-else variant="elevated" title="Editar empleado" subtitle="Actualiza datos del usuario, asignaciones y salario">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Datos de usuario -->
        <div>
          <InputText
            v-model="form.username"
            label="Usuario *"
            placeholder="usuario"
            :error="errors.username"
            size="md"
          />
        </div>
        <div>
          <InputText
            v-model="form.email"
            type="email"
            label="Correo electrónico"
            placeholder="tucorreo@ejemplo.com"
            :error="errors.email"
            size="md"
          />
        </div>

        <div>
          <InputText
            v-model="form.firstNames"
            label="Nombres *"
            placeholder="María José"
            :error="errors.firstNames"
            size="md"
          />
        </div>
        <div>
          <InputText
            v-model="form.lastNames"
            label="Apellidos *"
            placeholder="Pérez López"
            :error="errors.lastNames"
            size="md"
          />
        </div>

        <div class="sm:col-span-2">
          <InputText
            v-model="form.phone"
            label="Teléfono *"
            placeholder="8 dígitos"
            :error="errors.phone"
            size="md"
          />
        </div>

        <div class="sm:col-span-2">
          <Select
            v-model="form.nameRole"
            :options="roleOptions"
            label="Rol *"
            placeholder="Selecciona un rol…"
            :error="errors.nameRole"
            size="md"
            clearable
          />
        </div>

        <!-- Asignaciones -->
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
definePageMeta({
  middleware: ["auth"],
});
import { reactive, ref, computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Select from '~/components/ui/Select.vue'
import InputText from '~/components/ui/InputText.vue'
import InputCurrency from '~/components/ui/InputCurrency.vue'
import { useToast } from '~/composables/useToast'
import { useEmployeeService } from '~/services/employee'
import { useHotelService } from '~/services/hotels'
import { useRestaurantService } from '~/services/restaurants'
import { useUserService } from '~/services/users'
import { Roles } from '#imports'

const { redirectIfUnauthorized } = useUseRoles()
const permitedRoles = [Roles.ADMIN]
redirectIfUnauthorized(permitedRoles, '/')

const route = useRoute()
const id = String(route.params.id)
const toast = useToast()

const employeeSvc = useEmployeeService()
const hotelSvc = useHotelService()
const restaurantSvc = useRestaurantService()
const userSvc = useUserService()

// Cargar empleado
const { data: empData, pending, error } = await useAsyncData(
  () => `employee:${id}`,
  () => employeeSvc.getById(id),
  { server: true }
)

// Usuario para mostrar y editar
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

const roleOptions = computed(() => [
  { value: Roles.ADMIN, label: 'ADMIN' },
  { value: Roles.MANAGER, label: 'MANAGER' },
  { value: Roles.RESTAURANT_MANAGER, label: 'RESTAURANT_MANAGER' },
  { value: Roles.HOTEL_MANAGER, label: 'HOTEL_MANAGER' },
  { value: Roles.RESTAURANT_EMPLOYEE, label: 'RESTAURANT_EMPLOYEE' },
  { value: Roles.HOTEL_EMPLOYEE, label: 'HOTEL_EMPLOYEE' },
])

// Formulario y original
const form = reactive<{
  username: string
  email: string
  firstNames: string
  lastNames: string
  nameRole: string | null
  phone: string
  hotelId: string | null
  restaurantId: string | null
  semanalSalary: number | null
}>({
  username: '',
  email: '',
  firstNames: '',
  lastNames: '',
  nameRole: null,
  phone: '',
  hotelId: null,
  restaurantId: null,
  semanalSalary: null,
})

const original = ref<typeof form | null>(null)

watchEffect(() => {
  const e: any = empData.value
  const u: any = userData.value
  if (!e || !u || original.value) return
  form.username = u.username || ''
  form.email = u.email || ''
  form.firstNames = u.firstNames || ''
  form.lastNames = u.lastNames || ''
  form.nameRole = u.roleName || null
  form.phone = u.phone || ''
  form.hotelId = e.hotelId || null
  form.restaurantId = e.restaurantId || null
  form.semanalSalary = Number(e.semanalSalary)
  original.value = { ...form }
})

const errors = reactive<Record<string, string>>({
  username: '', email: '', firstNames: '', lastNames: '', nameRole: '', phone: '', hotelId: '', restaurantId: '', semanalSalary: ''
})
const saving = ref(false)

function isEmailValid(email: string) {
  if (!email) return true // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validate() {
  // username 3-20
  const u = form.username.trim()
  errors.username = !u ? 'Requerido' : u.length < 3 ? 'Mínimo 3' : u.length > 20 ? 'Máximo 20' : ''

  // email (opcional, pero válido si viene)
  errors.email = isEmailValid(form.email.trim()) ? '' : 'Correo inválido'

  // nombres 3-50
  const fn = form.firstNames.trim()
  errors.firstNames = !fn ? 'Requerido' : fn.length < 3 ? 'Mínimo 3' : fn.length > 50 ? 'Máximo 50' : ''

  // apellidos 3-50
  const ln = form.lastNames.trim()
  errors.lastNames = !ln ? 'Requerido' : ln.length < 3 ? 'Mínimo 3' : ln.length > 50 ? 'Máximo 50' : ''

  // rol requerido
  errors.nameRole = form.nameRole ? '' : 'Requerido'

  // teléfono 8 dígitos
  const ph = form.phone.trim()
  errors.phone = !ph ? 'Requerido' : /^\d{8}$/.test(ph) ? '' : 'Debe tener 8 dígitos'

  // salario > 0 con 2 decimales
  const s = Number(form.semanalSalary)
  const validNumber = Number.isFinite(s) && s > 0
  const twoDecimals = /^\d{1,10}(\.\d{1,2})?$/.test(String(form.semanalSalary ?? ''))
  errors.semanalSalary = validNumber && twoDecimals ? '' : 'Debe ser > 0.00 y con hasta 2 decimales'

  // (Opcional) Validar que hotelId o restaurantId no sean ambos null.
  errors.hotelId = ''
  errors.restaurantId = ''

  return Object.values(errors).every(v => !v)
}

function onRestore() {
  if (!original.value) return
  Object.assign(form, original.value)
}

async function onSubmit() {
  if (!validate()) return
  try {
    saving.value = true
    await employeeSvc.update(id, {
      id,
      username: form.username.trim(),
      email: form.email.trim() || undefined,
      firstNames: form.firstNames.trim(),
      lastNames: form.lastNames.trim(),
      nameRole: String(form.nameRole),
      phone: form.phone.trim(),
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
