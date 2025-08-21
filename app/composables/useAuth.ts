import { useCookie } from "nuxt/app";
import { useApi } from "./useApi";
import { computed } from "vue";

type User = { id: string | number; name: string; email: string; role?: string }

export const useAuth = () => {
  const api = useApi()

  // Cookies (persisten entre reloads y SSR)
  const token = useCookie<string | null>('token', {
    maxAge: 60 * 60 * 24 * 7,       // 7 días
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
  const user = useCookie<User | null>('user', {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  const isLoggedIn = computed(() => Boolean(token.value))

  const login = async (email: string, password: string) => {
    // Ajusta al shape real de tu API
    const res = await api('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    // espera res = { token, user }
    token.value = (res as any).token
    user.value = (res as any).user
  }

  // Útil para rehidratar el usuario si solo tienes el token
  const fetchMe = async () => {
    if (!token.value) return
    const me = await api('/auth/me')     // endpoint protegido
    user.value = me as User
  }

  const logout = async () => {
    token.value = null
    user.value = null
    // opcional: await api('/auth/logout', { method: 'POST' })
  }

  return { token, user, isLoggedIn, login, fetchMe, logout }
}