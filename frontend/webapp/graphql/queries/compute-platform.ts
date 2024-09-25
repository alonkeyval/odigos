import { gql } from '@apollo/client';

export const GET_COMPUTE_PLATFORM = gql`
  query GetComputePlatform {
    computePlatform {
      k8sActualSources {
        name
        kind
        numberOfInstances
        instrumentedApplicationDetails {
          containers {
            containerName
            language
          }
          conditions {
            type
            status
            message
          }
        }
      }
      destinations {
        name
        exportedSignals {
          logs
          metrics
          traces
        }
        destinationType {
          imageUrl
          displayName
        }
      }
      actions {
        type
        spec
      }
      k8sActualNamespaces {
        name
      }
    }
  }
`;

export const GET_NAMESPACES = gql`
  query GetK8sActualNamespace(
    $namespaceName: String!
    $instrumentationLabeled: Boolean
  ) {
    computePlatform {
      k8sActualNamespace(name: $namespaceName) {
        name
        instrumentationLabelEnabled
        k8sActualSources(instrumentationLabeled: $instrumentationLabeled) {
          kind
          name
          numberOfInstances
        }
      }
    }
  }
`;