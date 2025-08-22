import { useCookie, useRuntimeConfig } from 'nuxt/app'
import { useToast } from '~/composables/useToast'
import { useAuth } from '~/composables/useAuth'

export const useApi = () => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('token')
  const toast = useToast()

  return $fetch.create({
    baseURL: config.public.apiBase as string,
    onRequest({ options }) {
      // Asegura que options.headers sea siempre un Headers
      const headers = new Headers(options.headers as HeadersInit)
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
      options.headers = headers
    },
    onResponseError({ response }) {
      const msg = (response?._data as any)?.message || 'Ocurrió un error'
      if (response.status === 401) {
        toast.warning('Sesión expirada', { description: 'Vuelve a iniciar sesión.' })
      } else {
        toast.error('Error', { description: `${response.status}: ${msg}` })
      }
    }
  })
}