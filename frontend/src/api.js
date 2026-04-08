import axios from "axios";

const BASE = "https://reimagined-space-eureka-g4wrprvj6rj53wrww-8000.app.github.dev";
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

export const searchDrugs        = (q) => api.get(`/search/drugs?q=${encodeURIComponent(q)}`);
export const instantSearch      = (q) => api.get(`/search/drugs/instant?q=${encodeURIComponent(q)}`);

export const createPrescription = (data) => api.post("/prescriptions/", data);
export const listPrescriptions  = (status) => api.get("/prescriptions/", { params: status ? { status } : {} });
export const getPrescription    = (id) => api.get(`/prescriptions/${id}`);
export const confirmItem        = (rxId, itemId, stockId) =>
  api.patch(`/prescriptions/${rxId}/items/${itemId}/confirm?stock_id=${stockId}`);

export const createBill         = (data) => api.post("/billing/", data);
export const listBills          = () => api.get("/billing/");
export const getBill            = (id) => api.get(`/billing/${id}`);
