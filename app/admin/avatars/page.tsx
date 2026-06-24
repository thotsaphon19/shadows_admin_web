'use client';
// shadows-admin/app/admin/avatars/page.tsx
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const AVATAR_COUNT = 25;
const AVATAR_LABELS = [
  'Flower Girl','Street Style','Tennis','Skater','Winter Coat',
  'Book Worm','Artist','Explorer','Scientist','Business',
  'Chef','Gamer','Doctor','Musician','Hiker',
  'Pilot','Magician','Astronaut','Detective','Skater 2',
  'Fashion','Barista','Delivery','Photographer','Traveler',
];

export default function AvatarsPage() {
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { loadAvatars(); }, []);

  const loadAvatars = async () => {
    const snap = await getDocs(collection(db, 'avatars'));
    const urls: Record<string, string> = {};
    snap.docs.forEach(d => { urls[d.id] = d.data().url; });
    setAvatarUrls(urls);
    setLoading(false);
  };

  const uploadAvatar = async (index: number, file: File) => {
    const id = `avatar_${String(index).padStart(2, '0')}`;
    const storageRef = ref(storage, `avatars/${id}.png`);
    const task = uploadBytesResumable(storageRef, file);

    task.on('state_changed',
      snap => setProgress(p => ({
        ...p, [id]: Math.round(snap.bytesTransferred / snap.totalBytes * 100)
      })),
      err => alert('Upload error: ' + err.message),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        await setDoc(doc(db, 'avatars', id), {
          url, index, label: AVATAR_LABELS[index],
          isPremium: index > 0, updatedAt: new Date(),
        });
        setAvatarUrls(prev => ({ ...prev, [id]: url }));
        setProgress(p => { const n = {...p}; delete n[id]; return n; });
      }
    );
  };

  const handleFile = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(index, file);
  };

  const uploadAll = async () => {
    // trigger all file inputs ที่ยังไม่มีรูป
    fileRefs.current.forEach((ref, i) => {
      if (ref && !avatarUrls[`avatar_${String(i).padStart(2, '0')}`]) {
        ref.click();
      }
    });
  };

  const uploadedCount = Object.keys(avatarUrls).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Avatars</h1>
          <p className="text-sm text-gray-500 mt-1">
            อัปโหลดแล้ว {uploadedCount}/{AVATAR_COUNT} ตัว
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">ความคืบหน้าการอัปโหลด</span>
          <span className="text-sm text-gray-500">{uploadedCount}/{AVATAR_COUNT}</span>
        </div>
        <div className="bg-gray-100 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all"
            style={{ width: `${(uploadedCount / AVATAR_COUNT) * 100}%` }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-gray-400">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: AVATAR_COUNT }).map((_, i) => {
            const id  = `avatar_${String(i).padStart(2, '0')}`;
            const url = avatarUrls[id];
            const pct = progress[id];
            return (
              <div key={id} className="group relative">
                <div
                  className={`aspect-square rounded-xl border-2 overflow-hidden cursor-pointer
                    ${url ? 'border-green-400' : 'border-dashed border-gray-200 hover:border-green-400'}
                    bg-gray-50 flex items-center justify-center`}
                  onClick={() => fileRefs.current[i]?.click()}
                >
                  {url ? (
                    <img src={url} alt={AVATAR_LABELS[i]} className="w-full h-full object-contain p-1" />
                  ) : pct !== undefined ? (
                    <div className="text-center p-2">
                      <div className="text-xs text-blue-600 font-medium">{pct}%</div>
                      <div className="bg-gray-200 rounded-full h-1 mt-1">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-2">
                      <div className="text-2xl text-gray-300">+</div>
                    </div>
                  )}
                </div>
                <div className="mt-1 text-center">
                  <div className="text-xs font-medium text-gray-600">{String(i).padStart(2, '0')}</div>
                  <div className="text-xs text-gray-400 truncate">{AVATAR_LABELS[i]}</div>
                  {i === 0 && <span className="badge-green text-xs">Free</span>}
                  {i > 0 && <span className="badge-gold text-xs">Premium</span>}
                </div>
                <input
                  ref={el => { fileRefs.current[i] = el; }}
                  type="file" accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={e => handleFile(i, e)}
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
        <strong>วิธีใช้:</strong> คลิกที่ช่องแต่ละช่องเพื่ออัปโหลดรูป Avatar ทีละตัว
        แนะนำขนาด <strong>300×300px PNG</strong> พื้นหลัง Transparent หรือขาว
        รูปจะถูกบันทึกใน Firebase Storage และอัปเดตใน Firestore อัตโนมัติ
      </div>
    </div>
  );
}
