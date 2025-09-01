export interface WeeklyPayment {
  id: string;
  employeeId: string;
  weekStart: string;
  amount: number;
  paid: boolean;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

const API_SEGMENT = "/v1/weekly-payments";

export const useWeeklyPaymentService = () => {
  const api = useApi();

  const createPaymentEmployee = async (weekStart: string, employeeId: string) =>
    api<WeeklyPayment>(`${API_SEGMENT}/create-for-employee`, {
      method: "POST",
      body: {
        weekStart: weekStart,
        employeeId: employeeId,
      },
    });

  const createPaymentForAllEmployees = async (weekStart: string) =>
    api<WeeklyPayment[]>(`${API_SEGMENT}/create-for-all-employees`, {
      method: "POST",
      body: {
        weekStart: weekStart,
      },
    });

  const findById = async (id: string) =>
    api<WeeklyPayment>(`${API_SEGMENT}/${id}`, {
      method: "GET",
    });

  const getPaymentsByEmployee = (employeeId: string) =>
    api<WeeklyPayment[]>(`${API_SEGMENT}/employee/${employeeId}`, {
      method: "GET",
    });

  const getPaymentsByEmployeeAndWeek = (
    employeeId: string,
    weekStart: string
  ) =>
    api<WeeklyPayment[]>(`${API_SEGMENT}/employee/${employeeId}/week`, {
      method: "POST",
      body: {
        weekStart: weekStart,
      },
    });

  const payAllByWeek = (weekStart: string) =>
    api<WeeklyPayment[]>(`${API_SEGMENT}/pay-by-week`, {
      method: "POST",
      body: {
        weekStart: weekStart,
      },
    });

  const payByEmployeeAndWeek = (employeeId: string, weekStart: string) =>
    api<WeeklyPayment[]>(`${API_SEGMENT}/pay-by-week-and-employee`, {
      method: "POST",
      body: {
        employeeId: employeeId,
        weekStart: weekStart,
      },
    });

  const payPaymentById = (id: string) =>
    api<WeeklyPayment>(`${API_SEGMENT}/pay-by-id/${id}`, {
      method: "POST",
    });

  return {
    createPaymentEmployee,
    createPaymentForAllEmployees,
    findById,
    getPaymentsByEmployee,
    getPaymentsByEmployeeAndWeek,
    payAllByWeek,
    payByEmployeeAndWeek,
    payPaymentById,
  };
};
