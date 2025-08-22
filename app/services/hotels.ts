export interface Hotel {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  address: string;
  image: string;
}

export interface CreateHotelRequest {}

export interface UpdateHotelRequest {}

const API_SEGMENT = "/v1/hotels";

export const useHotelService = () => {
  const api = useApi();

  const create = (hotel: CreateHotelRequest) =>
    api<Hotel>(API_SEGMENT, { method: "POST", body: hotel });

  const getById = (hotel: string) =>
    api<Hotel>(`${API_SEGMENT}/${hotel}`, { method: "GET" });

  const update = (hotel: string, data: UpdateHotelRequest) =>
    api<Hotel>(`${API_SEGMENT}/${hotel}`, { method: "PUT", body: data });

  const deleteRestaurant = (hotel: string) =>
    api<void>(`${API_SEGMENT}/${hotel}/restaurant`, { method: "DELETE" });

  const getAll = () => api<Hotel[]>(`${API_SEGMENT}/all`, { method: "GET" });

  const getByIds = (hotels: string[]) =>
    api<Hotel[]>(`${API_SEGMENT}/ids`, {
      method: "POST",
      body: { ids: hotels },
    });

  const getByRestaurant = (restaurantId: string) =>
    api<Hotel[]>(`${API_SEGMENT}/restaurant/${restaurantId}`, {
      method: "GET",
    });

  const getByRestaurantIds = (restaurantIds: string[]) =>
    api<Hotel[]>(`${API_SEGMENT}/restaurant/ids`, {
      method: "POST",
      body: { ids: restaurantIds },
    });

  return {
    getById,
    create,
    update,
    deleteRestaurant,
    getAll,
    getByIds,
    getByRestaurant,
    getByRestaurantIds,
  };
};
