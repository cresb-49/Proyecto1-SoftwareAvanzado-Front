<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-brand-800">Reportes</h1>
        <p class="text-sm text-brand-700">
          Panel de reportes para administración y gerencia
        </p>
      </div>
    </header>

    <!-- Nota de permisos -->
    <div
      class="rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-sm text-brand-700"
    >
      Solo roles <span class="font-semibold">ADMIN</span> y
      <span class="font-semibold">MANAGER</span> pueden acceder a estos
      reportes.
    </div>

    <!-- Menú de reportes -->
    <div class="grid gap-4">
      <!-- Cliente: Actividad -->
      <Card
        variant="outline"
        title="Actividad de cliente"
        subtitle="Transacciones asociadas a un NIT en un rango de fechas"
      >
        <p class="mb-3 text-sm text-brand-700">
          Genera un resumen de actividad del cliente (órdenes/reservas) usando
          NIT.
        </p>
        <div v-if="expanded.customerActivity" class="grid gap-3 sm:grid-cols-2">
          <InputText
            v-model="filters.nit"
            label="NIT del cliente"
            placeholder="CF o 1234567-8"
            size="md"
          />
          <div class="grid grid-cols-2 gap-2 sm:col-span-2">
            <InputDate v-model="filters.start" label="Desde" size="md" />
            <InputDate v-model="filters.end" label="Hasta" size="md" />
          </div>
          <div class="sm:col-span-2 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" @click="resetCustomerActivity"
              >Limpiar</Button
            >
            <Button variant="primary" size="sm" @click="goCustomerActivity"
              >Ver reporte</Button
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              @click="toggle('customerActivity')"
            >
              {{
                expanded.customerActivity ? "Ocultar opciones" : "Configurar"
              }}
            </Button>
          </div>
        </template>
      </Card>

      <!-- Empleado: Detalle por establecimiento -->
      <Card
        variant="outline"
        title="Detalle de empleado por establecimiento"
        subtitle="Desempeño de empleados en hotel/restaurante"
      >
        <p class="mb-3 text-sm text-brand-700">
          Selecciona el tipo de establecimiento y su entidad asociada.
        </p>
        <div v-if="expanded.employeeDetail" class="grid gap-3 sm:grid-cols-2">
          <Select
            v-model="filters.emp.establishmentType"
            :options="establishmentTypeOptions"
            label="Tipo"
            placeholder="Hotel o Restaurante"
            clearable
            size="md"
          />
          <div v-if="filters.emp.establishmentType === 'HOTEL'">
            <Select
              v-model="filters.emp.hotelId"
              :options="hotelOptions"
              label="Hotel"
              placeholder="Selecciona hotel"
              clearable
              size="md"
            />
          </div>
          <div v-else-if="filters.emp.establishmentType === 'RESTAURANT'">
            <Select
              v-model="filters.emp.restaurantId"
              :options="restaurantOptions"
              label="Restaurante"
              placeholder="Selecciona restaurante"
              clearable
              size="md"
            />
          </div>
          <div class="sm:col-span-2 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" @click="resetEmployeeDetail"
              >Limpiar</Button
            >
            <Button variant="primary" size="sm" @click="goEmployeeDetail"
              >Ver reporte</Button
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              @click="toggle('employeeDetail')"
            >
              {{ expanded.employeeDetail ? "Ocultar opciones" : "Configurar" }}
            </Button>
          </div>
        </template>
      </Card>

      <!-- Habitaciones populares (global) -->
      <Card
        variant="outline"
        title="Habitaciones populares"
        subtitle="Ranking de habitaciones más reservadas"
      >
        <p class="mb-3 text-sm text-brand-700">
          Mide popularidad a nivel genereal y por hotel.
        </p>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="primary"
              @click="navigateTo('/reportes/habitaciones-populares')"
              >Ver reporte</Button
            >
          </div>
        </template>
      </Card>

      <!-- Ingresos de hotel -->
      <Card
        variant="outline"
        title="Ingresos de hotel"
        subtitle="Ingresos en un rango de fechas"
      >
        <p class="mb-3 text-sm text-brand-700">
          Selecciona hotel y rango de fechas para calcular ingresos.
        </p>
        <div v-if="expanded.hotelRevenue" class="grid gap-3 sm:grid-cols-2">
          <Select
            v-model="filters.hotelRevenue.hotelId"
            :options="hotelOptions"
            label="Hotel"
            placeholder="Selecciona hotel"
            clearable
            size="md"
          />
          <div class="grid grid-cols-2 gap-2 sm:col-span-2">
            <InputDate
              v-model="filters.hotelRevenue.start"
              label="Desde"
              size="md"
            />
            <InputDate
              v-model="filters.hotelRevenue.end"
              label="Hasta"
              size="md"
            />
          </div>
          <div class="sm:col-span-2 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" @click="resetHotelRevenue"
              >Limpiar</Button
            >
            <Button
              variant="primary"
              size="sm"
              :disabled="!filters.hotelRevenue.hotelId"
              @click="goHotelRevenue"
              >Ver reporte</Button
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              @click="toggle('hotelRevenue')"
            >
              {{ expanded.hotelRevenue ? "Ocultar opciones" : "Configurar" }}
            </Button>
          </div>
        </template>
      </Card>

      <!-- Ganancias de hotel -->
      <Card
        variant="outline"
        title="Ganancias de hotel"
        subtitle="Ganancias (utilidad) en un rango de fechas"
      >
        <p class="mb-3 text-sm text-brand-700">
          Selecciona hotel y rango de fechas para calcular utilidad.
        </p>
        <div v-if="expanded.hotelProfit" class="grid gap-3 sm:grid-cols-2">
          <Select
            v-model="filters.hotelProfit.hotelId"
            :options="hotelOptions"
            label="Hotel"
            placeholder="Selecciona hotel"
            clearable
            size="md"
          />
          <div class="grid grid-cols-2 gap-2 sm:col-span-2">
            <InputDate
              v-model="filters.hotelProfit.start"
              label="Desde"
              size="md"
            />
            <InputDate
              v-model="filters.hotelProfit.end"
              label="Hasta"
              size="md"
            />
          </div>
          <div class="sm:col-span-2 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" @click="resetHotelProfit"
              >Limpiar</Button
            >
            <Button
              variant="primary"
              size="sm"
              :disabled="!filters.hotelProfit.hotelId"
              @click="goHotelProfit"
              >Ver reporte</Button
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              @click="toggle('hotelProfit')"
            >
              {{ expanded.hotelProfit ? "Ocultar opciones" : "Configurar" }}
            </Button>
          </div>
        </template>
      </Card>

      <!-- Ganancias de restaurante -->
      <Card
        variant="outline"
        title="Ganancias de restaurante"
        subtitle="Ganancias del restaurante en rango de fechas"
      >
        <p class="mb-3 text-sm text-brand-700">
          Selecciona restaurante y rango de fechas.
        </p>
        <div v-if="expanded.restaurantProfit" class="grid gap-3 sm:grid-cols-2">
          <Select
            v-model="filters.restaurantProfit.restaurantId"
            :options="restaurantOptions"
            label="Restaurante"
            placeholder="Selecciona restaurante"
            clearable
            size="md"
          />
          <div class="grid grid-cols-2 gap-2 sm:col-span-2">
            <InputDate
              v-model="filters.restaurantProfit.start"
              label="Desde"
              size="md"
            />
            <InputDate
              v-model="filters.restaurantProfit.end"
              label="Hasta"
              size="md"
            />
          </div>
          <div class="sm:col-span-2 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" @click="resetRestaurantProfit"
              >Limpiar</Button
            >
            <Button
              variant="primary"
              size="sm"
              :disabled="!filters.restaurantProfit.restaurantId"
              @click="goRestaurantProfit"
              >Ver reporte</Button
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              @click="toggle('restaurantProfit')"
            >
              {{
                expanded.restaurantProfit ? "Ocultar opciones" : "Configurar"
              }}
            </Button>
          </div>
        </template>
      </Card>

      <!-- Reporte de restaurante -->
      <Card
        variant="outline"
        title="Reporte de restaurante"
        subtitle="Indicadores del restaurante"
      >
        <p class="mb-3 text-sm text-brand-700">
          Selecciona un restaurante para ver sus indicadores generales.
        </p>
        <div v-if="expanded.restaurantReport" class="grid gap-3 sm:grid-cols-2">
          <Select
            v-model="filters.restaurantReport.restaurantId"
            :options="restaurantOptions"
            label="Restaurante"
            placeholder="Selecciona restaurante"
            clearable
            size="md"
          />
          <div class="sm:col-span-2 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              @click="filters.restaurantReport.restaurantId = null"
              >Limpiar</Button
            >
            <Button
              variant="primary"
              size="sm"
              :disabled="!filters.restaurantReport.restaurantId"
              @click="goRestaurantReport"
              >Ver reporte</Button
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              @click="toggle('restaurantReport')"
            >
              {{
                expanded.restaurantReport ? "Ocultar opciones" : "Configurar"
              }}
            </Button>
          </div>
        </template>
      </Card>

      <!-- Restaurantes más populares -->
      <Card
        variant="outline"
        title="Restaurante mas popular"
        subtitle="Top restaurante por ingresos"
      >
        <p class="mb-3 text-sm text-brand-700">
          Muestra el restaurante con mayores ingresos.
        </p>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="primary"
              @click="navigateTo('/reportes/restaurantes-populares')"
              >Ver reporte</Button
            >
          </div>
        </template>
      </Card>

      <!-- Ingresos de restaurante -->
      <Card
        variant="outline"
        title="Ingresos de restaurante"
        subtitle="Ingresos del restaurante en un rango de fechas"
      >
        <p class="mb-3 text-sm text-brand-700">
          Selecciona restaurante y rango de fechas.
        </p>
        <div
          v-if="expanded.restaurantRevenue"
          class="grid gap-3 sm:grid-cols-2"
        >
          <Select
            v-model="filters.restaurantRevenue.restaurantId"
            :options="restaurantOptions"
            label="Restaurante"
            placeholder="Selecciona restaurante"
            clearable
            size="md"
          />
          <div class="grid grid-cols-2 gap-2 sm:col-span-2">
            <InputDate
              v-model="filters.restaurantRevenue.start"
              label="Desde"
              size="md"
            />
            <InputDate
              v-model="filters.restaurantRevenue.end"
              label="Hasta"
              size="md"
            />
          </div>
          <div class="sm:col-span-2 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              @click="resetRestaurantRevenue"
              >Limpiar</Button
            >
            <Button
              variant="primary"
              size="sm"
              :disabled="!filters.restaurantRevenue.restaurantId"
              @click="goRestaurantRevenue"
              >Ver reporte</Button
            >
          </div>
        </div>
        <template #footer>
          <div class="flex items-center justify-between">
            <Button
              size="sm"
              variant="secondary"
              @click="toggle('restaurantRevenue')"
            >
              {{
                expanded.restaurantRevenue ? "Ocultar opciones" : "Configurar"
              }}
            </Button>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { ref, computed } from "vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import Select from "~/components/ui/Select.vue";
import InputText from "~/components/ui/InputText.vue";
import InputDate from "~/components/ui/InputDate.vue";

import { Roles } from "#imports";
import { useUseRoles } from "~/composables/useRoles";
import { useHotelService } from "~/services/hotels";
import { useRestaurantService } from "~/services/restaurants";

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.MANAGER];
redirectIfUnauthorized(permitedRoles, "/");

// Cargar catálogos
const hotelSvc = useHotelService();
const restaurantSvc = useRestaurantService();

const { data: hotelsData } = await useAsyncData(
  "reports:hotels",
  () => hotelSvc.getAll?.(),
  { server: true }
);
const { data: restaurantsData } = await useAsyncData(
  "reports:restaurants",
  () => restaurantSvc.getAll?.(),
  { server: true }
);

const hotelOptions = computed(() => {
  const val = hotelsData.value as any;
  const items = Array.isArray(val) ? val : val?.items || [];
  return items.map((h: any) => ({ label: h.name, value: h.id }));
});
const restaurantOptions = computed(() => {
  const val = restaurantsData.value as any;
  const items = Array.isArray(val) ? val : val?.items || [];
  return items.map((r: any) => ({ label: r.name, value: r.id }));
});

// Expandibles
const expanded = ref({
  customerActivity: false,
  employeeDetail: false,
  popularRoomsByHotel: false,
  hotelRevenue: false,
  hotelProfit: false,
  restaurantProfit: false,
  restaurantReport: false,
  restaurantRevenue: false,
}) as any;
function toggle(key: keyof typeof expanded.value) {
  expanded.value[key] = !expanded.value[key];
}

// Filtros
const filters = ref({
  nit: "",
  start: "",
  end: "",
  popHotelId: null as string | null,
  emp: {
    establishmentType: null as "HOTEL" | "RESTAURANT" | null,
    hotelId: null as string | null,
    restaurantId: null as string | null,
  },
  hotelRevenue: { hotelId: null as string | null, start: "", end: "" },
  hotelProfit: { hotelId: null as string | null, start: "", end: "" },
  restaurantProfit: { restaurantId: null as string | null, start: "", end: "" },
  restaurantReport: { restaurantId: null as string | null },
  restaurantRevenue: {
    restaurantId: null as string | null,
    start: "",
    end: "",
  },
});

const establishmentTypeOptions = [
  { value: "HOTEL", label: "HOTEL" },
  { value: "RESTAURANT", label: "RESTAURANTE" },
];

// Helpers navegación
function makeQS(obj: Record<string, any>) {
  const qs = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

function goCustomerActivity() {
  const qs = makeQS({
    nit: filters.value.nit,
    start: filters.value.start,
    end: filters.value.end,
  });
  navigateTo(`/reportes/cliente-actividad${qs}`);
}
function resetCustomerActivity() {
  filters.value.nit = "";
  filters.value.start = "";
  filters.value.end = "";
}

function goEmployeeDetail() {
  const t = filters.value.emp.establishmentType;
  const id =
    t === "HOTEL" ? filters.value.emp.hotelId : filters.value.emp.restaurantId;
  const qs = makeQS({ type: t || "", id: id || "" });
  navigateTo(`/reportes/empleado-detalle${qs}`);
}
function resetEmployeeDetail() {
  filters.value.emp.establishmentType = null;
  filters.value.emp.hotelId = null;
  filters.value.emp.restaurantId = null;
}

function goPopularRoomsByHotel() {
  if (!filters.value.popHotelId) return;
  navigateTo(
    `/reportes/habitaciones-populares/hotel/${filters.value.popHotelId}`
  );
}

function goHotelRevenue() {
  const { hotelId, start, end } = filters.value.hotelRevenue;
  const qs = makeQS({ hotelId, start, end });
  navigateTo(`/reportes/hotel-ingresos${qs}`);
}
function resetHotelRevenue() {
  filters.value.hotelRevenue = { hotelId: null, start: "", end: "" };
}

function goHotelProfit() {
  const { hotelId, start, end } = filters.value.hotelProfit;
  const qs = makeQS({ hotelId, start, end });
  navigateTo(`/reportes/hotel-ganancias${qs}`);
}
function resetHotelProfit() {
  filters.value.hotelProfit = { hotelId: null, start: "", end: "" };
}

function goRestaurantProfit() {
  const { restaurantId, start, end } = filters.value.restaurantProfit;
  const qs = makeQS({ restaurantId, start, end });
  navigateTo(`/reportes/restaurante-ganancias${qs}`);
}
function resetRestaurantProfit() {
  filters.value.restaurantProfit = { restaurantId: null, start: "", end: "" };
}

function goRestaurantReport() {
  const { restaurantId } = filters.value.restaurantReport;
  if (!restaurantId) return;
  navigateTo(`/reportes/restaurante/${restaurantId}`);
}

function goRestaurantRevenue() {
  const { restaurantId, start, end } = filters.value.restaurantRevenue;
  const qs = makeQS({ restaurantId, start, end });
  navigateTo(`/reportes/restaurante-ingresos${qs}`);
}
function resetRestaurantRevenue() {
  filters.value.restaurantRevenue = { restaurantId: null, start: "", end: "" };
}
</script>

<style scoped></style>
