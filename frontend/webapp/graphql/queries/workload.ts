import { gql } from '@apollo/client';

// For the source drawer what is important is the workloadOdigosHealthStatus
export const DESCRIBE_WORKLOAD = gql`
  query DescribeWorkload($filter: WorkloadFilter) {
    describeWorkload(filter: $filter) {
      id {
        namespace
        kind
        name
      }
      serviceName
      workloadOdigosHealthStatus {
        status
        reasonEnum
        message
      }
      markedForInstrumentation {
        markedForInstrumentation
        decisionEnum
        message
      }
      conditions {
        runtimeDetection {
          status
          reasonEnum
          message
        }
        agentInjectionEnabled {
          status
          reasonEnum
          message
        }
        rollout {
          status
          reasonEnum
          message
        }
        agentInjected {
          status
          reasonEnum
          message
        }
        processesAgentHealth {
          status
          reasonEnum
          message
        }
      }
      runtimeInfo {
        completed
        completedStatus {
          status
          reasonEnum
          message
        }
      }
      agentEnabled {
        agentEnabled
        enabledStatus {
          status
          reasonEnum
          message
        }
      }
      rollout {
        rolloutStatus {
          status
          reasonEnum
          message
        }
      }
      containers {
        containerName
        runtimeInfo {
          language
          runtimeVersion
          otherAgentName
        }
      }
      telemetryMetrics {
        totalDataSentBytes
        throughputBytes
        expectingTelemetry {
          isExpectingTelemetry
        }
      }
      pods {
        podName
        nodeName
        startTime
        agentInjected
        agentInjectedStatus {
          status
          reasonEnum
          message
        }
      }
      podsAgentInjectionStatus {
        status
        reasonEnum
        message
      }
      podsHealthStatus {
        status
        reasonEnum
        message
      }
      workloadHealthStatus {
        status
        reasonEnum
        message
      }
      processesHealthStatus {
        status
        reasonEnum
        message
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
