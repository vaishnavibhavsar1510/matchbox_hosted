import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../components/UserContext';
import io, { Socket } from 'socket.io-client';
import { Avatar } from './Avatar';
import { useSession } from 'next-auth/react';

interface Message {
  _id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface ChatProps {
  recipient: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  onClose: () => void;
  isFloating?: boolean;
}

export const Chat: React.FC<ChatProps> = ({ recipient, onClose, isFloating = true }) => {
  const { userData } = useUser();
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: session?.user?.email
      }
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Chat socket connected successfully');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Chat socket connection error:', error);
    });

    // Load existing messages
    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat?userId=${session.user.email}&recipientId=${recipient.email}`);
        if (response.ok) {
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
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    // Listen for new messages
    newSocket.on('new-message', (message: Message) => {
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        if (prev.some(m => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    return () => {
      newSocket.close();
    };
  }, [recipient.email, session?.user?.email]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !session?.user?.email) return;

    try {
      // First, ensure we have a chat room
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants: [session.user.email, recipient.email],
          message: newMessage,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to create/get chat room');
      }

      const chatData = await chatResponse.json();
      
      // Join the chat room if not already joined
      socket.emit('join-chat', chatData._id.toString());

      // Add the new message to the local state immediately
      if (chatData.messages?.length > 0) {
        const latestMessage = chatData.messages[chatData.messages.length - 1];
        setMessages(prev => {
          // Check if message already exists
          if (prev.some(m => m._id === latestMessage._id)) {
            return prev;
          }
          return [...prev, latestMessage];
        });
      }

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/30 via-violet-800/30 to-indigo-900/30 border-b border-purple-800/30">
        <div className="flex items-center gap-3">
          <Avatar 
            name={recipient.name} 
            image={recipient.profileImage}
            size="md"
          />
          <div>
            <h3 className="font-medium text-purple-200">{recipient.name}</h3>
            <span className="text-xs text-purple-200/70">Online</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-purple-300 hover:text-purple-200 transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-purple-900/10 via-violet-800/10 to-indigo-900/10">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender === session?.user?.email ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                message.sender === session?.user?.email
                  ? 'bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 text-white'
                  : 'bg-purple-900/20 text-purple-200 border border-purple-800/20'
              }`}
            >
              <p>{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gradient-to-r from-purple-900/20 via-violet-800/20 to-indigo-900/20 border-t border-purple-800/30">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-purple-900/20 text-purple-200 placeholder-purple-400/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/30 border border-purple-800/30"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 text-white rounded-lg hover:shadow-lg hover:shadow-purple-900/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}; 