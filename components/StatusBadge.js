const STYLES = {
  running: { color: "text-up", label: "running" },
  up: { color: "text-up", label: "up" },
  stopped: { color: "text-down", label: "stopped" },
  down: { color: "text-down", label: "down" },
  restarting: { color: "text-pending", label: "restarting" },
};

export default function StatusBadge({ status, size = "sm" }) {
  const style = STYLES[status] || STYLES.stopped;
  const dotSize = size === "lg" ? "w-2.5 h-2.5" : "w-1.5 h-1.5";
  const textSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono ${textSize} ${style.color}`}>
      <span className={`${dotSize} rounded-full bg-current animate-pulse-dot`} />
      {style.label}
    </span>
  );
}
