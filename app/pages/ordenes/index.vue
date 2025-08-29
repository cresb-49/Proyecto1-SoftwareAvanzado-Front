<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-6">
    <!-- Encabezado -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">Órdenes</h1>
        <p class="text-sm text-brand-700">Crea y consulta órdenes por restaurante</p>
      </div>
    </header>

    <!-- ADMIN: selector de restaurante -->
    <section v-if="isAdmin" class="space-y-3">
      <Select
        v-model="selectedRestaurantId"
        :options="restaurantOptions"
        label="Restaurante"
        placeholder="Selecciona un restaurante…"
        clearable
        size="md"
      />
      <p class="text-xs text-brand-700">Elige un restaurante para crear o ver sus órdenes.</p>
    </section>

    <!-- Estado de carga -->
    <div v-if="loadingAny" class="text-brand-700">Cargando información…</div>

    <!-- Tarjeta del restaurante actual -->
    <Card
      v-else-if="currentRestaurant"
      variant="elevated"
      :title="currentRestaurant.name"
      :subtitle="currentRestaurant.address || ''"
      :img="currentRestaurant.image"
    >
      <p class="text-sm text-brand-800" v-if="currentRestaurant.description">{{ currentRestaurant.description }}</p>

      <template #footer>
        <div class="flex items-center justify-between">
          <Button size="sm" variant="info" :to="viewPath">Ver órdenes</Button>
          <Button size="sm" variant="primary" :to="createPath">Crear orden</Button>
        </div>
      </template>
    </Card>

    <!-- Sin restaurante disponible -->
    <div v-else class="rounded-md border border-sand-300 bg-sand-50 p-4 text-sm text-brand-700">
      No se encontró un restaurante asociado. Si eres administrador, selecciona uno arriba.
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })

import { ref, computed } from 'vue'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import Select from '~/components/ui/Select.vue'
import { useAuth } from '~/composables/useAuth'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import { useEmployeeService } from '~/services/employee'
import { useRestaurantService } from '~/services/restaurants'

const { user } = useAuth()
const { hasAnyRole, redirectIfUnauthorized } = useUseRoles()
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_EMPLOYEE, Roles.RESTAURANT_MANAGER]
redirectIfUnauthorized(permitedRoles, '/')

const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]))

// Servicios
const employeeSvc = useEmployeeService()
const restaurantSvc = useRestaurantService()

// Cargar empleado (para conocer su restaurantId cuando no es ADMIN)
const { data: employeeData, pending: employeePending } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ''}`,
  () => user.value?.employeeId ? employeeSvc.getById(String(user.value.employeeId)) : Promise.resolve(null)
)

// Cargar todos los restaurantes (para ADMIN y para opciones)
const { data: allRestaurants, pending: allRestaurantsPending } = await useAsyncData(
  'restaurants:all',
  () => restaurantSvc.getAll()
)

// Cargar restaurante del empleado cuando exista
const { data: restaurantEmployeeData, pending: restaurantEmployeePending } = await useAsyncData(
  () => `restaurant:by-employee:${(employeeData.value as any)?.restaurantId ?? ''}`,
  () => {
    const rid = (employeeData.value as any)?.restaurantId
    return rid ? restaurantSvc.getById(String(rid)) : Promise.resolve(null)
  },
  { watch: [employeeData] }
)

// ADMIN: selección de restaurante
const selectedRestaurantId = ref<string>('')
const restaurantOptions = computed(() => {
  const list = (allRestaurants.value as any[]) || []
  return list.map(r => ({ label: r.name, value: r.id }))
})

// Restaurante actual según rol/selección
const currentRestaurant = computed<any>(() => {
  if (isAdmin.value) {
    const id = selectedRestaurantId.value
    if (!id) return null
    const list = (allRestaurants.value as any[]) || []
    return list.find(r => String(r.id) === String(id)) || null
  }
  // Empleado/Manager de restaurante
  return (restaurantEmployeeData.value as any) || null
})

const loadingAny = computed(() => employeePending.value || allRestaurantsPending.value || restaurantEmployeePending.value)

// Rutas de navegación
const viewPath = computed(() => currentRestaurant.value ? `/ordenes/${currentRestaurant.value.id}` : '#')
const createPath = computed(() => currentRestaurant.value ? `/ordenes/crear/${currentRestaurant.value.id}` : '#')
</script>

<style scoped></style>
