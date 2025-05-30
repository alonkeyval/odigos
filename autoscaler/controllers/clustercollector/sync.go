package clustercollector

import (
	"context"

	"github.com/odigos-io/odigos/api/k8sconsts"
	odigosv1 "github.com/odigos-io/odigos/api/odigos/v1alpha1"
	commonconf "github.com/odigos-io/odigos/autoscaler/controllers/common"

	"github.com/odigos-io/odigos/k8sutils/pkg/env"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
)

var (
	ClusterCollectorGateway = map[string]string{
		k8sconsts.OdigosCollectorRoleLabel: string(k8sconsts.CollectorsRoleClusterGateway),
	}
)

func reconcileClusterCollector(ctx context.Context, k8sClient client.Client, scheme *runtime.Scheme, imagePullSecrets []string, odigosVersion string) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	odigosNs := env.GetCurrentNamespace()
	var gatewayCollectorGroup odigosv1.CollectorsGroup
	err := k8sClient.Get(ctx, client.ObjectKey{Namespace: odigosNs, Name: k8sconsts.OdigosClusterCollectorConfigMapName}, &gatewayCollectorGroup)
	if err != nil {
		// collectors group is created by the scheduler, after the first destination is added.
		// it is however possible that some reconciler (like deployment) triggered and the collectors group will be created shortly.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	var dests odigosv1.DestinationList
	err = k8sClient.List(ctx, &dests)
	if err != nil {
		return ctrl.Result{}, err
	}

	var processors odigosv1.ProcessorList
	err = k8sClient.List(ctx, &processors)
	if err != nil {
		return ctrl.Result{}, err
	}

	// Add the generic batch processor to the list of processors
	processors.Items = append(processors.Items, commonconf.GetGenericBatchProcessor())

	err = syncGateway(&dests, &processors, &gatewayCollectorGroup, ctx, k8sClient, scheme, imagePullSecrets, odigosVersion)
	statusPatchString := commonconf.GetCollectorsGroupDeployedConditionsPatch(err)
	statusErr := k8sClient.Status().Patch(ctx, &gatewayCollectorGroup, client.RawPatch(types.MergePatchType, []byte(statusPatchString)))
	if statusErr != nil {
		logger.Error(statusErr, "Failed to patch collectors group status")
		// just log the error, do not fail the reconciliation
	}
	return ctrl.Result{}, err
}

func syncGateway(dests *odigosv1.DestinationList, processors *odigosv1.ProcessorList,
	gateway *odigosv1.CollectorsGroup, ctx context.Context,
	c client.Client, scheme *runtime.Scheme, imagePullSecrets []string, odigosVersion string) error {
	logger := log.FromContext(ctx)
	logger.V(0).Info("Syncing gateway")

	signals, err := syncConfigMap(dests, processors, gateway, ctx, c, scheme)
	if err != nil {
		logger.Error(err, "Failed to sync config map")
		return err
	}

	err = deletePreviousServices(ctx, c, gateway.Namespace)
	if err != nil {
		logger.Error(err, "Failed to delete previous services")
		return err
	}

	_, err = syncService(gateway, ctx, c, scheme)
	if err != nil {
		logger.Error(err, "Failed to sync service")
		return err
	}

	_, err = syncDeployment(dests, gateway, ctx, c, scheme, imagePullSecrets, odigosVersion)
	if err != nil {
		logger.Error(err, "Failed to sync deployment")
		return err
	}

	err = commonconf.UpdateCollectorGroupReceiverSignals(ctx, c, gateway, signals)
	if err != nil {
		logger.Error(err, "Failed to update cluster collectors group received signals")
		return err
	}

	err = syncHPA(gateway, ctx, c, scheme)
	if err != nil {
		logger.Error(err, "Failed to sync HPA")
	}

	return nil
}
