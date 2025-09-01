<script setup lang="ts">
import { computed } from "vue";

type Variant = "elevated" | "outline" | "soft";
type Size = "sm" | "md" | "lg";

interface Props {
  title?: string;
  subtitle?: string;
  img?: string;
  variant?: Variant;
  size?: Size;
  to?: string | Record<string, any>;
  hover?: boolean;
  footerDivider?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "elevated",
  size: "md",
  hover: true,
  footerDivider: false,
});

const padMap: Record<Size, string> = { sm: "p-4", md: "p-5", lg: "p-6" };
const headerPadMap: Record<Size, string> = {
  sm: "px-4 py-3",
  md: "px-5 py-4",
  lg: "px-6 py-4",
};

/* ✔️ ring para un borde más visible en el esquema beige */
const variantMap: Record<Variant, string> = {
  elevated: "bg-white ring-1 ring-sand-300 shadow-sm",
  outline: "bg-white ring-1 ring-sand-400 shadow-none", // ← borde definido
  soft: "bg-sand-50 ring-1 ring-sand-300 shadow-none",
};

const rootClass = computed(() =>
  [
    "rounded-xl overflow-hidden transition-shadow",
    variantMap[props.variant],
    props.hover || props.to ? "hover:shadow-md" : "",
  ].join(" ")
);

/* Header claro para elevated/outline; beige para soft */
const headerBg = computed(() =>
  props.variant === "soft" ? "bg-sand-50" : "bg-white"
);
const clickableClass =
  "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'div'"
    :to="to"
    :class="[rootClass, to && clickableClass]"
  >
    <!-- Media -->
    <div
      v-if="img || $slots.media"
      class="relative aspect-[16/9] w-full bg-sand-100"
    >
      <img v-if="img" :src="img" alt="" class="h-full w-full object-cover" />
      <slot v-else name="media" />
    </div>

    <!-- Header -->
    <div
      v-if="title || subtitle || $slots.header"
      :class="['border-b border-sand-300', headerBg, headerPadMap[size]]"
    >
      <slot name="header">
        <h3 v-if="title" class="text-brand-900 text-lg font-semibold">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-brand-700 text-sm">{{ subtitle }}</p>
      </slot>
    </div>

    <!-- Content -->
    <div :class="padMap[size]">
      <slot />
    </div>

    <!-- Footer -->
    <div
      v-if="$slots.footer"
      :class="[footerDivider ? 'border-t border-sand-300' : '', padMap[size]]"
    >
      <slot name="footer" />
    </div>
  </component>
</template>
