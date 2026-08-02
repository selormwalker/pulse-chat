import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Message, Conversation, MediaType } from '../types/chat';
import { useAuth } from './AuthContext';

const API_BASE = 'http://localhost:4000/api';
const WS_BASE = 'ws://localhost:4000';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversationId: (id: string | null) => void;
  messages: Message[];
  sendMessage: (payload: {
    text: string;
    mediaUrl?: string;
    mediaType?: MediaType;
    fileName?: string;
    voiceDurationMs?: number;
    codeSnippet?: { language: string; code: string };
    replyToId?: string;
  }) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => void;
  createConversation: (targetUserId: string) => Promise<void>;
  createGroupConversation: (name: string, memberIds: string[], avatar?: string) => Promise<void>;
  typingUsers: string[];
  setTyping: (isTyping: boolean) => void;
  refetchConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, token, fetchUsers } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch real conversations from database
  const refetchConversations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
        if (!activeConversationId && data.length > 0) {
          setActiveConversationId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Fetch conversations error:', e);
    }
  };

  // Fetch real message history for active conversation
  const fetchMessages = async (convId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (e) {
      console.error('Fetch messages error:', e);
    }
  };

  useEffect(() => {
    if (token) {
      refetchConversations();
      fetchUsers();
    }
  }, [token]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Connect Real WebSocket Server
  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(WS_BASE);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'AUTH', token }));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'NEW_MESSAGE') {
          const newMsg: Message = payload.message;
          if (newMsg.conversationId === activeConversationId) {
            setMessages(prev => [...prev, newMsg]);
          }
          refetchConversations();
        } else if (payload.type === 'TYPING_START') {
          setTypingUsers(prev => Array.from(new Set([...prev, payload.username || 'Someone'])));
        } else if (payload.type === 'TYPING_STOP') {
          setTypingUsers(prev => prev.filter(u => u !== payload.username));
        }
      } catch (e) {
        console.error('WS Parse Error:', e);
      }
    };

    return () => {
      socket.close();
    };
  }, [token, activeConversationId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const setTyping = (isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !activeConversationId) return;
    wsRef.current.send(
      JSON.stringify({
        type: isTyping ? 'TYPING_START' : 'TYPING_STOP',
        conversationId: activeConversationId,
        username: currentUser?.name
      })
    );
  };

  // Send Message via Real API
  const sendMessage = async (payload: {
    text: string;
    mediaUrl?: string;
    mediaType?: MediaType;
    fileName?: string;
    voiceDurationMs?: number;
    codeSnippet?: { language: string; code: string };
    replyToId?: string;
  }) => {
    if (!token || !activeConversationId) return;

    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId: activeConversationId,
          ...payload
        })
      });

      const newMsg = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, newMsg]);
        refetchConversations();
      }
    } catch (e) {
      console.error('Send message network error:', e);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || {};
        const existing = currentReactions[emoji] || { emoji, count: 0, userIds: [] };

        const hasReacted = existing.userIds.includes(currentUser.id);
        const updatedUserIds = hasReacted
          ? existing.userIds.filter(id => id !== currentUser.id)
          : [...existing.userIds, currentUser.id];

        const updatedReactions = {
          ...currentReactions,
          [emoji]: { emoji, count: updatedUserIds.length, userIds: updatedUserIds }
        };

        return { ...m, reactions: updatedReactions };
      })
    );
  };

  // Create Real DM
  const createConversation = async (targetUserId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });
      const conv = await res.json();
      if (res.ok) {
        await refetchConversations();
        setActiveConversationId(conv.id);
      }
    } catch (e) {
      console.error('Create DM error:', e);
    }
  };

  // Create Real Group
  const createGroupConversation = async (name: string, memberIds: string[], avatar?: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, memberIds, avatar })
      });
      const group = await res.json();
      if (res.ok) {
        await refetchConversations();
        setActiveConversationId(group.id);
      }
    } catch (e) {
      console.error('Create group error:', e);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversationId,
        messages,
        sendMessage,
        addReaction,
        createConversation,
        createGroupConversation,
        typingUsers,
        setTyping,
        refetchConversations
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
