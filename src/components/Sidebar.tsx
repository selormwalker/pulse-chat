import React, { useState } from 'react';
import { Search, Plus, Users, UserPlus, LogOut, Phone, Shield, MessageSquare, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface SidebarProps {
  onOpenAuth: () => void;
  onOpenNewGroup: () => void;
  onOpenNewDM: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAuth,
  onOpenNewGroup,
  onOpenNewDM
}) => {
  const { currentUser, logout } = useAuth();
  const { conversations, activeConversation, setActiveConversationId } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'dms' | 'groups'>('all');

  const filteredConversations = conversations.filter((c) => {
    // Filter tab
    if (filterTab === 'dms' && c.isGroup) return false;
    if (filterTab === 'groups' && !c.isGroup) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (c.isGroup) {
      return c.name?.toLowerCase().includes(q);
    } else {
      const otherMember = c.members.find((m) => m.id !== currentUser?.id);
      return (
        otherMember?.name.toLowerCase().includes(q) ||
        otherMember?.username.toLowerCase().includes(q) ||
        otherMember?.phone.includes(q)
      );
    }
  });

  return (
    <aside className="w-80 h-screen glass-sidebar flex flex-col shrink-0 select-none z-20">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
              alt={currentUser?.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-700 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 online-pulse" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-sm text-white truncate font-['Outfit']">
              {currentUser?.name || 'Guest User'}
            </h2>
            <p className="text-[11px] text-indigo-400 font-mono truncate">
              @{currentUser?.username || 'guest'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewGroup}
            title="Create Group Chat"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <Users className="w-4 h-4 text-purple-400" />
          </button>
          <button
            onClick={onOpenNewDM}
            title="New Direct Message"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-indigo-400" />
          </button>
          <button
            onClick={() => {
              logout();
              onOpenAuth();
            }}
            title="Sign Out / Switch Account"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account Info Pill */}
      {currentUser && (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-slate-400 truncate max-w-[160px]">
            <Phone className="w-3 h-3 text-indigo-400" /> {currentUser.phone}
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <Shield className="w-3 h-3 text-emerald-400" /> Verified
          </span>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username, phone, or name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mt-3">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            All Chats
          </button>
          <button
            onClick={() => setFilterTab('dms')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              filterTab === 'dms'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Direct DMs
          </button>
          <button
            onClick={() => setFilterTab('groups')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
              filterTab === 'groups'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Group Rooms
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-700" />
            <p className="text-xs">No conversations found.</p>
            <button
              onClick={onOpenNewDM}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const otherMember = conv.isGroup
              ? null
              : conv.members.find((m) => m.id !== currentUser?.id);

            const title = conv.isGroup ? conv.name : otherMember?.name;
            const avatar = conv.isGroup ? conv.avatar : otherMember?.avatar;
            const isOnline = otherMember?.status === 'online';

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/40 hover:bg-slate-900/80 border-transparent hover:border-slate-800'
                }`}
              >
                {/* Avatar with Status indicator */}
                <div className="relative shrink-0">
                  <img
                    src={avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80'}
                    alt={title}
                    className="w-11 h-11 rounded-2xl object-cover border border-slate-800 shadow-md"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 online-pulse" />
                  )}
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-xs text-white truncate">{title}</h3>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <p className="truncate text-slate-400 font-medium">
                      {conv.lastMessage ? (
                        <span className="flex items-center gap-1">
                          {conv.lastMessage.senderId === currentUser?.id && (
                            <CheckCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          {conv.lastMessage.text || 'Media attachment'}
                        </span>
                      ) : (
                        'Tap to send message...'
                      )}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
        <button
          onClick={onOpenNewDM}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </button>
      </div>
    </aside>
  );
};
