package websocketclient

import (
	"log"
	"net/http"
	"net/url"

	"github.com/gorilla/websocket"
)

// WebSocketClient manages the WebSocket connection
type WebSocketClient struct {
	conn   *websocket.Conn
	apiKey string
}

// NewWebSocketClient connects to the centralized backend WebSocket
func NewWebSocketClient(serverAddr, clusterID, apiKey string) (*WebSocketClient, error) {
	u := url.URL{Scheme: "ws", Host: serverAddr, Path: "/ws", RawQuery: "cluster_id=" + clusterID}

	headers := http.Header{}
	headers.Set("Authorization", apiKey)

	conn, _, err := websocket.DefaultDialer.Dial(u.String(), headers)
	if err != nil {
		return nil, err
	}

	log.Printf("[INFO] Connected to WebSocket server at %s\n", u.String())
	return &WebSocketClient{conn: conn, apiKey: apiKey}, nil
}

// SendMessage sends a message to the WebSocket server with API Key
func (w *WebSocketClient) SendMessage(data map[string]interface{}) error {
	data["api_key"] = w.apiKey
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
