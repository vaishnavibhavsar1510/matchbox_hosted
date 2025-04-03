import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { IMessage } from '@/models/Chat';

interface ChatContextType {
  socket: Socket | null;
  isConnected: boolean;
  startChat: (matchId: string) => Promise<string>;
  error: string | null;
  messages: IMessage[];
  sendMessage: (content: string) => Promise<void>;
  currentChatId: string | null;
}

const ChatContext = createContext<ChatContextType>({
  socket: null,
  isConnected: false,
  startChat: async () => '',
  error: null,
  messages: [],
  sendMessage: async () => {},
  currentChatId: null
});

export const useChatContext = () => useContext(ChatContext);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  const initSocket = useCallback(() => {
    if (!session?.user?.email) return null;

    try {
      // First, ensure any existing socket is disconnected
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      // Initialize new socket connection
      const socketInstance = io(window.location.origin, {
        path: '/api/socketio',
        addTrailingSlash: false,
        auth: {
          token: session.user.email
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000
      });

      // Connection events
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setError(null);
        
        // Rejoin chat room if there was an active chat
        if (currentChatId) {
          socketInstance.emit('join_chat', { chatId: currentChatId });
        }
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to chat server');
        setIsConnected(false);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      // Chat events
      socketInstance.on('message', async (message: IMessage) => {
        if (currentChatId) {
          try {
            // Save message to database
            await fetch('/api/chat/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chatId: currentChatId,
                message
              })
            });
            
            setMessages(prev => [...prev, message]);
          } catch (err) {
            console.error('Error saving message:', err);
          }
        }
      });

      socketInstance.on('user_joined', (data) => {
        console.log('User joined:', data);
      });

      socketInstance.on('user_left', (data) => {
        console.log('User left:', data);
      });

      socketRef.current = socketInstance;
      return socketInstance;
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError('Failed to initialize chat connection');
      return null;
    }
  }, [session?.user?.email, currentChatId]);

  // Set up socket connection
  useEffect(() => {
    const socketInstance = initSocket();
    if (socketInstance) {
      setSocket(socketInstance);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [initSocket]);

  // Load messages when chat ID changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentChatId) return;

      try {
        const response = await fetch(`/api/chat/messages?chatId=${currentChatId}`);
        if (!response.ok) {
          throw new Error('Failed to load messages');
        }
        const data = await response.json();
        setMessages(data.messages);
      } catch (err) {
        console.error('Error loading messages:', err);
        setError('Failed to load messages');
      }
    };

    loadMessages();
  }, [currentChatId]);

  const startChat = async (matchId: string): Promise<string> => {
    try {
      if (!socketRef.current) {
        const newSocket = initSocket();
        if (!newSocket) {
          throw new Error('Failed to initialize chat connection');
        }
        setSocket(newSocket);
        // Wait for connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
          newSocket.once('connect', () => {
            clearTimeout(timeout);
            resolve(true);
          });
        });
      }

      if (!isConnected) {
        throw new Error('Chat server not connected');
      }

      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to start chat');
      }

      const { chatId, messages: existingMessages } = await response.json();
      setCurrentChatId(chatId);
      setMessages(existingMessages || []);

      if (socketRef.current) {
        socketRef.current.emit('join_chat', { chatId });
      }
      
      return chatId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start chat';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!socketRef.current || !isConnected || !content.trim() || !currentChatId) {
      return;
    }

    try {
      const message: IMessage = {
        content,
        sender: session?.user?.email || '',
        timestamp: new Date().toISOString()
      };

      // Save message to database first
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: currentChatId,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save message');
      }

      // Then emit to other participants
      socketRef.current.emit('send_message', message);
      
      // Update local state
      setMessages(prev => [...prev, message]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  }, [isConnected, currentChatId, session?.user?.email]);

  return (
    <ChatContext.Provider value={{ 
      socket, 
      isConnected, 
      startChat, 
      error, 
      messages, 
      sendMessage,
      currentChatId 
    }}>
      {children}
    </ChatContext.Provider>
  );
} 