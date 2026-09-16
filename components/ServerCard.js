"use client";

import { useState, useMemo } from "react";
import StatusBadge from "./StatusBadge";
import EventLog from "./EventLog";

const HEALTH_LABEL = {
  healthy: { color: "text-up", label: "healthy" },
  unhealthy: { color: "text-pending", label: "unhealthy" },
  not_reporting: { color: "text-down", label: "not reporting" },
};

const SEVERITY_STYLE = {
  Critical: "text-down border-down/40 bg-down/10",
  Error: "text-down border-down/30 bg-down/5",
  Warning: "text-pending border-pending/40 bg-pending/10",
};

const CATEGORY_STYLE = {
  service: "text-up border-up/40 bg-up/10",
  storage: "text-pending border-pending/40 bg-pending/10",
  connectivity: "text-brand border-brand/40 bg-brand/10",
  authentication: "text-pending border-pending/40 bg-pending/10",
  license: "text-pending border-pending/40 bg-pending/10",
  hardware: "text-down border-down/40 bg-down/10",
  configuration: "text-muted border-line bg-panel2",
};

export default function ServerCard({
  server,
  errorCatalog,
  onSimulateFailure,
  onResolveFailure,
  onRestart,
  onDelete,
  onAddService,
  onRemoveService,
  onSetHealth,
  onSetStorage,
}) {
  const [busy, setBusy] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [storageInput, setStorageInput] = useState(server.storage_used_percent ?? 20);
  const [code, setCode] = useState(errorCatalog?.[0]?.code || "");
  const [notice, setNotice] = useState("");

  const activeError = server.active_backup_error;
  // The catalog entry backing the active failure, used only to render the
  // reference classification next to the raw errorstring. The agent does not
  // get this — it has to derive it from the errorstring alone.
  const activeDef = useMemo(
    () => errorCatalog?.find((e) => e.errorstring === activeError?.errorstring) || null,
    [errorCatalog, activeError]
  );
  const stopped = server.services.filter((s) => s.status === "stopped");

  async function run(action) {
    setBusy(true);
    setNotice("");
    try {
      const out = await action();
      if (out?.warning) setNotice(out.warning);
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel shadow-card overflow-hidden flex flex-col">
      <div className="px-4 py-3 flex items-start justify-between border-b border-line">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm text-ink truncate">{server.name}</h3>
            <span className="text-[10px] font-mono uppercase tracking-wide text-muted border border-line rounded px-1.5 py-0.5 shrink-0">
              {server.os_type}
            </span>
          </div>
          {/* The full OS string NetWorker stores on the client resource — this
              is what client_config returns and what the OS tool normalizes. */}
          <p className="text-[10px] font-mono text-muted/70 mt-1 truncate">
            {server.os_version || "os version unknown"}
          </p>
          <div className="mt-1.5">
            <StatusBadge status={server.server_status} size="lg" />
          </div>
        </div>
        <button
          onClick={() => onDelete(server.name)}
          className="text-muted hover:text-down text-xs font-mono transition shrink-0"
          title="Remove client"
        >
          remove
        </button>
      </div>

      {/* Active NetWorker failure, shown the way DPA reports it: job id,
          severity, and the raw errorstring. */}
      {activeError && (
        <div className="px-4 pt-3">
          <div className="rounded-md border border-line bg-panel2 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-mono text-muted">
                job {activeError.backupjob_id}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  SEVERITY_STYLE[activeError.severity] || SEVERITY_STYLE.Error
                }`}
              >
                {activeError.severity}
              </span>
            </div>
            <p className="text-[11px] font-mono text-ink/85 leading-snug">
              {activeError.errorstring}
            </p>
            {activeDef && (
              <div className="mt-2 pt-2 border-t border-line/60 flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    CATEGORY_STYLE[activeDef.category] || CATEGORY_STYLE.configuration
                  }`}
                >
                  {activeDef.category}
                </span>
                <span
                  className={`text-[10px] font-mono ${
                    activeDef.restart_required ? "text-up" : "text-down"
                  }`}
                >
                  {activeDef.restart_required
                    ? `restart ${activeDef.target_daemons.join(", ")}`
                    : "restart will not fix"}
                </span>
              </div>
            )}
            {activeError.restart_attempted && (
              <p className="text-[10px] font-mono text-pending mt-2">
                restart was attempted — root cause still present
              </p>
            )}
          </div>
        </div>
      )}

      {notice && (
        <div className="px-4 pt-3">
          <p className="text-[10.5px] font-mono text-pending border border-pending/30 bg-pending/10 rounded-md px-2.5 py-2 leading-snug">
            {notice}
          </p>
        </div>
      )}

      <div className="px-4 py-3 space-y-2 flex-1">
        {server.services.length === 0 && (
          <p className="text-xs text-muted font-mono">no networker daemons on this client</p>
        )}
        {server.services.map((svc) => (
          <div
            key={svc._id}
            className="flex items-center justify-between rounded-md bg-panel2 px-3 py-2 border border-line/60"
          >
            <span className="font-mono text-sm text-ink">{svc.name}</span>
            <div className="flex items-center gap-2">
              <StatusBadge status={svc.status} />
              {svc.status === "stopped" && (
                <button
                  disabled={busy}
                  onClick={() => run(() => onRestart(server.name, [svc.name]))}
                  className="rounded bg-up/10 text-up border border-up/30 px-2 py-1 text-[10px] font-mono hover:bg-up/20 transition disabled:opacity-40"
                >
                  restart
                </button>
              )}
              <button
                onClick={() => onRemoveService(server.name, svc._id)}
                className="text-muted hover:text-down text-xs transition"
                title="Remove daemon"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={() => onAddService(server.name)}
          className="w-full rounded-md border border-dashed border-line px-3 py-2 text-xs font-mono text-muted hover:text-brand hover:border-brand/50 transition"
        >
          + add networker daemon
        </button>
      </div>

      {/* Failure injector. Selecting an error writes a realistic NetWorker
          errorstring onto this client, which is then what backup_error
          reports — same as a real failed job. */}
      <div className="px-4 pb-3 space-y-2 border-t border-line pt-3">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={busy || !errorCatalog?.length}
          className="w-full rounded-md border border-line bg-panel2 text-ink text-[11px] font-mono px-2 py-2 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-40"
        >
          {(errorCatalog || []).map((e) => (
            <option key={e.code} value={e.code}>
              {e.restart_required ? "◆" : "○"} {e.title}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            disabled={busy || !code}
            onClick={() => run(() => onSimulateFailure(server.name, code))}
            className="flex-1 rounded-md bg-down/10 text-down border border-down/30 px-3 py-2 text-xs font-mono hover:bg-down/20 transition disabled:opacity-40"
          >
            inject failure
          </button>
          {activeError && (
            <button
              disabled={busy}
              onClick={() => run(() => onResolveFailure(server.name))}
              className="flex-1 rounded-md bg-brand/10 text-brand border border-brand/30 px-3 py-2 text-xs font-mono hover:bg-brand/20 transition disabled:opacity-40"
              title="Clear the alert without restarting — the other team fixed it"
            >
              clear alert
            </button>
          )}
        </div>

        {stopped.length > 1 && (
          <button
            disabled={busy}
            onClick={() => run(() => onRestart(server.name))}
            className="w-full rounded-md bg-up/10 text-up border border-up/30 px-3 py-2 text-xs font-mono hover:bg-up/20 transition disabled:opacity-40"
          >
            {busy ? "restarting…" : `restart all stopped (${stopped.length})`}
          </button>
        )}
      </div>

      <div className="px-4 pb-4 border-t border-line pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted">health</span>
          <div className="flex items-center gap-1">
            <span
              className={`text-[11px] font-mono ${
                HEALTH_LABEL[server.health_status || "healthy"].color
              }`}
            >
              {HEALTH_LABEL[server.health_status || "healthy"].label}
            </span>
            <select
              value={server.health_status || "healthy"}
              onChange={(e) => onSetHealth(server.name, e.target.value)}
              className="rounded border border-line bg-panel2 text-ink text-[11px] font-mono px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="healthy">healthy</option>
              <option value="unhealthy">unhealthy</option>
              <option value="not_reporting">not reporting</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-muted">storage used</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={storageInput}
              onChange={(e) => setStorageInput(e.target.value)}
              className="w-14 rounded border border-line bg-panel2 text-ink text-[11px] font-mono px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            <span className="text-[11px] font-mono text-muted">%</span>
            <button
              onClick={() => onSetStorage(server.name, Number(storageInput))}
              className="rounded border border-line px-2 py-1 text-[11px] font-mono text-muted hover:text-brand hover:border-brand/50 transition"
            >
              set
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <button
          onClick={() => setLogOpen((v) => !v)}
          className="w-full text-left px-4 py-2 text-[11px] font-mono text-muted hover:text-ink transition flex items-center justify-between"
        >
          <span>event log</span>
          <span>{logOpen ? "▲" : "▼"}</span>
        </button>
        {logOpen && <EventLog events={server.events} />}
      </div>
    </div>
  );
}
