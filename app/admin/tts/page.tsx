'use client';
// shadows-admin/app/admin/tts/page.tsx
// เชื่อมต่อ ElevenLabs TTS สร้างเสียง Tutor พูดเนื้อหาบทเรียน

import { useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const ELEVENLABS_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', lang: 'EN', gender: 'ชาย' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', lang: 'EN', gender: 'หญิง' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', lang: 'EN', gender: 'หญิง' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', lang: 'EN', gender: 'หญิง' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', lang: 'EN', gender: 'ชาย' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', lang: 'EN', gender: 'ชาย' },
];

export default function TTSPage() {
  const [apiKey, setApiKey] = useState('');
  const [voiceId, setVoiceId] = useState(ELEVENLABS_VOICES[0].id);
  const [text, setText] = useState('Hello everyone. My name is Daniel, and today I want to talk about my daily routine.');
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.8);
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveTarget, setSaveTarget] = useState('');
  const [tutors, setTutors] = useState<any[]>([]);
  const [tutorLoaded, setTutorLoaded] = useState(false);
  const [lessonText, setLessonText] = useState('');
  const [mode, setMode] = useState<'sample' | 'lesson'>('sample');

  const loadTutors = async () => {
    const snap = await getDocs(collection(db, 'tutors'));
    setTutors(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setTutorLoaded(true);
  };

  // ── สร้างเสียงจาก ElevenLabs ──────────────────────────────
  const generateAudio = async () => {
    if (!apiKey) { alert('กรุณากรอก ElevenLabs API Key'); return; }
    if (!text.trim()) { alert('กรุณากรอกข้อความ'); return; }

    setGenerating(true);
    setAudioUrl('');
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability, similarity_boost: similarity },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail?.message ?? 'ElevenLabs error');
      }

      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ── บันทึกเสียงไป Firebase Storage ────────────────────────
  const saveToFirebase = async () => {
    if (!audioUrl) { alert('สร้างเสียงก่อน'); return; }
    if (!saveTarget) { alert('เลือก Tutor ที่จะบันทึก'); return; }

    setSaving(true);
    try {
      const resp = await fetch(audioUrl);
      const blob = await resp.blob();
      const file = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });

      const path = mode === 'sample'
        ? `tutors/${saveTarget}/audio_sample.mp3`
        : `tutors/${saveTarget}/lesson_${Date.now()}.mp3`;

      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      if (mode === 'sample') {
        await updateDoc(doc(db, 'tutors', saveTarget), { audioSampleUrl: downloadUrl });
      }

      alert('✅ บันทึกเรียบร้อยแล้ว!\nURL: ' + downloadUrl);
    } catch (e: any) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">TTS / Voice Generator</h1>
      <p className="text-gray-500 text-sm mb-6">
        สร้างเสียง AI Tutor ด้วย ElevenLabs → บันทึกใน Firebase Storage → ใช้ใน app
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left: Settings */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="font-semibold mb-4">⚙️ ตั้งค่า ElevenLabs</h2>

            <div className="mb-4">
              <label className="label">ElevenLabs API Key</label>
              <input
                type="password" className="input" placeholder="sk_..."
                value={apiKey} onChange={e => setApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">
                API Key ไม่ถูกบันทึก — ใส่ทุกครั้งที่ใช้งาน
              </p>
            </div>

            <div className="mb-4">
              <label className="label">Voice</label>
              <select className="input" value={voiceId} onChange={e => setVoiceId(e.target.value)}>
                {ELEVENLABS_VOICES.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.lang} | {v.gender})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stability: {stability}</label>
                <input type="range" min="0" max="1" step="0.05"
                  value={stability} onChange={e => setStability(Number(e.target.value))}
                  className="w-full accent-green-700"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>More Variable</span><span>More Stable</span>
                </div>
              </div>
              <div>
                <label className="label">Similarity: {similarity}</label>
                <input type="range" min="0" max="1" step="0.05"
                  value={similarity} onChange={e => setSimilarity(Number(e.target.value))}
                  className="w-full accent-green-700"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Low</span><span>High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode */}
          <div className="card">
            <h2 className="font-semibold mb-3">📝 เนื้อหา</h2>
            <div className="flex gap-2 mb-4">
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                  ${mode === 'sample' ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setMode('sample')}
              >
                🎧 Audio Sample (ตัวอย่างเสียง)
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                  ${mode === 'lesson' ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                onClick={() => setMode('lesson')}
              >
                📖 Lesson Audio
              </button>
            </div>

            <textarea
              className="input h-32 resize-none"
              placeholder={mode === 'sample'
                ? 'กรอกข้อความตัวอย่างเสียงของครู เช่น "Hello! I am Yui, your Japanese tutor..."'
                : 'กรอกเนื้อหาบทเรียนที่ต้องการให้ Tutor พูด'}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {text.length} characters
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-5">
          <div className="card">
            <h2 className="font-semibold mb-4">🎙️ สร้างเสียง</h2>

            <button
              className="btn-primary w-full justify-center py-3 text-base mb-4"
              onClick={generateAudio} disabled={generating}
            >
              {generating ? '⏳ กำลังสร้างเสียง...' : '▶ สร้างเสียง (Generate)'}
            </button>

            {audioUrl && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-sm font-medium text-green-800 mb-2">✅ สร้างเสียงสำเร็จ</div>
                <audio controls className="w-full" src={audioUrl} />
                <a href={audioUrl} download="audio.mp3" className="text-xs text-green-700 mt-2 block">
                  ⬇️ ดาวน์โหลด MP3
                </a>
              </div>
            )}
          </div>

          {/* Save to Firebase */}
          <div className="card">
            <h2 className="font-semibold mb-4">💾 บันทึกไป Firebase</h2>

            {!tutorLoaded ? (
              <button className="btn-secondary w-full justify-center mb-4" onClick={loadTutors}>
                โหลดรายชื่อ Tutors
              </button>
            ) : (
              <div className="mb-4">
                <label className="label">เลือก Tutor ที่จะบันทึกเสียง</label>
                <select className="input" value={saveTarget} onChange={e => setSaveTarget(e.target.value)}>
                  <option value="">— เลือก Tutor —</option>
                  {tutors.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.flag} {t.name} ({t.language})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700 mb-4">
              <strong>Path ที่จะบันทึก:</strong><br/>
              {mode === 'sample'
                ? `tutors/{id}/audio_sample.mp3 → อัปเดต audioSampleUrl ใน Firestore`
                : `tutors/{id}/lesson_{timestamp}.mp3 → ใช้ URL ใน lesson`}
            </div>

            <button
              className="btn-primary w-full justify-center py-3"
              onClick={saveToFirebase} disabled={saving || !audioUrl}
            >
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกไป Firebase Storage'}
            </button>
          </div>

          {/* How it works */}
          <div className="card bg-gray-50">
            <h3 className="font-semibold text-sm mb-3">📋 วิธีใช้งาน</h3>
            <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
              <li>ใส่ ElevenLabs API Key (จาก elevenlabs.io)</li>
              <li>เลือก Voice ที่ต้องการ</li>
              <li>กรอกข้อความที่ต้องการให้พูด</li>
              <li>กด Generate → ฟังตัวอย่าง</li>
              <li>เลือก Tutor → กด บันทึกไป Firebase</li>
              <li>Flutter app จะโหลดเสียงจาก URL อัตโนมัติ</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
