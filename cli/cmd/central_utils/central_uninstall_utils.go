package central_utils

import (
	"context"
	"fmt"

	"github.com/odigos-io/odigos/api/k8sconsts"
	"github.com/odigos-io/odigos/cli/pkg/kube"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func UninstallCentralDeployments(ctx context.Context, client *kube.Client, ns string) error {
	list, err := client.AppsV1().Deployments(ns).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("%s=true", k8sconsts.OdigosSystemLabelCentralKey),
	})
	if err != nil {
		return err
	}
	for _, item := range list.Items {
		err = client.AppsV1().Deployments(ns).Delete(ctx, item.Name, metav1.DeleteOptions{})
		if err != nil {
			return err
		}
	}
	return nil
}

func UninstallCentralServices(ctx context.Context, client *kube.Client, ns string) error {
	list, err := client.CoreV1().Services(ns).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("%s=true", k8sconsts.OdigosSystemLabelCentralKey),
	})
	if err != nil {
		return err
	}
	for _, item := range list.Items {
		err = client.CoreV1().Services(ns).Delete(ctx, item.Name, metav1.DeleteOptions{})
		if err != nil {
			return err
		}
	}
	return nil
}

func UninstallCentralConfigMaps(ctx context.Context, client *kube.Client, ns string) error {
	list, err := client.CoreV1().ConfigMaps(ns).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("%s=true", k8sconsts.OdigosSystemLabelCentralKey),
	})
	if err != nil {
		return err
	}
	for _, item := range list.Items {
		err = client.CoreV1().ConfigMaps(ns).Delete(ctx, item.Name, metav1.DeleteOptions{})
		if err != nil {
			return err
		}
	}
	return nil
}

func UninstallCentralSecrets(ctx context.Context, client *kube.Client, ns string) error {
	list, err := client.CoreV1().Secrets(ns).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("%s=true", k8sconsts.OdigosSystemLabelCentralKey),
	})
	if err != nil {
		return err
	}
	for _, item := range list.Items {
		err = client.CoreV1().Secrets(ns).Delete(ctx, item.Name, metav1.DeleteOptions{})
		if err != nil {
			return err
		}
	}
	return nil
}

func UninstallCentralRBAC(ctx context.Context, client *kube.Client, ns string) error {
	clusterRoles, err := client.RbacV1().ClusterRoles().List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("%s=true", k8sconsts.OdigosSystemLabelCentralKey),
	})
	if err != nil {
		return err
	}
	for _, role := range clusterRoles.Items {
		err = client.RbacV1().ClusterRoles().Delete(ctx, role.Name, metav1.DeleteOptions{})
		if err != nil {
			return err
		}
	}

	roleBindings, err := client.RbacV1().ClusterRoleBindings().List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("%s=true", k8sconsts.OdigosSystemLabelCentralKey),
	})
	if err != nil {
		return err
	}
	for _, rb := range roleBindings.Items {
		err = client.RbacV1().ClusterRoleBindings().Delete(ctx, rb.Name, metav1.DeleteOptions{})
		if err != nil {
			return err
		}
	}

	return nil
}

func UninstallCentralNamespace(ctx context.Context, client *kube.Client, ns string) error {
	return client.CoreV1().Namespaces().Delete(ctx, ns, metav1.DeleteOptions{})
}
