export default function WidgetCard({ title, subtitle, children, footer }) {
  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-[14px] text-gray-700">{title}</h3>
        <div className="flex items-center gap-2">
          {subtitle && <span className="text-[11px] text-gray-400">{subtitle}</span>}
          <span className="text-gray-400 text-base leading-none select-none">⋮</span>
        </div>
      </div>
      <div className="p-4 flex-1">{children}</div>
      {footer && (
        <div className="px-4 pb-3">
          <button className="text-[12px] text-sky-600 hover:underline">{footer}</button>
        </div>
      )}
    </div>
  );
}
