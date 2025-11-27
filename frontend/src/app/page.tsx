import { redirect } from 'next/navigation';

// Home page - redirect to auth
export default function Home() {
  redirect('/auth');
}
