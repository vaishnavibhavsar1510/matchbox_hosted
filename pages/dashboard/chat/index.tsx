import React, { useEffect, useState } from 'react';
import { useUser } from '../../../components/UserContext';
import { Avatar } from '../../../components/Avatar';
import { Chat } from '../../../components/Chat';
import { Sidebar } from '../../../components/Sidebar';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

interface Message {
  _id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface ChatData {
  _id: string;
  participants: string[];
  messages: Message[];
  createdAt: Date;
  updatedAt?: Date;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export default function Messages() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      window.location.href = '/auth/signin';
    },
  });
  const { userData } = useUser();
  const [chats, setChats] = useState<ChatData[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<UserData | null>(null);
  const [chatUsers, setChatUsers] = useState<Record<string, UserData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loadChats = async () => {
      if (!session?.user?.email) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/chat?userId=${encodeURIComponent(session.user.email)}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Loaded chats:', data);
          
          // Sort chats by latest message or creation date
          const sortedChats = data.sort((a: ChatData, b: ChatData) => {
            const aLastMessage = a.messages[a.messages.length - 1];
            const bLastMessage = b.messages[b.messages.length - 1];
            return new Date(bLastMessage?.timestamp || b.updatedAt || b.createdAt).getTime() -
                   new Date(aLastMessage?.timestamp || a.updatedAt || a.createdAt).getTime();
          });
          setChats(sortedChats);

          // Load user details for all participants
          const userEmails = new Set<string>(sortedChats.flatMap((chat: ChatData) => 
            chat.participants.filter((p: string) => p !== session.user?.email)
          ));
          
          console.log('Found other participants:', Array.from(userEmails));

          const userDetailsPromises = Array.from(userEmails).map(async (email: string) => {
            try {
              console.log('Fetching details for:', email);
              const userResponse = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log('Received user data:', userData);
                return [email, userData] as [string, UserData];
              } else {
                console.error('Failed to fetch user data for:', email);
                return [email, { email, name: email.split('@')[0] }] as [string, UserData];
              }
            } catch (error) {
              console.error('Error fetching user details for', email, ':', error);
              return [email, { email, name: email.split('@')[0] }] as [string, UserData];
            }
          });

          const userDetails = await Promise.all(userDetailsPromises);
          console.log('All user details:', userDetails);
          
          const userMap = Object.fromEntries(userDetails);
          console.log('Final user map:', userMap);
          
          setChatUsers(userMap);
        } else {
          console.error('Failed to load chats:', await response.text());
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

  const getOtherParticipant = (chat: ChatData) => {
    console.log('Current user email:', session?.user?.email);
    console.log('Chat participants:', chat.participants);
    const otherParticipantEmail = chat.participants.find(p => p !== session?.user?.email) || '';
    console.log('Other participant email:', otherParticipantEmail);
    console.log('Chat users map:', chatUsers);
    const otherParticipant = chatUsers[otherParticipantEmail] || { email: otherParticipantEmail, name: otherParticipantEmail };
    console.log('Returning other participant:', otherParticipant);
    return otherParticipant;
  };

  const getLastMessage = (chat: ChatData) => {
    if (chat.messages.length === 0) return 'No messages yet';
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage.content;
  };

  const getLastMessageTime = (chat: ChatData) => {
    if (chat.messages.length === 0) return new Date(chat.createdAt);
    const lastMessage = chat.messages[chat.messages.length - 1];
    return new Date(lastMessage.timestamp);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleChatSelect = async (chat: ChatData) => {
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
                  key={chat._id}
                  onClick={() => handleChatSelect(chat)}
                  className={`p-4 border-b border-purple-900/20 cursor-pointer hover:bg-purple-900/20 transition-colors flex items-center gap-3 ${
                    selectedChat?._id === chat._id ? 'bg-purple-900/30' : ''
                  }`}
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
            <Chat
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