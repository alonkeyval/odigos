'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { DESCRIBE_WORKLOAD, LIST_WORKLOAD_IDS } from '@/graphql';
import WorkloadStatusBanner from './WorkloadStatusBanner';

export default function Page() {
  const [namespace, setNamespace] = React.useState<string | null>('default');
  const [kind, setKind] = React.useState<string | null>('Deployment');
  const [name, setName] = React.useState<string | null>('inventory');

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

  if (listLoading) return <pre style={{ background: '#ffffff' }}>loading...</pre>;
  if (listError) return <pre style={{ background: '#ffffff' }}>{listError.message}</pre>;

  const workloads: { id: { namespace: string; kind: string; name: string }; serviceName?: string }[] = listData?.describeWorkload ?? [];

  return (
    <div style={{ background: '#ffffff', padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select value={namespace ?? ''} onChange={(e) => setNamespace(e.target.value || null)}>
          <option value=''>All namespaces</option>
          {[...new Set(workloads.map((w) => w.id.namespace))].map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>

        <select value={kind ?? ''} onChange={(e) => setKind(e.target.value || null)} disabled={!namespace}>
          <option value=''>All kinds</option>
          {[...new Set(workloads.filter((w) => !namespace || w.id.namespace === namespace).map((w) => w.id.kind))].map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <select value={name ?? ''} onChange={(e) => setName(e.target.value || null)} disabled={!namespace || !kind}>
          <option value=''>All workloads</option>
          {workloads
            .filter((w) => (!namespace || w.id.namespace === namespace) && (!kind || w.id.kind === kind))
            .map((w) => (
              <option key={`${w.id.namespace}/${w.id.kind}/${w.id.name}`} value={w.id.name}>
                {w.id.name}
              </option>
            ))}
        </select>
      </div>

      {loading && <pre>loading...</pre>}
      {error && <pre>{error.message}</pre>}
      {data && <WorkloadStatusBanner workload={data.describeWorkload[0]} />}
    </div>
  );
}
