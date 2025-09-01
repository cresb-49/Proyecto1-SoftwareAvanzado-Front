<template>
  <div class="min-h-screen bg-sand-100 text-brand-800">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-sand-300 bg-sage-500 backdrop-blur">
      <nav class="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <NuxtLink
          to="/"
          class="text-2xl font-semibold tracking-wide
                 text-sand-50 hover:text-sand-50/90
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand-50/40 rounded-sm
                 drop-shadow"
        >
          Comer y Dormir
        </NuxtLink>

        <NavUser />
      </nav>
    </header>

    <!-- Main -->
    <main class="mx-auto max-w-7xl px-4 py-6">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="border-t border-sand-300 bg-olive-600">
      <div class="mx-auto max-w-7xl px-4 py-6 text-sm text-sand-50">
        © {{ year }} Comer y Dormir
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>