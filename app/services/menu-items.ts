import type { Restaurant } from "./restaurants";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  restaurant: Restaurant;
}

const API_SEGMENT = "/v1/menu-items";

export const getMenuItems = () => {
  const api = useApi();

  const createMenuItem = (data: any) =>
    api(`${API_SEGMENT}`, {
      method: "POST",
      body: data,
    });

  const getAllMenuItems = () =>
    api(`${API_SEGMENT}`, {
      method: "GET",
    });

  const updateMenuItem = (id: string, data: any) =>
    api(`${API_SEGMENT}/${id}`, {
      method: "PUT",
      body: data,
    });

  const getMenuItemById = (id: string) =>
    api(`${API_SEGMENT}/${id}`, {
      method: "GET",
    });

  const getByIds = (ids: string[]) =>
    api(`${API_SEGMENT}/ids`, {
      method: "POST",
      body: {
        ids: ids,
      },
    });

  const getAllByRestaurantId = (restaurantId: string) =>
    api(`${API_SEGMENT}/restaurant/${restaurantId}`, {
      method: "GET",
    });

  const searchByNameAndRestaurantId = (
    name: string | null,
    restaurantId: string
  ) =>
    api(`${API_SEGMENT}/search/restaurant/${restaurantId}`, {
      method: "GET",
      params: {
        search: name,
      },
    });

  const searchAllByName = (name: string | null) =>
    api(`${API_SEGMENT}/search`, {
      method: "GET",
      params: {
        search: name,
      },
    });

  return {
    createMenuItem,
    getAllMenuItems,
    updateMenuItem,
    getMenuItemById,
    searchByNameAndRestaurantId,
    searchAllByName,
    getByIds,
    getAllByRestaurantId,
  };
};
