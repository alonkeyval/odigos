package collectors

import (
	"context"
	"strings"
	"time"

	"github.com/odigos-io/odigos/frontend/graph/model"
	"github.com/odigos-io/odigos/frontend/kube"
	"github.com/odigos-io/odigos/frontend/services"
	containerutils "github.com/odigos-io/odigos/k8sutils/pkg/container"
	"github.com/odigos-io/odigos/k8sutils/pkg/containers"
	"github.com/odigos-io/odigos/k8sutils/pkg/env"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Container waiting reasons that indicate a failure state
const (
	WaitingReasonCreateContainerConfigError = "CreateContainerConfigError"
	WaitingReasonInvalidImageName           = "InvalidImageName"
	WaitingReasonCreateContainerError       = "CreateContainerError"
	WaitingReasonErrImagePull               = "ErrImagePull"
)

func GetPodsBySelector(ctx context.Context, selector string) ([]*model.PodInfo, error) {
	ns := env.GetCurrentNamespace()
	pods, err := kube.DefaultClient.CoreV1().Pods(ns).List(ctx, metav1.ListOptions{LabelSelector: selector})
	if err != nil {
		return nil, err
	}

	podsInfo := make([]*model.PodInfo, 0, len(pods.Items))
	for _, p := range pods.Items {
		podsInfo = append(podsInfo, podToInfo(&p))
	}

	return podsInfo, nil
}

func podToInfo(pod *corev1.Pod) *model.PodInfo {
	containerName := containers.GetCollectorContainerName(pod)
	cs := getContainerStatusByName(pod.Status.ContainerStatuses, containerName)

	return &model.PodInfo{
		Namespace:         pod.Namespace,
		Name:              pod.Name,
		Ready:             containerReady(cs),
		Started:           containerStarted(cs),
		Status:            containerStatus(cs),
		RestartsCount:     containerRestarts(cs),
		NodeName:          pod.Spec.NodeName,
		CreationTimestamp: strings.ToLower(pod.CreationTimestamp.Time.Format(time.RFC3339)),
		Image:             extractImageVersionForContainer(pod.Spec.Containers, containerName),
	}
}

func getContainerStatusByName(statuses []corev1.ContainerStatus, name string) *corev1.ContainerStatus {
	for i := range statuses {
		if statuses[i].Name == name {
			return &statuses[i]
		}
	}
	return nil
}

func containerReady(cs *corev1.ContainerStatus) bool {
	return cs != nil && cs.Ready
}

func containerStarted(cs *corev1.ContainerStatus) bool {
	return cs != nil && cs.Started != nil && *cs.Started
}

func containerStatus(cs *corev1.ContainerStatus) string {
	if cs == nil {
		return "Unknown"
	}
	if cs.State.Waiting != nil && cs.State.Waiting.Reason != "" {
		return cs.State.Waiting.Reason
	}
	if cs.State.Terminated != nil && cs.State.Terminated.Reason != "" {
		return cs.State.Terminated.Reason
	}
	return string(corev1.PodRunning)
}

func containerRestarts(cs *corev1.ContainerStatus) int {
	if cs == nil {
		return 0
	}
	return int(cs.RestartCount)
}

// derivePhaseFromContainerStatus derives the pod phase from the collector container's actual state.
// This provides a more accurate status than the pod phase when the container has issues
// (e.g., ImagePullBackOff shows as Failed instead of Running).
func derivePhaseFromContainerStatus(cs *corev1.ContainerStatus, podPhase corev1.PodPhase) *model.PodPhase {
	if cs == nil {
		return services.MapPodPhase(podPhase)
	}

	if cs.State.Waiting != nil {
		if isWaitingReasonFailure(cs) {
			v := model.PodPhaseFailed
			return &v
		}
		v := model.PodPhasePending
		return &v
	}

	if cs.State.Terminated != nil {
		if cs.State.Terminated.ExitCode == 0 {
			v := model.PodPhaseSucceeded
			return &v
		}
		v := model.PodPhaseFailed
		return &v
	}

	if cs.State.Running != nil {
		v := model.PodPhaseRunning
		return &v
	}

	return services.MapPodPhase(podPhase)
}

// isWaitingReasonFailure returns true if the container waiting reason indicates a failure state.
func isWaitingReasonFailure(cs *corev1.ContainerStatus) bool {
	if containerutils.IsContainerInBackOff(cs) {
		return true
	}
	reason := cs.State.Waiting.Reason
	return reason == WaitingReasonErrImagePull ||
		reason == WaitingReasonCreateContainerConfigError ||
		reason == WaitingReasonInvalidImageName ||
		reason == WaitingReasonCreateContainerError
}

// GetCollectorPodDetails returns pod details with only the collector container.
// This is used for the pod details drawer when clicking on a collector pod.
func GetCollectorPodDetails(ctx context.Context, namespace, name string) (*model.PodDetails, error) {
	pod, err := kube.DefaultClient.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	var nodePtr *string
	if pod.Spec.NodeName != "" {
		nodePtr = services.StringPtr(pod.Spec.NodeName)
	}

	containerName := containers.GetCollectorContainerName(pod)
	cs := getContainerStatusByName(pod.Status.ContainerStatuses, containerName)
	statusPtr := derivePhaseFromContainerStatus(cs, pod.Status.Phase)

	collectorContainers := buildCollectorContainerOverview(pod, containerName)

	manifestYAML, err := services.K8sManifest(ctx, namespace, model.K8sResourceKindPod, name)
	if err != nil {
		return nil, err
	}

	return &model.PodDetails{
		Name:         pod.Name,
		Namespace:    pod.Namespace,
		Node:         nodePtr,
		Status:       statusPtr,
		Containers:   collectorContainers,
		ManifestYaml: manifestYAML,
	}, nil
}

// buildCollectorContainerOverview builds the container overview for only the collector container.
func buildCollectorContainerOverview(pod *corev1.Pod, containerName string) []*model.ContainerOverview {
	var containerSpec *corev1.Container
	for i := range pod.Spec.Containers {
		if pod.Spec.Containers[i].Name == containerName {
			containerSpec = &pod.Spec.Containers[i]
			break
		}
	}
	if containerSpec == nil {
		return []*model.ContainerOverview{}
	}

	cs := getContainerStatusByName(pod.Status.ContainerStatuses, containerName)
	statusInfo := ExtractContainerStatusInfo(cs)

	return []*model.ContainerOverview{
		{
			Name:        containerSpec.Name,
			Image:       services.StringPtr(containerSpec.Image),
			Status:      statusInfo.Status,
			StateReason: statusInfo.StateReason,
			Ready:       statusInfo.Ready,
			Restarts:    statusInfo.Restarts,
			StartedAt:   statusInfo.StartedAt,
			Resources: &model.Resources{
				Requests: buildResourceAmounts(containerSpec.Resources.Requests),
				Limits:   buildResourceAmounts(containerSpec.Resources.Limits),
			},
		},
	}
}
