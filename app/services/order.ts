import type { MenuItem } from "./menu-items";
import type { Restaurant } from "./restaurants";

const API_SEGMENT = "/v1/orders";

export interface CreateOrderDTO {
  restaurantId: string;
  nit: string | null;
  employeeId: string | null;
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
}

export interface OrderLine {
  id: string;
  orderId: string;
  menuItem: MenuItem;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  nit: string;
  employeeId: string;
  date: string;
  restaurant: Restaurant;
  orderLines: OrderLine[];
  isPaid: Boolean;
  isCanceled: Boolean;
  total: number;
  createdAt: string;
  updatedAt: string;
  paidAt: string;
}

export interface AddItemOrder {
  itemId: string;
  quantity: number;
}

export interface DeleteLineOrder {
  lineOrderId: string;
}

export const useOrderService = () => {
  const api = useApi();

  const createOrder = (data: CreateOrderDTO) =>
    api<any>(`${API_SEGMENT}`, { method: "POST", body: data });

  const getOrdersByRestaurant = (restaurantId: string) =>
    api<Order[]>(`${API_SEGMENT}/restaurant/${restaurantId}`, {
      method: "GET",
    });

  const getById = (id: string) =>
    api<Order>(`${API_SEGMENT}/${id}`, {
      method: "GET",
    });

  const getOrdersByNit = (nit: string) =>
    api<Order[]>(`${API_SEGMENT}/client/${nit}`, {
      method: "GET",
    });

  const getOrdersByRestaurantAndClient = (restaurantId: string, nit: string) =>
    api<Order[]>(`${API_SEGMENT}/restaurant/${restaurantId}/client/${nit}`, {
      method: "GET",
    });

  const getOrdersByEmployee = (employeeId: string) =>
    api<Order[]>(`${API_SEGMENT}/employee/${employeeId}`, {
      method: "GET",
    });

  const getOrdersByRestaurantAndEmployee = (
    restaurantId: string,
    employeeId: string
  ) =>
    api<Order[]>(
      `${API_SEGMENT}/restaurant/${restaurantId}/employee/${employeeId}`,
      {
        method: "GET",
      }
    );

  const deleteOrder = (id: string) =>
    api<any>(`${API_SEGMENT}/${id}`, { method: "DELETE" });

  const deleteItemOfOrder = (orderId: string, data: DeleteLineOrder) =>
    api<any>(`${API_SEGMENT}/${orderId}/delete-item`, {
      method: "DELETE",
      body: data,
    });

  const addItemToOrder = (orderId: string, data: AddItemOrder) =>
    api<any>(`${API_SEGMENT}/${orderId}/add-item`, {
      method: "POST",
      body: data,
    });

  const payOrder = (orderId: string) =>
    api<any>(`${API_SEGMENT}/${orderId}/pay`, {
      method: "POST",
    });

  const cancelOrder = (orderId: string) =>
    api<any>(`${API_SEGMENT}/${orderId}/cancel`, {
      method: "POST",
    });

  return {
    createOrder,
    getOrdersByRestaurant,
    getById,
    getOrdersByNit,
    getOrdersByRestaurantAndClient,
    getOrdersByEmployee,
    getOrdersByRestaurantAndEmployee,
    deleteOrder,
    cancelOrder,
    deleteItemOfOrder,
    addItemToOrder,
    payOrder,
  };
};
