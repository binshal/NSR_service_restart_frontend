const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  listServers: () => request("/api/servers"),
  createServer: (name, os_type) =>
    request("/api/servers", { method: "POST", body: JSON.stringify({ name, os_type }) }),
  deleteServer: (name) => request(`/api/servers/${encodeURIComponent(name)}`, { method: "DELETE" }),
  addService: (serverName, name) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/services`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  removeService: (serverName, serviceId) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/services/${serviceId}`, {
      method: "DELETE",
    }),
  failServer: (serverName) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/fail`, { method: "POST" }),
  restartServer: (serverName) =>
    request(`/api/servers/${encodeURIComponent(serverName)}/nsr-restart`, { method: "POST" }),
};
