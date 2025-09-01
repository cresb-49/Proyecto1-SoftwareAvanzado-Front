<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4">
      <Button size="sm" variant="secondary" to="/restaurantes">← Regresar</Button>
    </div>

    <Card variant="elevated" title="Crear restaurante" subtitle="Completa la información requerida">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Nombre -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.name"
            label="Nombre *"
            placeholder="Ej. Café Canela"
            :error="errors.name"
            size="md"
          />
          <p v-if="errors.name" class="mt-1 text-xs text-terra-500">{{ errors.name }}</p>
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
          <p v-if="imageError" class="mt-1 text-xs text-terra-500">{{ imageError }}</p>
        </div>

        <!-- Descripción -->
        <div class="sm:col-span-2">
          <label class="mb-1 block text-sm font-medium text-brand-800">Descripción *</label>
          <textarea
            v-model="form.description"
            :maxlength="300"
            placeholder="Describe brevemente el restaurante (máx. 300 caracteres)"
            class="block h-28 w-full rounded-md border border-sand-300 bg-white p-3 text-base text-brand-800 placeholder-brand-700/50 focus:border-brand-600 focus:outline-none focus:ring-0"
          ></textarea>
          <div class="mt-1 flex justify-between text-xs">
            <span v-if="errors.description" class="text-terra-500">{{ errors.description }}</span>
            <span class="text-brand-700">{{ form.description.length }}/300</span>
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
          <p v-if="errors.address" class="mt-1 text-xs text-terra-500">{{ errors.address }}</p>
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 flex items-center justify-end gap-2">
          <Button variant="secondary" to="/restaurantes">Cancelar</Button>
          <Button variant="primary" :loading="saving" type="submit">Guardar</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { reactive, ref, computed } from "vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useRestaurantService } from "~/services/restaurants";
import { useToast } from "~/composables/useToast";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import InputText from "~/components/ui/InputText.vue";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_MANAGER];
const canManageRestaurants = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const toast = useToast();
const restaurantService = useRestaurantService();

const form = reactive<{
  image: string;
  description: string;
  name: string;
  address: string;
}>({
  image: "",
  description: "",
  name: "",
  address: "",
});

const errors = reactive<Record<string, string>>({
  image: "",
  description: "",
  name: "",
  address: "",
});

const saving = ref(false);
const imageError = ref<string>("");

function validate() {
  errors.image = form.image.trim() ? "" : "Requerido";
  errors.description = form.description.trim()
    ? form.description.length <= 300
      ? ""
      : "Máximo 300 caracteres"
    : "Requerido";

  // name: min 3, max 100
  const nameLen = form.name.trim().length;
  errors.name =
    nameLen === 0
      ? "Requerido"
      : nameLen < 3
      ? "Mínimo 3 caracteres"
      : nameLen > 100
      ? "Máximo 100 caracteres"
      : "";

  // address: min 3, max 200
  const addrLen = form.address.trim().length;
  errors.address =
    addrLen === 0
      ? "Requerido"
      : addrLen < 3
      ? "Mínimo 3 caracteres"
      : addrLen > 200
      ? "Máximo 200 caracteres"
      : "";

  return Object.values(errors).every((v) => !v);
}

function onImageError() {
  imageError.value = "No se pudo cargar la imagen (URL inválida o inaccesible)";
}

async function onSubmit() {
  imageError.value = "";
  if (!validate()) return;
  try {
    saving.value = true;
    await restaurantService.create({
      image: form.image.trim(),
      description: form.description.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
    });
    toast.success("Restaurante creado", { description: form.name });
    navigateTo("/restaurantes");
  } finally {
    saving.value = false;
  }
}
</script>