'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLazyQuery } from '@apollo/client';
import { useSourceCRUD } from '@/hooks';
import { GET_SOURCE_TREE, GET_PEER_SOURCES, GET_SAMPLING_RULES } from '@/graphql/queries';
import { StatusCard, DataCard, Badge, Tag, Typography, TypographySize, NoData, Segment } from '@odigos/ui-kit/components/v2';
import { getContainersIcons, getProgrammingLanguageIcon } from '@odigos/ui-kit/functions';
import { OverrideRuntime } from '@odigos/ui-kit/snippets';
import { type Source, K8sResourceKind, StatusType, OtherStatusType, OtherStatus, DesiredStateProgress } from '@odigos/ui-kit/types';

// ─── Local types ──────────────────────────────────────────────────────────────

type TabId = 'overview' | 'pods' | 'peer-sources' | 'profiling' | 'sampling' | 'url-templatization' | 'general-config' | 'debug';

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
  otelDistroName?: string | null;
  restartCount?: number | null;
  runningStartedTime?: string | null;
  waitingReasonEnum?: string | null;
  waitingMessage?: string | null;
  started?: boolean | null;
  ready?: boolean | null;
  isCrashLoop?: boolean | null;
  healthStatus: { status: string; message: string };
  processes: TreeProcess[];
}

interface TreePod {
  podName: string;
  nodeName: string;
  startTime: string;
  agentInjected: boolean;
  agentInjectedStatus: { status: string; message: string };
  podHealthStatus: { status: string; message: string };
  containers: TreePodContainer[];
}

interface TreeContainer {
  containerName: string;
  agentEnabled?: {
    agentEnabled: boolean;
    agentEnabledStatus: { status: string; message: string; reasonEnum?: string | null };
    otelDistroName?: string | null;
  } | null;
  agentConfig?: {
    traces?: {
      headSampling?: {
        fallbackPercentage?: number | null;
        checks?: { percentage: number; conditions: { key: string; operator: string; value: string }[] }[] | null;
      } | null;
    } | null;
  } | null;
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

interface DesiredConditionStatusField {
  name: string;
  status: string;
  reasonEnum?: string | null;
  message: string;
}

interface SourceTreeWorkload {
  runtimeInfo?: {
    containers: { containerName: string; otherAgentName?: string | null }[];
  } | null;
  telemetryMetrics: TreeTelemetryMetrics[];
  containers: TreeContainer[];
  pods: TreePod[];
  rollout?: { rolloutStatus: DesiredConditionStatusField } | null;
  podsHealthStatus?: DesiredConditionStatusField | null;
  processesHealthStatus?: DesiredConditionStatusField | null;
}

interface PeerSourceEntry {
  serviceName: string;
  requests?: number | null;
  dateTime?: string | null;
}

interface PeerSourcesResult {
  inbound: PeerSourceEntry[];
  outbound: PeerSourceEntry[];
}

interface SourceScope {
  workloadName?: string | null;
  workloadKind?: string | null;
  workloadNamespace?: string | null;
  workloadLanguage?: string | null;
}

interface NoisyOpRule {
  ruleId: string;
  name?: string | null;
  disabled: boolean;
  sourceScopes?: SourceScope[] | null;
  percentageAtMost?: number | null;
  operation?: { httpServer?: { route?: string | null; method?: string | null } | null; httpClient?: { serverAddress?: string | null } | null } | null;
  notes?: string | null;
}

interface HighlyRelevantRule {
  ruleId: string;
  name?: string | null;
  disabled: boolean;
  sourceScopes?: SourceScope[] | null;
  error: boolean;
  durationAtLeastMs?: number | null;
  percentageAtLeast?: number | null;
  operation?: { httpServer?: { route?: string | null } | null } | null;
  notes?: string | null;
}

interface CostReductionSamplingRule {
  ruleId: string;
  name?: string | null;
  disabled: boolean;
  sourceScopes?: SourceScope[] | null;
  percentageAtMost: number;
  operation?: { httpServer?: { route?: string | null } | null } | null;
  notes?: string | null;
}

interface SamplingRuleGroup {
  id: string;
  name?: string | null;
  noisyOperations: NoisyOpRule[];
  highlyRelevantOperations: HighlyRelevantRule[];
  costReductionRules: CostReductionSamplingRule[];
}

interface SamplingRulesData {
  rules: SamplingRuleGroup[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noisySummary(rule: NoisyOpRule): string {
  const op = rule.operation?.httpServer?.route
    ? `on ${rule.operation.httpServer.method ? rule.operation.httpServer.method + ' ' : ''}${rule.operation.httpServer.route}`
    : rule.operation?.httpClient?.serverAddress
      ? `to ${rule.operation.httpClient.serverAddress}`
      : 'on all operations';
  const pct = rule.percentageAtMost != null ? `${rule.percentageAtMost}%` : '—';
  return `Drop at most ${pct} of traces ${op}`;
}

function highlyRelevantSummary(rule: HighlyRelevantRule): string {
  const op = rule.operation?.httpServer?.route ? `on ${rule.operation.httpServer.route}` : 'on all operations';
  const pct = rule.percentageAtLeast != null ? `${rule.percentageAtLeast}%` : '100%';
  const dur = rule.durationAtLeastMs != null ? ` with duration > ${rule.durationAtLeastMs}ms` : '';
  const err = rule.error ? ' (errors only)' : '';
  return `Keep at least ${pct} of traces ${op}${dur}${err}`;
}

function costReductionSummary(rule: CostReductionSamplingRule): string {
  const op = rule.operation?.httpServer?.route ? `on ${rule.operation.httpServer.route}` : 'on all operations';
  return `Drop at most ${rule.percentageAtMost}% of traces ${op}`;
}

function ruleAppliesToWorkload(sourceScopes: SourceScope[] | null | undefined, namespace: string, kind: string, name: string, languages: string[]): boolean {
  if (!sourceScopes || sourceScopes.length === 0) return true;
  return sourceScopes.some(
    (s) =>
      (s.workloadNamespace == null || s.workloadNamespace === namespace) &&
      (s.workloadKind == null || s.workloadKind === kind) &&
      (s.workloadName == null || s.workloadName === name) &&
      (s.workloadLanguage == null || languages.includes(s.workloadLanguage)),
  );
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SourceDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const namespace = searchParams.get('namespace') ?? '';
  const kind = (searchParams.get('kind') ?? '') as K8sResourceKind;
  const name = searchParams.get('name') ?? '';

  const { fetchSourceById, updateSource } = useSourceCRUD();
  const [fetchTree] = useLazyQuery<{ workloads: SourceTreeWorkload[] }>(GET_SOURCE_TREE);
  const [fetchPeerSourcesQuery] = useLazyQuery<{ peerSources: PeerSourcesResult }>(GET_PEER_SOURCES);
  const [fetchSamplingRulesQuery] = useLazyQuery<{ sampling: SamplingRulesData }>(GET_SAMPLING_RULES);

  const [source, setSource] = useState<Source | null>(null);
  const [tree, setTree] = useState<SourceTreeWorkload | null>(null);
  const [peerSources, setPeerSources] = useState<PeerSourcesResult | null>(null);
  const [samplingRules, setSamplingRules] = useState<SamplingRulesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('overview');

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

  // Fetch peer sources lazily when that tab is first opened
  useEffect(() => {
    if (tab !== 'peer-sources' || peerSources || !source?.otelServiceName) return;
    fetchPeerSourcesQuery({ variables: { serviceName: source.otelServiceName } }).then((res) => {
      if (res.data?.peerSources) setPeerSources(res.data.peerSources);
    });
  }, [tab, source?.otelServiceName]);

  // Fetch sampling rules lazily when that tab is first opened
  useEffect(() => {
    if (tab !== 'sampling' || samplingRules) return;
    fetchSamplingRulesQuery().then((res) => {
      if (res.data?.sampling) setSamplingRules(res.data.sampling);
    });
  }, [tab]);

  const tabOptions = useMemo<{ label: string; value: TabId }[]>(
    () => [
      { label: 'Overview', value: 'overview' },
      { label: 'Pods', value: 'pods' },
      { label: 'Peer Sources', value: 'peer-sources' },
      { label: 'Profiling', value: 'profiling' },
      { label: 'Sampling', value: 'sampling' },
      { label: 'URL Templatization', value: 'url-templatization' },
      { label: 'General Config', value: 'general-config' },
      { label: 'Debug', value: 'debug' },
    ],
    [],
  );

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

      {/* Tab navigation */}
      <Segment options={tabOptions} selected={tab} setSelected={setTab} />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Overview                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <>
          {/* Identity + Health */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
              {/* <div style={{ display: 'flex', gap: '4px' }}>
                {containerIcons.map((Icon, i) => (
                  <Icon key={i} size={32} />
                ))}
              </div> */}
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

                {/* Telemetry metrics */}
                {tree &&
                  tree.telemetryMetrics.length > 0 &&
                  (() => {
                    const m = tree.telemetryMetrics[0];
                    const obsStatus = mapToStatusCardStatus(m.expectingTelemetry.telemetryObservedStatus.status);
                    const obsMessage = m.expectingTelemetry.telemetryObservedStatus.message;
                    return (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Badge label={obsMessage || 'Telemetry'} status={obsStatus} />
                        {m.throughputBytes != null && <Tag label={`${formatBytes(m.throughputBytes)}/s`} />}
                        {m.totalDataSentBytes != null && <Tag label={`${formatBytes(m.totalDataSentBytes)} total`} />}
                      </div>
                    );
                  })()}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => router.push('/source-states/header')}
                  style={{ background: 'none', border: '1px solid #6366f1', borderRadius: 6, color: '#6366f1', fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}
                >
                  View all states →
                </button>
              </div>
              {source.rollbackOccurred && (
                <StatusCard status={StatusType.Error} title='Rollback Occurred' description='Odigos detected a crash caused by instrumentation and rolled it back automatically.' />
              )}
              {source.workloadOdigosHealthStatus && (
                <StatusCard
                  status={mapToStatusCardStatus(source.workloadOdigosHealthStatus.status)}
                  title={source.workloadOdigosHealthStatus.name ?? 'Odigos Health'}
                  description={source.workloadOdigosHealthStatus.message}
                />
              )}
              {rolloutCondition && <StatusCard status={mapConditionStatus(rolloutCondition.status)} title={rolloutCondition.type} description={rolloutCondition.message ?? ''} />}
            </div>
          </div>

          {/* Containers */}
          {source.containers && source.containers.length > 0 && (
            <DataCard
              bgTint='1000'
              richTitle={{
                title: 'Containers',
                badge: { label: String(source.containers.length) },
                children: (
                  <button
                    onClick={() => router.push('/source-states/containers')}
                    style={{ background: 'none', border: '1px solid #6366f1', borderRadius: 6, color: '#6366f1', fontSize: 11, padding: '3px 8px', cursor: 'pointer', marginLeft: 8 }}
                  >
                    View all states →
                  </button>
                ),
              }}
            >
              {source.containers.map((container) => {
                const lang = container.overrides?.runtimeInfo?.language ?? container.runtimeInfo?.language;
                const version = container.overrides?.runtimeInfo?.runtimeVersion ?? container.runtimeInfo?.runtimeVersion;
                const isOverridden = container.overrides?.runtimeInfo != null;
                const treeContainer = tree?.containers.find((c) => c.containerName === container.containerName);
                const agentEnabledBool = treeContainer?.agentEnabled?.agentEnabled ?? container.agentEnabled?.agentEnabled === true;
                const distro = treeContainer?.agentEnabled?.otelDistroName ?? container.agentEnabled?.otelDistroName;
                const agentStatus = treeContainer?.agentEnabled?.agentEnabledStatus;
                const hasHeadSampling = treeContainer?.agentConfig?.traces?.headSampling != null;
                const otherAgentName = tree?.runtimeInfo?.containers.find((c) => c.containerName === container.containerName)?.otherAgentName;
                const waitingPodContainer = tree?.pods.flatMap((p) => p.containers).find((c) => c.containerName === container.containerName && c.waitingReasonEnum);
                const LangIcon = lang ? getProgrammingLanguageIcon(lang) : null;
                const onBadge = { label: 'On', status: StatusType.Success };
                const offBadge = { label: 'Off', status: OtherStatusType.Disabled };

                return (
                  <DataCard
                    key={container.containerName}
                    bgTint='900'
                    richTitle={{
                      icon: LangIcon ?? undefined,
                      title: container.containerName,
                      badge: agentEnabledBool ? { label: distro ?? 'Enabled', status: StatusType.Success } : { label: 'Disabled', status: StatusType.Error },
                    }}
                    withCollapse
                    collapseIsDefaultOpen
                  >
                    {otherAgentName && (
                      <DataCard
                        bgTint='800'
                        cellsPerRow={2}
                        items={[
                          { id: 'other-agent', title: 'Other Agent Detected', label: '', badge: { label: otherAgentName, status: StatusType.Warning } },
                          { id: 'other-agent-note', title: 'Note', label: 'Another instrumentation agent is running alongside Odigos' },
                        ]}
                      />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <DataCard
                          bgTint='800'
                          cellsPerRow={3}
                          items={[
                            { id: 'lang', title: 'Language', label: lang ?? '—' },
                            { id: 'version', title: 'Runtime Version', label: version ?? '—' },
                          ]}
                        />
                      </div>
                      <OverrideRuntime
                        showRuntime
                        showDistro={false}
                        defaultLanguage={container.overrides?.runtimeInfo?.language ?? container.runtimeInfo?.language ?? undefined}
                        defaultVersion={container.overrides?.runtimeInfo?.runtimeVersion ?? container.runtimeInfo?.runtimeVersion ?? ''}
                        handleSave={(payload) => updateSource({ namespace, kind, name }, { ...payload, containerName: container.containerName })}
                      />
                    </div>
                    {agentStatus && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <DataCard
                            bgTint='800'
                            cellsPerRow={3}
                            items={[
                              {
                                id: 'agent-status',
                                title: 'Agent Status',
                                label: '',
                                badge: { label: agentStatus.message || (agentEnabledBool ? 'Enabled' : 'Disabled'), status: mapToStatusCardStatus(agentStatus.status) },
                              },
                              ...(agentStatus.reasonEnum ? [{ id: 'reason', title: 'Reason', label: agentStatus.reasonEnum }] : []),
                              ...(distro ? [{ id: 'distro', title: 'Distro', label: distro }] : []),
                            ]}
                          />
                        </div>
                        <OverrideRuntime
                          showRuntime={false}
                          showDistro
                          defaultLanguage={container.overrides?.runtimeInfo?.language ?? container.runtimeInfo?.language ?? undefined}
                          defaultOtelDistroName={(distro as any) ?? null}
                          handleSave={(payload) => updateSource({ namespace, kind, name }, { ...payload, containerName: container.containerName })}
                        />
                      </div>
                    )}
                    <DataCard
                      bgTint='800'
                      cellsPerRow={3}
                      items={[
                        { id: 'head-sampling', title: 'Head Sampling', label: '', badge: tree ? (hasHeadSampling ? onBadge : offBadge) : { label: '—' } },
                        { id: 'headers', title: 'Headers Collection', label: '', badge: offBadge },
                        { id: 'url-templ', title: 'URL Templatization', label: '', badge: offBadge },
                        { id: 'span-renamer', title: 'Span Renamer', label: '', badge: offBadge },
                        { id: 'payload', title: 'Payload Collection', label: '', badge: offBadge },
                        { id: 'code-attrs', title: 'Code Attributes', label: '', badge: offBadge },
                      ]}
                    />
                    {waitingPodContainer && (
                      <DataCard
                        bgTint='800'
                        cellsPerRow={2}
                        items={[
                          { id: 'wait-reason', title: 'Waiting Reason', label: waitingPodContainer.waitingReasonEnum ?? '—' },
                          { id: 'wait-msg', title: 'Waiting Message', label: waitingPodContainer.waitingMessage ?? '—' },
                        ]}
                      />
                    )}
                  </DataCard>
                );
              })}
            </DataCard>
          )}
          {/* Rollout */}
          <DataCard
            bgTint='1000'
            richTitle={{
              title: 'Rollout',
              children: (
                <button
                  onClick={() => router.push('/source-states/rollout')}
                  style={{ background: 'none', border: '1px solid #6366f1', borderRadius: 6, color: '#6366f1', fontSize: 11, padding: '3px 8px', cursor: 'pointer' }}
                >
                  View all states →
                </button>
              ),
            }}
          >
            {tree?.rollout?.rolloutStatus && (
              <DataCard
                bgTint='900'
                cellsPerRow={2}
                items={[
                  {
                    id: 'rollout-status',
                    title: 'Rollout Status',
                    label: '',
                    badge: {
                      label: tree.rollout.rolloutStatus.message || tree.rollout.rolloutStatus.name,
                      status: mapToStatusCardStatus(tree.rollout.rolloutStatus.status),
                    },
                  },
                  ...(tree.rollout.rolloutStatus.reasonEnum ? [{ id: 'rollout-reason', title: 'Reason', label: tree.rollout.rolloutStatus.reasonEnum }] : []),
                ]}
              />
            )}
            <DataCard
              bgTint='900'
              cellsPerRow={2}
              items={[
                {
                  id: 'rollback-occurred',
                  title: 'Rollback',
                  label: '',
                  badge: source.rollbackOccurred ? { label: 'Occurred', status: StatusType.Error } : { label: 'None', status: StatusType.Success },
                },
                { id: 'rollback-time', title: 'Rollback Time', label: '—' },
              ]}
            />
          </DataCard>
          {/* Pods Summary */}
          {tree &&
            tree.pods.length > 0 &&
            (() => {
              const totalPods = tree.pods.length;
              const injectedCount = tree.pods.filter((p) => p.agentInjected).length;
              const healthGroups = tree.pods.reduce<Record<string, { count: number; status: string; _msg: string }>>((acc, pod) => {
                const s = pod.podHealthStatus.status;
                if (!acc[s]) acc[s] = { count: 0, status: s, _msg: pod.podHealthStatus.message || s };
                acc[s].count++;
                return acc;
              }, {});

              return (
                <DataCard
                  bgTint='1000'
                  richTitle={{
                    title: 'Pods',
                    badge: { label: String(totalPods) },
                    children: (
                      <button
                        onClick={() => router.push('/source-states/pods-summary')}
                        style={{ background: 'none', border: '1px solid #6366f1', borderRadius: 6, color: '#6366f1', fontSize: 11, padding: '3px 8px', cursor: 'pointer', marginLeft: 8 }}
                      >
                        View all states →
                      </button>
                    ),
                  }}
                >
                  <DataCard
                    bgTint='900'
                    cellsPerRow={2}
                    items={[
                      { id: 'total', title: 'Total Pods', label: String(totalPods) },
                      {
                        id: 'injected',
                        title: 'Agent Injected',
                        label: '',
                        badge: { label: `${injectedCount} / ${totalPods}`, status: injectedCount === totalPods ? StatusType.Success : injectedCount === 0 ? StatusType.Error : StatusType.Warning },
                      },
                    ]}
                  />
                  <DataCard
                    bgTint='900'
                    cellsPerRow={Object.keys(healthGroups).length}
                    items={Object.values(healthGroups).map((g) => ({
                      id: g.status,
                      title: 'Health',
                      label: '',
                      badge: { label: `${g.count} ${g._msg}`, status: mapToStatusCardStatus(g.status) },
                    }))}
                  />
                  {tree.podsHealthStatus && <StatusCard status={mapToStatusCardStatus(tree.podsHealthStatus.status)} title='Pods Health' description={tree.podsHealthStatus.message} />}
                  {tree.processesHealthStatus && (
                    <StatusCard status={mapToStatusCardStatus(tree.processesHealthStatus.status)} title='Processes Health' description={tree.processesHealthStatus.message} />
                  )}
                </DataCard>
              );
            })()}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Pods                                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'pods' && tree && (
        <DataCard
          bgTint='1000'
          richTitle={{
            title: 'Pods',
            badge: { label: String(tree.pods.length) },
            children: (
              <button
                onClick={() => router.push('/source-states/pods')}
                style={{ background: 'none', border: '1px solid #6366f1', borderRadius: 6, color: '#6366f1', fontSize: 11, padding: '3px 8px', cursor: 'pointer', marginLeft: 8 }}
              >
                View all states →
              </button>
            ),
          }}
        >
          {tree.pods.map((pod) => {
            const podInjectionStatus = mapToStatusCardStatus(pod.agentInjectedStatus.status);
            const podHealthStatus = mapToStatusCardStatus(pod.podHealthStatus.status);
            const podHasIssue = podInjectionStatus === StatusType.Error || podInjectionStatus === StatusType.Warning || podHealthStatus === StatusType.Error || podHealthStatus === StatusType.Warning;

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
                      { id: 'get-pod', title: 'Get Pod', label: `kubectl get pod ${pod.podName} -n ${namespace}`, withCopy: true },
                      { id: 'get-pod-yaml', title: 'Get Pod YAML', label: `kubectl get pod ${pod.podName} -n ${namespace} -o yaml`, withCopy: true },
                      { id: 'describe-pod', title: 'Describe Pod', label: `kubectl describe pod ${pod.podName} -n ${namespace}`, withCopy: true },
                      { id: 'logs-pod', title: 'Pod Logs', label: `kubectl logs ${pod.podName} -n ${namespace}`, withCopy: true },
                      { id: 'logs-pod-prev', title: 'Pod Logs (previous)', label: `kubectl logs ${pod.podName} -n ${namespace} --previous`, withCopy: true },
                    ]}
                  />
                </DataCard>
                {pod.containers.map((podContainer) => {
                  const containerHealthStatus = mapToStatusCardStatus(podContainer.healthStatus.status);
                  const containerHasIssue = containerHealthStatus === StatusType.Error || containerHealthStatus === StatusType.Warning || !!podContainer.isCrashLoop;

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
                      {/* Odigos data */}
                      <DataCard bgTint='750' cellsPerRow={1} items={[{ id: 'distro', title: 'OTel Distro', label: podContainer.otelDistroName || '—' }]} />
                      {/* K8s status */}
                      <DataCard
                        bgTint='750'
                        cellsPerRow={4}
                        items={[
                          { id: 'started', title: 'Started', label: '', badge: podContainer.started ? { label: 'Yes', status: StatusType.Success } : { label: 'No', status: StatusType.Error } },
                          { id: 'ready', title: 'Ready', label: '', badge: podContainer.ready ? { label: 'Yes', status: StatusType.Success } : { label: 'No', status: StatusType.Error } },
                          { id: 'crash', title: 'Crash Loop', label: '', badge: podContainer.isCrashLoop ? { label: 'Yes', status: StatusType.Error } : { label: 'No', status: StatusType.Success } },
                          { id: 'restarts', title: 'Restarts', label: podContainer.restartCount != null ? String(podContainer.restartCount) : '—' },
                        ]}
                      />
                      {/* Extra K8s timing / waiting info */}
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
                      {/* Processes */}
                      {podContainer.processes.map((process, pi) => {
                        const pid = process.identifyingAttributes.find((a) => a.name === 'process.pid')?.value;
                        const processLabel = pid ? `pid ${pid}` : `Process ${pi + 1}`;
                        const processStatus = mapToStatusCardStatus(process.healthStatus.status);
                        const processHasIssue = !process.healthy || processStatus === StatusType.Error || processStatus === StatusType.Warning;
                        const libCount = process.instrumentations?.length ?? 0;

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
                            {process.instrumentations?.map((lib) => (
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
                                    badge: lib.isStandardLibrary ? { label: 'Standard Library', status: StatusType.Info } : { label: 'User Library', status: OtherStatusType.Unknown },
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
      )}
      {tab === 'pods' && !tree && (
        <div style={{ padding: '24px' }}>
          <Typography size={TypographySize.S}>Loading pods...</Typography>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Peer Sources                                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'peer-sources' && (
        <>
          {!peerSources && (
            <div style={{ padding: '24px' }}>
              <Typography size={TypographySize.S}>Loading peer sources...</Typography>
            </div>
          )}
          {peerSources && peerSources.inbound.length === 0 && peerSources.outbound.length === 0 && (
            <NoData title='No Peer Sources' subTitle='No inbound or outbound services detected for this source' />
          )}
          {peerSources && peerSources.inbound.length > 0 && (
            <DataCard bgTint='1000' richTitle={{ title: 'Inbound', badge: { label: String(peerSources.inbound.length) } }}>
              {peerSources.inbound.map((peer) => (
                <DataCard
                  key={peer.serviceName}
                  bgTint='900'
                  cellsPerRow={2}
                  items={[
                    { id: 'svc', title: 'Service', label: peer.serviceName },
                    { id: 'req', title: 'Requests', label: peer.requests != null ? String(peer.requests) : '—' },
                  ]}
                />
              ))}
            </DataCard>
          )}
          {peerSources && peerSources.outbound.length > 0 && (
            <DataCard bgTint='1000' richTitle={{ title: 'Outbound', badge: { label: String(peerSources.outbound.length) } }}>
              {peerSources.outbound.map((peer) => (
                <DataCard
                  key={peer.serviceName}
                  bgTint='900'
                  cellsPerRow={2}
                  items={[
                    { id: 'svc', title: 'Service', label: peer.serviceName },
                    { id: 'req', title: 'Requests', label: peer.requests != null ? String(peer.requests) : '—' },
                  ]}
                />
              ))}
            </DataCard>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Profiling                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'profiling' && <NoData title='Profiling' subTitle='Profiling configuration coming soon' />}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Sampling                                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'sampling' &&
        (() => {
          const opLabel = (op: NoisyOpRule['operation'] | HighlyRelevantRule['operation']): string => {
            if (op?.httpServer?.route) return `HTTP ${op.httpServer.route}`;
            if ((op as NoisyOpRule['operation'])?.httpClient?.serverAddress) return `→ ${(op as NoisyOpRule['operation'])!.httpClient!.serverAddress}`;
            return 'All operations';
          };

          return (
            <DataCard bgTint='1000' richTitle={{ title: 'Sampling', badge: { label: String(source.containers?.length ?? 0) } }}>
              {source.containers?.map((container) => {
                const treeContainer = tree?.containers.find((c) => c.containerName === container.containerName);
                const headSampling = treeContainer?.agentConfig?.traces?.headSampling;
                const containerLang = (container.overrides?.runtimeInfo?.language ?? container.runtimeInfo?.language) as string | undefined;
                const containerLanguages = containerLang ? [containerLang] : ((source.detectedLanguages ?? []) as string[]);

                const noisyOps =
                  samplingRules?.rules.flatMap((r) => r.noisyOperations).filter((r) => !r.disabled && ruleAppliesToWorkload(r.sourceScopes, namespace, kind, name, containerLanguages)) ?? [];
                const highlyRelevant =
                  samplingRules?.rules.flatMap((r) => r.highlyRelevantOperations).filter((r) => !r.disabled && ruleAppliesToWorkload(r.sourceScopes, namespace, kind, name, containerLanguages)) ?? [];
                const costReduction =
                  samplingRules?.rules.flatMap((r) => r.costReductionRules).filter((r) => !r.disabled && ruleAppliesToWorkload(r.sourceScopes, namespace, kind, name, containerLanguages)) ?? [];

                return (
                  <DataCard key={container.containerName} bgTint='900' richTitle={{ title: container.containerName }} withCollapse collapseIsDefaultOpen>
                    {/* Head Sampling */}
                    <DataCard
                      bgTint='800'
                      richTitle={{
                        title: 'Head Sampling',
                        badge: headSampling ? { label: 'On', status: StatusType.Success } : { label: 'Off', status: OtherStatusType.Disabled },
                      }}
                    />

                    {/* Tail Sampling */}
                    <DataCard
                      bgTint='800'
                      richTitle={{
                        title: 'Tail Sampling',
                        badge: samplingRules
                          ? {
                              label: String(noisyOps.length + highlyRelevant.length + costReduction.length),
                              status: noisyOps.length + highlyRelevant.length + costReduction.length > 0 ? StatusType.Success : OtherStatusType.Disabled,
                            }
                          : undefined,
                      }}
                      withCollapse
                      collapseIsDefaultOpen={noisyOps.length + highlyRelevant.length + costReduction.length > 0}
                    >
                      {!samplingRules && <Typography size={TypographySize.S}>Loading rules...</Typography>}
                      {samplingRules && noisyOps.length === 0 && highlyRelevant.length === 0 && costReduction.length === 0 && (
                        <NoData title='No sampling rules' subTitle='No sampling rules apply to this container' />
                      )}
                      {noisyOps.length > 0 && (
                        <DataCard bgTint='750' richTitle={{ title: 'Noisy Operations', badge: { label: String(noisyOps.length) } }} withCollapse collapseIsDefaultOpen>
                          {noisyOps.map((rule) => (
                            <DataCard key={rule.ruleId} bgTint='700' richTitle={{ title: rule.name || rule.ruleId, subTitle: noisySummary(rule) }} withCollapse>
                              <DataCard
                                bgTint='600'
                                cellsPerRow={3}
                                items={[
                                  { id: 'pct', title: 'Keep at most %', label: rule.percentageAtMost != null ? `${rule.percentageAtMost}%` : '—' },
                                  { id: 'op', title: 'Operation', label: opLabel(rule.operation) },
                                  ...(rule.notes ? [{ id: 'notes', title: 'Notes', label: rule.notes }] : []),
                                ]}
                              />
                              <button onClick={() => router.push('/sampling')} style={{ alignSelf: 'flex-start', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}>
                                <Typography size={TypographySize.XS}>View Rule →</Typography>
                              </button>
                            </DataCard>
                          ))}
                        </DataCard>
                      )}
                      {highlyRelevant.length > 0 && (
                        <DataCard bgTint='750' richTitle={{ title: 'Highly Relevant Operations', badge: { label: String(highlyRelevant.length) } }} withCollapse collapseIsDefaultOpen>
                          {highlyRelevant.map((rule) => (
                            <DataCard key={rule.ruleId} bgTint='700' richTitle={{ title: rule.name || rule.ruleId, subTitle: highlyRelevantSummary(rule) }} withCollapse>
                              <DataCard
                                bgTint='600'
                                cellsPerRow={4}
                                items={[
                                  { id: 'pct', title: 'Keep at least %', label: rule.percentageAtLeast != null ? `${rule.percentageAtLeast}%` : '—' },
                                  { id: 'dur', title: 'Min Duration', label: rule.durationAtLeastMs != null ? `${rule.durationAtLeastMs}ms` : '—' },
                                  { id: 'err', title: 'Errors Only', label: '', badge: rule.error ? { label: 'Yes', status: StatusType.Warning } : { label: 'No', status: OtherStatusType.Disabled } },
                                  ...(rule.notes ? [{ id: 'notes', title: 'Notes', label: rule.notes }] : []),
                                ]}
                              />
                              <button onClick={() => router.push('/sampling')} style={{ alignSelf: 'flex-start', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}>
                                <Typography size={TypographySize.XS}>View Rule →</Typography>
                              </button>
                            </DataCard>
                          ))}
                        </DataCard>
                      )}
                      {costReduction.length > 0 && (
                        <DataCard bgTint='750' richTitle={{ title: 'Cost Reduction', badge: { label: String(costReduction.length) } }} withCollapse collapseIsDefaultOpen>
                          {costReduction.map((rule) => (
                            <DataCard key={rule.ruleId} bgTint='700' richTitle={{ title: rule.name || rule.ruleId, subTitle: costReductionSummary(rule) }} withCollapse>
                              <DataCard
                                bgTint='600'
                                cellsPerRow={3}
                                items={[
                                  { id: 'pct', title: 'Drop at most %', label: `${rule.percentageAtMost}%` },
                                  { id: 'op', title: 'Operation', label: opLabel(rule.operation) },
                                  ...(rule.notes ? [{ id: 'notes', title: 'Notes', label: rule.notes }] : []),
                                ]}
                              />
                              <button onClick={() => router.push('/sampling')} style={{ alignSelf: 'flex-start', cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}>
                                <Typography size={TypographySize.XS}>View Rule →</Typography>
                              </button>
                            </DataCard>
                          ))}
                        </DataCard>
                      )}
                    </DataCard>
                  </DataCard>
                );
              })}
            </DataCard>
          );
        })()}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: URL Templatization                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'url-templatization' &&
        (() => {
          // TODO: replace with API data once WorkloadCollectorConfig is in GQL
          type UrlTemplatizationState = { rules: string[] } | 'default' | null;
          const mockTemplatization: Record<string, UrlTemplatizationState> = {};
          (source.containers ?? []).forEach((c, i) => {
            if (i === 0) mockTemplatization[c.containerName] = { rules: ['/api/users/{id}', '/api/orders/{orderId}/items/{itemId}', '/api/products/{productId}/reviews/{reviewId}'] };
            else if (i === 1) mockTemplatization[c.containerName] = 'default';
            else mockTemplatization[c.containerName] = null;
          });

          return (
            <DataCard bgTint='1000' richTitle={{ title: 'URL Templatization', badge: { label: String(source.containers?.length ?? 0) } }}>
              {(source.containers ?? []).map((container) => {
                const state = mockTemplatization[container.containerName] ?? null;
                const badge =
                  state === null
                    ? { label: 'None', status: OtherStatusType.Disabled }
                    : state === 'default'
                      ? { label: 'Default', status: StatusType.Info }
                      : { label: 'Custom', status: StatusType.Success };

                return (
                  <DataCard key={container.containerName} bgTint='900' richTitle={{ title: container.containerName, badge }} withCollapse collapseIsDefaultOpen>
                    {state === null && <NoData title='Not Configured' subTitle='No URL templatization rules apply to this container' />}
                    {state === 'default' && (
                      <DataCard
                        bgTint='800'
                        cellsPerRow={1}
                        items={[{ id: 'default', title: 'Applied Rules', label: 'Default rules applied — Odigos automatically templatizes common URL patterns' }]}
                      />
                    )}
                    {state !== null &&
                      state !== 'default' &&
                      state.rules.map((rule, i) => <DataCard key={i} bgTint='800' cellsPerRow={1} items={[{ id: `rule-${i}`, title: 'Rule', label: rule, withCopy: true }]} />)}
                  </DataCard>
                );
              })}
            </DataCard>
          );
        })()}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: General Config                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'general-config' &&
        (() => {
          // TODO: replace with API data once AgentTracesConfig fields are in GQL
          interface MockGeneralConfig {
            headersCollection: { httpHeaderKeys: string[] } | null;
            spanRenamer: { scopeRules: { scopeName: string; regexReplacements: { pattern: string; replacement: string }[] }[] } | null;
            payloadCollection: {
              httpRequest: { mimeTypes: string[]; maxPayloadLength: number } | null;
              httpResponse: { mimeTypes: string[]; maxPayloadLength: number } | null;
              dbQuery: { maxPayloadLength: number; sanitizationPolicy: string } | null;
              messaging: { maxPayloadLength: number } | null;
            } | null;
            codeAttributes: { column: boolean; filePath: boolean; function: boolean; lineNumber: boolean; namespace: boolean; stacktrace: boolean } | null;
            traceVerbosity: { disabledLibraries: { language: string; libraryName: string }[]; enabledLibraries: { language: string; libraryName: string }[] } | null;
            customInstrumentations: {
              golang: { packageName: string; functionName?: string; receiverName?: string; receiverMethodName?: string }[];
              java: { className: string; methodName: string }[];
            } | null;
          }

          const mockConfigs: Record<string, MockGeneralConfig> = {};
          (source.containers ?? []).forEach((c, i) => {
            if (i === 0) {
              mockConfigs[c.containerName] = {
                headersCollection: { httpHeaderKeys: ['x-request-id', 'authorization', 'x-trace-id'] },
                spanRenamer: { scopeRules: [{ scopeName: 'net/http', regexReplacements: [{ pattern: '/api/v[0-9]+/', replacement: '/api/' }] }] },
                payloadCollection: {
                  httpRequest: { mimeTypes: ['application/json'], maxPayloadLength: 4096 },
                  httpResponse: { mimeTypes: ['application/json'], maxPayloadLength: 4096 },
                  dbQuery: { maxPayloadLength: 1024, sanitizationPolicy: 'sanitized' },
                  messaging: null,
                },
                codeAttributes: { column: false, filePath: true, function: true, lineNumber: true, namespace: true, stacktrace: false },
                traceVerbosity: { disabledLibraries: [{ language: 'go', libraryName: 'net/http/internal' }], enabledLibraries: [{ language: 'nodejs', libraryName: 'fs' }] },
                customInstrumentations: {
                  golang: [{ packageName: 'net/http', receiverName: 'response', receiverMethodName: 'WriteHeader' }],
                  java: [{ className: 'com.example.service.PaymentService', methodName: 'processPayment' }],
                },
              };
            } else if (i === 1) {
              mockConfigs[c.containerName] = {
                headersCollection: { httpHeaderKeys: ['x-correlation-id'] },
                spanRenamer: null,
                payloadCollection: null,
                codeAttributes: { column: false, filePath: true, function: true, lineNumber: false, namespace: false, stacktrace: false },
                traceVerbosity: null,
                customInstrumentations: null,
              };
            } else {
              mockConfigs[c.containerName] = { headersCollection: null, spanRenamer: null, payloadCollection: null, codeAttributes: null, traceVerbosity: null, customInstrumentations: null };
            }
          });

          const onBadge = { label: 'On', status: StatusType.Success };
          const offBadge = { label: 'Off', status: OtherStatusType.Disabled };

          return (
            <DataCard bgTint='1000' richTitle={{ title: 'General Config', badge: { label: String(source.containers?.length ?? 0) } }}>
              {(source.containers ?? []).map((container) => {
                const cfg = mockConfigs[container.containerName];
                const activeCount = [cfg.headersCollection, cfg.spanRenamer, cfg.payloadCollection, cfg.codeAttributes, cfg.traceVerbosity, cfg.customInstrumentations].filter(Boolean).length;

                return (
                  <DataCard
                    key={container.containerName}
                    bgTint='900'
                    richTitle={{ title: container.containerName, badge: { label: `${activeCount} active`, status: activeCount > 0 ? StatusType.Success : OtherStatusType.Disabled } }}
                    withCollapse
                    collapseIsDefaultOpen
                  >
                    {/* Headers Collection */}
                    <DataCard bgTint='800' richTitle={{ title: 'Headers Collection', badge: cfg.headersCollection ? onBadge : offBadge }} withCollapse collapseIsDefaultOpen={!!cfg.headersCollection}>
                      {cfg.headersCollection ? (
                        <DataCard bgTint='750' cellsPerRow={1} items={cfg.headersCollection.httpHeaderKeys.map((h, i) => ({ id: `h-${i}`, title: 'Header Key', label: h, withCopy: true }))} />
                      ) : (
                        <NoData title='Not configured' subTitle='No HTTP headers will be collected' />
                      )}
                    </DataCard>

                    {/* Span Renamer */}
                    <DataCard bgTint='800' richTitle={{ title: 'Span Renamer', badge: cfg.spanRenamer ? onBadge : offBadge }} withCollapse collapseIsDefaultOpen={!!cfg.spanRenamer}>
                      {cfg.spanRenamer ? (
                        cfg.spanRenamer.scopeRules.map((rule, i) => (
                          <DataCard key={i} bgTint='750' richTitle={{ title: rule.scopeName }} withCollapse collapseIsDefaultOpen>
                            {rule.regexReplacements.map((r, j) => (
                              <DataCard
                                key={j}
                                bgTint='700'
                                cellsPerRow={2}
                                items={[
                                  { id: 'pat', title: 'Pattern', label: r.pattern },
                                  { id: 'rep', title: 'Replacement', label: r.replacement },
                                ]}
                              />
                            ))}
                          </DataCard>
                        ))
                      ) : (
                        <NoData title='Not configured' subTitle='No span renaming rules apply' />
                      )}
                    </DataCard>

                    {/* Payload Collection */}
                    <DataCard bgTint='800' richTitle={{ title: 'Payload Collection', badge: cfg.payloadCollection ? onBadge : offBadge }} withCollapse collapseIsDefaultOpen={!!cfg.payloadCollection}>
                      {cfg.payloadCollection ? (
                        <>
                          {cfg.payloadCollection.httpRequest && (
                            <DataCard
                              bgTint='750'
                              cellsPerRow={2}
                              items={[
                                { id: 'type', title: 'Type', label: 'HTTP Request' },
                                { id: 'mime', title: 'MIME Types', label: cfg.payloadCollection.httpRequest.mimeTypes.join(', ') },
                                { id: 'max', title: 'Max Length', label: `${cfg.payloadCollection.httpRequest.maxPayloadLength} bytes` },
                              ]}
                            />
                          )}
                          {cfg.payloadCollection.httpResponse && (
                            <DataCard
                              bgTint='750'
                              cellsPerRow={2}
                              items={[
                                { id: 'type', title: 'Type', label: 'HTTP Response' },
                                { id: 'mime', title: 'MIME Types', label: cfg.payloadCollection.httpResponse.mimeTypes.join(', ') },
                                { id: 'max', title: 'Max Length', label: `${cfg.payloadCollection.httpResponse.maxPayloadLength} bytes` },
                              ]}
                            />
                          )}
                          {cfg.payloadCollection.dbQuery && (
                            <DataCard
                              bgTint='750'
                              cellsPerRow={2}
                              items={[
                                { id: 'type', title: 'Type', label: 'DB Query' },
                                { id: 'san', title: 'Sanitization', label: cfg.payloadCollection.dbQuery.sanitizationPolicy },
                                { id: 'max', title: 'Max Length', label: `${cfg.payloadCollection.dbQuery.maxPayloadLength} bytes` },
                              ]}
                            />
                          )}
                          {cfg.payloadCollection.messaging && (
                            <DataCard
                              bgTint='750'
                              cellsPerRow={2}
                              items={[
                                { id: 'type', title: 'Type', label: 'Messaging' },
                                { id: 'max', title: 'Max Length', label: `${cfg.payloadCollection.messaging.maxPayloadLength} bytes` },
                              ]}
                            />
                          )}
                        </>
                      ) : (
                        <NoData title='Not configured' subTitle='No payload collection rules apply' />
                      )}
                    </DataCard>

                    {/* Code Attributes */}
                    <DataCard bgTint='800' richTitle={{ title: 'Code Attributes', badge: cfg.codeAttributes ? onBadge : offBadge }} withCollapse collapseIsDefaultOpen={!!cfg.codeAttributes}>
                      {cfg.codeAttributes ? (
                        <DataCard
                          bgTint='750'
                          cellsPerRow={3}
                          items={[
                            { id: 'col', title: 'Column', label: '', badge: cfg.codeAttributes.column ? onBadge : offBadge },
                            { id: 'fp', title: 'File Path', label: '', badge: cfg.codeAttributes.filePath ? onBadge : offBadge },
                            { id: 'fn', title: 'Function', label: '', badge: cfg.codeAttributes.function ? onBadge : offBadge },
                            { id: 'ln', title: 'Line Number', label: '', badge: cfg.codeAttributes.lineNumber ? onBadge : offBadge },
                            { id: 'ns', title: 'Namespace', label: '', badge: cfg.codeAttributes.namespace ? onBadge : offBadge },
                            { id: 'st', title: 'Stacktrace', label: '', badge: cfg.codeAttributes.stacktrace ? onBadge : offBadge },
                          ]}
                        />
                      ) : (
                        <NoData title='Not configured' subTitle='No code attribute collection configured' />
                      )}
                    </DataCard>

                    {/* Trace Verbosity */}
                    <DataCard bgTint='800' richTitle={{ title: 'Trace Verbosity', badge: cfg.traceVerbosity ? onBadge : offBadge }} withCollapse collapseIsDefaultOpen={!!cfg.traceVerbosity}>
                      {cfg.traceVerbosity ? (
                        <>
                          {cfg.traceVerbosity.disabledLibraries.length > 0 && (
                            <DataCard bgTint='750' richTitle={{ title: 'Disabled Libraries', badge: { label: String(cfg.traceVerbosity.disabledLibraries.length) } }}>
                              {cfg.traceVerbosity.disabledLibraries.map((lib, i) => (
                                <DataCard
                                  key={i}
                                  bgTint='700'
                                  cellsPerRow={2}
                                  items={[
                                    { id: 'lang', title: 'Language', label: lib.language },
                                    { id: 'lib', title: 'Library', label: lib.libraryName },
                                  ]}
                                />
                              ))}
                            </DataCard>
                          )}
                          {cfg.traceVerbosity.enabledLibraries.length > 0 && (
                            <DataCard bgTint='750' richTitle={{ title: 'Enabled Libraries', badge: { label: String(cfg.traceVerbosity.enabledLibraries.length) } }}>
                              {cfg.traceVerbosity.enabledLibraries.map((lib, i) => (
                                <DataCard
                                  key={i}
                                  bgTint='700'
                                  cellsPerRow={2}
                                  items={[
                                    { id: 'lang', title: 'Language', label: lib.language },
                                    { id: 'lib', title: 'Library', label: lib.libraryName },
                                  ]}
                                />
                              ))}
                            </DataCard>
                          )}
                        </>
                      ) : (
                        <NoData title='Not configured' subTitle='Default trace verbosity applies' />
                      )}
                    </DataCard>

                    {/* Custom Instrumentations */}
                    <DataCard
                      bgTint='800'
                      richTitle={{ title: 'Custom Instrumentations', badge: cfg.customInstrumentations ? onBadge : offBadge }}
                      withCollapse
                      collapseIsDefaultOpen={!!cfg.customInstrumentations}
                    >
                      {cfg.customInstrumentations ? (
                        <>
                          {cfg.customInstrumentations.golang.length > 0 && (
                            <DataCard bgTint='750' richTitle={{ title: 'Golang', badge: { label: String(cfg.customInstrumentations.golang.length) } }}>
                              {cfg.customInstrumentations.golang.map((p, i) => (
                                <DataCard
                                  key={i}
                                  bgTint='700'
                                  cellsPerRow={3}
                                  items={[
                                    { id: 'pkg', title: 'Package', label: p.packageName },
                                    ...(p.functionName ? [{ id: 'fn', title: 'Function', label: p.functionName }] : []),
                                    ...(p.receiverName ? [{ id: 'recv', title: 'Receiver', label: p.receiverName }] : []),
                                    ...(p.receiverMethodName ? [{ id: 'method', title: 'Method', label: p.receiverMethodName }] : []),
                                  ]}
                                />
                              ))}
                            </DataCard>
                          )}
                          {cfg.customInstrumentations.java.length > 0 && (
                            <DataCard bgTint='750' richTitle={{ title: 'Java', badge: { label: String(cfg.customInstrumentations.java.length) } }}>
                              {cfg.customInstrumentations.java.map((p, i) => (
                                <DataCard
                                  key={i}
                                  bgTint='700'
                                  cellsPerRow={2}
                                  items={[
                                    { id: 'cls', title: 'Class', label: p.className },
                                    { id: 'method', title: 'Method', label: p.methodName },
                                  ]}
                                />
                              ))}
                            </DataCard>
                          )}
                        </>
                      ) : (
                        <NoData title='Not configured' subTitle='No custom instrumentation probes configured' />
                      )}
                    </DataCard>
                  </DataCard>
                );
              })}
            </DataCard>
          );
        })()}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: Debug                                                            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'debug' && (
        <DataCard bgTint='1000' richTitle={{ title: 'Debug Commands' }}>
          <DataCard bgTint='900' richTitle={{ title: 'Commands' }} withCollapse collapseIsDefaultOpen>
            <DataCard
              bgTint='800'
              cellsPerRow={1}
              items={[
                { id: 'kubectl', title: 'Get workload', label: `kubectl get ${kind.toLowerCase()} ${name} -n ${namespace}`, withCopy: true },
                { id: 'kubectl-yaml', title: 'Get workload YAML', label: `kubectl get ${kind.toLowerCase()} ${name} -n ${namespace} -o yaml`, withCopy: true },
                { id: 'kubectl-pods', title: 'List pods', label: `kubectl get pods -n ${namespace} -l app=${name}`, withCopy: true },
                { id: 'kubectl-desc', title: 'Describe workload', label: `kubectl describe ${kind.toLowerCase()} ${name} -n ${namespace}`, withCopy: true },
              ]}
            />
          </DataCard>
          <DataCard bgTint='900' richTitle={{ title: 'K8s YAMLs' }} withCollapse collapseIsDefaultOpen>
            <DataCard
              bgTint='800'
              cellsPerRow={1}
              items={[
                { id: 'yaml-deployment', title: `${kind} YAML`, label: `kubectl get ${kind.toLowerCase()} ${name} -n ${namespace} -o yaml`, withCopy: true },
                { id: 'yaml-ic', title: 'InstrumentationConfig YAML', label: `kubectl get instrumentationconfig ${kind.toLowerCase()}-${name} -n ${namespace} -o yaml`, withCopy: true },
              ]}
            />
          </DataCard>
        </DataCard>
      )}
    </div>
  );
}
