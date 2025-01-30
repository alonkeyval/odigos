package centralbackend

import (
	"context"
	"log"
	"time"

	"github.com/odigos-io/odigos/frontend/services/websocket"
)

// ComputePlatform represents the GraphQL ComputePlatform type
type ComputePlatform struct {
	ComputePlatformType string               `json:"computePlatformType"`
	ApiTokens           []ApiToken           `json:"apiTokens"`
	K8sActualNamespaces []K8sActualNamespace `json:"k8sActualNamespaces"`
}

// ApiToken represents API tokens in ComputePlatform
type ApiToken struct {
	Token     string `json:"token"`
	Name      string `json:"name"`
	IssuedAt  int    `json:"issuedAt"`
	ExpiresAt int    `json:"expiresAt"`
}

// K8sActualNamespace represents Kubernetes namespace details
type K8sActualNamespace struct {
	Name             string            `json:"name"`
	Selected         bool              `json:"selected"`
	K8sActualSources []K8sActualSource `json:"k8sActualSources"`
}

// K8sActualSource represents Kubernetes sources
type K8sActualSource struct {
	Namespace         string `json:"namespace"`
	Name              string `json:"name"`
	Kind              string `json:"kind"`
	NumberOfInstances int    `json:"numberOfInstances"`
	Selected          bool   `json:"selected"`
}

// GetFakeComputePlatform generates fake ComputePlatform data
func GetFakeComputePlatform() ComputePlatform {
	return ComputePlatform{
		ComputePlatformType: "K8S",
		ApiTokens: []ApiToken{
			{Token: "fake-token-123", Name: "test-token", IssuedAt: 1716502456, ExpiresAt: 1726502456},
		},
		K8sActualNamespaces: []K8sActualNamespace{
			{
				Name:     "default",
				Selected: true,
				K8sActualSources: []K8sActualSource{
					{Name: "nginx", Namespace: "default", Kind: "Deployment", NumberOfInstances: 3, Selected: true},
				},
			},
		},
	}
}

// SendComputePlatformData sends ComputePlatform data over WebSocket
func SendComputePlatformData(ctx context.Context, client *websocket.WebSocketClient) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			data := GetFakeComputePlatform()

			err := client.Send(data)
			if err != nil {
				log.Printf("[ERROR] Failed to send ComputePlatform data: %v", err)
			} else {
				log.Println("[INFO] Sent ComputePlatform data to central backend")
			}
		}
	}
}
