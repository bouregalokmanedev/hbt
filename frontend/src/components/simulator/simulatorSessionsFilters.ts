export type SimulatorSessionsFilters = {
    search: string;
    tool: string;
    status: string;
    vehicle: string;
    dateFrom: string;
    dateTo: string;
    page: number;
};

export const EMPTY_SIMULATOR_FILTERS: SimulatorSessionsFilters = {
    search: "",
    tool: "",
    status: "",
    vehicle: "",
    dateFrom: "",
    dateTo: "",
    page: 1,
};
