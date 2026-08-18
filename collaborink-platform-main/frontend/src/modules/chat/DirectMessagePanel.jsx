import { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare, Loader, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { on, off, emit } from '../../services/socket';
import toast from 'react-hot-toast';

function Avatar({ user, size = 8 }) {
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

export default function DirectMessagePanel() {
  const { user } = useAuthStore();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    fetchMessages(activeThread._id);
    on('dm:message', handleIncoming);
    return () => off('dm:message', handleIncoming);
  }, [activeThread?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = async () => {
    setLoadingThreads(true);
    try {
      const res = await api.get('/dms');
      setThreads(Array.isArray(res.data) ? res.data : res.data.threads || []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingThreads(false);
    }
  };

  const fetchMessages = async (threadId) => {
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/dms/${threadId}`);
      const data = res.data;
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleIncoming = (msg) => {
    if (msg.directMessage === activeThread?._id || msg.threadId === activeThread?._id) {
      setMessages(prev => [...prev, msg]);
    }
    fetchThreads();
  };

  const getOtherParticipant = (thread) => {
    const participants = thread.participants || [];
    return participants.find(p => (p._id || p) !== user?._id) || {};
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const recipient = getOtherParticipant(activeThread);
    const recipientId = recipient._id || recipient;
    if (!recipientId) return;

    setSending(true);
    try {
      const res = await api.post('/dms', { recipientId, content: input.trim() });
      const msg = res.data.message || res.data;
      setMessages(prev => [...prev, msg]);
      setInput('');
      fetchThreads();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMsg = async (msgId) => {
    try {
      await api.delete(`/dms/messages/${msgId}`);
      setMessages(prev => prev.map(m => m._id === msgId ? { ...m, isDeleted: true } : m));
    } catch {
      toast.error('Failed to delete message');
    }
  };

  return (
    <div className="flex h-full bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
      {/* Thread list */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-700">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Direct Messages</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingThreads ? (
            <div className="flex justify-center py-8">
              <Loader className="animate-spin text-gray-500" size={20} />
            </div>
          ) : threads.length === 0 ? (
            <p className="text-xs text-gray-600 text-center px-4 py-6">No conversations yet</p>
          ) : (
            threads.map(thread => {
              const other = getOtherParticipant(thread);
              const name = `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'Unknown';
              const isActive = activeThread?._id === thread._id;
              return (
                <button
                  key={thread._id}
                  onClick={() => setActiveThread(thread)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                    isActive ? 'bg-gray-700' : 'hover:bg-gray-700/50'
                  }`}
                >
                  <Avatar user={other} size={8} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {name}
                    </p>
                    {thread.lastMessage && (
                      <p className="text-xs text-gray-500 truncate">{thread.lastMessage}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeThread ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700 flex-shrink-0">
              <Avatar user={getOtherParticipant(activeThread)} size={8} />
              <div>
                {(() => {
                  const other = getOtherParticipant(activeThread);
                  const name = `${other.firstName || ''} ${other.lastName || ''}`.trim();
                  return (
                    <>
                      <p className="font-semibold text-white text-sm">{name}</p>
                      {other.email && <p className="text-xs text-gray-500">{other.email}</p>}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-12">
                  <Loader className="animate-spin text-blue-500" size={22} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={32} className="mx-auto text-gray-700 mb-2" />
                  <p className="text-gray-500 text-sm">Start the conversation</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = (msg.sender?._id || msg.sender) === user?._id;
                  const sender = msg.sender || {};
                  return (
                    <div
                      key={msg._id}
                      className={`flex items-end gap-2 px-4 py-1.5 group ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      {!isOwn && <Avatar user={sender} size={7} />}
                      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                        {msg.isDeleted ? (
                          <div className="px-3 py-2 rounded-2xl bg-gray-700/50">
                            <p className="text-xs text-gray-600 italic">Message deleted</p>
                          </div>
                        ) : (
                          <div className={`px-3 py-2 rounded-2xl text-sm break-words ${
                            isOwn ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'
                          }`}>
                            {msg.content}
                          </div>
                        )}
                        <span className="text-xs text-gray-600 mt-0.5 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {isOwn && !msg.isDeleted && (
                        <button
                          onClick={() => handleDeleteMsg(msg._id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition rounded"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-gray-700 flex-shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition"
              >
                {sending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <MessageSquare size={40} className="text-gray-700" />
            <p className="text-gray-500 text-sm">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
