<template>
  <div class="mx-auto max-w-3xl px-4 py-6">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/reservaciones"
        >← Regresar</Button
      >
      <div />
    </div>

    <Card
      variant="elevated"
      title="Crear reservación"
      subtitle="Completa la información requerida"
    >
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Cliente por NIT o Consumidor final -->
        <div class="sm:col-span-2 grid gap-3">
          <div class="flex items-end gap-3">
            <InputText
              v-model="form.nit"
              label="NIT"
              placeholder="5489721-K"
              :error="errors.nit"
              size="md"
              class="flex-1"
            />
            <Button
              variant="info"
              size="sm"
              @click="lookupByNit"
              :loading="searching"
              :disabled="!form.nit"
              >Buscar</Button
            >
            <Button
              variant="success"
              size="sm"
              @click="createClient"
              :loading="creating"
              :disabled="!form.nit || foundClient"
              >Crear cliente</Button
            >
            <Button variant="warning" size="sm" @click="useConsumerFinal"
              >Consumidor final</Button
            >
          </div>
          <p v-if="foundClient" class="text-sm text-sage-500">
            Cliente encontrado para NIT:
            <strong class="text-brand-900">{{ form.nit }}</strong>
          </p>
          <p v-else-if="form.nit && !searching" class="text-xs text-brand-700">
            No se encontró cliente con ese NIT. Puedes crearlo o usar
            “Consumidor final”.
          </p>
          <div
            v-if="showCreateForm && !foundClient && form.nit"
            class="rounded-md border border-sand-300 p-3 grid gap-3 sm:grid-cols-2"
          >
            <InputText
              v-model="clientForm.firstName"
              label="Nombre *"
              placeholder="Nombre"
              :error="clientErrors.firstName"
              size="md"
            />
            <InputText
              v-model="clientForm.lastName"
              label="Apellido *"
              placeholder="Apellido"
              :error="clientErrors.lastName"
              size="md"
            />
            <div class="sm:col-span-2 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                @click="showCreateForm = false"
                >Cancelar</Button
              >
              <Button
                variant="success"
                size="sm"
                @click="saveClient"
                :loading="creating"
                >Guardar cliente</Button
              >
            </div>
          </div>
        </div>

        <!-- Datos de contacto (solo cuando NIT vacío / consumidor final) -->
        <div v-if="!form.nit" class="sm:col-span-2 grid gap-3 sm:grid-cols-2">
          <InputText
            v-model="form.contactName"
            label="Nombre de contacto *"
            :error="errors.contactName"
            size="md"
          />
          <InputText
            v-model="form.contactPhone"
            label="Teléfono de contacto *"
            placeholder="8 dígitos"
            :error="errors.contactPhone"
            size="md"
          />
          <InputText
            v-model="form.contactEmail"
            label="Correo de contacto *"
            placeholder="correo@ejemplo.com"
            :error="errors.contactEmail"
            size="md"
            class="sm:col-span-2"
          />
          <InputText
            v-model="form.contactIDNumber"
            label="Documento de identificación *"
            :error="errors.contactIDNumber"
            size="md"
            class="sm:col-span-2"
          />
          <p class="sm:col-span-2 text-xs text-brand-700">
            * Requeridos solo cuando no se proporciona NIT (consumidor final).
          </p>
        </div>

        <!-- Hotel (desde URL o seleccionable) -->
        <div class="sm:col-span-2" v-if="fixedHotel">
          <label class="mb-1 block text-sm font-medium text-brand-800"
            >Hotel *</label
          >
          <div
            class="flex items-center justify-between rounded-md border border-sand-300 bg-sand-50 px-3 py-2"
          >
            <div class="font-medium text-brand-900">
              {{ hotel?.name || "—" }}
            </div>
            <NuxtLink
              :to="`/hoteles/${form.hotelId}`"
              class="text-sm text-sapphire-700 hover:underline"
              >Ver hotel</NuxtLink
            >
          </div>
          <p v-if="errors.hotelId" class="mt-1 text-xs text-terra-500">
            {{ errors.hotelId }}
          </p>
        </div>
        <div class="sm:col-span-2" v-else>
          <Select
            v-model="form.hotelId"
            :options="hotelOptions"
            label="Hotel *"
            placeholder="Selecciona un hotel…"
            :error="errors.hotelId"
            size="md"
            clearable
          />
        </div>

        <!-- Habitación (depende de hotel) -->
        <div class="sm:col-span-2">
          <Select
            v-model="form.roomId"
            :options="roomOptions"
            label="Habitación *"
            placeholder="Selecciona una habitación…"
            :disabled="!form.hotelId"
            :error="errors.roomId"
            size="md"
            clearable
          />
        </div>

        <!-- Empleado (auto del usuario o manual si falta) -->
        <div class="sm:col-span-2">
          <template v-if="currentEmployeeId">
            <label class="mb-1 block text-sm font-medium text-brand-800"
              >Empleado *</label
            >
            <div
              class="rounded-md border border-sand-300 bg-sand-50 px-3 py-2 text-brand-900"
            >
              {{ currentEmployeeId }}
            </div>
          </template>
          <template v-else>
            <InputText
              v-model="form.employeeId"
              label="Empleado *"
              placeholder="UUID del empleado"
              :error="errors.employeeId"
              size="md"
            />
          </template>
          <p v-if="errors.employeeId" class="mt-1 text-xs text-terra-500">
            {{ errors.employeeId }}
          </p>
        </div>

        <!-- Fechas -->
        <div>
          <InputDate
            v-model="form.checkInDate"
            label="Check-in *"
            :error="errors.checkInDate"
            size="md"
          />
        </div>
        <div>
          <InputDate
            v-model="form.checkOutDate"
            label="Check-out *"
            :error="errors.checkOutDate"
            size="md"
          />
        </div>

        <!-- Resumen -->
        <div class="sm:col-span-2 text-sm text-brand-700">
          <p>
            Noche(s): <strong class="text-brand-900">{{ nights }}</strong>
          </p>
          <p v-if="selectedRoomPrice !== null">
            Tarifa por noche:
            <strong class="text-brand-900">{{
              formatCurrency(selectedRoomPrice)
            }}</strong>
          </p>
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 flex items-center justify-end gap-2">
          <Button variant="secondary" to="/reservaciones">Cancelar</Button>
          <Button variant="primary" :loading="saving" type="submit"
            >Guardar</Button
          >
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { reactive, ref, computed, watch, watchEffect } from "vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles, useAuth } from "#imports";
import { useHotelService } from "~/services/hotels";
import { useRoomService } from "~/services/rooms";
import { useReservationService } from "~/services/reservations";
import { useClientService } from "~/services/client";
import { useToast } from "~/composables/useToast";
import { useEmployeeService } from "~/services/employee";

import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import Select from "~/components/ui/Select.vue";
import InputDate from "~/components/ui/InputDate.vue";
import InputText from "~/components/ui/InputText.vue";

const route = useRoute();
const { user } = useAuth();

const { hasAnyRole, redirectIfUnauthorized, boolToRedirect } = useUseRoles();
const permitedRoles = [
  Roles.ADMIN,
  Roles.HOTEL_MANAGER,
  Roles.CUSTOMER,
  Roles.HOTEL_EMPLOYEE,
];

const hotelId = String(route.query.hotelId);

const canManage = computed(() => hasAnyRole(permitedRoles));
const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]));
const isCustomer = computed(() => hasAnyRole([Roles.CUSTOMER]));
const isHotelEmployee = computed(() =>
  hasAnyRole([Roles.HOTEL_EMPLOYEE, Roles.HOTEL_MANAGER])
);
redirectIfUnauthorized(permitedRoles, "/");
const employeeSvc = useEmployeeService();
const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ""}`,
  () =>
    user.value?.employeeId
      ? employeeSvc.getById(String(user.value.employeeId))
      : Promise.resolve(null)
);
boolToRedirect(
  employeeData.value?.hotelId !== hotelId && isHotelEmployee.value,
  "/"
);

const toast = useToast();
const hotelService = useHotelService();
const roomService = useRoomService();
const reservationService = useReservationService();
const clientService = useClientService();
const foundClient = ref<any | null>(null);
const searching = ref(false);
const creating = ref(false);
const showCreateForm = ref(false);
const clientForm = reactive<{ firstName: string; lastName: string }>({
  firstName: "",
  lastName: "",
});
const clientErrors = reactive<{ firstName: string; lastName: string }>({
  firstName: "",
  lastName: "",
});

// Empleado actual (desde auth)
const currentEmployeeId = computed<string | null>(() => {
  const u: any = user?.value;
  return (u?.employeeId || u?.id || null) as string | null;
});

const form = reactive<{
  nit: string | null;
  hotelId: string | null;
  roomId: string | null;
  employeeId: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactIDNumber: string | null;
}>({
  nit: null,
  hotelId: (route.query.hotelId as string) || null,
  roomId: null,
  employeeId: null,
  checkInDate: null,
  checkOutDate: null,
  contactName: null,
  contactPhone: null,
  contactEmail: null,
  contactIDNumber: null,
});

const errors = reactive<Record<string, string>>({
  nit: "",
  hotelId: "",
  roomId: "",
  employeeId: "",
  checkInDate: "",
  checkOutDate: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactIDNumber: "",
});
const saving = ref(false);

// Cargar hotel si viene por URL y opciones si no
const fixedHotel = computed(() => !!form.hotelId);
const { data: hotel } = await useAsyncData(
  () => `hotel:for-reservation:${String(form.hotelId || "")}`,
  () =>
    form.hotelId
      ? hotelService.getById(String(form.hotelId))
      : Promise.resolve(null),
  { server: true }
);

const { data: hotelsData } = await useAsyncData(
  "hotels:select:reservations",
  () => (!fixedHotel.value ? hotelService.getAll?.() : Promise.resolve(null)),
  { server: true }
);
const hotelOptions = computed(() => {
  const val = hotelsData.value as any;
  const items = Array.isArray(val) ? val : val?.items || [];
  return items.map((h: any) => ({ label: h.name, value: h.id }));
});

// Rooms por hotel
const { data: roomsData, refresh: refreshRooms } = await useAsyncData(
  () => `rooms:by-hotel:${String(form.hotelId || "")}`,
  () =>
    form.hotelId
      ? roomService.getByHotel(String(form.hotelId))
      : Promise.resolve([]),
  { watch: [() => form.hotelId] }
);
const roomOptions = computed(() => {
  const rooms = (roomsData.value || []) as any[];
  return rooms.map((r) => ({
    label: `#${r.number} — ${formatCurrency(Number(r.price))}`,
    value: r.id,
    price: Number(r.price),
  }));
});

// Precio de la habitación seleccionada
const selectedRoomPrice = computed<number | null>(() => {
  const found: any = roomOptions.value.find(
    (o: any) => o.value === form.roomId
  );
  return found ? Number(found.price) : null;
});

// Cálculo de noches
const nights = computed(() => {
  if (!form.checkInDate || !form.checkOutDate) return 0;
  const start = new Date(form.checkInDate as string);
  const end = new Date(form.checkOutDate as string);
  const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 ? Math.floor(diff) : 0;
});

// Helpers
const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
});
const formatCurrency = (n: number) => currency.format(n || 0);

async function lookupByNit() {
  if (!form.nit) {
    errors.nit = "Requerido";
    return;
  }
  errors.nit = "";
  foundClient.value = null;
  try {
    searching.value = true;
    const res = await clientService.getByNit(String(form.nit));
    foundClient.value = res || null;
    if (!foundClient.value) {
      toast.info("No se encontró cliente con ese NIT");
    } else {
      toast.success("Cliente encontrado");
    }
  } catch (e: any) {
    foundClient.value = null;
    toast.info("No se encontró cliente con ese NIT");
  } finally {
    searching.value = false;
  }
}

function createClient() {
  if (!form.nit) { errors.nit = 'Requerido'; return; }
  showCreateForm.value = true;
}

function validateClient() {
  clientErrors.firstName = clientForm.firstName.trim() ? "" : "Requerido";
  clientErrors.lastName = clientForm.lastName.trim() ? "" : "Requerido";

  if (!form.nit) {
    errors.nit = "Requerido";
  } else if (String(form.nit).length > 20) {
    errors.nit = "Máximo 20 caracteres";
  } else {
    errors.nit = "";
  }
  return !clientErrors.firstName && !clientErrors.lastName && !errors.nit;
}

async function saveClient() {
  if (!validateClient()) return;
  try {
    creating.value = true;
    const created = await clientService.create({
      firstName: clientForm.firstName.trim(),
      lastName: clientForm.lastName.trim(),
      nit: String(form.nit),
    });
    foundClient.value = created || { nit: form.nit };
    toast.success("Cliente creado");
    showCreateForm.value = false;
  } catch (e: any) {
    toast.error("No se pudo crear el cliente");
  } finally {
    creating.value = false;
  }
}

function useConsumerFinal() {
  form.nit = null;
  foundClient.value = null;
  showCreateForm.value = false;
  clientForm.firstName = "";
  clientForm.lastName = "";
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validate() {
  errors.hotelId = form.hotelId ? "" : "Requerido";
  errors.roomId = form.roomId ? "" : "Requerido";
  const emp = currentEmployeeId.value ?? form.employeeId;
  errors.employeeId = emp ? "" : "Requerido";

  errors.checkInDate = form.checkInDate ? "" : "Requerido";
  errors.checkOutDate = form.checkOutDate ? "" : "Requerido";

  if (form.checkInDate && form.checkOutDate) {
    const start = new Date(form.checkInDate as string);
    const end = new Date(form.checkOutDate as string);
    if (start.getTime() > end.getTime()) {
      errors.checkOutDate = "Debe ser igual o posterior al check-in";
    }
  }

  // NIT o Consumidor final (contacto requerido)
  if (!form.nit) {
    const cn = (form.contactName || "").trim();
    const cp = (form.contactPhone || "").trim();
    const ce = (form.contactEmail || "").trim();
    const ci = (form.contactIDNumber || "").trim();

    errors.contactName = cn ? "" : "Requerido";
    errors.contactPhone = /^\d{8}$/.test(cp) ? "" : "Debe tener 8 dígitos";
    errors.contactEmail = ce && isEmailValid(ce) ? "" : "Correo inválido";
    errors.contactIDNumber = ci ? "" : "Requerido";
  } else {
    errors.nit = "";
    errors.contactName = "";
    errors.contactPhone = "";
    errors.contactEmail = "";
    errors.contactIDNumber = "";
  }

  return Object.values(errors).every((v) => !v);
}

async function onSubmit() {
  if (!validate()) return;

  try {
    // Validar que el empleado pertenezca al hotel (excepto ADMIN/CUSTOMER)
    const empId = currentEmployeeId.value ?? form.employeeId;
    if (!isAdmin.value && !isCustomer.value) {
      if (!empId) {
        errors.employeeId = "Requerido";
        return;
      }
      if (!form.hotelId) {
        errors.hotelId = "Requerido";
        return;
      }
      try {
        const emp: any = await employeeSvc.getById(String(empId));
        const empHotelId = emp?.hotelId ?? null;
        if (!empHotelId || empHotelId !== String(form.hotelId)) {
          toast.error(
            "No tienes permiso para crear reservaciones en este hotel"
          );
          navigateTo("/reservaciones");
          return;
        }
      } catch (e) {
        toast.error("No se pudo validar el empleado");
        navigateTo("/reservaciones");
        return;
      }
    }

    saving.value = true;
    await reservationService.create({
      hotelId: String(form.hotelId),
      roomId: String(form.roomId),
      employeeId: String(empId || ""),
      nit: form.nit ? String(form.nit) : null,
      checkInDate: new Date(String(form.checkInDate)).toISOString(),
      checkOutDate: new Date(String(form.checkOutDate)).toISOString(),
      contactName: form.nit ? null : form.contactName || null,
      contactPhone: form.nit ? null : form.contactPhone || null,
      contactEmail: form.nit ? null : form.contactEmail || null,
      contactIDNumber: form.nit ? null : form.contactIDNumber || null,
    });

    toast.success("Reservación creada");
    navigateTo("/reservaciones");
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped></style>
