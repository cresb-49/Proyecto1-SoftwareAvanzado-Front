<script setup lang="ts">
import Toaster from './components/ui/Toaster.vue';

</script>

<template>
  <main>
    <Toaster />
    <NuxtLoadingIndicator
      :throttle="130"
      :height="4"
      color="var(--p-primary-400)"
    />
    <NuxtLayout />
  </main>
</template>