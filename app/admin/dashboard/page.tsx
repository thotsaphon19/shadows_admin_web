'use client';
// shadows-admin/app/admin/dashboard/page.tsx
import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0, premiumUsers: 0,
    totalLessons: 0, totalTutors: 0, totalRecordings: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, lessons, tutors, recordings] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'lessons')),
          getDocs(collection(db, 'tutors')),
          getDocs(collection(db, 'recordings')),
        ]);
        const premium = users.docs.filter(d => d.data().package === 'premium').length;
        setStats({
          totalUsers: users.size, premiumUsers: premium,
          totalLessons: lessons.size, totalTutors: tutors.size,
          totalRecordings: recordings.size,
        });
        // recent 5 users
        const recent = users.docs
          .sort((a, b) => (b.data().createdAt?.seconds ?? 0) - (a.data().createdAt?.seconds ?? 0))
          .slice(0, 5)
          .map(d => ({ id: d.id, ...d.data() }));
        setRecentUsers(recent);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STAT_CARDS = [
    { label: 'ผู้ใช้ทั้งหมด',   value: stats.totalUsers,      icon: '👥', color: 'blue'   },
    { label: 'Premium Members', value: stats.premiumUsers,    icon: '👑', color: 'yellow' },
    { label: 'AI Tutors',        value: stats.totalTutors,     icon: '👨‍🏫', color: 'green' },
    { label: 'บทเรียน',         value: stats.totalLessons,    icon: '📚', color: 'purple' },
    { label: 'Recordings',      value: stats.totalRecordings, icon: '🎙️', color: 'red'    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : s.value.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">ผู้ใช้ล่าสุด</h2>
        {loading ? (
          <div className="text-gray-400 text-sm">กำลังโหลด...</div>
        ) : recentUsers.length === 0 ? (
          <div className="text-gray-400 text-sm">ยังไม่มีผู้ใช้</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">ชื่อ</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Package</th>
                <th className="pb-3 font-medium">ชั่วโมงฝึก</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 font-medium">{u.displayName ?? '—'}</td>
                  <td className="py-3 text-gray-500">{u.email ?? '—'}</td>
                  <td className="py-3">
                    <span className={u.package === 'premium' ? 'badge-gold' : 'badge-gray'}>
                      {u.package === 'premium' ? '👑 Premium' : 'Free'}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {((u.totalPracticeMinutes ?? 0) / 60).toFixed(1)} h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
