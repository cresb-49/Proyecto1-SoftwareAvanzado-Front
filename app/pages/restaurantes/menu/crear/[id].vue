<template>
  <div class="mx-auto max-w-3xl px-4 py-6 space-y-8">
    <!-- Toolbar -->
    <div class="mb-4 flex items-center justify-between">
      <Button size="sm" variant="secondary" :to="`/restaurantes/menu/${restaurantId}`">← Regresar</Button>
      <div v-if="restaurantName" class="text-sm text-brand-700">
        Restaurante: <span class="font-medium text-brand-900">{{ restaurantName }}</span>
      </div>
    </div>

    <Card variant="elevated" title="Crear platillo" subtitle="Completa la información del nuevo platillo">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
        <!-- Nombre -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.name"
            label="Nombre *"
            placeholder="Ej. Pepián de la casa"
            :error="errors.name"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Entre 3 y 100 caracteres.</p>
        </div>

        <!-- Descripción -->
        <div class="sm:col-span-2">
          <InputText
            v-model="form.description"
            label="Descripción *"
            placeholder="Breve descripción del platillo"
            :error="errors.description"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Entre 5 y 200 caracteres.</p>
        </div>

        <!-- Precio -->
        <div class="sm:col-span-2">
          <InputCurrency
            v-model="form.price"
            label="Precio *"
            currency="GTQ"
            locale="es-GT"
            :error="errors.price"
            size="md"
          />
          <p class="mt-1 text-xs text-brand-700">Mínimo Q0.01, hasta 10 enteros y 2 decimales.</p>
        </div>

        <!-- Acciones -->
        <div class="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" @click="onReset" :disabled="saving">Limpiar</Button>
          <Button variant="primary" :loading="saving" type="submit">Crear platillo</Button>
        </div>
      </form>
    </Card>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ middleware: ["auth"] })
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import Button from '~/components/ui/Button.vue'
import Card from '~/components/ui/Card.vue'
import InputText from '~/components/ui/InputText.vue'
import InputCurrency from '~/components/ui/InputCurrency.vue'
import { useToast } from '~/composables/useToast'
import { getMenuItems } from '~/services/menu-items'
import { useRestaurantService } from '~/services/restaurants'

const { hasAnyRole, redirectIfUnauthorized } = useUseRoles();
const permitedRoles = [Roles.ADMIN, Roles.RESTAURANT_MANAGER];
const canManageRestaurants = computed(() => hasAnyRole(permitedRoles));
redirectIfUnauthorized(permitedRoles, "/");

const toast = useToast()
const route = useRoute()
const restaurantId = computed(() => String(route.params.id || ''))

// Cargar nombre del restaurante (opcional, para cabecera)
const restaurantSvc = useRestaurantService()
const { data: restData } = await useAsyncData(
  () => `restaurant:${restaurantId.value}`,
  () => restaurantId.value ? restaurantSvc.getById(restaurantId.value) : Promise.resolve(null),
  { watch: [restaurantId], server: true }
)
const restaurantName = computed(() => (restData.value as any)?.name || '')

// API de menú
const menuApi = getMenuItems()

// Form state
const form = reactive<{ name: string; description: string; price: number | null }>({
  name: '',
  description: '',
  price: null,
})

const errors = reactive<Record<string, string>>({ name: '', description: '', price: '' })
const saving = ref(false)

function validate() {
  // name 3-100
  const n = form.name.trim()
  errors.name = !n ? 'Requerido' : n.length < 3 ? 'Mínimo 3' : n.length > 100 ? 'Máximo 100' : ''

  // description 5-200
  const d = form.description.trim()
  errors.description = !d ? 'Requerido' : d.length < 5 ? 'Mínimo 5' : d.length > 200 ? 'Máximo 200' : ''

  // price >= 0.01, hasta 10 enteros y 2 decimales
  const s = Number(form.price)
  const validNumber = Number.isFinite(s) && s >= 0.01
  const twoDecimals = /^\d{1,10}(\.\d{1,2})?$/.test(String(form.price ?? ''))
  errors.price = validNumber && twoDecimals ? '' : 'Precio inválido (mín. 0.01 y 2 decimales)'

  return Object.values(errors).every(v => !v)
}

function onReset() {
  form.name = ''
  form.description = ''
  form.price = null
}

async function onSubmit() {
  if (!restaurantId.value) {
    toast.error('Falta el id del restaurante en la ruta')
    return
  }
  if (!validate()) return
  try {
    saving.value = true
    await menuApi.createMenuItem({
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      restaurantId: restaurantId.value,
    })
    toast.success('Platillo creado')
    navigateTo(`/restaurantes/menu/${restaurantId.value}`)
  } catch (e: any) {
    const msg = e?.data?.message || 'No se pudo crear el platillo'
    toast.error('Error', { description: msg })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped></style>