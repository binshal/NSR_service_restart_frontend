"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";
import EventLog from "./EventLog";

const HEALTH_LABEL = {
  healthy: { color: "text-up", label: "healthy" },
  unhealthy: { color: "text-pending", label: "unhealthy" },
  not_reporting: { color: "text-down", label: "not reporting" },
};

export default function ServerCard({
  server,
  onFail,
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
  const isDown = server.server_status === "down";
  const health = server.health_status || "healthy";

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel shadow-card overflow-hidden">
      <div className="px-4 py-3 flex items-start justify-between border-b border-line">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm text-ink">{server.name}</h3>
            <span className="text-[10px] font-mono uppercase tracking-wide text-muted border border-line rounded px-1.5 py-0.5">
              {server.os_type}
            </span>
          </div>
          <div className="mt-1">
            <StatusBadge status={server.server_status} size="lg" />
          </div>
        </div>
        <button
          onClick={() => onDelete(server.name)}
          className="text-muted hover:text-down text-xs font-mono transition"
          title="Remove server"
        >
          remove
        </button>
      </div>

      <div className="px-4 py-3 space-y-2">
        {server.services.length === 0 && (
          <p className="text-xs text-muted font-mono">no nsr services on this server yet</p>
        )}
        {server.services.map((svc) => (
          <div
            key={svc._id}
            className="flex items-center justify-between rounded-md bg-panel2 px-3 py-2 border border-line/60"
          >
            <span className="font-mono text-sm text-ink">{svc.name}</span>
            <div className="flex items-center gap-3">
              <StatusBadge status={svc.status} />
              <button
                onClick={() => onRemoveService(server.name, svc._id)}
                className="text-muted hover:text-down text-xs transition"
                title="Remove service"
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
          + add nsr service
        </button>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <button
          disabled={busy || isDown}
          onClick={() => run(() => onFail(server.name))}
          className="flex-1 rounded-md bg-down/10 text-down border border-down/30 px-3 py-2 text-xs font-mono hover:bg-down/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDown ? "server down" : "simulate failure"}
        </button>
        <button
          disabled={busy || !isDown}
          onClick={() => run(() => onRestart(server.name))}
          className="flex-1 rounded-md bg-up/10 text-up border border-up/30 px-3 py-2 text-xs font-mono hover:bg-up/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? "restarting…" : "restart nsr"}
        </button>
      </div>

      <div className="px-4 pb-4 border-t border-line pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-muted">health</span>
          <div className="flex items-center gap-1">
            <span className={`text-[11px] font-mono ${HEALTH_LABEL[health].color}`}>
              {HEALTH_LABEL[health].label}
            </span>
            <select
              value={health}
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
