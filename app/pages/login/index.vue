<script setup lang="ts">
definePageMeta({
  middleware: ["guest-only"],
});
import InputText from "~/components/ui/InputText.vue";
import Button from "~/components/ui/Button.vue";
import { useAuth } from "~/composables/useAuth"; // asumiendo que ya lo tienes
import { reactive, ref } from "vue";
import { useToast } from "~/composables/useToast";

const toast = useToast();
const { login, isLoggedIn } = useAuth();

const form = reactive({
  user: "",
  password: "",
});

const errors = reactive<{ user?: string; password?: string; global?: string }>(
  {}
);
const loading = ref(false);

function validate() {
  errors.user = form.user ? "" : "Requerido";
  errors.password = form.password ? "" : "Requerido";
  errors.global = "";
  return !errors.user && !errors.password;
}

async function onSubmit() {
  if (!validate()) return;
  try {
    loading.value = true;
    // tu composable puede esperar (email, password); aquí pasamos user como primer arg
    await login(form.user as unknown as string, form.password);
    toast.info("Inicio de sesión exitoso");
    // redirige donde quieras
    //Obtenemos el valor de redirect
    const redirect = useRoute().query.redirect || "/";
    await navigateTo(redirect as string);
  } catch (e) {
    errors.global = "Usuario o contraseña inválidos";
    toast.error("Error al iniciar sesión");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center px-4">
    <div class="w-full max-w-[400px] py-10">
      <div
        class="w-full rounded-2xl border border-sand-300 bg-white p-5 sm:p-6 shadow-sm"
      >
        <h1 class="mb-1 text-xl font-semibold text-brand-900">
          Iniciar sesión
        </h1>
        <p class="mb-4 text-sm text-brand-700">Ingresa tus credenciales.</p>

        <form class="grid gap-4" @submit.prevent="onSubmit">
          <InputText
            v-model="form.user"
            label="Usuario"
            placeholder="Tu usuario"
            :error="errors.user"
            :disabled="loading"
            size="md"
          />
          <InputText
            v-model="form.password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            :error="errors.password"
            :disabled="loading"
            size="md"
          />

          <p v-if="errors.global" class="text-sm text-terra-600">
            {{ errors.global }}
          </p>

          <div class="mt-2 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              :disabled="loading"
              @click="$router.back()"
              >Cancelar</Button
            >
            <Button
              variant="info"
              to="/registro"
            >
              Registrarse
            </Button>
            <Button variant="primary" :loading="loading" type="submit"
              >Entrar</Button
            >
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
