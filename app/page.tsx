// app/page.tsx — redirect root → /login
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}
