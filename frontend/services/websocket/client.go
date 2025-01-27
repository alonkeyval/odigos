package websocketclient

import (
	"log"
	"net/url"

	"github.com/gorilla/websocket"
)

// WebSocketClient manages the WebSocket connection
type WebSocketClient struct {
	conn   *websocket.Conn
	apiKey string
}

// NewWebSocketClient connects to the centralized backend WebSocket
func NewWebSocketClient(serverAddr, clusterID string) (*WebSocketClient, error) {
	u := url.URL{Scheme: "ws", Host: serverAddr, Path: "/ws", RawQuery: "cluster_id=" + clusterID}

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return nil, err
	}

	log.Printf("[INFO] Connected to WebSocket server at %s\n", u.String())
	return &WebSocketClient{conn: conn}, nil
}

// SendMessage sends a message to the WebSocket server with API Key
func (w *WebSocketClient) SendMessage(data map[string]interface{}) error {
	data["api_key"] = w.apiKey // Include API key in each message
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
