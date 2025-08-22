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
            :title="restaurant.name"
            :subtitle="restaurant.address"
          >
            <p class="text-sm text-brand-800">
              {{ restaurant.description }}
            </p>
            <template #footer>
              <div class="flex items-center justify-between">
                <!--<span class="text-sm text-brand-700"
                >Desde <strong class="text-brand-900">Q650</strong>/noche</span
              >-->
                <Button
                  size="sm"
                  variant="info"
                  :to="`/restaurantes/${restaurant.id}`"
                  >ver</Button
                >
                 <Button
                    v-if="canManageRestaurants"
                    size="sm"
                    variant="warning"
                    :to="`/restaurantes/editar/${restaurant.id}`"
                  >
                    Editar
                  </Button>
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
