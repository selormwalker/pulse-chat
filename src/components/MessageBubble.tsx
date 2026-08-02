import React, { useState } from 'react';
import { Check, CheckCheck, Play, Pause, Reply, Code, CornerDownRight } from 'lucide-react';
import type { Message } from '../types/chat';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  onReact: (emoji: string) => void;
  onReply: (msg: Message) => void;
}

const EMOJI_OPTIONS = ['❤️', '🔥', '👍', '😂', '🎉'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  onReact,
  onReply
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    if (!isPlayingAudio) {
      setTimeout(() => setIsPlayingAudio(false), message.voiceDurationMs || 3000);
    }
  };

  return (
    <div className={`flex flex-col group ${isSelf ? 'items-end' : 'items-start'} my-2 select-text relative`}>
      {/* Sender Name for Groups */}
      {!isSelf && (
        <span className="text-[11px] font-bold text-slate-400 mb-1 ml-3 font-mono">
          {message.senderName}
        </span>
      )}

      {/* Reply Thread Preview */}
      {message.replyTo && (
        <div className={`flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-3 py-1 rounded-xl bg-slate-900/60 border border-slate-800/80 ${isSelf ? 'mr-1' : 'ml-1'}`}>
          <CornerDownRight className="w-3 h-3 text-indigo-400" />
          <span className="font-bold text-indigo-300">{message.replyTo.senderName}:</span>
          <span className="truncate max-w-[200px]">{message.replyTo.text}</span>
        </div>
      )}

      {/* Main Bubble Container */}
      <div className="relative flex items-center gap-2 group">
        {/* Quick Reaction & Reply Hover Toolbar */}
        <div className={`hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-full px-2 py-1 shadow-lg absolute -top-4 z-20 ${isSelf ? 'right-0' : 'left-0'}`}>
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className="hover:scale-125 transition-transform text-xs p-0.5"
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => onReply(message)}
            title="Reply"
            className="p-1 text-slate-400 hover:text-white"
          >
            <Reply className="w-3 h-3" />
          </button>
        </div>

        {/* Bubble Shell */}
        <div
          className={`max-w-md rounded-2xl p-3.5 shadow-lg backdrop-blur-md transition-all ${
            isSelf
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white rounded-br-xs shadow-indigo-500/10'
              : 'bg-slate-900/90 text-slate-100 border border-slate-800 rounded-bl-xs'
          }`}
        >
          {/* Image Attachment */}
          {message.mediaType === 'image' && message.mediaUrl && (
            <div className="mb-2 rounded-xl overflow-hidden border border-white/10 shadow-md">
              <img src={message.mediaUrl} alt="Attachment" className="max-h-64 w-full object-cover" />
            </div>
          )}

          {/* Voice Audio Note */}
          {message.mediaType === 'audio' && (
            <div className="flex items-center gap-3 p-2 bg-black/20 rounded-xl mb-1 min-w-[200px]">
              <button
                onClick={toggleAudio}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-transform active:scale-95"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1 space-y-1">
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all duration-300 ${
                      isPlayingAudio ? 'w-full animate-pulse' : 'w-1/3'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] opacity-80 font-mono">
                  <span>Voice Note</span>
                  <span>{Math.round((message.voiceDurationMs || 3000) / 1000)}s</span>
                </div>
              </div>
            </div>
          )}

          {/* Code Snippet */}
          {message.codeSnippet && (
            <div className="mb-2 rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between text-[10px] text-indigo-400 font-bold mb-1.5 pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1">
                  <Code className="w-3 h-3" /> {message.codeSnippet.language}
                </span>
                <span>Code Block</span>
              </div>
              <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {message.codeSnippet.code}
              </pre>
            </div>
          )}

          {/* Text Message */}
          {message.text && (
            <p className="text-xs md:text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
            </p>
          )}

          {/* Message Footer: Timestamp & Read Status */}
          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-mono opacity-70`}>
            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isSelf && (
              <span>
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-cyan-300" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reaction Badges Below Bubble */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div className={`flex items-center gap-1 mt-1 ${isSelf ? 'mr-1' : 'ml-1'}`}>
          {Object.values(message.reactions).map((rx) => (
            <button
              key={rx.emoji}
              onClick={() => onReact(rx.emoji)}
              className="px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] flex items-center gap-1 font-bold shadow-md hover:scale-105 transition-transform"
            >
              <span>{rx.emoji}</span>
              <span className="text-[10px] text-indigo-400">{rx.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
