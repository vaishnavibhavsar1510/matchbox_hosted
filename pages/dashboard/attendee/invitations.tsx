import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import InvitationsList from '../../../components/InvitationsList';

export default function InvitationsPage() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  return (
    <div className="min-h-screen bg-[#0A0F29]">
      <Head>
        <title>Invitations | MatchBox</title>
        <meta name="description" content="View and manage your event invitations" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <InvitationsList />
      </main>
    </div>
  );
} 