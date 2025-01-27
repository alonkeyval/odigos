package central_sync

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// FetchClusterData retrieves namespaces from the client cluster
func FetchClusterData() (map[string]interface{}, error) {
	log.Println("[DEBUG] FetchClusterData: Fetching data from Kubernetes cluster")

	clientset, err := GetK8sClient()
	if err != nil {
		log.Printf("[ERROR] FetchClusterData: Failed to get K8s client: %v\n", err)
		return nil, err
	}

	namespaces, err := clientset.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		log.Printf("[ERROR] FetchClusterData: Failed to list namespaces: %v\n", err)
		return nil, err
	}

	var namespaceList []string
	for _, ns := range namespaces.Items {
		namespaceList = append(namespaceList, ns.Name)
	}

	log.Printf("[DEBUG] FetchClusterData: Retrieved namespaces: %v\n", namespaceList)

	data := map[string]interface{}{
		"cluster":    os.Getenv("CLUSTER_NAME"),
		"namespaces": namespaceList,
	}

	return data, nil
}

// SendClusterData sends collected data to the central backend
func SendClusterData() error {
	log.Println("[DEBUG] SendClusterData: Starting data send")

	centralURL := os.Getenv("CENTRAL_BACKEND_URL")
	if centralURL == "" {
		log.Println("[ERROR] SendClusterData: CENTRAL_BACKEND_URL is not set")
		return fmt.Errorf("CENTRAL_BACKEND_URL is not set")
	}

	// Fetch cluster data
	data, err := FetchClusterData()
	if err != nil {
		log.Printf("[ERROR] SendClusterData: Failed to fetch cluster data: %v\n", err)
		return err
	}

	// Convert data to JSON
	payload, err := json.Marshal(data)
	if err != nil {
		log.Printf("[ERROR] SendClusterData: Failed to marshal JSON: %v\n", err)
		return err
	}

	// Create HTTP request
	req, _ := http.NewRequest("POST", centralURL, bytes.NewBuffer(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+os.Getenv("API_KEY"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[ERROR] SendClusterData: HTTP request failed: %v\n", err)
		return err
	}
	defer resp.Body.Close()

	log.Printf("[INFO] SendClusterData: Sent cluster data, response status: %s\n", resp.Status)

	return nil
}

// StartPeriodicSync runs data sync every 30 seconds
func StartPeriodicSync() {
	log.Println("[DEBUG] StartPeriodicSync: Starting periodic data sync")

	go func() {
		for {
			err := SendClusterData()
			if err != nil {
				log.Printf("[ERROR] StartPeriodicSync: Failed to send data: %v\n", err)
			}
			time.Sleep(30 * time.Second) // Adjust as needed
		}
	}()
}

// GetK8sClient initializes Kubernetes client
func GetK8sClient() (*kubernetes.Clientset, error) {
	log.Println("[DEBUG] GetK8sClient: Initializing Kubernetes client")

	var config *rest.Config
	var err error

	// Try in-cluster config first
	config, err = rest.InClusterConfig()
	if err != nil {
		log.Println("[WARN] GetK8sClient: In-cluster config not found, falling back to kubeconfig")

		// Fallback to local kubeconfig
		kubeconfig := os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			kubeconfig = os.ExpandEnv("$HOME/.kube/config")
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			log.Printf("[ERROR] GetK8sClient: Failed to load kubeconfig: %v\n", err)
			return nil, err
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Printf("[ERROR] GetK8sClient: Failed to create clientset: %v\n", err)
		return nil, err
	}

	return clientset, nil
}
