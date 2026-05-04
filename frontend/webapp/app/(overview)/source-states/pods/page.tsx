'use client';

import React from 'react';
import { DataCard } from '@odigos/ui-kit/components/v2';
import { StatusType, OtherStatusType, OtherStatus, DesiredStateProgress } from '@odigos/ui-kit/types';

// ─── Types (mirrors source/page.tsx) ──────────────────────────────────────────

interface MockInstrumentation { name: string; isStandardLibrary: boolean }
interface MockProcess {
  healthy: boolean;
  healthStatus: { status: string; message: string };
  identifyingAttributes: { name: string; value: string }[];
  instrumentations: MockInstrumentation[];
}
interface MockContainer {
  containerName: string;
  otelDistroName: string | null;
  restartCount: number;
  runningStartedTime: string | null;
  waitingReasonEnum: string | null;
  waitingMessage: string | null;
  started: boolean;
  ready: boolean;
  isCrashLoop: boolean;
  healthStatus: { status: string; message: string };
  processes: MockProcess[];
}
interface MockPod {
  podName: string;
  nodeName: string;
  startTime: string;
  agentInjected: boolean;
  agentInjectedStatus: { status: string; message: string };
  podHealthStatus: { status: string; message: string };
  containers: MockContainer[];
}

// ─── Helper (mirrors mapToStatusCardStatus in source/page.tsx) ────────────────

function mapStatus(status: string) {
  switch (status) {
    case DesiredStateProgress.Success: return StatusType.Success;
    case DesiredStateProgress.Error:
    case DesiredStateProgress.Failure: return StatusType.Error;
    case DesiredStateProgress.Notice: return StatusType.Warning;
    case DesiredStateProgress.Disabled:
    case DesiredStateProgress.Unsupported: return OtherStatusType.Disabled;
    default: return OtherStatusType.Unknown;
  }
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const NAMESPACE = 'default';

const MOCK_PODS: MockPod[] = [
  // ── Pod 1: Fully Healthy ────────────────────────────────────────────────────
  {
    podName: 'frontend-7d9f8b-xk2pq',
    nodeName: 'node-1.us-east-1',
    startTime: '2026-05-04T08:00:00Z',
    agentInjected: true,
    agentInjectedStatus: { status: DesiredStateProgress.Success, message: 'Injected' },
    podHealthStatus: { status: DesiredStateProgress.Success, message: 'all containers healthy' },
    containers: [
      {
        containerName: 'app',
        otelDistroName: 'dotnet-native-community',
        restartCount: 0,
        runningStartedTime: '2026-05-04T08:00:12Z',
        waitingReasonEnum: null,
        waitingMessage: null,
        started: true,
        ready: true,
        isCrashLoop: false,
        healthStatus: { status: DesiredStateProgress.Success, message: 'all containers in pod are reported healthy in kubernetes' },
        processes: [
          {
            healthy: true,
            healthStatus: { status: DesiredStateProgress.Success, message: 'Healthy' },
            identifyingAttributes: [{ name: 'process.pid', value: '1842' }],
            instrumentations: [
              { name: 'HttpClient', isStandardLibrary: true },
              { name: 'AspNetCore', isStandardLibrary: true },
              { name: 'custom-tracer', isStandardLibrary: false },
            ],
          },
          {
            healthy: true,
            healthStatus: { status: DesiredStateProgress.Success, message: 'Healthy' },
            identifyingAttributes: [{ name: 'process.pid', value: '1901' }],
            instrumentations: [
              { name: 'SqlClient', isStandardLibrary: true },
            ],
          },
        ],
      },
    ],
  },

  // ── Pod 2: CrashLoop Container ──────────────────────────────────────────────
  {
    podName: 'frontend-7d9f8b-m3nrw',
    nodeName: 'node-2.us-east-1',
    startTime: '2026-05-04T08:01:00Z',
    agentInjected: true,
    agentInjectedStatus: { status: DesiredStateProgress.Success, message: 'Injected' },
    podHealthStatus: { status: DesiredStateProgress.Error, message: 'some containers in pod are not started yet' },
    containers: [
      {
        containerName: 'app',
        otelDistroName: 'dotnet-native-community',
        restartCount: 7,
        runningStartedTime: null,
        waitingReasonEnum: 'CrashLoopBackOff',
        waitingMessage: 'back-off 5m0s restarting failed container=app pod=frontend-7d9f8b-m3nrw',
        started: false,
        ready: false,
        isCrashLoop: true,
        healthStatus: { status: DesiredStateProgress.Error, message: 'CrashLoopBackOff — container keeps restarting' },
        processes: [],
      },
    ],
  },

  // ── Pod 3: Injection In Progress (Waiting) ───────────────────────────────────
  {
    podName: 'frontend-7d9f8b-p7tls',
    nodeName: 'node-1.us-east-1',
    startTime: '2026-05-04T08:02:00Z',
    agentInjected: false,
    agentInjectedStatus: { status: '', message: 'Waiting for injection' },
    podHealthStatus: { status: '', message: 'pod is initializing' },
    containers: [
      {
        containerName: 'app',
        otelDistroName: null,
        restartCount: 0,
        runningStartedTime: null,
        waitingReasonEnum: 'PodInitializing',
        waitingMessage: 'waiting for init containers to complete',
        started: false,
        ready: false,
        isCrashLoop: false,
        healthStatus: { status: '', message: 'pod is initializing' },
        processes: [],
      },
    ],
  },

  // ── Pod 4: Agent Injection Failed ────────────────────────────────────────────
  {
    podName: 'frontend-7d9f8b-q9vzx',
    nodeName: 'node-3.us-east-1',
    startTime: '2026-05-04T08:03:00Z',
    agentInjected: false,
    agentInjectedStatus: { status: DesiredStateProgress.Error, message: 'Injection failed — unsupported runtime version' },
    podHealthStatus: { status: DesiredStateProgress.Success, message: 'all containers in pod are reported healthy in kubernetes' },
    containers: [
      {
        containerName: 'app',
        otelDistroName: null,
        restartCount: 0,
        runningStartedTime: '2026-05-04T08:03:10Z',
        waitingReasonEnum: null,
        waitingMessage: null,
        started: true,
        ready: true,
        isCrashLoop: false,
        healthStatus: { status: DesiredStateProgress.Success, message: 'all containers in pod are reported healthy in kubernetes' },
        processes: [
          {
            healthy: false,
            healthStatus: { status: DesiredStateProgress.Error, message: 'agent could not attach to process — unsupported runtime version' },
            identifyingAttributes: [{ name: 'process.pid', value: '2204' }],
            instrumentations: [],
          },
        ],
      },
    ],
  },

  // ── Pod 5: Multi-container, Mixed Health ────────────────────────────────────
  {
    podName: 'frontend-7d9f8b-r2kbn',
    nodeName: 'node-2.us-east-1',
    startTime: '2026-05-04T08:04:00Z',
    agentInjected: true,
    agentInjectedStatus: { status: DesiredStateProgress.Notice, message: 'Partially injected' },
    podHealthStatus: { status: DesiredStateProgress.Notice, message: 'one container is not ready yet' },
    containers: [
      {
        containerName: 'app',
        otelDistroName: 'nodejs-community',
        restartCount: 0,
        runningStartedTime: '2026-05-04T08:04:08Z',
        waitingReasonEnum: null,
        waitingMessage: null,
        started: true,
        ready: true,
        isCrashLoop: false,
        healthStatus: { status: DesiredStateProgress.Success, message: 'all containers in pod are reported healthy in kubernetes' },
        processes: [
          {
            healthy: true,
            healthStatus: { status: DesiredStateProgress.Success, message: 'Healthy' },
            identifyingAttributes: [{ name: 'process.pid', value: '3310' }],
            instrumentations: [
              { name: 'http', isStandardLibrary: true },
              { name: 'express', isStandardLibrary: true },
              { name: 'pg', isStandardLibrary: false },
            ],
          },
          {
            healthy: true,
            healthStatus: { status: DesiredStateProgress.Success, message: 'Healthy' },
            identifyingAttributes: [{ name: 'process.pid', value: '3411' }],
            instrumentations: [
              { name: 'grpc', isStandardLibrary: true },
            ],
          },
        ],
      },
      {
        containerName: 'sidecar',
        otelDistroName: null,
        restartCount: 1,
        runningStartedTime: null,
        waitingReasonEnum: 'ContainerCreating',
        waitingMessage: 'container image is being pulled',
        started: false,
        ready: false,
        isCrashLoop: false,
        healthStatus: { status: DesiredStateProgress.Notice, message: 'sidecar container is not ready yet' },
        processes: [],
      },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PodsStatesPage() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%', width: '100%' }}>
      <h2 style={{ margin: 0, color: '#fff' }}>Pods Tab States</h2>

      <DataCard bgTint='1000' richTitle={{ title: 'Pods', badge: { label: String(MOCK_PODS.length) } }}>
        {MOCK_PODS.map((pod) => {
          const podInjectionStatus = mapStatus(pod.agentInjectedStatus.status);
          const podHealthSt = mapStatus(pod.podHealthStatus.status);
          const podHasIssue = podInjectionStatus === StatusType.Error || podInjectionStatus === StatusType.Warning
            || podHealthSt === StatusType.Error || podHealthSt === StatusType.Warning;

          return (
            <DataCard
              key={pod.podName}
              bgTint='900'
              richTitle={{
                title: pod.podName,
                subTitle: pod.nodeName,
                badge: { label: pod.agentInjectedStatus.message || (pod.agentInjected ? 'Injected' : 'Not Injected'), status: podInjectionStatus },
              }}
              withCollapse
              collapseIsDefaultOpen={podHasIssue}
            >
              <DataCard
                bgTint='800'
                cellsPerRow={2}
                items={[
                  { id: 'node', title: 'Node', label: pod.nodeName },
                  { id: 'start', title: 'Start Time', label: pod.startTime || '—' },
                ]}
              />

              <DataCard bgTint='800' richTitle={{ title: 'Debug Commands' }} withCollapse collapseIsDefaultOpen={false}>
                <DataCard
                  bgTint='750'
                  cellsPerRow={1}
                  items={[
                    { id: 'get-pod', title: 'Get Pod', label: `kubectl get pod ${pod.podName} -n ${NAMESPACE}`, withCopy: true },
                    { id: 'get-pod-yaml', title: 'Get Pod YAML', label: `kubectl get pod ${pod.podName} -n ${NAMESPACE} -o yaml`, withCopy: true },
                    { id: 'describe-pod', title: 'Describe Pod', label: `kubectl describe pod ${pod.podName} -n ${NAMESPACE}`, withCopy: true },
                    { id: 'logs-pod', title: 'Pod Logs', label: `kubectl logs ${pod.podName} -n ${NAMESPACE}`, withCopy: true },
                    { id: 'logs-pod-prev', title: 'Pod Logs (previous)', label: `kubectl logs ${pod.podName} -n ${NAMESPACE} --previous`, withCopy: true },
                  ]}
                />
              </DataCard>

              {pod.containers.map((podContainer) => {
                const containerHealthStatus = mapStatus(podContainer.healthStatus.status);
                const containerHasIssue = containerHealthStatus === StatusType.Error || containerHealthStatus === StatusType.Warning || podContainer.isCrashLoop;

                return (
                  <DataCard
                    key={podContainer.containerName}
                    bgTint='800'
                    richTitle={{
                      title: podContainer.containerName,
                      badge: { label: podContainer.healthStatus.message || podContainer.healthStatus.status, status: containerHealthStatus },
                    }}
                    withCollapse
                    collapseIsDefaultOpen={containerHasIssue}
                  >
                    <DataCard bgTint='750' cellsPerRow={1} items={[{ id: 'distro', title: 'OTel Distro', label: podContainer.otelDistroName || '—' }]} />

                    <DataCard
                      bgTint='750'
                      cellsPerRow={4}
                      items={[
                        { id: 'started', title: 'Started', label: '', badge: podContainer.started ? { label: 'Yes', status: StatusType.Success } : { label: 'No', status: StatusType.Error } },
                        { id: 'ready', title: 'Ready', label: '', badge: podContainer.ready ? { label: 'Yes', status: StatusType.Success } : { label: 'No', status: StatusType.Error } },
                        { id: 'crash', title: 'Crash Loop', label: '', badge: podContainer.isCrashLoop ? { label: 'Yes', status: StatusType.Error } : { label: 'No', status: StatusType.Success } },
                        { id: 'restarts', title: 'Restarts', label: String(podContainer.restartCount) },
                      ]}
                    />

                    {(podContainer.runningStartedTime || podContainer.waitingReasonEnum || podContainer.waitingMessage) && (
                      <DataCard
                        bgTint='750'
                        cellsPerRow={2}
                        items={[
                          ...(podContainer.runningStartedTime ? [{ id: 'run-start', title: 'Running Since', label: podContainer.runningStartedTime }] : []),
                          ...(podContainer.waitingReasonEnum ? [{ id: 'wait-reason', title: 'Waiting Reason', label: podContainer.waitingReasonEnum }] : []),
                          ...(podContainer.waitingMessage ? [{ id: 'wait-msg', title: 'Waiting Message', label: podContainer.waitingMessage }] : []),
                        ]}
                      />
                    )}

                    {podContainer.processes.map((process, pi) => {
                      const pid = process.identifyingAttributes.find((a) => a.name === 'process.pid')?.value;
                      const processLabel = pid ? `pid ${pid}` : `Process ${pi + 1}`;
                      const processStatus = mapStatus(process.healthStatus.status);
                      const processHasIssue = !process.healthy || processStatus === StatusType.Error || processStatus === StatusType.Warning;
                      const libCount = process.instrumentations.length;

                      return (
                        <DataCard
                          key={pi}
                          bgTint='700'
                          richTitle={{
                            title: processLabel,
                            subTitle: libCount > 0 ? `${libCount} lib${libCount !== 1 ? 's' : ''}` : undefined,
                            badge: { label: process.healthStatus.message || (process.healthy ? 'Healthy' : 'Unhealthy'), status: processStatus },
                          }}
                          withCollapse
                          collapseIsDefaultOpen={processHasIssue}
                        >
                          {process.instrumentations.map((lib) => (
                            <DataCard
                              key={lib.name}
                              bgTint='600'
                              cellsPerRow={3}
                              items={[
                                { id: 'lib', title: 'Name', label: lib.name },
                                {
                                  id: 'std',
                                  title: 'Type',
                                  label: '',
                                  badge: lib.isStandardLibrary
                                    ? { label: 'Standard Library', status: StatusType.Info }
                                    : { label: 'User Library', status: OtherStatusType.Unknown },
                                },
                                { id: 'err', title: 'Error', label: '—' },
                              ]}
                            />
                          ))}
                        </DataCard>
                      );
                    })}
                  </DataCard>
                );
              })}
            </DataCard>
          );
        })}
      </DataCard>
    </div>
  );
}
