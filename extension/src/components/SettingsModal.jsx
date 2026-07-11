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
      <div className="modal-content glass-card animate-scale-up" style={{ maxWidth: '640px', width: '100%', height: '520px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-title-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 className="header-icon" size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Settings</h2>
          </div>
          <button onClick={onClose} className="close-modal-btn" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Settings Container (Split into Sidebar + Content) */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          
          {/* Left Navigation Sidebar */}
          <div style={{ width: '180px', borderRight: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.02)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              onClick={() => setActiveTab('general')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: activeTab === 'general' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'general' ? 'white' : 'var(--text-secondary)',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)'
              }}
            >
              <Volume2 size={15} />
              <span>General</span>
            </button>
            <button 
              onClick={() => setActiveTab('models')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: activeTab === 'models' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'models' ? 'white' : 'var(--text-secondary)',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)'
              }}
            >
              <Key size={15} />
              <span>APIs & Models</span>
            </button>
            <button 
              onClick={() => setActiveTab('autofill')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: activeTab === 'autofill' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'autofill' ? 'white' : 'var(--text-secondary)',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)'
              }}
            >
              <Settings2 size={15} />
              <span>Auto-Fill Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab('memory')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', border: 'none',
                background: activeTab === 'memory' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'memory' ? 'white' : 'var(--text-secondary)',
                fontWeight: '600', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)'
              }}
            >
              <Sparkles size={15} />
              <span>Memory & RAG</span>
            </button>
          </div>

          {/* Right Contents Area */}
          <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>
            {activeTab === 'general' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>General Configuration</h3>
                
                {/* System Prompt */}
                <div className="form-group">
                  <label style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'block' }}>System Instruction</label>
                  <textarea 
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={4}
                    placeholder="You are LAKSHYA..."
                    className="setting-textarea"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Voice Rate */}
                <div className="form-group">
                  <label style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Speech Reading Rate: {voiceRate}x</label>
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
                <div className="form-checkbox-row" style={{ marginTop: '8px' }}>
                  <label className="checkbox-container">
                    <input 
                      type="checkbox"
                      checked={useExternalVoice}
                      onChange={(e) => setUseExternalVoice(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Use OpenAI High-Quality Voice
                  </label>
                </div>

                {useExternalVoice && (
                  <div className="form-group animate-fade-in">
                    <label style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'block' }}>OpenAI Voice Model</label>
                    <select 
                      value={voiceName} 
                      onChange={(e) => setVoiceName(e.target.value)}
                      className="setting-input"
                      style={{ width: '100%' }}
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
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>APIs & Model Engines</h3>
                
                {/* AI Provider */}
                <div className="form-group">
                  <label style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Model Engine</label>
                  <select 
                    value={provider} 
                    onChange={(e) => setProvider(e.target.value)}
                    className="setting-input"
                    style={{ width: '100%' }}
                  >
                    <option value="local">LM Studio (Local Host)</option>
                    <option value="openrouter">OpenRouter (API Cloud)</option>
                  </select>
                </div>

                {/* API Key / Base URL */}
                {provider === 'local' ? (
                  <div className="form-group">
                    <label className="label-icon-wrapper" style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Link size={12} /> LM Studio Server URL
                    </label>
                    <input 
                      type="text" 
                      value={lmStudioUrl}
                      onChange={(e) => setLmStudioUrl(e.target.value)}
                      placeholder="http://localhost:1234/v1"
                      className="setting-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                    <span className="input-tip" style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Ensure your LM Studio local server is active.</span>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="label-icon-wrapper" style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Key size={12} /> OpenRouter API Key
                    </label>
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="setting-input"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {/* YouTube Transcription settings */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '700' }}>YouTube Subtitles Extraction</h4>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'block' }}>Transcription Engine</label>
                    <select 
                      value={ytExtractionMode} 
                      onChange={(e) => setYtExtractionMode(e.target.value)}
                      className="setting-input"
                      style={{ width: '100%' }}
                    >
                      <option value="local">Local Caption Scraper (Fast / Free)</option>
                      <option value="assembly">AssemblyAI Audio Transcriber (Cloud)</option>
                    </select>
                  </div>

                  {ytExtractionMode === 'assembly' && (
                    <div className="form-group animate-fade-in">
                      <label className="label-icon-wrapper" style={{ fontWeight: '600', fontSize: '12px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Key size={12} /> AssemblyAI API Key
                      </label>
                      <input 
                        type="password" 
                        value={assemblyApiKey}
                        onChange={(e) => setAssemblyApiKey(e.target.value)}
                        placeholder="Enter AssemblyAI API Key"
                        className="setting-input"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'autofill' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>Auto-Fill Profile</h3>
                <span className="input-tip" style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
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
                        className="setting-input"
                        style={{ flex: 1, minWidth: '80px', boxSizing: 'border-box' }}
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
                        className="setting-input"
                        style={{ flex: 1.5, minWidth: '100px', boxSizing: 'border-box' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const updated = formProfile.filter((_, i) => i !== idx);
                          setFormProfile(updated);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '4px' }}
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
                <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>Memory & Knowledge Base</h3>
                
                {/* RAG toggles */}
                <div className="form-checkbox-row">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox"
                      checked={ragEnabled}
                      onChange={(e) => setRagEnabled(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Enable Semantic Vector Search (RAG)
                  </label>
                </div>

                <div className="form-checkbox-row">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox"
                      checked={savePdfToDb}
                      onChange={(e) => setSavePdfToDb(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Save uploaded PDFs to database
                  </label>
                </div>

                {/* Clear Database */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={14} /> Danger Zone
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                    Permanently wipe your vectorized web history and document indexing from ChromaDB. This cannot be undone.
                  </p>
                  <button 
                    onClick={handleClearVectorDb}
                    disabled={clearingDb}
                    className="danger-outline-btn"
                    style={{ cursor: 'pointer' }}
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
        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} className="btn-primary" style={{ cursor: 'pointer' }}>Save Settings</button>
        </div>

      </div>
    </div>
  );
}
