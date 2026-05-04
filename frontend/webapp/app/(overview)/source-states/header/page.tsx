'use client';

import React from 'react';
import { StatusCard, DataCard, Badge, Tag, Typography, TypographySize } from '@odigos/ui-kit/components/v2';
import { StatusType, OtherStatusType, OtherStatus } from '@odigos/ui-kit/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyStatus = StatusType | OtherStatusType | OtherStatus;

interface HeaderScenario {
  label: string;
  description: string;
  telemetry: { status: AnyStatus; message: string; throughput?: string; total?: string };
  health?: { status: AnyStatus; title: string; message: string };
  rollback?: boolean;
  rolloutCondition?: { status: AnyStatus; message: string };
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

const SCENARIOS: HeaderScenario[] = [
  {
    label: 'Healthy — Telemetry Flowing',
    description: 'Everything is working. Agent is injected, telemetry is flowing normally.',
    telemetry: { status: StatusType.Success, message: 'telemetry is flowing', throughput: '1.2 KB/s', total: '48 MB total' },
    health: { status: StatusType.Success, title: 'OdigosHealth', message: 'Workload is instrumented and healthy' },
  },
  {
    label: 'Expecting Telemetry — Not Yet Received',
    description: 'Agent injected, but no telemetry received yet. Waiting for first data.',
    telemetry: { status: OtherStatusType.Unknown, message: 'no telemetry data was recorded yet from this source' },
    health: { status: OtherStatusType.Unknown, title: 'OdigosHealth', message: 'Waiting for telemetry from instrumented workload' },
  },
  {
    label: 'Not Expecting Telemetry',
    description: 'Source is not configured to produce telemetry (e.g. not instrumented or pipeline not connected).',
    telemetry: { status: OtherStatusType.Disabled, message: 'not expecting telemetry' },
    health: { status: OtherStatusType.Disabled, title: 'OdigosHealth', message: 'No pipeline is configured to receive telemetry from this source' },
  },
  {
    label: 'Error — Agent Injection Failed',
    description: 'Agent could not be injected. Workload is running but not instrumented.',
    telemetry: { status: StatusType.Error, message: 'agent injection failed' },
    health: { status: StatusType.Error, title: 'OdigosHealth', message: 'Failed to inject the Odigos agent into the workload' },
  },
  {
    label: 'Warning — Another Agent Detected',
    description: 'A third-party instrumentation agent was detected alongside Odigos.',
    telemetry: { status: StatusType.Warning, message: 'conflict with existing agent' },
    health: { status: StatusType.Warning, title: 'OdigosHealth', message: 'Another instrumentation agent (datadog) is already running — conflicts may occur' },
  },
  {
    label: 'Rollback Occurred',
    description: 'Odigos detected a crash after instrumentation and automatically rolled back.',
    telemetry: { status: StatusType.Error, message: 'agent injection rolled back' },
    health: { status: StatusType.Error, title: 'OdigosHealth', message: 'Workload was rolled back after instrumentation caused a crash' },
    rollback: true,
  },
  {
    label: 'Rollout In Progress',
    description: 'The workload is being updated with the new agent. Pods are restarting.',
    telemetry: { status: OtherStatus.Loading, message: 'waiting for rollout to complete' },
    health: { status: OtherStatus.Loading, title: 'OdigosHealth', message: 'Rollout in progress — pods are being restarted with the new agent' },
    rolloutCondition: { status: OtherStatus.Loading, message: 'Rollout in progress — 3/5 pods updated' },
  },
  {
    label: 'Disabled',
    description: 'Instrumentation is explicitly disabled for this source.',
    telemetry: { status: OtherStatusType.Disabled, message: 'instrumentation disabled' },
    health: { status: OtherStatusType.Disabled, title: 'OdigosHealth', message: 'Instrumentation is disabled for this workload' },
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HeaderStatesPage() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%', width: '100%' }}>
      <h2 style={{ margin: 0, color: '#fff' }}>Header States</h2>

      {SCENARIOS.map((scenario) => (
        <DataCard key={scenario.label} bgTint='1000' richTitle={{ title: scenario.label, subTitle: scenario.description }}>
          {/* Header row — mirrors the layout in source/page.tsx */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Left: identity + telemetry badge */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Typography size={TypographySize.XL} weight={700}>frontend</Typography>
              <Typography size={TypographySize.S}>default · Deployment · frontend</Typography>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <Badge label={scenario.telemetry.message} status={scenario.telemetry.status} />
                {scenario.telemetry.throughput && <Tag label={scenario.telemetry.throughput} />}
                {scenario.telemetry.total && <Tag label={scenario.telemetry.total} />}
              </div>
            </div>

            {/* Right: status cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 340 }}>
              {scenario.rollback && (
                <StatusCard
                  status={StatusType.Error}
                  title='Rollback Occurred'
                  description='Odigos detected a crash caused by instrumentation and rolled it back automatically.'
                />
              )}
              {scenario.health && (
                <StatusCard
                  status={scenario.health.status}
                  title={scenario.health.title}
                  description={scenario.health.message}
                />
              )}
              {scenario.rolloutCondition && (
                <StatusCard
                  status={scenario.rolloutCondition.status}
                  title='Rollout'
                  description={scenario.rolloutCondition.message}
                />
              )}
            </div>
          </div>
        </DataCard>
      ))}
    </div>
  );
}
