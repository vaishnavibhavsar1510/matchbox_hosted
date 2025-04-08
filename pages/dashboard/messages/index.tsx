import React, { useEffect, useState } from 'react';
import { useUser } from '../../../components/UserContext';
import { Avatar } from '../../../components/Avatar';
import { Chat as ChatComponent } from '../../../components/Chat';
import { Sidebar } from '../../../components/Sidebar';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

interface Participant {
  _id: string;
  email: string;
  name: string;
  profileImage?: string;
}

interface Message {
  id: string;
  content: string;
  sender: Participant;
  timestamp: string;
}

interface Chat {
  id: string;
  participants: Participant[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export default function Messages() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/signin';
    },
  });
  const { userData } = useUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<Participant | null>(null);
  const [chatUsers, setChatUsers] = useState<Record<string, Participant>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loadChats = async () => {
      if (!session?.user?.email) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/chats');
        if (response.ok) {
          const data = await response.json();
          // Sort chats by latest message timestamp
          const sortedChats = data.sort((a: Chat, b: Chat) => {
            const aTime = a.lastMessage?.timestamp || a.updatedAt;
            const bTime = b.lastMessage?.timestamp || b.updatedAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          });
          setChats(sortedChats);

          // Create a map of all participants
          const userMap: Record<string, Participant> = {};
          sortedChats.forEach((chat: Chat) => {
            chat.participants.forEach((participant: Participant) => {
              if (participant.email !== session.user?.email) {
                userMap[participant.email] = participant;
              }
            });
          });
          
          setChatUsers(userMap);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      loadChats();
    }
  }, [session?.user?.email]);

  const getOtherParticipant = (chat: Chat): Participant => {
    const otherParticipant = chat.participants.find(p => p.email !== session?.user?.email);
    return otherParticipant || { _id: '', email: '', name: 'Unknown User' };
  };

  const getLastMessage = (chat: Chat): string => {
    return chat.lastMessage?.content || 'No messages yet';
  };

  const getLastMessageTime = (chat: Chat): Date => {
    return new Date(chat.lastMessage?.timestamp || chat.updatedAt || chat.createdAt);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return days + 'd ago';
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleChatSelect = (chat: Chat) => {
    const otherParticipant = getOtherParticipant(chat);
    setSelectedRecipient(otherParticipant);
    setSelectedChat(chat);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0F29] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-700 via-violet-800 to-indigo-900 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-semibold text-purple-200 mb-4">Loading...</h2>
          <p className="text-purple-200/70">Please wait while we fetch your messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0F29]">
      <Head>
        <title>Messages - MatchBox</title>
        <meta name="description" content="Your MatchBox messages" />
      </Head>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex">
        {/* Chat List */}
        <div className="w-80 bg-[#1E1B2E] border-r border-purple-900/20">
          <div className="p-4 border-b border-purple-900/20">
            <h2 className="text-xl font-semibold text-white">Messages</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-5rem)]">
            {chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat)}
                  className={"p-4 border-b border-purple-900/20 cursor-pointer hover:bg-purple-900/20 transition-colors flex items-center gap-3 " +
                    (selectedChat?.id === chat.id ? 'bg-purple-900/30' : '')}
                >
                  <Avatar 
                    name={otherParticipant.name} 
                    image={otherParticipant.profileImage}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium text-purple-200 truncate">
                        {otherParticipant.name}
                      </h3>
                      <span className="text-xs text-purple-400">
                        {formatTime(getLastMessageTime(chat))}
                      </span>
                    </div>
                    <p className="text-sm text-purple-300/70 truncate">
                      {getLastMessage(chat)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Window or Empty State */}
        <div className="flex-1 bg-[#0A0F29]">
          {selectedRecipient ? (
            <ChatComponent
              recipient={selectedRecipient}
              onClose={() => {
                setSelectedChat(null);
                setSelectedRecipient(null);
              }}
              isFloating={false}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center text-purple-300">
              <div>
                <svg className="w-12 h-12 mx-auto mb-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg">Select a chat to start messaging</p>
                <p className="text-sm mt-2 text-purple-300/70">Your conversations will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 