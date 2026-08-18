import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import KanbanBoard from '../modules/board/KanbanBoard';

// vi.hoisted() makes these available inside vi.mock() factory functions
const { mockBoardApi, mockApi } = vi.hoisted(() => ({
  mockBoardApi: {
    getBoard: vi.fn(),
    addColumn: vi.fn(),
    taskMoved: vi.fn(),
  },
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../services/boardApi', () => ({ default: mockBoardApi }));
vi.mock('../services/api', () => ({ default: mockApi }));
vi.mock('../services/socket', () => ({
  initSocket: vi.fn(),
  joinRoom: vi.fn(),
  leaveRoom: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}));

const mockBoard = {
  _id: 'board1',
  columns: [
    { _id: 'col1', title: 'To Do', order: 0, color: '#6B7280' },
    { _id: 'col2', title: 'In Progress', order: 1, color: '#3B82F6' },
    { _id: 'col3', title: 'Done', order: 2, color: '#10B981' },
  ],
};

const mockTasks = [
  { _id: 'task1', title: 'First Task', column: 'col1', position: 0, priority: 'medium' },
  { _id: 'task2', title: 'Second Task', column: 'col2', position: 0, priority: 'high' },
];

const mockProject = {
  _id: 'proj1',
  name: 'Test Project',
  members: [],
  workspace: 'ws1',
  board: 'board1',
};

function renderBoard() {
  return render(
    <MemoryRouter>
      <KanbanBoard projectId="proj1" />
    </MemoryRouter>
  );
}

describe('KanbanBoard', () => {
  beforeEach(() => {
    mockBoardApi.getBoard.mockResolvedValue({ data: mockBoard });
    mockBoardApi.taskMoved.mockResolvedValue({ data: {} });
    mockApi.get.mockImplementation((url) => {
      if (url.includes('/tasks')) return Promise.resolve({ data: mockTasks });
      if (url.includes('/projects/proj1')) return Promise.resolve({ data: mockProject });
      return Promise.resolve({ data: [] });
    });
    mockApi.post.mockResolvedValue({
      data: { _id: 'new-task', title: 'New Task', column: 'col1', position: 0 },
    });
    mockApi.put.mockResolvedValue({ data: { ...mockTasks[0], column: 'col2' } });
  });

  it('renders all column headers after data loads', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  it('renders task cards in their columns', async () => {
    renderBoard();
    await waitFor(() => {
      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
    });
  });

  it('opens add-task inline form when + Add task is clicked', async () => {
    renderBoard();
    await waitFor(() => screen.getByText('To Do'));

    const addButtons = screen.getAllByText(/add task/i);
    fireEvent.click(addButtons[0]);

    expect(screen.getByPlaceholderText(/task title/i)).toBeInTheDocument();
  });

  it('calls API to create task on form submit', async () => {
    renderBoard();
    await waitFor(() => screen.getByText('To Do'));

    const addButtons = screen.getAllByText(/add task/i);
    fireEvent.click(addButtons[0]);

    const input = screen.getByPlaceholderText(/task title/i);
    fireEvent.change(input, { target: { value: 'Brand New Task' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        '/tasks',
        expect.objectContaining({ title: 'Brand New Task' })
      );
    });
  });

  it('opens add-column form on "Add Column" click', async () => {
    renderBoard();
    await waitFor(() => screen.getByText('To Do'));

    fireEvent.click(screen.getByText(/add column/i));
    expect(screen.getByPlaceholderText(/column name/i)).toBeInTheDocument();
  });

  it('loads board data via boardApi.getBoard on mount', async () => {
    renderBoard();
    await waitFor(() => {
      expect(mockBoardApi.getBoard).toHaveBeenCalledWith('proj1');
    });
  });
});
