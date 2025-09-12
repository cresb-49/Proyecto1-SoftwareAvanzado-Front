<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4">
      <Button size="sm" variant="secondary" to="/restaurantes">← Regresar</Button>
    </div>

    <!-- Estados -->
    <div v-if="loadingRestaurant" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">
      Cargando restaurante…
    </div>
    <div v-else-if="loadingError" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">
      Ocurrió un error al cargar el restaurante.
    </div>

    <!-- Formulario -->
    <Card v-else variant="elevated" title="Editar restaurante" subtitle="Actualiza la información y guarda los cambios">
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
        <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-2">
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
            <Button variant="secondary" to="/restaurantes">Cancelar</Button>
            <Button variant="primary" :loading="saving" type="submit">Guardar</Button>
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
import { useRestaurantService } from "~/services/restaurants";
import { useToast } from "~/composables/useToast";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import InputText from "~/components/ui/InputText.vue";

import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { useEmployeeService } from '~/services/employee'

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_MANAGER];
const canManageRestaurants = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

// Auth & employee context
const { user } = useAuth()
const employeeService = useEmployeeService()

const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]))
const isRestaurantManager = computed(() => hasAnyRole([Roles.RESTAURANT_MANAGER]))

// Cargar empleado actual (para validar asignación al restaurante)
const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ''}`,
  () => (user.value?.employeeId ? employeeService.getById(String(user.value.employeeId)) : Promise.resolve(null))
)

const toast = useToast();
const route = useRoute();
const restaurantService = useRestaurantService();
const restaurantId = String(route.params.id);

// Si es RESTAURANT_MANAGER, verificar que esté asignado al restaurante actual
watchEffect(() => {
  // Si no tiene roles permitidos, ya se redirige arriba
  if (!canManageRestaurants.value) return

  if (isRestaurantManager.value) {
    const assignedRestaurantId = (employeeData.value as any)?.restaurantId
    if (assignedRestaurantId && assignedRestaurantId !== restaurantId) {
      navigateTo('/')
    }
  }
})

// Inicializar formulario
type RestaurantForm = {
  image: string;
  description: string;
  name: string;
  address: string;
};

const form = reactive<RestaurantForm>({
  image: "",
  description: "",
  name: "",
  address: "",
});

const original = ref<RestaurantForm | null>(null);
const errors = reactive<Record<string, string>>({
  image: "",
  description: "",
  name: "",
  address: "",
});
const saving = ref(false);
const imageError = ref<string>("");

// Cargar detalle del restaurante
const {
  data: restaurant,
  pending: loadingRestaurant,
  error: loadingError,
} = await useAsyncData(
  () => `restaurant:${restaurantId}`,
  () => restaurantService.getById(restaurantId),
  { server: true }
);

// Inicializar formulario
watchEffect(() => {
  if (restaurant.value) {
    const r: any = restaurant.value;
    form.image = r.image ?? "";
    form.description = r.description ?? "";
    form.name = r.name ?? "";
    form.address = r.address ?? "";
    if (!original.value) {
      original.value = JSON.parse(JSON.stringify(form));
    }
  }
});

const isDirty = computed(() => JSON.stringify(form) !== JSON.stringify(original.value));

function validate() {
  errors.image = form.image.trim() ? "" : "Requerido";
  errors.description = form.description.trim()
    ? form.description.length <= 300
      ? ""
      : "Máximo 300 caracteres"
    : "Requerido";
  // name: min 3, max 100
  const nameLen = form.name.trim().length;
  errors.name = nameLen === 0
    ? "Requerido"
    : nameLen < 3
      ? "Mínimo 3 caracteres"
      : nameLen > 100
        ? "Máximo 100 caracteres"
        : "";
  // address: min 3, max 200
  const addrLen = form.address.trim().length;
  errors.address = addrLen === 0
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

function onRestore() {
  if (original.value) {
    Object.assign(form, JSON.parse(JSON.stringify(original.value)));
    toast.info("Restaurado", { description: "Se restauraron los valores originales." });
    imageError.value = "";
  }
}

async function onSubmit() {
  imageError.value = "";
  if (!validate()) return;
  try {
    saving.value = true;
    await restaurantService.update(restaurantId, {
      image: form.image.trim(),
      description: form.description.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
    });
    toast.success("Restaurante actualizado", { description: form.name });
    navigateTo("/restaurantes");
  } finally {
    saving.value = false;
  }
}
</script>