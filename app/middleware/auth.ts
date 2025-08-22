export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn.value) {
    const redirect = encodeURIComponent(to.fullPath);
    return navigateTo(`/login?redirect=${redirect}`);
  }
});
