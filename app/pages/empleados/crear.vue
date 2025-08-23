<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/empleados">← Regresar</Button>
    </div>

    <Card variant="elevated" title="Crear empleado" subtitle="Crea el usuario y asigna hotel/restaurante">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Usuario / Password -->
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
            v-model="form.password"
            type="password"
            label="Contraseña *"
            placeholder="••••••"
            :error="errors.password"
            size="md"
          />
        </div>

        <!-- Email -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.email"
            type="email"
            label="Correo electrónico"
            placeholder="tucorreo@ejemplo.com"
            :error="errors.email"
            size="md"
          />
        </div>

        <!-- Nombres / Apellidos -->
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

        <!-- Teléfono -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.phone"
            label="Teléfono *"
            placeholder="8 dígitos"
            :error="errors.phone"
            size="md"
          />
        </div>

        <!-- Rol -->
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
          <p v-if="salaryLocked" class="mt-1 text-xs text-brand-700">
            Para roles <strong>ADMIN</strong> o <strong>MANAGER</strong> el salario se fija automáticamente en <strong>1</strong>.
          </p>
        </div>

        <!-- Hotel / Restaurante -->
        <div>
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
            <Button
              size="sm"
              variant="secondary"
              @click="form.hotelId = null"
              :disabled="!form.hotelId"
            >
              Limpiar
            </Button>
          </div>
        </div>
        <div>
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
            <Button
              size="sm"
              variant="secondary"
              @click="form.restaurantId = null"
              :disabled="!form.restaurantId"
            >
              Limpiar
            </Button>
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
            :disabled="salaryLocked"
          />
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 flex items-center justify-end gap-2">
          <Button variant="secondary" to="/empleados">Cancelar</Button>
          <Button variant="primary" :loading="saving" type="submit">Guardar</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, computed, watch } from 'vue'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Select from '~/components/ui/Select.vue'
import InputText from '~/components/ui/InputText.vue'
import InputCurrency from '~/components/ui/InputCurrency.vue'
import { useToast } from '~/composables/useToast'
import { useHotelService } from '~/services/hotels'
import { useRestaurantService } from '~/services/restaurants'
import { useUserService } from '~/services/users'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'

// Protegido: solo ADMIN / MANAGER
const { hasAnyRole, redirectIfUnauthorized } = useUseRoles()
const permitedRoles = [Roles.ADMIN, Roles.MANAGER]
redirectIfUnauthorized(permitedRoles, '/')

const toast = useToast()
const hotelSvc = useHotelService()
const restaurantSvc = useRestaurantService()
const userSvc = useUserService()

// Form state
const form = reactive<{
  username: string,
  password: string,
  email: string,
  firstNames: string,
  lastNames: string,
  nameRole: string | null,
  phone: string,
  hotelId: string | null,
  restaurantId: string | null,
  semanalSalary: number | null,
}>({
  username: '',
  password: '',
  email: '',
  firstNames: '',
  lastNames: '',
  nameRole: null,
  phone: '',
  hotelId: null,
  restaurantId: null,
  semanalSalary: null,
})

const errors = reactive<Record<string, string>>({
  username: '', password: '', email: '', firstNames: '', lastNames: '', nameRole: '', phone: '', hotelId: '', restaurantId: '', semanalSalary: ''
})
const saving = ref(false)

// Catálogos
const { data: hotelsData } = await useAsyncData(
  'empleados:hotels',
  () => hotelSvc.getAll?.(),
  { server: true }
)
const hotelOptions = computed(() => {
  const val = hotelsData.value as any
  const items = Array.isArray(val) ? val : (val?.items || [])
  return items.map((h:any) => ({ label: h.name, value: h.id }))
})

const { data: restaurantsData } = await useAsyncData(
  'empleados:restaurants',
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

// Salario por defecto según rol
const salaryLocked = computed(() => form.nameRole === Roles.ADMIN || form.nameRole === Roles.MANAGER)
watch(() => form.nameRole, (role) => {
  if (role === Roles.ADMIN || role === Roles.MANAGER) {
    form.semanalSalary = 1
  } else if (form.semanalSalary === 1 || form.semanalSalary === null) {
    form.semanalSalary = null
  }
})

function isEmailValid(email: string) {
  if (!email) return true // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validate() {
  const u = form.username.trim()
  errors.username = !u ? 'Requerido' : u.length < 3 ? 'Mínimo 3' : u.length > 20 ? 'Máximo 20' : ''

  const p = form.password
  errors.password = !p ? 'Requerido' : p.length < 6 ? 'Mínimo 6' : p.length > 50 ? 'Máximo 50' : ''

  errors.email = isEmailValid(form.email.trim()) ? '' : 'Correo inválido'

  const fn = form.firstNames.trim()
  errors.firstNames = !fn ? 'Requerido' : fn.length < 3 ? 'Mínimo 3' : fn.length > 50 ? 'Máximo 50' : ''

  const ln = form.lastNames.trim()
  errors.lastNames = !ln ? 'Requerido' : ln.length < 3 ? 'Mínimo 3' : ln.length > 50 ? 'Máximo 50' : ''

  errors.nameRole = form.nameRole ? '' : 'Requerido'

  const ph = form.phone.trim()
  errors.phone = !ph ? 'Requerido' : /^\d{8}$/.test(ph) ? '' : 'Debe tener 8 dígitos'

  errors.hotelId = ''
  errors.restaurantId = ''

  if (salaryLocked.value) {
    errors.semanalSalary = ''
  } else {
    const s = Number(form.semanalSalary)
    errors.semanalSalary = Number.isFinite(s) && s > 0 ? '' : 'Debe ser mayor a 0'
  }

  return Object.values(errors).every(v => !v)
}

async function onSubmit() {
  if (!validate()) return
  try {
    saving.value = true
    const payload = {
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim() || undefined,
      firstNames: form.firstNames.trim(),
      lastNames: form.lastNames.trim(),
      nameRole: String(form.nameRole),
      phone: form.phone.trim(),
      hotelId: form.hotelId ? String(form.hotelId) : null,
      restaurantId: form.restaurantId ? String(form.restaurantId) : null,
      semanalSalary: Number(salaryLocked.value ? 1 : (form.semanalSalary || 0)),
    }
    await userSvc.registerEmployee(payload as any)
    toast.success('Empleado creado', { description: 'Se registró correctamente.' })
    navigateTo('/empleados')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped></style>
