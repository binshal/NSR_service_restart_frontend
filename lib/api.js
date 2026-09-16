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
  createServer: (name, os_type) =>
    request("/api/servers", { method: "POST", body: JSON.stringify({ name, os_type }) }),
  deleteServer: (name) =>
    request(`/api/servers/${encodeURIComponent(name)}`, { method: "DELETE" }),
  addService: (serverName, name) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/services`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  removeService: (serverName, serviceId) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/services/${serviceId}`, {
      method: "DELETE",
    }),
  // Inject a specific NetWorker error. `code` comes from the error catalog.
  simulateFailure: (serverName, code) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/simulate-failure`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  // Clear the failure without restarting — the "another team fixed it" path.
  resolveFailure: (serverName) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/resolve-failure`, { method: "POST" }),
  // services omitted -> restart every stopped daemon (legacy tool contract).
  restartServices: (serverName, services) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/nsr-restart`, {
      method: "POST",
      body: JSON.stringify(services ? { services } : {}),
    }),
  setHealth: (serverName, health_status) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/health`, {
      method: "POST",
      body: JSON.stringify({ health_status }),
    }),
  setStorage: (serverName, storage_used_percent) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/storage`, {
      method: "PATCH",
      body: JSON.stringify({ storage_used_percent }),
    }),
  getErrorCatalog: () => request("/api/servers/error-catalog"),
};

/**
 * DPA API surface.
 *
 * getBackupError and getClientConfig are the two calls the Wings workflow
 * makes, in that order, and they mirror the two documented DPA data-collection
 * requests. Keeping them as separate functions here (rather than one combined
 * helper) is deliberate — it keeps the frontend honest about the fact that
 * OS type is NOT available from the failure feed alone.
 */
export const dpaApi = {
  // backup_error for NetWorker — 4 fields only, no OS information.
  getBackupError: (clientName) =>
    request(
      `/api/dpa/backup-error${clientName ? `?client_name=${encodeURIComponent(clientName)}` : ""}`
    ),
  // client_config for NetWorker — looked up by the client_name from above.
  getClientConfig: (clientName) =>
    request(`/api/dpa/client-config?client_name=${encodeURIComponent(clientName)}`),
  // Convenience join for the dashboard. Not part of the agent workflow.
  getFailures: () => request("/api/dpa/failures"),
  getErrorCatalog: () => request("/api/dpa/error-catalog"),
  getDashboard: () => request("/api/dpa/dashboard"),
};
