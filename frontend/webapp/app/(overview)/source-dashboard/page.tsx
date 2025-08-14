'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_WORKLOADS } from '@/graphql/queries/workloads';
import styled from 'styled-components';

// Local component implementations since @odigos/ui-kit/components is missing
const FlexColumn = styled.div<{ gap?: string; padding?: string; maxWidth?: string; margin?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap || '0'};
  padding: ${({ padding }) => padding || '0'};
  max-width: ${({ maxWidth }) => maxWidth || 'none'};
  margin: ${({ margin }) => margin || '0'};
`;

const FlexRow = styled.div<{ gap?: string; alignItems?: string; marginBottom?: string; flexWrap?: string }>`
  display: flex;
  flex-direction: row;
  gap: ${({ gap }) => gap || '0'};
  align-items: ${({ alignItems }) => alignItems || 'stretch'};
  margin-bottom: ${({ marginBottom }) => marginBottom || '0'};
  flex-wrap: ${({ flexWrap }) => flexWrap || 'nowrap'};
`;

const Card = styled.div<{ padding?: string; border?: string; marginBottom?: string; hover?: boolean }>`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: ${({ padding }) => padding || '20px'};
  border: ${({ border }) => border || '1px solid #f1f5f9'};
  margin-bottom: ${({ marginBottom }) => marginBottom || '0'};
  transition: all 0.2s ease;

  ${({ hover }) =>
    hover &&
    `
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
  `}
`;

const Badge = styled.span<{ backgroundColor?: string; color?: string; fontSize?: string; fontWeight?: string; padding?: string; borderRadius?: string }>`
  background-color: ${({ backgroundColor }) => backgroundColor || '#6b7280'};
  color: ${({ color }) => color || 'white'};
  font-size: ${({ fontSize }) => fontSize || '11px'};
  font-weight: ${({ fontWeight }) => fontWeight || '600'};
  padding: ${({ padding }) => padding || '6px 12px'};
  border-radius: ${({ borderRadius }) => borderRadius || '20px'};
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
`;

const Button = styled.button<{ marginTop?: string; width?: string; variant?: 'primary' | 'secondary' }>`
  background: ${({ variant }) => (variant === 'secondary' ? '#f8fafc' : '#3b82f6')};
  color: ${({ variant }) => (variant === 'secondary' ? '#475569' : 'white')};
  border: ${({ variant }) => (variant === 'secondary' ? '1px solid #e2e8f0' : 'none')};
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${({ marginTop }) => marginTop || '0'};
  width: ${({ width }) => width || 'auto'};

  &:hover {
    background: ${({ variant }) => (variant === 'secondary' ? '#f1f5f9' : '#2563eb')};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    background: ${({ variant }) => (variant === 'secondary' ? '#e2e8f0' : '#1d4ed8')};
    transform: translateY(0);
  }
`;

const Input = styled.input`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  width: 220px;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const Select = styled.select`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  width: 220px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const PageContainer = styled(FlexColumn)`
  padding: 32px;
  gap: 32px;
  max-width: 1400px;
  margin: 0 auto;
  background: #fafbfc;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 24px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const WorkloadCount = styled.div`
  background: #f1f5f9;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
`;

const FiltersContainer = styled(FlexRow)`
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 32px;
  flex-wrap: wrap;
  padding: 24px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const WorkloadCard = styled(Card)`
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  hover: true;
`;

const WorkloadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
`;

const WorkloadInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const WorkloadName = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
`;

const WorkloadMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    background: #cbd5e1;
    border-radius: 50%;
  }
`;

const StatusSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 4px solid #e2e8f0;
`;

const StatusLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const StatusValue = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatusBadge = styled(Badge)<{ $status: string }>`
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'SUCCESS':
        return '#10b981';
      case 'ERROR':
        return '#ef4444';
      case 'PROGRESS':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  }};
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
`;

const StatusMessage = styled.span`
  font-size: 13px;
  color: #475569;
  font-weight: 500;
  line-height: 1.4;
`;

const ExpandableSection = styled.div<{ $expanded: boolean }>`
  max-height: ${({ $expanded }) => ($expanded ? '2000px' : '0')};
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 20px;
`;

const ExpandButton = styled(Button)`
  margin-top: 20px;
  width: 100%;
  variant: secondary;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
`;

const ContainerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 16px;
`;

const ContainerCard = styled(Card)`
  padding: 20px;
  border: 1px solid #f1f5f9;
  hover: true;
`;

const PodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-top: 16px;
`;

const PodCard = styled(Card)`
  padding: 20px;
  border: 1px solid #f1f5f9;
  hover: true;
`;

const TelemetryMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 16px;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
`;

const MetricLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #64748b;
  font-weight: 500;
`;

const ErrorState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  font-size: 18px;
  color: #ef4444;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 48px;
  color: #64748b;
  font-size: 16px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

interface WorkloadFilter {
  namespace?: string;
  workloadKind?: string;
  workloadName?: string;
  markedForInstrumentation?: boolean;
}

export default function SourceDashboard() {
  const [filters, setFilters] = useState<WorkloadFilter>({});
  const [expandedWorkloads, setExpandedWorkloads] = useState<Set<string>>(new Set());

  const { loading, error, data } = useQuery(GET_WORKLOADS, {
    variables: { filter: filters },
    fetchPolicy: 'cache-and-network',
  });

  const toggleWorkloadExpansion = (workloadId: string) => {
    const newExpanded = new Set(expandedWorkloads);
    if (newExpanded.has(workloadId)) {
      newExpanded.delete(workloadId);
    } else {
      newExpanded.add(workloadId);
    }
    setExpandedWorkloads(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'SUCCESS';
      case 'ERROR':
        return 'ERROR';
      case 'PROGRESS':
        return 'PROGRESS';
      default:
        return 'NEUTRAL';
    }
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined) return 'N/A';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState>Loading workloads...</LoadingState>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState>Error loading workloads: {error.message}</ErrorState>
      </PageContainer>
    );
  }

  const workloads = data?.workloads || [];

  return (
    <PageContainer>
      <Header>
        <Title>Source Dashboard</Title>
        <WorkloadCount>Total Workloads: {workloads.length}</WorkloadCount>
      </Header>

      <FiltersContainer>
        <FilterGroup>
          <FilterLabel>Namespace</FilterLabel>
          <Input placeholder='Filter by namespace' value={filters.namespace || ''} onChange={(e) => setFilters({ ...filters, namespace: e.target.value || undefined })} />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Workload Kind</FilterLabel>
          <Select value={filters.workloadKind || ''} onChange={(e) => setFilters({ ...filters, workloadKind: e.target.value || undefined })}>
            <option value=''>All Kinds</option>
            <option value='Deployment'>Deployment</option>
            <option value='DaemonSet'>DaemonSet</option>
            <option value='StatefulSet'>StatefulSet</option>
            <option value='CronJob'>CronJob</option>
          </Select>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Workload Name</FilterLabel>
          <Input placeholder='Filter by name' value={filters.workloadName || ''} onChange={(e) => setFilters({ ...filters, workloadName: e.target.value || undefined })} />
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Marked for Instrumentation</FilterLabel>
          <Select
            value={filters.markedForInstrumentation === undefined ? '' : filters.markedForInstrumentation.toString()}
            onChange={(e) => {
              const value = e.target.value;
              setFilters({
                ...filters,
                markedForInstrumentation: value === '' ? undefined : value === 'true',
              });
            }}
          >
            <option value=''>All</option>
            <option value='true'>Yes</option>
            <option value='false'>No</option>
          </Select>
        </FilterGroup>
      </FiltersContainer>

      {workloads.map((workload: any) => {
        const workloadId = `${workload.id.namespace}/${workload.id.kind}/${workload.id.name}`;
        const isExpanded = expandedWorkloads.has(workloadId);

        return (
          <WorkloadCard key={workloadId}>
            <WorkloadHeader>
              <WorkloadInfo>
                <WorkloadName>{workload.id.name}</WorkloadName>
                <WorkloadMeta>
                  <MetaItem>Namespace: {workload.id.namespace}</MetaItem>
                  <MetaItem>Kind: {workload.id.kind}</MetaItem>
                </WorkloadMeta>
              </WorkloadInfo>
              <StatusBadge $status={getStatusColor(workload.workloadOdigosHealthStatus?.status)}>{workload.workloadOdigosHealthStatus?.status || 'UNKNOWN'}</StatusBadge>
            </WorkloadHeader>

            <StatusSection>
              <StatusItem>
                <StatusLabel>Odigos Health</StatusLabel>
                <StatusValue>
                  <StatusBadge $status={getStatusColor(workload.workloadOdigosHealthStatus?.status)}>{workload.workloadOdigosHealthStatus?.status || 'UNKNOWN'}</StatusBadge>
                  <StatusMessage>{workload.workloadOdigosHealthStatus?.message || 'No status available'}</StatusMessage>
                </StatusValue>
              </StatusItem>

              <StatusItem>
                <StatusLabel>Instrumentation</StatusLabel>
                <StatusValue>
                  <StatusBadge $status={workload.markedForInstrumentation?.markedForInstrumentation ? 'SUCCESS' : 'NEUTRAL'}>
                    {workload.markedForInstrumentation?.markedForInstrumentation ? 'ENABLED' : 'DISABLED'}
                  </StatusBadge>
                  <StatusMessage>{workload.markedForInstrumentation?.message || 'No decision available'}</StatusMessage>
                </StatusValue>
              </StatusItem>

              <StatusItem>
                <StatusLabel>Agent Status</StatusLabel>
                <StatusValue>
                  <StatusBadge $status={getStatusColor(workload.agentEnabled?.enabledStatus?.status)}>{workload.agentEnabled?.enabledStatus?.status || 'UNKNOWN'}</StatusBadge>
                  <StatusMessage>{workload.agentEnabled?.enabledStatus?.message || 'No agent status'}</StatusMessage>
                </StatusValue>
              </StatusItem>

              <StatusItem>
                <StatusLabel>Runtime Detection</StatusLabel>
                <StatusValue>
                  <StatusBadge $status={workload.runtimeInfo?.completed ? 'SUCCESS' : 'PROGRESS'}>{workload.runtimeInfo?.completed ? 'COMPLETED' : 'IN_PROGRESS'}</StatusBadge>
                  <StatusMessage>{workload.runtimeInfo?.completedStatus?.message || 'No runtime info'}</StatusMessage>
                </StatusValue>
              </StatusItem>

              {workload.rollout?.rolloutStatus && (
                <StatusItem>
                  <StatusLabel>Rollout Status</StatusLabel>
                  <StatusValue>
                    <StatusBadge $status={getStatusColor(workload.rollout.rolloutStatus.status)}>{workload.rollout.rolloutStatus.status || 'UNKNOWN'}</StatusBadge>
                    <StatusMessage>{workload.rollout.rolloutStatus.message || 'No rollout info'}</StatusMessage>
                  </StatusValue>
                </StatusItem>
              )}

              {workload.podsAgentInjectionStatus && (
                <StatusItem>
                  <StatusLabel>Agent Injection</StatusLabel>
                  <StatusValue>
                    <StatusBadge $status={getStatusColor(workload.podsAgentInjectionStatus.status)}>{workload.podsAgentInjectionStatus.status || 'UNKNOWN'}</StatusBadge>
                    <StatusMessage>{workload.podsAgentInjectionStatus.message || 'No injection info'}</StatusMessage>
                  </StatusValue>
                </StatusItem>
              )}

              {workload.podsHealthStatus && (
                <StatusItem>
                  <StatusLabel>Pods Health</StatusLabel>
                  <StatusValue>
                    <StatusBadge $status={getStatusColor(workload.podsHealthStatus.status)}>{workload.podsHealthStatus.status || 'UNKNOWN'}</StatusBadge>
                    <StatusMessage>{workload.podsHealthStatus.message || 'No health info'}</StatusMessage>
                  </StatusValue>
                </StatusItem>
              )}
            </StatusSection>

            <ExpandableSection $expanded={isExpanded}>
              {/* Containers Section */}
              {workload.containers && workload.containers.length > 0 && (
                <div>
                  <SectionTitle>Containers ({workload.containers.length})</SectionTitle>
                  <ContainerGrid>
                    {workload.containers.map((container: any, index: number) => (
                      <ContainerCard key={index}>
                        <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{container.containerName}</h5>
                        <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>Overrides: {container.overrides ? 'Yes' : 'No'}</p>
                      </ContainerCard>
                    ))}
                  </ContainerGrid>
                </div>
              )}

              {/* Pods Section */}
              {workload.pods && workload.pods.length > 0 && (
                <div>
                  <SectionTitle>Pods ({workload.pods.length})</SectionTitle>
                  <PodGrid>
                    {workload.pods.map((pod: any, index: number) => (
                      <PodCard key={index}>
                        <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{pod.podName}</h5>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Node: {pod.nodeName || 'Unknown'}</p>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#64748b' }}>Containers: {pod.containers?.length || 0}</p>
                        <StatusBadge $status={getStatusColor(pod.podHealthStatus?.status)}>{pod.podHealthStatus?.status || 'UNKNOWN'}</StatusBadge>
                      </PodCard>
                    ))}
                  </PodGrid>
                </div>
              )}

              {/* Telemetry Metrics */}
              {workload.telemetryMetrics && workload.telemetryMetrics.length > 0 && (
                <div>
                  <SectionTitle>Telemetry Metrics</SectionTitle>
                  <TelemetryMetrics>
                    {workload.telemetryMetrics.map((metric: any, index: number) => (
                      <MetricCard key={index}>
                        <MetricLabel>Total Data Sent</MetricLabel>
                        <MetricValue>{formatBytes(metric.totalDataSentBytes)}</MetricValue>
                        <MetricLabel>Throughput</MetricLabel>
                        <MetricValue>{formatBytes(metric.throughputBytes)}/s</MetricValue>
                        <MetricLabel>Expecting Telemetry</MetricLabel>
                        <MetricValue>{metric.expectingTelemetry?.isExpectingTelemetry ? 'Yes' : 'No'}</MetricValue>
                      </MetricCard>
                    ))}
                  </TelemetryMetrics>
                </div>
              )}

              {/* Runtime Info */}
              {workload.runtimeInfo && (
                <div>
                  <SectionTitle>Runtime Information</SectionTitle>
                  <ContainerGrid>
                    {workload.runtimeInfo.containers?.map((container: any, index: number) => (
                      <ContainerCard key={index}>
                        <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{container.containerName}</h5>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Language: {container.language}</p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Runtime Version: {container.runtimeVersion || 'Unknown'}</p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>LibC Type: {container.libcType || 'Unknown'}</p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Secure Execution: {container.secureExecutionMode ? 'Yes' : 'No'}</p>
                        {container.otherAgentName && <p style={{ margin: '0', fontSize: '14px', color: '#64748b' }}>Other Agent: {container.otherAgentName}</p>}
                      </ContainerCard>
                    ))}
                  </ContainerGrid>
                </div>
              )}

              {/* Agent Container Details */}
              {workload.agentEnabled?.containers && workload.agentEnabled.containers.length > 0 && (
                <div>
                  <SectionTitle>Agent Container Details</SectionTitle>
                  <ContainerGrid>
                    {workload.agentEnabled.containers.map((container: any, index: number) => (
                      <ContainerCard key={index}>
                        <h5 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{container.containerName}</h5>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <StatusBadge $status={getStatusColor(container.agentEnabledStatus?.status)}>{container.agentEnabledStatus?.status || 'UNKNOWN'}</StatusBadge>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                            <span>Traces:</span>
                            <span style={{ fontWeight: '600', color: container.traces?.enabled ? '#10b981' : '#64748b' }}>{container.traces?.enabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                            <span>Metrics:</span>
                            <span style={{ fontWeight: '600', color: container.metrics?.enabled ? '#10b981' : '#64748b' }}>{container.metrics?.enabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                            <span>Logs:</span>
                            <span style={{ fontWeight: '600', color: container.logs?.enabled ? '#10b981' : '#64748b' }}>{container.logs?.enabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                        {container.agentEnabledStatus?.message && (
                          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>{container.agentEnabledStatus.message}</p>
                        )}
                      </ContainerCard>
                    ))}
                  </ContainerGrid>
                </div>
              )}
            </ExpandableSection>

            <ExpandButton onClick={() => toggleWorkloadExpansion(workloadId)}>{isExpanded ? 'Collapse Details' : 'Expand Details'}</ExpandButton>
          </WorkloadCard>
        );
      })}

      {workloads.length === 0 && (
        <EmptyState>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No workloads found</div>
          <div>No workloads match the current filters. Try adjusting your search criteria.</div>
        </EmptyState>
      )}
    </PageContainer>
  );
}
