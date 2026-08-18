import { create } from 'zustand';
import api from '../services/api';

export const useChatStore = create((set) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  isLoading: false,

  // Called by Layout on mount — socket init is handled centrally in App.jsx
  initializeSocket: () => {},

  fetchChannels: async ({ workspaceId, projectId } = {}) => {
    const params = new URLSearchParams();
    if (workspaceId) params.set('workspaceId', workspaceId);
    if (projectId) params.set('projectId', projectId);
    // Use /chats/channels for project channels (returns { channels: [] })
    // Fall back to /chat/channels for workspace-level channels (returns array)
    const endpoint = projectId ? `/chats/channels?${params}` : `/chat/channels?${params}`;
    const res = await api.get(endpoint);
    const list = Array.isArray(res.data) ? res.data : res.data.channels || [];
    set({ channels: list });
    return list;
  },

  createChannel: async ({ projectId, name, description, workspace, project }) => {
    // Use new endpoint if projectId provided, otherwise fall back to old endpoint
    let res;
    if (projectId) {
      res = await api.post('/chats/channels', { projectId, name, description });
    } else {
      res = await api.post('/chat/channels', { name, workspace, project, type: 'public' });
    }
    set(s => ({ channels: [...s.channels, res.data] }));
    return res.data;
  },

  setCurrentChannel: (channel) => set({ currentChannel: channel, messages: [] }),

  fetchMessages: async (channelId, page = 1) => {
    set({ isLoading: true });
    try {
      // /chats/channels returns messages sorted oldest→newest (asc) — correct for chat UI
      const res = await api.get(`/chats/channels/${channelId}/messages?page=${page}&limit=50`);
      const msgs = Array.isArray(res.data) ? res.data : res.data.messages || [];
      set({ messages: msgs, isLoading: false });
      return msgs;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },

  sendMessage: async (channelId, content) => {
    const res = await api.post(`/chats/channels/${channelId}/messages`, { content });
    set(s => ({ messages: [...s.messages, res.data] }));
    return res.data;
  },

  // appendMessage normalizes socket payload: server sends { channelId, message, projectId } or plain message
  appendMessage: (payload) => {
    const msg = payload?.message && payload?.channelId ? payload.message : payload;
    set(s => {
      if (s.messages.find(m => m._id === msg._id)) return s; // deduplicate
      return { messages: [...s.messages, msg] };
    });
  },

  deleteMessage: async (channelId, messageId) => {
    await api.delete(`/chats/channels/${channelId}/messages/${messageId}`);
    set(s => ({ messages: s.messages.filter(m => m._id !== messageId) }));
  },
}));
