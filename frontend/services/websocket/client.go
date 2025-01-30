package websocket

import (
	"context"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
	"github.com/odigos-io/odigos/frontend/kube"
	"github.com/odigos-io/odigos/k8sutils/pkg/env"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const configMapName = "odigos-config"
const wsURLKey = "central-backend-url"

// WebSocketClient manages the WebSocket connection
type WebSocketClient struct {
	conn *websocket.Conn
	url  string
}

// GetWebSocketURL retrieves the WebSocket URL from the ConfigMap
func GetWebSocketURL(ctx context.Context) (string, error) {
	ns := env.GetCurrentNamespace()

	configMap, err := kube.DefaultClient.CoreV1().ConfigMaps(ns).Get(ctx, configMapName, metav1.GetOptions{})
	if err != nil {
		log.Printf("[ERROR] Failed to get ConfigMap: %v", err)
		return "", err
	}

	wsURL, exists := configMap.Data[wsURLKey]
	if !exists || wsURL == "" {
		log.Println("[ERROR] WebSocket URL not found in ConfigMap")
		return "", nil
	}

	return wsURL, nil
}

// NewWebSocketClient initializes the WebSocket connection
func NewWebSocketClient(ctx context.Context) (*WebSocketClient, error) {
	wsURL, err := GetWebSocketURL(ctx)
	if err != nil || wsURL == "" {
		log.Println("[ERROR] CENTRAL_BACKEND_WS_URL is missing. Skipping WebSocket connection.")
		return nil, err
	}

	u := url.URL{Scheme: "ws", Host: wsURL, Path: "/ws"}

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), http.Header{})
	if err != nil {
		log.Printf("[ERROR] Failed to connect to WebSocket server: %v", err)
		return nil, err
	}

	log.Printf("[INFO] Connected to WebSocket server at %s", u.String())

	return &WebSocketClient{conn: conn, url: wsURL}, nil
}

// Listen handles incoming WebSocket messages
func (w *WebSocketClient) Listen() {
	if w.conn == nil {
		return
	}

	for {
		var message map[string]interface{}
		err := w.conn.ReadJSON(&message)
		if err != nil {
			log.Println("[ERROR] WebSocket connection lost. Reconnecting...")
			w.Reconnect()
			continue
		}
		log.Printf("[INFO] Received WebSocket message: %v", message)
	}
}

// Reconnect attempts to re-establish the WebSocket connection
func (w *WebSocketClient) Reconnect() {
	for {
		time.Sleep(5 * time.Second)
		client, err := NewWebSocketClient(context.Background())
		if err == nil && client != nil {
			*w = *client
			go w.Listen()
			return
		}
		log.Println("[ERROR] Retrying WebSocket connection...")
	}
}
