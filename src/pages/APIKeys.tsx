import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { getAPIKeys, createAPIKey, deleteAPIKey } from '../lib/api';
import type { APIKey } from '../lib/api';

const APIKeys = () => {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        const apiKeys = await getAPIKeys();
        setKeys(apiKeys);
      } catch (error) {
        console.error('Failed to fetch API keys:', error);
      }
    };

    fetchKeys();
  }, []);

  const handleCreateKey = async () => {
    if (!keyName.trim()) return;

    try {
      const key = await createAPIKey(keyName);
      setKeys([key, ...keys]);
      setNewKey(key.key || null);
      setKeyName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await deleteAPIKey(id);
      setKeys(keys.filter((k) => k.id !== id));
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      alert('API key copied to clipboard');
    } catch (error) {
      console.error('Failed to copy API key:', error);
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-orbitron text-lg font-semibold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" />
            API Keys
          </h2>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
            Create New Key
          </Button>
        </div>

        {keys.length > 0 ? (
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{key.name}</span>
                  <span className="text-sm text-white/40">
                    {new Date(key.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <code className="flex-1 font-mono text-sm text-cyan-400 bg-black/30 px-3 py-2 rounded-lg">
                    {key.key_prefix}********************
                  </code>
                  <button
                    onClick={() => handleCopyKey(key.key || '')}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/40">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No API keys created</p>
            <p className="text-sm">Create an API key to integrate with your applications</p>
          </div>
        )}
      </Card>

      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowCreateModal(false);
            setNewKey(null);
          }}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full"
          >
            <h3 className="font-orbitron text-lg font-semibold text-white mb-4">
              Create API Key
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Key Name</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., My Application"
                  className="input-field"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {newKey && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <p className="text-sm text-green-400 mb-2">Your API key has been created:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm text-white bg-black/30 px-3 py-2 rounded-lg break-all">
                      {newKey}
                    </code>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyKey(newKey);
                      }}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    This key will only be shown once. Save it in a secure location.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKey(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateKey();
                  }}
                  className="flex-1"
                  disabled={!keyName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default APIKeys;
