'use client';
// shadows-admin/app/admin/layout.tsx
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

const NAV = [
  { href: '/admin/dashboard',      icon: '📊', label: 'Dashboard'   },
  { href: '/admin/tutors',         icon: '👨‍🏫', label: 'AI Tutors'   },
  { href: '/admin/lessons',        icon: '📚', label: 'Lessons'     },
  { href: '/admin/avatars',        icon: '🎭', label: 'Avatars'     },
  { href: '/admin/users',          icon: '👥', label: 'Users'       },
  { href: '/admin/notifications',  icon: '🔔', label: 'Notifications'},
  { href: '/admin/tts',            icon: '🔊', label: 'TTS / Voice'  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) { router.push('/login'); return; }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-green-800 text-lg font-medium">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-xl font-black text-green-800">S</span>
            </div>
            <div>
              <div className="font-bold text-green-800 text-sm">Shadows Admin</div>
              <div className="text-xs text-gray-400">by yannawut</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${pathname === item.href
                  ? 'bg-green-50 text-green-800'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400 mb-1 truncate">{user?.email}</div>
          <button
            onClick={() => signOut(auth).then(() => router.push('/login'))}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  );
}
