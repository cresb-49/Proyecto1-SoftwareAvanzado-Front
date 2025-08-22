<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <!-- Top toolbar -->
    <div class="mb-4">
      <Button size="sm" variant="secondary" to="/restaurantes">← Regresar</Button>
    </div>

    <!-- Loading / Error -->
    <div v-if="pending" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">
      Cargando restaurante…
    </div>
    <div v-else-if="error" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">
      Ocurrió un error al cargar el restaurante.
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Hero -->
      <section class="overflow-hidden rounded-xl border border-sand-300">
        <div class="relative">
          <img
            :src="restaurant?.image"
            alt="Imagen del restaurante"
            class="h-64 w-full object-cover sm:h-80"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-brand-900/40 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-sand-50">
            <div class="flex items-center justify-between gap-3">
              <h1 class="text-xl font-semibold sm:text-2xl">{{ restaurant?.name }}</h1>
              <!-- Rating (0..5 estrellas) -->
              <div class="flex items-center gap-1" aria-label="Calificación">
                <svg
                  v-for="i in 5"
                  :key="i"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  :class="i <= roundedRating ? 'text-gold-500' : 'text-sand-100/60'"
                >
                  <path d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"/>
                </svg>
                <span v-if="hasRating" class="ml-2 text-sm text-sand-50/90">{{ displayRating }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Details -->
      <Card variant="elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-brand-900">Información del restaurante</h2>
              <p class="text-sm text-brand-700">Descripción y dirección</p>
            </div>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Descripción -->
          <div class="sm:col-span-2">
            <h3 class="mb-1 text-sm font-medium text-brand-800">Descripción</h3>
            <p class="text-brand-800">{{ restaurant?.description }}</p>
          </div>

          <!-- Dirección -->
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Dirección</h3>
            <p class="text-brand-800">{{ restaurant?.address }}</p>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useRestaurantService } from "~/services/restaurants";

const route = useRoute();
const id = String(route.params.id);
const restaurantService = useRestaurantService();

const { data: restaurant, pending, error } = await useAsyncData(
  () => `restaurant:${id}`,
  () => restaurantService.getById(id),
  { server: true }
);

// Rating helpers (0..5)
const rating = computed(() => {
  const r = (restaurant.value as any)?.rating
  const n = Number(r)
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0
})
const roundedRating = computed(() => Math.round(rating.value))
const hasRating = computed(() => rating.value > 0)
const displayRating = computed(() => rating.value.toFixed(1))
</script>

<style scoped></style>