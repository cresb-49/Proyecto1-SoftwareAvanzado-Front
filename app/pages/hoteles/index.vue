<template>
  <div>
    <section>
      <div class="mb-4">
        <Button size="sm" variant="secondary" :to="isLoggedIn ? '/dashboard' : '/'"
          >← Regresar</Button
        >
      </div>
      <div class="mb-4 flex items-end justify-between">
        <h2 class="text-xl font-semibold text-brand-900">Hoteles</h2>
        <Button
          v-if="canManageHotels"
          variant="primary"
          size="sm"
          to="/hoteles/crear"
        >
          Crear hotel
        </Button>
      </div>
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Hotel 1 -->
        <template v-for="hotel in hotels" :key="hotel.id">
          <Card
            :img="hotel.image"
            :title="hotel.name"
            :subtitle="hotel.address"
          >
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

const hotelService = useHotelService();
const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const { isLoggedIn } = useAuth();

// roles permitidos para gestionar hoteles
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER];
const canManageHotels = computed(() => hasAnyRole(permitedRoles));

const {
  data: hotels,
  pending: loadingHotels,
  error: loadingHotelsError,
  refresh: refreshHotels,
} = await useAsyncData("hotels", () => hotelService.getAll());
</script>
