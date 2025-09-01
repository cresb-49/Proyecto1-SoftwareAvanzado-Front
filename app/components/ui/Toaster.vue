<script setup lang="ts">
import { useToast, type Toast } from "~/composables/useToast";

const { toasts, dismiss, pause, resume } = useToast();

const variantMap: Record<Toast["type"], string> = {
  success: "bg-sage-500 text-white",
  error: "bg-terra-600 text-white",
  info: "bg-sapphire-700 text-white",
  warning: "bg-gold-500 text-ink-900",
};
</script>

<template>
  <!-- Teleport para que siempre salgan arriba a la derecha -->
  <teleport to="body">
    <div
      class="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
    >
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-3">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto overflow-hidden rounded-lg shadow-md ring-1 ring-sand-300/60"
          :class="variantMap[t.type]"
          @mouseenter="pause(t.id)"
          @mouseleave="resume(t.id, t.duration)"
        >
          <div class="flex items-start gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p v-if="t.title" class="text-sm font-semibold leading-tight">
                {{ t.title }}
              </p>
              <p v-if="t.description" class="mt-0.5 text-xs/5 opacity-90">
                {{ t.description }}
              </p>
            </div>

            <button
              v-if="t.dismissible"
              @click="dismiss(t.id)"
              class="rounded-md p-1/2 opacity-80 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              :class="
                t.type === 'warning'
                  ? 'focus-visible:ring-gold-500/40'
                  : 'focus-visible:ring-sand-50/40'
              "
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <button
            v-if="t.action.label"
            class="w-full border-t border-white/10 px-4 py-2 text-left text-xs/5 underline underline-offset-2 opacity-95 hover:opacity-100"
            @click="t.action.onClick?.(t.id)"
          >
            {{ t.action.label }}
          </button>
        </div>
      </TransitionGroup>
    </div>
  </teleport>
</template>

<style scoped>
.toast-enter-from,
.toast-leave-to {
  transform: translateY(-8px);
  opacity: 0;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.18s ease-out;
}
</style>
