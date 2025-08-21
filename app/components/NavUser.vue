<script setup lang="ts">
const { user, isLoggedIn, logout } = useAuth()
</script>

<template>
  <div class="flex items-center gap-3">
    <template v-if="isLoggedIn">
      <span class="text-sm text-sand-50/90">Hola, {{ user?.name }}</span>

      <!-- Outline claro sobre header verde -->
      <button
        @click="logout"
        class="inline-flex items-center rounded-md px-3 py-1.5 text-sm
               text-olive-600 border border-sand-50/80
               hover:bg-sand-50/10
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-50/60
               focus-visible:ring-offset-2 focus-visible:ring-offset-sage-500"
      >
        Salir
      </button>
    </template>

    <!-- Botón claro que destaca -->
    <NuxtLink
      v-else
      to="/login"
      class="inline-flex items-center rounded-md px-3 py-1.5 text-sm
             bg-sand-50 text-olive-600
             hover:bg-sand-100
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-600/40
             focus-visible:ring-offset-2 focus-visible:ring-offset-sage-500"
    >
      Entrar
    </NuxtLink>
  </div>
</template>