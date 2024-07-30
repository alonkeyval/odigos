import { ComputePlatform } from '@/types';
import { useQuery } from '@apollo/client';
import { GET_COMPUTE_PLATFORM, GET_NAMESPACES } from '@/graphql';

type UseComputePlatformHook = {
  data?: ComputePlatform;
  loading: boolean;
  error?: Error;
};

export const useComputePlatform = (): UseComputePlatformHook => {
  const { data, loading, error } =
    useQuery<ComputePlatform>(GET_COMPUTE_PLATFORM);

  return { data, loading, error };
};
