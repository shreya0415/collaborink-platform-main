// frontend/src/services/boardApi.js
import api from './api';

export default {
  getBoard(projectId) {
    return api.get(`/boards/${projectId}`);
  },
  addColumn(projectId, title, color) {
    return api.post(`/boards/${projectId}/columns`, { title, color });
  },
  updateColumn(projectId, columnId, patch) {
    return api.put(`/boards/${projectId}/columns/${columnId}`, patch);
  },
  reorderColumns(projectId, orderedColumnIds) {
    return api.post(`/boards/${projectId}/columns/reorder`, { orderedColumnIds });
  },
  taskMoved(projectId, payload) {
    return api.post(`/boards/${projectId}/task/move`, payload);
  },
};