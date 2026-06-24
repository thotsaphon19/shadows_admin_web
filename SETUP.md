# Shadows Admin Web App — Setup Guide

## โครงสร้างไฟล์

```
shadows-admin/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx          ← หน้า Login Admin
│   └── admin/
│       ├── layout.tsx         ← Sidebar navigation
│       ├── dashboard/page.tsx ← สถิติ
│       ├── tutors/page.tsx    ← จัดการ AI Tutors + upload รูป/วิดีโอ
│       ├── lessons/page.tsx   ← จัดการบทเรียน
│       ├── avatars/page.tsx   ← อัปโหลด Avatar 25 ตัว
│       ├── users/page.tsx     ← จัดการ Users
│       ├── tts/page.tsx       ← ElevenLabs TTS สร้างเสียง
│       └── notifications/page.tsx
├── lib/
│   └── firebase.ts
├── .env.local.example
└── package.json
```

---

## ขั้นตอนติดตั้ง

### 1. สร้าง Next.js project
```bash
npx create-next-app@latest shadows-admin --typescript --tailwind --app
cd shadows-admin
```

### 2. ติดตั้ง dependencies
```bash
npm install firebase axios
```

### 3. วางไฟล์โค้ด
copy ทุกไฟล์ที่ได้มาวางตาม folder structure ด้านบน

### 4. สร้าง .env.local
```bash
cp .env.local.example .env.local
# แก้ค่าใน .env.local ด้วย Firebase config จริง
```

### 5. รัน development server
```bash
npm run dev
```
เปิด http://localhost:3000

### 6. Deploy บน Vercel (ฟรี)
```bash
npm install -g vercel
vercel
# ตอบคำถาม setup แล้ว Vercel จะ deploy ให้
# เพิ่ม Environment Variables ใน Vercel Dashboard
```

---

## สร้าง Admin Account

1. ไปที่ Firebase Console → Authentication
2. เพิ่ม user ด้วย email/password สำหรับ admin
3. Login ที่ `/login` ด้วย email/password นั้น

---

## หน้าและฟีเจอร์

| หน้า | ฟีเจอร์ |
|------|---------|
| `/admin/dashboard` | สถิติ users, premium, tutors, lessons, recordings |
| `/admin/tutors` | เพิ่ม/แก้/ลบ Tutor + อัปโหลดรูป JPG + วิดีโอ MP4 |
| `/admin/tts` | ElevenLabs TTS สร้างเสียง Tutor → บันทึก Firebase |
| `/admin/lessons` | เพิ่ม/แก้/ลบบทเรียน กรอง language/category |
| `/admin/avatars` | อัปโหลด Avatar 25 ตัว (คลิกที่ช่อง) |
| `/admin/users` | ดู users ทั้งหมด + toggle premium |
| `/admin/notifications` | ส่ง Push Notification ผ่าน FCM |

---

## เชื่อมต่อกับ Flutter App

ข้อมูลทั้งหมดเก็บใน **Firebase project เดียวกัน** กับ app
แก้ใน Admin Web → Flutter app เห็นทันทีแบบ real-time

### Firebase collections ที่ใช้ร่วมกัน:
- `tutors/` — ข้อมูลครู + videoUrl, photoUrl, audioSampleUrl
- `lessons/` — บทเรียนทั้งหมด
- `avatars/` — URL รูป avatar
- `users/` — ข้อมูล users + package status

---

## ElevenLabs TTS — วิธีใช้

1. สมัคร https://elevenlabs.io (ฟรี 10,000 chars/เดือน)
2. ไปที่ Profile → API Key
3. ไปหน้า `/admin/tts` ใส่ API Key
4. เลือก Voice → กรอกข้อความ → Generate → ฟัง
5. บันทึกไป Firebase → Flutter app ดึง URL ไปใช้

### ประเภทเสียงที่สร้างได้:
- **Audio Sample** — เสียงตัวอย่างให้ผู้ใช้ฟังก่อนเลือกครู
- **Lesson Audio** — เสียง Tutor พูดเนื้อหาบทเรียน
