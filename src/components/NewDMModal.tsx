import React, { useState } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface NewDMModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDMModal: React.FC<NewDMModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { currentUser, allUsers } = useAuth();
  const { createConversation } = useChat();
  const [search, setSearch] = useState('');

  const availableContacts = allUsers.filter(u => u.id !== currentUser?.id);
  const filtered = availableContacts.filter(u => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white font-['Outfit']">New Direct Message</h2>
              <p className="text-xs text-slate-400">Search contact by username, email, or phone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username, email, or phone..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="p-3 overflow-y-auto max-h-[50vh] space-y-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-center text-slate-500 py-6">No matching contacts found.</p>
          ) : (
            filtered.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  createConversation(user.id);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-950 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-700" alt="" />
                    {user.status === 'online' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white">{user.name}</h3>
                    <p className="text-[11px] text-indigo-400 font-mono">@{user.username} • {user.phone}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                  Chat
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
