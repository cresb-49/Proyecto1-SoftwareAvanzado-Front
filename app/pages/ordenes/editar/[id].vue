<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">Editar orden</h1>
        <p class="text-sm text-brand-700">ID: {{ orderId }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" variant="secondary" :to="backPath">← Regresar</Button>
      </div>
    </header>

    <!-- Estados -->
    <div v-if="pendingOrder" class="text-brand-700">Cargando orden…</div>
    <div v-else-if="errorOrder" class="text-terra-500">No se pudo cargar la orden.</div>

    <div v-else>
      <Card
        variant="elevated"
        :title="order?.restaurant?.name || 'Restaurante'"
        :subtitle="`Total: Q ${formatCurrency(order?.total ?? 0)} | ${order?.isPaid ? 'Pagada' : order?.isCanceled ? 'Cancelada' : 'Abierta'}`"
      >
        <div v-if="!canEdit" class="mb-4 rounded-md border border-sand-300 bg-sand-50 p-3 text-sm text-brand-700">
          Esta orden está <strong>{{ order?.isPaid ? 'pagada' : 'cancelada' }}</strong>. Las ediciones están deshabilitadas.
        </div>

        <!-- Tabla de líneas -->
        <Table
          :columns="cols"
          :items="rows"
          :page-size="10"
          v-model:page="page"
          v-model:search="search"
          size="md"
        >
          <template #title>Líneas de la orden</template>

          <!-- Unit price -->
          <template #cell-price="{ row }">
            <span>Q {{ formatCurrency(row.price) }}</span>
          </template>

          <!-- Subtotal -->
          <template #cell-subtotal="{ row }">
            <span class="font-medium">Q {{ formatCurrency(row.subtotal) }}</span>
          </template>

          <!-- Nueva cantidad -->
          <template #cell-newQty="{ row }">
            <div class="w-28">
              <InputNumber v-model="newQtyMap[row.id]" :min="0" :step="1" size="sm" :disabled="!canEdit || savingRow[row.id]" />
            </div>
          </template>

          <!-- Acciones por línea -->
          <template #cell-acciones="{ row }">
            <div class="flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="primary"
                :disabled="!canEdit || savingRow[row.id] || newQtyMap[row.id] === row.quantity"
                :loading="savingRow[row.id]"
                @click="applyQty(row)"
              >Aplicar</Button>
              <Button
                size="sm"
                variant="danger"
                :disabled="!canEdit || savingRow[row.id]"
                :loading="savingRow[row.id]"
                @click="removeLine(row)"
              >Quitar</Button>
            </div>
          </template>
        </Table>

        <!-- Footer total -->
        <template #footer>
          <div class="flex items-center justify-between text-sm text-brand-700">
            <span>Actualizado: {{ formatDate(order?.updatedAt || order?.date || null) }}</span>
            <span class="font-medium">Total actual: Q {{ formatCurrency(order?.total ?? 0) }}</span>
          </div>
        </template>
      </Card>

      <!-- Agregar nuevo item -->
      <Card variant="elevated" title="Agregar nuevo ítem" :subtitle="order?.restaurant?.name" class="mt-4">
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="sm:col-span-2">
            <Select
              v-model="addItemId"
              :options="menuOptions"
              label="Platillo"
              placeholder="Selecciona un platillo"
              :disabled="!canEdit || menuPending || menuOptions.length === 0"
              size="md"
            />
          </div>
          <div>
            <InputNumber v-model="addQty" :min="1" :step="1" label="Cantidad" size="md" :disabled="!canEdit" />
          </div>
          <div class="sm:col-span-3 flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="primary"
              :disabled="!canEdit || !addItemId || addQty < 1 || adding"
              :loading="adding"
              @click="onAddNewItem"
            >Agregar a la orden</Button>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { computed, reactive, ref, watchEffect } from "vue";
import { useRoute } from "vue-router";
import Table, { type Column } from "~/components/ui/Table.vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import InputNumber from "~/components/ui/InputNumber.vue";
import Select from "~/components/ui/Select.vue";
import { useToast } from "~/composables/useToast";
import { useAuth } from "~/composables/useAuth";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useEmployeeService } from "~/services/employee";
import { useRestaurantService } from "~/services/restaurants";
import { getMenuItems } from "~/services/menu-items";
import { useOrderService } from "~/services/order";
import type { Order } from "~/services/order";

const toast = useToast();
const route = useRoute();
const { user } = useAuth();
const { hasAnyRole, redirectIfUnauthorized, boolToRedirect } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_EMPLOYEE, Roles.RESTAURANT_MANAGER];
redirectIfUnauthorized(permitedRoles, "/");

const orderSvc = useOrderService();
const employeeSvc = useEmployeeService();
const menuSvc = getMenuItems();

// Id de orden de la ruta
const orderId = String(route.params.id);

// Cargar orden
const { data: orderData, pending: pendingOrder, error: errorOrder, refresh: refreshOrder } = await useAsyncData(
  () => `order:${orderId}`,
  () => orderSvc.getById(orderId),
  { server: true }
);
const order = computed<Order | null>(() => (orderData.value as any) || null);

// Validación de restaurante vs empleado (excepto ADMIN)
const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]));
const { data: employeeData } = await useAsyncData(
  () => `employee:${user.value?.employeeId ?? ""}`,
  () => (user.value?.employeeId ? employeeSvc.getById(String(user.value.employeeId)) : Promise.resolve(null))
);
watchEffect(() => {
  const rid = order.value?.restaurant?.id;
  const empRid = (employeeData.value as any)?.restaurantId;
  if (rid && empRid && rid !== empRid && !isAdmin.value) {
    boolToRedirect(true, "/");
  }
});

const backPath = computed(() => `/ordenes/${order.value?.restaurant?.id ?? ''}`);
const canEdit = computed(() => !!order.value && !order.value.isPaid && !order.value.isCanceled);

// Filas de líneas
interface Row { id: string; menuItemId: string; name: string; price: number; quantity: number; subtotal: number; index: number }
const rows = computed<Row[]>(() => {
  const lines = order.value?.orderLines || [];
  return lines.map((l, i) => ({
    id: l.id,
    menuItemId: l.menuItem.id,
    name: l.menuItem.name,
    price: Number(l.price),
    quantity: Number(l.quantity),
    subtotal: Number(l.subtotal),
    index: i + 1,
  }));
});

// Columnas
const cols: Column<Row>[] = [
  { key: 'index', label: 'N°', align: 'center', },
  { key: 'name', label: 'Platillo', sortable: true },
  { key: 'price', label: 'Precio', align: 'right',  },
  { key: 'quantity', label: 'Actual', align: 'center',  },
  { key: 'subtotal', label: 'Subtotal', align: 'right',  },
  { key: 'newQty', label: 'Nueva cant.', align: 'center',  },
  { key: 'acciones', label: 'Acciones', align: 'right',  },
];

// Estado UI tabla
const page = ref(1);
const search = ref("");

// Mapas de edición por fila
const newQtyMap = reactive<Record<string, number>>({});
const savingRow = reactive<Record<string, boolean>>({});

watchEffect(() => {
  rows.value.forEach(r => {
    if (newQtyMap[r.id] === undefined) newQtyMap[r.id] = r.quantity;
  });
});

async function applyQty(row: Row) {
  const desired = Math.max(0, Number(newQtyMap[row.id] ?? row.quantity));
  const current = Number(row.quantity);
  if (desired === current) {
    toast.info('Sin cambios en la cantidad');
    return;
  }
  try {
    savingRow[row.id] = true;
    if (desired === 0) {
      // Eliminar línea completa
      await orderSvc.deleteItemOfOrder(orderId, { lineOrderId: row.id });
      toast.success('Línea eliminada');
    } else {
      // Nuevo endpoint: establece la cantidad (agrega si no existe, modifica si existe)
      await orderSvc.modifyQuantityItemToOrder(orderId, { itemId: row.menuItemId, quantity: desired });
      toast.success('Cantidad actualizada');
    }
    await refreshOrder();
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo actualizar la cantidad';
    toast.error('Error', { description: msg });
  } finally {
    savingRow[row.id] = false;
  }
}

async function removeLine(row: Row) {
  if (!confirm('¿Quitar esta línea de la orden?')) return;
  try {
    savingRow[row.id] = true;
    await orderSvc.deleteItemOfOrder(orderId, { lineOrderId: row.id });
    await refreshOrder();
    toast.success('Línea eliminada');
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo eliminar la línea';
    toast.error('Error', { description: msg });
  } finally {
    savingRow[row.id] = false;
  }
}

// --- Agregar nuevo item (4) ---
const addItemId = ref<string>('');
const addQty = ref<number>(1);
const adding = ref(false);

// Cargar menú del restaurante de la orden
const { data: menuData, pending: menuPending } = await useAsyncData(
  () => `menu:${order.value?.restaurant?.id ?? 'none'}`,
  () => order.value?.restaurant?.id ? menuSvc.getAllByRestaurantId(String(order.value.restaurant.id)) : Promise.resolve([]),
  { watch: [order] }
);

const menuOptions = computed(() => {
  const items: any[] = (menuData.value as any[]) || [];
  const inOrder = new Set(rows.value.map(r => r.menuItemId));
  return items
    .filter(m => !inOrder.has(m.id))
    .map(m => ({ label: `${m.name} — Q ${formatCurrency(m.price)}`, value: m.id }));
});

async function onAddNewItem() {
  if (!addItemId.value || addQty.value < 1) return;
  try {
    adding.value = true;
    await orderSvc.modifyQuantityItemToOrder(orderId, { itemId: addItemId.value, quantity: addQty.value });
    addItemId.value = '';
    addQty.value = 1;
    await refreshOrder();
    toast.success('Ítem agregado a la orden');
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo agregar el ítem';
    toast.error('Error', { description: msg });
  } finally {
    adding.value = false;
  }
}

function formatCurrency(n: number | string) { return Number(n).toFixed(2); }
function formatDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}
</script>

<style scoped></style>