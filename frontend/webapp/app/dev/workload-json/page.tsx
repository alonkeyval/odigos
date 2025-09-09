'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { DESCRIBE_WORKLOAD, LIST_WORKLOAD_IDS } from '@/graphql';
import WorkloadStatusBanner from './WorkloadStatusBanner';
import { CenterThis, FadeLoader, FlexColumn, Header, Text } from '@odigos/ui-kit/components';

export default function Page() {
  const [namespace, setNamespace] = React.useState<string | null>('default');
  const [kind, setKind] = React.useState<string | null>('Deployment');
  const [name, setName] = React.useState<string | null>('inventory');
  const [showRaw, setShowRaw] = React.useState(false);

  const {
    data: listData,
    loading: listLoading,
    error: listError,
  } = useQuery(LIST_WORKLOAD_IDS, {
    variables: { filter: null },
    fetchPolicy: 'cache-and-network',
  });

  const filter = React.useMemo(() => {
    if (namespace && kind && name) return { namespace, kind, name };
    if (namespace && !kind && !name) return { namespace };
    return null;
  }, [namespace, kind, name]);

  const { data, loading, error } = useQuery(DESCRIBE_WORKLOAD, {
    variables: { filter },
  });

  if (listLoading)
    return (
      <CenterThis style={{ background: '#ffffff', height: '100%' }}>
        <FadeLoader scale={2} />
      </CenterThis>
    );
  if (listError)
    return (
      <CenterThis style={{ background: '#ffffff', height: '100%' }}>
        <pre>{listError.message}</pre>
      </CenterThis>
    );

  const workloads: { id: { namespace: string; kind: string; name: string }; serviceName?: string }[] = listData?.describeWorkload ?? [];

  return (
    <FlexColumn style={{ padding: 16, gap: 16 }}>
      <Header
        left={[
          <Text key='title' family='primary' style={{ fontWeight: 700 }}>
            Workloads explorer
          </Text>,
          <Text key='subtitle' family='secondary' style={{ opacity: 0.8 }}>
            Browse workloads, filter by id, and inspect status and raw data.
          </Text>,
        ]}
        right={[]}
      />

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'minmax(180px, 1fr) minmax(160px, 1fr) minmax(160px, 2fr) auto',
          alignItems: 'center',
        }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <Text style={{ opacity: 0.8 }}>Namespace</Text>
          <select value={namespace ?? ''} onChange={(e) => setNamespace(e.target.value || null)} style={{ padding: 8, borderRadius: 8 }}>
            <option value=''>All namespaces</option>
            {[...new Set(workloads.map((w) => w.id.namespace))].map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <Text style={{ opacity: 0.8 }}>Kind</Text>
          <select value={kind ?? ''} onChange={(e) => setKind(e.target.value || null)} disabled={!namespace} style={{ padding: 8, borderRadius: 8 }}>
            <option value=''>All kinds</option>
            {[...new Set(workloads.filter((w) => !namespace || w.id.namespace === namespace).map((w) => w.id.kind))].map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <Text style={{ opacity: 0.8 }}>Workload name</Text>
          <select value={name ?? ''} onChange={(e) => setName(e.target.value || null)} disabled={!namespace || !kind} style={{ padding: 8, borderRadius: 8 }}>
            <option value=''>All workloads</option>
            {workloads
              .filter((w) => (!namespace || w.id.namespace === namespace) && (!kind || w.id.kind === kind))
              .map((w) => (
                <option key={`${w.id.namespace}/${w.id.kind}/${w.id.name}`} value={w.id.name}>
                  {w.id.name}
                </option>
              ))}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifySelf: 'end' }}>
          <input type='checkbox' checked={showRaw} onChange={(e) => setShowRaw(e.target.checked)} />
          <Text>Show raw JSON</Text>
        </label>
      </div>

      {loading && (
        <CenterThis style={{ height: 180 }}>
          <FadeLoader />
        </CenterThis>
      )}
      {error && <pre style={{ color: '#dc2626' }}>{error.message}</pre>}

      {data && (
        <div style={{ display: 'grid', gap: 12 }}>
          <WorkloadStatusBanner workload={data.describeWorkload?.[0]} />
          {showRaw && <pre style={{ margin: 0, border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, background: '#ffffff' }}>{JSON.stringify(data, null, 2)}</pre>}
        </div>
      )}
    </FlexColumn>
  );
}
