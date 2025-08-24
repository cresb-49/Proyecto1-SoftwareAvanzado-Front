export interface Client {
  id: string;
  username: string;
  email: string;
  firstNames: string;
  lastNames: string;
  phone: string;
  state: boolean;
  roleName: string;
}

const API_SEGMENT = "/v1/clients";

export const useClientService = () => {
  const api = useApi();

  const getById = (id: string) =>
    api<Client>(`${API_SEGMENT}/${id}`, { method: "GET" });
  const getAll = () => api<Client[]>(API_SEGMENT, { method: "GET" });
  return { getById, getAll };
};
