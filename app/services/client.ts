export interface Client {
  id: string;
  nit: string;
  userId: string;
  firstName: string;
  lastName: string;
}

const API_SEGMENT = "/v1/clients";

export const useClientService = () => {
  const api = useApi();

  const getById = (id: string) =>
    api<Client>(`${API_SEGMENT}/${id}`, { method: "GET" });
  const getAll = () => api<Client[]>(API_SEGMENT, { method: "GET" });

  const create = (data: any) =>
    api<Client>(`${API_SEGMENT}/simple`, { method: "POST", body: data });

  const getByNit = (nit: string) =>
    api<Client>(`${API_SEGMENT}/nit/${nit}`, { method: "GET" });

  const getClientByUserId = (userId: string) =>
    api<Client>(`${API_SEGMENT}/user/${userId}`, { method: "GET" });

  const getAllClients = () =>
    api<Client[]>(`${API_SEGMENT}/all`, { method: "GET" });

  return {
    getById,
    getAll,
    create,
    getByNit,
    getClientByUserId,
    getAllClients,
  };
};
