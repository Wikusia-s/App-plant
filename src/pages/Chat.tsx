import React, { useEffect, useRef, useState } from 'react'
import type { Turn, ChatResponse, Source } from '../types'
import { chatService } from '../services/chatService'

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  sources?: Array<{ plant_name: string; title: string; url: string }>;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = '' // keep '' in dev (Vite proxy). For prod, set VITE_API_URL and read it.

interface ChatProps {
  user: {
    id: number;
    username: string;
    email: string;
  } | null;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your plant care assistant. Ask me anything about plants!",
      isUser: false,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; convId: number | null }>({ show: false, convId: null });
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const convs = await chatService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const msgs = await chatService.getMessages(conversationId);
      const formattedMessages: Message[] = [];

      msgs.forEach((msg) => {
        formattedMessages.push({
          id: msg.id * 2 - 1,
          text: msg.message,
          isUser: true,
        });
        formattedMessages.push({
          id: msg.id * 2,
          text: msg.response,
          isUser: false,
          sources: msg.sources,
        });
      });

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const createNewConversation = async () => {
    try {
      const newConv = await chatService.createConversation();
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    // Create new conversation if none selected
    let convId = currentConversationId;
    if (!convId) {
      try {
        const newConv = await chatService.createConversation();
        setConversations([newConv, ...conversations]);
        convId = newConv.id;
        setCurrentConversationId(convId);
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      isUser: true,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    try {
      const response = await chatService.sendMessage(convId, currentInput)

      const botMessage: Message = {
        id: Date.now() + 1,
        text: response.message,
        isUser: false,
        sources: response.sources || [],
      }

      setMessages((prev) => [...prev, botMessage])

      // Reload conversations to update title and timestamp
      await loadConversations();
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        isUser: false,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleDeleteConversation = async (convId: number) => {
    try {
      await chatService.deleteConversation(convId);
      setConversations(conversations.filter(c => c.id !== convId));

      if (currentConversationId === convId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      setDeleteModal({ show: false, convId: null });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <>
      <div className="chat-layout">
        {/* Sidebar */}
        <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h3>Conversations</h3>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="toggle-btn">
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>

          <button onClick={createNewConversation} className="new-conv-btn">
            + New Conversation
          </button>

          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <div className="conv-title">{conv.title}</div>
                <div className="conv-date">
                  {new Date(conv.updated_at).toLocaleDateString()}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModal({ show: true, convId: conv.id });
                  }}
                  className="delete-conv-btn"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-main">
          <div className="app__scroll">
            <div className="thread">
              {messages.length === 0 && currentConversationId && (
                <div className="empty-state">
                  Start a conversation about plants! 🌿
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`msg ${msg.isUser ? 'msg--user' : ''}`}>
                  {!msg.isUser && <div className="avatar">🌿</div>}
                  <div className="bubble">
                    {msg.text}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="sources">
                        <div className="sources__label">Sources</div>
                        <div className="chips">
                          {msg.sources.map((source, i) => (
                            <a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chip"
                              title={source.plant_name}
                            >
                              {source.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.isUser && <div className="avatar avatar--user">{user?.username[0].toUpperCase() || 'U'}</div>}
                </div>
              ))}

              {isTyping && (
                <div className="typing">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <span>Plant Assistant is typing...</span>
                </div>
              )}
            </div>
          </div>

          <div className="app__composer">
            <form className="composer" onSubmit={handleSend}>
              <input
                type="text"
                className="input"
                placeholder="Ask about any plant..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={isTyping}
              />
              <button type="submit" className="btn" disabled={isTyping || !input.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, convId: null })}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Conversation?</h3>
            <p>Are you sure you want to delete this conversation? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteModal({ show: false, convId: null })}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={() => deleteModal.convId && handleDeleteConversation(deleteModal.convId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Chat
