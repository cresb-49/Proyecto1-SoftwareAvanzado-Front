<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">
          Órdenes del restaurante
        </h1>
        <p class="text-sm text-brand-700">
          {{ restaurant ? restaurant.name : "Restaurante" }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" to="/ordenes">← Regresar</Button>
        <Button
          size="sm"
          variant="primary"
          :to="`/ordenes/crear/${restaurantId}`"
          >Crear orden</Button
        >
      </div>
    </header>

    <!-- Estados -->
    <div v-if="pendingOrders" class="text-brand-700">Cargando órdenes…</div>
    <div v-else-if="errorOrders" class="text-terra-500">
      No se pudieron cargar las órdenes.
    </div>

    <!-- Tabla de órdenes -->
    <div v-else>
      <Card variant="elevated">
        <Table
          :columns="cols"
          :items="rows"
          :loading="pendingOrders"
          :page-size="10"
          v-model:page="page"
          v-model:search="search"
          size="md"
        >
          <template #title>Listado de órdenes</template>

          <!-- NIT -->
          <template #cell-nit="{ row }">
            <span v-if="row.nit" class="text-brand-900">{{ row.nit }}</span>
            <span v-else class="text-brand-700 italic">Consumidor final</span>
          </template>

          <!-- Total formateado -->
          <template #cell-total="{ row }">
            <span class="font-medium text-brand-900"
              >Q {{ formatCurrency(row.total) }}</span
            >
          </template>

          <!-- Fecha creación -->
          <template #cell-creada="{ row }">
            <span class="text-sm">{{ formatDate(row.createdAt) }}</span>
          </template>

          <!-- Fecha actualización -->
          <template #cell-actualizada="{ row }">
            <span class="text-sm">{{ formatDate(row.updatedAt) }}</span>
          </template>

          <!-- Pagada -->
          <template #cell-pagada="{ row }">
            <span
              :class="
                row.isPaid
                  ? 'rounded px-2 py-0.5 text-xs bg-sage-500 text-white'
                  : 'rounded px-2 py-0.5 text-xs bg-sand-300 text-brand-800'
              "
            >
              {{ row.isPaid ? "Sí" : "No" }}
            </span>
          </template>

          <!-- Cancelada -->
          <template #cell-cancelada="{ row }">
            <span
              :class="
                row.isCanceled
                  ? 'rounded px-2 py-0.5 text-xs bg-terra-500 text-white'
                  : 'rounded px-2 py-0.5 text-xs bg-sand-300 text-brand-800'
              "
            >
              {{ row.isCanceled ? "Sí" : "No" }}
            </span>
          </template>

          <!-- Acciones -->
          <template #cell-acciones="{ row }">
            <div class="flex items-center justify-end gap-2">
              <Button v-if="!row.isPaid && !row.isCanceled"
                size="sm"
                variant="primary"
                :to="`/ordenes/editar/${row.id}`"
                :disabled="row.isPaid || row.isCanceled"
                >Editar</Button
              >
              <Button v-if="!row.isPaid && !row.isCanceled"
                size="sm"
                variant="success"
                :disabled="row.isPaid || row.isCanceled"
                @click="onPay(row)"
                >Pagar</Button
              >
              <Button v-if="!row.isPaid && !row.isCanceled"
                size="sm"
                variant="danger"
                :disabled="row.isCanceled || row.isPaid"
                @click="onCancel(row)"
                >Cancelar</Button
              >
              <Button v-if="row.isPaid"
                size="sm"
                variant="info"
                :to="`/ordenes/comprobante/${row.id}`"
                :disabled="!row.isPaid"
                >Comprobante</Button
              >
              <Button v-if="row.isCanceled && canDeleteOrder"
                size="sm"
                variant="danger"
                @click="onDelete(row)"
              >Eliminar</Button>
            </div>
          </template>
        </Table>

        <template #footer>
          <div class="flex items-center justify-between text-sm text-brand-700">
            <span>Total de órdenes: {{ rows.length }}</span>
            <Button size="sm" variant="secondary" @click="refreshOrders"
              >Refrescar</Button
            >
          </div>
        </template>
      </Card>

      <div
        v-if="rows.length === 0"
        class="mt-4 rounded-md border border-sand-300 bg-sand-50 p-3 text-sm text-brand-700"
      >
        No hay órdenes registradas para este restaurante.
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import Table, { type Column } from "~/components/ui/Table.vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useToast } from "~/composables/useToast";
import { useAuth } from "~/composables/useAuth";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useEmployeeService } from "~/services/employee";
import { useRestaurantService } from "~/services/restaurants";
import { useOrderService } from "~/services/order";

const toast = useToast();
const route = useRoute();
const { user } = useAuth();
const { hasAnyRole, redirectIfUnauthorized, boolToRedirect } = useUseRoles();
const permitedRoles = [
  Roles.ADMIN,
  Roles.RESTAURANT_EMPLOYEE,
  Roles.RESTAURANT_MANAGER,
];
redirectIfUnauthorized(permitedRoles, "/");

// Id de restaurante desde la ruta
const restaurantId = String(route.params.id);
const canDeleteOrder = computed(() => hasAnyRole([Roles.ADMIN, Roles.RESTAURANT_MANAGER]));
const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]));
const employeeSvc = useEmployeeService();
const restaurantSvc = useRestaurantService();
const orderSvc = useOrderService();

// Validar que el empleado pertenezca al restaurante (salvo ADMIN)
const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ""}`,
  () =>
    user.value?.employeeId
      ? employeeSvc.getById(String(user.value.employeeId))
      : Promise.resolve(null)
);

boolToRedirect(
  (employeeData.value as any)?.restaurantId !== restaurantId && !isAdmin.value,
  "/"
);

// Datos del restaurante (para mostrar nombre)
const { data: restaurantData } = await useAsyncData(
  () => `restaurant:${restaurantId}`,
  () => restaurantSvc.getById(restaurantId)
);
const restaurant = computed<any>(() => restaurantData.value as any);

// Órdenes del restaurante
const {
  data: restaurantOrders,
  pending: pendingOrders,
  error: errorOrders,
  refresh: refreshOrders,
} = await useAsyncData(
  () => `restaurantOrders:${restaurantId}`,
  () => orderSvc.getOrdersByRestaurant(restaurantId)
);

// Tabla
interface Row {
  id: string;
  nit: string | null;
  total: number;
  createdAt: string | null;
  updatedAt: string | null;
  isPaid: boolean;
  isCanceled: boolean;
}

const rows = computed<Row[]>(() => {
  const list: any[] = (restaurantOrders.value as any[]) || [];
  return list.map((o: any) => ({
    id: o.id,
    nit: o.nit ?? null,
    total: Number(o.total ?? 0),
    createdAt: o.createdAt ?? null,
    updatedAt: o.updatedAt ?? null,
    isPaid: Boolean(o.isPaid),
    isCanceled: Boolean(o.isCanceled),
  }));
});

const cols: Column<Row>[] = [
  { key: "id", label: "ID de orden", sortable: true },
  { key: "nit", label: "NIT cliente", sortable: true },
  { key: "total", label: "Total", align: "right" },
  { key: "creada", label: "Creada", align: "center" },
  { key: "actualizada", label: "Actualizada", align: "center" },
  { key: "pagada", label: "Pagada", align: "center" },
  { key: "cancelada", label: "Cancelada", align: "center" },
  { key: "acciones", label: "Acciones", align: "right" },
];

// UI state
const page = ref(1);
const search = ref("");

function formatCurrency(n: number | string) {
  return Number(n).toFixed(2);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

// Acciones
function onEdit(row: Row) {
  navigateTo(`/ordenes/editar/${row.id}`);
}

async function onPay(row: Row) {
  if (row.isPaid || row.isCanceled) return;
  if (!confirm("¿Marcar esta orden como pagada?")) return;
  try {
    await orderSvc.payOrder(row.id);
    toast.success("Orden pagada");
    await refreshOrders();
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo pagar la orden";
    toast.error("Error", { description: msg });
  }
}

async function onCancel(row: Row) {
  if (row.isCanceled || row.isPaid) return;
  if (!confirm("¿Cancelar esta orden?")) return;
  try {
    await orderSvc.cancelOrder(row.id);
    toast.success("Orden cancelada");
    await refreshOrders();
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo cancelar la orden";
    toast.error("Error", { description: msg });
  }
}

async function onDelete(row: Row) {
  if (!row.isCanceled) return;
  if (!confirm('¿Eliminar esta orden cancelada? Esta acción no se puede deshacer.')) return;
  try {
    await orderSvc.deleteOrder(row.id);
    toast.success('Orden eliminada');
    await refreshOrders();
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo eliminar la orden';
    toast.error('Error', { description: msg });
  }
}

function onVoucher(row: Row) {
  navigateTo(`/ordenes/comprobante/${row.id}`);
}
</script>
