package watchers

import (
	"context"
	"fmt"
	"time"

	"github.com/odigos-io/odigos/api/odigos/v1alpha1"
	"github.com/odigos-io/odigos/common/consts"
	"github.com/odigos-io/odigos/frontend/endpoints/sse"
	"github.com/odigos-io/odigos/frontend/kube"
	commonutils "github.com/odigos-io/odigos/k8sutils/pkg/workload"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
)

var modifiedBatcher *EventBatcher

func StartInstrumentationInstanceWatcher(ctx context.Context, namespace string) error {
	modifiedBatcher = NewEventBatcher(
		EventBatcherConfig{
			MinBatchSize: 1,
			Duration:     10 * time.Second,
			Event:        sse.MessageEventModified,
			MessageType:  sse.MessageTypeError,
			CRDType:      consts.InstrumentationInstance,
			FailureBatchMessageFunc: func(batchSize int, crd string) string {
				return fmt.Sprintf("Failed to instrument %d instances", batchSize)
			},
		},
	)
	watcher, err := kube.DefaultClient.OdigosClient.InstrumentationInstances(namespace).Watch(context.Background(), metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("error creating watcher: %v", err)
	}

	go handleInstrumentationInstanceWatchEvents(ctx, watcher)
	return nil
}

func handleInstrumentationInstanceWatchEvents(ctx context.Context, watcher watch.Interface) {
	ch := watcher.ResultChan()
	defer modifiedBatcher.Cancel()
	for {
		select {
		case <-ctx.Done():
			watcher.Stop()
			return
		case event, ok := <-ch:
			if !ok {
				return
			}
			switch event.Type {
			case watch.Modified:
				handleModifiedInstrumentationInstance(event.Object.(*v1alpha1.InstrumentationInstance))
			}
		}
	}
}

func handleModifiedInstrumentationInstance(instruInsta *v1alpha1.InstrumentationInstance) {
	healthy := instruInsta.Status.Healthy
	if healthy == nil || *healthy {
		// send notification to frontend only if the instance is not healthy
		return
	}

	labels := instruInsta.GetLabels()
	if labels == nil {
		genericErrorMessage(sse.MessageEventModified, consts.InstrumentationInstance, "error getting labels")
	}

	instrumentedAppName, ok := labels[consts.InstrumentedAppNameLabel]
	if !ok {
		genericErrorMessage(sse.MessageEventModified, consts.InstrumentationInstance, "error getting instrumented app name from labels")
	}

	namespace := instruInsta.Namespace
	name, kind, err := commonutils.ExtractWorkloadInfoFromRuntimeObjectName(instrumentedAppName)
	if err != nil {
		genericErrorMessage(sse.MessageEventModified, consts.InstrumentationInstance, "error getting workload info")
	}

	target := fmt.Sprintf("name=%s&kind=%s&namespace=%s", name, kind, namespace)
	data := fmt.Sprintf("%s %s", instruInsta.Status.Reason, instruInsta.Status.Message)
	fmt.Printf("%s %s modified\n", consts.InstrumentationInstance, name)
	modifiedBatcher.AddEvent(sse.MessageTypeError, data, target)
}
