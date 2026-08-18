import { create } from 'zustand';
import api from '../services/api';

export const useCalendarStore = create((set, get) => ({
  calendars: [],
  events: [],
  isLoading: false,

  fetchCalendars: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/calendar');
      set({ calendars: res.data, isLoading: false });
      return res.data;
    } catch {
      set({ isLoading: false });
      return [];
    }
  },

  ensureCalendar: async (workspaceId) => {
    const { calendars, fetchCalendars } = get();
    const list = calendars.length ? calendars : await fetchCalendars();
    const match = list.find(c => c.workspace === workspaceId || c.workspace?._id === workspaceId);
    if (match) return match;

    const res = await api.post('/calendar', { workspace: workspaceId, name: 'My Calendar' });
    set(s => ({ calendars: [...s.calendars, res.data] }));
    return res.data;
  },

  fetchEvents: async (calendarId, startDate, endDate) => {
    try {
      const res = await api.get(
        `/calendar/${calendarId}/events?startDate=${startDate}&endDate=${endDate}`
      );
      set({ events: Array.isArray(res.data) ? res.data : [] });
      return res.data;
    } catch {
      return [];
    }
  },

  createEvent: async (data) => {
    const res = await api.post('/calendar/events', data);
    set(s => ({ events: [...s.events, res.data] }));
    return res.data;
  },

  deleteEvent: async (eventId) => {
    await api.delete(`/calendar/${eventId}`);
    set(s => ({ events: s.events.filter(e => e._id !== eventId) }));
  },

  clearEvents: () => set({ events: [] }),
}));
