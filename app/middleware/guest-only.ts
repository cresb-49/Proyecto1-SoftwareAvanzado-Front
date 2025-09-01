export default defineNuxtRouteMiddleware((to, from) => {
  // puedes usar tu composable o leer la cookie directo
  const { isLoggedIn } = useAuth();
  // alternativa: const token = useCookie<string | null>('token')
  if (isLoggedIn.value) {
    return navigateTo("/");
  }
});
