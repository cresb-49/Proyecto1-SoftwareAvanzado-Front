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
      return navigateTo(redirectPath);
    }
    return;
  };

  const redirectIfAdmin = (redirectPath: string) => {
    if (!hasAnyRole([Roles.ADMIN])) {
      return navigateTo(redirectPath);
    }
    return;
  };

  const redirectIfNotCustomer = (redirectPath: string) => {
    if (!hasAnyRole([Roles.CUSTOMER])) {
      return navigateTo(redirectPath);
    }
    return;
  };

  return { hasAnyRole, redirectIfUnauthorized, redirectIfAdmin, redirectIfNotCustomer };
};
