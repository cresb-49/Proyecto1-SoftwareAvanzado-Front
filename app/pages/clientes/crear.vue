<template>
  <div class="mx-auto max-w-xl px-4 py-6 space-y-6">
    <!-- Toolbar -->
    <div class="flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/clientes">← Regresar</Button>
      <h1 class="text-lg font-semibold text-brand-900">Crear cliente</h1>
    </div>

    <Card
      variant="elevated"
      title="Nuevo cliente"
      subtitle="Registra un cliente simple"
    >
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <InputText
          v-model="form.firstName"
          label="Nombre *"
          placeholder="María"
          :error="errors.firstName"
          size="md"
        />
        <InputText
          v-model="form.lastName"
          label="Apellidos *"
          placeholder="López García"
          :error="errors.lastName"
          size="md"
        />
        <InputText
          v-model="form.nit"
          label="NIT *"
          placeholder="#######-#"
          :error="errors.nit"
          size="md"
          class="sm:col-span-2"
        />

        <!-- Acciones -->
        <div class="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button variant="secondary" to="/clientes" type="button"
            >Cancelar</Button
          >
          <Button variant="primary" :loading="saving" type="submit"
            >Crear cliente</Button
          >
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { reactive, ref } from "vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import InputText from "~/components/ui/InputText.vue";
import { useToast } from "~/composables/useToast";
import { useClientService } from "~/services/client";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";

const { redirectIfUnauthorized } = useUseRoles();
const allowed = [
  Roles.ADMIN,
  Roles.RESTAURANT_EMPLOYEE,
  Roles.RESTAURANT_MANAGER,
  Roles.HOTEL_EMPLOYEE,
  Roles.HOTEL_MANAGER,
];
redirectIfUnauthorized(allowed, "/");

const toast = useToast();
const clientSvc = useClientService();

// --- Formulario ---
const form = reactive<{ firstName: string; lastName: string; nit: string }>({
  firstName: "",
  lastName: "",
  nit: "",
});

const errors = reactive<Record<string, string>>({
  firstName: "",
  lastName: "",
  nit: "",
});
const saving = ref(false);

function validate() {
  errors.firstName = form.firstName.trim() ? "" : "Requerido";
  errors.lastName = form.lastName.trim() ? "" : "Requerido";
  const nit = form.nit.trim();
  errors.nit = !nit
    ? "Requerido"
    : nit.length > 20
    ? "Máximo 20 caracteres"
    : "";
  return Object.values(errors).every((v) => !v);
}

async function onSubmit() {
  if (!validate()) return;
  try {
    saving.value = true;
    await clientSvc.create({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      nit: form.nit.trim(),
    });
    toast.success("Cliente creado correctamente");
    navigateTo("/clientes");
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo crear el cliente";
    toast.error("Error", { description: msg });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped></style>
