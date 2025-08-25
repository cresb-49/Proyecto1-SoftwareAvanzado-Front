<template>
  <div>
    <section>
      <div class="mb-4">
        <Button
          size="sm"
          variant="secondary"
          :to="isLoggedIn ? '/dashboard' : '/'"
          >← Regresar</Button
        >
      </div>
       <div class="mb-4 flex items-end justify-between">
        <h2 class="text-xl font-semibold text-brand-900">Restaurantes</h2>
        <Button
          v-if="canManageRestaurants"
          variant="primary"
          size="sm"
          to="/restaurantes/crear"
        >
          Crear restaurante
        </Button>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <template v-for="restaurant in restaurants">
          <Card
            :img="restaurant.image"
          >
          <template #header>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-base font-semibold text-brand-900">
                    {{ restaurant.name }}
                  </h3>
                  <p class="text-sm text-brand-700">{{ restaurant.address }}</p>
                </div>
                <div class="flex items-center gap-1" aria-label="Calificación">
                  <svg
                    v-for="i in 5"
                    :key="i"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    :class="
                      i <= rounded(restaurant.rating)
                        ? 'text-gold-500'
                        : 'text-sand-300'
                    "
                  >
                    <path
                      d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"
                    />
                  </svg>
                  <span
                    v-if="clamp5(restaurant?.rating) > 0"
                    class="ml-1 text-xs text-brand-700"
                    >{{ displayRating(restaurant.rating) }}</span
                  >
                </div>
              </div>
            </template>
            <p class="text-sm text-brand-800">
              {{ restaurant.description }}
            </p>
            <template #footer>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="info"
                    :to="`/restaurantes/${restaurant.id}`"
                  >Ver</Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    :to="`/restaurantes/menu/${restaurant.id}`"
                  >Menú</Button>
                </div>
                <Button
                  v-if="canManageRestaurants"
                  size="sm"
                  variant="warning"
                  :to="`/restaurantes/editar/${restaurant.id}`"
                >Editar</Button>
              </div>
            </template>
          </Card>
        </template>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useRestaurantService } from "~/services/restaurants";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const { isLoggedIn } = useAuth();

const clamp5 = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0
}
const rounded = (v: any) => Math.round(clamp5(v))
const displayRating = (v: any) => clamp5(v).toFixed(1)

// roles permitidos para gestionar restaurantes
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_MANAGER];
const canManageRestaurants = computed(() => hasAnyRole(permitedRoles));
const restaurantService = useRestaurantService();

const {
  data: restaurants,
  pending: loadingRestaurants,
  error: loadingRestaurantsError,
  refresh: refreshRestaurants,
} = await useAsyncData("restaurants", () => restaurantService.getAll());
</script>
