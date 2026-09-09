const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  listServers: () => request("/api/servers"),
  createServer: (name, os_type) => request("/api/servers", { method: "POST", body: JSON.stringify({ name, os_type }) }),
  deleteServer: (name) => request(`/api/servers/${encodeURIComponent(name)}`, { method: "DELETE" }),
  addService: (serverName, name) => request(`/api/servers/${encodeURIComponent(serverName)}/services`, { method: "POST", body: JSON.stringify({ name }) }),
  removeService: (serverName, serviceId) => request(`/api/servers/${encodeURIComponent(serverName)}/services/${serviceId}`, { method: "DELETE" }),
  failServer: (serverName) => request(`/api/servers/${encodeURIComponent(serverName)}/fail`, { method: "POST" }),
  simulateFailure: (serverName, cause, serviceIds = []) => request(`/api/servers/${encodeURIComponent(serverName)}/failure`, {
    method: "POST",
    body: JSON.stringify({ cause, service_ids: serviceIds }),
  }),
  clearFailure: (serverName) => request(`/api/servers/${encodeURIComponent(serverName)}/failure/clear`, { method: "POST" }),
  restartServices: (serverName, services) => request(`/api/servers/${encodeURIComponent(serverName)}/nsr-restart`, {
    method: "POST",
    body: JSON.stringify({ services }),
  }),
  setHealth: (serverName, health_status) => request(`/api/servers/${encodeURIComponent(serverName)}/health`, { method: "POST", body: JSON.stringify({ health_status }) }),
  setStorage: (serverName, storage_used_percent) => request(`/api/servers/${encodeURIComponent(serverName)}/storage`, { method: "PATCH", body: JSON.stringify({ storage_used_percent }) }),
  getFailureCatalog: () => request("/api/servers/failure-catalog"),
};

export const dpaApi = {
  getDashboard: () => request("/api/dpa/dashboard"),
  getFailedJobs: () => request("/api/dpa/jobs/failed"),
  getFailedJob: (serverName) => request(`/api/dpa/jobs/failed/${encodeURIComponent(serverName)}`),
};
