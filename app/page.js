"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ServerCard from "@/components/ServerCard";
import AddServerModal from "@/components/AddServerModal";
import AddServiceModal from "@/components/AddServiceModal";
import DpaDashboard from "@/components/dpa/DpaDashboard";
import WorkflowView from "@/components/agent/WorkflowView";

const TABS = [
  { id: "nsr", label: "nsr console" },
  { id: "workflow", label: "agent workflow" },
  { id: "dpa", label: "data protection central" },
];

export default function Home() {
  const [tab, setTab] = useState("nsr");
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddServer, setShowAddServer] = useState(false);
  const [addServiceFor, setAddServiceFor] = useState(null);
  const [errorCatalog, setErrorCatalog] = useState([]);

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
    api
      .getErrorCatalog()
      .then((data) => setErrorCatalog(data.errors || []))
      .catch(() => {});
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const activeFailures = servers.filter((s) => s.active_backup_error).length;
  const needingRestart = servers.filter((s) =>
    s.services.some((svc) => svc.status === "stopped")
  ).length;
  const totalServices = servers.reduce((n, s) => n + s.services.length, 0);
  const stoppedServices = servers.reduce(
    (n, s) => n + s.services.filter((svc) => svc.status !== "running").length,
    0
  );

  return (
    <main className="min-h-screen">
      <header className="border-b border-line px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="font-mono text-lg text-ink tracking-tight">
              NSR <span className="text-brand">console</span>
            </h1>
            <p className="text-xs text-muted mt-0.5 max-w-2xl">
              NetWorker failure simulator — DPA reports the error, the agent classifies it, and only
              genuine daemon failures get restarted
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex rounded-md border border-line overflow-hidden font-mono text-xs">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 transition ${i > 0 ? "border-l border-line" : ""} ${
                    tab === t.id ? "bg-brand text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === "nsr" && (
              <button
                onClick={() => setShowAddServer(true)}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition"
              >
                + add client
              </button>
            )}
          </div>
        </div>
      </header>

      {tab === "dpa" && <DpaDashboard />}
      {tab === "workflow" && <WorkflowView />}

      {tab === "nsr" && (
        <>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex flex-wrap gap-4 text-xs font-mono text-muted">
              <span>
                clients: <span className="text-ink">{servers.length}</span>
              </span>
              <span>
                active failures:{" "}
                <span className={activeFailures > 0 ? "text-down" : "text-ink"}>
                  {activeFailures}
                </span>
              </span>
              <span>
                needing restart:{" "}
                <span className={needingRestart > 0 ? "text-pending" : "text-ink"}>
                  {needingRestart}
                </span>
              </span>
              <span>
                daemons: <span className="text-ink">{totalServices}</span>
              </span>
              <span>
                stopped:{" "}
                <span className={stoppedServices > 0 ? "text-down" : "text-ink"}>
                  {stoppedServices}
                </span>
              </span>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 pb-16">
            {loading && <p className="text-muted text-sm font-mono">loading clients…</p>}
            {error && (
              <p className="text-down text-sm font-mono border border-down/30 bg-down/10 rounded-md px-3 py-2">
                {error} — is NEXT_PUBLIC_API_URL set and is the backend running?
              </p>
            )}
            {!loading && !error && servers.length === 0 && (
              <div className="border border-dashed border-line rounded-lg px-6 py-12 text-center">
                <p className="text-muted text-sm font-mono">no networker clients registered yet</p>
                <button
                  onClick={() => setShowAddServer(true)}
                  className="mt-3 text-brand text-sm font-mono hover:underline"
                >
                  add your first client
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 items-start">
              {servers.map((server) => (
                <ServerCard
                  key={server._id}
                  server={server}
                  errorCatalog={errorCatalog}
                  onSimulateFailure={async (name, code) => {
                    const out = await api.simulateFailure(name, code);
                    load();
                    return out;
                  }}
                  onResolveFailure={async (name) => {
                    const out = await api.resolveFailure(name);
                    load();
                    return out;
                  }}
                  onRestart={async (name, services) => {
                    const out = await api.restartServices(name, services);
                    load();
                    return out;
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
