import { useCookie } from "nuxt/app";
import { useApi } from "./useApi";
import { computed } from "vue";

export enum Roles {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  RESTAURANT_MANAGER = "RESTAURANT_MANAGER",
  HOTEL_MANAGER = "HOTEL_MANAGER",
  EMPLOYEE = "EMPLOYEE",
  RESTAURANT_EMPLOYEE = "RESTAURANT_EMPLOYEE",
  HOTEL_EMPLOYEE = "HOTEL_EMPLOYEE",
  CUSTOMER = "CUSTOMER",
}

type User = { id: string; username: string; email: string; roleName: string };
interface LoginResponse {
  id: string;
  username: string;
  email: string;
  roleName: string;
  token: string;
}

export const useAuth = () => {
  const api = useApi();

  // Cookies (persisten entre reloads y SSR)
  const token = useCookie<string | null>("token", {
    maxAge: 60 * 60 * 24 * 7, // 7 días
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  const user = useCookie<User | null>("user", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  const isLoggedIn = computed(() => Boolean(token.value));

  const login = async (email: string, password: string) => {
    // Ajusta al shape real de tu API
    const res = await api("/v1/login", {
      method: "POST",
      body: {
        username: email,
        password: password,
      },
    });
    const loginResponse = res as LoginResponse;

    // espera res = { token, user }
    token.value = loginResponse.token;
    user.value = {
      id: loginResponse.id,
      username: loginResponse.username,
      email: loginResponse.email,
      roleName: loginResponse.roleName,
    };
  };

  // Útil para rehidratar el usuario si solo tienes el token
  //const fetchMe = async () => {
  //  if (!token.value) return;
  //  const me = await api("/auth/me"); // endpoint protegido
  //  user.value = me as User;
  //};

  const logout = async () => {
    token.value = null;
    user.value = null;
    await navigateTo("/");
  };

  return { token, user, isLoggedIn, login, logout };
};
