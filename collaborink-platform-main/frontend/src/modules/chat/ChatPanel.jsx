import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, Plus, Loader, Trash2, X } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { on, off, emit } from '../../services/socket';
import toast from 'react-hot-toast';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
  'linear-gradient(135deg, #fb923c 0%, #f59e0b 100%)',
];

function Avatar({ user, idx = 0 }) {
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  return (
    <span
      className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold flex-shrink-0 overflow-hidden"
      style={{ background: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length], color: '#042f2e' }}
    >
      {user?.avatar
        ? <img src={user.avatar} alt={initials} className="h-full w-full object-cover" />
        : (initials || '?')
      }
    </span>
  );
}

function MessageItem({ msg, currentUserId, onDelete }) {
  const [hover, setHover] = useState(false);
  const sender = msg.author || msg.sender || {};
  const isOwn  = (sender._id || sender) === currentUserId;
  const name   = sender.firstName
    ? `${sender.firstName} ${sender.lastName || ''}`.trim()
    : 'Unknown';

  return (
    <div
      className="flex items-start gap-3 px-5 py-2 relative transition-colors"
      style={{ background: hover ? 'rgba(30,41,59,.35)' : 'transparent' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Avatar user={sender} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-200">{name}</span>
          <span className="text-[11px] text-slate-600">
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {msg.isDeleted ? (
          <p className="text-sm text-slate-700 italic">Message deleted</p>
        ) : (
          <p className="text-sm text-slate-300 break-words leading-relaxed">{msg.content}</p>
        )}
      </div>
      <AnimatePresence>
        {hover && isOwn && !msg.isDeleted && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => onDelete(msg._id)}
            className="absolute right-4 top-2 icon-button h-6 w-6 text-slate-600 hover:text-rose-400"
            title="Delete message"
          >
            <Trash2 size={12} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ChatPanel({ workspaceId, projectId }) {
  const { user } = useAuthStore();
  const {
    channels, currentChannel, messages, isLoading,
    fetchChannels, setCurrentChannel, fetchMessages,
    sendMessage, appendMessage, deleteMessage,
  } = useChatStore();

  const [input,          setInput]          = useState('');
  const [sending,        setSending]        = useState(false);
  const [typingUsers,    setTypingUsers]    = useState([]);
  const [showCreate,     setShowCreate]     = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const bottomRef    = useRef(null);
  const typingTimer  = useRef(null);
  const typingActive = useRef(false);

  useEffect(() => {
    fetchChannels({ workspaceId, projectId }).then(list => {
      if (list.length > 0 && !currentChannel) setCurrentChannel(list[0]);
    });
  }, [workspaceId, projectId]);

  useEffect(() => {
    if (!currentChannel) return;
    fetchMessages(currentChannel._id);
    emit('chat:join', { channelId: currentChannel._id });

    on('chat:message',    handleIncoming);
    on('message:deleted', handleRemoteDelete);
    on('typing',          handleTyping);

    return () => {
      emit('chat:leave', { channelId: currentChannel._id });
      off('chat:message',    handleIncoming);
      off('message:deleted', handleRemoteDelete);
      off('typing',          handleTyping);
    };
  }, [currentChannel?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIncoming = (payload) => {
    const channelId = payload?.channelId || payload?.channel;
    const msg       = payload?.message   || payload;
    if (channelId === currentChannel?._id || msg?.channel === currentChannel?._id) {
      appendMessage(msg);
    }
  };

  const handleRemoteDelete = ({ messageId }) => {
    useChatStore.setState(s => ({ messages: s.messages.filter(m => m._id !== messageId) }));
  };

  const handleTyping = ({ userId, userName, channelId, isTyping }) => {
    if (channelId !== currentChannel?._id || userId === user?._id) return;
    if (isTyping) {
      setTypingUsers(prev => {
        if (prev.find(u => u.userId === userId)) return prev;
        return [...prev, { userId, name: userName || userId }];
      });
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
      }, 3000);
    } else {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!typingActive.current && currentChannel) {
      typingActive.current = true;
      emit('chat:typing', {
        channelId: currentChannel._id,
        isTyping:  true,
        userName:  `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingActive.current = false;
      if (currentChannel) emit('chat:typing', { channelId: currentChannel._id, isTyping: false });
    }, 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChannel || sending) return;
    setSending(true);
    try {
      await sendMessage(currentChannel._id, input.trim());
      setInput('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    if (!currentChannel) return;
    try {
      await deleteMessage(currentChannel._id, msgId);
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    try {
      await useChatStore.getState().createChannel({
        projectId, name: newChannelName.trim(), workspace: workspaceId,
      });
      setNewChannelName('');
      setShowCreate(false);
      toast.success(`#${newChannelName.trim()} created`);
    } catch {
      toast.error('Failed to create channel');
    }
  };

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{
        background: 'rgba(5,9,18,.85)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Channel sidebar */}
      <div
        className="w-56 flex flex-col flex-shrink-0"
        style={{ borderRight: '1px solid rgba(71,85,105,.25)' }}
      >
        {/* Sidebar header */}
        <div
          className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(71,85,105,.2)' }}
        >
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Channels</span>
          <motion.button
            onClick={() => setShowCreate(s => !s)}
            whileTap={{ scale: 0.9 }}
            className="icon-button h-6 w-6"
            title="New channel"
          >
            {showCreate ? <X size={13} /> : <Plus size={13} />}
          </motion.button>
        </div>

        {/* Create channel form */}
        <AnimatePresence>
          {showCreate && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateChannel}
              className="overflow-hidden px-3 py-2.5"
              style={{ borderBottom: '1px solid rgba(71,85,105,.2)' }}
            >
              <input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                autoFocus
                className="control w-full text-sm mb-2"
              />
              <div className="flex gap-1.5">
                <button type="submit" className="btn-primary flex-1 text-xs py-1.5">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="btn-ghost flex-1 text-xs py-1.5"
                >
                  Cancel
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto py-1.5 px-2">
          {channels.length === 0 ? (
            <p className="text-[11px] text-slate-700 text-center px-2 py-4">No channels yet</p>
          ) : (
            channels.map(ch => (
              <button
                key={ch._id}
                onClick={() => setCurrentChannel(ch)}
                className="relative w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-xl transition-colors mb-0.5 outline-none"
                style={{ color: currentChannel?._id === ch._id ? '#5eead4' : '#64748b' }}
              >
                {currentChannel?._id === ch._id && (
                  <motion.span
                    layoutId="chat-channel-active"
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background: 'rgba(45,212,191,.08)',
                      border: '1px solid rgba(45,212,191,.18)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Hash size={13} className="relative flex-shrink-0" />
                <span className="relative truncate">{ch.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentChannel ? (
          <>
            {/* Channel header */}
            <div
              className="flex items-center gap-2 px-5 py-3.5 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(71,85,105,.2)' }}
            >
              <Hash size={15} className="text-slate-500" />
              <span className="font-semibold text-white text-sm">{currentChannel.name}</span>
              {currentChannel.description && (
                <span className="text-xs text-slate-600 ml-1">— {currentChannel.description}</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 gap-3">
                  <motion.div
                    className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <span className="text-xs text-slate-600">Loading messages…</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <Hash size={28} className="mx-auto mb-2" style={{ color: 'rgba(71,85,105,.4)' }} />
                  <p className="text-sm text-slate-600">No messages yet. Say hi!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <MessageItem
                    key={msg._id}
                    msg={msg}
                    currentUserId={user?._id}
                    onDelete={handleDelete}
                  />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Typing indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="px-5 py-1 text-[11px] text-slate-600 italic"
                >
                  {typingUsers.map(u => u.name).join(', ')}{' '}
                  {typingUsers.length === 1 ? 'is' : 'are'} typing…
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
              style={{ borderTop: '1px solid rgba(71,85,105,.2)' }}
            >
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={`Message #${currentChannel.name}`}
                className="control flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="btn-primary px-3 h-[38px] disabled:opacity-40"
                aria-label="Send"
              >
                {sending
                  ? <Loader size={15} className="animate-spin" />
                  : <Send size={15} />
                }
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-600">Select a channel to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
