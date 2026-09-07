# Surau Seri Dahlia Hub
---
### 1. PROJECT OVERVIEW & ARCHITECTURE

1. Tech Stack: React (Vite), Tailwind CSS, Framer Motion (animations), Firebase JS SDK v10+ (Firestore & Auth), Lucide-React / FontAwesome icons.
2. Styling & Aesthetic Guidelines:
   - Primary Theme: Deep Emerald Green (`#063C2E`), Rich Gold/Brass (`#D4AF37`), Warm Bronze (`#8C6239`), Glassmorphism dark panels, and Cream/Off-White backgrounds (`#F7F5F0`).
   - Islamic Aesthetics: Subtle Arabesque background patterns, Arch / Mihrab silhouettes for prayer cards, Islamic corner motifs, gold calligraphic elements.
   - High Contrast & Kiosk-Optimized: Crisp typography (Amiri / Serif for Arabic/Quotes, Montserrat or Inter for UI text) with high legibility for large TV displays (15m distance) and smooth scaling for mobile web viewports (390px-430px).

3. Multi-Environment Configuration:
   Detect environment automatically based on hostname (localhost / dev parameter = DEV, production URL = PROD):
   - PROD Config:
     apiKey: "@secret:GOOGLE_API_KEY ", projectId: "surau-digital-display", authDomain: "surau-digital-display.firebaseapp.com", storageBucket: "surau-digital-display.firebasestorage.app", messagingSenderId: "968646006236", appId: "1:968646006236:web:1cbd212aaec55d12172b19"
   - DEV Config:
     apiKey: "@secret:GOOGLE_API_KEY ", projectId: "surau-display-dev", authDomain: "surau-display-dev.firebaseapp.com", storageBucket: "surau-display-dev.firebasestorage.app", messagingSenderId: "1040738333772", appId: "1:1040738333772:web:a28e30ffe24b0b6db5f0e9"

---

### 2. PAGE 1: TV DASHBOARD & MOBILE WEB VIEW (`/` and responsive layouts)

#### Layout Structure (Desktop TV Kiosk Mode vs. Mobile Web View)
- Desktop View (`> 1024px`): Multi-card grid dashboard matching the attached proposed layout design. Glassmorphism dark cards on a subtle animated dark emerald background.
- Mobile View (`< 768px`): Vertical single-column feed matching the proposed mobile layout design with rich Islamic textured backgrounds and Mihrab card styling.

#### Core Modules & Technical Logic:
1. Live Clock & Dynamic Hijri/Gregorian Calendar:
   - Automated 12-hour digital clock with seconds indicator.
   - Live updates for Gregorian date (e.g., "Khamis, 13 Ogos 2026") and estimated Hijri date (e.g., "29 Safar 1448").

2. JAKIM Prayer Times & Active Countdown:
   - Fetch prayer times real-time from Waktu Solat API for zone `SGR01` (Kajang/Selangor).
   - Display prayer cards for Subuh, Syuruq, Zuhur, Asar, Maghrib, Isyak with Arabic & Malay names.
   - Dynamically highlight the Current Prayer and Next Prayer slot with gold lighting and active countdown timer (to Next Prayer / Iqamah).

3. Dynamic Activity Board (`activities` collection in Firestore):
   - Scroll Marquee / Auto-Scroll: Vertical smooth auto-scroll for weekly activity items from top to bottom sequentially sorted by date (`tarikh`).
   - "LANGSUNG SEKARANG" (Live Now Feature):
     - Calculates event display lifecycle: An activity appears in the top "LANGSUNG SEKARANG" banner starting 1 hour BEFORE its registered time, and stays highlighted until 1.5 hours AFTER its registered start time.
     - Features event tag, title, speaker photo (`img/ustaz/`), date, and location badge.
   - Activity Item Details: Speaker image/avatar, event title, speaker name, formatted date badge (`DD MMM`), time range, note, and status tag (e.g., "DITANGGUHKAN" if `is_batal == true`).

4. Tabung Qurban & Countdown Hari Raya:
   - Target Date: Monday, May 17, 2027 (Hari Raya Qurban / Aidiladha 2027).
   - Real-time live countdown card featuring Days (`HARI`), Hours (`JAM`), Minutes (`MINIT`), and Seconds (`SAAT`).
   - Feature bullet points: "Boleh buat simpanan pada bila-bila masa dalam tempoh 1 tahun", "Tidak terhad kepada berapa jumlah simpanan", "Anggaran harga lembu 1 bahagian: RM900". Livestock graphic background.

5. Image Poster Slider & Announcement Ticker:
   - Sliding Poster Carousel: Rotating poster banners (`img/surau_poster/`) with smooth left-to-right cross-fade slide transitions every 8–10 seconds.
   - Continuous Ticker Footer: Infinite smooth scrolling horizontal ticker at the bottom displaying announcements fetched from Firestore `/announcements` array or fallback notice items.

6. Daily Inspiration & QR Donation Tile:
   - "Hadis Hari Ini" Card: Dark emerald frame with gold Calligraphy art ("الرَّحْمَنُ الرَّحِيمُ"), Malay translation (*"Orang yang penyayang akan disayangi Allah"*), and source reference (*HR. Tirmizi*).
   - DuitNow QR Infaq Card: Clean white tile housing DuitNow QR image (`img/surau_qr.jpeg`) titled *"IMBAS UNTUK MENYUMBANG"* with Surau Seri Dahlia branding.

---

### 3. PAGE 2: ADMIN LOGIN (`/login`)

Redesign the login page to match the new luxury Islamic dark-emerald theme:
- Center card with blurred glassmorphism backdrop (`backdrop-blur-xl`), gold accent borders (`border-[#D4AF37]/30`), and Surau logo at the top inside a golden ring.
- Title: "Log Masuk" (Subtext: "Akses Pengurusan Surau Seri Dahlia").
- Inputs: Email (`E-mel`) and Password (`Kata Laluan`) with gold vector icons inside fields.
- Primary Action Button: "Log Masuk" in vibrant gold background with dark text and subtle hover elevation.
- Auth Logic: Connects to Firebase Auth (`signInWithEmailAndPassword`). Handles validation errors gracefully with red alert banners.
- Secondary Action: "← Kembali ke Paparan Utama" navigation link.

---

### 4. PAGE 3: ACTIVITY MANAGEMENT FORM (`/admin/activities`)

Redesign the admin portal form to align with the new design system:
- Auth Guard: Protected route; redirects unauthenticated users back to `/login`.
- Sync Status Badge: Header badge showing live Firebase connection state ("Bersama" / "Menyinkron..." / "Offline").
- Activity Entry Form (Create & Edit):
  - Field 1: Tarikh Aktiviti (`date` picker) with automated Day of Week auto-fill (`Hari: Isnin, Selasa, etc.`).
  - Field 2: Masa Option (Radio select: `Subuh (6:00 AM)`, `Maghrib (7:45 PM)`, `Selepas Isyak (8:30 PM)`, or `Lain-lain`).
    - If `Lain-lain` is selected, display custom 12-hour time pickers (`From Hour/Min/AM-PM` and `To Hour/Min/AM-PM`) converting to 24h internal strings (`lain_from`, `lain_to`).
  - Field 3: Tajuk Aktiviti (`text`).
  - Field 4: Penceramah / Peserta (`text`).
  - Field 5: Nota / Catatan (Optional `text`).
  - Action Buttons: "Daftar Aktiviti" (or "Simpan Kemaskini" when editing) and "Batal Edit".
- Real-Time Activity List (`Senarai Aktiviti Terkini`):
  - Displays all registered activities from Firestore ordered by `tarikh`.
  - Action buttons per item:
    - `Tangguh Aktiviti` / `Aktifkan Semula` (Toggles `is_batal` boolean in Firestore without deleting).
    - `Edit` (Populates form at the top for modification).
    - `Padam` (Deletes record with double confirmation prompt).
- Idle Session Logout: Auto-logouts inactive admins after 15 minutes of inactivity.

---

### 5. FIRESTORE DATA STRUCTURE
Ensure Firestore operations target the following collection schema:
- Collection: `activities`
  - `tarikh`: string ("YYYY-MM-DD")
  - `hari`: string ("Rabu", "Khamis", etc.)
  - `masa`: string ("Subuh", "7:45 PM", etc.)
  - `masa_option`: string ("subuh" | "maghrib" | "isyak" | "lain")
  - `lain_from`: string ("06:00", "19:45", etc.)
  - `lain_to`: string ("08:00", "21:45", etc.)
  - `tajuk`: string
  - `penceramah`: string
  - `nota`: string
  - `is_batal`: boolean (default: false)
  - `createdAt`: serverTimestamp()
  - `updatedAt`: serverTimestamp()

Deliver a clean, production-ready, fully responsive React component architecture with smooth animations and complete Firebase integration.
I have attached the PRD PDF, original JavaScript source files (script.js, activity_form.js), and design screenshot references. Please analyze the attached images for pixel-perfect layout alignment and extract all precise logic from the PRD and JS files to build the React components.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ac6fb762-6652-4cf9-9dd0-22ab356069ff).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
