export interface Room {
  id: string;
  number: number;
  price: number;
  maintenancePrice: number;
  hotelId: string;
}

export interface CreateRoomRequest {}

export interface UpdateRoomRequest {}

const API_SEGMENT = "/v1/rooms";

export const useRoomService = () => {
  const api = useApi();

  const create = (room: CreateRoomRequest) =>
    api<Room>(`${API_SEGMENT}`, { method: "POST", body: room });

  const getById = (id: string) =>
    api<Room>(`${API_SEGMENT}/${id}`, { method: "GET" });

  const update = (id: string, data: UpdateRoomRequest) =>
    api<Room>(`${API_SEGMENT}/${id}`, { method: "PUT", body: data });

  const remove = (id: string) =>
    api<void>(`${API_SEGMENT}/${id}`, { method: "DELETE" });

  const getAll = () => api<Room[]>(`${API_SEGMENT}/all`, { method: "GET" });

  const getByIds = (ids: string[]) =>
    api<Room[]>(`${API_SEGMENT}/ids`, {
      method: "POST",
      body: { ids: ids },
    });

  const getByHotel = (hotelId: string) =>
    api<Room[]>(`${API_SEGMENT}/hotel/${hotelId}`, { method: "GET" });

  return {
    create,
    getById,
    update,
    remove,
    getAll,
    getByIds,
    getByHotel,
  };
};
