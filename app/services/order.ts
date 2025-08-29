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

export const useOrderService = () => {
  const api = useApi();

  const createOrder = (data: CreateOrderDTO) =>
    api<any>(`${API_SEGMENT}`, { method: "POST", body: data });

  return { createOrder };
};
