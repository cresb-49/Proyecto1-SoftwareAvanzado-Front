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

    <!-- Loading -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Loading</h2>
      <div class="flex flex-wrap items-center gap-3">
        <!-- Siempre cargando -->
        <Button variant="primary" :loading="true" size="sm">Cargando…</Button>

        <!-- Simular 2s -->
        <Button
          variant="info"
          :loading="loading"
          size="sm"
          @click="simulateLoading"
        >
          {{ loading ? "Cargando…" : "Simular carga 2s" }}
        </Button>
      </div>
      <p class="mt-2 text-xs text-brand-700">
        *El prop <code>loading</code> desactiva el botón automáticamente y
        muestra el spinner.
      </p>
    </section>

    <!-- Enlace / bloque -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">
        Como enlace y en bloque
      </h2>
      <div class="">
        <Button block to="/login" variant="info" size="lg">Ir a Login</Button>
      </div>
    </section>

    <!-- ========================= -->
    <!-- Inputs con tamaños (sm/md/lg) -->
    <!-- ========================= -->

    <!-- Texto -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Input: Texto</h2>
      <div class="grid gap-3">
        <InputText
          v-model="textSm"
          size="sm"
          label="Texto (sm)"
          placeholder="Ej. nombre corto"
        />
        <InputText
          v-model="textMd"
          size="md"
          label="Texto (md)"
          placeholder="Ej. título"
        />
        <InputText
          v-model="textLg"
          size="lg"
          label="Texto (lg)"
          placeholder="Ej. descripción breve"
        />
      </div>
    </section>

    <!-- Número -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Input: Número</h2>
      <div class="grid gap-3">
        <InputNumber
          v-model="numSm"
          size="sm"
          label="Número (sm)"
          :min="0"
          placeholder="0"
        />
        <InputNumber
          v-model="numMd"
          size="md"
          label="Número (md)"
          :min="0"
          placeholder="0"
        />
        <InputNumber
          v-model="numLg"
          size="lg"
          label="Número (lg)"
          :min="0"
          placeholder="0"
        />
      </div>
    </section>

    <!-- Moneda -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Input: Moneda</h2>
      <div class="grid gap-3">
        <InputCurrency
          v-model="curSm"
          size="sm"
          label="Precio (sm)"
          currency="GTQ"
          locale="es-GT"
        />
        <InputCurrency
          v-model="curMd"
          size="md"
          label="Precio (md)"
          currency="GTQ"
          locale="es-GT"
        />
        <InputCurrency
          v-model="curLg"
          size="lg"
          label="Precio (lg)"
          currency="GTQ"
          locale="es-GT"
        />
      </div>
    </section>

    <!-- Fecha -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Input: Fecha</h2>
      <div class="grid gap-3">
        <InputDate v-model="dateSm" size="sm" label="Fecha (sm)" />
        <InputDate v-model="dateMd" size="md" label="Fecha (md)" />
        <InputDate v-model="dateLg" size="lg" label="Fecha (lg)" />
      </div>
    </section>

    <!-- Checkbox -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Checkbox</h2>
      <div class="grid gap-3">
        <Checkbox v-model="chkSm" size="sm" label="Aceptar (sm)" />
        <Checkbox v-model="chkMd" size="md" label="Aceptar (md)" />
        <Checkbox v-model="chkLg" size="lg" label="Aceptar (lg)" />
      </div>
    </section>

    <!-- Radio -->
    <section>
      <h2 class="mb-1 text-lg font-semibold text-ink-900">Radio</h2>
      <div class="grid gap-6">
        <RadioGroup
          v-model="radSm"
          :options="tipoOptions"
          size="sm"
          label="Tipo (sm)"
          :inline="true"
        />
        <RadioGroup
          v-model="radMd"
          :options="tipoOptions"
          size="md"
          label="Tipo (md)"
          :inline="true"
        />
        <RadioGroup
          v-model="radLg"
          :options="tipoOptions"
          size="lg"
          label="Tipo (lg)"
          :inline="true"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import Button from "~/components/ui/Button.vue";
import InputText from "~/components/ui/InputText.vue";
import InputNumber from "~/components/ui/InputNumber.vue";
import InputCurrency from "~/components/ui/InputCurrency.vue";
import InputDate from "~/components/ui/InputDate.vue";
import Checkbox from "~/components/ui/Checkbox.vue";
import RadioGroup from "~/components/ui/RadioGroup.vue";
import { ref } from "vue";

const loading = ref(false);
const simulateLoading = async () => {
  if (loading.value) return;
  loading.value = true;
  await new Promise((r) => setTimeout(r, 2000));
  loading.value = false;
};

/* Texto */
const textSm = ref("");
const textMd = ref("");
const textLg = ref("");

/* Número */
const numSm = ref<number | null>(null);
const numMd = ref<number | null>(null);
const numLg = ref<number | null>(null);

/* Moneda */
const curSm = ref<number | null>(null);
const curMd = ref<number | null>(null);
const curLg = ref<number | null>(null);

/* Fecha */
const dateSm = ref<string | null>(null);
const dateMd = ref<string | null>(null);
const dateLg = ref<string | null>(null);

/* Checkbox */
const chkSm = ref(false);
const chkMd = ref(false);
const chkLg = ref(false);

/* Radio */
const tipoOptions = [
  { label: "Hotel", value: "hotel" },
  { label: "Restaurante", value: "restaurante" },
];
const radSm = ref<string | null>(null);
const radMd = ref<string | null>(null);
const radLg = ref<string | null>(null);
</script>
