<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button
        size="sm"
        variant="secondary"
        :to="cancelPath"
      >← Regresar</Button>
      <div />
    </div>

    <Card variant="elevated" title="Crear habitación" subtitle="Completa la información requerida">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Hotel (desde URL) -->
        <div class="sm:col-span-2">
          <label class="mb-1 block text-sm font-medium text-brand-800">Hotel *</label>
          <div class="flex items-center justify-between rounded-md border border-sand-300 bg-sand-50 px-3 py-2">
            <div class="font-medium text-brand-900">
              {{ hotel?.name || '—' }}
            </div>
            <NuxtLink
              v-if="form.hotelId"
              :to="`/hoteles/${form.hotelId}`"
              class="text-sm text-sapphire-700 hover:underline"
            >
              Ver hotel
            </NuxtLink>
          </div>
          <p v-if="errors.hotelId" class="mt-1 text-xs text-terra-500">{{ errors.hotelId }}</p>
        </div>

        <!-- Número de habitación -->
        <div>
          <InputNumber
            v-model="form.number"
            label="Número *"
            :min="1"
            :step="1"
            :error="errors.number"
            size="md"
          />
        </div>

        <!-- Precio -->
        <div>
          <InputCurrency
            v-model="form.price"
            label="Precio *"
            currency="GTQ"
            locale="es-GT"
            :error="errors.price"
            size="md"
          />
        </div>

        <!-- Mantenimiento -->
        <div class="sm:col-span-2">
          <InputCurrency
            v-model="form.maintenancePrice"
            label="Precio de mantenimiento *"
            currency="GTQ"
            locale="es-GT"
            :error="errors.maintenancePrice"
            size="md"
          />
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 flex items-center justify-end gap-2">
          <Button variant="secondary" :to="cancelPath">Cancelar</Button>
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
import { useHotelService } from "~/services/hotels";
import { useToast } from "~/composables/useToast";
import { useRoomService } from "~/services/rooms";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import Select from "~/components/ui/Select.vue";
import InputNumber from "~/components/ui/InputNumber.vue";
import InputCurrency from "~/components/ui/InputCurrency.vue";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER];
const canManageHotels = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const toast = useToast();
const hotelService = useHotelService();
const roomService = useRoomService();
const route = useRoute();

// Form state
const form = reactive<{
  hotelId: string | null;
  number: number | null;
  price: number | null;
  maintenancePrice: number | null;
}>({
  hotelId: (route.query.hotelId as string) || null,
  number: null,
  price: null,
  maintenancePrice: null,
});

const errors = reactive<Record<string, string>>({
  hotelId: "",
  number: "",
  price: "",
  maintenancePrice: "",
});
const saving = ref(false);

// Cargar información del hotel especificado en la URL (?hotelId=)
const { data: hotel } = await useAsyncData(
  () => `hotel:for-room-create:${String(form.hotelId || '')}`,
  () => form.hotelId ? hotelService.getById(String(form.hotelId)) : Promise.resolve(null),
  { server: true }
);

const cancelPath = computed(() => form.hotelId ? `/hoteles/habitaciones/${form.hotelId}` : "/hoteles")

function validate() {
  errors.hotelId = form.hotelId && String(form.hotelId).trim() ? "" : "Requerido";

  const num = Number(form.number)
  errors.number =
    Number.isFinite(num) && Number.isInteger(num) && num > 0 ? "" : "Debe ser un entero mayor a 0";

  const price = Number(form.price)
  errors.price =
    Number.isFinite(price) && price > 0 ? "" : "Debe ser mayor a 0";

  const mant = Number(form.maintenancePrice)
  errors.maintenancePrice =
    Number.isFinite(mant) && mant > 0 ? "" : "Debe ser mayor a 0";

  return Object.values(errors).every((v) => !v);
}

async function onSubmit() {
  if (!validate()) return;
  try {
    saving.value = true;
    await roomService.create({
      hotelId: String(form.hotelId),
      number: Number(form.number),
      price: Number(form.price),
      maintenancePrice: Number(form.maintenancePrice),
    });
    toast.success("Habitación creada", { description: `#${form.number}` });
    navigateTo(cancelPath.value);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped></style>
