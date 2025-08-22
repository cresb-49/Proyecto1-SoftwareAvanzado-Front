<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" :to="cancelPath">← Regresar</Button>
      <div class="text-sm text-brand-700" v-if="roomHotelName">
        Hotel: <span class="font-medium text-brand-900">{{ roomHotelName }}</span>
      </div>
    </div>

    <div v-if="loadingRoom" class="rounded-xl border border-sand-300 bg-white p-5 text-brand-700">
      Cargando habitación…
    </div>
    <div v-else-if="loadingError" class="rounded-xl border border-terra-500 bg-white p-5 text-terra-600">
      Ocurrió un error al cargar la habitación.
    </div>

    <Card v-else variant="elevated" title="Editar habitación" subtitle="Actualiza la información y guarda los cambios">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Número -->
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
            <Button variant="secondary" :to="cancelPath">Cancelar</Button>
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
import { useToast } from "~/composables/useToast";
import { useRoomService } from "~/services/rooms";
import { useHotelService } from "~/services/hotels";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import InputNumber from "~/components/ui/InputNumber.vue";
import InputCurrency from "~/components/ui/InputCurrency.vue";

// Roles
const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.HOTEL_MANAGER];
const canManageHotels = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

// Services & route
const route = useRoute();
const roomService = useRoomService();
const hotelService = useHotelService();
const toast = useToast();
const roomId = String(route.params.id);

type RoomForm = {
  number: number | null;
  price: number | null;
  maintenancePrice: number | null;
  hotelId?: string | null;
};

const form = reactive<RoomForm>({
  number: null,
  price: null,
  maintenancePrice: null,
  hotelId: null,
});

const original = ref<RoomForm | null>(null);
const errors = reactive<Record<string, string>>({
  number: "",
  price: "",
  maintenancePrice: "",
});
const saving = ref(false);

// Cargar habitación
const {
  data: room,
  pending: loadingRoom,
  error: loadingError,
} = await useAsyncData(() => `room:${roomId}`, () => roomService.getById(roomId), { server: true });

// Nombre del hotel (si viene hotelId en la room)
const roomHotelName = ref<string>("");
watchEffect(async () => {
  if (room.value) {
    const r: any = room.value;
    form.number = r.number ?? null;
    form.price = r.price ?? null;
    form.maintenancePrice = r.maintenancePrice ?? null;
    form.hotelId = r.hotelId ?? null;
    // snapshot original una vez
    if (!original.value) {
      original.value = JSON.parse(JSON.stringify(form));
    }
    // cargar nombre del hotel
    if (form.hotelId) {
      try {
        const h = await hotelService.getById(String(form.hotelId));
        roomHotelName.value = (h as any)?.name || "";
      } catch {
        roomHotelName.value = "";
      }
    } else {
      roomHotelName.value = "";
    }
  }
});

const cancelPath = computed(() =>
  form.hotelId ? `/hoteles/habitaciones/${form.hotelId}` : "/hoteles"
);

const isDirty = computed(() => JSON.stringify(form) !== JSON.stringify(original.value));

function validate() {
  const num = Number(form.number);
  errors.number =
    Number.isFinite(num) && Number.isInteger(num) && num > 0 ? "" : "Debe ser un entero mayor a 0";

  const price = Number(form.price);
  errors.price = Number.isFinite(price) && price > 0 ? "" : "Debe ser mayor a 0";

  const mant = Number(form.maintenancePrice);
  errors.maintenancePrice = Number.isFinite(mant) && mant > 0 ? "" : "Debe ser mayor a 0";

  return Object.values(errors).every((v) => !v);
}

function onRestore() {
  if (original.value) {
    Object.assign(form, JSON.parse(JSON.stringify(original.value)));
    toast.info("Restaurado", { description: "Se restauraron los valores originales." });
  }
}

async function onSubmit() {
  if (!validate()) return;
  try {
    saving.value = true;
    await roomService.update(roomId, {
      number: Number(form.number),
      price: Number(form.price),
      maintenancePrice: Number(form.maintenancePrice),
    });
    toast.success("Habitación actualizada", { description: `#${form.number}` });
    navigateTo(cancelPath.value);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped></style>