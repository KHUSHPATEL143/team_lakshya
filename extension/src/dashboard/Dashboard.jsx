import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import settings from '../utils/settings';
import voice from '../utils/voice';
import ChatWindow from '../components/ChatWindow';
import ModelSelector from '../components/ModelSelector';
import SettingsModal from '../components/SettingsModal';
import VoiceController from '../components/VoiceController';
import { 
  Bot, Plus, Settings, MessageSquare, Trash2, Send, 
  FileText, Server, AlertCircle, Sparkles, BookOpen, Camera, X, Table, Paperclip, RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  // Config states
  const [appSettings, setAppSettings] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Conversational states
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // UI input states
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentStatus, setAttachmentStatus] = useState('');
  const [activeAttachment, setActiveAttachment] = useState(null);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [stopVoiceSignal, setStopVoiceSignal] = useState(0);
  const [imageInput, setImageInput] = useState(null);
  const [imageName, setImageName] = useState('');

  const pdfInputRef = useRef(null);
  const spreadsheetInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageInput(event.target.result); // Base64 data URL
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  // 1. Initial Load settings and connect to backend
  useEffect(() => {
    async function init() {
      const config = await settings.getAll();
      setAppSettings(config);
      
      const online = await api.checkStatus();
      setBackendOnline(online);
      
      if (online) {
        await loadConversations(config);
      }
    }
    init();
  }, []);

  // Check connection status periodically
  useEffect(() => {
    const timer = setInterval(async () => {
      const online = await api.checkStatus();
      setBackendOnline(online);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // 2. Load conversations list
  const loadConversations = async (config) => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      
      // Auto-activate the latest conversation if none is active
      if (list.length > 0 && !activeConvId) {
        handleSelectConversation(list[0].id);
      } else if (list.length === 0) {
        handleNewChat(config || appSettings);
      }
    } catch (e) {
      console.error('Error loading conversations:', e);
    }
  };

  // 3. Load messages for active conversation
  const loadMessages = async (convId) => {
    try {
      const list = await api.getMessages(convId);
      setMessages(list);
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  // 4. Trigger new conversation
  const handleNewChat = async (config = appSettings) => {
    if (isStreaming) return;
    try {
      const activeModel = config?.model || 'Default Model';
      const newConv = await api.createConversation('New Chat', activeModel);
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
      setActiveAttachment(null);
    } catch (e) {
      console.error('Failed to create new chat session:', e);
    }
  };

  // Select conversation
  const handleSelectConversation = (id) => {
    if (isStreaming) return;
    voice.stopSpeaking();
    setActiveConvId(id);
    setActiveAttachment(null);
    loadMessages(id);
  };

  // Delete conversation
  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    if (isStreaming) return;
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
        // Create or select another one
        const remaining = conversations.filter(c => c.id !== id);
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // 5. Send chat message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isStreaming || !backendOnline) return;

    setInputValue('');
    setStopVoiceSignal(prev => prev + 1);
    voice.stopSpeaking();

    let currentConvId = activeConvId;
    let activeTabContext = null;

    // Fetch active webpage context dynamically
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        const tabContent = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_CONTENT' }, (response) => {
            if (response && response.success) {
              resolve(response);
            } else {
              resolve(null);
            }
          });
        });
        if (tabContent) {
          activeTabContext = {
            title: tabContent.title,
            url: tabContent.url,
            text: tabContent.text ? tabContent.text.substring(0, 15000) : ''
          };
        }
      } catch (err) {
        console.warn('Could not fetch active tab context:', err);
      }
    }

    try {
      // Step A: Auto-create conversation if missing
      if (!currentConvId) {
        const activeModel = appSettings.model || 'Default Model';
        const newConv = await api.createConversation(
          text.substring(0, 30),
          activeModel
        );
        currentConvId = newConv.id;
        setActiveConvId(currentConvId);
        setConversations(prev => [newConv, ...prev]);
      }

      // Step B: Save user message in local DB (with placeholder image text if present)
      const dbText = imageInput ? `[Uploaded Image: ${imageName}] ${text}` : text;
      const userMsg = await api.saveMessage(currentConvId, 'user', dbText);
      
      // Inject image locally for rendering bubble thumbnail in session
      const displayMsg = { ...userMsg, content: text, image: imageInput };
      
      const updatedMessages = [...messages, displayMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);

      // Capture active image context and clear local states
      const activeImage = imageInput;
      setImageInput(null);
      setImageName('');

      // Refresh list to show updated title if it was first message
      await loadConversations(appSettings);

      // Retrieve file/document context from Chrome local storage if available
      let fileContext = null;
      if (currentConvId) {
        try {
          const stored = await new Promise((resolve) => {
            chrome.storage.local.get(`file_context_${currentConvId}`, resolve);
          });
          if (stored && stored[`file_context_${currentConvId}`]) {
            fileContext = stored[`file_context_${currentConvId}`];
          }
        } catch (err) {
          console.warn('Could not read session file context:', err);
        }
      }

      // Step C: Execute streaming chat completion
      let assistantResponse = '';
      
      await api.chatStream(
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        appSettings,
        activeTabContext,
        fileContext,
        activeImage,
        (chunk) => {
          assistantResponse += chunk;
          // Render chunk in UI dynamically
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === 'assistant' && last.id === 'temp_ai') {
              return [...prev.slice(0, -1), { ...last, content: assistantResponse }];
            } else {
              return [...prev, { id: 'temp_ai', role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() }];
            }
          });
        },
        async () => {
          // Completed stream -> Save assistant message to DB
          setIsStreaming(false);
          if (assistantResponse) {
            await api.saveMessage(currentConvId, 'assistant', assistantResponse);
            loadMessages(currentConvId); // Refresh with permanent DB IDs
            
            // Auto read aloud if enabled
            if (appSettings.audioEnabled) {
              voice.speak(
                assistantResponse,
                appSettings,
                () => console.log('Speaking response...'),
                () => console.log('Response finished.')
              );
            }
          }
        },
        (error) => {
          setIsStreaming(false);
          console.error(error);
          setMessages(prev => [
            ...prev,
            { id: 'error_ai', role: 'assistant', content: `⚠️ Error completing prompt: ${error.message || 'Check model endpoint connections.'}`, timestamp: new Date().toISOString() }
          ]);
        }
      );
    } catch (e) {
      console.error('Failed to execute chat send:', e);
      setIsStreaming(false);
    }
  };

  // 6. Handle Unified File Ingestion (PDF / Spreadsheets)
  const loadFileIntoChat = async ({ file, kind, parseFile, promptLabel, extensionCheck }) => {
    if (!file || !backendOnline || uploadingFile || !appSettings) return;

    if (!extensionCheck(file)) {
      setAttachmentStatus(`Choose a ${kind} file.`);
      setTimeout(() => setAttachmentStatus(''), 3000);
      return;
    }

    setUploadingFile(true);
    const storeInDb = appSettings?.savePdfToDb || false;
    setAttachmentStatus(`Loading ${kind}...`);

    try {
      let targetConvId = activeConvId;
      if (!targetConvId) {
        const newConv = await api.createConversation(`${promptLabel}: ${file.name.substring(0, 18)}`, appSettings?.model);
        targetConvId = newConv.id;
        setActiveConvId(targetConvId);
        setConversations(prev => [newConv, ...prev]);
        setMessages([]);
      }

      const result = await parseFile(file, appSettings, storeInDb);

      if (!storeInDb && result.text) {
        await new Promise((resolve) => {
          chrome.storage.local.set({
            [`file_context_${targetConvId}`]: { title: file.name, text: result.text }
          }, resolve);
        });
      }

      const detailText = kind === 'spreadsheet'
        ? `${result.sheets || 1} sheet(s), ${result.rows || 0} rows`
        : `${result.pages || 1} page(s)`;
        
      setActiveAttachment({
        kind: promptLabel,
        name: file.name,
        detail: detailText
      });
      await loadConversations(appSettings);
      setInputValue(current => current || `Summarize this ${kind}.`);
      setAttachmentStatus(`${promptLabel} ready`);
    } catch (error) {
      console.error(error);
      setAttachmentStatus(`Error: ${error.message || 'failed'}`);
    } finally {
      setTimeout(() => setAttachmentStatus(''), 4000);
      setUploadingFile(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    await loadFileIntoChat({
      file,
      kind: 'PDF',
      parseFile: api.ingestPdf,
      promptLabel: 'PDF',
      extensionCheck: (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    });
  };

  const handleSpreadsheetUpload = async (e) => {
    const file = e.target.files[0];
    await loadFileIntoChat({
      file,
      kind: 'spreadsheet',
      parseFile: api.ingestSpreadsheet,
      promptLabel: 'Spreadsheet',
      extensionCheck: (f) => /\.(xlsx|csv|tsv)$/i.test(f.name)
    });
  };

  // Model selection sync
  const handleModelSelect = async (modelId) => {
    const updated = { ...appSettings, model: modelId };
    setAppSettings(updated);
    await settings.set('model', modelId);
  };

  // Save settings from modal
  const handleSaveSettings = async (newSettings) => {
    const updated = { ...appSettings, ...newSettings };
    setAppSettings(updated);
    await settings.setMultiple(newSettings);
    // Reload models list if needed
    loadConversations(updated);
  };

  return (
    <div className="dashboard-container">
      {/* 1. Left Sidebar - Chat list & connection */}
      <div className="sidebar">
        <div className="sidebar-header">
          <Bot className="sidebar-logo animate-pulse" size={24} />
          <h1>LAKSHYA</h1>
        </div>

        <button onClick={() => handleNewChat()} className="new-chat-btn" disabled={isStreaming}>
          <Plus size={16} /> New Chat
        </button>

        <div className="conversations-history">
          <div className="history-label">Recent Conversations</div>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
              className={`conv-item-card ${activeConvId === conv.id ? 'active' : ''}`}
            >
              <MessageSquare size={14} className="conv-icon" />
              <span className="conv-title">{conv.title}</span>
              <button
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                className="conv-delete-btn"
                title="Delete chat"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <div className={`status-dot ${backendOnline ? 'online' : 'offline'}`}></div>
            <span>{backendOnline ? 'Backend Online' : 'Connecting Backend...'}</span>
          </div>
          <button onClick={() => setIsSettingsOpen(true)} className="settings-btn">
            <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      {/* 2. Main Chat Workspace */}
      <div className="chat-workspace">
        <div className="workspace-header">
          <div className="header-left">
            <span className="active-chat-title">
              {conversations.find(c => c.id === activeConvId)?.title || 'AI Companion'}
            </span>
          </div>

          <div className="header-right">
            {/* Read Aloud speaker toggle */}
            {appSettings && (
              <button 
                onClick={async () => {
                  const newVal = !appSettings.audioEnabled;
                  setAppSettings(prev => ({ ...prev, audioEnabled: newVal }));
                  await settings.set('audioEnabled', newVal);
                }}
                className="input-action-btn"
                style={{ padding: '6px 10px', height: '34px', background: appSettings.audioEnabled ? 'rgba(16, 163, 127, 0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: appSettings.audioEnabled ? 'var(--color-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '500', borderRadius: '10px', cursor: 'pointer' }}
                title="Toggle Auto Read Aloud"
              >
                <BookOpen size={12} />
                <span>TTS: {appSettings.audioEnabled ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Model select */}
            {appSettings && (
              <ModelSelector 
                settingsConfig={appSettings} 
                onModelChange={handleModelSelect} 
              />
            )}
            
            {/* RAG status pill */}
            {appSettings?.ragEnabled && (
              <div className="rag-status-pill" title="Semantic context injection from ChromaDB is active">
                <Sparkles size={12} />
                <span>RAG Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Logs */}
        <ChatWindow 
          messages={messages} 
          isStreaming={isStreaming} 
          settingsConfig={appSettings || {}} 
        />

        {/* Loading File banner */}
        {attachmentStatus && (
          <div className="pdf-upload-banner" style={{ margin: '12px auto', maxWidth: '800px', width: 'calc(100% - 48px)', padding: '10px 16px', borderRadius: '10px', backgroundColor: 'rgba(16, 163, 127, 0.08)', border: '1px solid rgba(16, 163, 127, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-primary)' }}>
            {uploadingFile ? <RefreshCw className="spin" size={14} /> : <Paperclip size={14} />}
            <span>{attachmentStatus}</span>
          </div>
        )}

        {/* Input Bar panel */}
        <div className="input-panel">
          <div className="input-wrapper" style={{ position: 'relative' }}>
            {/* Active File Attachment Pill */}
            {activeAttachment && (
              <div className="sp-active-attachment" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', width: 'fit-content' }}>
                {activeAttachment.kind === 'PDF' ? <FileText size={14} style={{ color: 'var(--color-primary)' }} /> : <Table size={14} style={{ color: 'var(--color-secondary)' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', textAlign: 'left' }}>
                  <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{activeAttachment.name}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>{activeAttachment.kind} loaded · {activeAttachment.detail}</span>
                </div>
                <button onClick={() => setActiveAttachment(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '2px' }} title="Remove file">
                  <X size={12} />
                </button>
              </div>
            )}

            {imageInput && (
              <div className="sp-image-preview-container">
                <img src={imageInput} alt="Preview" className="sp-image-preview-thumbnail" />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {imageName}
                </span>
                <button onClick={() => { setImageInput(null); setImageName(''); }} className="sp-image-preview-remove" title="Remove image">
                  <X size={10} />
                </button>
              </div>
            )}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything or talk to LAKSHYA..."
              rows={2}
              className="chat-textarea"
              disabled={!backendOnline}
            />

            <div className="input-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* ChatGPT-style Unified Plus Attachment Trigger */}
                <button
                  type="button"
                  onClick={() => setAttachmentMenuOpen(prev => !prev)}
                  disabled={uploadingFile || !backendOnline || !appSettings}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'var(--transition)' }}
                  title="Add file or image"
                >
                  <Plus size={14} />
                </button>

                {/* Dropdown Menu */}
                {attachmentMenuOpen && (
                  <div className="dashboard-attachment-menu" style={{ position: 'absolute', bottom: '46px', left: '16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: 'var(--shadow-lg)', zIndex: 30 }}>
                    <button type="button" onClick={() => { pdfInputRef.current?.click(); setAttachmentMenuOpen(false); }} style={{ border: 0, borderRadius: '10px', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                      <FileText size={14} style={{ color: 'var(--color-primary)' }} />
                      <span>PDF Document</span>
                    </button>
                    <button type="button" onClick={() => { spreadsheetInputRef.current?.click(); setAttachmentMenuOpen(false); }} style={{ border: 0, borderRadius: '10px', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                      <Table size={14} style={{ color: 'var(--color-secondary)' }} />
                      <span>Excel / CSV</span>
                    </button>
                    <button type="button" onClick={() => { document.getElementById('dashboard-image-file-input').click(); setAttachmentMenuOpen(false); }} style={{ border: 0, borderRadius: '10px', padding: '8px 12px', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
                      <Camera size={14} style={{ color: 'var(--color-accent)' }} />
                      <span>Upload Image</span>
                    </button>
                  </div>
                )}

                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                />
                <input
                  ref={spreadsheetInputRef}
                  type="file"
                  accept=".xlsx,.csv,.tsv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/tab-separated-values"
                  onChange={handleSpreadsheetUpload}
                  style={{ display: 'none' }}
                />
                <input
                  type="file"
                  id="dashboard-image-file-input"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />

                {appSettings && (
                  <VoiceController 
                    settingsConfig={appSettings} 
                    onSpeechInput={(transcript) => setInputValue(transcript)} 
                    isAssistantStreaming={isStreaming}
                    stopSignal={stopVoiceSignal}
                  />
                )}
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={(!inputValue.trim() && !imageInput && !activeAttachment) || isStreaming || !backendOnline}
                className="send-btn"
                title="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Settings Modal */}
      {isSettingsOpen && appSettings && (
        <SettingsModal
          currentSettings={appSettings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
