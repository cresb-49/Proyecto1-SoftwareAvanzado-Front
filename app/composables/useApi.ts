import { useCookie, useRuntimeConfig } from 'nuxt/app'

export const useApi = () => {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('token')

  return $fetch.create({
    baseURL: config.public.apiBase as string,
    onRequest({ options }) {
      // Asegura que options.headers sea siempre un Headers
      const headers = new Headers(options.headers as HeadersInit)
      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
      options.headers = headers
    }
  })
}