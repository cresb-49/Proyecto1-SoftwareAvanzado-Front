<template>
  <div class="mx-auto max-w-6xl px-4 py-6">
    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-xl font-semibold text-brand-900">Usuarios</h1>
      <p class="text-sm text-brand-700">Listado de usuarios del sistema</p>
    </div>

    <!-- Tabla de usuarios -->
    <Table
      :columns="cols"
      :items="rows.filter(u => (auth.user.value?.id !== u.id))"
      :loading="pending"
      :page-size="10"
      v-model:page="page"
      v-model:search="search"
      size="md"
    >
      <template #title>Listado de usuarios</template>
      <template #cell-state="{ row }">
        <span
          class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
          :class="row.state
            ? 'bg-olive-600/10 text-olive-600 border-olive-600/20'
            : 'bg-terra-500/10 text-terra-500 border-terra-500/20'"
        >
          {{ row.state ? 'Activo' : 'Inactivo' }}
        </span>
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-2">
          <Button size="sm" variant="warning" :to="`/usuarios/editar/${row.id}`">Editar</Button>
          <Button
            v-if="row.state"
            size="sm"
            variant="danger"
            :loading="row.loadingToggle"
            @click="onToggleState(row)"
          >Desactivar</Button>
          <Button
            v-else
            size="sm"
            variant="success"
            :loading="row.loadingToggle"
            @click="onToggleState(row)"
          >Activar</Button>
        </div>
      </template>
    </Table>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] })

import { ref, computed } from 'vue'
import Table, { type Column } from '~/components/ui/Table.vue'
import Button from '~/components/ui/Button.vue'
import { useUserService, type User } from '~/services/users'
import { useToast } from '~/composables/useToast'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import { useAuth } from '~/composables/useAuth'

const { redirectIfUnauthorized } = useUseRoles()
const permitedRoles = [Roles.ADMIN, Roles.MANAGER]
redirectIfUnauthorized(permitedRoles, '/')

const toast = useToast()
const userSvc = useUserService()
const auth = useAuth()

const page = ref(1)
const search = ref('')

// Cargar usuarios
const { data, pending, error, refresh } = await useAsyncData(
  'users:all',
  () => userSvc.getAll(),
  { server: true }
)

// Filas para la tabla
export type Row = Pick<User, 'id' | 'firstNames' | 'lastNames' | 'roleName' | 'state'> & { index: number, loadingToggle?: boolean }

const rows = computed<Row[]>(() => {
  const list = (data.value || []) as User[]
  return list.map((u, i) => ({
    id: u.id,
    firstNames: u.firstNames,
    lastNames: u.lastNames,
    roleName: u.roleName,
    state: u.state,
    index: i + 1,
  }))
})

// Columnas
const cols: Column<Row>[] = [
  { key: 'index', label: 'N°', align: 'center' },
  { key: 'firstNames', label: 'Nombres', sortable: true },
  { key: 'lastNames', label: 'Apellidos', sortable: true },
  { key: 'roleName', label: 'Rol', sortable: true },
  { key: 'state', label: 'Estado', align: 'center' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]

// Activar/Desactivar usuario
async function onToggleState(row: Row) {
  try {
    row.loadingToggle = true
    await userSvc.changeState(row.id)
    // Refrescar lista
    await refresh()
    toast.success(row.state ? 'Usuario desactivado' : 'Usuario activado')
  } catch (e: any) {
    toast.error('No se pudo cambiar el estado')
  } finally {
    row.loadingToggle = false
  }
}
</script>

<style scoped></style>