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

    <!-- Select -->
    <section>
      <Select
        class="mb-4"
        v-model="categoria"
        :options="opcionesCategoria"
        label="Categoría"
        placeholder="Selecciona categoría…"
        size="md"
        clearable
      />
      <Select
        class="mb-4"
        v-model="capacidad"
        :options="opcionesCapacidad"
        label="Capacidad"
        placeholder="Selecciona capacidad…"
        size="sm"
        value-type="number"
      />
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

    <section>
      <Table
        :columns="cols"
        :items="data"
        v-model:page="page"
        v-model:search="search"
        :page-size="5"
        size="md"
      >
        <template #title>Hoteles</template>

        <!-- Celda personalizada de ACCIONES -->
        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end gap-2">
            <Button size="sm" variant="info" @click="onView(row)">Ver</Button>
            <Button size="sm" variant="warning" @click="onEdit(row)"
              >Editar</Button
            >
            <Button size="sm" variant="danger" @click="onDelete(row)"
              >Eliminar</Button
            >
          </div>
        </template>
      </Table>

      <!-- Vista de la “info recuperada” al presionar -->
      <div
        v-if="lastAction"
        class="rounded-xl border border-sand-300 bg-white p-4"
      >
        <div class="text-sm text-brand-700">
          Última acción:
          <span class="font-semibold">{{ lastAction.type.toUpperCase() }}</span>
        </div>
        <pre class="mt-2 max-h-64 overflow-auto text-sm text-brand-800">{{
          lastActionJson
        }}</pre>
      </div>
    </section>

    <section>
      <Card
        class="mb-4"
        img="https://picsum.photos/640/360?random=1"
        title="Hotel La Terraza"
        subtitle="Antigua Guatemala"
        variant="elevated"
      >
        <p class="text-brand-800 text-sm">
          Habitación doble desde <strong class="text-brand-800">Q650</strong> /
          noche.
        </p>

        <template #footer>
          <div class="flex items-center justify-between">
            <span class="text-sm text-brand-700">⭐ 4.5</span>
            <Button size="sm" variant="primary">Reservar</Button>
          </div>
        </template>
      </Card>
      <Card
        class="mb-4"
        to="/hoteles/1"
        title="Vista Mar"
        subtitle="Puerto San José"
        variant="outline"
      >
        <p class="text-sm text-brand-800">
          Frente a la playa. Desayuno incluido.
        </p>
      </Card>
      <Card variant="soft">
        <template #media>
          <div class="aspect-[16/9] grid place-items-center text-brand-700">
            Mapa / galería
          </div>
        </template>

        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-brand-900">Café Canela</h3>
              <p class="text-sm text-brand-700">Zona 4, Guatemala</p>
            </div>
            <Button size="sm" variant="secondary">Compartir</Button>
          </div>
        </template>

        <p class="text-sm text-brand-800">
          Menú brunch y pan artesanal. Promedio <strong>Q85</strong>.
        </p>

        <template #footer>
          <div class="flex items-center justify-end gap-2">
            <Button size="sm" variant="info">Ver</Button>
            <Button size="sm" variant="warning">Editar</Button>
            <Button size="sm" variant="danger">Eliminar</Button>
          </div>
        </template>
      </Card>
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
import Table, { type Column } from "~/components/ui/Table.vue";
import Select from "~/components/ui/Select.vue";
import Card from "~/components/ui/Card.vue";
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

/*Select*/
const categoria = ref<string | null>(null);
const capacidad = ref<number | null>(null);

const opcionesCategoria = [
  { label: "Hotel", value: "hotel" },
  { label: "Restaurante", value: "restaurante" },
  { label: "Cafetería", value: "cafe" },
];

const opcionesCapacidad = [
  { label: "1–10", value: 10 },
  { label: "11–30", value: 30 },
  { label: "31–60", value: 60 },
];

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

/* Tabla */
type Hotel = {
  id: number;
  nombre: string;
  ciudad: string;
  precio: number;
  rating: number;
};

const cols: Column<Hotel>[] = [
  { key: "nombre", label: "Hotel", sortable: true },
  { key: "ciudad", label: "Ciudad", sortable: true },
  {
    key: "precio",
    label: "Precio",
    sortable: true,
    align: "right",
    format: (v) =>
      new Intl.NumberFormat("es-GT", {
        style: "currency",
        currency: "GTQ",
      }).format(v),
  },
  { key: "rating", label: "⭐", sortable: true, align: "center" },
  { key: "acciones", label: "Acciones", align: "right" }, // columna "virtual" para botones
];

const data = ref<Hotel[]>([
  { id: 1, nombre: "La Terraza", ciudad: "Antigua", precio: 650, rating: 4.5 },
  {
    id: 2,
    nombre: "Vista Mar",
    ciudad: "Puerto San José",
    precio: 780,
    rating: 4.2,
  },
  { id: 3, nombre: "Casa Café", ciudad: "Guatemala", precio: 520, rating: 4.0 },
]);

// Estados de la tabla
const page = ref(1);
const search = ref("");

// “Captura” de la última acción realizada
const lastAction = ref<{
  type: "ver" | "editar" | "eliminar";
  row: Hotel;
} | null>(null);
const lastActionJson = computed(() =>
  lastAction.value ? JSON.stringify(lastAction.value.row, null, 2) : ""
);

// Handlers de acciones
function onView(row: Hotel) {
  lastAction.value = { type: "ver", row };
  // Ejemplo: navegar
  // navigateTo(`/hoteles/${row.id}`)
}

function onEdit(row: Hotel) {
  lastAction.value = { type: "editar", row };
  // Ejemplo: abrir modal de edición...
}

function onDelete(row: Hotel) {
  const ok = confirm(`¿Eliminar "${row.nombre}"?`);
  if (!ok) return;
  data.value = data.value.filter((r) => r.id !== row.id);
  lastAction.value = { type: "eliminar", row };
}
</script>
