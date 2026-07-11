import React, { useState } from 'react';
import { X, Trash2, ShieldAlert, Key, Link, Settings2, Sparkles, Volume2 } from 'lucide-react';
import api from '../utils/api';

export default function SettingsModal({ currentSettings, onSave, onClose }) {
  const [provider, setProvider] = useState(currentSettings.provider);
  const [apiKey, setApiKey] = useState(currentSettings.apiKey);
  const [lmStudioUrl, setLmStudioUrl] = useState(currentSettings.lmStudioUrl);
  const [systemPrompt, setSystemPrompt] = useState(currentSettings.systemPrompt);
  const [ragEnabled, setRagEnabled] = useState(currentSettings.ragEnabled);
  const [savePdfToDb, setSavePdfToDb] = useState(currentSettings.savePdfToDb || false);
  const [useExternalVoice, setUseExternalVoice] = useState(currentSettings.useExternalVoice);
  const [voiceName, setVoiceName] = useState(currentSettings.voiceName);
  const [voiceRate, setVoiceRate] = useState(currentSettings.voiceRate);
  const [assemblyApiKey, setAssemblyApiKey] = useState(currentSettings.assemblyApiKey || '');
  const [ytExtractionMode, setYtExtractionMode] = useState(currentSettings.ytExtractionMode || 'local');
  const [formProfile, setFormProfile] = useState(currentSettings.formProfile || []);
  const [activeTab, setActiveTab] = useState('general');

  const [clearingDb, setClearingDb] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  const handleSave = () => {
    onSave({
      provider,
      apiKey,
      lmStudioUrl,
      systemPrompt,
      ragEnabled,
      savePdfToDb,
      useExternalVoice,
      voiceName,
      voiceRate,
      assemblyApiKey,
      ytExtractionMode,
      formProfile
    });
    onClose();
  };

  const handleClearVectorDb = async () => {
    if (!window.confirm('Are you sure you want to permanently clear the Vector Database? This will erase all webpage memories.')) {
      return;
    }
    setClearingDb(true);
    try {
      await api.clearVectorDb();
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
    } catch (err) {
      alert('Failed to clear Vector DB: ' + err.message);
    } finally {
      setClearingDb(false);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        .settings-modal-wrapper {
          max-width: 640px;
          width: 100%;
          height: 520px;
          display: flex;
          flex-direction: column;
          padding: 0;
          overflow: hidden;
          background: #121318 !important; /* Premium dark background */
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5);
        }
        
        .settings-modal-header-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: #ffffff !important; /* Pure white contrast */
        }

        .settings-modal-tab-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6) !important; /* Bright silver text */
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }
        .settings-modal-tab-btn:hover {
          background: rgba(255, 255, 255, 0.04);
          color: #ffffff !important;
        }
        .settings-modal-tab-btn.active {
          background: var(--color-primary, #ca8a04) !important;
          color: #ffffff !important;
        }
        
        .settings-modal-content-title {
          margin: 0 0 16px 0;
          font-size: 15px;
          font-weight: 700;
          color: #ffffff !important; /* Pure white headers */
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 8px;
        }
        
        .settings-modal-label {
          font-weight: 600;
          font-size: 12px;
          margin-bottom: 6px;
          display: block;
          color: rgba(255, 255, 255, 0.8) !important; /* Readable off-white */
        }
        
        .settings-modal-checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.85) !important;
          font-size: 13px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        
        .settings-modal-checkbox-row input {
          cursor: pointer;
          accent-color: var(--color-primary, #ca8a04);
        }
        
        .settings-modal-textarea, .settings-modal-input, .settings-modal-select {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px;
          color: #ffffff !important; /* High contrast typing text */
          padding: 8px 12px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .settings-modal-textarea:focus, .settings-modal-input:focus, .settings-modal-select:focus {
          border-color: var(--color-primary, #ca8a04) !important;
        }
        
        .settings-modal-tip {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.45) !important; /* Secondary description text */
          margin-top: 4px;
          display: block;
          line-height: 1.4;
        }
        
        .settings-modal-sidebar {
          width: 180px;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.01);
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .settings-modal-content-area {
          flex: 1;
          padding: 20px 24px;
          overflow-y: auto;
          background: #121318;
        }
      `}</style>
      
      <div className="modal-content glass-card animate-scale-up settings-modal-wrapper">
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121318' }}>
          <div className="header-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 className="header-icon" size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 className="settings-modal-header-title">Settings</h2>
          </div>
          <button onClick={onClose} className="close-modal-btn" style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Settings Container */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          
          {/* Left Navigation Sidebar */}
          <div className="settings-modal-sidebar">
            <button 
              onClick={() => setActiveTab('general')}
              className={`settings-modal-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            >
              <Volume2 size={15} />
              <span>General</span>
            </button>
            <button 
              onClick={() => setActiveTab('models')}
              className={`settings-modal-tab-btn ${activeTab === 'models' ? 'active' : ''}`}
            >
              <Key size={15} />
              <span>APIs & Models</span>
            </button>
            <button 
              onClick={() => setActiveTab('autofill')}
              className={`settings-modal-tab-btn ${activeTab === 'autofill' ? 'active' : ''}`}
            >
              <Settings2 size={15} />
              <span>Auto-Fill Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab('memory')}
              className={`settings-modal-tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
            >
              <Sparkles size={15} />
              <span>Memory & RAG</span>
            </button>
          </div>

          {/* Right Contents Area */}
          <div className="settings-modal-content-area">
            {activeTab === 'general' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="settings-modal-content-title">General Configuration</h3>
                
                {/* System Prompt */}
                <div className="form-group">
                  <label className="settings-modal-label">System Instruction</label>
                  <textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={4}
                    placeholder="You are LAKSHYA..."
                    className="settings-modal-textarea"
                  />
                </div>

                {/* Voice Rate */}
                <div className="form-group">
                  <label className="settings-modal-label">Speech Reading Rate: {voiceRate}x</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0" 
                    step="0.1"
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="setting-slider"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* OpenAI Audio Voice Selector */}
                <div style={{ marginTop: '8px' }}>
                  <label className="settings-modal-checkbox-row">
                    <input 
                      type="checkbox"
                      checked={useExternalVoice}
                      onChange={(e) => setUseExternalVoice(e.target.checked)}
                    />
                    Use OpenAI High-Quality Voice
                  </label>
                </div>

                {useExternalVoice && (
                  <div className="form-group animate-fade-in">
                    <label className="settings-modal-label">OpenAI Voice Model</label>
                    <select 
                      value={voiceName} 
                      onChange={(e) => setVoiceName(e.target.value)}
                      className="settings-modal-select"
                    >
                      <option value="alloy">Alloy (Neutral/Balanced)</option>
                      <option value="echo">Echo (Warm/Mellow)</option>
                      <option value="fable">Fable (Narrative/Expressive)</option>
                      <option value="onyx">Onyx (Deep/Professional)</option>
                      <option value="nova">Nova (Bright/Energetic)</option>
                      <option value="shimmer">Shimmer (Professional/Clear)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'models' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="settings-modal-content-title">APIs & Model Engines</h3>
                
                {/* AI Provider */}
                <div className="form-group">
                  <label className="settings-modal-label">Model Engine</label>
                  <select 
                    value={provider} 
                    onChange={(e) => setProvider(e.target.value)}
                    className="settings-modal-select"
                  >
                    <option value="local">LM Studio (Local Host)</option>
                    <option value="openrouter">OpenRouter (API Cloud)</option>
                  </select>
                </div>

                {/* API Key / Base URL */}
                {provider === 'local' ? (
                  <div className="form-group">
                    <label className="settings-modal-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Link size={12} /> LM Studio Server URL
                    </label>
                    <input 
                      type="text" 
                      value={lmStudioUrl}
                      onChange={(e) => setLmStudioUrl(e.target.value)}
                      placeholder="http://localhost:1234/v1"
                      className="settings-modal-input"
                    />
                    <span className="settings-modal-tip">Ensure your LM Studio local server is active.</span>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="settings-modal-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Key size={12} /> OpenRouter API Key
                    </label>
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="settings-modal-input"
                    />
                  </div>
                )}

                {/* YouTube Transcription settings */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>YouTube Subtitles Extraction</h4>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="settings-modal-label">Transcription Engine</label>
                    <select 
                      value={ytExtractionMode} 
                      onChange={(e) => setYtExtractionMode(e.target.value)}
                      className="settings-modal-select"
                    >
                      <option value="local">Local Caption Scraper (Fast / Free)</option>
                      <option value="assembly">AssemblyAI Audio Transcriber (Cloud)</option>
                    </select>
                  </div>

                  {ytExtractionMode === 'assembly' && (
                    <div className="form-group animate-fade-in">
                      <label className="settings-modal-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Key size={12} /> AssemblyAI API Key
                      </label>
                      <input 
                        type="password" 
                        value={assemblyApiKey}
                        onChange={(e) => setAssemblyApiKey(e.target.value)}
                        placeholder="Enter AssemblyAI API Key"
                        className="settings-modal-input"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'autofill' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                <h3 className="settings-modal-content-title">Auto-Fill Profile</h3>
                <span className="settings-modal-tip" style={{ marginBottom: '8px' }}>
                  Define custom variables (e.g. `rollNo`, `skills`, `name`) that LAKSHYA will dynamically map and fill into web forms.
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, maxHeight: '240px', paddingRight: '4px' }}>
                  {formProfile.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={item.key} 
                        onChange={(e) => {
                          const updated = [...formProfile];
                          updated[idx].key = e.target.value;
                          setFormProfile(updated);
                        }}
                        placeholder="Key (e.g. rollNo)"
                        className="settings-modal-input"
                        style={{ flex: 1, minWidth: '80px' }}
                      />
                      <input 
                        type="text" 
                        value={item.value} 
                        onChange={(e) => {
                          const updated = [...formProfile];
                          updated[idx].value = e.target.value;
                          setFormProfile(updated);
                        }}
                        placeholder="Value (e.g. 108)"
                        className="settings-modal-input"
                        style={{ flex: 1.5, minWidth: '100px' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = formProfile.filter((_, i) => i !== idx);
                          setFormProfile(updated);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Remove Variable"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  type="button" 
                  onClick={() => setFormProfile([...formProfile, { key: '', value: '' }])}
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 12px', width: 'fit-content', cursor: 'pointer' }}
                >
                  + Add Custom Variable
                </button>
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="settings-modal-content-title">Memory & Knowledge Base</h3>
                
                {/* RAG toggles */}
                <div>
                  <label className="settings-modal-checkbox-row">
                    <input 
                      type="checkbox"
                      checked={ragEnabled}
                      onChange={(e) => setRagEnabled(e.target.checked)}
                    />
                    Enable Semantic Vector Search (RAG)
                  </label>
                </div>

                <div>
                  <label className="settings-modal-checkbox-row">
                    <input 
                      type="checkbox"
                      checked={savePdfToDb}
                      onChange={(e) => setSavePdfToDb(e.target.checked)}
                    />
                    Save uploaded PDFs to database
                  </label>
                </div>

                {/* Clear Database */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={14} /> Danger Zone
                  </h4>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '0 0 12px 0' }}>
                    Permanently wipe your vectorized web history and document indexing from ChromaDB. This cannot be undone.
                  </p>
                  <button 
                    onClick={handleClearVectorDb}
                    disabled={clearingDb}
                    className="danger-outline-btn"
                    style={{ cursor: 'pointer', border: '1px solid rgba(248, 113, 113, 0.4)', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}
                  >
                    <Trash2 size={14} /> 
                    {clearingDb ? 'Clearing...' : clearSuccess ? 'Cleared Memory!' : 'Clear Vector DB'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: '#121318' }}>
          <button onClick={onClose} className="btn-secondary" style={{ cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} className="btn-primary" style={{ cursor: 'pointer' }}>Save Settings</button>
        </div>

      </div>
    </div>
  );
}
