import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { initSocket, disconnectSocket } from '@/utils/socket';

interface Message {
  _id: string;
  content: string;
  sender: string;
  timestamp: string;
}

interface ChatProps {
  recipient: {
    email: string;
    name: string;
  };
  onClose: () => void;
  isFloating?: boolean;
}

export const Chat: React.FC<ChatProps> = ({ recipient, onClose, isFloating = true }) => {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    // Initialize socket connection
    const newSocket = initSocket(session.user.email);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Chat socket connected successfully');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
      setIsConnected(false);
      setError('Connection error. Attempting to reconnect...');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Chat socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        newSocket.connect();
      }
    });

    // Load existing messages
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat?userId=${session.user.email}&recipientId=${recipient.email}`);
        if (!response.ok) {
          throw new Error('Failed to load messages');
        }
        const data = await response.json();
        // Find the chat with this recipient
        const chat = Array.isArray(data) ? data.find(c => 
          c.participants.includes(recipient.email)
        ) : data;

        if (chat?._id) {
          // Join the chat room
          newSocket.emit('join-chat', chat._id.toString());
          setMessages(chat.messages || []);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setError('Failed to load messages. Please try again.');
      }
    };

    loadMessages();

    // Listen for new messages
    newSocket.on('new-message', (message: Message) => {
      console.log('Received new message:', message);
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    newSocket.on('message-sent', (message: Message) => {
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      setError(null);
    });

    newSocket.on('message-error', (error) => {
      setError('Failed to send message. Please try again.');
    });

    return () => {
      disconnectSocket();
    };
  }, [recipient.email, session?.user?.email]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !isConnected || !session?.user?.email) return;

    try {
      // First, ensure we have a chat room
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants: [session.user.email, recipient.email],
          message: {
            content: newMessage.trim(),
            sender: session.user.email
          }
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to create/get chat room');
      }

      const chatData = await chatResponse.json();
      
      // Join the chat room if not already joined
      socket.emit('join-chat', chatData._id.toString());

      // Send the message through socket
      socket.emit('send-message', {
        chatId: chatData._id.toString(),
        message: newMessage.trim(),
        sender: session.user.email
      });

      // Clear the input
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`${isFloating ? 'fixed bottom-4 right-4 w-96 h-[500px]' : 'w-full h-full'} 
                    bg-[#1A1F39] rounded-xl shadow-lg flex flex-col`}>
      <div className="p-4 border-b border-purple-800/30 flex justify-between items-center">
        <div>
          <h3 className="text-white font-semibold">{recipient.name}</h3>
          <p className="text-sm text-purple-300">{recipient.email}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender === session?.user?.email ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === session?.user?.email
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#2D2640] text-white'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-50 mt-1 block">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-purple-800/30">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-lg bg-[#2D2640] text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        {!isConnected && (
          <p className="text-red-400 text-sm mt-2">
            Disconnected from chat. Please refresh the page.
          </p>
        )}
      </form>
    </div>
  );
}; 