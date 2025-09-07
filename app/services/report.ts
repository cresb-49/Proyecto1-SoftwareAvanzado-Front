export interface OrderRestaurantReport {
  orderId: string;
  clientName: string;
  nit: string;
  date: string;
  totalAmount: number;
  isPaid: boolean;
  paidAt: string;
}

export interface RestaurantReport {
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantDescription: string;
  restaurantRating: number;
  orders: OrderRestaurantReport[];
  totalOrders: number;
  generatedAt: string;
}

export interface DetailProfitRestaurant {
  orderId: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
}

export interface RestaurantProfitReport {
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantDescription: string;
  restaurantRating: number;
  orders: DetailProfitRestaurant[];
  totalProfit: number;
  generatedAt: string;
  startDate: string;
  endDate: string;
}

export interface DetailProfitHotel {
  reservationId: string;
  nights: number;
  price: number;
  maintenancePrice: number;
  profit: number;
  checkIn: string;
  checkOut: string;
}

export interface HotelProfitReport {
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  hotelDescription: string;
  hotelRating: number;
  reservations: DetailProfitHotel[];
  totalProfit: number;
  generatedAt: string;
  startDate: string;
  endDate: string;
}
export interface ReservationRevenueReport {
  reservationId: string;
  clientName: string;
  nit: string;
  nights: number;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  isPaid: boolean;
  paidAt: string;
}

export interface HotelRevenueReport {
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  hotelDescription: string;
  hotelRating: number;
  orders: ReservationRevenueReport[];
  totalRevenue: number;
  generatedAt: string;
  startDate: string;
  endDate: string;
}
export interface RoomInfo {
  id: string;
  number: number;
  price: number;
  reservations: number;
}

export interface RoomPopularityByHotelReport {
  hotelId: string;
  hotelName: string;
  rooms: RoomInfo[];
  generatedAt: string;
}

export interface RoomInfoWithHotel extends RoomInfo {
  hotelName: string;
}

export interface RoomPopularityReport {
  generatedAt: string;
  rooms: RoomInfoWithHotel[];
}
export interface EmployeeDetail {
  employeeId: string;
  firstName: string;
  lastName: string;
  roleName: string;
  active: boolean;
  salary: number;
}

export interface EmployeeDetailByEstablishmentReport {
  establishmentId: string;
  establishmentName: string;
  establishmentType: string;
  generatedAt: string;
  employeeDetails: EmployeeDetail[];
  weeklySalary: number;
}

export interface ActivityCustomerLine {
  activityType: string;
  amountSpent: number;
  establishmentName: string;
  description: string;
  paid: boolean;
}

export interface CustomerActivityReport {
  clientId: string;
  clientName: string;
  clientNit: string;
  clientLastName: string;
  clientEmail: string;
  consultedStartDate: string;
  consultedEndDate: string;
  generatedAt: string;
  reservations: ActivityCustomerLine[];
  orders: ActivityCustomerLine[];
  totalSpent: number;
  totalUnpaid: number;
}
const API_SEGMENT = "/v1/reports";

export function useReportService() {
  const api = useApi();

  const getCustomerActivity = (
    nit: string,
    startDate: string,
    endDate: string
  ) =>
    api<CustomerActivityReport>(`${API_SEGMENT}/customer-activity/${nit}`, {
      method: "POST",
      body: { start: startDate, end: endDate },
    });

  const getEmployeeDetailByEstablishment = (
    establishmentId: string,
    type: "HOTEL" | "RESTAURANT"
  ) =>
    api<EmployeeDetailByEstablishmentReport>(`${API_SEGMENT}/employee-detail`, {
      method: "POST",
      body: { establishmentId: establishmentId, establishmentType: type },
    });

  const getRoomPopularity = () =>
    api<RoomPopularityReport>(`${API_SEGMENT}/popular-rooms`, {
      method: "POST",
    });

  const getPopularRoomByHotel = (hotelId: string) =>
    api<RoomPopularityByHotelReport>(
      `${API_SEGMENT}/popular-rooms/hotel/${hotelId}`,
      {
        method: "POST",
      }
    );

  const getRevenueByHotel = (
    hotelId: string,
    startDate: string,
    endDate: string
  ) =>
    api<HotelRevenueReport>(`${API_SEGMENT}/hotel-revenue/${hotelId}`, {
      method: "POST",
      body: { start: startDate, end: endDate },
    });

  const getProfitByHotel = (
    hotelId: string,
    startDate: string,
    endDate: string
  ) =>
    api<HotelProfitReport>(`${API_SEGMENT}/hotel-profit/${hotelId}`, {
      method: "POST",
      body: { start: startDate, end: endDate },
    });

  const getProfitByRestaurant = (
    restaurantId: string,
    startDate: string,
    endDate: string
  ) =>
    api<RestaurantProfitReport>(
      `${API_SEGMENT}/restaurant-profit/${restaurantId}`,
      {
        method: "POST",
        body: { start: startDate, end: endDate },
      }
    );

  const restaurantReport = (restaurantId: string) =>
    api<RestaurantReport>(`${API_SEGMENT}/restaurant-report/${restaurantId}`, {
      method: "POST",
    });

  const restaurantReportMostPopular = () =>
    api<RestaurantReport>(`${API_SEGMENT}/restaurant-report/most-popular`, {
      method: "POST",
    });

  const getRevenueByRestaurant = (
    restaurantId: string,
    startDate: string,
    endDate: string
  ) =>
    api<RestaurantReport>(`${API_SEGMENT}/restaurant-revenue/${restaurantId}`, {
      method: "POST",
      body: { start: startDate, end: endDate },
    });

  return {
    getCustomerActivity,
    getEmployeeDetailByEstablishment,
    getRoomPopularity,
    getPopularRoomByHotel,
    getRevenueByHotel,
    getProfitByHotel,
    getProfitByRestaurant,
    restaurantReport,
    restaurantReportMostPopular,
    getRevenueByRestaurant,
  };
}
