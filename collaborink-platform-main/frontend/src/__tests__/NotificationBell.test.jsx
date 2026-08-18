import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import NotificationBell from '../components/NotificationBell';

const {
  mockFetchUnreadCount,
  mockFetchNotifications,
  mockMarkAllAsRead,
  mockAddNotification,
  mockNavigate,
} = vi.hoisted(() => ({
  mockFetchUnreadCount: vi.fn(),
  mockFetchNotifications: vi.fn(),
  mockMarkAllAsRead: vi.fn(),
  mockAddNotification: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../store/notificationStore', () => ({
  useNotificationStore: () => ({
    unreadCount: 3,
    fetchUnreadCount: mockFetchUnreadCount,
    fetchNotifications: mockFetchNotifications,
    markAllAsRead: mockMarkAllAsRead,
    addNotification: mockAddNotification,
  }),
}));

vi.mock('../services/socket', () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}));

vi.mock('react-router-dom', async (importActual) => {
  const actual = await importActual();
  return { ...actual, useNavigate: () => mockNavigate };
});

const sampleNotifications = [
  {
    _id: 'n1',
    title: 'Task assigned',
    message: 'You got a task',
    isRead: false,
    link: '/board/123',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'n2',
    title: 'Comment added',
    message: 'Someone commented',
    isRead: true,
    link: '/board/456',
    createdAt: new Date().toISOString(),
  },
];

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );
}

describe('NotificationBell', () => {
  beforeEach(() => {
    mockFetchUnreadCount.mockResolvedValue();
    mockFetchNotifications.mockResolvedValue({ notifications: sampleNotifications });
    mockMarkAllAsRead.mockResolvedValue();
  });

  it('renders the bell button', () => {
    renderBell();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows unread count badge when unreadCount > 0', () => {
    renderBell();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('fetches unread count on mount', () => {
    renderBell();
    expect(mockFetchUnreadCount).toHaveBeenCalled();
  });

  it('opens dropdown and loads notifications when bell is clicked', async () => {
    renderBell();
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalled();
    });
  });

  it('shows notification titles in the dropdown', async () => {
    renderBell();
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Task assigned')).toBeInTheDocument();
    });
  });

  it('navigates to notification link on click', async () => {
    renderBell();
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Task assigned')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Task assigned'));
    expect(mockNavigate).toHaveBeenCalledWith('/board/123');
  });

  it('calls markAllAsRead when mark-all button is clicked', async () => {
    renderBell();
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/mark all read/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/mark all read/i));
    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });
});
