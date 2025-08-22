export const useUseRoles = () => {
  const { user } = useAuth();

  const hasAnyRole = (rolesToCheck: Array<string>) => {
    const current = [user.value?.roleName];
    const required = rolesToCheck.map(String);
    return current.map(String).some((r) => required.includes(r));
  };

  const redirectIfUnauthorized = (
    rolesToCheck: Array<string>,
    redirectPath: string
  ) => {
    if (!hasAnyRole(rolesToCheck)) {
      console.log(`Acceso denegado. Redirigiendo a ${redirectPath}`);
      return navigateTo(redirectPath);
    }
    return;
  };

  return { hasAnyRole, redirectIfUnauthorized };
};
