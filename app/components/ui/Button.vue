<!-- components/ui/Button.vue -->
<script setup lang="ts">
type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "info";
type Size = "sm" | "md" | "lg";

interface Props {
  variant?: Variant;
  size?: Size;
  to?: string | Record<string, any>;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  block?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  type: "button",
  disabled: false,
  block: false,
  loading: false,
});

const base =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none select-none " +
  "w-fit justify-self-start gap-2"; // no se estira en grid + espacio para icono/spinner

const sizeMap: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-1.5 text-md",
  lg: "px-6 py-1.5 text-lg",
};

const variantMap: Record<Variant, string> = {
  primary:
    "bg-brand-400 text-sand-50 hover:bg-brand-500 focus-visible:ring-brand-400",
  secondary:
    "border border-olive-600/75 text-olive-600 bg-white hover:bg-olive-600/10 focus-visible:ring-brand-400",
  success:
    "bg-sage-500 text-white hover:bg-olive-600 focus-visible:ring-sage-500/40",
  danger:
    "bg-terra-500 text-white hover:bg-terra-700 focus-visible:ring-terra-500/40",
  warning:
    "bg-gold-400 text-ink-900 hover:bg-gold-500 focus-visible:ring-gold-500/40",
  info: "bg-sapphire-700 text-white hover:bg-sapphire-700/70 focus-visible:ring-sapphire-700/40",
};

const classes = computed(() =>
  [
    base,
    sizeMap[props.size],
    variantMap[props.variant],
    props.block ? "w-full" : "",
  ].join(" ")
);
</script>

<template>
  <template v-if="to">
    <NuxtLink
      v-bind="to ? { to } : { type, disabled: disabled || loading }"
      :class="classes"
      :aria-busy="loading || undefined"
    >
      <!-- Spinner opcional cuando loading -->
      <svg
        v-if="loading"
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
      <slot />
    </NuxtLink>
  </template>
  <template v-else>
    <button
      v-bind="to ? { to } : { type, disabled: disabled || loading }"
      :class="classes"
      :aria-busy="loading || undefined"
    >
      <!-- Spinner opcional cuando loading -->
      <svg
        v-if="loading"
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
      <slot />
    </button>
  </template>
</template>
