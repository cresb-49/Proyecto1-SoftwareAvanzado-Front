<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <h1 class="text-xl font-semibold text-brand-900">Menú</h1>
    <p class="text-sm text-brand-700">Restaurante: {{ restaurant?.name }}</p>

    <div class="mt-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" :to="`/restaurantes`">
          ← Regresar
        </Button>
        <span class="text-sm text-brand-700" v-if="menuItems.length">
          {{ menuItems.length }} platillo(s)
        </span>
      </div>
      <Button
        v-if="canManageRestaurants"
        size="sm"
        variant="primary"
        :to="`/restaurantes/menu/crear/${id}`"
      >
        Nuevo platillo
      </Button>
    </div>

    <div v-if="pending" class="mt-4 text-brand-700">Cargando menú…</div>
    <div v-else-if="error" class="mt-4 text-terra-500">
      No se pudo cargar el menú.
    </div>

    <div v-else>
      <div v-if="menuItems.length === 0" class="mt-6 text-sm text-brand-700">
        Este restaurante aún no tiene platillos.
      </div>

      <div v-else class="mt-6 grid gap-4 sm:grid-cols-2">
        <Card v-for="item in menuItems" :key="item.id" :img="genericImage">
          <template #header>
            <h3 class="text-base font-semibold text-brand-900">
              {{ item.name }}
            </h3>
            <p class="text-sm text-brand-700">
              Q {{ Number(item.price).toFixed(2) }}
            </p>
          </template>
          <p class="text-sm text-brand-800">{{ item.description }}</p>
          <template #footer>
            <div class="flex items-center justify-between">
              <Button
                size="sm"
                variant="secondary"
                :to="`/restaurantes/menu/platillo/${item.id}`"
              >
                Ver
              </Button>
              <Button
                v-if="canManageRestaurants"
                size="sm"
                variant="warning"
                :to="`/restaurantes/menu/platillo/editar/${item.id}`"
              >
                Editar
              </Button>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import { useRestaurantService } from "~/services/restaurants";
import { getMenuItems } from "~/services/menu-items";
import { useUseRoles } from "~/composables/useRoles";
import { useAuth } from "~/composables/useAuth";
import { Roles } from "#imports";
import { useEmployeeService } from "~/services/employee";

const { hasAnyRole } = useUseRoles();
const { user } = useAuth();
const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]));
const isRestaurantManager = computed(() =>
  hasAnyRole([Roles.RESTAURANT_MANAGER])
);

const employeeSvc = useEmployeeService();
const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ""}`,
  () =>
    user.value?.employeeId
      ? employeeSvc.getById(String(user.value.employeeId))
      : Promise.resolve(null),
  { server: true }
);

const canManageRestaurants = computed(() => {
  if (isAdmin.value) return true;
  if (isRestaurantManager.value) {
    const emp: any = employeeData.value;
    return !!emp && emp.restaurantId === id;
  }
  return false;
});

const route = useRoute();
const id = String(route.params.id); // id del restaurante (ruta: /restaurantes/menu/:id)

const genericImage =
  "https://plus.unsplash.com/premium_photo-1673972355945-afb546ffe3ce?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const restaurantService = useRestaurantService();
const menuApi = getMenuItems();

// Cargar restaurante (para nombre/cabecera)
const {
  data: restaurantData,
  pending: pendingRestaurant,
  error: errorRestaurant,
} = await useAsyncData(
  () => `restaurant:${id}`,
  () => restaurantService.getById(id),
  { server: true }
);

// Cargar items del menú por restaurante
const {
  data: itemsData,
  pending: pendingItems,
  error: errorItems,
} = await useAsyncData(
  () => `menu-items:restaurant:${id}`,
  () => menuApi.getAllByRestaurantId(id),
  { server: true }
);

const pending = computed(() => pendingRestaurant.value || pendingItems.value);
const error = computed(() => errorRestaurant.value || errorItems.value);

const restaurant = computed<any>(() => restaurantData.value as any);
const menuItems = computed<any[]>(() => {
  const raw: any = itemsData.value;
  // Acepta array directo o { items: [...] }
  if (Array.isArray(raw)) return raw;
  return raw?.items ?? [];
});
</script>
