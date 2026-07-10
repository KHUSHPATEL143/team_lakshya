const llmService = require('../services/llmService');
const chromaService = require('../services/chromaService');

const aiController = {
  // Fetch available models from selected provider
  async listModels(req, res) {
    const { provider, apiKey, lmStudioUrl } = req.query;

    try {
      const models = await llmService.getModels({ provider, apiKey, lmStudioUrl });
      return res.json({ models });
    } catch (error) {
      console.error('List models failed:', error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Perform streaming completion with vector DB context injection (RAG) and/or active file context
  async chat(req, res) {
    const { messages, config = {}, activeTabContext = null, fileContext = null, image = null } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    try {
      let systemPrompt = config.systemPrompt || 'You are LAKSHYA, an intelligent AI Browser Companion. Assist the user with page reading, text summarization, explanation, and natural conversations.';
      
      // 1. Inject active webpage context if available
      if (activeTabContext && activeTabContext.url) {
        console.log(`Injecting active page context: "${activeTabContext.title}" (${activeTabContext.url})`);
        systemPrompt += `\n\n[CURRENT ACTIVE WEBPAGE CONTEXT]
You are helping the user with the webpage they are currently viewing:
Title: "${activeTabContext.title || 'Untitled'}"
URL: ${activeTabContext.url}

Visible webpage text content:
"""
${activeTabContext.text || '(No text content extracted)'}
"""
Rely on this active page context to answer queries referring to "this page", "what I am seeing", "this website", "this content", "summarize", etc.
[END OF CURRENT ACTIVE WEBPAGE CONTEXT]`;
      }
      
      // 2. Inject active document file context if available (Memory / Session mode)
      if (fileContext && fileContext.text) {
        console.log(`Injecting session file context: "${fileContext.title || 'Uploaded Document'}" (${fileContext.text.length} chars)`);
        systemPrompt += `\n\n[UPLOADED DOCUMENT CONTEXT]
You have access to the contents of the user's uploaded document "${fileContext.title || 'document'}":
"""
${fileContext.text}
"""
Refer primarily to this document context to answer questions about the file.
[END OF UPLOADED DOCUMENT CONTEXT]`;
      }
      
      // Inject context from Vector DB if RAG is enabled
      if (config.ragEnabled) {
        // Find the last user message to query semantic search
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];

        if (lastUserMessage) {
          console.log(`RAG Enabled: Querying ChromaDB for context matching: "${lastUserMessage.content.substring(0, 50)}..."`);
          
          const contextChunks = await chromaService.queryKnowledge(
            lastUserMessage.content,
            3,
            'lakshya_knowledge',
            config
          );

          if (contextChunks && contextChunks.length > 0) {
            const contextText = contextChunks
              .map(chunk => `[Source: ${chunk.metadata.title || chunk.metadata.source} (${chunk.metadata.url || 'local'})]\n${chunk.content}`)
              .join('\n\n');

            systemPrompt += `\n\n[CONTEXT INFORMATION]\nUse the following extracted webpage/document context to help answer the user's query. Rely primarily on this content for facts. If this context is not helpful or relevant, reply using your general knowledge but note the context did not contain relevant details.\n\n${contextText}\n[END OF CONTEXT INFORMATION]`;
            console.log(`Injected ${contextChunks.length} matching context chunks into LLM prompt.`);
          } else {
            console.log('RAG Enabled but no matching context was found in ChromaDB.');
          }
        }
      }

      // 3. Inject image attachment context if available (multimodal input for vision models)
      if (image) {
        console.log('Multimodal query: injecting image Base64 data url into last user message.');
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        
        if (lastUserMessage) {
          if (Array.isArray(lastUserMessage.content)) {
            lastUserMessage.content.push({
              type: 'image_url',
              image_url: { url: image }
            });
          } else {
            const lastMessageText = lastUserMessage.content;
            lastUserMessage.content = [
              { type: 'text', text: lastMessageText || 'Describe this image' },
              { type: 'image_url', image_url: { url: image } }
            ];
          }
        }
      }

      // Execute stream response
      await llmService.streamChatCompletion(
        messages, 
        { ...config, systemPrompt }, 
        res
      );

    } catch (error) {
      console.error('Chat controller failed:', error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
};

module.exports = aiController;
