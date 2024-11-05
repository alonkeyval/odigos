package sse

import (
	"sync"
)

type MessageType string

const (
	MessageTypeSuccess MessageType = "success"
	MessageTypeError   MessageType = "error"
)

type MessageEvent string

const (
	MessageEventDeleted  MessageEvent = "Deleted"
	MessageEventModified MessageEvent = "Modified"
	MessageEventAdded    MessageEvent = "Added"
)

type SSEMessage struct {
	Type    MessageType  `json:"type"`
	Data    string       `json:"data"`
	Event   MessageEvent `json:"event"`
	Target  string       `json:"target"`
	CRDType string       `json:"crdType"`
}

// This map will hold channels for each client connected to the SSE endpoint
var (
	clients   = make(map[chan SSEMessage]bool)
	clientsMu sync.Mutex
)

func RegisterClient() chan SSEMessage {
	messageChan := make(chan SSEMessage)
	clientsMu.Lock()
	clients[messageChan] = true
	clientsMu.Unlock()
	return messageChan
}

// UnregisterClient removes a client from the map.
func UnregisterClient(messageChan chan SSEMessage) {
	clientsMu.Lock()
	delete(clients, messageChan)
	clientsMu.Unlock()
	close(messageChan)
}

// Function to send a message to all clients
func SendMessageToClient(message SSEMessage) {
	clientsMu.Lock()
	defer clientsMu.Unlock()

	for client := range clients {
		select {
		case client <- message:
		default:

		}
	}
}
