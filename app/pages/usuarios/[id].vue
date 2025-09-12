<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-6">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/usuarios">← Regresar</Button>
      <div class="text-sm text-brand-700">Detalle de usuario</div>
    </div>

    <!-- Estados -->
    <div v-if="pending" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">Cargando usuario…</div>
    <div v-else-if="error" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">No se pudo cargar el usuario.</div>

    <!-- Contenido -->
    <Card v-else variant="elevated" :title="u?.username || 'Usuario'" :subtitle="`ID: ${u?.id || ''}`">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <div class="inline-flex items-center gap-2">
            <span class="text-sm text-brand-700">Estado:</span>
            <span
              :class="u?.state ? 'bg-sage-500 text-white' : 'bg-terra-500 text-white'"
              class="rounded px-2 py-0.5 text-xs"
            >{{ u?.state ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>

        <div>
          <div class="text-xs text-brand-700">Usuario</div>
          <div class="font-medium text-brand-900">{{ u?.username || '—' }}</div>
        </div>
        <div>
          <div class="text-xs text-brand-700">Rol</div>
          <div class="font-medium text-brand-900">{{ u?.roleName || '—' }}</div>
        </div>

        <div>
          <div class="text-xs text-brand-700">Nombres</div>
          <div class="font-medium text-brand-900">{{ u?.firstNames || '—' }}</div>
        </div>
        <div>
          <div class="text-xs text-brand-700">Apellidos</div>
          <div class="font-medium text-brand-900">{{ u?.lastNames || '—' }}</div>
        </div>

        <div>
          <div class="text-xs text-brand-700">Correo</div>
          <div class="font-medium text-brand-900">{{ u?.email || '—' }}</div>
        </div>
        <div>
          <div class="text-xs text-brand-700">Teléfono</div>
          <div class="font-medium text-brand-900">{{ u?.phone || '—' }}</div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end">
          <Button size="sm" variant="secondary" to="/usuarios">Cerrar</Button>
        </div>
      </template>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] })

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import { useUserService } from '~/services/users'
import { useUseRoles } from '~/composables/useRoles'
import { Roles } from '#imports'
import type { User } from '~/services/users'

// Solo ADMIN y MANAGER
const { redirectIfUnauthorized } = useUseRoles()
redirectIfUnauthorized([Roles.ADMIN, Roles.MANAGER], '/')

const route = useRoute()
const id = String(route.params.id || '')

const userSvc = useUserService()
const { data, pending, error } = await useAsyncData(
  () => `user:${id}`,
  () => id ? userSvc.getById(id) : Promise.resolve(null),
  { server: true }
)

const u = computed<User | null>(() => (data.value as any) || null)
</script>

<style scoped></style>