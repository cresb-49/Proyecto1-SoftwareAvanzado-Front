export interface Restaurant {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  rating: number;
}

export interface CreateRestaurantRequest {}
export interface UpdateRestaurantRequest {}

const API_SEGMENT = "/v1/restaurants";

export const useRestaurantService = () => {
  const api = useApi();

  const create = (restaurant: CreateRestaurantRequest) =>
    api<Restaurant>(`${API_SEGMENT}`, { method: "POST", body: restaurant });

  const getById = (id: string) =>
    api<Restaurant>(`${API_SEGMENT}/${id}`, { method: "GET" });

  const update = (id: string, data: UpdateRestaurantRequest) =>
    api<Restaurant>(`${API_SEGMENT}/${id}`, { method: "PUT", body: data });

  const remove = (id: string) =>
    api<void>(`${API_SEGMENT}/${id}`, { method: "DELETE" });

  const getAll = () =>
    api<Restaurant[]>(`${API_SEGMENT}/all`, { method: "GET" });

  const getByIds = (ids: string[]) =>
    api<Restaurant[]>(`${API_SEGMENT}/ids`, {
      method: "POST",
      body: { ids: ids },
    });

  return {
    create,
    getById,
    update,
    remove,
    getAll,
    getByIds,
  };
};
