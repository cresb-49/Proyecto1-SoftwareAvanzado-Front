export enum ReservationState {
    CONFIRMED = 0,
    CHECKED_IN = 1,
    CHECKED_OUT = 2
}

export interface Reservation {
  id: string;
  hotelId: string;
  roomId: string;
  employeeId: string;
  customerId: string;
  state: number;
  checkInDate: string; // ISO string, e.g. "2025-08-22T12:00:00Z"
  checkOutDate: string; // ISO string
  isPaid: boolean;
  total: number; // Puedes usar string si necesitas alta precisión
}

export interface CreateReservationRequest {
  hotelId: string;
  roomId: string;
  customerId: string;
  checkInDate: string; // ISO string
  checkOutDate: string; // ISO string
  isPaid?: boolean;
  total?: number; // calculado en el front si aplica
  employeeId?: string; // opcional si decides enviarlo
}

const API_SEGMENT = "/v1/reservations";

export const useReservationService = () => {
  const api = useApi();

  const create = (reservation: CreateReservationRequest) =>
    api<Reservation>(`${API_SEGMENT}`, { method: "POST", body: reservation });

  const getById = (reservationId: string) =>
    api<Reservation>(`${API_SEGMENT}/${reservationId}`, { method: "GET" });

  const checkIn = (reservationId: string) =>
    api<Reservation>(`${API_SEGMENT}/${reservationId}/check-in`, {
      method: "POST",
    });

  const checkOut = (reservationId: string) =>
    api<Reservation>(`${API_SEGMENT}/${reservationId}/check-out`, {
      method: "POST",
    });

  const pay = (reservationId: string) =>
    api<Reservation>(`${API_SEGMENT}/${reservationId}/paid`, {
      method: "POST",
    });

  const deleteReservation = (reservationId: string) =>
    api<Reservation>(`${API_SEGMENT}/${reservationId}`, { method: "DELETE" });

  const getAll = () =>
    api<Reservation[]>(`${API_SEGMENT}/all`, { method: "GET" });

  const reservationsByCustomer = (customerId: string) =>
    api<Reservation[]>(`${API_SEGMENT}/client/${customerId}`, {
      method: "GET",
    });

  const reservationsByHotel = (hotelId: string) =>
    api<Reservation[]>(`${API_SEGMENT}/hotel/${hotelId}`, { method: "GET" });

  const reservationsByCustomerAndHotel = (
    customerId: string,
    hotelId: string
  ) =>
    api<Reservation[]>(`${API_SEGMENT}/client/${customerId}/hotel/${hotelId}`, {
      method: "GET",
    });

  return {
    create,
    getById,
    checkIn,
    checkOut,
    pay,
    deleteReservation,
    getAll,
    reservationsByCustomer,
    reservationsByHotel,
    reservationsByCustomerAndHotel,
  };
};
