
<template>
  <div class="mx-auto max-w-4xl px-4 py-6 space-y-6">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-brand-900">Mis pagos</h1>
      <div class="text-sm text-brand-700">Empleado: <span class="font-medium text-brand-900">{{ user?.employeeId || '—' }}</span></div>
    </header>

    <!-- Sin empleado asociado -->
    <div v-if="!employeeId" class="rounded-md border border-sand-300 bg-white p-4 text-brand-700">
      Tu usuario no tiene un <strong>empleado</strong> asociado. Contacta a un administrador.
    </div>

    <!-- Estados de carga / error -->
    <div v-else>
      <div v-if="pending" class="rounded-md border border-sand-300 bg-white p-4 text-brand-700">Cargando pagos…</div>
      <div v-else-if="error" class="rounded-md border border-terra-500 bg-white p-4 text-terra-600">No se pudieron cargar tus pagos.</div>

      <!-- Tabla de pagos -->
      <div v-else>
        <Table
          :columns="columns"
          :items="items"
          :loading="pending"
          emptyText="Sin pagos registrados"
        >
          <template #cell-paid="{ row }">
            <span
              :class="row.paid ? 'bg-sage-500 text-white' : 'bg-gold-400 text-ink-900'"
              class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
            >
              {{ row.paid ? 'Pagado' : 'Pendiente' }}
            </span>
          </template>
        </Table>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { computed } from "vue";
import Table, { type Column } from "~/components/ui/Table.vue";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useWeeklyPaymentService } from "~/services/weekly-payments";
import { useAuth } from "#imports";

const { user } = useAuth();

// Solo empleados y managers pueden ver "Mis pagos"
const { redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [
  Roles.HOTEL_EMPLOYEE,
  Roles.RESTAURANT_EMPLOYEE,
  Roles.RESTAURANT_MANAGER,
  Roles.HOTEL_MANAGER,
];
redirectIfUnauthorized(permitedRoles, "/");

const employeeId = computed(() => String(user.value?.employeeId || ""));

const paymentsSvc = useWeeklyPaymentService();
const { data, pending, error } = await useAsyncData(
  () => `my-payments:${employeeId.value}`,
  () => (employeeId.value ? paymentsSvc.getPaymentsByEmployee(employeeId.value) : Promise.resolve([])),
  { watch: [employeeId], server: true }
);

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(d);
}
function fmtDateTime(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "short", timeStyle: "short" }).format(d);
}
function fmtCurrency(n: number | string | null | undefined) {
  try { return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(Number(n || 0)); } catch { return `Q ${Number(n || 0).toFixed(2)}` }
}

const items = computed(() => {
  const list = (data.value as any[]) || [];
  return list.map((p, i) => ({
    ...p,
    _index: i + 1,
    weekStartFmt: fmtDate(p.weekStart),
    amountFmt: fmtCurrency(p.amount),
    paidAtFmt: fmtDateTime(p.paidAt),
    createdAtFmt: fmtDateTime(p.createdAt),
    updatedAtFmt: fmtDateTime(p.updatedAt),
  }));
});

const columns: Column[] = [
  { key: "_index", label: "#" },
  { key: "weekStartFmt", label: "Semana (inicio)" },
  { key: "amountFmt", label: "Monto" },
  { key: "paid", label: "Estado" },
  { key: "paidAtFmt", label: "Pagado el" },
  { key: "createdAtFmt", label: "Creado" },
];
</script>

<style scoped></style>
