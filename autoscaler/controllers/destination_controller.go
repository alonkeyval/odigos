/*
Copyright 2022.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controllers

import (
	"context"
	"fmt"

	controllerconfig "github.com/odigos-io/odigos/autoscaler/controllers/controller_config"
	"github.com/odigos-io/odigos/autoscaler/controllers/gateway"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/predicate"

	v1 "github.com/odigos-io/odigos/api/odigos/v1alpha1"
)

type DestinationReconciler struct {
	client.Client
	Scheme           *runtime.Scheme
	ImagePullSecrets []string
	OdigosVersion    string
	Config           *controllerconfig.ControllerConfig
}

func (r *DestinationReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)
	logger.V(0).Info("Reconciling Destination")

	var destination v1.Destination
	if err := r.Client.Get(ctx, req.NamespacedName, &destination); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	sources, err := r.resolveSources(ctx, destination)
	if err != nil {
		logger.Error(err, "Failed to resolve sources for destination")
		return ctrl.Result{}, err
	}
	logger.V(0).Info("Reconciling Destination")
	fmt.Println("Resolved sources:", sources)

	// if err := r.updateCollectorConfig(ctx, destination, sources); err != nil {
	// 	logger.Error(err, "Failed to update OpenTelemetry Collector ConfigMap")
	// 	return ctrl.Result{}, err
	// }

	err = gateway.Sync(ctx, r.Client, r.Scheme, r.ImagePullSecrets, r.OdigosVersion, r.Config)
	if err != nil {
		return ctrl.Result{}, err
	}

	return ctrl.Result{}, nil
}

func (r *DestinationReconciler) resolveSources(ctx context.Context, destination v1.Destination) ([]string, error) {
	var sources []string
	fmt.Println("Resolving sources", "filterMode", destination.Spec.SourceFilter.Mode)

	switch destination.Spec.SourceFilter.Mode {
	case "all":
		var instrumentationConfigs v1.InstrumentationConfigList
		if err := r.Client.List(ctx, &instrumentationConfigs); err != nil {
			return nil, err
		}
		for _, ic := range instrumentationConfigs.Items {
			sources = append(sources, ic.Spec.ServiceName)
		}

	case "namespace":
		for _, namespace := range destination.Spec.SourceFilter.Namespaces {
			var instrumentationConfigs v1.InstrumentationConfigList
			listOptions := &client.ListOptions{Namespace: namespace}
			if err := r.Client.List(ctx, &instrumentationConfigs, listOptions); err != nil {
				return nil, err
			}
			for _, ic := range instrumentationConfigs.Items {
				sources = append(sources, ic.Spec.ServiceName)
			}
		}

	case "groups":
		for _, group := range destination.Spec.SourceFilter.Groups {
			groupLabel := fmt.Sprintf("odigos.io/group.%s", group)
			labelSelector := labels.SelectorFromSet(map[string]string{groupLabel: "true"})
			var instrumentationConfigs v1.InstrumentationConfigList
			listOptions := &client.ListOptions{
				LabelSelector: labelSelector,
			}
			if err := r.Client.List(ctx, &instrumentationConfigs, listOptions); err != nil {
				return nil, err
			}
			for _, ic := range instrumentationConfigs.Items {
				sources = append(sources, ic.Spec.ServiceName)
			}
		}
	}
	fmt.Println("Resolved sources", "sources", sources)
	return sources, nil
}

func (r *DestinationReconciler) updateCollectorConfig(ctx context.Context, destination v1.Destination, sources []string) error {
	return nil

	// var configMap v1.ConfigMap
	// if err := r.Client.Get(ctx, client.ObjectKey{Namespace: "odigos-system", Name: "otel-collector-config"}, &configMap); err != nil {
	// 	return err
	// }

	// // Generate routing rules
	// routingTable := r.generateRoutingRules(destination, sources)

	// // Update the ConfigMap with new routing rules
	// collectorConfig := map[string]interface{}{}
	// if err := yaml.Unmarshal([]byte(configMap.Data["config.yaml"]), &collectorConfig); err != nil {
	// 	return err
	// }

	// collectorConfig["connectors"] = map[string]interface{}{
	// 	"routing": map[string]interface{}{"table": routingTable},
	// }

	// updatedConfig, err := yaml.Marshal(collectorConfig)
	// if err != nil {
	// 	return err
	// }

	// configMap.Data["config.yaml"] = string(updatedConfig)
	// return r.Client.Update(ctx, &configMap)
}

func (r *DestinationReconciler) generateRoutingRules(destination v1.Destination, sources []string) []map[string]interface{} {
	var routingRules []map[string]interface{}

	for _, source := range sources {
		routingRules = append(routingRules, map[string]interface{}{
			"exporters": []string{fmt.Sprintf("otlp/%s", destination.Name)},
			"condition": fmt.Sprintf(`resource.attributes["service.name"] == "%s"`, source),
		})
	}

	return routingRules
}

// SetupWithManager sets up the controller with the Manager.
func (r *DestinationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1.Destination{}).
		// auto scaler only cares about the spec of each destination.
		// filter out events on resource status and metadata changes.
		WithEventFilter(&predicate.GenerationChangedPredicate{}).
		Complete(r)
}
