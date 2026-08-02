export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  bio?: string;
}

export type MediaType = 'image' | 'audio' | 'file' | 'code';

export interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  fileName?: string;
  fileSize?: string;
  voiceDurationMs?: number;
  codeSnippet?: {
    language: string;
    code: string;
  };
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
  reactions?: Record<string, Reaction>;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

export interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  avatar?: string;
  members: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
  pinned?: boolean;
}
