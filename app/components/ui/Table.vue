<script setup lang="ts">
import { computed, ref } from "vue";

type Size = "sm" | "md" | "lg";
type SortDir = "asc" | "desc" | null;

export interface Column<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  format?: (value: any, row: T) => string;
}

interface Props<T = any> {
  columns: Column<T>[];
  items: T[];
  keyField?: string; // id por defecto
  size?: Size;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  loading?: boolean;
  emptyText?: string;
  pageSize?: number;
  showSearch?: boolean;
  selectable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  keyField: "id",
  size: "md",
  striped: true,
  hover: true,
  bordered: true,
  loading: false,
  emptyText: "Sin datos",
  pageSize: 10,
  showSearch: true,
  selectable: false,
});

// v-models
const page = defineModel<number>("page", { default: 1 });
const selected = defineModel<Array<string | number>>("selected", {
  default: [],
});
const search = defineModel<string>("search", { default: "" });

// tamaños
const sizeMap: Record<Size, { th: string; td: string; text: string }> = {
  sm: { th: "px-3 py-2", td: "px-3 py-2", text: "text-sm" },
  md: { th: "px-4 py-3", td: "px-4 py-3", text: "text-base" },
  lg: { th: "px-5 py-4", td: "px-5 py-4", text: "text-base" },
};

// sorting
const sortBy = ref<string | null>(null);
const sortDir = ref<SortDir>(null);
function toggleSort(key: string) {
  if (sortBy.value !== key) {
    sortBy.value = key;
    sortDir.value = "asc";
  } else {
    sortDir.value =
      sortDir.value === "asc"
        ? "desc"
        : sortDir.value === "desc"
        ? null
        : "asc";
    if (!sortDir.value) sortBy.value = null;
  }
  page.value = 1;
}

const filtered = computed(() => {
  if (!search.value?.trim()) return props.items;
  const q = search.value.toLowerCase();
  return props.items.filter((row: any) =>
    Object.values(row ?? {}).some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(q)
    )
  );
});

const sorted = computed(() => {
  if (!sortBy.value || !sortDir.value) return filtered.value;
  const dir = sortDir.value === "asc" ? 1 : -1;
  return [...filtered.value].sort((a: any, b: any) => {
    const va = a[sortBy.value as any];
    const vb = b[sortBy.value as any];
    if (va == null && vb == null) return 0;
    if (va == null) return -1 * dir;
    if (vb == null) return 1 * dir;
    if (typeof va === "number" && typeof vb === "number")
      return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sorted.value.length / props.pageSize))
);
const paged = computed(() => {
  const start = (page.value - 1) * props.pageSize;
  return sorted.value.slice(start, start + props.pageSize);
});

function toggleAll(checked: boolean) {
  if (!props.selectable) return;
  if (checked) {
    selected.value = paged.value.map(
      (r: any) => r[props.keyField as any]
    ) as any;
  } else {
    selected.value = [];
  }
}
function toggleRow(key: string | number, checked: boolean) {
  if (!props.selectable) return;
  const set = new Set(selected.value);
  checked ? set.add(key) : set.delete(key);
  selected.value = Array.from(set);
}

const headerClasses = computed(() =>
  ["bg-sand-100 text-brand-800", sizeMap[props.size].text].join(" ")
);
const rowBase = computed(() =>
  [
    sizeMap[props.size].text,
    props.striped ? "even:bg-sand-50" : "",
    props.hover ? "hover:bg-sand-50" : "",
  ].join(" ")
);
</script>

<template>
  <div
    class="rounded-xl bg-white shadow-sm"
    :class="bordered ? 'border border-sand-300' : ''"
  >
    <!-- Toolbar -->
    <div
      class="flex items-center justify-between gap-3 border-b border-sand-300 px-4 py-3"
    >
      <div class="text-sm font-medium text-brand-800">
        <slot name="title">Listado</slot>
      </div>
      <div class="flex items-center gap-3">
        <slot name="actions" />
        <div v-if="showSearch" class="relative">
          <input
            v-model="search"
            type="search"
            placeholder="Buscar…"
            class="h-9 w-56 rounded-md border border-sand-300 bg-white px-3 text-sm text-brand-800 placeholder-brand-700/50 focus:border-brand-600 focus:ring-0 focus:outline-none"
          />
          <span
            class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brand-700/60 text-xs"
            >⌘K</span
          >
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full">
        <thead :class="headerClasses">
          <tr>
            <th v-if="selectable" class="w-10">
              <input
                type="checkbox"
                :checked="paged.length && paged.every((r: any) => selected.includes(r[keyField as any]))"
                @change="toggleAll(($event.target as HTMLInputElement).checked)"
                class="mx-4 h-4 w-4 rounded border-sand-300 text-brand-600 focus:ring-0"
              />
            </th>
            <th
              v-for="col in columns"
              :key="String(col.key)"
              :class="[
                sizeMap[size].th,
                'whitespace-nowrap text-left font-semibold border-b border-sand-300',
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left',
              ]"
            >
              <button
                v-if="col.sortable"
                class="inline-flex items-center gap-1 hover:text-brand-600"
                @click="toggleSort(String(col.key))"
              >
                <span>{{ col.label }}</span>
                <svg
                  v-if="sortBy === String(col.key) && sortDir === 'asc'"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                >
                  <path fill="currentColor" d="M10 6l5 6H5z" />
                </svg>
                <svg
                  v-else-if="sortBy === String(col.key) && sortDir === 'desc'"
                  class="h-3.5 w-3.5"
                  viewBox="0 0 20 20"
                >
                  <path fill="currentColor" d="M10 14L5 8h10z" />
                </svg>
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
        </thead>

        <tbody v-if="!loading && paged.length">
          <tr
            v-for="row in paged"
            :key="String((row as any)[keyField])"
            :class="['border-b border-sand-300/60', rowBase]"
          >
            <td v-if="selectable" class="w-10">
              <input
                type="checkbox"
                :checked="selected.includes((row as any)[keyField])"
                @change="
                  toggleRow(
                    (row as any)[keyField],
                    ($event.target as HTMLInputElement).checked
                  )
                "
                class="mx-4 h-4 w-4 rounded border-sand-300 text-brand-600 focus:ring-0"
              />
            </td>
            <td
              v-for="col in columns"
              :key="String(col.key)+'-'+String((row as any)[keyField])"
              :class="[
                sizeMap[size].td,
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left',
              ]"
            >
              <slot
                :name="`cell-${String(col.key)}`"
                :value="(row as any)[col.key as any]"
                :row="row"
              >
                {{
                  col.format
                    ? col.format((row as any)[col.key as any], row)
                    : (row as any)[col.key as any]
                }}
              </slot>
            </td>
          </tr>
        </tbody>

        <!-- Loading / Empty -->
        <tbody v-else>
          <tr>
            <td
              :colspan="columns.length + (selectable ? 1 : 0)"
              class="px-4 py-10 text-center text-brand-700"
            >
              <div
                v-if="loading"
                class="inline-flex items-center gap-2 text-brand-700"
              >
                <svg
                  class="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Cargando…
              </div>
              <div v-else>{{ emptyText }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      class="flex items-center justify-between gap-3 border-t border-sand-300 px-4 py-3 text-sm text-brand-700"
    >
      <div>Página {{ page }} de {{ totalPages }}</div>
      <div class="flex items-center gap-2">
        <button
          class="rounded-md border border-sand-300 px-3 py-1.5 hover:bg-sand-50 disabled:opacity-40"
          :disabled="page <= 1"
          @click="page = Math.max(1, page - 1)"
        >
          Anterior
        </button>
        <button
          class="rounded-md border border-sand-300 px-3 py-1.5 hover:bg-sand-50 disabled:opacity-40"
          :disabled="page >= totalPages"
          @click="page = Math.min(totalPages, page + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>
