"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ServerCard from "@/components/ServerCard";
import AddServerModal from "@/components/AddServerModal";
import AddServiceModal from "@/components/AddServiceModal";
import DpaDashboard from "@/components/dpa/DpaDashboard";

export default function Home() {
  const [tab, setTab] = useState("nsr"); // "nsr" | "dpa"
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddServer, setShowAddServer] = useState(false);
  const [addServiceFor, setAddServiceFor] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.listServers();
      setServers(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const totalServers = servers.length;
  const downServers = servers.filter((s) => s.server_status === "down").length;
  const totalServices = servers.reduce((n, s) => n + s.services.length, 0);
  const stoppedServices = servers.reduce(
    (n, s) => n + s.services.filter((svc) => svc.status !== "running").length,
    0
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-line px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-mono text-lg text-ink tracking-tight">
              NSR <span className="text-brand">console</span>
            </h1>
            <p className="text-xs text-muted mt-0.5">
              backup service simulator — fail a server, then let the restart agent bring it back
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-md border border-line overflow-hidden font-mono text-xs">
              <button
                onClick={() => setTab("nsr")}
                className={`px-3 py-1.5 transition ${
                  tab === "nsr" ? "bg-brand text-white" : "text-muted hover:text-ink"
                }`}
              >
                nsr console
              </button>
              <button
                onClick={() => setTab("dpa")}
                className={`px-3 py-1.5 transition border-l border-line ${
                  tab === "dpa" ? "bg-brand text-white" : "text-muted hover:text-ink"
                }`}
              >
                data protection central
              </button>
            </div>
            {tab === "nsr" && (
              <button
                onClick={() => setShowAddServer(true)}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition"
              >
                + add server
              </button>
            )}
          </div>
        </div>
      </header>

      {tab === "dpa" && <DpaDashboard />}

      {tab === "nsr" && (
      <>
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-4 text-xs font-mono text-muted">
          <span>
            servers: <span className="text-ink">{totalServers}</span>
          </span>
          <span>
            down: <span className={downServers > 0 ? "text-down" : "text-ink"}>{downServers}</span>
          </span>
          <span>
            services: <span className="text-ink">{totalServices}</span>
          </span>
          <span>
            stopped: <span className={stoppedServices > 0 ? "text-down" : "text-ink"}>{stoppedServices}</span>
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-16">
        {loading && <p className="text-muted text-sm font-mono">loading servers…</p>}
        {error && (
          <p className="text-down text-sm font-mono border border-down/30 bg-down/10 rounded-md px-3 py-2">
            {error} — is NEXT_PUBLIC_API_URL set and is the backend running?
          </p>
        )}
        {!loading && !error && servers.length === 0 && (
          <div className="border border-dashed border-line rounded-lg px-6 py-12 text-center">
            <p className="text-muted text-sm font-mono">no servers registered yet</p>
            <button
              onClick={() => setShowAddServer(true)}
              className="mt-3 text-brand text-sm font-mono hover:underline"
            >
              add your first server
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {servers.map((server) => (
            <ServerCard
              key={server._id}
              server={server}
              onFail={async (name) => {
                await api.failServer(name);
                load();
              }}
              onRestart={async (name) => {
                await api.restartServer(name);
                load();
              }}
              onDelete={async (name) => {
                await api.deleteServer(name);
                load();
              }}
              onAddService={(name) => setAddServiceFor(name)}
              onRemoveService={async (name, serviceId) => {
                await api.removeService(name, serviceId);
                load();
              }}
              onSetHealth={async (name, healthStatus) => {
                await api.setHealth(name, healthStatus);
                load();
              }}
              onSetStorage={async (name, pct) => {
                await api.setStorage(name, pct);
                load();
              }}
            />
          ))}
        </div>
      </div>

      {showAddServer && (
        <AddServerModal
          onClose={() => setShowAddServer(false)}
          onSubmit={async (name, osType) => {
            await api.createServer(name, osType);
            load();
          }}
        />
      )}

      {addServiceFor && (
        <AddServiceModal
          serverName={addServiceFor}
          onClose={() => setAddServiceFor(null)}
          onSubmit={async (name) => {
            await api.addService(addServiceFor, name);
            load();
          }}
        />
      )}
      </>
      )}
    </main>
  );
}
