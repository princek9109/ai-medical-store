import axios from "axios";

const BASE = "";
const api = axios.create({ baseURL: BASE });

export const getMedicines  = (search = "") => api.get(`/medicines/?search=${search}`);
export const addMedicine   = (data) => api.post("/medicines/", data);
export const deleteMedicine= (id) => api.delete(`/medicines/${id}`);

export const getStock      = (params = {}) => api.get("/stock/", { params });
export const addStock      = (data) => api.post("/stock/", data);
export const updateStock   = (id, data) => api.patch(`/stock/${id}`, data);
export const removeStock   = (id) => api.delete(`/stock/${id}`);
export const getFifo       = (medId) => api.get(`/stock/fifo/${medId}`);

export const getExpiryAlerts   = () => api.get("/stock/alerts/expiry");
export const getLowStockAlerts = () => api.get("/stock/alerts/low-stock");
export const getStoreLayout    = () => api.get("/bins/layout");
export const getZones          = () => api.get("/bins/zones");