"use client";

import { useEffect, useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import EventLog from "./EventLog";

const HEALTH_LABEL = {
  healthy: { color: "text-up", label: "healthy" },
  unhealthy: { color: "text-pending", label: "unhealthy" },
  not_reporting: { color: "text-down", label: "not reporting" },
};

export default function ServerCard({
  server,
  failureCatalog,
  onSimulateFailure,
  onClearFailure,
  onRestartServices,
  onDelete,
  onAddService,
  onRemoveService,
  onSetHealth,
  onSetStorage,
}) {
  const [busy, setBusy] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [storageInput, setStorageInput] = useState(server.storage_used_percent ?? 20);
  const [cause, setCause] = useState("daemon_crash");
  const [selectedServices, setSelectedServices] = useState([]);
  const [actionMessage, setActionMessage] = useState("");
  const health = server.health_status || "healthy";
  const report = server.active_failure_report;

  const selectedCause = useMemo(
    () => failureCatalog.find((item) => item.code === cause),
    [failureCatalog, cause]
  );

  useEffect(() => {
    if (selectedCause?.restart_required) {
      const preferred = selectedCause.code === "nsr_server_daemon_down" ? ["nsrd"] : ["nsrexecd"];
      const valid = server.services.filter((s) => preferred.includes(s.name)).map((s) => s._id);
      setSelectedServices(valid.length ? valid : server.services.slice(0, 1).map((s) => s._id));
    } else {
      setSelectedServices([]);
    }
  }, [cause, selectedCause, server.services]);

  async function run(action) {
    setBusy(true);
    setActionMessage("");
    try {
      await action();
    } catch (err) {
      setActionMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  const toggleService = (id) => {
    setSelectedServices((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  return (
    <div className="rounded-lg border border-line bg-panel shadow-card overflow-hidden">
      <div className="px-4 py-3 flex items-start justify-between border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm text-ink">{server.name}</h3>
            <span className="text-[10px] font-mono uppercase tracking-wide text-muted border border-line rounded px-1.5 py-0.5">{server.os_type}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={server.server_status} size="lg" />
            <span className="text-[10px] font-mono text-muted">host state — service failures do not reboot host</span>
          </div>
        </div>
        <button onClick={() => onDelete(server.name)} className="text-muted hover:text-down text-xs font-mono transition" title="Remove server">remove</button>
      </div>

      <div className="px-4 py-3 space-y-2">
        {server.services.length === 0 && <p className="text-xs text-muted font-mono">no nsr services on this server yet</p>}
        {server.services.map((svc) => (
          <div key={svc._id} className="flex items-center justify-between rounded-md bg-panel2 px-3 py-2 border border-line/60">
            <span className="font-mono text-sm text-ink">{svc.name}</span>
            <div className="flex items-center gap-3">
              <StatusBadge status={svc.status} />
              <button onClick={() => onRemoveService(server.name, svc._id)} className="text-muted hover:text-down text-xs transition" title="Remove service">×</button>
            </div>
          </div>
        ))}
        <button onClick={() => onAddService(server.name)} className="w-full rounded-md border border-dashed border-line px-3 py-2 text-xs font-mono text-muted hover:text-brand hover:border-brand/50 transition">+ add nsr service</button>
      </div>

      <div className="px-4 pb-4 border-t border-line pt-3 space-y-3">
        <div>
          <div className="text-[11px] font-mono text-muted mb-1">simulate DPA-diagnosed failure</div>
          <select value={cause} onChange={(e) => setCause(e.target.value)} className="w-full rounded border border-line bg-panel2 text-ink text-[11px] font-mono px-2 py-2 focus:outline-none focus:ring-1 focus:ring-brand">
            {failureCatalog.map((item) => (
              <option key={item.code} value={item.code}>{item.title} — {item.restart_required ? "restart service" : "no restart"}</option>
            ))}
          </select>
        </div>

        {selectedCause?.restart_required && (
          <div>
            <div className="text-[11px] font-mono text-muted mb-1">affected NetWorker service(s)</div>
            <div className="flex flex-wrap gap-2">
              {server.services.map((svc) => (
                <label key={svc._id} className="flex items-center gap-1.5 text-[11px] font-mono text-ink">
                  <input type="checkbox" checked={selectedServices.includes(svc._id)} onChange={() => toggleService(svc._id)} />
                  {svc.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-md border px-3 py-2 text-[11px] font-mono ${selectedCause?.restart_required ? "border-up/30 bg-up/5 text-up" : "border-pending/30 bg-pending/5 text-pending"}`}>
          <strong>{selectedCause?.restart_required ? "SERVICE RESTART PATH" : "ROOT-CAUSE REMEDIATION PATH"}</strong>
          <div className="mt-1 opacity-90">{selectedCause?.recommended_action}</div>
        </div>

        <div className="flex gap-2">
          <button disabled={busy || (selectedCause?.restart_required && selectedServices.length === 0)} onClick={() => run(() => onSimulateFailure(server.name, cause, selectedServices))} className="flex-1 rounded-md bg-down/10 text-down border border-down/30 px-3 py-2 text-xs font-mono hover:bg-down/20 transition disabled:opacity-40 disabled:cursor-not-allowed">
            simulate DPA failure
          </button>
          <button disabled={busy || !report} onClick={() => run(() => onClearFailure(server.name))} className="rounded-md border border-line px-3 py-2 text-xs font-mono text-muted hover:text-ink transition disabled:opacity-40">clear</button>
        </div>
      </div>

      {report && (
        <div className={`mx-4 mb-4 rounded-md border px-3 py-3 ${report.restart_required ? "border-up/30 bg-up/5" : "border-pending/30 bg-pending/5"}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-ink">DPA failure report</span>
            <span className={`text-[10px] font-mono uppercase ${report.restart_required ? "text-up" : "text-pending"}`}>{report.restart_required ? "restart required" : "restart not required"}</span>
          </div>
          <div className="mt-1 text-[11px] font-mono text-muted">cause: <span className="text-ink">{report.code}</span></div>
          <div className="mt-1 text-[11px] font-mono text-muted">target service(s): <span className="text-ink">{report.target_services?.join(", ") || "none"}</span></div>
          <div className="mt-1 text-[11px] font-mono text-muted">{report.description}</div>
          {report.restart_required && (
            <button disabled={busy} onClick={() => run(() => onRestartServices(server.name, report.target_services))} className="mt-3 w-full rounded-md bg-up/10 text-up border border-up/30 px-3 py-2 text-xs font-mono hover:bg-up/20 transition disabled:opacity-40">
              {busy ? "restarting services…" : `restart ${report.target_services?.join(", ")}`}
            </button>
          )}
        </div>
      )}

      {actionMessage && <div className="mx-4 mb-4 rounded border border-down/30 bg-down/10 text-down px-3 py-2 text-[11px] font-mono">{actionMessage}</div>}

      <div className="px-4 pb-4 border-t border-line pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted">health</span>
          <div className="flex items-center gap-1">
            <span className={`text-[11px] font-mono ${HEALTH_LABEL[health].color}`}>{HEALTH_LABEL[health].label}</span>
            <select value={health} onChange={(e) => onSetHealth(server.name, e.target.value)} className="rounded border border-line bg-panel2 text-ink text-[11px] font-mono px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand">
              <option value="healthy">healthy</option><option value="unhealthy">unhealthy</option><option value="not_reporting">not reporting</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-muted">storage used</span>
          <div className="flex items-center gap-1">
            <input type="number" min={0} max={100} value={storageInput} onChange={(e) => setStorageInput(e.target.value)} className="w-14 rounded border border-line bg-panel2 text-ink text-[11px] font-mono px-1.5 py-1" />
            <span className="text-[11px] font-mono text-muted">%</span>
            <button onClick={() => onSetStorage(server.name, Number(storageInput))} className="rounded border border-line px-2 py-1 text-[11px] font-mono text-muted hover:text-brand hover:border-brand/50 transition">set</button>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <button onClick={() => setLogOpen((v) => !v)} className="w-full text-left px-4 py-2 text-[11px] font-mono text-muted hover:text-ink transition flex items-center justify-between"><span>event log</span><span>{logOpen ? "▲" : "▼"}</span></button>
        {logOpen && <EventLog events={server.events} />}
      </div>
    </div>
  );
}
