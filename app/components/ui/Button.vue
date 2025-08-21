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
}
const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  type: "button",
  disabled: false,
  block: false,
});

const base =
  "inline-flex items-center justify-center rounded-sm font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:pointer-events-none select-none " +
  "w-fit justify-self-start"; // ← clave: no se estira dentro de grids

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
  <NuxtLink v-if="to" :to="to" :class="classes"><slot /></NuxtLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
