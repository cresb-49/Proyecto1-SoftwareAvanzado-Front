export interface User {
  id: string;
  username: string;
  email: string;
  firstNames: string;
  lastNames: string;
  phone: string;
  state: boolean;
  roleName: string;
}

export interface CreateEmployee {
  username: string;
  email: string;
  firstNames: string;
  lastNames: string;
  phone: string;
  roleName: string;
}

export interface UpdatePassword{
    userId: string;
    oldPassword: string;
    newPassword: string;
}

const API_SEGMENT = "/v1/users";

export const useUserService = () => {
  const api = useApi();

  const getById = (id: string) =>
    api<User>(`${API_SEGMENT}/${id}`, { method: "GET" });

  const update = (id: string, data: any) =>
    api<User>(`${API_SEGMENT}/${id}`, { method: "PUT", body: data });

  const register = (data: any) =>
    api<User>(`${API_SEGMENT}/register`, { method: "POST", body: data });

  const registerEmployee = (data: CreateEmployee) =>
    api<User>(`${API_SEGMENT}/employees`, { method: "POST", body: data });

  const changeState = (id: string) =>
    api<User>(`${API_SEGMENT}/${id}/state`, { method: "PATCH" });

  const updatePassword = (data: UpdatePassword) =>
    api<User>(`${API_SEGMENT}/password`, { method: "PATCH", body: data });

  const getAll = () => api<User[]>(`${API_SEGMENT}/all`, { method: "GET" });

  return {
    getById,
    update,
    register,
    registerEmployee,
    changeState,
    updatePassword,
    getAll,
  };
};
