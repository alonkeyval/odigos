'use client';

import React from 'react';
import Link from 'next/link';
import { TABLE_MAX_HEIGHT, TABLE_MAX_WIDTH, ROUTES } from '@/utils';
import { useMetrics, useSourceCRUD, useWorkloadUtils } from '@/hooks';
import { MultiSourceControl, SourceTable } from '@odigos/ui-kit/containers';
import styled from 'styled-components';

const DashboardLink = styled(Link)`
  display: inline-block;
  margin-bottom: 16px;
  padding: 8px 16px;
  background-color: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2563eb;
  }
`;

export default function Page() {
  const { metrics } = useMetrics();
  const { restartWorkloads } = useWorkloadUtils();
  const { sources, persistSources } = useSourceCRUD();

  return (
    <>
      <DashboardLink href={ROUTES.SOURCE_DASHBOARD}>📊 View Source Dashboard (Debug)</DashboardLink>
      <SourceTable metrics={metrics} maxHeight={TABLE_MAX_HEIGHT} maxWidth={TABLE_MAX_WIDTH} />
      <MultiSourceControl totalSourceCount={sources.length} uninstrumentSources={(payload) => persistSources(payload, {})} restartWorkloads={restartWorkloads} />
    </>
  );
}
