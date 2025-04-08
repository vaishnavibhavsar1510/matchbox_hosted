import { useEffect, useState } from 'react';
import { initializeSocket, getSocket, disconnectSocket } from '../utils/socket';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
}

interface EventChatProps {
  eventId: string;
}

export default function EventChat({ eventId }: EventChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const socket = await initializeSocket();
        setIsConnected(true);

        socket.emit('join-room', eventId);

        socket.on('message', (message: Message) => {
          setMessages((prev) => [...prev, message]);
        });

        return () => {
          socket.emit('leave-room', eventId);
          disconnectSocket();
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setIsConnected(false);
      }
    };

    setupSocket();
  }, [eventId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    try {
      const socket = getSocket();
      socket.emit('message', {
        eventId,
        content: newMessage.trim(),
        timestamp: new Date()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <span className="text-sm text-gray-500">{message.sender}</span>
            <p className="bg-gray-100 p-2 rounded-lg">{message.content}</p>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-4 py-2"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
        {!isConnected && (
          <p className="text-red-500 text-sm mt-2">
            Disconnected from chat. Please refresh the page.
          </p>
        )}
      </div>
    </div>
  );
} 