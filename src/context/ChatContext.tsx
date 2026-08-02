import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Message, Conversation, MediaType } from '../types/chat';
import { useAuth } from './AuthContext';

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
  }) => void;
  addReaction: (messageId: string, emoji: string) => void;
  createConversation: (targetUserId: string) => void;
  createGroupConversation: (name: string, memberIds: string[], avatar?: string) => void;
  typingUsers: string[];
  setTyping: (isTyping: boolean) => void;
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-alexa',
    isGroup: false,
    members: [
      {
        id: 'user-selorm',
        username: 'selormwalker',
        email: 'juniorkwamewalker@gmail.com',
        phone: '+233 50 123 4567',
        name: 'David Selorm Walker',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        status: 'online'
      },
      {
        id: 'user-alexa',
        username: 'alexa_tech',
        email: 'alexa@pulse.chat',
        phone: '+1 415 889 1204',
        name: 'Alexa Vance',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
        status: 'online'
      }
    ],
    unreadCount: 1,
    updatedAt: new Date().toISOString(),
    pinned: true
  },
  {
    id: 'conv-quant-group',
    name: 'Quant Trading & AI Engine Squad 🚀',
    isGroup: true,
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80',
    members: [
      {
        id: 'user-selorm',
        username: 'selormwalker',
        email: 'juniorkwamewalker@gmail.com',
        phone: '+233 50 123 4567',
        name: 'David Selorm Walker',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
        status: 'online'
      },
      {
        id: 'user-marcus',
        username: 'marcus_quant',
        email: 'marcus@trading.io',
        phone: '+44 20 7946 0912',
        name: 'Marcus Sterling',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
        status: 'online'
      },
      {
        id: 'user-elena',
        username: 'elena_design',
        email: 'elena@studio.design',
        phone: '+49 30 1234 5678',
        name: 'Elena Rostova',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
        status: 'away'
      }
    ],
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-alexa',
    senderId: 'user-alexa',
    senderName: 'Alexa Vance',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    text: 'Hey David! I saw the new NEXUS AI Agent Studio architecture you deployed. The visual node graph and streaming logs are incredible! 🚀',
    createdAt: new Date(Date.now() - 1200000).toISOString(),
    status: 'read'
  },
  {
    id: 'msg-2',
    conversationId: 'conv-alexa',
    senderId: 'user-selorm',
    senderName: 'David Selorm Walker',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    text: 'Thanks Alexa! Built it with high-frequency telemetry and step-by-step agent simulation. Now we are building PulseChat — pure real-time messaging from scratch!',
    createdAt: new Date(Date.now() - 600000).toISOString(),
    status: 'read'
  },
  {
    id: 'msg-3',
    conversationId: 'conv-alexa',
    senderId: 'user-alexa',
    senderName: 'Alexa Vance',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    text: 'That sounds amazing! Direct DMs, group channels, voice notes, and phone/email auth are perfect.',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    status: 'read'
  },
  {
    id: 'msg-quant-1',
    conversationId: 'conv-quant-group',
    senderId: 'user-marcus',
    senderName: 'Marcus Sterling',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    text: 'Order book latency benchmarks are down to 12 microseconds using FixLink-CPP gateway!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'read'
  }
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const stored = localStorage.getItem('pulse_chat_conversations');
    if (stored) {
      try { return JSON.parse(stored); } catch { return INITIAL_CONVERSATIONS; }
    }
    return INITIAL_CONVERSATIONS;
  });

  const [allMessages, setAllMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem('pulse_chat_messages');
    if (stored) {
      try { return JSON.parse(stored); } catch { return INITIAL_MESSAGES; }
    }
    return INITIAL_MESSAGES;
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>('conv-alexa');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Sync state to localStorage & BroadcastChannel for multi-tab live sync
  useEffect(() => {
    localStorage.setItem('pulse_chat_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem('pulse_chat_messages', JSON.stringify(allMessages));
  }, [allMessages]);

  useEffect(() => {
    const channel = new BroadcastChannel('pulse_chat_channel');
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_MESSAGE') {
        setAllMessages(prev => [...prev, event.data.message]);
      } else if (event.data.type === 'TYPING') {
        setTypingUsers(prev => Array.from(new Set([...prev, event.data.username])));
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== event.data.username));
        }, 2500);
      }
    };
    return () => channel.close();
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

  const messages = activeConversationId
    ? allMessages.filter(m => m.conversationId === activeConversationId)
    : [];

  const setTyping = (isTyping: boolean) => {
    if (!currentUser) return;
    const channel = new BroadcastChannel('pulse_chat_channel');
    if (isTyping) {
      channel.postMessage({ type: 'TYPING', username: currentUser.name });
    }
    channel.close();
  };

  const sendMessage = (payload: {
    text: string;
    mediaUrl?: string;
    mediaType?: MediaType;
    fileName?: string;
    voiceDurationMs?: number;
    codeSnippet?: { language: string; code: string };
    replyToId?: string;
  }) => {
    if (!currentUser || !activeConversationId) return;

    const replyTarget = payload.replyToId
      ? allMessages.find(m => m.id === payload.replyToId)
      : undefined;

    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: payload.text,
      mediaUrl: payload.mediaUrl,
      mediaType: payload.mediaType,
      fileName: payload.fileName,
      voiceDurationMs: payload.voiceDurationMs,
      codeSnippet: payload.codeSnippet,
      createdAt: new Date().toISOString(),
      status: 'delivered',
      replyTo: replyTarget
        ? { id: replyTarget.id, senderName: replyTarget.senderName, text: replyTarget.text }
        : undefined
    };

    setAllMessages(prev => [...prev, newMsg]);

    // Broadcast across open browser tabs
    const channel = new BroadcastChannel('pulse_chat_channel');
    channel.postMessage({ type: 'NEW_MESSAGE', message: newMsg });
    channel.close();

    // Update conversation lastMessage & timestamp
    setConversations(prev =>
      prev.map(c =>
        c.id === activeConversationId
          ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt }
          : c
      )
    );

    // Simulated Auto-Reply for 1-on-1 chats if talking to a contact other than self
    const otherMember = activeConversation?.members.find(m => m.id !== currentUser.id);
    if (otherMember && !activeConversation?.isGroup) {
      setTimeout(() => {
        const botReply: Message = {
          id: `msg-reply-${Date.now()}`,
          conversationId: activeConversationId,
          senderId: otherMember.id,
          senderName: otherMember.name,
          senderAvatar: otherMember.avatar,
          text: `Got your message: "${payload.text.slice(0, 40)}${payload.text.length > 40 ? '...' : ''}". PulseChat real-time messaging is super fast! ⚡`,
          createdAt: new Date().toISOString(),
          status: 'read'
        };
        setAllMessages(prev => [...prev, botReply]);
        setConversations(prev =>
          prev.map(c =>
            c.id === activeConversationId
              ? { ...c, lastMessage: botReply, updatedAt: botReply.createdAt }
              : c
          )
        );
      }, 1400);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    setAllMessages(prev =>
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
          [emoji]: {
            emoji,
            count: updatedUserIds.length,
            userIds: updatedUserIds
          }
        };

        if (updatedUserIds.length === 0) {
          delete updatedReactions[emoji];
        }

        return { ...m, reactions: updatedReactions };
      })
    );
  };

  const createConversation = (targetUserId: string) => {
    if (!currentUser) return;
    const targetUser = allUsers.find(u => u.id === targetUserId);
    if (!targetUser) return;

    // Check if DM exists
    const existing = conversations.find(
      c => !c.isGroup && c.members.some(m => m.id === targetUserId)
    );

    if (existing) {
      setActiveConversationId(existing.id);
      return;
    }

    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      isGroup: false,
      members: [currentUser, targetUser],
      unreadCount: 0,
      updatedAt: new Date().toISOString()
    };

    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  };

  const createGroupConversation = (name: string, memberIds: string[], avatar?: string) => {
    if (!currentUser) return;
    const selectedMembers = allUsers.filter(u => memberIds.includes(u.id));
    const fullMembers = [currentUser, ...selectedMembers];

    const newGroup: Conversation = {
      id: `group-${Date.now()}`,
      name: name || 'New Group Chat',
      isGroup: true,
      avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      members: fullMembers,
      unreadCount: 0,
      updatedAt: new Date().toISOString()
    };

    setConversations(prev => [newGroup, ...prev]);
    setActiveConversationId(newGroup.id);
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
        setTyping
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
