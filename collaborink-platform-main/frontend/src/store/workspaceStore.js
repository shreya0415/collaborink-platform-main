import { create } from 'zustand';
import api from '../services/api';

export const useWorkspaceStore = create((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/workspaces');
      set({ workspaces: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createWorkspace: async (workspaceData) => {
    try {
      const response = await api.post('/workspaces', workspaceData);
      set((state) => ({
        workspaces: [...state.workspaces, response.data],
      }));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  getWorkspaceById: (workspaceId) => {
    const { workspaces } = get();
    return workspaces.find(w => w._id === workspaceId);
  },

  inviteMember: async (workspaceId, email, role) => {
    try {
      const response = await api.post(`/workspaces/${workspaceId}/invites`, {
        email,
        role,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  removeMember: async (workspaceId, memberId) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      set((state) => ({
        currentWorkspace: {
          ...state.currentWorkspace,
          members: state.currentWorkspace.members.filter(
            m => m.user._id !== memberId
          ),
        },
      }));
    } catch (error) {
      throw error;
    }
  },
}));