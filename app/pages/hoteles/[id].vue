<template>
  
  <div class="mx-auto max-w-4xl px-4 py-6">
    <!-- Top toolbar -->
    <div class="mb-4">
      <Button size="sm" variant="secondary" to="/hoteles"
        >← Regresar</Button
      >
    </div>  
    <!-- Loading / Error -->
    <div
      v-if="pending"
      class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700"
    >
      Cargando hotel…
    </div>
    <div
      v-else-if="error"
      class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600"
    >
      Ocurrió un error al cargar el hotel.
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Hero -->
      <section class="overflow-hidden rounded-xl border border-sand-300">
        <div class="relative">
          <img
            :src="hotel?.image"
            alt="Imagen del hotel"
            class="h-64 w-full object-cover sm:h-80"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-brand-900/40 to-transparent"
          ></div>
          <div class="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-sand-50">
            <div class="flex items-center justify-between gap-3">
              <h1 class="text-xl font-semibold sm:text-2xl">
                {{ hotel?.name }}
              </h1>
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
              <h2 class="text-lg font-semibold text-brand-900">
                Información del hotel
              </h2>
              <p class="text-sm text-brand-700">
                Descripción, dirección y vínculos
              </p>
            </div>
          </div>
        </template>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- Descripción -->
          <div class="sm:col-span-2">
            <h3 class="mb-1 text-sm font-medium text-brand-800">Descripción</h3>
            <p class="text-brand-800">
              {{ hotel?.description }}
            </p>
          </div>

          <!-- Dirección -->
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">Dirección</h3>
            <p class="text-brand-800">{{ hotel?.address }}</p>
          </div>

          <!-- Restaurante asociado -->
          <div>
            <h3 class="mb-1 text-sm font-medium text-brand-800">
              Restaurante asociado
            </h3>
            <div v-if="restaurant">
              <NuxtLink
                :to="`/restaurantes/${restaurant.id}`"
                class="inline-flex items-center gap-2 rounded-md border border-sand-300 bg-sand-50 px-3 py-1.5 text-sm text-brand-800 hover:bg-sand-100"
              >
                🍽️ {{ restaurant.name }}
              </NuxtLink>
            </div>
            <p v-else class="text-brand-700">—</p>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end">
            <Button size="sm" variant="primary" :to="`/reservaciones/crear?hotelId=${hotel?.id}`"
              >Reservar</Button>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>

import { ref, computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import { useHotelService } from "~/services/hotels";
import { useRestaurantService } from "~/services/restaurants";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";

const route = useRoute();
const id = String(route.params.id);

const hotelService = useHotelService();
const restaurantService = useRestaurantService();

const { hasAnyRole } = useUseRoles();
const canManageHotels = computed(() =>
  hasAnyRole([Roles.ADMIN, Roles.HOTEL_MANAGER])
);

// Cargar hotel
const {
  data: hotel,
  pending,
  error,
} = await useAsyncData(
  () => `hotel:${id}`,
  () => hotelService.getById(id),
  { server: true }
);

// Restaurante asociado (opcional)
const restaurant = ref<{ id: string; name: string } | null>(null);
watchEffect(async () => {
  const rid = (hotel.value as any)?.restaurantId;
  if (!rid) {
    restaurant.value = null;
    return;
  }
  try {
    const r = await restaurantService.getById(String(rid));
    restaurant.value = { id: (r as any).id, name: (r as any).name };
  } catch {
    restaurant.value = null;
  }
});

const rating = computed(() => {
  const r = (hotel.value as any)?.rating
  const n = Number(r)
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0
})
const roundedRating = computed(() => Math.round(rating.value))
const hasRating = computed(() => rating.value > 0)
const displayRating = computed(() => rating.value.toFixed(1))
</script>
