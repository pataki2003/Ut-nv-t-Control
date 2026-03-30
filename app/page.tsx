import { redirect } from 'next/navigation';

export default function HomePage() {
  // TODO: Replace with auth-aware routing once authentication is implemented.
  redirect('/login');
}
