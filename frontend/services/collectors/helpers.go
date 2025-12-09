package collectors

import (
	"time"

	containersutil "github.com/odigos-io/odigos/k8sutils/pkg/containers"
	corev1 "k8s.io/api/core/v1"

	"github.com/odigos-io/odigos/frontend/graph/model"
	"github.com/odigos-io/odigos/frontend/services"
)

func extractResourcesForContainer(containers []corev1.Container, containerName string) *model.Resources {
	c := containersutil.GetContainerByName(containers, containerName)
	if c == nil {
		return nil
	}
	req := buildResourceAmounts(c.Resources.Requests)
	lim := buildResourceAmounts(c.Resources.Limits)
	return &model.Resources{Requests: req, Limits: lim}
}

// extractImageVersionForContainer finds a container by name and returns its parsed image version (tag).
// Returns empty string if the container is not found or the image has no tag.
func extractImageVersionForContainer(containers []corev1.Container, containerName string) string {
	c := containersutil.GetContainerByName(containers, containerName)
	if c == nil {
		return ""
	}
	return services.ExtractImageVersion(c.Image)
}

// ContainerStatusInfo holds extracted status information from a Kubernetes ContainerStatus.
type ContainerStatusInfo struct {
	Ready       bool
	Restarts    int
	Status      model.ContainerLifecycleStatus
	StateReason *string
	StartedAt   *string
}

// ExtractContainerStatusInfo extracts status information from a ContainerStatus.
// If cs is nil, returns default values (not ready, waiting status).
func ExtractContainerStatusInfo(cs *corev1.ContainerStatus) ContainerStatusInfo {
	info := ContainerStatusInfo{
		Ready:    false,
		Restarts: 0,
		Status:   model.ContainerLifecycleStatusWaiting,
	}

	if cs == nil {
		return info
	}

	info.Ready = cs.Ready
	info.Restarts = int(cs.RestartCount)

	if cs.State.Running != nil {
		info.Status = model.ContainerLifecycleStatusRunning
		if !cs.State.Running.StartedAt.IsZero() {
			info.StartedAt = services.StringPtr(cs.State.Running.StartedAt.Time.Format(time.RFC3339))
		}
	} else if cs.State.Waiting != nil {
		info.Status = model.ContainerLifecycleStatusWaiting
		if cs.State.Waiting.Reason != "" {
			info.StateReason = services.StringPtr(cs.State.Waiting.Reason)
		}
	} else if cs.State.Terminated != nil {
		info.Status = model.ContainerLifecycleStatusTerminated
		if cs.State.Terminated.Reason != "" {
			info.StateReason = services.StringPtr(cs.State.Terminated.Reason)
		}
	}

	return info
}
