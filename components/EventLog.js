const TYPE_COLOR = {
  fail: "text-down",
  restart: "text-up",
  created: "text-brand",
  service_added: "text-muted",
  service_removed: "text-muted",
  health: "text-pending",
  storage: "text-brand",
  failure_report: "text-down",
  resolved: "text-up",
};

function timeAgo(dateStr) {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function EventLog({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-muted text-xs font-mono px-3 py-2">no events yet</p>;
  }

  return (
    <div className="max-h-32 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
      {events.map((e, i) => (
        <div key={i} className="text-xs font-mono flex gap-2">
          <span className="text-muted shrink-0">{timeAgo(e.at)}</span>
          <span className={`${TYPE_COLOR[e.type] || "text-muted"} shrink-0`}>[{e.type}]</span>
          <span className="text-ink/80 truncate">{e.message}</span>
        </div>
      ))}
    </div>
  );
}
