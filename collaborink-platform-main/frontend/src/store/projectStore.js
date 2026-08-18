import { create } from 'zustand';
import api from '../services/api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  isLoading: false,
  error: null,

  fetchProjects: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const url = workspaceId ? `/projects?workspaceId=${workspaceId}` : '/projects';
      const response = await api.get(url);
      set({ projects: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createProject: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      set((state) => ({
        projects: [...state.projects, response.data],
      }));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  fetchProjectTasks: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`);
      set({ tasks: response.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      set((state) => ({
        tasks: [...state.tasks, response.data],
      }));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (taskId, updateData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updateData);
      set((state) => ({
        tasks: state.tasks.map(t => (t._id === taskId ? response.data : t)),
      }));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter(t => t._id !== taskId),
      }));
    } catch (error) {
      throw error;
    }
  },

  getTaskById: (taskId) => {
    const { tasks } = get();
    return tasks.find(t => t._id === taskId);
  },
}));