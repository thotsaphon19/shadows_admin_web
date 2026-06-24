'use client';
// shadows-admin/app/admin/lessons/page.tsx
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const LANGUAGES  = ['English', 'Japanese', 'Chinese', 'Korean', 'Spanish'];
const CATEGORIES = [
  'Coffee Shop','Airport','Hotel','Restaurant','Shopping','Self Intro',
  'Job Interview','Business','Phone Call','Short Email','Directions',
  'Taxi Ride','Train & Bus','Hospital','Pharmacy','Making Friends',
  'Family Talk','Hobbies','Weekend Plans','Emergency',
];

export default function LessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [filterLang, setFilterLang] = useState('');
  const [filterCat,  setFilterCat]  = useState('');

  const [form, setForm] = useState({
    title: '', text: '', category: 'Coffee Shop',
    language: 'English', wordCount: 50, isPremium: false,
  });

  useEffect(() => { loadLessons(); }, []);

  const loadLessons = async () => {
    const snap = await getDocs(collection(db, 'lessons'));
    setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const filtered = lessons.filter(l =>
    (!filterLang || l.language === filterLang) &&
    (!filterCat  || l.category === filterCat)
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', text: '', category: 'Coffee Shop', language: 'English', wordCount: 50, isPremium: false });
    setShowModal(true);
  };

  const openEdit = (l: any) => {
    setEditing(l);
    setForm({ title: l.title ?? '', text: l.text ?? '', category: l.category ?? 'Coffee Shop',
              language: l.language ?? 'English', wordCount: l.wordCount ?? 50, isPremium: l.isPremium ?? false });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.text.trim()) { alert('กรุณากรอกเนื้อหาบทเรียน'); return; }
    setSaving(true);
    try {
      const data: any = { ...form, updatedAt: serverTimestamp() };
      if (editing) {
        await updateDoc(doc(db, 'lessons', editing.id), data);
      } else {
        data.createdAt = serverTimestamp();
        data.createdBy = 'admin';
        await addDoc(collection(db, 'lessons'), data);
      }
      setShowModal(false);
      await loadLessons();
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (l: any) => {
    if (!confirm(`ลบบทเรียน "${l.category}" ?`)) return;
    await deleteDoc(doc(db, 'lessons', l.id));
    setLessons(prev => prev.filter(x => x.id !== l.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lessons</h1>
        <button className="btn-primary" onClick={openAdd}>+ เพิ่มบทเรียน</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select className="input w-40" value={filterLang} onChange={e => setFilterLang(e.target.value)}>
          <option value="">ทุกภาษา</option>
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="input w-44" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">ทุก Category</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} บทเรียน</span>
      </div>

      {loading ? (
        <div className="text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Category','Language','Words','Premium','เนื้อหา (ตัดย่อ)',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{l.category}</td>
                  <td className="px-4 py-3 text-gray-500">{l.language}</td>
                  <td className="px-4 py-3 text-gray-500">{l.wordCount}</td>
                  <td className="px-4 py-3">
                    <span className={l.isPremium ? 'badge-gold' : 'badge-green'}>
                      {l.isPremium ? '👑' : 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">
                    {(l.text ?? '').slice(0, 60)}...
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs py-1 px-2" onClick={() => openEdit(l)}>✏️</button>
                      <button className="btn-danger text-xs py-1 px-2" onClick={() => handleDelete(l)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editing ? 'แก้ไขบทเรียน' : 'เพิ่มบทเรียนใหม่'}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">ภาษา</label>
                  <select className="input" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Word Count</label>
                  <select className="input" value={form.wordCount} onChange={e => setForm(f => ({ ...f, wordCount: Number(e.target.value) }))}>
                    <option value={50}>50 คำ (Free)</option>
                    <option value={100}>100 คำ (Premium)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">เนื้อหาบทเรียน *</label>
                <textarea
                  className="input h-40 resize-none"
                  placeholder="กรอกเนื้อหาบทเรียนภาษาอังกฤษ..."
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {form.text.split(/\s+/).filter(Boolean).length} คำ
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPrem" checked={form.isPremium}
                  onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} />
                <label htmlFor="isPrem" className="text-sm font-medium">Premium Only</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : editing ? '💾 อัปเดต' : '➕ เพิ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
