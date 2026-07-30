export default function TrendChart({ data }) {
  const width = 260;
  const height = 90;
  const pad = 14;
  const maxVal = Math.max(1, ...data.map((d) => Math.max(d.completed, d.failed)));
  const stepX = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0;
  const toY = (v) => height - pad - (v / maxVal) * (height - pad * 2);
  const linePoints = (key) => data.map((d, i) => `${pad + i * stepX},${toY(d[key])}`).join(" ");

  return (
    <div>
      <div className="flex items-center gap-4 mb-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#3AA655] inline-block" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#D9483A] inline-block" /> Failed
        </span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline points={linePoints("completed")} fill="none" stroke="#3AA655" strokeWidth="2" />
        <polyline points={linePoints("failed")} fill="none" stroke="#D9483A" strokeWidth="2" />
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        {data.map((d, i) => (
          <span key={i}>{d.label}</span>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Counts / Days Ago</p>
    </div>
  );
}
