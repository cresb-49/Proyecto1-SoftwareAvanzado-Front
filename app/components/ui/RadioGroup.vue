<script setup lang="ts">
type Size = "sm" | "md" | "lg";
interface Option {
  label: string;
  value: string | number;
  description?: string;
}
interface Props {
  modelValue?: string | number | null;
  name?: string;
  label?: string;
  options: Option[];
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  inline?: boolean;
  size?: Size;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  name: undefined,
  required: false,
  disabled: false,
  inline: false,
  size: "md",
});
const emit = defineEmits<{ "update:modelValue": [string | number | null] }>();
const groupName = props.name ?? `rg-${Math.random().toString(36).slice(2)}`;
const dotSize: Record<Size, string> = {
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
  <fieldset>
    <legend v-if="label" class="mb-1 block text-sm font-medium text-brand-800">
      {{ label }}<span v-if="required" class="text-terra-500"> *</span>
    </legend>

    <div :class="inline ? 'flex flex-wrap gap-4' : 'grid gap-2'">
      <label
        v-for="opt in options"
        :key="`${groupName}-${String(opt.value)}`"
        class="inline-flex items-start gap-2"
      >
        <input
          type="radio"
          :name="groupName"
          :value="opt.value"
          :checked="modelValue === opt.value"
          :disabled="disabled"
          @change="$emit('update:modelValue', opt.value)"
          :class="[
            'border-sand-300 text-brand-600 focus:ring-brand-400',
            dotSize[size],
          ]"
        />
        <span :class="['text-brand-800', labelSize[size]]">
          {{ opt.label }}
          <span v-if="opt.description" class="block text-xs text-brand-700">{{
            opt.description
          }}</span>
        </span>
      </label>
    </div>

    <p v-if="hint && !error" class="mt-1 text-xs text-brand-700">{{ hint }}</p>
    <p v-if="error" class="mt-1 text-xs text-terra-500">{{ error }}</p>
  </fieldset>
</template>
