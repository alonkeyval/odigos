package websocketclient

import (
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocketClient manages the WebSocket connection
type WebSocketClient struct {
	conn      *websocket.Conn
	clusterID string
}

// NewWebSocketClient connects to the centralized backend WebSocket
func NewWebSocketClient(serverAddr, clusterID string) (*WebSocketClient, error) {
	u := url.URL{Scheme: "ws", Host: serverAddr, Path: "/ws", RawQuery: "cluster_id=" + clusterID}

	headers := http.Header{}

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), headers)
	if err != nil {
		return nil, err
	}

	log.Printf("[INFO] Connected to WebSocket server at %s\n", u.String())
	return &WebSocketClient{conn: conn, clusterID: clusterID}, nil
}

// SendMessage sends a message to the WebSocket server
func (w *WebSocketClient) SendMessage(data map[string]interface{}) error {

	return w.conn.WriteJSON(data)
}

// ReceiveMessages listens for responses
func (w *WebSocketClient) ReceiveMessages() {
	for {
		var message map[string]interface{}
		err := w.conn.ReadJSON(&message)
		if err != nil {
			log.Println("[INFO] WebSocket connection closed")
			break
		}
		log.Printf("[INFO] Received from server: %v\n", message)
	}
}

// StartWebSocketServer initializes the WebSocket connection and sends periodic data
func StartWebSocketServer(serverAddr, clusterID string) {
	log.Printf("[INFO] Starting WebSocket connection to %s with cluster ID %s\n", serverAddr, clusterID)

	client, err := NewWebSocketClient(serverAddr, clusterID)
	if err != nil {
		log.Printf("[ERROR] Failed to connect to WebSocket server: %v", err)
		return
	}

	// Start listening for messages
	go client.ReceiveMessages()

	// Send messages every 30 seconds
	for {
		data := map[string]interface{}{
			"cluster":    clusterID,
			"namespaces": []string{"default", "kube-system"},
		}

		err := client.SendMessage(data)
		if err != nil {
			log.Printf("[ERROR] Failed to send data: %v\n", err)
		} else {
			log.Printf("[INFO] Sent cluster data: %v\n", data)
		}

		time.Sleep(30 * time.Second)
	}
}
