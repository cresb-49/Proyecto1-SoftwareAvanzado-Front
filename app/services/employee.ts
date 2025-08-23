export interface Employee {
	id: string;
	hotelId: string;
	restaurantId: string;
	userId: string;
	semanalSalary: number;
}

const API_SEGMENT = "/v1/employees";

export const useEmployeeService = () => {
    const api = useApi();

    const getById = (id: string) =>
        api<Employee>(`${API_SEGMENT}/${id}`, { method: "GET" });

    const getAll = () =>
        api<Employee[]>(`${API_SEGMENT}/all`, { method: "GET" });

    const update = (id: string, data: any) =>
        api<Employee>(`${API_SEGMENT}/${id}`, { method: "PUT", body: data });

    return {
        getById,
        getAll,
        update,
    };
}
