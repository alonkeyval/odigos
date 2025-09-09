'use client';

import React from 'react';
import { FlexColumn, Status } from '@odigos/ui-kit/components';
import { StatusType } from '@odigos/ui-kit/types';
import styled from 'styled-components';

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

// --- Styled components ---
const Wrapper = styled(FlexColumn)<{ $border: string }>`
  border: 1px solid ${(p) => p.$border};
  border-radius: 12px;
  padding: 12px;
  gap: 8px;
  background: #ffffff;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Details = styled.div`
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed rgba(0, 0, 0, 0.12);
`;

const SmallFooter = styled.div`
  opacity: 0.8;
  font-size: 12px;
  font-family: ${({ theme }) => theme.font_family.primary};
`;

const ToggleButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
`;

// --- Classification logic ---
function summarize(workload?: Workload | null) {
  if (!workload) {
    return {
      variant: 'info' as const,
      status: StatusType.Info,
      title: 'No data',
      subtitle: 'This workload has no data yet.',
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
      status: StatusType.Error,
      title: 'Needs attention',
      subtitle: message,
      details: perContainerIssues.length
        ? perContainerIssues.map((c) => `• ${c.name} (${c.language ?? 'unknown'}): ${c.reason ?? 'Unsupported'}${c.message ? ` – ${c.message}` : ''}`).join('\n')
        : undefined,
    };
  }

  // 2) Instrumented and sending data
  if ((odigos?.status === 'Success' || injPods?.status === 'Success') && (throughput > 0 || total > 0)) {
    return {
      variant: 'success' as const,
      status: StatusType.Success,
      title: 'All good',
      subtitle: 'Instrumented and sending telemetry.',
    };
  }

  // 3) Instrumented but no data yet (expected to send)
  if ((odigos?.status === 'Success' || injPods?.status === 'Success') && expecting === true && throughput === 0) {
    return {
      variant: 'warning' as const,
      status: StatusType.Warning,
      title: 'Waiting for telemetry',
      subtitle: 'Agent is injected but no telemetry received yet. Generate traffic or verify destination configuration.',
    };
  }

  // 4) Not expected to send telemetry right now (e.g., cron idle)
  if (expecting === false) {
    return {
      variant: 'info' as const,
      status: StatusType.Info,
      title: 'Not expecting telemetry',
      subtitle: 'This workload is not expected to emit data at the moment.',
    };
  }

  // 5) Default informational state
  return {
    variant: 'info' as const,
    status: StatusType.Info,
    title: 'Status unclear',
    subtitle: odigos?.message || injEnabled?.message || 'Awaiting more signals…',
  };
}

function tone(variant: 'success' | 'warning' | 'error' | 'info') {
  switch (variant) {
    case 'success':
      return { border: '#16a34a' };
    case 'warning':
      return { border: '#ca8a04' };
    case 'error':
      return { border: '#dc2626' };
    default:
      return { border: '#2563eb' };
  }
}

export default function WorkloadStatusBanner({ workload, className, showDetailsToggle = true }: WorkloadStatusBannerProps) {
  const summary = React.useMemo(() => summarize(workload), [workload]);
  const t = tone(summary.variant);
  const ns = workload?.id.namespace;
  const kind = workload?.id.kind;
  const name = workload?.id.name;

  const languagePills: Array<{ label: string; key: string }> = (workload?.containers ?? [])
    .map((c) => c.runtimeInfo?.language)
    .filter(Boolean)
    .map((lang, i) => ({ label: String(lang), key: `${lang}-${i}` }));

  const [open, setOpen] = React.useState(false);

  return (
    <Wrapper className={className} $border={t.border} role='status' aria-live='polite'>
      <Row>
        <Status status={summary.status} title={summary.title} subtitle={summary.subtitle} withIcon withBackground />
        <span style={{ flex: 1 }} />
      </Row>

      {summary.details && showDetailsToggle && (
        <Details>
          <ToggleButton type='button' onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? 'Hide details' : 'Show details'}
          </ToggleButton>
          {open && <pre style={{ marginTop: 6, fontSize: 12, whiteSpace: 'pre-wrap' }}>{summary.details}</pre>}
        </Details>
      )}

      {(() => {
        const tm = workload?.telemetryMetrics?.[0];
        if (!tm) return null;
        const throughput = tm.throughputBytes ?? 0;
        const total = tm.totalDataSentBytes ?? 0;
        const expecting = tm.expectingTelemetry?.isExpectingTelemetry;
        return (
          <SmallFooter>
            {`telemetry: throughput=${throughput}B/s, total=${total}B`}
            {typeof expecting === 'boolean' ? `, expecting=${expecting}` : ''}
          </SmallFooter>
        );
      })()}
    </Wrapper>
  );
}
