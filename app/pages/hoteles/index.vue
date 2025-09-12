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
        <h2 class="text-xl font-semibold text-brand-900">Hoteles</h2>
        <Button
          v-if="canManageHotels && !isHotelManager"
          variant="primary"
          size="sm"
          to="/hoteles/crear"
        >
          Crear hotel
        </Button>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <template v-for="hotel in hotels" :key="hotel.id">
          <Card :img="hotel.image">
            <template #header>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-base font-semibold text-brand-900">
                    {{ hotel.name }}
                  </h3>
                  <p class="text-sm text-brand-700">{{ hotel.address }}</p>
                </div>
                <div class="flex items-center gap-1" aria-label="Calificación">
                  <svg
                    v-for="i in 5"
                    :key="i"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    :class="
                      i <= rounded(hotel.rating)
                        ? 'text-gold-500'
                        : 'text-sand-300'
                    "
                  >
                    <path
                      d="M12 17.3l6.18 3.7-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l4.46 4.73L5.82 21z"
                    />
                  </svg>
                  <span
                    v-if="clamp5(hotel?.rating) > 0"
                    class="ml-1 text-xs text-brand-700"
                    >{{ displayRating(hotel.rating) }}</span
                  >
                </div>
              </div>
            </template>

            <p class="text-sm text-brand-800">
              {{ hotel.description }}
            </p>
            <template #footer>
              <div class="flex items-center justify-between">
                <div />
                <div class="flex items-center gap-2">
                  <Button size="sm" variant="info" :to="`/hoteles/${hotel.id}`"
                    >Ver</Button
                  >
                  <Button
                    v-if="canManageHotels"
                    size="sm"
                    variant="warning"
                    :to="`/hoteles/editar/${hotel.id}`"
                  >
                    Editar
                  </Button>
                  <Button
                    v-if="canManageHotels"
                    size="sm"
                    variant="warning"
                    :to="`/hoteles/habitaciones/${hotel.id}`"
                  >
                    Habitaciones
                  </Button>
                </div>
              </div>
            </template>
          </Card>
        </template>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useHotelService } from "~/services/hotels";
import { Roles } from "#imports";
import { useAuth } from "#imports";
import { useUseRoles } from "~/composables/useRoles";
import { useEmployeeService } from "~/services/employee";

const clamp5 = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(5, Math.max(0, n)) : 0;
};
const rounded = (v: any) => Math.round(clamp5(v));
const displayRating = (v: any) => clamp5(v).toFixed(1);

const hotelService = useHotelService();
const employeeService = useEmployeeService();
const { user } = useAuth();
const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const { isLoggedIn } = useAuth();

// roles permitidos para gestionar hoteles
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER];
const canManageHotels = computed(() => hasAnyRole(permitedRoles));
const isHotelManager = computed(() => hasAnyRole([Roles.HOTEL_MANAGER]));

const {
  data: hotels,
  pending: loadingHotels,
  error: loadingHotelsError,
  refresh: refreshHotels,
} = await useAsyncData('hotels:list-or-single', async () => {
  // Si es HOTEL_MANAGER, mostrar únicamente el hotel asignado
  if (isHotelManager.value) {
    const empId = user.value?.employeeId
    if (!empId) return []
    const emp = await employeeService.getById(String(empId))
    if (!emp?.hotelId) return []
    const h = await hotelService.getById(String(emp.hotelId))
    return h ? [h] : []
  }
  // De lo contrario (ADMIN u otros roles con permiso), listar todos
  return await hotelService.getAll()
}, { server: true })
</script>
