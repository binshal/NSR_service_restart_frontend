"use client";

import { useState } from "react";

const PRESETS = ["nsrexecd", "nsrd", "nsrmmd", "nsrindexd"];

export default function AddServiceModal({ serverName, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Service name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-panel shadow-card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-mono text-sm text-ink">
            add nsr service <span className="text-muted">→ {serverName}</span>
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5">service name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. nsrexecd"
              className="w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm font-mono text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setName(p)}
                  className="rounded border border-line px-2 py-1 text-[11px] font-mono text-muted hover:text-ink hover:border-brand/50 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-xs text-down font-mono">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm text-muted hover:text-ink transition"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 transition disabled:opacity-50"
            >
              {saving ? "adding…" : "add service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
