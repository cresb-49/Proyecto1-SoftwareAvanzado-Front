<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-8">
    <!-- Perfil -->
    <Card
      variant="elevated"
      title="Mi perfil"
      subtitle="Actualiza tu información básica"
    >
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSaveProfile">
        <div
          v-if="isCustomer"
          class="sm:col-span-2 rounded-md border border-sand-300 bg-sand-50 px-3 py-2 text-sm"
        >
          <div class="flex items-center justify-between">
            <span class="text-brand-700">NIT asociado</span>
            <span class="font-medium text-brand-900">{{
              clientNit || "—"
            }}</span>
          </div>
          <p v-if="pendingClient" class="mt-1 text-xs text-brand-700">
            Cargando datos de cliente…
          </p>
          <p v-else-if="!clientNit" class="mt-1 text-xs text-burgundy-700">
            No hay NIT asociado a tu cuenta.
          </p>
        </div>
        <p
          class="sm:col-span-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-xs text-burgundy-700"
        >
          Por seguridad, al <strong>guardar cambios de tu perfil</strong> se
          cerrará tu sesión y serás redirigido a la página de inicio.
        </p>
        <InputText
          v-model="profile.username"
          label="Usuario *"
          placeholder="usuario"
          :error="errors.username"
          size="md"
        />
        <InputText
          v-model="profile.email"
          type="email"
          label="Correo electrónico"
          placeholder="tucorreo@ejemplo.com"
          :error="errors.email"
          size="md"
        />

        <InputText
          v-model="profile.firstNames"
          label="Nombres *"
          placeholder="María José"
          :error="errors.firstNames"
          size="md"
        />
        <InputText
          v-model="profile.lastNames"
          label="Apellidos *"
          placeholder="Pérez López"
          :error="errors.lastNames"
          size="md"
        />

        <InputText
          v-model="profile.phone"
          label="Teléfono *"
          placeholder="8 dígitos"
          :error="errors.phone"
          size="md"
          class="sm:col-span-2"
        />

        <div class="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            type="button"
            @click="onRestoreProfile"
            :disabled="savingProfile"
            >Restaurar</Button
          >
          <Button variant="primary" :loading="savingProfile" type="submit"
            >Guardar cambios</Button
          >
        </div>
      </form>
    </Card>

    <!-- Password -->
    <Card
      variant="elevated"
      title="Cambiar contraseña"
      subtitle="Asegura tu cuenta con una contraseña nueva"
    >
      <form
        class="grid gap-4 sm:grid-cols-2"
        @submit.prevent="onChangePassword"
      >
        <p
          class="sm:col-span-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-xs text-burgundy-700"
        >
          Por seguridad, al <strong>cambiar tu contraseña</strong> se cerrará tu
          sesión y serás redirigido a la página de inicio.
        </p>
        <InputText
          v-model="pwd.oldPassword"
          type="password"
          label="Contraseña actual *"
          placeholder="••••••"
          :error="pwdErrors.oldPassword"
          size="md"
          class="sm:col-span-2"
        />
        <InputText
          v-model="pwd.newPassword"
          type="password"
          label="Nueva contraseña *"
          placeholder="••••••"
          :error="pwdErrors.newPassword"
          size="md"
          class="sm:col-span-2"
        />
        <div class="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button variant="primary" :loading="savingPwd" type="submit"
            >Actualizar contraseña</Button
          >
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { reactive, ref, computed, watchEffect } from "vue";
import InputText from "~/components/ui/InputText.vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useAuth } from "~/composables/useAuth";
import { useUserService } from "~/services/users";
import { useToast } from "~/composables/useToast";
import type { User, UpdatePassword } from "~/services/users";
import { useUseRoles } from "~/composables/useRoles";
import { Roles } from "#imports";
import { useClientService } from "~/services/client";
import type { Client } from "~/services/client";

const toast = useToast();
const users = useUserService();
const auth = useAuth();
const { hasAnyRole } = useUseRoles();
const { user } = useAuth();

const {
  data: meData,
  pending: pendingMe,
  error: errorMe,
  refresh: refreshMe,
} = await useAsyncData(
  () => `user:${auth.user?.value?.id ?? "anon"}`,
  () =>
    auth.user.value?.id
      ? users.getById(String(auth.user.value?.id))
      : Promise.resolve({} as User),
  { server: true }
);
const me = computed<User>(() => (meData.value as User) || ({} as User));
const isCustomer = computed(() => hasAnyRole([Roles.CUSTOMER]));

const clients = useClientService();
const clientId = computed(() => String(user.value?.clientId || ""));
const { data: clientData, pending: pendingClient } = await useAsyncData(
  () => `client:${clientId.value || "none"}`,
  () =>
    isCustomer.value && clientId.value
      ? clients.getById(clientId.value)
      : Promise.resolve(null),
  { watch: [isCustomer, clientId] }
);
const clientNit = computed<string | null>(() => {
  const c = clientData.value as Client | null;
  return c?.nit ?? null;
});

const profile = reactive<{
  username: string;
  email: string;
  firstNames: string;
  lastNames: string;
  nameRole: string;
  phone: string;
}>({
  username: "",
  email: "",
  firstNames: "",
  lastNames: "",
  nameRole: "",
  phone: "",
});

const original = ref<any>(null);

const errors = reactive<Record<string, string>>({
  username: "",
  email: "",
  firstNames: "",
  lastNames: "",
  nameRole: "",
  phone: "",
});
const savingProfile = ref(false);

const initialized = ref(false);
watchEffect(() => {
  const u = me.value as any;
  if (!initialized.value && u && u.id) {
    profile.username = u.username || "";
    profile.email = u.email || "";
    profile.firstNames = u.firstNames || "";
    profile.lastNames = u.lastNames || "";
    profile.nameRole = u.roleName || "";
    profile.phone = u.phone || "";
    original.value = { ...profile };
    initialized.value = true;
  }
});

function isEmailValid(email: string) {
  if (!email) return true; // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateProfile() {
  const u = profile.username.trim();
  errors.username = !u
    ? "Requerido"
    : u.length < 3
    ? "Mínimo 3"
    : u.length > 20
    ? "Máximo 20"
    : "";

  errors.email = isEmailValid(profile.email.trim()) ? "" : "Correo inválido";

  const fn = profile.firstNames.trim();
  errors.firstNames = !fn
    ? "Requerido"
    : fn.length < 3
    ? "Mínimo 3"
    : fn.length > 50
    ? "Máximo 50"
    : "";

  const ln = profile.lastNames.trim();
  errors.lastNames = !ln
    ? "Requerido"
    : ln.length < 3
    ? "Mínimo 3"
    : ln.length > 50
    ? "Máximo 50"
    : "";

  const ph = profile.phone.trim();
  errors.phone = !ph
    ? "Requerido"
    : /^\d{8}$/.test(ph)
    ? ""
    : "Debe tener 8 dígitos";

  errors.nameRole = profile.nameRole ? "" : "Requerido";

  return Object.values(errors).every((v) => !v);
}

function onRestoreProfile() {
  if (original.value) {
    Object.assign(profile, original.value);
  }
}

async function onSaveProfile() {
  if (!validateProfile()) return;
  if (!me.value?.id) {
    toast.error("No se pudo identificar el usuario");
    return;
  }
  try {
    savingProfile.value = true;
    const payload: Pick<
      User,
      "username" | "email" | "firstNames" | "lastNames" | "phone"
    > = {
      username: profile.username.trim(),
      email: (profile.email.trim() || undefined) as User["email"],
      firstNames: profile.firstNames.trim(),
      lastNames: profile.lastNames.trim(),
      phone: profile.phone.trim(),
    };
    const updated = await users.update(String(me.value.id), payload);
    original.value = { ...profile };
    toast.success("Perfil actualizado");
    await auth.logout?.();
    navigateTo("/");
    return;
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo actualizar el perfil";
    toast.error("Error", { description: msg });
  } finally {
    savingProfile.value = false;
  }
}

// ------- Cambio de password -------
const pwd = reactive<Pick<UpdatePassword, "oldPassword" | "newPassword">>({
  oldPassword: "",
  newPassword: "",
});
const pwdErrors = reactive<{ oldPassword: string; newPassword: string }>({
  oldPassword: "",
  newPassword: "",
});
const savingPwd = ref(false);

function validatePwd() {
  const o = pwd.oldPassword;
  const n = pwd.newPassword;
  pwdErrors.oldPassword = !o
    ? "Requerido"
    : o.length < 6
    ? "Mínimo 6"
    : o.length > 50
    ? "Máximo 50"
    : "";
  pwdErrors.newPassword = !n
    ? "Requerido"
    : n.length < 6
    ? "Mínimo 6"
    : n.length > 50
    ? "Máximo 50"
    : "";
  return !pwdErrors.oldPassword && !pwdErrors.newPassword;
}

async function onChangePassword() {
  if (!validatePwd()) return;
  try {
    savingPwd.value = true;
    await users.updatePassword({
      userId: String(me.value.id),
      oldPassword: pwd.oldPassword,
      newPassword: pwd.newPassword,
    });
    toast.success("Contraseña actualizada");
    await auth.logout?.();
    navigateTo("/");
    return;
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo actualizar la contraseña";
    toast.error("Error", { description: msg });
  } finally {
    savingPwd.value = false;
  }
}
</script>

<style scoped></style>
