import React, { useState } from 'react';
import { X, CloudUpload, CloudDownload } from 'lucide-react';
import { pushToNetlify, pullFromNetlify } from '../utils/netlifySync';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePush = async () => {
    try {
      setIsLoading(true);
      setStatus('Pushing data to Netlify Blobs...');
      await pushToNetlify();
      setStatus('Successfully synced to cloud!');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 4000);
    }
  };

  const handlePull = async () => {
    if (!confirm('This will overwrite your local data. Are you sure?')) return;
    try {
      setIsLoading(true);
      setStatus('Pulling data from Netlify Blobs...');
      await pullFromNetlify();
      setStatus('Successfully pulled! UI will update automatically.');
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus(''), 4000);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-secondary)' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>Netlify Sync</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>
          Keep your data in sync across devices using Netlify's built-in native Blobs storage. No extra configuration or database required!
        </p>

        {status && (
          <div style={{ padding: '12px', borderRadius: '8px', background: status.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: status.includes('Error') ? 'var(--accent-danger)' : 'var(--accent-success)', marginBottom: '20px', fontSize: '14px' }}>
            {status}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={handlePush}
            disabled={isLoading}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', borderRadius: '12px', background: 'var(--text-primary)', color: 'var(--bg-dark)', fontWeight: 'bold', fontSize: '16px', opacity: isLoading ? 0.5 : 1 }}
          >
            <CloudUpload size={28} /> 
            <span>Push to Netlify</span>
          </button>
          
          <button 
            onClick={handlePull}
            disabled={isLoading}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '16px', opacity: isLoading ? 0.5 : 1 }}
          >
            <CloudDownload size={28} />
            <span>Pull to Device</span>
          </button>
        </div>
      </div>
    </div>
  );
};
