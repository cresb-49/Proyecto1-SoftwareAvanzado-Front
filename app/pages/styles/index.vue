<template>
  <div class="mx-auto max-w-2xl space-y-10 px-4 py-6">
    <!-- Título de la página -->
    <header>
      <h1 class="text-2xl font-semibold text-brand-800">Demo de Botones</h1>
      <p class="text-sm text-brand-700">Variantes y tamaños</p>
    </header>

    <!-- Tamaños -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Tamaños</h2>
      <div class="gap-3">
        <Button class="mr-2" size="sm">Pequeño</Button>
        <Button class="mr-2" size="md">Mediano</Button>
        <Button class="mr-2" size="lg">Grande</Button>
      </div>
    </section>

    <!-- Variantes -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Variantes</h2>
      <div class="">
        <Button class="mr-2" variant="primary">Primario</Button>
        <Button class="mr-2" variant="secondary">Secundario</Button>
        <Button class="mr-2" variant="success">Éxito</Button>
        <Button class="mr-2" variant="danger">Peligro</Button>
        <Button class="mr-2" variant="warning">Aviso</Button>
        <Button variant="info">Info</Button>
      </div>
    </section>

    <!-- Enlace / bloque -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Como enlace y en bloque</h2>
      <div class="">
        <Button block to="/login" variant="info" size="lg">Ir a Login</Button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from '~/components/ui/Button.vue'
</script>