'use client';

import React from 'react';

/**
 * WorkloadStatusBanner
 * ---------------------
 * A small, dependency-free status banner that summarizes a single workload's state
 * and shows the user a clear end result (OK vs. Needs Attention), with an optional
 * expandable details section.
 *
 * Drop-in usage:
 *   <WorkloadStatusBanner workload={data?.describeWorkload?.[0]} />
 */

// --- Types (adapt these if your GraphQL codegen already exports them) ---
export type StatusTriplet = {
  status?: 'Success' | 'Unsupported' | 'Irrelevant' | 'Waiting' | string;
  reasonEnum?: string | null;
  message?: string | null;
};

export type ContainerStatus = {
  containerName: string;
  runtimeInfo?: { language?: string | null; runtimeVersion?: string | null; otherAgentName?: string | null } | null;
  agentEnabled?: {
    agentEnabled?: boolean;
    agentEnabledStatus?: StatusTriplet | null;
    logs?: unknown | null;
    metrics?: { enabled?: boolean } | null;
    traces?: { enabled?: boolean } | null;
    otelDistroName?: string | null;
  } | null;
};

export type Workload = {
  id: { namespace: string; kind: string; name: string };
  serviceName?: string | null;
  workloadOdigosHealthStatus?: StatusTriplet | null;
  markedForInstrumentation?: { markedForInstrumentation?: boolean; decisionEnum?: string; message?: string } | null;
  conditions?: {
    runtimeDetection?: StatusTriplet | null;
    agentInjectionEnabled?: StatusTriplet | null;
    agentInjected?: StatusTriplet | null;
    processesAgentHealth?: StatusTriplet | null;
    expectingTelemetry?: StatusTriplet | null;
    rollout?: StatusTriplet | null;
  } | null;
  agentEnabled?: {
    agentEnabled?: boolean;
    enabledStatus?: StatusTriplet | null;
  } | null;
  containers?: ContainerStatus[] | null;
  telemetryMetrics?: Array<{
    throughputBytes?: number | null;
    totalDataSentBytes?: number | null;
    expectingTelemetry?: { isExpectingTelemetry?: boolean | null } | null;
  }> | null;
};

export type WorkloadStatusBannerProps = {
  workload?: Workload | null;
  className?: string;
  /** Shows a small disclosure to reveal details */
  showDetailsToggle?: boolean;
};

// --- Visual helpers (minimal inline styles to avoid deps) ---
const styles = {
  wrap: (border: string, bg: string): React.CSSProperties => ({
    border: `1px solid ${border}`,
    background: bg,
    borderRadius: 12,
    padding: 12,
    display: 'grid',
    gap: 6,
  }),
  row: { display: 'flex', alignItems: 'center', gap: 8 } as React.CSSProperties,
  pill: (bg: string, color: string): React.CSSProperties => ({
    background: bg,
    color,
    borderRadius: 999,
    padding: '2px 8px',
    fontSize: 12,
    lineHeight: 1.6,
  }),
  title: { fontWeight: 600 } as React.CSSProperties,
  msg: { whiteSpace: 'pre-wrap' } as React.CSSProperties,
  small: { opacity: 0.8, fontSize: 12 } as React.CSSProperties,
  details: { marginTop: 4, paddingTop: 6, borderTop: '1px dashed rgba(0,0,0,0.12)' } as React.CSSProperties,
};

// --- Classification logic ---
function summarize(workload?: Workload | null) {
  if (!workload) {
    return {
      variant: 'info' as const,
      title: 'No data',
      message: 'This workload has no data yet.',
    };
  }

  const odigos = workload.workloadOdigosHealthStatus;
  const injEnabled = workload.conditions?.agentInjectionEnabled;
  const injPods = workload.conditions?.agentInjected;
  const agentEnabledStatus = workload.agentEnabled?.enabledStatus;

  const tm = workload.telemetryMetrics?.[0];
  const throughput = Number(tm?.throughputBytes ?? 0);
  const total = Number(tm?.totalDataSentBytes ?? 0);
  const expecting = tm?.expectingTelemetry?.isExpectingTelemetry;

  // Container-level unsupported reasons (e.g., nginx/postgres)
  const perContainerIssues = (workload.containers ?? [])
    .map((c) => ({
      name: c.containerName,
      status: c.agentEnabled?.agentEnabledStatus?.status,
      reason: c.agentEnabled?.agentEnabledStatus?.reasonEnum,
      message: c.agentEnabled?.agentEnabledStatus?.message,
      language: c.runtimeInfo?.language,
      distro: c.agentEnabled?.otelDistroName ?? undefined,
    }))
    .filter((c) => (c.status || '').toLowerCase() === 'unsupported');

  // 1) Hard errors / unsupported
  const unsupportedTriplet = [odigos, injEnabled, agentEnabledStatus].find((t) => (t?.status || '').toLowerCase() === 'unsupported') || null;

  if (unsupportedTriplet) {
    const message = unsupportedTriplet.message || 'Instrumentation unsupported for this workload.';
    return {
      variant: 'error' as const,
      title: 'Needs attention',
      message,
      details: perContainerIssues.length
        ? perContainerIssues.map((c) => `• ${c.name} (${c.language ?? 'unknown'}): ${c.reason ?? 'Unsupported'}${c.message ? ` – ${c.message}` : ''}`).join('\n')
        : undefined,
    };
  }

  // 2) Instrumented and sending data
  if ((odigos?.status === 'Success' || injPods?.status === 'Success') && (throughput > 0 || total > 0)) {
    return {
      variant: 'success' as const,
      title: 'All good',
      message: 'Instrumented and sending telemetry.',
    };
  }

  // 3) Instrumented but no data yet (expected to send)
  if ((odigos?.status === 'Success' || injPods?.status === 'Success') && expecting === true && throughput === 0) {
    return {
      variant: 'warning' as const,
      title: 'Waiting for telemetry',
      message: 'Agent is injected but no telemetry received yet. Generate traffic or verify destination configuration.',
    };
  }

  // 4) Not expected to send telemetry right now (e.g., cron idle)
  if (expecting === false) {
    return {
      variant: 'info' as const,
      title: 'Not expecting telemetry',
      message: 'This workload is not expected to emit data at the moment.',
    };
  }

  // 5) Default informational state
  return {
    variant: 'info' as const,
    title: 'Status unclear',
    message: odigos?.message || injEnabled?.message || 'Awaiting more signals…',
  };
}

function tone(variant: 'success' | 'warning' | 'error' | 'info') {
  switch (variant) {
    case 'success':
      return { border: '#16a34a', bg: '#ecfdf5', emoji: '✅' };
    case 'warning':
      return { border: '#ca8a04', bg: '#fffbeb', emoji: '⚠️' };
    case 'error':
      return { border: '#dc2626', bg: '#fef2f2', emoji: '❌' };
    default:
      return { border: '#2563eb', bg: '#eff6ff', emoji: 'ℹ️' };
  }
}

export default function WorkloadStatusBanner({ workload, className, showDetailsToggle = true }: WorkloadStatusBannerProps) {
  const summary = React.useMemo(() => summarize(workload), [workload]);
  const t = tone(summary.variant);
  console.log('workload', workload);
  const ns = workload?.id.namespace;
  const kind = workload?.id.kind;
  const name = workload?.id.name;

  const languagePills: Array<{ label: string; key: string }> = (workload?.containers ?? [])
    .map((c) => c.runtimeInfo?.language)
    .filter(Boolean)
    .map((lang, i) => ({ label: String(lang), key: `${lang}-${i}` }));

  const [open, setOpen] = React.useState(false);

  return (
    <div className={className} style={styles.wrap(t.border, t.bg)} role='status' aria-live='polite'>
      <div style={styles.row}>
        <span aria-hidden>{t.emoji}</span>
        <span style={styles.title}>{summary.title}</span>
        <span style={{ flex: 1 }} />
        {ns && (
          <span style={styles.pill('#e5e7eb', '#111827')} title='Namespace'>
            {ns}
          </span>
        )}
        {kind && (
          <span style={styles.pill('#e5e7eb', '#111827')} title='Kind'>
            {kind}
          </span>
        )}
        {name && (
          <span style={styles.pill('#e5e7eb', '#111827')} title='Name'>
            {name}
          </span>
        )}
        {languagePills.map((p) => (
          <span key={p.key} style={styles.pill('#ddd6fe', '#4c1d95')} title='Detected language'>
            {p.label}
          </span>
        ))}
      </div>

      {summary.message && <div style={styles.msg}>{summary.message}</div>}

      {summary.details && showDetailsToggle && (
        <div style={styles.details}>
          <button
            type='button'
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              color: '#2563eb',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {open ? 'Hide details' : 'Show details'}
          </button>
          {open && <pre style={{ marginTop: 6, fontSize: 12, whiteSpace: 'pre-wrap' }}>{summary.details}</pre>}
        </div>
      )}

      {/* tiny footer with bytes/throughput if present */}
      {(() => {
        const tm = workload?.telemetryMetrics?.[0];
        if (!tm) return null;
        const throughput = tm.throughputBytes ?? 0;
        const total = tm.totalDataSentBytes ?? 0;
        const expecting = tm.expectingTelemetry?.isExpectingTelemetry;
        return (
          <div style={styles.small}>
            {`telemetry: throughput=${throughput}B/s, total=${total}B`}
            {typeof expecting === 'boolean' ? `, expecting=${expecting}` : ''}
          </div>
        );
      })()}
    </div>
  );
}
