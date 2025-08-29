<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-6">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <Button size="sm" variant="secondary" :to="backPath">← Regresar</Button>
      <div class="text-sm text-brand-700" v-if="item?.name">
        Platillo: <span class="font-medium text-brand-900">{{ item.name }}</span>
      </div>
    </div>

    <!-- Estados -->
    <div v-if="pending" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">Cargando platillo…</div>
    <div v-else-if="error" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">No se pudo cargar el platillo.</div>

    <!-- Detalle del platillo -->
    <Card v-else variant="elevated" :title="item.name" :subtitle="restaurant ? `Platillo de ${restaurant.name}` : ''">
      <div class="space-y-4">
        <!-- Descripción -->
        <p class="text-brand-800">{{ item.description }}</p>

        <!-- Datos -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="rounded-lg border border-sand-300 bg-sand-50 p-3">
            <div class="text-xs text-brand-700">Precio</div>
            <div class="text-lg font-semibold text-brand-900">{{ priceGTQ }}</div>
          </div>
          <div class="rounded-lg border border-sand-300 bg-sand-50 p-3" v-if="restaurant">
            <div class="text-xs text-brand-700">Restaurante</div>
            <div class="text-sm font-medium text-brand-900">{{ restaurant.name }}</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <Button size="sm" variant="secondary" :to="backPath">Volver al menú</Button>
          <Button v-if="canManageRestaurants" size="sm" variant="warning" :to="editPath">Editar</Button>
        </div>
      </template>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import { getMenuItems } from '~/services/menu-items'

const { hasAnyRole } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_MANAGER];
const canManageRestaurants = computed(() => hasAnyRole(permitedRoles));

const route = useRoute()
const id = String(route.params.id)
const menuApi = getMenuItems()

// Traer platillo por id
const { data, pending, error } = await useAsyncData(
  () => `menu-item:${id}`,
  () => menuApi.getMenuItemById(id),
  { server: true }
)

const item = computed<any>(() => (data.value as any) || null)
const restaurant = computed<any>(() => item.value?.restaurant || null)

const backPath = computed(() => restaurant.value?.id ? `/restaurantes/menu/${restaurant.value.id}` : '/restaurantes')
const editPath = computed(() => `/restaurantes/menu/platillo/editar/${id}`)

const priceGTQ = computed(() => formatCurrency(item.value?.price))

function formatCurrency(n: number | string | null | undefined) {
  const num = Number(n ?? 0)
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(num)
}
</script>

<style scoped></style>