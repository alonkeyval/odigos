'use client';
import { useQuery } from 'react-query';
import { getOverviewMetrics } from '@/services/metrics';
import { MESSAGE_STREAM_SUBSCRIPTION } from '@/graphql';
import { getClient } from '@/lib/gql/client';
import { client } from '@/lib';

export function useOverviewMetrics() {
  const { data: metrics } = useQuery([], getOverviewMetrics, {
    refetchInterval: 5000,
  });

  function start() {
    client.subscribe({ query: MESSAGE_STREAM_SUBSCRIPTION }).subscribe({
      next({ data }) {
        console.log(data);
      },
      error(err) {
        console.error(err);
      },
    });
  }

  return { metrics, start };
}
