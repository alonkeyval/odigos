'use client';

import { useState } from 'react';
import { Input, Button } from '@/reuseable-components';
import { useWebSocketConnection } from '@/hooks/central/useWebSocketConnection';

export default function ConnectPage() {
  const [centralBackendURL, setCentralBackendURL] = useState('');
  const [clusterName, setClusterName] = useState('');

  const { startConnection, loading, error, connected } = useWebSocketConnection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await startConnection({ centralBackendURL, clusterName });
  };

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
      <h2 className='text-xl font-semibold mb-4'>Connect to Central Backend</h2>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <Input type='text' placeholder='Central Backend URL (e.g., ws://localhost:8080)' value={centralBackendURL} onChange={(e) => setCentralBackendURL(e.target.value)} required />

        <Input type='text' placeholder='Cluster Name' value={clusterName} onChange={(e) => setClusterName(e.target.value)} required />

        <Button type='submit' disabled={loading} className='w-full'>
          {loading ? 'Connecting...' : 'Connect'}
        </Button>
      </form>

      {error && <p className='text-red-500 mt-2'>{error}</p>}
      {connected && <p className='text-green-500 mt-2'>Connected successfully!</p>}
    </div>
  );
}
