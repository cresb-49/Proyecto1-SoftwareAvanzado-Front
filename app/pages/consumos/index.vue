<template>
  <div class="mx-auto max-w-5xl px-4 py-6 space-y-8">
    <!-- Filtros -->
    <Card variant="elevated" title="Buscar consumos" subtitle="Filtra por NIT y/o Restaurante">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <InputText
            v-model="nit"
            label="NIT (de tu cuenta)"
            placeholder="—"
            :disabled="true"
            size="md"
          />
        </div>

        <div>
          <Select
            v-model="selectedRestaurantId"
            :options="restaurantOptions"
            label="Restaurante"
            placeholder="Todos"
            size="md"
            clearable
          />
        </div>

        <div class="sm:col-span-2 flex items-center gap-2">
          <Button variant="primary" @click="onSearch" :loading="pendingSearch">Buscar</Button>
          <Button variant="secondary" @click="onClear" :disabled="pendingSearch">Limpiar</Button>
        </div>
      </div>
    </Card>

    <!-- Resultados -->
    <Card variant="elevated" title="Resultados">
      <div v-if="pendingSearch" class="text-brand-700">Buscando órdenes…</div>
      <div v-else-if="reservations.length === 0" class="text-brand-700">No hay órdenes para los filtros seleccionados.</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-sand-300 text-left">
              <th class="py-2 px-2">#</th>
              <th class="py-2 px-2">Fecha</th>
              <th class="py-2 px-2">Restaurante</th>
              <th class="py-2 px-2 text-right">Total</th>
              <th class="py-2 px-2">Estado</th>
              <th class="py-2 px-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(o, i) in reservations"
              :key="o.id"
              class="border-b border-sand-100"
            >
              <td class="py-2 px-2 align-top">{{ i + 1 }}</td>
              <td class="py-2 px-2 align-top">
                <div class="font-medium text-brand-900">{{ formatDate(o.date || o.createdAt) }}</div>
                <div class="text-xs text-brand-700">ID: {{ o.id.slice(0,8) }}…</div>
              </td>
              <td class="py-2 px-2 align-top">
                <div class="font-medium text-brand-900">{{ o.restaurant?.name || '—' }}</div>
                <div class="text-xs text-brand-700">{{ o.restaurant?.address || '' }}</div>
              </td>
              <td class="py-2 px-2 align-top text-right">Q {{ formatCurrency(o.total) }}</td>
              <td class="py-2 px-2 align-top">
                <span v-if="o.isPaid" class="rounded px-2 py-0.5 text-xs bg-sage-500 text-white">Pagada</span>
                <span v-else-if="o.isCanceled" class="rounded px-2 py-0.5 text-xs bg-terra-500 text-white">Cancelada</span>
                <span v-else class="rounded px-2 py-0.5 text-xs border border-gold-500/40 bg-gold-500/20 text-brand-900">Abierta</span>
              </td>
              <td class="py-2 px-2 align-top text-right">
                <div class="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    :to="`/restaurantes/${o.restaurant?.id}`"
                  >
                    Restaurante
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    :to="o.isPaid ? `/ordenes/comprobante/${o.id}` : undefined"
                    :disabled="!o.isPaid"
                  >
                    Comprobante
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { ref, computed, watchEffect } from "vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import InputText from "~/components/ui/InputText.vue";
import Select from "~/components/ui/Select.vue";
import { useAuth } from "~/composables/useAuth";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useClientService } from "~/services/client";
import type { Client } from "~/services/client";
import { useOrderService } from "~/services/order";
import { useRestaurantService } from "~/services/restaurants";
import type { Order } from "~/services/order";
import { useToast } from "~/composables/useToast";

// Solo clientes pueden acceder
const { redirectIfUnauthorized } = useUseRoles();
redirectIfUnauthorized([Roles.CUSTOMER], "/");

// Usuario autenticado
const { user } = useAuth();

// Cliente asociado (por clientId del usuario)
const clients = useClientService();
const clientId = computed(() => String(user.value?.clientId || ""));

const {
  data: clientData,
  pending: pendingClient,
  error: errorClient,
} = await useAsyncData(
  () => `client:${clientId.value || "none"}`,
  () =>
    clientId.value ? clients.getById(clientId.value) : Promise.resolve(null),
  { watch: [clientId], server: true }
);

const client = computed<Client | null>(() => (clientData.value as any) || null);
const toast = useToast();

// Servicios
const orderSvc = useOrderService();
const restaurantSvc = useRestaurantService();

// Filtros
const nit = ref<string>("");
watchEffect(() => {
  if (!nit.value && client.value?.nit) nit.value = client.value.nit;
});
const selectedRestaurantId = ref<string | null>(null);

// Resultados
const reservations = ref<Order[]>([]);
const pendingSearch = ref(false);

// Catálogo restaurantes
const { data: restaurantsData } = await useAsyncData(
  "consumos:restaurants",
  () => restaurantSvc.getAll?.(),
  { server: true }
);
const restaurantMap = computed<Record<string, string>>(() => {
  const arr: any[] = Array.isArray(restaurantsData.value)
    ? (restaurantsData.value as any)
    : restaurantsData.value || [];
  const map: Record<string, string> = {};
  arr.forEach((r: any) => { map[r.id] = r.name; });
  return map;
});
const restaurantOptions = computed(() => {
  const opts = Object.entries(restaurantMap.value).map(([value, label]) => ({ value, label }));
  return [{ value: "", label: "Todos" }, ...opts];
});

// Formatos
function formatCurrency(n: number | string | null | undefined) {
  return Number(n || 0).toFixed(2);
}
function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? String(v)
    : new Intl.DateTimeFormat("es-GT", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(d);
}

// Acciones
async function onSearch() {
  if (!nit.value && !selectedRestaurantId.value) {
    toast.error("No hay NIT en la cuenta. Contacta soporte.");
    return;
  }
  pendingSearch.value = true;
  try {
    let data: Order[] = [];
    const rid = selectedRestaurantId.value || "";

    if (nit.value && rid) {
      data = (await orderSvc.getOrdersByRestaurantAndClient(rid, nit.value)) as any;
    } else if (nit.value) {
      data = (await orderSvc.getOrdersByNit(nit.value)) as any;
    } else {
      // Caso extremo: sin NIT pero con restaurante (no debería ocurrir en clientes)
      data = [];
    }
    reservations.value = Array.isArray(data) ? data : data || [];
  } catch (e) {
    reservations.value = [];
    toast.error("No se pudieron obtener órdenes");
  } finally {
    pendingSearch.value = false;
  }
}

function onClear() {
  nit.value = client.value?.nit || "";
  selectedRestaurantId.value = null;
  reservations.value = [];
}
</script>

<style scoped></style>
