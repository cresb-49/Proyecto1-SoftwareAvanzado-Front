<template>
  <div class="mx-auto max-w-md px-4 py-6">
    <Card variant="elevated" title="Crear cuenta" subtitle="Completa tus datos para registrarte">
      <form class="grid gap-4" @submit.prevent="onSubmit">
        <InputText
          v-model="form.username"
          label="Usuario *"
          placeholder="tu_usuario"
          :error="errors.username"
          size="md"
        />

        <InputText
          v-model="form.password"
          label="Contraseña *"
          placeholder="••••••"
          type="password"
          :error="errors.password"
          size="md"
        />

        <InputText
          v-model="form.email"
          label="Correo electrónico"
          placeholder="tucorreo@ejemplo.com"
          type="email"
          :error="errors.email"
          size="md"
        />

        <InputText
          v-model="form.firstNames"
          label="Nombres *"
          placeholder="María José"
          :error="errors.firstNames"
          size="md"
        />

        <InputText
          v-model="form.lastNames"
          label="Apellidos *"
          placeholder="Pérez López"
          :error="errors.lastNames"
          size="md"
        />

        <InputText
          v-model="form.phone"
          label="Teléfono *"
          placeholder="8 dígitos"
          :error="errors.phone"
          size="md"
        />

        <InputText
          v-model="form.nit"
          label="NIT *"
          placeholder="1234567-8"
          :error="errors.nit"
          size="md"
        />

        <div class="mt-2 flex items-center justify-end gap-2">
          <Button variant="secondary" to="/login">Cancelar</Button>
          <Button variant="primary" :loading="loading" type="submit">Registrarse</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import InputText from '~/components/ui/InputText.vue'
import { reactive, ref } from 'vue'
import { useToast } from '~/composables/useToast'
import { useUserService } from '~/services/users'
import guestOnly from '~/middleware/guest-only'

// Esta página es pública
definePageMeta({ middleware: [guestOnly] })

const users = useUserService()
const toast = useToast()

const form = reactive({
  username: '',
  password: '',
  email: '',
  firstNames: '',
  lastNames: '',
  phone: '',
  nit: ''
})

const errors = reactive<Record<string, string>>({
  username: '',
  password: '',
  email: '',
  firstNames: '',
  lastNames: '',
  phone: '',
  nit: ''
})

const loading = ref(false)

function isEmailValid(email: string) {
  if (!email) return true // opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validate() {
  // username 3-20
  const u = form.username.trim()
  errors.username = !u ? 'Requerido' : u.length < 3 ? 'Mínimo 3' : u.length > 20 ? 'Máximo 20' : ''

  // password 6-50
  const p = form.password
  errors.password = !p ? 'Requerido' : p.length < 6 ? 'Mínimo 6' : p.length > 50 ? 'Máximo 50' : ''

  // email (opcional, pero válido si viene)
  errors.email = isEmailValid(form.email.trim()) ? '' : 'Correo inválido'

  // nombres 3-50
  const fn = form.firstNames.trim()
  errors.firstNames = !fn ? 'Requerido' : fn.length < 3 ? 'Mínimo 3' : fn.length > 50 ? 'Máximo 50' : ''

  // apellidos 3-50
  const ln = form.lastNames.trim()
  errors.lastNames = !ln ? 'Requerido' : ln.length < 3 ? 'Mínimo 3' : ln.length > 50 ? 'Máximo 50' : ''

  // teléfono 8 dígitos
  const ph = form.phone.trim()
  errors.phone = !ph ? 'Requerido' : /^\d{8}$/.test(ph) ? '' : 'Debe tener 8 dígitos'

  // NIT requerido (sin formato obligatorio)
  const nit = form.nit.trim()
  errors.nit = nit ? '' : 'Requerido'

  return Object.values(errors).every((v) => !v)
}

async function onSubmit() {
  if (!validate()) return
  try {
    loading.value = true
    await users.register({
      username: form.username.trim(),
      password: form.password,
      email: form.email.trim() || undefined,
      firstNames: form.firstNames.trim(),
      lastNames: form.lastNames.trim(),
      phone: form.phone.trim(),
      nit: form.nit.trim()
    })
    toast.success('Registro completado', { description: 'Ahora puedes iniciar sesión.' })
    navigateTo('/login')
  } catch (e: any) {
    const msg = e?.data?.message || 'Revisa tus datos e intenta de nuevo'
    toast.error('No se pudo registrar', { description: msg })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>