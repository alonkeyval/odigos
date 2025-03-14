package odigospro

import (
	"github.com/odigos-io/odigos/api/k8sconsts"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func newOdigosProSecret(ns string, cloudApiKey string, onpremToken string) *corev1.Secret {

	data := map[string]string{}
	if cloudApiKey != "" {
		data[k8sconsts.OdigosCloudApiKeySecretKey] = cloudApiKey
	}
	if onpremToken != "" {
		data[k8sconsts.OdigosOnpremTokenSecretKey] = onpremToken
	}

	return &corev1.Secret{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Secret",
			APIVersion: "v1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      k8sconsts.OdigosProSecretName,
			Namespace: ns,
		},
		StringData: data,
	}
}
