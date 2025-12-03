'use client';

import { useState, useEffect } from 'react';
import { Trash2, Copy, Plus, Key } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/admin/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (error) {
      console.error('Failed to fetch keys', error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setKeys([...keys, data]);
        setGeneratedKey(data.key);
        setNewKeyName('');
      }
    } catch (error) {
      console.error('Failed to generate key', error);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const res = await fetch(`/api/admin/keys?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete key', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Unified API Endpoint</h2>
        <div className="bg-gray-950 p-4 rounded-lg flex items-center justify-between font-mono text-sm text-gray-300 border border-gray-700">
          <span>{process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/unified?query=SONG_NAME&apiKey=YOUR_KEY</span>
          <button
            onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/unified?query=SONG_NAME&apiKey=YOUR_KEY`)}
            className="p-2 hover:bg-gray-800 rounded-md transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-6">API Keys</h2>

        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Enter key name (e.g., Mobile App)"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={generateKey}
            disabled={!newKeyName.trim()}
            className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Generate Key
          </button>
        </div>

        {generatedKey && (
          <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-lg mb-8">
            <p className="text-green-400 text-sm mb-2">New API Key Generated! Copy it now, you won't see it again.</p>
            <div className="flex items-center justify-between font-mono bg-gray-950 p-3 rounded border border-green-500/30">
              <span className="text-green-300">{generatedKey}</span>
              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="text-green-400 hover:text-green-300"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No API keys found. Generate one to get started.</div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div key={key.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">{key.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">Prefix: {key.key.substring(0, 8)}...</p>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Revoke Key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}