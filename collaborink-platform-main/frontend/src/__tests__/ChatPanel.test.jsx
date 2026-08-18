import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ChatPanel from '../modules/chat/ChatPanel';

const {
  mockFetchChannels,
  mockSetCurrentChannel,
  mockFetchMessages,
  mockSendMessage,
  mockAppendMessage,
  mockDeleteMessage,
} = vi.hoisted(() => ({
  mockFetchChannels: vi.fn(),
  mockSetCurrentChannel: vi.fn(),
  mockFetchMessages: vi.fn(),
  mockSendMessage: vi.fn(),
  mockAppendMessage: vi.fn(),
  mockDeleteMessage: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../store/chatStore', () => ({
  useChatStore: () => ({
    channels: [
      { _id: 'ch1', name: 'general', description: 'General chat' },
      { _id: 'ch2', name: 'dev', description: '' },
    ],
    currentChannel: { _id: 'ch1', name: 'general', description: 'General chat' },
    messages: [
      {
        _id: 'msg1',
        content: 'Hello world',
        author: { _id: 'user1', firstName: 'Alice', lastName: 'Smith' },
        createdAt: new Date().toISOString(),
        isDeleted: false,
      },
    ],
    isLoading: false,
    fetchChannels: mockFetchChannels,
    setCurrentChannel: mockSetCurrentChannel,
    fetchMessages: mockFetchMessages,
    sendMessage: mockSendMessage,
    appendMessage: mockAppendMessage,
    deleteMessage: mockDeleteMessage,
  }),
  // useChatStore.getState() is needed for createChannel call
  getState: vi.fn(() => ({ createChannel: vi.fn() })),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: { _id: 'user1', firstName: 'Alice', lastName: 'Smith' },
  }),
}));

vi.mock('../services/socket', () => ({
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  initSocket: vi.fn(),
}));

function renderChat() {
  return render(<ChatPanel workspaceId="ws1" projectId="proj1" />);
}

describe('ChatPanel', () => {
  beforeEach(() => {
    mockFetchChannels.mockResolvedValue([
      { _id: 'ch1', name: 'general' },
      { _id: 'ch2', name: 'dev' },
    ]);
    mockFetchMessages.mockResolvedValue([]);
    mockSendMessage.mockResolvedValue({});
    mockDeleteMessage.mockResolvedValue({});
  });

  it('renders channel names in sidebar', () => {
    renderChat();
    // Channels are in mock state — rendered immediately
    expect(screen.getAllByText('general').length).toBeGreaterThan(0);
    expect(screen.getByText('dev')).toBeInTheDocument();
  });

  it('shows channel header for selected channel', () => {
    renderChat();
    // currentChannel.name = 'general' shows in the header
    const generals = screen.getAllByText('general');
    expect(generals.length).toBeGreaterThanOrEqual(1);
  });

  it('displays message content', () => {
    renderChat();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('displays message sender name', () => {
    renderChat();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('sends message on form submit', async () => {
    renderChat();
    const input = screen.getByPlaceholderText(/message #general/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('ch1', 'Test message');
    });
  });

  it('does not send when input is empty', () => {
    renderChat();
    const input = screen.getByPlaceholderText(/message #general/i);
    fireEvent.submit(input.closest('form'));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('shows create channel form on + click', () => {
    renderChat();
    fireEvent.click(screen.getByTitle(/new channel/i));
    expect(screen.getByPlaceholderText(/channel-name/i)).toBeInTheDocument();
  });

  it('calls fetchChannels on mount with workspaceId and projectId', () => {
    renderChat();
    expect(mockFetchChannels).toHaveBeenCalledWith({ workspaceId: 'ws1', projectId: 'proj1' });
  });
});
