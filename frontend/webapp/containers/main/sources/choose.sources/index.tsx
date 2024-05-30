'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { OVERVIEW, ROUTES } from '@/utils/constants';
import { OverviewHeader } from '@/components/overview';
import { NewSourcesList } from './new.source.flow';

export function SelectSourcesContainer() {
  const router = useRouter();

  function onNewSourceSuccess() {
    router.push(`${ROUTES.SOURCES}?poll=true`);
  }

  return (
    <div style={{ height: '100vh' }}>
      <OverviewHeader
        title={OVERVIEW.MENU.SOURCES}
        onBackClick={() => router.back()}
      />
      <NewSourcesList onSuccess={onNewSourceSuccess} />
    </div>
  );
}
