<script setup lang="ts">
import { computed } from "vue";
type Size = "sm" | "md" | "lg";

interface Props {
  modelValue?: boolean;
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  size?: Size;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
  required: false,
  size: "md",
});
const emit = defineEmits<{ "update:modelValue": [boolean] }>();
const uid = Math.random().toString(36).slice(2);
const inputId = computed(() => props.id ?? `ichk-${uid}`);

const boxSize: Record<Size, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};
const labelSize: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};
</script>

<template>
  <div>
    <div class="flex items-center gap-2">
      <input
        :id="inputId"
        type="checkbox"
        :checked="modelValue"
        :disabled="disabled"
        :required="required"
        @change="
          $emit(
            'update:modelValue',
            ($event.target as HTMLInputElement).checked
          )
        "
        :class="[
          'rounded border-sand-300 text-brand-600 focus:ring-brand-400',
          boxSize[size],
        ]"
      />
      <label
        v-if="label"
        :for="inputId"
        :class="['text-brand-800', labelSize[size]]"
      >
        {{ label }}<span v-if="required" class="text-terra-500"> *</span>
      </label>
    </div>
    <p v-if="hint && !error" class="mt-1 text-xs text-brand-700">{{ hint }}</p>
    <p v-if="error" class="mt-1 text-xs text-terra-500">{{ error }}</p>
  </div>
</template>
