import React from 'react';
import type { AppProps } from 'next/app';
import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';
import { AuthProvider } from '../components/AuthContext';
import { EventsProvider } from '../components/EventsContext';
import '../styles/globals.css';
import { UserProvider } from '../components/UserContext';
import { SessionProvider } from 'next-auth/react';
import { ChatProvider } from '@/contexts/ChatContext';
import { MatchesProvider } from '../components/MatchesContext';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout) {
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page: ReactElement) => page);
  
  return (
    <SessionProvider session={session}>
      <UserProvider>
        <AuthProvider>
          <EventsProvider>
            <MatchesProvider>
              <ChatProvider>
                {getLayout(<Component {...pageProps} />)}
              </ChatProvider>
            </MatchesProvider>
          </EventsProvider>
        </AuthProvider>
      </UserProvider>
    </SessionProvider>
  );
}

export default MyApp; 