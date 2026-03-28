import { db, auth } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { formatDateDDMMYYYY, formatTime12h } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {

  const CONFIG = {
    zone: "SGR01",
    location: "Bandar Seri Putra",
    country: "Malaysia",
  };

  let prayerTimes = null;

  const clockEl = document.getElementById("clock");
  const ampmEl = document.getElementById("ampm");
  const gregDateEl = document.getElementById("gregorian-date");
  const hijriDateEl = document.getElementById("hijri-date");
  const nextPrayerNameEl = document.getElementById("next-prayer-name");
  const countdownEl = document.getElementById("countdown");
  const nextPrayerTickerEl = document.getElementById("next-prayer-ticker");

  init();

  function init() {
    updateClock();
    setInterval(updateClock, 1000);

    fetchPrayerTimes();
    setInterval(fetchPrayerTimes, 6 * 60 * 60 * 1000);

    initAdRotator();
    loadActivities();
    setupTVOptimization();
    setupPosterSlider();

    onAuthStateChanged(auth, (user) => {
      if (user) cleanupOldActivities();
    });
  }

  // =========================
  // 🔥 NORMALIZE FUNCTION (FIX)
  // =========================
  const normalize = (str) => {
    return str
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\w\s]/g, "")
      .trim();
  };

  // =========================
  // 🧠 SPEAKER PHOTOS
  // =========================
  const SPEAKER_PHOTOS = {
    "fahmi": "img/ustaz/ustaz_fahmi.png",
    "saifullah": "img/ustaz/ustaz_saifulah.png",
    "saifulah": "img/ustaz/ustaz_saifulah.png",
    "rasyidi": "img/ustaz/ustaz_rasyidi.jpg",
    "najmi": "img/ustaz/ustaz_najmi.jpg",
    "fendy": "img/ustaz/ustaz_fendy.png",
    "elyas": "img/ustaz/ustaz_elyas.jpg",
    "sirajuddin": "img/ustaz/ust_siraj.png",
    "azihal": "img/ustaz/PU_Azihal.jpg",
    "akram": "img/ustaz/pu_akram.jpg",
    "abu zaki": "img/ustaz/dr-abu-zaki.jpg",
    "khairatul": "img/ustaz/dr_khairatul.png",
    "ramli": "img/ustaz/Hj_ramli.png",
    "nik": "img/ustaz/ustaz_nik.png",
    "rozie": "img/ustaz/ustaz_rozie.png",
    "kosi": "img/ustaz/ustaz_kosi.png",
    "izzat": "img/ustaz/pu_izzat.png",
    "syawal": "img/ustaz/ustaz_syawal.png",
    "yasin": "img/ustaz/yassin.jpg",
    "yassin": "img/ustaz/yassin.jpg",
    "imam fahee": "img/ustaz/Imam_Fahee.jpeg.jpg"
  };

  async function cleanupOldActivities() {
    try {
      const today = new Date();
      const thresholdDate = new Date(today);
      thresholdDate.setDate(today.getDate() - 2);

      const yyyy = thresholdDate.getFullYear();
      const mm = String(thresholdDate.getMonth() + 1).padStart(2, '0');
      const dd = String(thresholdDate.getDate()).padStart(2, '0');
      const thresholdStr = `${yyyy}-${mm}-${dd}`;

      const q = query(collection(db, "activities"), where("tarikh", "<=", thresholdStr));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return;

      const deletePromises = snapshot.docs.map(docSnap =>
        deleteDoc(doc(db, "activities", docSnap.id))
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  function setupPosterSlider() {
    const sliderWrapper = document.getElementById('poster-slider');
    if (!sliderWrapper) return;

    const posters = [
      "img/surau_poster/Ramadhan_takwim.jpeg",
      "img/surau_poster/zakat.jpeg",
      "img/surau_poster/ihya_ramadan.jpeg",
      "img/surau_poster/nasihat.jpeg",
      "img/surau_poster/syawal_2.jpeg",
      "img/surau_poster/surau_qr.jpeg",
      "img/surau_poster/infaq_1.jpeg",
      "img/surau_poster/malam_penghargaan.jpeg",
      "img/surau_poster/syawal_1.jpg",
      "img/surau_poster/infaq_2.jpeg"
    ];

    sliderWrapper.innerHTML = '';

    const slides = posters.map((src, index) => {
      const slide = document.createElement('div');
      slide.className = `poster-slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `<img src="${src}" class="side-img">`;
      sliderWrapper.appendChild(slide);
      return slide;
    });

    let currentIndex = 0;

    setInterval(() => {
      slides[currentIndex].classList.remove('active');
      slides[currentIndex].classList.add('exit');

      currentIndex = (currentIndex + 1) % slides.length;

      slides[currentIndex].classList.add('active');
    }, 20000);
  }

  function initAdRotator() {
    const adContainer = document.getElementById("ad-container");
    if (!adContainer) return;

    const q = query(collection(db, "advertisements"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
      adContainer.innerHTML = "";

      snapshot.forEach((doc, index) => {
        const data = doc.data();
        const slide = document.createElement("div");
        slide.className = `ad-slide ${index === 0 ? "active" : ""}`;

        slide.innerHTML = `
          <h3>${data.header}</h3>
          <div>${data.highlight}</div>
          <div>${data.line1}</div>
        `;

        adContainer.appendChild(slide);
      });
    });
  }

  function setupTVOptimization() {}

  function updateClock() {
    const now = new Date();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    ampmEl.textContent = ampm;

    gregDateEl.textContent = now.toLocaleDateString("ms-MY");

    if (prayerTimes) updatePrayerStatus(now);
  }

  async function fetchPrayerTimes() {
    try {
      const res = await fetch(`https://api.waktusolat.app/v2/solat/${CONFIG.zone}`);
      const data = await res.json();

      if (!data?.prayers) return;

      const today = new Date().getDate();
      const todayData = data.prayers.find(p => p.day === today);

      if (!todayData) return;

      const formatUnix = ts => {
        const d = new Date(ts * 1000);
        return `${d.getHours()}:${d.getMinutes()}`;
      };

      prayerTimes = {
        Fajr: formatUnix(todayData.fajr),
        Dhuhr: formatUnix(todayData.dhuhr),
        Asr: formatUnix(todayData.asr),
        Maghrib: formatUnix(todayData.maghrib),
        Isha: formatUnix(todayData.isha),
      };

    } catch (e) {
      console.error(e);
    }
  }

  function updatePrayerStatus() {}

  function loadActivities() {
    const container = document.querySelector(".activities-content");

    const q = query(collection(db, "activities"), orderBy("tarikh", "asc"));

    onSnapshot(q, (snapshot) => {
      container.innerHTML = "";

      snapshot.forEach((doc) => {
        const data = doc.data();

        let ustazPhotoHTML = "";

        if (data.penceramah || data.tajuk) {
          const searchStr = normalize(`${data.penceramah || ""} ${data.tajuk || ""}`);

          for (const [key, path] of Object.entries(SPEAKER_PHOTOS)) {
            if (searchStr.includes(normalize(key))) {
              ustazPhotoHTML = `
                <img src="${path}" 
                     class="lecturer-photo-brush"
                     onerror="this.src='img/ustaz/default.png'">
              `;
              break;
            }
          }
        }

        const html = `
          <div class="activity-item">
            <div>
              <div>${data.tajuk}</div>
              <div>${data.penceramah}</div>
            </div>
            ${ustazPhotoHTML}
          </div>
        `;

        container.innerHTML += html;
      });
    });
  }

});
