import { redirect } from 'next/navigation';

export default function ChatRedirect({ params }: { params: { conversationId: string } }) {
    redirect(`/chats/${params.conversationId}`);
}
