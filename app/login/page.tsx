'use client';
// shadows-admin/app/login/page.tsx
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch {
      setError('Email หรือ Password ไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
            <span className="text-2xl font-black text-green-800">S</span>
          </div>
          <div>
            <div className="text-xl font-bold text-green-800">Shadows Admin</div>
            <div className="text-xs text-gray-500">by yannawut</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h1>
        <p className="text-gray-500 text-sm mb-6">สำหรับผู้ดูแลระบบเท่านั้น</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email" className="input" placeholder="admin@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password" className="input" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}
          <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
