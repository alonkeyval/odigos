import { gql } from '@apollo/client';

export const GET_WORKLOADS = gql`
  query GetWorkloads($filter: WorkloadFilter) {
    workloads(filter: $filter) {
      id {
        namespace
        kind
        name
      }
      workloadOdigosHealthStatus {
        name
        status
        reasonEnum
        message
      }
      markedForInstrumentation {
        markedForInstrumentation
        decisionEnum
        message
      }
      runtimeInfo {
        completed
        completedStatus {
          name
          status
          reasonEnum
          message
        }
        containers {
          containerName
          language
          runtimeVersion
          processEnvVars {
            name
            value
          }
          containerRuntimeEnvVars {
            name
            value
          }
          criErrorMessage
          libcType
          secureExecutionMode
          otherAgentName
        }
      }
      agentEnabled {
        enabledStatus {
          name
          status
          reasonEnum
          message
        }
        containers {
          containerName
          agentEnabledStatus {
            name
            status
            reasonEnum
            message
          }
          traces {
            enabled
          }
          metrics {
            enabled
          }
          logs {
            enabled
          }
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
      podsAgentInjectionStatus {
        name
        status
        reasonEnum
        message
      }
      podsHealthStatus {
        name
        status
        reasonEnum
        message
      }
      containers {
        containerName
      }
      pods {
        podName
        nodeName
        podHealthStatus {
          name
          status
          reasonEnum
          message
        }
        containers {
          containerName
          restartCount
        }
      }
      telemetryMetrics {
        totalDataSentBytes
        throughputBytes
        expectingTelemetry {
          isExpectingTelemetry
        }
      }
    }
  }
`;
