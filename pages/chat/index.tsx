import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useChatContext } from '@/contexts/ChatContext';

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { socket, isConnected, error: chatError, messages: contextMessages, sendMessage: sendContextMessage } = useChatContext();
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle chat initialization
  useEffect(() => {
    const chatId = router.query.id;
    if (!chatId || typeof chatId !== 'string') {
      setError('Invalid chat session');
      return;
    }

    if (socket && isConnected) {
      socket.emit('join_chat', { chatId });
    }
  }, [router.query.id, socket, isConnected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !isConnected) {
      setError('Chat connection not available');
      return;
    }

    if (!newMessage.trim()) return;

    try {
      sendContextMessage(newMessage);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0F29] p-4">
      <div className="max-w-4xl mx-auto bg-[#1E1B2E] rounded-xl shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="bg-[#2D2640] p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()} 
              className="text-white hover:text-purple-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Chat</h1>
          </div>
          {!isConnected && (
            <span className="text-red-400 text-sm">Disconnected</span>
          )}
        </div>

        {/* Chat Messages */}
        <div className="h-[calc(100vh-16rem)] overflow-y-auto p-4 space-y-4">
          {contextMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === session?.user?.email ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender === session?.user?.email
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#2D2640] text-white'
                }`}
              >
                <p>{message.content}</p>
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {(error || chatError) && (
          <div className="p-2 text-center text-red-400 bg-red-400 bg-opacity-10">
            {error || chatError}
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-[#2D2640]">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-lg bg-[#1E1B2E] text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              type="submit"
              disabled={!isConnected}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 