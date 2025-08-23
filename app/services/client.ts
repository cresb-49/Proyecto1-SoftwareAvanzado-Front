export interface Client {
	id: string;
	username: string;
	email: string;
	firstNames: string;
	lastNames: string;
	phone: string;
	state: boolean;
	roleName: string;
}

const API_SEGMENT = "/v1/clients";

export const useClientService = () => {
    const getById = (id: string) =>
        $fetch<Client>(`${API_SEGMENT}/${id}`);
    return { getById };
}