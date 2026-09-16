"use client";

import { useEffect, useState, useCallback } from "react";
import { dpaApi } from "@/lib/api";
import DonutChart from "./DonutChart";
import TrendChart from "./TrendChart";
import WidgetCard from "./WidgetCard";

const NAV_ITEMS = [
  "Dashboard",
];

const DONUT_COLORS = {
  completed: "#3AA655",
  failed: "#D9483A",
  completedWithExceptions: "#E8A33D",
  running: "#7C6FE0",
  pending: "#9AA5B1",
};

function DonutWidget({ title, data }) {
  const segments = [
    { key: "completed", label: "Completed", value: data.completed, color: DONUT_COLORS.completed },
    { key: "failed", label: "Failed", value: data.failed, color: DONUT_COLORS.failed },
    {
      key: "completedWithExceptions",
      label: "Completed w/ Exceptions",
      value: data.completedWithExceptions,
      color: DONUT_COLORS.completedWithExceptions,
    },
    { key: "running", label: "Running", value: data.running, color: DONUT_COLORS.running },
    { key: "pending", label: "Pending", value: data.pending, color: DONUT_COLORS.pending },
  ];
  const successPct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 100;

  return (
    <WidgetCard title={title} subtitle="Last 24 Hours">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <DonutChart segments={segments.map((s) => ({ value: s.value, color: s.color }))} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-gray-700">{successPct}%</span>
            <span className="text-[10px] text-gray-400">Success</span>
          </div>
        </div>
        <div className="flex-1 text-[13px] text-gray-600">
          {segments.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-0.5">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
              <span className="font-medium text-gray-700">{s.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1 mt-1 border-t border-gray-100 font-medium">
            <span>Total</span>
            <span>{data.total}</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

function AssetsSummaryWidget({ assets }) {
  return (
    <WidgetCard title="Assets | Summary" subtitle="Last 24 Hours" footer="View All">
      <div className="flex gap-8 mb-4">
        <div>
          <div className="text-2xl font-semibold text-sky-700">
            {assets.total}
            <span className="text-[11px] font-normal text-gray-400 ml-1">Total</span>
          </div>
          <div className="text-[12px] text-gray-500">VMs</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-gray-700">
            0<span className="text-[11px] font-normal text-gray-400 ml-1">Other</span>
          </div>
          <div className="text-[12px] text-gray-500">Assets</div>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mb-2">With Completed Activity of Any Protection Type</p>
      <div className="grid grid-cols-2 gap-y-2 text-[13px] text-gray-600">
        <span>Backed Up</span>
        <span className="text-right font-medium text-gray-700">{assets.backedUp}</span>
        <span>Replicated</span>
        <span className="text-right font-medium text-gray-700">0</span>
      </div>
    </WidgetCard>
  );
}

function TopOffendersWidget({ offenders }) {
  return (
    <WidgetCard title="Assets | Top Offenders" subtitle="">
      <p className="text-[11px] text-gray-400 mb-3">Assets with 3+ failures-in-a-row — Backups or Replications</p>
      {offenders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-9 h-9 rounded-full bg-[#3AA655] text-white flex items-center justify-center text-lg mb-2">
            ✓
          </div>
          <p className="text-[13px] text-gray-600">No Offending Assets</p>
        </div>
      ) : (
        <ul className="text-[13px] text-gray-600 space-y-1.5">
          {offenders.map((o) => (
            <li key={o.server} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D9483A] inline-block" />
                {o.server} <span className="text-gray-400">({o.os_type})</span>
              </span>
              <span className="font-medium text-gray-700">{o.failures}</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}

const ALERT_ICON = {
  error: { symbol: "✕", bg: "#D9483A" },
  warn: { symbol: "!", bg: "#E8A33D" },
  info: { symbol: "i", bg: "#6FA9DE" },
};

function AlertsSummaryWidget({ alerts }) {
  return (
    <WidgetCard title="Alerts | Summary" subtitle="" footer="View All">
      <div className="flex items-center gap-6 mb-4">
        {["error", "warn", "info"].map((level) => (
          <span key={level} className="flex items-center gap-2 text-[13px] text-gray-700">
            <span
              className="w-5 h-5 rounded-full text-white text-[11px] flex items-center justify-center"
              style={{ backgroundColor: ALERT_ICON[level].bg }}
            >
              {ALERT_ICON[level].symbol}
            </span>
            {alerts[level]}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {alerts.recent.length === 0 && <p className="text-[12px] text-gray-400">No recent alerts</p>}
        {alerts.recent.map((a, i) => (
          <div key={i} className="text-[12px] text-gray-600 flex gap-2">
            <span
              className="w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: ALERT_ICON[a.level].bg }}
            >
              {ALERT_ICON[a.level].symbol}
            </span>
            <span>
              <span className="text-gray-400">{new Date(a.at).toLocaleDateString()}</span> {a.server}: {a.message}
            </span>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

function StorageTopUtilizationWidget({ storage }) {
  const exceeded = storage.topUtilization.filter((s) => s.percent >= 90).length;
  return (
    <WidgetCard title="Storage Capacity | Top Utilization" subtitle="">
      <p className="text-[11px] text-gray-400 mb-1">Systems</p>
      <p className="text-[13px] text-gray-600 mb-3">
        <span className="font-semibold text-gray-700">{exceeded}</span> Exceeded Threshold
      </p>
      <div className="space-y-2.5">
        {storage.topUtilization.map((s) => (
          <div key={s.server} className="flex items-center gap-3">
            <span className="text-[12px] text-gray-600 w-24 truncate">{s.server}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-sky-500" style={{ width: `${s.percent}%` }} />
            </div>
            <span className="text-[12px] text-gray-500 w-9 text-right">{s.percent}%</span>
          </div>
        ))}
        {storage.topUtilization.length === 0 && <p className="text-[12px] text-gray-400">No assets yet</p>}
      </div>
    </WidgetCard>
  );
}

function StorageSummaryWidget({ storage }) {
  const pct = storage.summary.usedPercent;
  return (
    <WidgetCard title="Storage Capacity | Summary" subtitle="">
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-24 rounded bg-gray-100 relative overflow-hidden flex items-end">
            <div className="w-full bg-sky-500" style={{ height: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-gray-400 mt-1">% Used</span>
        </div>
        <div className="text-[13px] text-gray-600 space-y-2">
          <div className="flex justify-between gap-6">
            <span>Used</span>
            <span className="font-medium text-gray-700">{pct}%</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>Available</span>
            <span className="font-medium text-gray-700">{100 - pct}%</span>
          </div>
          <div className="flex justify-between gap-6 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="font-medium text-gray-700">100%</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

const HEALTH_COLOR = { notReporting: "#9AA5B1", unhealthy: "#E8A33D", healthy: "#3AA655" };

function HealthSummaryWidget({ health }) {
  return (
    <WidgetCard title="Health | Summary" subtitle="" footer="View All">
      <div className="flex items-center gap-6 mb-4">
        <span className="flex items-center gap-2 text-[13px] text-gray-700">
          <span
            className="w-5 h-5 rounded-full text-white text-[11px] flex items-center justify-center"
            style={{ backgroundColor: HEALTH_COLOR.notReporting }}
          >
            ⊘
          </span>
          {health.notReporting} <span className="text-gray-400">Not Reporting</span>
        </span>
        <span className="flex items-center gap-2 text-[13px] text-gray-700">
          <span
            className="w-5 h-5 rounded-full text-white text-[11px] flex items-center justify-center"
            style={{ backgroundColor: HEALTH_COLOR.unhealthy }}
          >
            !
          </span>
          {health.unhealthy} <span className="text-gray-400">Unhealthy</span>
        </span>
        <span className="flex items-center gap-2 text-[13px] text-gray-700">
          <span
            className="w-5 h-5 rounded-full text-white text-[11px] flex items-center justify-center"
            style={{ backgroundColor: HEALTH_COLOR.healthy }}
          >
            ✓
          </span>
          {health.healthy} <span className="text-gray-400">Healthy</span>
        </span>
      </div>
      <div className="space-y-2">
        {health.list.map((s) => (
          <div key={s.name} className="flex items-center gap-3">
            <span className="text-[12px] text-gray-600 w-24 truncate">{s.name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full" style={{ width: "100%", backgroundColor: HEALTH_COLOR[s.health] }} />
            </div>
          </div>
        ))}
        {health.list.length === 0 && <p className="text-[12px] text-gray-400">No assets yet</p>}
      </div>
    </WidgetCard>
  );
}


const CAT_COLOR = {
  service: "#3AA655",
  storage: "#E8A33D",
  connectivity: "#6FA9DE",
  authentication: "#E8A33D",
  license: "#E8A33D",
  hardware: "#D9483A",
  configuration: "#9AA5B1",
};

// Mirrors what the agent's first tool call sees, with the classification the
// analysis sub-agent is expected to reach. Anyone watching this widget can
// predict exactly which clients the workflow will route to the restart agent.
function RootCauseWidget({ rootCause }) {
  const categories = Object.entries(rootCause?.byCategory || {});
  const active = rootCause?.active || [];

  return (
    <WidgetCard title="Root Cause | Active Failures" subtitle="backup_error classification">
      {categories.length > 0 && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {categories.map(([cat, count]) => (
            <span key={cat} className="flex items-center gap-1.5 text-[12px] text-gray-600">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: CAT_COLOR[cat] || "#9AA5B1" }}
              />
              {cat} ({count})
            </span>
          ))}
        </div>
      )}
      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-9 h-9 rounded-full bg-[#3AA655] text-white flex items-center justify-center text-lg mb-2">
            &#10003;
          </div>
          <p className="text-[13px] text-gray-600">No active failures</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {active.map((f) => (
            <div key={`${f.client_name}-${f.backupjob_id}`} className="border border-gray-100 rounded-md px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-gray-700">
                  {f.client_name}
                  <span className="text-gray-400 font-normal"> ({f.os_type})</span>
                </span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    color: f.restart_required ? "#3AA655" : "#D9483A",
                    backgroundColor: f.restart_required ? "rgba(58,166,85,0.1)" : "rgba(217,72,58,0.1)",
                  }}
                >
                  {f.restart_required ? `restart ${f.target_daemons.join(", ")}` : "no restart"}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-1">{f.title}</p>
              {!f.restart_required && (
                <p className="text-[11px] text-gray-400 mt-0.5">&rarr; {f.recommended_action}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}

export default function DpaDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await dpaApi.getDashboard();
      setData(d);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div className="bg-[#F4F6F8] text-gray-800 min-h-[calc(100vh-73px)]">
      {/* Header */}
      <div className="bg-[#0B67B2] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wide text-sm">DELL EMC</span>
          <span className="text-white/50">|</span>
          <span className="text-sm">Data Protection Central</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span>⟳</span>
          <span>⚙</span>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 bg-white border-r border-gray-200 py-3 shrink-0 hidden md:block">
          {NAV_ITEMS.map((item) => (
            <div
              key={item}
              className={`px-4 py-2 text-[13px] cursor-default ${
                item === "Dashboard"
                  ? "text-sky-700 border-l-2 border-sky-600 bg-sky-50 font-medium"
                  : "text-gray-500 border-l-2 border-transparent"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-gray-700">Dashboard</h2>
          </div>

          {error && (
            <p className="text-red-600 text-sm border border-red-200 bg-red-50 rounded px-3 py-2 mb-4">
              {error} — is the NSR backend running?
            </p>
          )}

          {!data ? (
            <p className="text-sm text-gray-400">loading dashboard…</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <DonutWidget title="Assets | Backups & Replications" data={data.assetsBackupsReplications} />
              <DonutWidget title="Jobs | Backups & Replications" data={data.jobsBackupsReplications} />
              <WidgetCard title="Assets | Backups & Replications Trend" subtitle="">
                <TrendChart data={data.trend} />
              </WidgetCard>

              <AssetsSummaryWidget assets={data.assets} />
              <TopOffendersWidget offenders={data.topOffenders} />
              <AlertsSummaryWidget alerts={data.alerts} />

              <StorageTopUtilizationWidget storage={data.storage} />
              <StorageSummaryWidget storage={data.storage} />
              <HealthSummaryWidget health={data.health} />

              <div className="lg:col-span-3">
                <RootCauseWidget rootCause={data.rootCause} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
