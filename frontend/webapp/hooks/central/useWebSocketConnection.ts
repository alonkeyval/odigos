import { API_BASE_URL } from '@/utils';
import { useState } from 'react';

interface WebSocketConfig {
  centralBackendURL: string;
  clusterName: string;
}

export function useWebSocketConnection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const startConnection = async ({ centralBackendURL, clusterName }: WebSocketConfig) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ws/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ central_backend_url: centralBackendURL, cluster_name: clusterName }),
      });

      if (!response.ok) {
        throw new Error('Failed to start WebSocket connection.');
      }

      setConnected(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return { startConnection, loading, error, connected };
}
