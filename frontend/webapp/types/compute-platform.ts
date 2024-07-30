import { K8sActualSource } from './sources';
export type K8sActualNamespace = {
  name: string;
  k8sActualSources?: K8sActualSource[];
};

type ComputePlatformData = {
  id: string;
  name: string;
  computePlatformType: string;
  k8sActualNamespace?: K8sActualNamespace;
  k8sActualNamespaces: K8sActualNamespace[];
};

export type ComputePlatform = {
  computePlatform: ComputePlatformData;
};
