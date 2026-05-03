'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLazyQuery } from '@apollo/client';
import { useSourceCRUD } from '@/hooks';
import { GET_SOURCE_TREE } from '@/graphql/queries';
import { StatusCard, DataCard, Badge, Tag, Typography, TypographySize, NoData } from '@odigos/ui-kit/components/v2';
import { getContainersIcons, getProgrammingLanguageIcon } from '@odigos/ui-kit/functions';
import { type Source, K8sResourceKind, StatusType, OtherStatusType, OtherStatus, DesiredStateProgress } from '@odigos/ui-kit/types';

// ─── Local types for the tree query response ─────────────────────────────────

interface TreeInstrumentation {
  name: string;
  isStandardLibrary?: boolean | null;
}

interface TreeProcess {
  healthy?: boolean | null;
  healthStatus: { status: string; message: string };
  identifyingAttributes: { name: string; value: string }[];
  instrumentations?: TreeInstrumentation[] | null;
}

interface TreePodContainer {
  containerName: string;
  started?: boolean | null;
  ready?: boolean | null;
  isCrashLoop?: boolean | null;
  healthStatus: { status: string; message: string };
  processes: TreeProcess[];
}

interface TreePod {
  podName: string;
  agentInjected: boolean;
  agentInjectedStatus: { status: string; message: string };
  podHealthStatus: { status: string; message: string };
  containers: TreePodContainer[];
}

interface TreeContainer {
  containerName: string;
  instrumentations?: TreeInstrumentation[] | null;
}

interface TreeTelemetryMetrics {
  totalDataSentBytes?: number | null;
  throughputBytes?: number | null;
  expectingTelemetry: {
    isExpectingTelemetry?: boolean | null;
    telemetryObservedStatus: { status: string; message: string };
  };
}

interface SourceTreeWorkload {
  telemetryMetrics: TreeTelemetryMetrics[];
  containers: TreeContainer[];
  pods: TreePod[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes?: number | null): string {
  if (bytes == null) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function mapToStatusCardStatus(status?: string | null): StatusType | OtherStatusType {
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

function mapConditionStatus(status: StatusType | OtherStatus): StatusType | OtherStatusType {
  if (status === OtherStatus.Loading) return OtherStatusType.Unknown;
  return status as StatusType | OtherStatusType;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SourceDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const namespace = searchParams.get('namespace') ?? '';
  const kind = (searchParams.get('kind') ?? '') as K8sResourceKind;
  const name = searchParams.get('name') ?? '';

  const { fetchSourceById } = useSourceCRUD();
  const [fetchTree] = useLazyQuery<{ workloads: SourceTreeWorkload[] }>(GET_SOURCE_TREE);

  const [source, setSource] = useState<Source | null>(null);
  const [tree, setTree] = useState<SourceTreeWorkload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!namespace || !kind || !name) return;
    setIsLoading(true);

    fetchSourceById({ namespace, kind, name }).then((src) => {
      if (src) setSource(src);
      setIsLoading(false);
    });

    fetchTree({ variables: { filter: { namespace, kind, name } } }).then((res) => {
      const workload = res.data?.workloads?.[0];
      if (workload) setTree(workload);
    });
  }, [namespace, kind, name]);

  if (isLoading) {
    return (
      <div style={{ padding: '24px' }}>
        <Typography size={TypographySize.S}>Loading...</Typography>
      </div>
    );
  }

  if (!source) {
    return (
      <div style={{ padding: '24px' }}>
        <NoData title='Source not found' subTitle={`${namespace} / ${kind} / ${name}`} />
      </div>
    );
  }

  const containerIcons = getContainersIcons(source.containers);
  const runtimeCondition = source.conditions?.find((c) => c.type === 'RuntimeDetection');
  const agentCondition = source.conditions?.find((c) => c.type === 'AgentInjectionEnabled');
  const rolloutCondition = source.conditions?.find((c) => c.type === 'Rollout');

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', height: '100%', width: '100%' }}>
      {/* Back */}
      <button onClick={() => router.back()} style={{ alignSelf: 'flex-start', cursor: 'pointer', background: 'none', border: 'none' }}>
        <Typography size={TypographySize.S}>← Back</Typography>
      </button>

      {/* ── Section 1: Identity + Health ── */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {containerIcons.map((Icon, i) => (
              <Icon key={i} size={32} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Typography size={TypographySize.XL} weight={700}>
                {source.otelServiceName || source.name}
              </Typography>
              <Typography size={TypographySize.S}>
                {source.namespace} · {source.kind} · {source.name}
              </Typography>
              {source.otelServiceName && source.otelServiceName !== source.name && <Typography size={TypographySize.XS}>OTel Service Name: {source.otelServiceName}</Typography>}
            </div>

            {/* Telemetry metrics (available once tree loads) */}
            {tree &&
              tree.telemetryMetrics.length > 0 &&
              (() => {
                const m = tree.telemetryMetrics[0];
                const throughput = m.throughputBytes;
                const total = m.totalDataSentBytes;
                const obsStatus = mapToStatusCardStatus(m.expectingTelemetry.telemetryObservedStatus.status);
                const obsMessage = m.expectingTelemetry.telemetryObservedStatus.message;

                return (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge label={obsMessage || 'Telemetry'} status={obsStatus} />
                    {throughput != null && <Tag label={`${formatBytes(throughput)}/s`} />}
                    {total != null && <Tag label={`${formatBytes(total)} total`} />}
                  </div>
                );
              })()}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {source.rollbackOccurred && (
            <StatusCard
              status={StatusType.Error}
              title='Rollback Occurred'
              description='Odigos detected a crash caused by instrumentation and rolled it back automatically.'
            />
          )}
          {source.workloadOdigosHealthStatus && (
            <StatusCard
              status={mapToStatusCardStatus(source.workloadOdigosHealthStatus.status)}
              title={source.workloadOdigosHealthStatus.name ?? 'Odigos Health'}
              description={source.workloadOdigosHealthStatus.message}
            />
          )}
          {rolloutCondition && (
            <StatusCard
              status={mapConditionStatus(rolloutCondition.status)}
              title={rolloutCondition.type}
              description={rolloutCondition.message ?? ''}
            />
          )}
        </div>
      </div>

      {/* ── Section 2: Runtime Info (workload-level only) ── */}
      <DataCard bgTint='1000' richTitle={{ title: 'Runtime Info' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {runtimeCondition && <Badge label={runtimeCondition.message ?? runtimeCondition.type} status={mapConditionStatus(runtimeCondition.status)} />}
          {source.detectedLanguages?.map((lang) => (
            <Tag key={lang} label={lang} leftIcon={getProgrammingLanguageIcon(lang)} />
          ))}
        </div>
      </DataCard>

      {/* ── Section 3: Agent Enabled (workload-level only) ── */}
      <DataCard bgTint='1000' richTitle={{ title: 'Agent Enabled' }}>
        {agentCondition && <Badge label={agentCondition.message ?? agentCondition.type} status={mapConditionStatus(agentCondition.status)} />}
      </DataCard>

      {/* ── Section 4: Container → Pod → Process → Library tree ── */}
      {tree && (
        <DataCard bgTint='1000' richTitle={{ title: 'Live Instances' }}>
          {tree.containers.map((treeContainer) => {
            const sourceContainer = source.containers?.find((c) => c.containerName === treeContainer.containerName);
            const podsForContainer = tree.pods
              .map((pod) => ({
                pod,
                podContainer: pod.containers.find((c) => c.containerName === treeContainer.containerName),
              }))
              .filter(({ podContainer }) => podContainer != null);

            const podCount = podsForContainer.length;

            const lang = sourceContainer?.overrides?.runtimeInfo?.language ?? sourceContainer?.runtimeInfo?.language;
            const version = sourceContainer?.overrides?.runtimeInfo?.runtimeVersion ?? sourceContainer?.runtimeInfo?.runtimeVersion;
            const isOverridden = sourceContainer?.overrides?.runtimeInfo != null;
            const agentEnabled = sourceContainer?.agentEnabled?.agentEnabled === true;

            return (
              // Container level — always open
              <DataCard
                key={treeContainer.containerName}
                bgTint='900'
                richTitle={{
                  title: `Container · ${treeContainer.containerName}`,
                  subTitle: `${podCount} pod${podCount !== 1 ? 's' : ''}`,
                  badge: agentEnabled ? { label: sourceContainer?.agentEnabled?.otelDistroName ?? 'Enabled', status: StatusType.Success } : { label: 'Disabled', status: StatusType.Error },
                }}
                withCollapse
                collapseIsDefaultOpen
              >
                {/* Container config: language + agent */}
                <DataCard
                  bgTint='800'
                  cellsPerRow={4}
                  items={[
                    { id: 'lang', title: 'Language', label: lang ?? '—' },
                    { id: 'version', title: 'Runtime Version', label: version ?? '—' },
                    {
                      id: 'origin',
                      title: 'Runtime Source',
                      label: '',
                      badge: isOverridden ? { label: 'Overridden', status: StatusType.Warning } : { label: 'Auto-detected', status: StatusType.Info },
                    },
                    {
                      id: 'distro',
                      title: 'Distro',
                      label: sourceContainer?.agentEnabled?.otelDistroName ?? '—',
                    },
                  ]}
                />
                {/* Container-level libraries summary — collapsed by default */}
                {treeContainer.instrumentations && treeContainer.instrumentations.length > 0 && (
                  <DataCard bgTint='800' richTitle={{ title: 'Libraries', badge: { label: String(treeContainer.instrumentations.length) } }} withCollapse>
                    {treeContainer.instrumentations.map((lib) => (
                      <DataCard
                        key={lib.name}
                        bgTint='750'
                        cellsPerRow={2}
                        items={[
                          { id: 'lib', title: 'Library', label: lib.name },
                          {
                            id: 'std',
                            title: 'Type',
                            label: '',
                            badge: lib.isStandardLibrary ? { label: 'Standard Library', status: StatusType.Info } : { label: 'User Library', status: OtherStatusType.Unknown },
                          },
                        ]}
                      />
                    ))}
                  </DataCard>
                )}

                {/* Pod instances — open if unhealthy, collapsed if healthy */}
                {podsForContainer.map(({ pod, podContainer }) => {
                  const podStatus = mapToStatusCardStatus(pod.agentInjectedStatus.status);
                  const podHasIssue = podStatus === StatusType.Error || podStatus === StatusType.Warning;
                  const processCount = podContainer!.processes.length;

                  return (
                    // Pod level — bgTint 800
                    <DataCard
                      key={pod.podName}
                      bgTint='800'
                      richTitle={{
                        title: `Pod · ${pod.podName}`,
                        subTitle: `${processCount} process${processCount !== 1 ? 'es' : ''}`,
                        badge: {
                          label: pod.agentInjectedStatus.message || (pod.agentInjected ? 'Injected' : 'Not Injected'),
                          status: podStatus,
                        },
                      }}
                      withCollapse
                      collapseIsDefaultOpen={podHasIssue}
                    >
                      {/* Pod container health */}
                      <DataCard
                        bgTint='750'
                        cellsPerRow={4}
                        items={[
                          {
                            id: 'health',
                            title: 'Container Health',
                            label: '',
                            badge: {
                              label: podContainer!.healthStatus.message || podContainer!.healthStatus.status,
                              status: mapToStatusCardStatus(podContainer!.healthStatus.status),
                            },
                          },
                          {
                            id: 'started',
                            title: 'Started',
                            label: '',
                            badge: podContainer!.started ? { label: 'Yes', status: StatusType.Success } : { label: 'No', status: StatusType.Error },
                          },
                          {
                            id: 'ready',
                            title: 'Ready',
                            label: '',
                            badge: podContainer!.ready ? { label: 'Yes', status: StatusType.Success } : { label: 'No', status: StatusType.Error },
                          },
                          {
                            id: 'crash',
                            title: 'Crash Loop',
                            label: '',
                            badge: podContainer!.isCrashLoop ? { label: 'Yes', status: StatusType.Error } : { label: 'No', status: StatusType.Success },
                          },
                        ]}
                      />

                      {/* Processes — open if unhealthy, collapsed if healthy */}
                      {podContainer!.processes.map((process, pi) => {
                        const pid = process.identifyingAttributes.find((a) => a.name === 'process.pid')?.value;
                        const processLabel = pid ? `Process · pid ${pid}` : `Process · ${pi + 1}`;
                        const processStatus = mapToStatusCardStatus(process.healthStatus.status);
                        const processHasIssue = processStatus === StatusType.Error || processStatus === StatusType.Warning;
                        const libCount = process.instrumentations?.length ?? 0;

                        return (
                          // Process level — bgTint 700
                          <DataCard
                            key={pi}
                            bgTint='700'
                            richTitle={{
                              title: processLabel,
                              subTitle: libCount > 0 ? `${libCount} lib${libCount !== 1 ? 's' : ''}` : undefined,
                              badge: {
                                label: process.healthStatus.message || (process.healthy ? 'Healthy' : 'Unhealthy'),
                                status: processStatus,
                              },
                            }}
                            withCollapse
                            collapseIsDefaultOpen={processHasIssue}
                          >
                            {/* Libraries inside this process */}
                            {process.instrumentations?.map((lib) => (
                              <DataCard
                                key={lib.name}
                                bgTint='600'
                                cellsPerRow={2}
                                items={[
                                  { id: 'lib', title: 'Library', label: lib.name },
                                  {
                                    id: 'std',
                                    title: 'Type',
                                    label: '',
                                    badge: lib.isStandardLibrary ? { label: 'Standard Library', status: StatusType.Info } : { label: 'User Library', status: OtherStatusType.Unknown },
                                  },
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
      )}
    </div>
  );
}
