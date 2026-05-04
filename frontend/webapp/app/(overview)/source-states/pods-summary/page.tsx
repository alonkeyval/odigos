'use client';

import React from 'react';
import { StatusCard, DataCard } from '@odigos/ui-kit/components/v2';
import { StatusType, OtherStatusType, OtherStatus } from '@odigos/ui-kit/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnyStatus = StatusType | OtherStatusType | OtherStatus;

interface HealthGroup { count: number; msg: string; status: AnyStatus }
interface PodsSummaryScenario {
  label: string;
  description: string;
  totalPods: number;
  injectedCount: number;
  healthGroups: HealthGroup[];
  podsHealth?: { status: AnyStatus; message: string };
  processesHealth?: { status: AnyStatus; message: string };
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

const SCENARIOS: PodsSummaryScenario[] = [
  {
    label: 'All Healthy — Fully Injected',
    description: 'All pods are running, agent injected in all, processes healthy.',
    totalPods: 3,
    injectedCount: 3,
    healthGroups: [{ count: 3, msg: 'all containers in pod are reported healthy in kubernetes', status: StatusType.Success }],
    podsHealth: { status: StatusType.Success, message: 'all pods are healthy' },
    processesHealth: { status: StatusType.Success, message: 'all processes are reporting healthy status' },
  },
  {
    label: 'Partial Injection — Rollout In Progress',
    description: 'Some pods already have the agent injected, others are still being updated.',
    totalPods: 5,
    injectedCount: 2,
    healthGroups: [
      { count: 2, msg: 'all containers in pod are reported healthy in kubernetes', status: StatusType.Success },
      { count: 3, msg: 'some containers in pod are not started yet', status: OtherStatusType.Unknown },
    ],
    podsHealth: { status: OtherStatus.Loading, message: 'rollout in progress — waiting for all pods to be updated' },
    processesHealth: { status: OtherStatus.Loading, message: 'waiting for processes to start after rollout' },
  },
  {
    label: 'No Injection — Agent Not Deployed',
    description: 'Pods are running but no agent has been injected into any of them.',
    totalPods: 3,
    injectedCount: 0,
    healthGroups: [{ count: 3, msg: 'all containers in pod are reported healthy in kubernetes', status: StatusType.Success }],
    podsHealth: { status: StatusType.Error, message: 'agent is not injected into any pod' },
    processesHealth: { status: OtherStatusType.Disabled, message: 'agents used in this workload does not support health status reporting' },
  },
  {
    label: 'Pods Crashing — CrashLoopBackOff',
    description: 'One or more pods are in CrashLoopBackOff, likely caused by instrumentation.',
    totalPods: 3,
    injectedCount: 3,
    healthGroups: [
      { count: 2, msg: 'all containers in pod are reported healthy in kubernetes', status: StatusType.Success },
      { count: 1, msg: 'some containers in pod are not started yet', status: StatusType.Error },
    ],
    podsHealth: { status: StatusType.Error, message: 'some containers in this workload\'s pods are not started yet' },
    processesHealth: { status: StatusType.Error, message: 'one or more processes are in an unhealthy state' },
  },
  {
    label: 'Warning — Partial Health Issue',
    description: 'Most pods are healthy, but some have a non-critical health warning.',
    totalPods: 4,
    injectedCount: 4,
    healthGroups: [
      { count: 3, msg: 'all containers in pod are reported healthy in kubernetes', status: StatusType.Success },
      { count: 1, msg: 'pod has a non-critical warning', status: StatusType.Warning },
    ],
    podsHealth: { status: StatusType.Warning, message: 'one pod has a non-critical health warning' },
    processesHealth: { status: StatusType.Success, message: 'all processes are reporting healthy status' },
  },
  {
    label: 'Processes Health Not Supported',
    description: 'Agent injected and pods healthy, but the runtime does not support process health reporting.',
    totalPods: 2,
    injectedCount: 2,
    healthGroups: [{ count: 2, msg: 'all containers in pod are reported healthy in kubernetes', status: StatusType.Success }],
    podsHealth: { status: StatusType.Success, message: 'all pods are healthy' },
    processesHealth: { status: OtherStatusType.Disabled, message: 'agents used in this workload does not support health status reporting' },
  },
  {
    label: 'No Pods',
    description: 'Workload exists but has zero running pods (scaled to 0 or not yet scheduled).',
    totalPods: 0,
    injectedCount: 0,
    healthGroups: [],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function injectedBadgeStatus(injected: number, total: number): AnyStatus {
  if (total === 0) return OtherStatusType.Disabled;
  if (injected === total) return StatusType.Success;
  if (injected === 0) return StatusType.Error;
  return StatusType.Warning;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PodsSummaryStatesPage() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%', width: '100%' }}>
      <h2 style={{ margin: 0, color: '#fff' }}>Pods Summary States</h2>

      {SCENARIOS.map((scenario) => (
        <DataCard key={scenario.label} bgTint='1000' richTitle={{ title: scenario.label, subTitle: scenario.description, badge: { label: String(scenario.totalPods) } }}>

          {scenario.totalPods === 0 ? (
            <DataCard bgTint='900' cellsPerRow={1} items={[{ id: 'empty', title: 'Total Pods', label: '0' }]} />
          ) : (
            <>
              {/* Counts row */}
              <DataCard
                bgTint='900'
                cellsPerRow={2}
                items={[
                  { id: 'total', title: 'Total Pods', label: String(scenario.totalPods) },
                  {
                    id: 'injected',
                    title: 'Agent Injected',
                    label: '',
                    badge: {
                      label: `${scenario.injectedCount} / ${scenario.totalPods}`,
                      status: injectedBadgeStatus(scenario.injectedCount, scenario.totalPods),
                    },
                  },
                ]}
              />

              {/* Health breakdown */}
              {scenario.healthGroups.length > 0 && (
                <DataCard
                  bgTint='900'
                  cellsPerRow={scenario.healthGroups.length}
                  items={scenario.healthGroups.map((g, i) => ({
                    id: String(i),
                    title: 'Health',
                    label: '',
                    badge: { label: `${g.count} ${g.msg}`, status: g.status },
                  }))}
                />
              )}

              {/* Pods health status card */}
              {scenario.podsHealth && (
                <StatusCard status={scenario.podsHealth.status} title='Pods Health' description={scenario.podsHealth.message} />
              )}

              {/* Processes health status card */}
              {scenario.processesHealth && (
                <StatusCard status={scenario.processesHealth.status} title='Processes Health' description={scenario.processesHealth.message} />
              )}
            </>
          )}

        </DataCard>
      ))}
    </div>
  );
}
