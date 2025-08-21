<script setup lang="ts">
import { computed } from "vue";

type Size = "sm" | "md" | "lg";
type ValueType = "string" | "number";

interface Option {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Props {
  modelValue?: string | number | null;
  options: Option[];
  id?: string;
  label?: string;
  placeholder?: string; // Ej. "Selecciona una opción…"
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: Size;
  valueType?: ValueType; // cómo devolver el valor (por defecto string)
  clearable?: boolean; // si true, permite volver a null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  required: false,
  disabled: false,
  size: "md",
  valueType: "string",
  clearable: false,
});
const emit = defineEmits<{ "update:modelValue": [string | number | null] }>();

const uid = Math.random().toString(36).slice(2);
const selectId = computed(() => props.id ?? `sel-${uid}`);

const base =
  "block w-full appearance-none rounded-md border bg-white text-brand-800 " +
  "border-sand-300 focus:border-brand-600 focus:ring-0 focus:outline-none " +
  "placeholder-brand-700/50";

const sizeMap: Record<Size, string> = {
  sm: "h-8 pl-3 pr-8 text-sm",
  md: "h-10 pl-3 pr-8 text-base",
  lg: "h-12 pl-4 pr-9 text-base",
};
const controlClass = computed(() =>
  [
    base,
    sizeMap[props.size],
    props.error && "border-terra-500 focus:border-terra-500",
  ]
    .filter(Boolean)
    .join(" ")
);

function castValue(v: string): string | number | null {
  if (v === "") return null;
  return props.valueType === "number" ? Number(v) : v;
}

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value;
  emit("update:modelValue", castValue(v));
}
</script>

<template>
  <label
    v-if="label"
    :for="selectId"
    class="mb-1 block text-sm font-medium text-brand-800"
  >
    {{ label }}<span v-if="required" class="text-terra-500"> *</span>
  </label>

  <div class="relative">
    <select
      :id="selectId"
      :disabled="disabled"
      :required="required"
      :value="modelValue == null ? '' : String(modelValue)"
      @change="onChange"
      :class="controlClass"
    >
      <!-- Placeholder -->
      <option
        v-if="placeholder"
        :value="clearable ? '' : ''"
        :disabled="!clearable"
        hidden
      >
        {{ placeholder }}
      </option>

      <option
        v-for="opt in options"
        :key="String(opt.value)"
        :value="String(opt.value)"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </option>
    </select>

    <!-- Chevron -->
    <svg
      class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-700/70"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 011.04 1.08l-4.23 3.35a.75.75 0 01-.94 0L5.25 8.29a.75.75 0 01-.02-1.08z"
      />
    </svg>
  </div>

  <p v-if="hint && !error" class="mt-1 text-xs text-brand-700">{{ hint }}</p>
  <p v-if="error" class="mt-1 text-xs text-terra-500">{{ error }}</p>
</template>
