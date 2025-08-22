<template>
  <div class="mx-auto max-w-7xl space-y-12 px-4 py-8">
    <!-- HERO -->
    <section
      class="relative overflow-hidden rounded-2xl border border-sand-300"
    >
      <img
        src="https://plus.unsplash.com/premium_photo-1682089286333-056d949b5ba0?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Lobby de hotel elegante"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-b from-brand-900/40 to-brand-800/20"
      ></div>
      <div class="relative z-10 mx-auto max-w-3xl px-6 py-16 text-sand-50">
        <h1 class="text-3xl font-semibold leading-tight">Comer y Dormir</h1>
        <p class="mt-2 text-sand-50/90">
          Hoteles con encanto y restaurantes memorables. Reservas seguras,
          atención cálida y experiencias que querrás repetir.
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="md" to="/hoteles">Ver hoteles</Button>
          <Button variant="secondary" size="md" to="/restaurantes"
            >Ver restaurantes</Button
          >
        </div>
      </div>
    </section>

    <!-- POR QUÉ ELEGIRNOS -->
    <section>
      <h2 class="text-xl font-semibold text-brand-900">¿Por qué elegirnos?</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-xl border border-sand-300 bg-white p-5">
          <div class="mb-2 text-brand-700">
            <!-- icon check -->
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.2l-3.5-3.6L4 14.1l5 5 11-11-1.5-1.4z" />
            </svg>
          </div>
          <h3 class="font-semibold text-brand-900">Servicio de primera</h3>
          <p class="mt-1 text-sm text-brand-700">
            Recepción 24/7, staff bilingüe y recomendaciones locales auténticas.
          </p>
        </div>

        <div class="rounded-xl border border-sand-300 bg-white p-5">
          <div class="mb-2 text-brand-700">
            <!-- icon dish -->
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M7 21h2v-2H7v2zm4 0h2v-2h-2v2zm-8-5h18v-2H3v2zM12 2a6 6 0 00-6 6v5h2V8a4 4 0 118 0v5h2V8a6 6 0 00-6-6z"
              />
            </svg>
          </div>
          <h3 class="font-semibold text-brand-900">Gastronomía memorable</h3>
          <p class="mt-1 text-sm text-brand-700">
            Desde cocina local hasta autor; ingredientes frescos y sabores
            únicos.
          </p>
        </div>

        <div class="rounded-xl border border-sand-300 bg-white p-5">
          <div class="mb-2 text-brand-700">
            <!-- icon star -->
            <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"
              />
            </svg>
          </div>
          <h3 class="font-semibold text-brand-900">Experiencias con sello</h3>
          <p class="mt-1 text-sm text-brand-700">
            Tours, catas y actividades pensadas para crear recuerdos.
          </p>
        </div>
      </div>
    </section>

    <!-- DESTACADOS -->
    <section>
      <div class="mb-4 flex items-end justify-between">
        <h2 class="text-xl font-semibold text-brand-900">Hoteles Destacados</h2>
        <!--<NuxtLink
          to="/explorar"
          class="text-sm text-brand-700 hover:text-brand-600"
          >Ver todo →</NuxtLink
        >-->
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Hotel 1 -->
        <template v-for="hotel in hotels?.slice(0, 3)">
          <Card
          :img="hotel.image"
          :title="hotel.name"
          :subtitle="hotel.address"
          >
          <p class="text-sm text-brand-800">
            {{hotel.description}}
          </p>
          <template #footer>
            <div class="flex items-center justify-between">
              <!--<span class="text-sm text-brand-700"
                >Desde <strong class="text-brand-900">Q650</strong>/noche</span
              >-->
              <Button size="sm" variant="info" :to="`/hoteles/${hotel.id}`">ver</Button>
            </div>
          </template>
          </Card>
        </template>
      </div>
    </section>

    <section>
      <div class="mb-4 flex items-end justify-between">
        <h2 class="text-xl font-semibold text-brand-900">Restaurantes Destacados</h2>
        <!--<NuxtLink
          to="/explorar"
          class="text-sm text-brand-700 hover:text-brand-600"
          >Ver todo →</NuxtLink
        >-->
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Hotel 1 -->
        <template v-for="restaurant in restaurants?.slice(0, 3)">
          <Card
          :img="restaurant.image"
          :title="restaurant.name"
          :subtitle="restaurant.address"
          >
          <p class="text-sm text-brand-800">
            {{restaurant.description}}
          </p>
          <template #footer>
            <div class="flex items-center justify-between">
              <!--<span class="text-sm text-brand-700"
                >Desde <strong class="text-brand-900">Q650</strong>/noche</span
              >-->
              <Button size="sm" variant="info" :to="`/restaurantes/${restaurant.id}`">ver</Button>
            </div>
          </template>
          </Card>
        </template>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section
      class="rounded-2xl border border-sand-300 bg-sand-50 p-6 text-center"
    >
      <h3 class="text-lg font-semibold text-brand-900">
        ¿Listo para tu próxima experiencia?
      </h3>
      <p class="mt-1 text-sm text-brand-700">
        Explora cientos de opciones cuidadosamente seleccionadas.
      </p>
      <div class="mt-4 flex justify-center gap-3">
        <Button variant="primary" to="/explorar">Reserva ahora</Button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useHotelService } from "~/services/hotels";
import { useRestaurantService } from "~/services/restaurants";

const hotelService = useHotelService();
const restaurantService = useRestaurantService();

const {
  data: hotels,
  pending: loadingHotels,
  error: loadingHotelsError,
  refresh: refreshHotels,
} = await useAsyncData("hotels", () => hotelService.getAll());

const {
  data: restaurants,
  pending: loadingRestaurants,
  error: loadingRestaurantsError,
  refresh: refreshRestaurants,
} = await useAsyncData("restaurants", () => restaurantService.getAll());
</script>

<style scoped></style>
