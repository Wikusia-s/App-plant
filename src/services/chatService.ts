import { authService } from './authService';

const API_URL = 'http://localhost:5000/api/chat';

interface Source {
  plant_name: string;
  title: string;
  url: string;
}

interface ChatResponse {
  message: string;
  sources: Source[];
  messageId?: number;
}

interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  message: string;
  response: string;
  sources: Source[];
  created_at: string;
}

export const chatService = {
  async createConversation(title?: string): Promise<Conversation> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    const data = await response.json();
    return data.conversation;
  },

  async getConversations(): Promise<Conversation[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get conversations');
    }

    const data = await response.json();
    return data.conversations;
  },

  async getMessages(conversationId: number): Promise<Message[]> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get messages');
    }

    const data = await response.json();
    return data.messages;
  },

  async sendMessage(conversationId: number, message: string): Promise<ChatResponse> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    return await response.json();
  },

  async deleteConversation(conversationId: number): Promise<void> {
    const token = authService.getToken();
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete conversation');
    }
  },
};
