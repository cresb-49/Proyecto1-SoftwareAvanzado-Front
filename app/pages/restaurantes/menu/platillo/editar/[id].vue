<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-6">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <Button size="sm" variant="secondary" :to="backPath">← Regresar</Button>
      <div class="text-sm text-brand-700" v-if="item?.name">
        Editando: <span class="font-medium text-brand-900">{{ item.name }}</span>
      </div>
    </div>

    <!-- Estados -->
    <div v-if="pending" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">Cargando platillo…</div>
    <div v-else-if="error" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">No se pudo cargar el platillo.</div>

    <!-- Formulario de edición -->
    <Card v-else variant="elevated" title="Editar platillo" :subtitle="restaurantName ? `Restaurante: ${restaurantName}` : ''">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Nombre -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.name"
            label="Nombre *"
            placeholder="Ej. Pepián de la casa"
            :error="errors.name"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Entre 3 y 100 caracteres.</p>
        </div>

        <!-- Descripción -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.description"
            label="Descripción *"
            placeholder="Breve descripción del platillo"
            :error="errors.description"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Entre 5 y 200 caracteres.</p>
        </div>

        <!-- Precio -->
        <div class="sm:col-span-2">
          <InputCurrency
            v-model="form.price"
            label="Precio *"
            currency="GTQ"
            locale="es-GT"
            :error="errors.price"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Mínimo Q0.01, hasta 10 enteros y 2 decimales.</p>
        </div>

        <!-- Costo -->
        <div class="sm:col-span-2">
          <InputCurrency
            v-model="form.cost"
            label="Costo *"
            currency="GTQ"
            locale="es-GT"
            :error="errors.cost"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Mínimo Q0.01, hasta 10 enteros y 2 decimales.</p>
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" @click="onRestore" :disabled="saving">Restaurar</Button>
          <Button variant="primary" :loading="saving" type="submit">Guardar cambios</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })

import { reactive, ref, computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import InputText from '~/components/ui/InputText.vue'
import InputCurrency from '~/components/ui/InputCurrency.vue'
import { useToast } from '~/composables/useToast'
import { getMenuItems } from '~/services/menu-items'
import { useUseRoles } from '~/composables/useRoles'
import { useAuth } from '~/composables/useAuth'
import { useEmployeeService } from '~/services/employee'
import { Roles } from '#imports'

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_MANAGER];
const canManageRestaurants = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const toast = useToast()
const route = useRoute()
const id = String(route.params.id)

const api = getMenuItems()

// Cargar platillo por id
const { data, pending, error } = await useAsyncData(
  () => `menu-item:${id}`,
  () => api.getMenuItemById(id),
  { server: true }
)

const item = computed<any>(() => (data.value as any) || null)
const restaurantId = computed<string>(() => item.value?.restaurant?.id || '')
const restaurantName = computed<string>(() => item.value?.restaurant?.name || '')
const backPath = computed(() => restaurantId.value ? `/restaurantes/menu/${restaurantId.value}` : '/restaurantes')

// ===== Verificación de pertenencia para RESTAURANT_MANAGER =====
const { user } = useAuth()
const employeeSvc = useEmployeeService()
const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]))

// Cargar empleado del usuario autenticado (si existe)
const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ''}`,
  () => (user.value?.employeeId ? employeeSvc.getById(String(user.value.employeeId)) : Promise.resolve(null))
)

// Si es RESTAURANT_MANAGER y el restaurante del platillo no coincide con el asignado, redirigir a inicio
watchEffect(() => {
  const rid = restaurantId.value
  const empRid = (employeeData.value as any)?.restaurantId
  if (!isAdmin.value && rid && empRid && rid !== empRid) {
    navigateTo('/')
  }
})

// Form state
const form = reactive<{ name: string; description: string; price: number | null; cost: number | null }>({
  name: '',
  description: '',
  price: null,
  cost: null,
})
const original = ref<any>(null)

// Inicializar con datos originales una sola vez
const initialized = ref(false)
watchEffect(() => {
  const it = item.value
  if (!initialized.value && it && it.id) {
    form.name = it.name || ''
    form.description = it.description || ''
    form.price = Number(it.price ?? 0)
    form.cost = Number((it as any).cost ?? 0)
    original.value = { ...form }
    initialized.value = true
  }
})

const errors = reactive<Record<string, string>>({ name: '', description: '', price: '', cost: '' })
const saving = ref(false)

function validate() {
  // name 3-100
  const n = form.name.trim()
  errors.name = !n ? 'Requerido' : n.length < 3 ? 'Mínimo 3' : n.length > 100 ? 'Máximo 100' : ''

  // description 5-200
  const d = form.description.trim()
  errors.description = !d ? 'Requerido' : d.length < 5 ? 'Mínimo 5' : d.length > 200 ? 'Máximo 200' : ''

  // price >= 0.01, hasta 10 enteros y 2 decimales
  const s = Number(form.price)
  const validNumber = Number.isFinite(s) && s >= 0.01
  const twoDecimals = /^\d{1,10}(\.\d{1,2})?$/.test(String(form.price ?? ''))
  errors.price = validNumber && twoDecimals ? '' : 'Precio inválido (mín. 0.01 y 2 decimales)'

  // cost >= 0.01, hasta 10 enteros y 2 decimales
  const c = Number(form.cost)
  const validCost = Number.isFinite(c) && c >= 0.01
  const costTwoDecimals = /^\d{1,10}(\.\d{1,2})?$/.test(String(form.cost ?? ''))
  errors.cost = validCost && costTwoDecimals ? '' : 'Costo inválido (mín. 0.01 y 2 decimales)'

  return Object.values(errors).every(v => !v)
}

function onRestore() {
  if (!original.value) return
  Object.assign(form, original.value)
}

async function onSubmit() {
  if (!validate()) return
  if (!restaurantId.value) {
    toast.error('No se pudo determinar el restaurante del platillo')
    return
  }
  try {
    saving.value = true
    await api.updateMenuItem(id, {
      id,
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      cost: Number(form.cost),
      restaurantId: restaurantId.value, // Nota: no editable
    })
    toast.success('Platillo actualizado')
    navigateTo(`/restaurantes/menu/platillo/${id}`)
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo actualizar el platillo'
    toast.error('Error', { description: msg })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped></style>