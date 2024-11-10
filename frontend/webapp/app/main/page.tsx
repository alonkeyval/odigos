'use client';
import React, { useEffect } from 'react';
import { OverviewDataFlowContainer } from '@/containers';
import { GetLiveTradeGQL } from '@/graphql';
import { useSubscription } from '@apollo/client';

export default function MainPage() {
  const { data, loading, error } = useSubscription(GetLiveTradeGQL);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  return (
    <>
      <OverviewDataFlowContainer />
    </>
  );
}
