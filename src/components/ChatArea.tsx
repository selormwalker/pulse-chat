import React, { useRef, useEffect, useState } from 'react';
import { Phone, Video, Info, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import type { Message } from '../types/chat';

export const ChatArea: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    activeConversation,
    messages,
    sendMessage,
    addReaction,
    typingUsers,
    setTyping
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!activeConversation) {
    return (
      <div className="flex-1 h-screen bg-chat-pattern flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-2xl">
          <MessageSquare className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-white font-['Outfit'] mb-2">
          Welcome to PulseChat
        </h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Select a contact or group from the sidebar to start a real-time conversation.
        </p>
      </div>
    );
  }

  const otherMember = activeConversation.isGroup
    ? null
    : activeConversation.members.find((m) => m.id !== currentUser?.id);

  const title = activeConversation.isGroup ? activeConversation.name : otherMember?.name;
  const avatar = activeConversation.isGroup ? activeConversation.avatar : otherMember?.avatar;
  const isOnline = otherMember?.status === 'online';

  return (
    <div className="flex-1 h-screen bg-chat-pattern flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="h-16 px-6 glass-chat-header flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'}
              alt={title}
              className="w-10 h-10 rounded-2xl object-cover border border-slate-700 shadow-md"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 online-pulse" />
            )}
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white font-['Outfit']">{title}</h2>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              {activeConversation.isGroup ? (
                <span className="flex items-center gap-1 text-purple-400">
                  <Users className="w-3 h-3" /> {activeConversation.members.length} Members
                </span>
              ) : isOnline ? (
                <span className="text-emerald-400 font-bold">Online</span>
              ) : (
                <span>Offline</span>
              )}
              {!activeConversation.isGroup && otherMember?.phone && (
                <span>• {otherMember.phone}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-slate-400">
          <button
            onClick={() => alert(`Initiating voice call with ${title}...`)}
            title="Voice Call"
            className="p-2.5 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={() => alert(`Initiating HD video call with ${title}...`)}
            title="Video Call"
            className="p-2.5 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
          >
            <Video className="w-4 h-4 text-indigo-400" />
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            title="Conversation Details"
            className="p-2.5 rounded-xl hover:bg-slate-800/80 hover:text-white transition-colors"
          >
            <Info className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Message Stream Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-700" />
            <p className="text-xs">No messages in this chat yet. Send the first message!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelf={msg.senderId === currentUser?.id}
              onReact={(emoji) => addReaction(msg.id, emoji)}
              onReply={(m) => setReplyingTo(m)}
            />
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-indigo-400 font-mono w-fit animate-pulse">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>{typingUsers.join(', ')} typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Controls */}
      <InputBar
        onSendMessage={sendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onTyping={setTyping}
      />

      {/* Side Details Drawer */}
      {showDetails && (
        <div className="absolute right-0 top-16 bottom-0 w-80 bg-slate-950/95 border-l border-slate-800 backdrop-blur-xl p-6 z-30 shadow-2xl animate-in slide-in-from-right duration-200 overflow-y-auto space-y-6">
          <div className="text-center">
            <img
              src={avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-indigo-500 mx-auto shadow-xl mb-3"
              alt={title}
            />
            <h3 className="font-extrabold text-base text-white">{title}</h3>
            {!activeConversation.isGroup && (
              <p className="text-xs text-indigo-400 font-mono">@{otherMember?.username}</p>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
            {!activeConversation.isGroup && otherMember && (
              <>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Email Address
                  </span>
                  <p className="text-slate-200 font-mono">{otherMember.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Phone Number
                  </span>
                  <p className="text-slate-200 font-mono">{otherMember.phone}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Bio / Status
                  </span>
                  <p className="text-slate-300 leading-relaxed">{otherMember.bio || 'Available'}</p>
                </div>
              </>
            )}

            {activeConversation.isGroup && (
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Group Members ({activeConversation.members.length})
                </span>
                <div className="space-y-2">
                  {activeConversation.members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <img src={m.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                      <div className="min-w-0">
                        <p className="font-bold text-white text-xs truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">@{m.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
