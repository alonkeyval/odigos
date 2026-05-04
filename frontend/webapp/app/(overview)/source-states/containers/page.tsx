'use client';

import React from 'react';
import { DataCard } from '@odigos/ui-kit/components/v2';
import { StatusType, OtherStatusType, OtherStatus, DesiredStateProgress } from '@odigos/ui-kit/types';
import { getProgrammingLanguageIcon } from '@odigos/ui-kit/functions';

// ─── Helper ───────────────────────────────────────────────────────────────────

function mapStatus(status: string) {
  switch (status) {
    case DesiredStateProgress.Success:
      return StatusType.Success;
    case DesiredStateProgress.Error:
    case DesiredStateProgress.Failure:
      return StatusType.Error;
    case DesiredStateProgress.Notice:
      return StatusType.Warning;
    case DesiredStateProgress.Disabled:
    case DesiredStateProgress.Unsupported:
      return OtherStatusType.Disabled;
    default:
      return OtherStatusType.Unknown;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockContainer {
  containerName: string;
  language: string | null;
  runtimeVersion: string | null;
  isOverridden: boolean;
  agentEnabled: boolean;
  distro: string | null;
  agentStatus: { status: string; message: string; reasonEnum: string | null } | null;
  otherAgentName: string | null;
  headSampling: boolean;
  headersCollection: boolean;
  urlTemplatization: boolean;
  spanRenamer: boolean;
  payloadCollection: boolean;
  codeAttributes: boolean;
  waiting: { reason: string; message: string } | null;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

const SCENARIOS: { label: string; description: string; containers: MockContainer[] }[] = [
  {
    label: 'Fully Instrumented — All Features On',
    description: 'Agent enabled, distro detected, head sampling and several features configured.',
    containers: [
      {
        containerName: 'app',
        language: 'python',
        runtimeVersion: '3.11.4',
        isOverridden: false,
        agentEnabled: true,
        distro: 'python-community',
        agentStatus: { status: DesiredStateProgress.Success, message: 'agent injection enabled', reasonEnum: 'EnabledSuccessfully' },
        otherAgentName: null,
        headSampling: true,
        headersCollection: true,
        urlTemplatization: true,
        spanRenamer: false,
        payloadCollection: true,
        codeAttributes: false,
        waiting: null,
      },
    ],
  },
  {
    label: 'Agent Disabled — No Available Agent',
    description: 'Language detected but no instrumentation agent supports this runtime.',
    containers: [
      {
        containerName: 'nginx',
        language: 'nginx',
        runtimeVersion: null,
        isOverridden: false,
        agentEnabled: false,
        distro: null,
        agentStatus: { status: DesiredStateProgress.Disabled, message: 'support for nginx is coming soon, no instrumentation agent available at the moment', reasonEnum: 'NoAvailableAgent' },
        otherAgentName: null,
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: null,
      },
    ],
  },
  {
    label: 'Other Agent Detected — Conflict Warning',
    description: 'A third-party instrumentation agent (e.g. Datadog) was found running alongside Odigos.',
    containers: [
      {
        containerName: 'app',
        language: 'java',
        runtimeVersion: '17.0.8',
        isOverridden: false,
        agentEnabled: true,
        distro: 'java-community',
        agentStatus: { status: DesiredStateProgress.Success, message: 'agent injection enabled', reasonEnum: 'EnabledSuccessfully' },
        otherAgentName: 'datadog',
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: null,
      },
    ],
  },
  {
    label: 'Container Waiting — CrashLoopBackOff',
    description: 'Pod container is in a waiting state. Waiting reason and message are shown.',
    containers: [
      {
        containerName: 'app',
        language: 'go',
        runtimeVersion: '1.21.0',
        isOverridden: false,
        agentEnabled: true,
        distro: 'go-community',
        agentStatus: { status: DesiredStateProgress.Success, message: 'agent injection enabled', reasonEnum: 'EnabledSuccessfully' },
        otherAgentName: null,
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: { reason: 'CrashLoopBackOff', message: 'back-off 5m0s restarting failed container=app' },
      },
    ],
  },
  {
    label: 'Runtime Overridden',
    description: 'User manually overrode the auto-detected language or runtime version.',
    containers: [
      {
        containerName: 'app',
        language: 'nodejs',
        runtimeVersion: '20.0.0',
        isOverridden: true,
        agentEnabled: true,
        distro: 'nodejs-community',
        agentStatus: { status: DesiredStateProgress.Success, message: 'agent injection enabled', reasonEnum: 'EnabledSuccessfully' },
        otherAgentName: null,
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: null,
      },
    ],
  },
  {
    label: 'Agent Injection Error',
    description: 'Odigos attempted to inject the agent but encountered an error.',
    containers: [
      {
        containerName: 'app',
        language: 'python',
        runtimeVersion: '2.7.18',
        isOverridden: false,
        agentEnabled: false,
        distro: null,
        agentStatus: { status: DesiredStateProgress.Error, message: 'failed to inject agent — unsupported Python version', reasonEnum: 'UnsupportedRuntimeVersion' },
        otherAgentName: null,
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: null,
      },
    ],
  },
  {
    label: 'Language Not Detected',
    description: 'Runtime detection has not completed yet or no supported language was found.',
    containers: [
      {
        containerName: 'worker',
        language: null,
        runtimeVersion: null,
        isOverridden: false,
        agentEnabled: false,
        distro: null,
        agentStatus: null,
        otherAgentName: null,
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: null,
      },
    ],
  },
  {
    label: 'Multi-container — Mixed States',
    description: 'One container instrumented, one disabled (no agent), one with other agent conflict.',
    containers: [
      {
        containerName: 'app',
        language: 'dotnet',
        runtimeVersion: '8.0.0',
        isOverridden: false,
        agentEnabled: true,
        distro: 'dotnet-native-community',
        agentStatus: { status: DesiredStateProgress.Success, message: 'agent injection enabled', reasonEnum: 'EnabledSuccessfully' },
        otherAgentName: null,
        headSampling: true,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: true,
        waiting: null,
      },
      {
        containerName: 'nginx',
        language: 'nginx',
        runtimeVersion: null,
        isOverridden: false,
        agentEnabled: false,
        distro: null,
        agentStatus: { status: DesiredStateProgress.Disabled, message: 'support for nginx is coming soon, no instrumentation agent available at the moment', reasonEnum: 'NoAvailableAgent' },
        otherAgentName: null,
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: null,
      },
      {
        containerName: 'metrics-agent',
        language: 'java',
        runtimeVersion: '11.0.20',
        isOverridden: false,
        agentEnabled: true,
        distro: 'java-community',
        agentStatus: { status: DesiredStateProgress.Success, message: 'agent injection enabled', reasonEnum: 'EnabledSuccessfully' },
        otherAgentName: 'newrelic',
        headSampling: false,
        headersCollection: false,
        urlTemplatization: false,
        spanRenamer: false,
        payloadCollection: false,
        codeAttributes: false,
        waiting: null,
      },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContainersStatesPage() {
  const onBadge = { label: 'On', status: StatusType.Success };
  const offBadge = { label: 'Off', status: OtherStatusType.Disabled };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%', width: '100%' }}>
      <h2 style={{ margin: 0, color: '#fff' }}>Container States</h2>

      {SCENARIOS.map((scenario) => (
        <DataCard key={scenario.label} bgTint='1000' richTitle={{ title: scenario.label, subTitle: scenario.description, badge: { label: String(scenario.containers.length) } }}>
          {scenario.containers.map((container) => {
            const LangIcon = container.language ? getProgrammingLanguageIcon(container.language) : null;

            return (
              <DataCard
                key={container.containerName}
                bgTint='900'
                richTitle={{
                  icon: LangIcon ?? undefined,
                  title: container.containerName,
                  badge: container.agentEnabled ? { label: container.distro ?? 'Enabled', status: StatusType.Success } : { label: 'Disabled', status: StatusType.Error },
                }}
                withCollapse
                collapseIsDefaultOpen
              >
                {/* Other agent warning */}
                {container.otherAgentName && (
                  <DataCard
                    bgTint='800'
                    cellsPerRow={2}
                    items={[
                      { id: 'other-agent', title: 'Other Agent Detected', label: '', badge: { label: container.otherAgentName, status: StatusType.Warning } },
                      { id: 'other-agent-note', title: 'Note', label: 'Another instrumentation agent is running alongside Odigos' },
                    ]}
                  />
                )}

                {/* Language + runtime */}
                <DataCard
                  bgTint='800'
                  cellsPerRow={3}
                  items={[
                    { id: 'lang', title: 'Language', label: container.language ?? '—' },
                    { id: 'version', title: 'Runtime Version', label: container.runtimeVersion ?? '—' },
                  ]}
                />

                {/* Agent status */}
                {container.agentStatus && (
                  <DataCard
                    bgTint='800'
                    cellsPerRow={3}
                    items={[
                      {
                        id: 'agent-status',
                        title: 'Agent Status',
                        label: '',
                        badge: { label: container.agentStatus.message, status: mapStatus(container.agentStatus.status) },
                      },
                      ...(container.agentStatus.reasonEnum ? [{ id: 'reason', title: 'Reason', label: container.agentStatus.reasonEnum }] : []),
                      ...(container.distro ? [{ id: 'distro', title: 'Distro', label: container.distro }] : []),
                    ]}
                  />
                )}

                {/* Feature toggles */}
                <DataCard
                  bgTint='800'
                  cellsPerRow={3}
                  items={[
                    { id: 'head-sampling', title: 'Head Sampling', label: '', badge: container.headSampling ? onBadge : offBadge },
                    { id: 'headers', title: 'Headers Collection', label: '', badge: container.headersCollection ? onBadge : offBadge },
                    { id: 'url-templ', title: 'URL Templatization', label: '', badge: container.urlTemplatization ? onBadge : offBadge },
                    { id: 'span-renamer', title: 'Span Renamer', label: '', badge: container.spanRenamer ? onBadge : offBadge },
                    { id: 'payload', title: 'Payload Collection', label: '', badge: container.payloadCollection ? onBadge : offBadge },
                    { id: 'code-attrs', title: 'Code Attributes', label: '', badge: container.codeAttributes ? onBadge : offBadge },
                  ]}
                />

                {/* Waiting state */}
                {container.waiting && (
                  <DataCard
                    bgTint='800'
                    cellsPerRow={2}
                    items={[
                      { id: 'wait-reason', title: 'Waiting Reason', label: container.waiting.reason },
                      { id: 'wait-msg', title: 'Waiting Message', label: container.waiting.message },
                    ]}
                  />
                )}
              </DataCard>
            );
          })}
        </DataCard>
      ))}
    </div>
  );
}
