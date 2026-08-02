import React, { useState } from 'react';
import { Send, Mic, Image, Code, Smile, X, StopCircle } from 'lucide-react';
import type { Message, MediaType } from '../types/chat';

interface InputBarProps {
  onSendMessage: (payload: {
    text: string;
    mediaUrl?: string;
    mediaType?: MediaType;
    voiceDurationMs?: number;
    codeSnippet?: { language: string; code: string };
    replyToId?: string;
  }) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  onTyping: (isTyping: boolean) => void;
}

const EMOJIS = ['😊', '😂', '🔥', '❤️', '🚀', '👍', '🎉', '⚡', '💯', '🙌'];

export const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  replyingTo,
  onCancelReply,
  onTyping
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeText, setCodeText] = useState('');
  const [codeLang, setCodeLang] = useState('typescript');

  // Simulated Voice Recording
  const handleStartVoice = () => {
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
    }, 10000);
  };

  const handleStopVoice = () => {
    setIsRecordingVoice(false);
    onSendMessage({
      text: '🎙️ Voice Audio Note',
      mediaType: 'audio',
      voiceDurationMs: Math.max(recordingSeconds * 1000, 3000),
      replyToId: replyingTo?.id
    });
    if (replyingTo) onCancelReply();
  };

  // Image Upload Simulation
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    onSendMessage({
      text: file.name,
      mediaUrl: imageUrl,
      mediaType: 'image',
      replyToId: replyingTo?.id
    });
    if (replyingTo) onCancelReply();
  };

  // Handle Form Send
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSendMessage({
      text: text.trim(),
      replyToId: replyingTo?.id
    });

    setText('');
    setShowEmojiPicker(false);
    if (replyingTo) onCancelReply();
  };

  // Send Code Snippet
  const handleSendCode = () => {
    if (!codeText.trim()) return;
    onSendMessage({
      text: 'Attached Code Snippet',
      codeSnippet: { language: codeLang, code: codeText.trim() },
      replyToId: replyingTo?.id
    });
    setCodeText('');
    setShowCodeModal(false);
    if (replyingTo) onCancelReply();
  };

  return (
    <div className="p-4 glass-chat-header border-t border-slate-800/80 relative z-20">
      {/* Reply Banner */}
      {replyingTo && (
        <div className="mb-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
          <div className="text-xs">
            <span className="font-bold text-indigo-400">Replying to {replyingTo.senderName}:</span>
            <p className="text-slate-300 truncate max-w-md">{replyingTo.text}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Recording Mode */}
      {isRecordingVoice ? (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 animate-pulse">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-rose-400 animate-bounce" />
            <span className="font-mono text-xs font-bold">
              Recording Voice Note: {recordingSeconds}s
            </span>
          </div>
          <button
            onClick={handleStopVoice}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
          >
            <StopCircle className="w-4 h-4" />
            <span>Send Audio Note</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Media & Code Buttons */}
          <label className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors">
            <Image className="w-4 h-4 text-purple-400" />
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            title="Attach Code Snippet"
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          >
            <Code className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onTyping(true);
              }}
              placeholder="Type your message..."
              className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-white text-xs md:text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
            {/* Emoji Trigger */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Emoji Quick Picker */}
            {showEmojiPicker && (
              <div className="absolute right-0 bottom-14 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl flex gap-1 z-30 animate-in fade-in duration-150">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1.5 hover:scale-125 transition-transform text-base"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Recorder Button */}
          <button
            type="button"
            onClick={handleStartVoice}
            title="Hold to Record Voice Note"
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Attach Code Snippet Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" /> Attach Code Block
              </span>
              <button onClick={() => setShowCodeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Language
              </label>
              <select
                value={codeLang}
                onChange={(e) => setCodeLang(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none"
              >
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="sql">SQL / Prisma</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Code Snippet
              </label>
              <textarea
                rows={6}
                value={codeText}
                onChange={(e) => setCodeText(e.target.value)}
                placeholder="Paste code snippet..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none"
              />
            </div>
            <button
              onClick={handleSendCode}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              Send Code Snippet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
