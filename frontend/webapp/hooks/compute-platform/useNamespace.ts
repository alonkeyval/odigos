import { ACTION } from '@/utils';
import { useNotificationStore } from '@/store';
import { useMutation, useQuery } from '@apollo/client';
import { useComputePlatform } from './useComputePlatform';
import { GET_NAMESPACES, PERSIST_NAMESPACE } from '@/graphql';
import { type ComputePlatform, NOTIFICATION_TYPE, type PersistNamespaceItemInput } from '@/types';

export const useNamespace = (namespaceName?: string) => {
  const { addNotification } = useNotificationStore();
  const cp = useComputePlatform();

  const { data, loading } = useQuery<ComputePlatform>(GET_NAMESPACES, {
    skip: !namespaceName,
    fetchPolicy: 'cache-first',
    variables: { namespaceName },
    onError: (error) =>
      addNotification({
        type: NOTIFICATION_TYPE.ERROR,
        title: error.name || ACTION.FETCH,
        message: error.cause?.message || error.message,
      }),
  });

  const [persistNamespaceMutation] = useMutation(PERSIST_NAMESPACE, {
    onError: (error) =>
      addNotification({
        type: NOTIFICATION_TYPE.ERROR,
        title: error.name || ACTION.UPDATE,
        message: error.cause?.message || error.message,
      }),
  });

  return {
    loading,
    data: data?.computePlatform.k8sActualNamespace,
    allNamespaces: cp.data?.computePlatform.k8sActualNamespaces,
    persistNamespace: async (namespace: PersistNamespaceItemInput) => await persistNamespaceMutation({ variables: { namespace } }),
  };
};
