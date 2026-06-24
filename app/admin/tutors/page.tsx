'use client';
// shadows-admin/app/admin/tutors/page.tsx
// จัดการ AI Tutors: เพิ่ม/แก้/ลบ + อัปโหลดรูปภาพ + วิดีโอ MP4

import { useEffect, useState, useRef } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const LANGUAGES = ['English', 'Japanese', 'Chinese', 'Korean', 'Spanish', 'French'];
const GENDERS   = ['หญิง', 'ชาย'];
const ELEVENLABS_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Male EN)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Female EN)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (Female EN)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Female EN)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Male EN)' },
];

interface Tutor {
  id: string;
  name: string;
  language: string;
  gender: string;
  voiceDesc: string;
  isPremium: boolean;
  flag: string;
  photoUrl?: string;
  videoUrl?: string;
  audioSampleUrl?: string;
  elevenLabsVoiceId?: string;
}

const FLAG_MAP: Record<string, string> = {
  English: '🇺🇸', Japanese: '🇯🇵', Chinese: '🇨🇳',
  Korean: '🇰🇷', Spanish: '🇪🇸', French: '🇫🇷',
};

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tutor | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [form, setForm] = useState({
    name: '', language: 'English', gender: 'หญิง',
    voiceDesc: '', isPremium: false, elevenLabsVoiceId: '',
  });

  const photoRef  = useRef<HTMLInputElement>(null);
  const videoRef  = useRef<HTMLInputElement>(null);
  const audioRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { loadTutors(); }, []);

  const loadTutors = async () => {
    const snap = await getDocs(collection(db, 'tutors'));
    setTutors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tutor)));
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', language: 'English', gender: 'หญิง', voiceDesc: '', isPremium: false, elevenLabsVoiceId: '' });
    setShowModal(true);
  };

  const openEdit = (t: Tutor) => {
    setEditing(t);
    setForm({ name: t.name, language: t.language, gender: t.gender,
              voiceDesc: t.voiceDesc, isPremium: t.isPremium,
              elevenLabsVoiceId: t.elevenLabsVoiceId ?? '' });
    setShowModal(true);
  };

  // ── อัปโหลดไฟล์ไป Firebase Storage ────────────────────────
  const uploadFile = (file: File, path: string, key: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed',
        snap => setUploadProgress(p => ({ ...p, [key]: Math.round(snap.bytesTransferred / snap.totalBytes * 100) })),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref)),
      );
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('กรุณากรอกชื่อ Tutor'); return; }
    setSaving(true);
    try {
      const flag = FLAG_MAP[form.language] ?? '🌐';
      let data: any = { ...form, flag, updatedAt: serverTimestamp() };

      const tutorId = editing?.id ?? `tutor_${Date.now()}`;

      // อัปโหลดรูปภาพ
      if (photoRef.current?.files?.[0]) {
        const url = await uploadFile(
          photoRef.current.files[0],
          `tutors/${tutorId}/photo.jpg`, 'photo'
        );
        data.photoUrl = url;
      }
      // อัปโหลดวิดีโอ MP4
      if (videoRef.current?.files?.[0]) {
        const url = await uploadFile(
          videoRef.current.files[0],
          `tutors/${tutorId}/video.mp4`, 'video'
        );
        data.videoUrl = url;
      }
      // อัปโหลด audio sample
      if (audioRef.current?.files?.[0]) {
        const url = await uploadFile(
          audioRef.current.files[0],
          `tutors/${tutorId}/audio_sample.mp3`, 'audio'
        );
        data.audioSampleUrl = url;
      }

      if (editing) {
        await updateDoc(doc(db, 'tutors', editing.id), data);
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'tutors'), data);
      }

      setShowModal(false);
      setUploadProgress({});
      await loadTutors();
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Tutor) => {
    if (!confirm(`ลบ Tutor "${t.name}" ?`)) return;
    await deleteDoc(doc(db, 'tutors', t.id));
    setTutors(prev => prev.filter(x => x.id !== t.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Tutors</h1>
        <button className="btn-primary" onClick={openAdd}>+ เพิ่ม Tutor</button>
      </div>

      {loading ? (
        <div className="text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutors.map(t => (
            <div key={t.id} className="card flex gap-4">
              {/* Photo */}
              <div className="w-16 h-16 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {t.photoUrl
                  ? <img src={t.photoUrl} alt={t.name} className="w-full h-full object-cover" />
                  : <span className="text-3xl">{t.flag}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{t.name}</span>
                  <span className={t.isPremium ? 'badge-gold' : 'badge-green'}>
                    {t.isPremium ? '👑 Premium' : 'Free'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {t.flag} {t.language} | {t.gender}
                </div>
                <div className="text-sm text-green-700 mt-0.5">🔊 {t.voiceDesc || '—'}</div>

                {/* Media status */}
                <div className="flex gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.videoUrl ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {t.videoUrl ? '✓ วิดีโอ' : '✗ ไม่มีวิดีโอ'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.audioSampleUrl ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {t.audioSampleUrl ? '✓ เสียงตัวอย่าง' : '✗ ไม่มีเสียง'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button className="btn-secondary text-xs py-1 px-3" onClick={() => openEdit(t)}>✏️ แก้ไข</button>
                  <button className="btn-danger text-xs py-1 px-3" onClick={() => handleDelete(t)}>🗑️ ลบ</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editing ? 'แก้ไข Tutor' : 'เพิ่ม Tutor ใหม่'}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">ชื่อ Tutor *</label>
                  <input className="input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">ภาษา</label>
                  <select className="input" value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">เพศ</label>
                  <select className="input" value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">คำอธิบายเสียง</label>
                  <input className="input" placeholder="เช่น เสียงใส ชัดเจน"
                    value={form.voiceDesc}
                    onChange={e => setForm(f => ({ ...f, voiceDesc: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="label">ElevenLabs Voice ID</label>
                <select className="input" value={form.elevenLabsVoiceId}
                  onChange={e => setForm(f => ({ ...f, elevenLabsVoiceId: e.target.value }))}>
                  <option value="">— เลือก Voice —</option>
                  {ELEVENLABS_VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="isPremium" checked={form.isPremium}
                  onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} />
                <label htmlFor="isPremium" className="text-sm font-medium text-gray-700">
                  Premium Only (ต้องสมัครสมาชิก)
                </label>
              </div>

              {/* File uploads */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h3 className="font-semibold text-sm text-gray-700">ไฟล์มีเดีย</h3>

                {/* Photo */}
                <div>
                  <label className="label">รูปภาพ Tutor (JPG/PNG)</label>
                  <input ref={photoRef} type="file" accept="image/*" className="input text-sm py-1.5" />
                  {uploadProgress.photo !== undefined && (
                    <div className="mt-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${uploadProgress.photo}%` }} />
                    </div>
                  )}
                </div>

                {/* Video */}
                <div>
                  <label className="label">วิดีโอ AI Tutor (MP4 - แนะนำ 720p, &lt;50MB)</label>
                  <input ref={videoRef} type="file" accept="video/mp4,video/*" className="input text-sm py-1.5" />
                  {uploadProgress.video !== undefined && (
                    <div className="mt-1">
                      <div className="bg-gray-100 rounded-full h-2 mb-1">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${uploadProgress.video}%` }} />
                      </div>
                      <div className="text-xs text-gray-500">อัปโหลด {uploadProgress.video}%</div>
                    </div>
                  )}
                </div>

                {/* Audio sample */}
                <div>
                  <label className="label">เสียงตัวอย่าง (MP3) — ให้ผู้ใช้ฟังก่อนเลือกครู</label>
                  <input ref={audioRef} type="file" accept="audio/*" className="input text-sm py-1.5" />
                  {uploadProgress.audio !== undefined && (
                    <div className="mt-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${uploadProgress.audio}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>
                ยกเลิก
              </button>
              <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : editing ? '💾 อัปเดต' : '➕ เพิ่ม Tutor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
