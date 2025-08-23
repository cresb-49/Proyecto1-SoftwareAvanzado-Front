
<template>
  <div class="mx-auto max-w-6xl px-4 py-6">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">Empleados</h1>
        <p class="text-sm text-brand-700">Listado con hotel, restaurante y rol del usuario.</p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="primary" to="/empleados/crear">Crear empleado</Button>
      </div>
    </div>

    <!-- Tabla -->
    <Table
      :columns="cols"
      :items="rows"
      :loading="pending || loadingRelated"
      :page-size="10"
      v-model:page="page"
      v-model:search="search"
      size="md"
    >
      <template #title>Listado de empleados</template>

      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <Button size="sm" variant="warning" :to="`/empleados/editar/${row.id}`">Editar</Button>
          <Button
            v-if="row.state"
            size="sm"
            variant="danger"
            :loading="row.loadingToggle"
            @click="onToggleState(row, false)"
          >Desactivar</Button>
          <Button
            v-else
            size="sm"
            variant="success"
            :loading="row.loadingToggle"
            @click="onToggleState(row, true)"
          >Activar</Button>
        </div>
      </template>
    </Table>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ['auth'] })

import { ref, computed, watchEffect } from 'vue'
import Table, { type Column } from '~/components/ui/Table.vue'
import Button from '~/components/ui/Button.vue'
import { useToast } from '~/composables/useToast'

import { useEmployeeService, type Employee } from '~/services/employee'
import { useHotelService } from '~/services/hotels'
import { useRestaurantService } from '~/services/restaurants'
import { useUserService } from '~/services/users'

const toast = useToast()
const employeeSvc = useEmployeeService()
const hotelSvc = useHotelService()
const restaurantSvc = useRestaurantService()
const userSvc = useUserService()

const page = ref(1)
const search = ref('')

// 1) Empleados
const { data: employeesData, pending, error, refresh } = await useAsyncData(
  'employees:list',
  () => employeeSvc.getAll(),
  { server: true }
)
const employees = computed<Employee[]>(() => employeesData.value || [])

// 2) Ids únicos relacionados
const hotelIds = computed(() => Array.from(new Set(employees.value.map(e => e.hotelId).filter(Boolean))))
const restaurantIds = computed(() => Array.from(new Set(employees.value.map(e => e.restaurantId).filter(Boolean))))
const userIds = computed(() => Array.from(new Set(employees.value.map(e => e.userId).filter(Boolean))))

// 3) Traer relacionados en paralelo (maps id -> entidad)
const loadingRelated = ref(false)
const hotelMap = ref<Record<string, any>>({})
const restaurantMap = ref<Record<string, any>>({})
const userMap = ref<Record<string, any>>({})

watchEffect(async () => {
  loadingRelated.value = true
  try {
    const [hotels, restaurants, users] = await Promise.all([
      hotelIds.value.length
        ? Promise.all(hotelIds.value.map(id => hotelSvc.getById(String(id)).catch(() => null)))
        : Promise.resolve([]),
      restaurantIds.value.length
        ? Promise.all(restaurantIds.value.map(id => restaurantSvc.getById(String(id)).catch(() => null)))
        : Promise.resolve([]),
      userIds.value.length
        ? Promise.all(userIds.value.map(id => userSvc.getById(String(id)).catch(() => null)))
        : Promise.resolve([])
    ])
    hotelMap.value = Object.fromEntries((hotels as any[]).filter(Boolean).map((h: any) => [h.id, h]))
    restaurantMap.value = Object.fromEntries((restaurants as any[]).filter(Boolean).map((r: any) => [r.id, r]))
    userMap.value = Object.fromEntries((users as any[]).filter(Boolean).map((u: any) => [u.id, u]))
  } finally {
    loadingRelated.value = false
  }
})

// 4) Filas enriquecidas
const currency = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })

type Row = {
  id: string
  username: string
  role: string
  state: boolean
  hotelName: string
  restaurantName: string
  salary: number
  loadingToggle?: boolean
}

const rows = computed<Row[]>(() =>
  employees.value.map((e) => {
    const u: any = userMap.value[e.userId] || {}
    const h: any = hotelMap.value[e.hotelId] || {}
    const r: any = restaurantMap.value[e.restaurantId] || {}
    return {
      id: e.id,
      username: u.username || e.userId,
      role: u.roleName || '-',
      state: typeof u.state === 'boolean' ? u.state : true,
      hotelName: h.name || e.hotelId,
      restaurantName: r.name || e.restaurantId,
      salary: e.semanalSalary,
    }
  })
)

// 5) Columnas de la tabla
const cols: Column<Row>[] = [
  { key: 'username', label: 'Usuario', sortable: true },
  { key: 'role', label: 'Rol', sortable: true },
  { key: 'state', label: 'Estado', format: v => v ? 'Activo' : 'Inactivo' },
  { key: 'hotelName', label: 'Hotel', sortable: true },
  { key: 'restaurantName', label: 'Restaurante', sortable: true },
  { key: 'salary', label: 'Salario semanal', align: 'right', format: v => currency.format(Number(v)) },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]

// 6) Acciones: activar/desactivar usuario
async function onToggleState(row: Row, next: boolean) {
  try {
    row.loadingToggle = true
    const user: any = userMap.value[employees.value.find(e => e.id === row.id)?.userId || '']
    if (!user?.id) {
      toast.error('No se encontró el usuario asociado')
      return
    }
    await userSvc.changeState(user.id)
    toast.success(next ? 'Usuario activado' : 'Usuario desactivado')
    // Refrescar solo usuarios
    // Volvemos a pedir el usuario puntual para evitar cargar todo de nuevo
    try {
      const fresh = await userSvc.getById(user.id)
      userMap.value[user.id] = fresh as any
    } catch {}
  } finally {
    row.loadingToggle = false
  }
}
</script>

<style scoped></style>