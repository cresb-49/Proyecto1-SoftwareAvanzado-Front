export interface Restaurant {
  id: string;
  name: string;
  address: string;
  description: string;
  image: string;
  rating: number;
}

export interface CreateRestaurantReview {
  restaurantId: string;
  review: string;
  rating: number;
}

export interface RestaurantReview {
  id: string;
  restaurantId: string;
  userId: string;
  review: string;
  rating: number;
  createdAt: string;
}

const API_SEGMENT = "/v1/restaurants";

export const useRestaurantService = () => {
  const api = useApi();

  const create = (restaurant: any) =>
    api<Restaurant>(`${API_SEGMENT}`, { method: "POST", body: restaurant });

  const getById = (id: string) =>
    api<Restaurant>(`${API_SEGMENT}/${id}`, { method: "GET" });

  const update = (id: string, data: any) =>
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

  // reviews
  const createRestaurantReview = (review: CreateRestaurantReview) =>
    api<RestaurantReview>(`${API_SEGMENT}/reviews`, {
      method: "POST",
      body: review,
    });

  const deleteRestaurantReview = (reviewId: string) =>
    api<void>(`${API_SEGMENT}/reviews/${reviewId}`, { method: "DELETE" });

  const getRestaurantReviews = (restaurantId: string) =>
    api<RestaurantReview[]>(
      `${API_SEGMENT}/reviews/restaurant/${restaurantId}`,
      {
        method: "GET",
      }
    );

  const getReviewById = (reviewId: string) =>
    api<RestaurantReview>(`${API_SEGMENT}/reviews/${reviewId}`, {
      method: "GET",
    });

  return {
    create,
    getById,
    update,
    remove,
    getAll,
    getByIds,
    createRestaurantReview,
    deleteRestaurantReview,
    getRestaurantReviews,
    getReviewById,
  };
};
