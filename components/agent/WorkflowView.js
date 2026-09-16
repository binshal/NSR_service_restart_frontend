"use client";

import { useState, useCallback } from "react";
import { api, dpaApi } from "@/lib/api";

/**
 * Visual walkthrough of the Wings workflow, driven by the real API.
 *
 * Each step below issues the same call the corresponding Wings node would, in
 * the same order, and shows the raw payload. The point of showing raw JSON is
 * that it makes the constraint visible: step 1's response genuinely has no OS
 * field, which is why step 3 exists.
 *
 * Steps:
 *   1. Check DPA        -> GET /api/dpa/backup-error        (tool)
 *   2. Analyze          -> classify each errorstring         (sub-agent)
 *   3. Resolve OS       -> GET /api/dpa/client-config        (tool)
 *   4. Route            -> restart-required clients only     (if/else node)
 *   5. Restart          -> POST /nsr-restart per client      (restart agent)
 */

const STEP_META = [
  { id: 1, label: "Check DPA", sub: "backup_error", kind: "tool" },
  { id: 2, label: "Analyze failures", sub: "sub-agent", kind: "agent" },
  { id: 3, label: "Resolve OS type", sub: "client_config", kind: "tool" },
  { id: 4, label: "Route by decision", sub: "if / else", kind: "logic" },
  { id: 5, label: "Restart NSR", sub: "restart agent", kind: "agent" },
];

const KIND_STYLE = {
  tool: "text-brand border-brand/40 bg-brand/10",
  agent: "text-up border-up/40 bg-up/10",
  logic: "text-pending border-pending/40 bg-pending/10",
};

// Client-side mirror of the classifier the analysis sub-agent is expected to
// apply. Matching is on the errorstring text, exactly as the agent would do it
// — this view never asks the backend for the answer.
const RESTART_SIGNALS = [
  { re: /program not registered/i, daemons: ["nsrexecd"], why: "nsrexecd not answering RPC" },
  { re: /nsrexecd:\s*connection refused/i, daemons: ["nsrexecd"], why: "nsrexecd stopped" },
  { re: /nsrd:\s*daemon is not responding/i, daemons: ["nsrd"], why: "nsrd unresponsive" },
  { re: /nsrmmd:\s*media daemon failed to respond/i, daemons: ["nsrmmd"], why: "media daemon hung" },
  { re: /nsrindexd:.*index lock held by a stale process/i, daemons: ["nsrindexd"], why: "stale index lock" },
  { re: /no networker daemons detected/i, daemons: ["nsrexecd", "nsrd"], why: "daemons down after reboot" },
];

const NO_RESTART_SIGNALS = [
  { re: /no space left on device|media waiting/i, why: "storage exhausted", team: "Storage" },
  { re: /unreachable|no route to client/i, why: "host unreachable", team: "Network" },
  { re: /connection timed out|service port range/i, why: "ports blocked", team: "Network" },
  { re: /host name lookup failure/i, why: "DNS resolution", team: "Network" },
  { re: /authentication error|peer certificate/i, why: "peer auth mismatch", team: "Backup admin" },
  { re: /permission denied|credential was rejected/i, why: "credential rejected", team: "Backup admin" },
  { re: /license.*expired/i, why: "license expired", team: "Licensing" },
  { re: /hardware error|marked as suspect/i, why: "device hardware fault", team: "Hardware" },
  { re: /cannot open save set path/i, why: "bad save set config", team: "Backup admin" },
];

function classify(errorstring) {
  for (const s of RESTART_SIGNALS) {
    if (s.re.test(errorstring)) {
      return { restart_required: true, target_daemons: s.daemons, why: s.why };
    }
  }
  for (const s of NO_RESTART_SIGNALS) {
    if (s.re.test(errorstring)) {
      return { restart_required: false, target_daemons: [], why: s.why, team: s.team };
    }
  }
  return { restart_required: false, target_daemons: [], why: "unrecognized error", team: "Backup admin" };
}

function Json({ data }) {
  return (
    <pre className="text-[10.5px] leading-relaxed font-mono text-ink/80 bg-base/60 border border-line rounded-md p-3 overflow-x-auto scrollbar-thin max-h-56">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StepShell({ meta, active, done, children }) {
  return (
    <div
      className={`rounded-lg border transition ${
        done ? "border-line bg-panel" : active ? "border-brand/50 bg-panel" : "border-line/50 bg-panel/40"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line/60">
        <span
          className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-mono shrink-0 ${
            done ? "bg-up/15 text-up" : active ? "bg-brand/15 text-brand" : "bg-panel2 text-muted"
          }`}
        >
          {done ? "✓" : meta.id}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink font-mono truncate">{meta.label}</div>
        </div>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${KIND_STYLE[meta.kind]}`}
        >
          {meta.sub}
        </span>
      </div>
      {children && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}

export default function WorkflowView() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [backupError, setBackupError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [configs, setConfigs] = useState(null);
  const [routed, setRouted] = useState(null);
  const [restarts, setRestarts] = useState(null);
  const [err, setErr] = useState("");

  const reset = () => {
    setStep(0);
    setBackupError(null);
    setAnalysis(null);
    setConfigs(null);
    setRouted(null);
    setRestarts(null);
    setErr("");
  };

  const run = useCallback(async () => {
    reset();
    setRunning(true);
    const pause = (ms) => new Promise((r) => setTimeout(r, ms));

    try {
      // Step 1 — the only failure feed the workflow gets.
      setStep(1);
      const be = await dpaApi.getBackupError();
      setBackupError(be);
      await pause(600);

      if (be.record_count === 0) {
        setStep(6);
        setRunning(false);
        return;
      }

      // Step 2 — sub-agent reads each free-text errorstring and decides.
      setStep(2);
      const analyzed = be.records.map((r) => ({
        ...r,
        decision: classify(r.errorstring),
      }));
      setAnalysis(analyzed);
      await pause(700);

      // Step 3 — only clients that need a restart get an OS lookup. There is
      // no point resolving OS for a failure nobody is going to act on.
      setStep(3);
      const needRestart = analyzed.filter((a) => a.decision.restart_required);
      const cfgs = [];
      for (const a of needRestart) {
        const cfg = await dpaApi.getClientConfig(a.client_name);
        cfgs.push(cfg.client);
        await pause(250);
      }
      setConfigs(cfgs);
      await pause(400);

      // Step 4 — split the batch.
      setStep(4);
      const routing = {
        restart: needRestart.map((a) => {
          const cfg = cfgs.find((c) => c.client_name === a.client_name);
          return {
            client_name: a.client_name,
            os_type: cfg?.os_type,
            tool: cfg?.os_type === "Windows" ? "restart_nsr_windows" : "restart_nsr_aix",
            services: a.decision.target_daemons,
            why: a.decision.why,
          };
        }),
        skip: analyzed
          .filter((a) => !a.decision.restart_required)
          .map((a) => ({
            client_name: a.client_name,
            why: a.decision.why,
            team: a.decision.team,
          })),
      };
      setRouted(routing);
      await pause(700);

      // Step 5 — restart agent acts only on the routed subset.
      setStep(5);
      const results = [];
      for (const t of routing.restart) {
        const out = await api.restartServices(t.client_name, t.services.length ? t.services : undefined);
        results.push({
          client_name: t.client_name,
          tool: t.tool,
          restarted: out.restarted_services,
          resolved: out.root_cause_resolved,
        });
        await pause(250);
      }
      setRestarts(results);
      setStep(6);
    } catch (e) {
      setErr(e.message || "Workflow failed");
    } finally {
      setRunning(false);
    }
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="font-mono text-sm text-ink">agent workflow</h2>
          <p className="text-xs text-muted mt-1 max-w-2xl">
            Runs the real sequence against the live API. Step 1 returns only the four fields DPA
            documents for <span className="font-mono text-ink/70">backup_error</span> — note there is
            no OS field, which is why step 3 makes a second call.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reset}
            disabled={running}
            className="rounded-md border border-line px-3 py-2 text-xs font-mono text-muted hover:text-ink transition disabled:opacity-40"
          >
            reset
          </button>
          <button
            onClick={run}
            disabled={running}
            className="rounded-md bg-brand px-4 py-2 text-xs font-mono text-white hover:bg-brand/90 transition disabled:opacity-40"
          >
            {running ? "running…" : "run workflow"}
          </button>
        </div>
      </div>

      {err && (
        <p className="text-down text-xs font-mono border border-down/30 bg-down/10 rounded-md px-3 py-2 mb-4">
          {err}
        </p>
      )}

      <div className="space-y-3">
        {/* 1 */}
        <StepShell meta={STEP_META[0]} active={step === 1} done={step > 1}>
          {backupError ? (
            <>
              <p className="text-[11px] font-mono text-muted mb-2">
                GET /api/dpa/backup-error → {backupError.record_count} failure
                {backupError.record_count === 1 ? "" : "s"}
              </p>
              <Json data={backupError.records} />
            </>
          ) : (
            <p className="text-[11px] font-mono text-muted">waiting…</p>
          )}
        </StepShell>

        {/* 2 */}
        <StepShell meta={STEP_META[1]} active={step === 2} done={step > 2}>
          {analysis ? (
            <div className="space-y-2">
              {analysis.map((a) => (
                <div
                  key={a.client_name}
                  className="rounded-md border border-line bg-panel2 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-xs text-ink">{a.client_name}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        a.decision.restart_required
                          ? "text-up border-up/40 bg-up/10"
                          : "text-down border-down/40 bg-down/10"
                      }`}
                    >
                      {a.decision.restart_required ? "restart required" : "no restart"}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-muted/90 leading-snug">
                    “{a.errorstring}”
                  </p>
                  <p className="text-[11px] font-mono text-ink/70 mt-1">
                    → {a.decision.why}
                    {a.decision.target_daemons.length > 0 && (
                      <span className="text-up"> · {a.decision.target_daemons.join(", ")}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-mono text-muted">waiting…</p>
          )}
        </StepShell>

        {/* 3 */}
        <StepShell meta={STEP_META[2]} active={step === 3} done={step > 3}>
          {configs ? (
            configs.length ? (
              <>
                <p className="text-[11px] font-mono text-muted mb-2">
                  GET /api/dpa/client-config?client_name=… for {configs.length} client
                  {configs.length === 1 ? "" : "s"} needing restart
                </p>
                <Json
                  data={configs.map((c) => ({
                    client_name: c.client_name,
                    os_type: c.os_type,
                    os_version: c.os_version,
                    networker_version: c.networker_version,
                  }))}
                />
              </>
            ) : (
              <p className="text-[11px] font-mono text-muted">
                no clients needed a restart — OS lookup skipped
              </p>
            )
          ) : (
            <p className="text-[11px] font-mono text-muted">waiting…</p>
          )}
        </StepShell>

        {/* 4 */}
        <StepShell meta={STEP_META[3]} active={step === 4} done={step > 4}>
          {routed ? (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-md border border-up/30 bg-up/5 px-3 py-2">
                <p className="text-[11px] font-mono text-up mb-2">
                  → restart agent ({routed.restart.length})
                </p>
                {routed.restart.length === 0 && (
                  <p className="text-[11px] font-mono text-muted">none</p>
                )}
                {routed.restart.map((t) => (
                  <div key={t.client_name} className="text-[11px] font-mono text-ink/80 mb-1.5">
                    {t.client_name}{" "}
                    <span className="text-muted">
                      ({t.os_type}) → {t.tool}
                    </span>
                    <div className="text-muted/80">services: {t.services.join(", ") || "all stopped"}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-line bg-panel2 px-3 py-2">
                <p className="text-[11px] font-mono text-down mb-2">
                  → end / escalate ({routed.skip.length})
                </p>
                {routed.skip.length === 0 && (
                  <p className="text-[11px] font-mono text-muted">none</p>
                )}
                {routed.skip.map((t) => (
                  <div key={t.client_name} className="text-[11px] font-mono text-ink/80 mb-1.5">
                    {t.client_name} <span className="text-muted">— {t.why}</span>
                    <div className="text-muted/80">owner: {t.team}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[11px] font-mono text-muted">waiting…</p>
          )}
        </StepShell>

        {/* 5 */}
        <StepShell meta={STEP_META[4]} active={step === 5} done={step > 5}>
          {restarts ? (
            restarts.length ? (
              <div className="space-y-1.5">
                {restarts.map((r) => (
                  <div
                    key={r.client_name}
                    className="flex items-center justify-between gap-2 text-[11px] font-mono rounded-md border border-line bg-panel2 px-3 py-2"
                  >
                    <span className="text-ink">
                      {r.client_name} <span className="text-muted">· {r.tool}</span>
                    </span>
                    <span className={r.resolved ? "text-up" : "text-pending"}>
                      {r.restarted.join(", ") || "none"} {r.resolved ? "· resolved" : "· not resolved"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] font-mono text-muted">nothing to restart</p>
            )
          ) : (
            <p className="text-[11px] font-mono text-muted">waiting…</p>
          )}
        </StepShell>
      </div>

      {step === 6 && (
        <p className="text-[11px] font-mono text-up mt-4">workflow complete</p>
      )}
    </div>
  );
}
