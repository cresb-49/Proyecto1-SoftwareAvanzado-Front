export interface User {
	id: string;
	username: string;
	email: string;
	firstNames: string;
	lastNames: string;
	phone: string;
	state: boolean;
	roleName: string;
}

const API_SEGMENT = "/v1/users";

export const useUserService = () => {
    const api = useApi();

    const getById = (id: string) =>
        api<User>(`${API_SEGMENT}/${id}`, { method: "GET" });

    const update = (id: string, data: any) =>
        api<User>(`${API_SEGMENT}/${id}`, { method: "PUT", body: data });

    const register = (data: any) =>
        api<User>(`${API_SEGMENT}/register`, { method: "POST", body: data });

    const registerEmployee = (data: any) =>
        api<User>(`${API_SEGMENT}/employees`, { method: "POST", body: data });

    return {
        getById,
        update,
        register,
        registerEmployee,
    };
}