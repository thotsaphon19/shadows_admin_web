'use client';
// app/login/page.tsx
// Login ด้วย hardcoded credentials — ไม่ผูกกับ Firebase Auth

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── กำหนด Admin accounts ตรงนี้ ──────────────────────────────
const ADMIN_ACCOUNTS = [
  { username: 'admin',    password: 'Shadows@2026' },
  { username: 'yannawut', password: 'Shadows@Admin' },
];
// ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // เช็ค credentials
    const match = ADMIN_ACCOUNTS.find(
      a => a.username === username.trim() && a.password === password
    );

    if (match) {
      // บันทึก session ใน sessionStorage
      sessionStorage.setItem('shadows_admin', 'true');
      sessionStorage.setItem('shadows_admin_user', username.trim());
      router.push('/admin/dashboard');
    } else {
      setError('Username หรือ Password ไม่ถูกต้อง');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
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

        <h1 className="text-2xl font-bold text-gray-900 mb-1">เข้าสู่ระบบ</h1>
        <p className="text-gray-500 text-sm mb-6">สำหรับผู้ดูแลระบบเท่านั้น</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text" className="input" placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required autoFocus
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password" className="input" placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full justify-center py-3 text-base"
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  );
}
