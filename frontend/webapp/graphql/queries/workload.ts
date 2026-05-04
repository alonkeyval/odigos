import { gql } from '@apollo/client';

export const GET_SOURCE_TREE = gql`
  query GetSourceTree($filter: WorkloadFilter) {
    workloads(filter: $filter) {
      runtimeInfo {
        containers {
          containerName
          otherAgentName
        }
      }
      telemetryMetrics {
        totalDataSentBytes
        throughputBytes
        expectingTelemetry {
          isExpectingTelemetry
          telemetryObservedStatus {
            status
            message
          }
        }
      }
      containers {
        containerName
        agentEnabled {
          agentEnabled
          agentEnabledStatus {
            status
            message
            reasonEnum
          }
          otelDistroName
        }
        agentConfig {
          traces {
            headSampling {
              fallbackPercentage
              checks {
                percentage
                conditions {
                  key
                  operator
                  value
                }
              }
            }
          }
        }
        instrumentations {
          name
          isStandardLibrary
        }
      }
      rollout {
        rolloutStatus {
          name
          status
          reasonEnum
          message
        }
      }
      podsHealthStatus {
        name
        status
        reasonEnum
        message
      }
      processesHealthStatus {
        name
        status
        reasonEnum
        message
      }
      pods {
        podName
        nodeName
        startTime
        agentInjected
        agentInjectedStatus {
          status
          message
        }
        podHealthStatus {
          status
          message
        }
        containers {
          containerName
          otelDistroName
          restartCount
          runningStartedTime
          waitingReasonEnum
          waitingMessage
          started
          ready
          isCrashLoop
          healthStatus {
            status
            message
          }
          processes {
            healthy
            healthStatus {
              status
              message
            }
            identifyingAttributes {
              name
              value
            }
            instrumentations {
              name
              isStandardLibrary
            }
          }
        }
      }
    }
  }
`;

export const GET_WORKLOADS = gql`
  query GetWorkloads($filter: WorkloadFilter) {
    workloads(filter: $filter) {
      id {
        namespace
        kind
        name
      }
      serviceName
      dataStreamNames
      runtimeInfo {
        detectedLanguages
      }
      workloadOdigosHealthStatus {
        name
        status
        reasonEnum
        message
      }
      podsAgentInjectionStatus {
        name
        status
        reasonEnum
        message
      }
    }
  }
`;

export const GET_WORKLOADS_BY_IDS = gql`
  query GetWorkloadsByIds($ids: [K8sWorkloadIdInput!]!) {
    workloadsByIds(ids: $ids) {
      id {
        namespace
        kind
        name
      }
      serviceName
      dataStreamNames
      numberOfInstances
      markedForInstrumentation {
        markedForInstrumentation
      }
      runtimeInfo {
        detectedLanguages
      }
      containers {
        containerName
        runtimeInfo {
          language
          runtimeVersion
        }
        agentEnabled {
          agentEnabled
          agentEnabledStatus {
            status
            message
            reasonEnum
          }
          otelDistroName
        }
        overrides {
          containerName
          runtimeInfo {
            language
            runtimeVersion
          }
        }
      }
      conditions {
        runtimeDetection {
          name
          status
          reasonEnum
          message
        }
        agentInjectionEnabled {
          name
          status
          reasonEnum
          message
        }
        rollout {
          name
          status
          reasonEnum
          message
        }
        agentInjected {
          name
          status
          reasonEnum
          message
        }
        processesAgentHealth {
          name
          status
          reasonEnum
          message
        }
        expectingTelemetry {
          name
          status
          reasonEnum
          message
        }
      }
      workloadOdigosHealthStatus {
        name
        status
        reasonEnum
        message
      }
      podsAgentInjectionStatus {
        name
        status
        reasonEnum
        message
      }
      rollbackOccurred
    }
  }
`;

export const GET_NAMESPACES = gql`
  query GetNamespaces {
    namespaces {
      name
      markedForInstrumentation
      dataStreamNames
    }
  }
`;

export const GET_NAMESPACES_WITH_WORKLOADS = gql`
  query GetNamespacesWithWorkloads {
    namespaces {
      name
      markedForInstrumentation
      dataStreamNames
      workloads {
        id {
          namespace
          kind
          name
        }
        markedForInstrumentation {
          markedForInstrumentation
        }
        dataStreamNames
        numberOfInstances
      }
    }
  }
`;
