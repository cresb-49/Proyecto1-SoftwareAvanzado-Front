<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-8">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" to="/usuarios">← Regresar</Button>
      <div class="text-sm text-brand-700" v-if="userLabel">
        Editando: <span class="font-medium text-brand-900">{{ userLabel }}</span>
      </div>
    </div>

    <!-- Editar usuario -->
    <Card variant="elevated" title="Editar usuario" subtitle="Actualiza la información básica">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSaveProfile">
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
          <Button variant="secondary" type="button" @click="onRestoreProfile" :disabled="savingProfile">Restaurar</Button>
          <Button variant="primary" :loading="savingProfile" type="submit">Guardar cambios</Button>
        </div>
      </form>
    </Card>

    <!-- Cambiar contraseña (del usuario editado) -->
    <Card variant="elevated" title="Cambiar contraseña" subtitle="Define una nueva contraseña para este usuario">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onChangePassword">
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
          <Button variant="primary" :loading="savingPwd" type="submit">Actualizar contraseña</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] });

import { reactive, ref, computed, watchEffect } from "vue";
import { useRoute } from 'vue-router'
import InputText from "~/components/ui/InputText.vue";
import Button from "~/components/ui/Button.vue";
import Card from "~/components/ui/Card.vue";
import { useUserService } from "~/services/users";
import { useToast } from "~/composables/useToast";
import type { User, UpdatePassword } from "~/services/users";

const { redirectIfUnauthorized } = useUseRoles()
const permitedRoles = [Roles.ADMIN, Roles.MANAGER]
redirectIfUnauthorized(permitedRoles, '/')

const toast = useToast();
const users = useUserService();
const route = useRoute()
const targetId = computed(() => String(route.params.id || ''))

// Cargar usuario por id de la ruta
const { data: userData, pending: pendingUser, error: errorUser, refresh: refreshUser } = await useAsyncData(
  () => `user:${targetId.value}`,
  () => targetId.value ? users.getById(targetId.value) : Promise.resolve({} as User),
  { watch: [targetId], server: true }
)
const user = computed<User>(() => (userData.value as User) || ({} as User))
const userLabel = computed(() => user.value?.username || '')

// Form state
const profile = reactive<{
  username: string;
  email: string;
  firstNames: string;
  lastNames: string;
  phone: string;
}>({
  username: "",
  email: "",
  firstNames: "",
  lastNames: "",
  phone: "",
});

const original = ref<any>(null);

const errors = reactive<Record<string, string>>({
  username: "",
  email: "",
  firstNames: "",
  lastNames: "",
  phone: "",
});
const savingProfile = ref(false);

// Inicializar el formulario cuando llegue la data
const initialized = ref(false)
watchEffect(() => {
  const u = user.value as any
  if (!initialized.value && u && u.id) {
    profile.username = u.username || ''
    profile.email = u.email || ''
    profile.firstNames = u.firstNames || ''
    profile.lastNames = u.lastNames || ''
    profile.phone = u.phone || ''
    original.value = { ...profile }
    initialized.value = true
  }
})

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

  return Object.values(errors).every((v) => !v);
}

function onRestoreProfile() {
  if (original.value) {
    Object.assign(profile, original.value);
  }
}

async function onSaveProfile() {
  if (!validateProfile()) return;
  if (!user.value?.id) {
    toast.error('No se pudo identificar el usuario')
    return
  }
  try {
    savingProfile.value = true;
    const payload: Pick<User, 'username'|'email'|'firstNames'|'lastNames'|'phone'> = {
      username: profile.username.trim(),
      email: (profile.email.trim() || undefined) as User['email'],
      firstNames: profile.firstNames.trim(),
      lastNames: profile.lastNames.trim(),
      phone: profile.phone.trim(),
    };
    await users.update(String(user.value.id), payload);
    original.value = { ...profile };
    toast.success("Usuario actualizado");
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo actualizar el usuario";
    toast.error("Error", { description: msg });
  } finally {
    savingProfile.value = false;
  }
}

// ------- Cambio de password (del usuario editado) -------
const pwd = reactive<Pick<UpdatePassword, 'oldPassword'|'newPassword'>>({
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
  if (!user.value?.id) {
    toast.error('No se pudo identificar el usuario')
    return
  }
  try {
    savingPwd.value = true;
    await users.updatePassword({
      userId: String(user.value.id),
      oldPassword: pwd.oldPassword,
      newPassword: pwd.newPassword,
    });
    toast.success("Contraseña actualizada");
  } catch (e: any) {
    const msg = e?.data?.message || "No se pudo actualizar la contraseña";
    toast.error("Error", { description: msg });
  } finally {
    savingPwd.value = false;
  }
}
</script>

<style scoped></style>