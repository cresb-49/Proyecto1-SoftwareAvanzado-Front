<template>
  <div class="mx-auto max-w-6xl px-4 py-6 space-y-6">
    <!-- Encabezado -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-brand-900">Crear orden</h1>
        <p class="text-sm text-brand-700">
          {{
            step === 1
              ? "Selecciona platillos del menú y define cantidades"
              : "Ingresa el NIT del cliente o crea uno nuevo"
          }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          :to="`/ordenes`"
          >← Ordenes</Button
        >
      </div>
    </header>

    <!-- Paso 1: Selección de platillos -->
    <div v-if="step === 1">
      <div v-if="restaurantMenuPending" class="text-brand-700">
        Cargando menú…
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-3">
        <!-- Tabla de platillos -->
        <div class="lg:col-span-2">
          <Table
            :columns="cols"
            :items="rows"
            :loading="restaurantMenuPending"
            :page-size="10"
            v-model:page="page"
            v-model:search="search"
            size="md"
          >
            <template #title>Menú del restaurante</template>

            <!-- Precio formateado -->
            <template #cell-price="{ row }">
              <span>Q {{ formatPrice(row.price) }}</span>
            </template>

            <!-- Cantidad editable -->
            <template #cell-qty="{ row }">
              <div class="w-28">
                <InputNumber
                  v-model="qtyMap[row.id]"
                  :min="1"
                  :step="1"
                  size="sm"
                />
              </div>
            </template>

            <!-- Acciones -->
            <template #cell-acciones="{ row }">
              <div class="flex items-center justify-end gap-2">
                <Button size="sm" variant="primary" @click="addItem(row)"
                  >Agregar</Button
                >
              </div>
            </template>
          </Table>
        </div>

        <!-- Resumen de orden -->
        <aside class="lg:col-span-1">
          <Card
            variant="elevated"
            title="Resumen de la orden"
            :subtitle="
              selectedCount ? `${selectedCount} ítem(s)` : 'Sin platillos aún'
            "
          >
            <div class="space-y-3">
              <div v-if="selectedCount === 0" class="text-sm text-brand-700">
                Agrega platillos desde la tabla.
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="it in selectedList"
                  :key="it.id"
                  class="flex items-center justify-between gap-2 rounded-md border border-sand-300 bg-sand-50 p-2"
                >
                  <div>
                    <div class="text-sm font-medium text-brand-900">
                      {{ it.name }}
                    </div>
                    <div class="text-xs text-brand-700">
                      Q {{ formatPrice(it.price) }} × {{ it.qty }}
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <Button size="sm" variant="secondary" @click="decQty(it.id)"
                      >−</Button
                    >
                    <Button size="sm" variant="secondary" @click="incQty(it.id)"
                      >+</Button
                    >
                    <Button
                      size="sm"
                      variant="danger"
                      @click="removeItem(it.id)"
                      >Quitar</Button
                    >
                  </div>
                </div>

                <div
                  class="mt-3 flex items-center justify-between border-t border-sand-300 pt-3"
                >
                  <span class="text-sm font-medium text-brand-900">Total</span>
                  <span class="text-base font-semibold text-brand-900"
                    >Q {{ formatPrice(total) }}</span
                  >
                </div>
              </div>
            </div>

            <template #footer>
              <div class="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="secondary"
                  @click="clearAll"
                  :disabled="selectedCount === 0"
                  >Vaciar</Button
                >
                <Button
                  size="sm"
                  variant="info"
                  :disabled="selectedCount === 0"
                  @click="continueNext"
                  >Continuar</Button
                >
              </div>
            </template>
          </Card>
        </aside>
      </div>
    </div>

    <!-- Paso 2: NIT del cliente y creación si no existe -->
    <div v-else-if="step === 2" class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-4">
        <Card
          variant="elevated"
          title="Cliente"
          subtitle="Busca por NIT o crea uno nuevo"
        >
          <form
            class="grid gap-3 sm:grid-cols-2"
            @submit.prevent="onSearchClient"
          >
            <InputText
              v-model="nit"
              label="NIT del cliente *"
              placeholder="Ej. 5489721-K"
              :error="nitError"
              size="md"
              class="sm:col-span-2"
            />

            <div class="sm:col-span-2 flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  @click="step = 1"
                  >← Volver</Button
                >
                <Button
                  size="sm"
                  :variant="consumerFinal ? 'secondary' : 'warning'"
                  type="button"
                  @click="toggleConsumerFinal"
                  >{{
                    consumerFinal
                      ? "Quitar consumidor final"
                      : "Consumidor final"
                  }}</Button
                >
              </div>
              <Button
                size="sm"
                variant="info"
                type="submit"
                :loading="searchingClient"
                >Buscar</Button
              >
            </div>
          </form>
        </Card>

        <!-- Resultado de búsqueda -->
        <Card
          v-if="client && !clientNotFound"
          variant="elevated"
          title="Cliente encontrado"
        >
          <div class="grid gap-2 sm:grid-cols-2">
            <div>
              <div class="text-xs text-brand-700">Nombres</div>
              <div class="text-sm font-medium text-brand-900">
                {{ client.firstName }}
              </div>
            </div>
            <div>
              <div class="text-xs text-brand-700">Apellidos</div>
              <div class="text-sm font-medium text-brand-900">
                {{ client.lastName }}
              </div>
            </div>
            <div class="sm:col-span-2">
              <div class="text-xs text-brand-700">NIT</div>
              <div class="text-sm font-medium text-brand-900">
                {{ client.nit }}
              </div>
            </div>
          </div>
          <template #footer>
            <div class="flex items-center justify-end">
              <Button size="sm" variant="primary" @click="useClient"
                >Usar este cliente</Button
              >
            </div>
          </template>
        </Card>

        <!-- Form de creación si no existe -->
        <Card
          v-if="clientNotFound"
          variant="elevated"
          title="Crear cliente"
          subtitle="No se encontró un cliente con ese NIT"
        >
          <form
            class="grid gap-3 sm:grid-cols-2"
            @submit.prevent="onCreateClient"
          >
            <InputText
              v-model="clientForm.firstName"
              label="Nombres *"
              placeholder="Ej. María José"
              :error="clientErrors.firstName"
              size="md"
            />
            <InputText
              v-model="clientForm.lastName"
              label="Apellidos *"
              placeholder="Ej. López García"
              :error="clientErrors.lastName"
              size="md"
            />
            <InputText
              v-model="clientForm.nit"
              label="NIT *"
              placeholder="Ej. 5489721-K"
              :error="clientErrors.nit"
              size="md"
              class="sm:col-span-2"
            />
            <div class="sm:col-span-2 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                @click="resetClientForm"
                >Limpiar</Button
              >
              <Button
                size="sm"
                variant="primary"
                type="submit"
                :loading="creatingClient"
                >Crear cliente</Button
              >
            </div>
          </form>
        </Card>
      </div>

      <!-- Resumen de orden persistente -->
      <aside class="lg:col-span-1">
        <Card
          variant="elevated"
          title="Resumen de la orden"
          :subtitle="
            selectedCount ? `${selectedCount} ítem(s)` : 'Sin platillos aún'
          "
        >
          <div class="space-y-3">
            <div v-if="selectedCount === 0" class="text-sm text-brand-700">
              Agrega platillos desde el paso 1.
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="it in selectedList"
                :key="it.id"
                class="flex items-center justify-between gap-2 rounded-md border border-sand-300 bg-sand-50 p-2"
              >
                <div>
                  <div class="text-sm font-medium text-brand-900">
                    {{ it.name }}
                  </div>
                  <div class="text-xs text-brand-700">
                    Q {{ formatPrice(it.price) }} × {{ it.qty }}
                  </div>
                </div>
              </div>

              <div
                class="mt-3 flex items-center justify-between border-t border-sand-300 pt-3"
              >
                <span class="text-sm font-medium text-brand-900">Total</span>
                <span class="text-base font-semibold text-brand-900"
                  >Q {{ formatPrice(total) }}</span
                >
              </div>

              <div
                v-if="selectedClient"
                class="mt-3 rounded-md border border-olive-600/30 bg-olive-600/10 p-2 text-sm"
              >
                Cliente seleccionado:
                <span class="font-medium"
                  >{{ selectedClient.firstName }}
                  {{ selectedClient.lastName }}</span
                >
                ({{ selectedClient.nit }})
              </div>
              <div
                v-if="consumerFinal"
                class="mt-3 rounded-md border border-gold-500/30 bg-gold-500/10 p-2 text-sm"
              >
                Orden para consumidor final (sin cliente enlazado)
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <Button size="sm" variant="secondary" @click="step = 1"
                >← Volver</Button
              >
              <Button
                size="sm"
                variant="info"
                :disabled="!selectedClient && !consumerFinal"
                @click="goToConfirm"
                >Continuar</Button
              >
            </div>
          </template>
        </Card>
      </aside>
    </div>
    <!-- Paso 3: Confirmación y creación de orden -->
    <div v-else-if="step === 3" class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-4">
        <Card
          variant="elevated"
          title="Confirmación"
          subtitle="Revisa el detalle antes de crear"
        >
          <div class="space-y-3">
            <div class="rounded-md border border-sand-300 bg-sand-50 p-3">
              <div class="text-xs text-brand-700">Restaurante</div>
              <div class="text-sm font-medium text-brand-900">
                {{ restaurantData?.name }}
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="it in selectedList"
                :key="it.id"
                class="flex items-center justify-between gap-2 rounded-md border border-sand-300 bg-white p-2"
              >
                <div>
                  <div class="text-sm font-medium text-brand-900">
                    {{ it.name }}
                  </div>
                  <div class="text-xs text-brand-700">
                    Q {{ formatPrice(it.price) }} × {{ it.qty }}
                  </div>
                </div>
                <div class="text-sm font-semibold text-brand-900">
                  Q {{ formatPrice(it.price * it.qty) }}
                </div>
              </div>
            </div>

            <div
              class="mt-3 flex items-center justify-between border-t border-sand-300 pt-3"
            >
              <span class="text-sm font-medium text-brand-900">Total</span>
              <span class="text-base font-semibold text-brand-900"
                >Q {{ formatPrice(total) }}</span
              >
            </div>

            <div
              v-if="selectedClient"
              class="mt-3 rounded-md border border-olive-600/30 bg-olive-600/10 p-2 text-sm"
            >
              Cliente:
              <span class="font-medium"
                >{{ selectedClient.firstName }}
                {{ selectedClient.lastName }}</span
              >
              ({{ selectedClient.nit }})
            </div>
            <div
              v-else-if="consumerFinal"
              class="mt-3 rounded-md border border-gold-500/30 bg-gold-500/10 p-2 text-sm"
            >
              Orden para consumidor final
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between">
              <Button size="sm" variant="secondary" @click="step = 2"
                >← Atrás</Button
              >
              <Button
                size="sm"
                variant="primary"
                :disabled="
                  selectedCount === 0 ||
                  (!selectedClient && !consumerFinal) ||
                  creatingOrder
                "
                :loading="creatingOrder"
                @click="onCreateOrder"
                >Crear orden</Button
              >
            </div>
          </template>
        </Card>
      </div> 
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import Table, { type Column } from "~/components/ui/Table.vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import InputNumber from "~/components/ui/InputNumber.vue";
import InputText from "~/components/ui/InputText.vue";
import { useToast } from "~/composables/useToast";
import { useAuth } from "~/composables/useAuth";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useEmployeeService } from "~/services/employee";
import { useRestaurantService } from "~/services/restaurants";
import { getMenuItems } from "~/services/menu-items";
import { useClientService } from "~/services/client";
import { useOrderService } from "~/services/order";
import type { CreateOrderDTO } from "~/services/order";

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

// Paso actual
const step = ref<1 | 2 | 3>(1);

//Recuperamos el id del restaurante que viene en el path
const restaurantId = String(route.params.id);
const isAdmin = computed(() => hasAnyRole([Roles.ADMIN]));
const employeeSvc = useEmployeeService();
const restaurantSvc = useRestaurantService();
const menuItemsSvc = getMenuItems();
const clientSvc = useClientService();
const orderSvc = useOrderService();

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

const { data: restaurantData } = await useAsyncData(
  () => `restaurant:${restaurantId}`,
  () => restaurantSvc.getById(restaurantId)
);

// Cargar menú del restaurante
const { data: restaurantMenu, pending: restaurantMenuPending } =
  await useAsyncData(
    () => `restaurantMenu:${restaurantId}`,
    () => menuItemsSvc.getAllByRestaurantId(restaurantId)
  );

// Normalizar filas para tabla
interface Row {
  id: string;
  name: string;
  description: string;
  price: number;
  index: number;
}
const rows = computed<Row[]>(() => {
  const list: any[] = Array.isArray(restaurantMenu.value)
    ? (restaurantMenu.value as any[])
    : (restaurantMenu.value as any)?.items || [];
  return list.map((m, i) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    price: Number(m.price),
    index: i + 1,
  }));
});

// Columnas de tabla
const cols: Column<Row>[] = [
  { key: "index", label: "N°", align: "center" },
  { key: "name", label: "Platillo", sortable: true },
  { key: "description", label: "Descripción", sortable: false },
  { key: "price", label: "Precio", align: "right" },
  { key: "qty", label: "Cant.", align: "center" },
  { key: "acciones", label: "Acciones", align: "right" },
];

// Cantidades temporales por fila (en la tabla)
const qtyMap = reactive<Record<string, number>>({});

// Selección de items de la orden (objeto acumulador)
const selected = reactive<
  Record<string, { id: string; name: string; price: number; qty: number }>
>({});

function addItem(row: Row) {
  const q = Math.max(1, Number(qtyMap[row.id] || 1));
  if (selected[row.id] !== undefined) {
    selected[row.id]!.qty += q;
  } else {
    selected[row.id] = { id: row.id, name: row.name, price: row.price, qty: q };
  }
  qtyMap[row.id] = 1;
}

function removeItem(id: string) {
  delete selected[id];
}
function incQty(id: string) {
  if (selected[id]) selected[id].qty++;
}
function decQty(id: string) {
  if (selected[id] && selected[id].qty > 1) selected[id].qty--;
}

const selectedList = computed(() => Object.values(selected));
const selectedCount = computed(() => selectedList.value.length);
const total = computed(() =>
  selectedList.value.reduce((sum, it) => sum + it.price * it.qty, 0)
);

function clearAll() {
  for (const k of Object.keys(selected)) delete selected[k];
}

// Cliente: búsqueda por NIT y creación
const nit = ref<string>("");
const nitError = ref<string>("");
const searchingClient = ref(false);
const client = ref<any | null>(null);
const clientNotFound = ref(false);
const selectedClient = ref<any | null>(null);
const consumerFinal = ref(false);

function validateNit() {
  const n = nit.value.trim();
  nitError.value = !n
    ? "Requerido"
    : n.length > 20
    ? "Máximo 20 caracteres"
    : "";
  return !nitError.value;
}

async function onSearchClient() {
  if (!validateNit()) return;
  try {
    searchingClient.value = true;
    client.value = null;
    clientNotFound.value = false;
    const res: any = await clientSvc.getByNit?.(nit.value);
    if (res && res.id) {
      client.value = res;
      clientNotFound.value = false;
      // Prefill form in case user wants to editar rápido
      clientForm.firstName = res.firstName || "";
      clientForm.lastName = res.lastName || "";
      clientForm.nit = res.nit || nit.value;
      consumerFinal.value = false;
      toast.success("Cliente encontrado");
    } else {
      clientNotFound.value = true;
      clientForm.nit = nit.value;
      toast.info("No se encontró cliente, completa el formulario para crearlo");
    }
  } catch (e: any) {
    clientNotFound.value = true;
    clientForm.nit = nit.value;
    toast.error("No se pudo buscar el cliente");
  } finally {
    searchingClient.value = false;
  }
}

const clientForm = reactive<{
  firstName: string;
  lastName: string;
  nit: string;
}>({ firstName: "", lastName: "", nit: "" });
const clientErrors = reactive<Record<"firstName" | "lastName" | "nit", string>>(
  { firstName: "", lastName: "", nit: "" }
);
const creatingClient = ref(false);

function validateClientForm() {
  const fn = clientForm.firstName.trim();
  clientErrors.firstName = !fn ? "Requerido" : "";
  const ln = clientForm.lastName.trim();
  clientErrors.lastName = !ln ? "Requerido" : "";
  const n = clientForm.nit.trim();
  clientErrors.nit = !n ? "Requerido" : n.length > 20 ? "Máximo 20" : "";
  return Object.values(clientErrors).every((v) => !v);
}

function resetClientForm() {
  clientForm.firstName = "";
  clientForm.lastName = "";
  clientForm.nit = nit.value;
}

async function onCreateClient() {
  if (!validateClientForm()) return;
  try {
    creatingClient.value = true;
    const created: any = await clientSvc.create?.({
      firstName: clientForm.firstName.trim(),
      lastName: clientForm.lastName.trim(),
      nit: clientForm.nit.trim(),
    });
    if (created && created.id) {
      client.value = created;
      clientNotFound.value = false;
      selectedClient.value = created;
      consumerFinal.value = false;
      toast.success("Cliente creado y seleccionado");
    } else {
      toast.error("No se pudo crear el cliente");
    }
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo crear el cliente";
    toast.error("Error", { description: msg });
  } finally {
    creatingClient.value = false;
  }
}

function useClient() {
  if (!client.value) return;
  selectedClient.value = client.value;
  consumerFinal.value = false;
  toast.success("Cliente seleccionado");
}

function toggleConsumerFinal() {
  consumerFinal.value = !consumerFinal.value;
  if (consumerFinal.value) {
    selectedClient.value = null;
  }
}

const creatingOrder = ref(false);

function goToConfirm() {
  if (!selectedClient.value && !consumerFinal.value) return;
  step.value = 3;
}

async function onCreateOrder() {
  if (selectedCount.value === 0) {
    toast.error("La orden debe tener al menos un platillo");
    return;
  }
  if (!consumerFinal.value && !selectedClient.value) {
    toast.error("Selecciona un cliente o marca consumidor final");
    return;
  }
  try {
    creatingOrder.value = true;
    const payload: CreateOrderDTO = {
      restaurantId: restaurantId,
      nit: selectedClient.value?.nit ?? null,
      employeeId: user.value?.employeeId ? String(user.value.employeeId) : null,
      items: selectedList.value.map((it) => ({
        itemId: it.id,
        quantity: it.qty,
      })),
    };
    console.log(payload);
    await orderSvc.createOrder(payload);
    toast.success("Orden creada correctamente");
    navigateTo(`/ordenes/${restaurantId}`);
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo crear la orden";
    toast.error("Error", { description: msg });
  } finally {
    creatingOrder.value = false;
  }
}

function continueNext() {
  if (selectedCount.value === 0) return;
  step.value = 2;
}

// Tabla UI state
const page = ref(1);
const search = ref("");

function formatPrice(n: number | string) {
  return Number(n).toFixed(2);
}
</script>

<style scoped></style>
