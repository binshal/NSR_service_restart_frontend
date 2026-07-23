"use client";

import { useState } from "react";

export default function AddServerModal({ onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [osType, setOsType] = useState("Windows");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Server name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit(name.trim(), osType);
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
          <h2 className="font-mono text-sm text-ink">register server</h2>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5">server name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. bkp-app-node-04"
              className="w-full rounded-md border border-line bg-panel2 px-3 py-2 text-sm font-mono text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5">os type</label>
            <div className="grid grid-cols-2 gap-2">
              {["Windows", "AIX"].map((os) => (
                <button
                  type="button"
                  key={os}
                  onClick={() => setOsType(os)}
                  className={`rounded-md border px-3 py-2 text-sm font-mono transition ${
                    osType === os
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-line bg-panel2 text-muted hover:text-ink"
                  }`}
                >
                  {os}
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
              {saving ? "adding…" : "add server"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
