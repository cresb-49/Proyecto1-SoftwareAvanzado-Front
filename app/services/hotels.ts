export interface Hotel {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  address: string;
  image: string;
  rating: number;
}

export interface HotelReview {
  id: string;
  hotelId: string;
  userId: string;
  review: string;
  rating: number;
  createdAt: string;
}

export interface CreateHotelReview {
  hotelId: string;
  review: string;
  rating: number;
}

const API_SEGMENT = "/v1/hotels";

export const useHotelService = () => {
  const api = useApi();

  const create = (hotel: any) =>
    api<Hotel>(API_SEGMENT, { method: "POST", body: hotel });

  const getById = (hotel: string) =>
    api<Hotel>(`${API_SEGMENT}/${hotel}`, { method: "GET" });

  const update = (hotel: string, data: any) =>
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

  // reviews
  const createHotelReview = (review: CreateHotelReview) =>
    api<HotelReview>(`${API_SEGMENT}/reviews`, {
      method: "POST",
      body: review,
    });

  const deleteHotelReview = (reviewId: string) =>
    api<void>(`${API_SEGMENT}/reviews/${reviewId}`, { method: "DELETE" });

  const getHotelReviews = (hotelId: string) =>
    api<HotelReview[]>(`${API_SEGMENT}/reviews/hotel/${hotelId}`, {
      method: "GET",
    });

  const getReviewById = (reviewId: string) =>
    api<HotelReview>(`${API_SEGMENT}/reviews/${reviewId}`, { method: "GET" });

  return {
    getById,
    create,
    update,
    deleteRestaurant,
    getAll,
    getByIds,
    getByRestaurant,
    getByRestaurantIds,
    getHotelReviews,
    getReviewById,
    createHotelReview,
    deleteHotelReview,
  };
};
