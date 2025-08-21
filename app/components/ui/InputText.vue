<script setup lang="ts">
import { computed } from "vue";
type Size = "sm" | "md" | "lg";

interface Props {
  modelValue?: string | null;
  id?: string;
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "search";
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: Size;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  type: "text",
  required: false,
  disabled: false,
  size: "md",
});
const emit = defineEmits<{ "update:modelValue": [string | null] }>();

const uid = Math.random().toString(36).slice(2);
const inputId = computed(() => props.id ?? `itxt-${uid}`);

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
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :value="modelValue ?? ''"
    @input="
      emit('update:modelValue', ($event.target as HTMLInputElement).value)
    "
    :class="controlClass"
  />
  <p v-if="hint && !error" class="mt-1 text-xs text-brand-700">{{ hint }}</p>
  <p v-if="error" class="mt-1 text-xs text-terra-500">{{ error }}</p>
</template>
