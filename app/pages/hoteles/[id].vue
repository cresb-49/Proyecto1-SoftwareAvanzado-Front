<template>
  <div class="mx-auto max-w-4xl px-4 py-6">
    <!-- Top toolbar -->
    <div class="mb-4">
      <Button size="sm" variant="secondary" to="/hoteles">← Regresar</Button>
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
                  :class="
                    i <= roundedRating ? 'text-gold-500' : 'text-sand-100/60'
                  "
                >
                  <path
                    d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"
                  />
                </svg>
                <span v-if="hasRating" class="ml-2 text-sm text-sand-50/90">{{
                  displayRating
                }}</span>
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
            <Button
              size="sm"
              variant="primary"
              :to="`/reservaciones/crear?hotelId=${hotel?.id}`"
              >Reservar</Button
            >
          </div>
        </template>
      </Card>

      <!-- Reviews & Ratings -->
      <Card variant="elevated">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-brand-900">
                Opiniones y valoraciones
              </h2>
              <p class="text-sm text-brand-700">Lo que dicen los huéspedes</p>
            </div>
          </div>
        </template>

        <div class="space-y-6">
          <!-- Formulario de reseña (solo clientes) -->
          <section
            v-if="isCustomer"
            class="rounded-md border border-sand-300 bg-sand-50 p-4"
          >
            <h3 class="mb-3 text-sm font-medium text-brand-800">
              Escribe tu reseña
            </h3>
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="sm:col-span-1">
                <Select
                  v-model="reviewForm.rating"
                  :options="ratingOptions"
                  label="Valoración *"
                  placeholder="Selecciona"
                  :error="reviewErrors.rating"
                />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1 block text-sm font-medium text-brand-800"
                  >Reseña *</label
                >
                <textarea
                  v-model="reviewForm.review"
                  rows="3"
                  class="block w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-brand-800 placeholder:text-brand-700/60 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Cuéntanos tu experiencia"
                ></textarea>
                <p
                  v-if="reviewErrors.review"
                  class="mt-1 text-xs text-terra-500"
                >
                  {{ reviewErrors.review }}
                </p>
              </div>
              <div class="sm:col-span-3 flex items-center justify-end gap-2">
                <Button
                  variant="primary"
                  :loading="submittingReview"
                  @click="onSubmitReview"
                  >Publicar reseña</Button
                >
              </div>
            </div>
          </section>

          <!-- Lista de reseñas -->
          <section>
            <div v-if="pendingReviews" class="text-brand-700">
              Cargando reseñas…
            </div>
            <div v-else-if="errorReviews" class="text-terra-500">
              No se pudieron cargar las reseñas.
            </div>
            <div v-else>
              <div
                v-if="(reviews || []).length === 0"
                class="text-sm text-brand-700"
              >
                Aún no hay reseñas. ¡Sé el primero en opinar!
              </div>
              <ul v-else class="grid gap-4">
                <li
                  v-for="r in reviews"
                  :key="r.id"
                  class="rounded-md border border-sand-300 bg-white p-4"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-2">
                        <div
                          class="flex items-center"
                          aria-label="Calificación"
                        >
                          <span
                            v-for="i in 5"
                            :key="i"
                            class="relative inline-block h-5 w-5"
                          >
                            <!-- base star -->
                            <svg
                              viewBox="0 0 24 24"
                              class="absolute inset-0 h-5 w-5 text-sand-300"
                              fill="currentColor"
                            >
                              <path
                                d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"
                              />
                            </svg>
                            <!-- gold overlay according to fill (0/50/100) -->
                            <div
                              class="absolute inset-0 overflow-hidden"
                              :style="{ width: starFill(i, r.rating) + '%' }"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                class="h-5 w-5 text-gold-500"
                                fill="currentColor"
                              >
                                <path
                                  d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"
                                />
                              </svg>
                            </div>
                          </span>
                        </div>
                        <span class="text-xs text-brand-700"
                          >{{ Number(r.rating).toFixed(1) }}/5</span
                        >
                      </div>
                      <p class="mt-2 text-brand-800">{{ r.review }}</p>
                    </div>
                    <div class="text-right text-xs text-brand-700">
                      <div>{{ formatDate(r.createdAt) }}</div>
                      <div v-if="String(r.userId) === String(userId)" class="mt-2">
                        <Button
                          size="sm"
                          variant="danger"
                          @click="onDeleteReview(r.id)"
                          :loading="deletingId === r.id"
                        >Eliminar</Button>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watchEffect, reactive } from "vue";
import { useRoute } from "vue-router";
import Card from "~/components/ui/Card.vue";
import Button from "~/components/ui/Button.vue";
import { useHotelService } from "~/services/hotels";
import { useRestaurantService } from "~/services/restaurants";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import Select from "~/components/ui/Select.vue";
import { useToast } from "~/composables/useToast";

const route = useRoute();
const id = String(route.params.id);

const hotelService = useHotelService();
const restaurantService = useRestaurantService();

const { hasAnyRole } = useUseRoles();
const canManageHotels = computed(() =>
  hasAnyRole([Roles.ADMIN, Roles.HOTEL_MANAGER])
);

const isCustomer = computed(() => hasAnyRole([Roles.CUSTOMER]));

const userId = computed(() => (useAuth().user.value as any)?.id ?? null);

// Cargar hotel
const {
  data: hotel,
  pending,
  error,
  refresh: refreshHotel,
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

// ----- Reseñas -----
const toast = useToast();

const {
  data: reviewsData,
  pending: pendingReviews,
  error: errorReviews,
  refresh: refreshReviews,
} = await useAsyncData(
  () => `hotel-reviews:${id}`,
  () => hotelService.getHotelReviews(id),
  { server: true }
);
const reviews = computed(() => (reviewsData.value as any) || []);

const ratingOptions = [
  { label: "1 ⭐", value: 1 },
  { label: "1.5 ⭐", value: 1.5 },
  { label: "2 ⭐", value: 2 },
  { label: "2.5 ⭐", value: 2.5 },
  { label: "3 ⭐", value: 3 },
  { label: "3.5 ⭐", value: 3.5 },
  { label: "4 ⭐", value: 4 },
  { label: "4.5 ⭐", value: 4.5 },
  { label: "5 ⭐", value: 5 },
];

const reviewForm = reactive<{ rating: number | null; review: string }>({
  rating: null,
  review: "",
});
const reviewErrors = reactive<{ rating: string; review: string }>({
  rating: "",
  review: "",
});
const submittingReview = ref(false);

const deletingId = ref<string | null>(null)

async function onDeleteReview(reviewId: string) {
  if (!reviewId) return
  try {
    const ok = confirm('¿Eliminar esta reseña? Esta acción no se puede deshacer.')
    if (!ok) return
    deletingId.value = reviewId
    await hotelService.deleteHotelReview(reviewId)
    toast.success('Reseña eliminada')
    await refreshReviews()
    await refreshHotel()
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo eliminar la reseña'
    toast.error('Error', { description: msg })
  } finally {
    deletingId.value = null
  }
}

function validateReview() {
  reviewErrors.rating = ![1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].includes(
    Number(reviewForm.rating)
  )
    ? "Elige una valoración (puede ser 0.5)."
    : "";
  const txt = reviewForm.review.trim();
  reviewErrors.review = !txt ? "La reseña es requerida." : "";
  return !reviewErrors.rating && !reviewErrors.review;
}

async function onSubmitReview() {
  if (!validateReview()) return;
  try {
    submittingReview.value = true;
    await hotelService.createHotelReview({
      hotelId: id,
      review: reviewForm.review.trim(),
      rating: Number(reviewForm.rating),
    });
    toast.success("¡Gracias por tu reseña!");
    reviewForm.rating = null;
    reviewForm.review = "";
    await refreshReviews();
    await refreshHotel();
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo publicar la reseña";
    toast.error("Error", { description: msg });
  } finally {
    submittingReview.value = false;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-GT", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function starFill(i: number, r: number) {
  const diff = r - (i - 1);
  if (diff >= 1) return 100;
  if (diff >= 0.5) return 50;
  return 0;
}

const rating = computed(() => {
  const r = (hotel.value as any)?.rating;
  const n = Number(r);
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
});
const roundedRating = computed(() => Math.round(rating.value));
const hasRating = computed(() => rating.value > 0);
const displayRating = computed(() => rating.value.toFixed(1));
</script>
