<script setup lang="ts">
import { computed, ref, watch } from "vue";
type Size = "sm" | "md" | "lg";

interface Props {
  modelValue?: number | null;
  id?: string;
  label?: string;
  placeholder?: string;
  currency?: string;
  locale?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: Size;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  currency: "GTQ",
  locale: "es-GT",
  required: false,
  disabled: false,
  size: "md",
});
const emit = defineEmits<{ "update:modelValue": [number | null] }>();
const uid = Math.random().toString(36).slice(2);
const inputId = computed(() => props.id ?? `icur-${uid}`);

const base =
  "block w-full rounded-md border bg-white text-brand-800 placeholder-brand-700/50 border-sand-300 focus:border-brand-300 focus:ring-1 focus:outline-none";
const sizeMap: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-3 text-base",
  lg: "h-12 px-4 text-base",
};
const controlClass = computed(() =>
  [
    base,
    sizeMap[props.size],
    props.error &&
      "border-terra-500 focus:ring-terra-500/50 focus:border-terra-500",
  ]
    .filter(Boolean)
    .join(" ")
);

const nf = computed(
  () =>
    new Intl.NumberFormat(props.locale, {
      style: "currency",
      currency: props.currency,
    })
);
const display = ref("");

function parseCurrency(s: string): number | null {
  const cleaned = s.replace(/[^\d.,\-]/g, "");
  if (!cleaned) return null;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let idx = Math.max(lastComma, lastDot);
  if (idx === -1) idx = cleaned.length;
  const intPart = cleaned.slice(0, idx).replace(/[^\d\-]/g, "");
  const fracPart = cleaned.slice(idx + 1).replace(/[^\d]/g, "");
  const n = Number(fracPart ? `${intPart}.${fracPart}` : intPart);
  return Number.isFinite(n) ? n : null;
}

watch(
  () => props.modelValue,
  (v) => {
    display.value = v == null ? "" : nf.value.format(v);
  },
  { immediate: true }
);

function onFocus(e: FocusEvent) {
  (e.target as HTMLInputElement).select();
  display.value = props.modelValue == null ? "" : String(props.modelValue);
}
function onBlur() {
  display.value =
    props.modelValue == null ? "" : nf.value.format(props.modelValue);
}
function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value;
  display.value = raw;
  emit("update:modelValue", parseCurrency(raw));
}
</script>

<template>
  <label
    v-if="label"
    :for="inputId"
    class="mb-1 block text-sm font-medium text-brand-800"
  >
    {{ label }}<span v-if="required" class="text-terra-500"> *</span>
  </label>
  <input
    :id="inputId"
    type="text"
    :placeholder="placeholder || nf.format(0)"
    :disabled="disabled"
    :required="required"
    :value="display"
    @focus="onFocus"
    @blur="onBlur"
    @input="onInput"
    :class="controlClass"
  />
  <p v-if="hint && !error" class="mt-1 text-xs text-brand-700">{{ hint }}</p>
  <p v-if="error" class="mt-1 text-xs text-terra-500">{{ error }}</p>
</template>
