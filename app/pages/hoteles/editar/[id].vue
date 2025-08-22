<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <div class="mb-4">
      <Button size="sm" variant="secondary" to="/hoteles"
        >← Regresar</Button
      >
    </div>
    <div
      v-if="loadingHotel"
      class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700"
    >
      Cargando hotel…
    </div>
    <div
      v-else-if="loadingHotelError"
      class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600"
    >
      Ocurrió un error al cargar el hotel.
    </div>
    <Card
      v-else
      variant="elevated"
      title="Editar hotel"
      subtitle="Actualiza la información y guarda los cambios"
    >
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Nombre -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.name"
            label="Nombre *"
            placeholder="Ej. Hotel La Terraza"
            :error="errors.name"
            size="md"
          />
        </div>

        <!-- Imagen (URL) -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.image"
            label="Imagen (URL) *"
            placeholder="https://…"
            :error="errors.image"
            size="md"
          />
          <div v-if="form.image" class="mt-2">
            <img
              :src="form.image"
              alt="Vista previa"
              class="h-40 w-full rounded-md border border-sand-300 object-cover"
              @error="onImageError"
            />
          </div>
          <p v-if="imageError" class="mt-1 text-xs text-terra-500">
            {{ imageError }}
          </p>
        </div>

        <!-- Descripción -->
        <div class="sm:col-span-2">
          <label class="mb-1 block text-sm font-medium text-brand-800"
            >Descripción *</label
          >
          <textarea
            v-model="form.description"
            :maxlength="300"
            placeholder="Describe brevemente el hotel (máx. 300 caracteres)"
            class="block h-28 w-full rounded-md border border-sand-300 bg-white p-3 text-base text-brand-800 placeholder-brand-700/50 focus:border-brand-600 focus:outline-none focus:ring-0"
          ></textarea>
          <div class="mt-1 flex justify-between text-xs">
            <span v-if="errors.description" class="text-terra-500">{{
              errors.description
            }}</span>
            <span class="text-brand-700"
              >{{ form.description.length }}/300</span
            >
          </div>
        </div>

        <!-- Dirección -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.address"
            label="Dirección *"
            placeholder="Ej. 4a calle, Antigua Guatemala"
            :error="errors.address"
            size="md"
          />
        </div>

        <!-- Restaurante asociado (opcional) -->
        <div class="sm:col-span-2">
          <div class="flex items-end gap-2">
            <div class="flex-1">
              <Select
                v-model="form.restaurantId"
                :options="restaurantOptions"
                label="Restaurante asociado (opcional)"
                placeholder="Selecciona un restaurante…"
                clearable
                size="md"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              class="whitespace-nowrap"
              :disabled="!form.restaurantId"
              @click="form.restaurantId = null"
            >
              Limpiar
            </Button>
          </div>
        </div>

        <!-- Acciones -->
        <div
          class="sm:col-span-2 flex flex-wrap items-center justify-between gap-2"
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            :disabled="!isDirty"
            @click="onRestore"
            title="Restaurar valores originales"
          >
            Restaurar
          </Button>
          <div class="ml-auto flex items-center gap-2">
            <Button variant="secondary" to="/hoteles">Cancelar</Button>
            <Button variant="primary" :loading="saving" type="submit"
              >Guardar</Button
            >
          </div>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { reactive, ref, computed, watchEffect } from "vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useHotelService } from "~/services/hotels";
import { useRestaurantService, type Restaurant } from "~/services/restaurants";
import { useToast } from "~/composables/useToast";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import Select from "~/components/ui/Select.vue";
import InputText from "~/components/ui/InputText.vue";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER];
const canManageHotels = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const toast = useToast();
const route = useRoute();
const hotelService = useHotelService();
const restaurantService = useRestaurantService();
const hotelId = String(route.params.id);

type HotelForm = {
  image: string;
  description: string;
  restaurantId: string | null;
  name: string;
  address: string;
};

const form = reactive<HotelForm>({
  image: "",
  description: "",
  restaurantId: null,
  name: "",
  address: "",
});

const original = ref<HotelForm | null>(null);
const errors = reactive<Record<string, string>>({
  image: "",
  description: "",
  name: "",
  address: "",
});
const saving = ref(false);
const imageError = ref<string>("");

// Cargar detalle del hotel
const {
  data: hotel,
  pending: loadingHotel,
  error: loadingHotelError,
} = await useAsyncData(
  `hotel:${hotelId}`,
  () => hotelService.getById(hotelId),
  { server: true }
);

// Inicializar formulario con datos del hotel
watchEffect(() => {
  if (hotel.value) {
    const h: any = hotel.value;
    form.image = h.image ?? "";
    form.description = h.description ?? "";
    form.restaurantId = h.restaurantId ?? null;
    form.name = h.name ?? "";
    form.address = h.address ?? "";
    // snapshot original (una sola vez)
    if (!original.value) {
      original.value = JSON.parse(JSON.stringify(form));
    }
  }
});

// Cargar restaurantes para el select
const { data: restaurantsData } = await useAsyncData(
  "restaurants:select",
  () => restaurantService.getAll(),
  { server: true }
);
const restaurantOptions = computed(() =>
  (restaurantsData.value || []).map((r: Restaurant) => ({
    label: r.name,
    value: r.id,
  }))
);

const isDirty = computed(
  () => JSON.stringify(form) !== JSON.stringify(original.value)
);

function validate() {
  errors.image = form.image.trim() ? "" : "Requerido";
  errors.description = form.description.trim()
    ? form.description.length <= 300
      ? ""
      : "Máximo 300 caracteres"
    : "Requerido";
  errors.name = form.name.trim()
    ? form.name.length <= 100
      ? ""
      : "Máximo 100 caracteres"
    : "Requerido";
  errors.address = form.address.trim()
    ? form.address.length <= 255
      ? ""
      : "Máximo 255 caracteres"
    : "Requerido";
  return Object.values(errors).every((v) => !v);
}

function onImageError() {
  imageError.value = "No se pudo cargar la imagen (URL inválida o inaccesible)";
}

function onRestore() {
  if (original.value) {
    Object.assign(form, JSON.parse(JSON.stringify(original.value)));
    toast.info("Restaurado", {
      description: "Se restauraron los valores originales.",
    });
    imageError.value = "";
  }
}

async function onSubmit() {
  imageError.value = "";
  if (!validate()) return;
  try {
    saving.value = true;
    await hotelService.update(hotelId, {
      image: form.image.trim(),
      description: form.description.trim(),
      restaurantId: form.restaurantId || undefined,
      name: form.name.trim(),
      address: form.address.trim(),
    });
    toast.success("Hotel actualizado", { description: form.name });
    navigateTo("/hoteles");
  } finally {
    saving.value = false;
  }
}
</script>
