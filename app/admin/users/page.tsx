'use client';
// shadows-admin/app/admin/users/page.tsx
import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
    setUsers(list);
    setLoading(false);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.displayName ?? '').toLowerCase().includes(q)
      || (u.email ?? '').toLowerCase().includes(q);
    const matchFilter = filter === 'all'
      || (filter === 'premium' && u.package === 'premium')
      || (filter === 'free'    && u.package !== 'premium');
    return matchSearch && matchFilter;
  });

  const togglePremium = async (u: any) => {
    const newPkg = u.package === 'premium' ? 'free' : 'premium';
    await updateDoc(doc(db, 'users', u.id), { package: newPkg });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, package: newPkg } : x));
  };

  const premiumCount = users.filter(u => u.package === 'premium').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            ทั้งหมด {users.length} คน | Premium {premiumCount} คน
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5">
        <input
          className="input flex-1" placeholder="ค้นหาชื่อหรือ email..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-36" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">ทั้งหมด</option>
          <option value="premium">Premium</option>
          <option value="free">Free</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['ชื่อ', 'Email', 'Package', 'ชั่วโมงฝึก', 'Streak', 'Avatar', 'จัดการ'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.displayName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={u.package === 'premium' ? 'badge-gold' : 'badge-gray'}>
                      {u.package === 'premium' ? '👑 Premium' : 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {((u.totalPracticeMinutes ?? 0) / 60).toFixed(1)} h
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.streakDays ?? 0} 🔥</td>
                  <td className="px-4 py-3 text-gray-400">{u.avatarId ?? '0'}</td>
                  <td className="px-4 py-3">
                    <button
                      className={u.package === 'premium' ? 'btn-secondary text-xs py-1 px-3' : 'btn-primary text-xs py-1 px-3'}
                      onClick={() => togglePremium(u)}
                    >
                      {u.package === 'premium' ? '↓ ลด Free' : '↑ อัป Premium'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
