import { db, auth } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { formatDateDDMMYYYY, formatTime12h } from "./utils.js";

document.addEventListener("DOMContentLoaded", () => {
  // Configuration
  const CONFIG = {
    zone: "SGR01", // Hulu Langat (Bandar Seri Putra)
    location: "Bandar Seri Putra",
    country: "Malaysia",
  };

  // State
  let prayerTimes = null;
  let nextPrayerTime = null;

  // Elements
  const clockEl = document.getElementById("clock");
  const ampmEl = document.getElementById("ampm");
  const gregDateEl = document.getElementById("gregorian-date");
  const hijriDateEl = document.getElementById("hijri-date");
  const nextPrayerTickerEl = document.getElementById("next-prayer-ticker");

  /* =========================
   SPEAKER PHOTO DATABASE
========================= */

  const SPEAKER_PHOTOS = {
    fahmi: "img/ustaz/ustaz_fahmi.png",
    saifullah: "img/ustaz/ustaz_saifulah.png",
    saifulah: "img/ustaz/ustaz_saifulah.png",
    rasyidi: "img/ustaz/ustaz_rasyidi.jpg",
    najmi: "img/ustaz/ustaz_najmi.jpg",
    fendy: "img/ustaz/ustaz_fendy.png",
    elyas: "img/ustaz/ustaz_elyas.jpg",
    sirajuddin: "img/ustaz/ust_siraj.png",
    azihal: "img/ustaz/PU_Azihal.jpg",
    akram: "img/ustaz/pu_akram.jpg",
    "abu zaki": "img/ustaz/dr-abu-zaki.jpg",
    khairatul: "img/ustaz/dr_khairatul.png",
    ramli: "img/ustaz/Hj_ramli.png",
    nik: "img/ustaz/ustaz_nik.png",
    rozie: "img/ustaz/ustaz_rozie.png",
    kosi: "img/ustaz/ustaz_kosi.png",
    izzat: "img/ustaz/pu_izzat.png",
    syawal: "img/ustaz/ustaz_syawal.png",
    dzikri: "img/ustaz/ust_dzikri.jpg",
    jamir: "img/ustaz/jamir_kodiang.png",
    hasbullah: "img/ustaz/ustaz_hasbullah.jpg",
    "imam surau": "img/ustaz/yassin.jpg",
    "imam fahee": "img/ustaz/Imam_Fahee.jpg",
    ajk: "img/ustaz/qurban.jpg",
  };

  // Get speaker photo
  function getSpeakerPhoto(data) {
    if (!data.penceramah && !data.tajuk) {
      return "";
    }

    const searchStr = `${data.penceramah || ""} ${data.tajuk || ""
      }`.toLowerCase();

    // Priority: Solat Aidiladha
    if (searchStr.includes("aidiladha")) {
      return `
        <img
          src="img/ustaz/solat_raya.png"
          class="lecturer-photo-brush"
          alt="Speaker"
        >
      `;
    }

    for (const [keyword, path] of Object.entries(SPEAKER_PHOTOS)) {
      if (searchStr.includes(keyword)) {
        return `
        <img
          src="${path}"
          class="lecturer-photo-brush"
          alt="Speaker"
        >
      `;
      }
    }

    return "";
  }

  // Initialize
  init();
  loadDailyHadis();

  function init() {
    updateClock(); // Start immediately
    setInterval(updateClock, 1000);

    fetchPrayerTimes();
    // Refresh prayer times daily (or every 6 hours to be safe)
    setInterval(fetchPrayerTimes, 6 * 60 * 60 * 1000);

    // Initialize Dynamic Activities
    loadActivities();

    // Kiosk optimizations
    setupTVOptimization();

    // Start Poster Slider
    setupPosterSlider();

    setupActivitiesAutoScroll();

    // Background cleanup of old activities (Admin only)
    onAuthStateChanged(auth, (user) => {
      if (user) {
        cleanupOldActivities();
        // Run cleanup every 30 minutes while admin is logged in
        setInterval(cleanupOldActivities, 30 * 60 * 1000);
      }
    });

    // Refresh UI state (fading) every minute
    setInterval(updateActivitiesUIState, 60 * 1000);
  }

  /**
   * Returns the scheduled start time of an activity as a Date.
   * Uses data.lain_from (a 24h "HH:MM" string) which is stored for ALL masa options:
   *   subuh   → "06:30"
   *   maghrib → "20:30"
   *   isyak   → "21:30"
   *   lain    → user-chosen From time
   */
  function getActivityStartTime(data) {
    if (!data.tarikh || !data.lain_from) return null;
    const timeStr = data.lain_from;
    if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      // tarikh is stored as YYYY-MM-DD; parse as local date
      const [y, m, d] = data.tarikh.split("-").map(Number);
      const activityDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
      return activityDate;
    } catch (e) {
      return null;
    }
  }

  /**
   * Returns the scheduled END time of an activity.
   * For Lain-Lain this is the user's "To" time. For presets it is start + 2h.
   * This is the point at which the card should be DELETED from the display.
   */
  function getActivityEndTime(data) {
    if (!data.tarikh) return null;
    let timeStr = data.lain_to || "";
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
      // Fall back: compute start + 2h
      const start = getActivityStartTime(data);
      if (!start) return null;
      return new Date(start.getTime() + 2 * 60 * 60 * 1000);
    }
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const [y, m, d] = data.tarikh.split("-").map(Number);
      return new Date(y, m - 1, d, hours, minutes, 0, 0);
    } catch (e) {
      return null;
    }
  }

  function updateActivitiesUIState() {
    const now = new Date();

    document.querySelectorAll(".activity-group").forEach((group) => {
      if (group.classList.contains("cancelled")) {
        return;
      }

      const startTimeStr = group.dataset.startTime;

      if (!startTimeStr) return;

      const startTime = new Date(startTimeStr);

      const minutesPassed = (now - startTime) / (1000 * 60);

      group.classList.remove("activity-active", "activity-faded");

      // ACTIVE
      if (minutesPassed >= 0 && minutesPassed < 40) {
        group.classList.add("activity-active");
      }

      // FADED
      if (minutesPassed >= 40 && minutesPassed < 70) {
        group.classList.add("activity-faded");
      }

      // DELETE
      if (minutesPassed >= 70) {
        group.remove();
      }
    });
  }

  async function cleanupOldActivities() {
    try {
      const now = new Date();
      const q = query(collection(db, "activities"));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return;

      const expiredDocs = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();

        const endTime = getActivityEndTime(data);

        if (endTime) {
          // Delete when end-time has passed
          if (now >= endTime) {
            expiredDocs.push(docSnap.id);
          }
        } else {
          // Fallback: Delete if activity date is more than 1 day old
          if (!data.tarikh) return;
          const [y, m, d] = data.tarikh.split("-").map(Number);
          const activityDate = new Date(y, m - 1, d, 23, 59, 59);
          if (now > activityDate) {
            expiredDocs.push(docSnap.id);
          }
        }
      });

      if (expiredDocs.length === 0) return;

      console.log(`Cleaning up ${expiredDocs.length} expired activities...`);
      const deletePromises = expiredDocs.map((id) =>
        deleteDoc(doc(db, "activities", id))
      );
      await Promise.all(deletePromises);
      console.log("Cleanup complete.");
    } catch (error) {
      console.error("Error during activity cleanup:", error);
    }
  }

  // Poster Slider Logic
  function setupPosterSlider() {
    const sliderWrapper = document.getElementById("poster-slider");
    const posters = [
      "img/surau_poster/quote.jpeg",
      "img/surau_poster/quote_2.jpeg",
      "img/surau_poster/tasbih.jpg",
      "img/surau_poster/post_qurban.jpeg",
      "img/surau_poster/hajj.jpg"
    ];2

    if (!sliderWrapper) return;

    // Clear old container if exists and create new structure
    sliderWrapper.innerHTML = "";
    const slides = posters.map((src, index) => {
      const slide = document.createElement("div");
      slide.className = `poster-slide ${index === 0 ? "active" : ""}`;
      slide.innerHTML = `<img src="${src}" class="side-img" alt="Poster">`;
      sliderWrapper.appendChild(slide);
      return slide;
    });

    let currentIndex = 0;
    const totalSlides = slides.length;

    function nextSlide() {
      const currentSlide = slides[currentIndex];
      currentIndex = (currentIndex + 1) % totalSlides;
      const nextSlide = slides[currentIndex];

      // Transition: current slide exits to the left
      currentSlide.classList.remove("active");
      currentSlide.classList.add("exit");

      // Next slide becomes active and enters from the right
      nextSlide.classList.remove("exit");
      nextSlide.classList.add("active");

      // Clean up exit class after transition
      setTimeout(() => {
        slides.forEach((s, idx) => {
          if (idx !== currentIndex) s.classList.remove("exit");
        });
      }, 1500); // Match CSS transition duration
    }

    // Change every 20 seconds
    setInterval(nextSlide, 20000);
  }

  function setupTVOptimization() {
    const fsBtn = document.getElementById("fullscreen-btn");
    let cursorTimeout;

    // 1. Fullscreen Toggle Function
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };

    // 2. Button Listener
    if (fsBtn) {
      fsBtn.addEventListener("click", toggleFullscreen);
    }

    // 3. Keyboard Shortcut 'F'
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    });

    // 4. Cursor Auto-hide Logic
    const hideCursor = () => {
      document.body.classList.add("hide-cursor");
    };

    const showCursor = () => {
      document.body.classList.remove("hide-cursor");
      clearTimeout(cursorTimeout);
      cursorTimeout = setTimeout(hideCursor, 5000); // Hide after 5 seconds of inactivity
    };

    // Listen for mouse movement
    document.addEventListener("mousemove", showCursor);
    document.addEventListener("mousedown", showCursor);

    // Initial timeout
    cursorTimeout = setTimeout(hideCursor, 5000);
  }

  function updateClock() {
    const now = new Date();

    // Time
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    ampmEl.textContent = ampm;

    // Date
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    gregDateEl.textContent = now.toLocaleDateString("ms-MY", options);

    // Update Prayer Status if we have data
    if (prayerTimes) {
      updatePrayerStatus(now);
    }
  }

  async function fetchPrayerTimes() {
    try {
      const apiUrl = `https://api.waktusolat.app/v2/solat/${CONFIG.zone}`;
      console.log("Fetching prayer times from:", apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data && data.prayers) {
        const today = new Date();
        const dayOfMonth = today.getDate();
        const todayData = data.prayers.find((p) => p.day === dayOfMonth);

        if (todayData) {
          // Format times from Unix timestamp to HH:MM (24h)
          const formatUnix = (timestamp) => {
            const date = new Date(timestamp * 1000);
            const h = String(date.getHours()).padStart(2, "0");
            const m = String(date.getMinutes()).padStart(2, "0");
            return `${h}:${m}`;
          };

          prayerTimes = {
            Fajr: formatUnix(todayData.fajr),
            Sunrise: formatUnix(todayData.syuruk),
            Dhuhr: formatUnix(todayData.dhuhr),
            Asr: formatUnix(todayData.asr),
            Maghrib: formatUnix(todayData.maghrib),
            Isha: formatUnix(todayData.isha),
          };

          // Update Hijri Date
          // Format: "1447-08-06"
          const [hYear, hMonth, hDay] = todayData.hijri.split("-");
          const hijriMonths = [
            "Muharram",
            "Safar",
            "Rabiul Awal",
            "Rabiul Akhir",
            "Jamadil Awal",
            "Jamadil Akhir",
            "Rejab",
            "Syaaban",
            "Ramadan",
            "Syawal",
            "Zulkaedah",
            "Zulhijjah",
          ];
          const monthName = hijriMonths[parseInt(hMonth) - 1];
          hijriDateEl.textContent = `${parseInt(hDay)} ${monthName} ${hYear}`;

          // Update UI with Times
          fillPrayerTimes(prayerTimes);
        }
      }
    } catch (error) {
      console.error("Error fetching prayer times:", error);
    }
  }

  function fillPrayerTimes(timings) {
    // Map API keys to DOM IDs
    const mapping = {
      Fajr: "fajr",
      Sunrise: "sunrise", // Syuruq
      Dhuhr: "dhuhr",
      Asr: "asr",
      Maghrib: "maghrib",
      Isha: "isha",
    };

    for (const [key, id] of Object.entries(mapping)) {
      const timeElement = document.getElementById(`${id}-time`);
      const iqamahElement = document.getElementById(`${id}-iqamah`);

      if (timeElement && timings[key]) {
        // Formatting time from 24h to 12h for display if desired,
        // but usually prayer times are shown in 24h or 12h. Let's do 12h for consistency.
        const formattedTime = formatTime12h(timings[key]);
        timeElement.textContent = formattedTime;

        // Fake Iqamah time (Prayer + 10 mins) for demo
        if (iqamahElement) {
          const [h, m] = timings[key].split(":");
          const date = new Date();
          date.setHours(parseInt(h), parseInt(m) + 10);
          const iqamahStr = `${String(date.getHours()).padStart(
            2,
            "0"
          )}:${String(date.getMinutes()).padStart(2, "0")}`;
          iqamahElement.textContent = formatTime12h(iqamahStr);
        }
      }
    }
  }

  function updatePrayerStatus(now) {
    const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

    const prayerCardMap = {
      Fajr: "fajr-card",
      Sunrise: "sunrise-card",
      Dhuhr: "dhuhr-card",
      Asr: "asr-card",
      Maghrib: "maghrib-card",
      Isha: "isha-card",
    };

    // RESET EVERYTHING
    document.querySelectorAll(".prayer-card").forEach((card) => {
      card.classList.remove("active");
      card.classList.remove("next");

      const oldBadge = card.querySelector(".prayer-state-badge");

      if (oldBadge) {
        oldBadge.remove();
      }
    });

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let currentPrayer = null;
    let nextPrayer = null;

    // FIND CURRENT + NEXT PRAYER
    for (let i = 0; i < prayerOrder.length; i++) {
      const prayerName = prayerOrder[i];

      const [hour, minute] = prayerTimes[prayerName].split(":").map(Number);

      const prayerMinutes = hour * 60 + minute;

      if (currentMinutes >= prayerMinutes) {
        currentPrayer = prayerName;
      } else {
        nextPrayer = prayerName;
        break;
      }
    }

    // AFTER ISHA → NEXT IS FAJR
    if (!nextPrayer) {
      nextPrayer = "Fajr";
    }

    // BEFORE FAJR
    if (!currentPrayer) {
      currentPrayer = "Isha";
    }

    // APPLY ACTIVE
    const currentCard = document.getElementById(prayerCardMap[currentPrayer]);

    if (currentCard) {
      currentCard.classList.add("active");

      const badge = document.createElement("span");

      badge.className = "prayer-state-badge";

      badge.textContent = "Sekarang";

      currentCard.appendChild(badge);
    }

    // APPLY NEXT
    const nextCard = document.getElementById(prayerCardMap[nextPrayer]);

    if (nextCard) {
      nextCard.classList.add("next");

      const badge = document.createElement("span");

      badge.className = "prayer-state-badge";

      badge.textContent = "Seterusnya";

      nextCard.appendChild(badge);

      // UPDATE TICKER

      const prayerMalayNames = {
        Fajr: "Subuh",
        Sunrise: "Syuruk",
        Dhuhr: "Zuhur",
        Asr: "Asar",
        Maghrib: "Maghrib",
        Isha: "Isyak",
      };

      const nextPrayerTime = prayerTimes[nextPrayer];

      if (nextPrayerTickerEl) {
        nextPrayerTickerEl.textContent = `Waktu ${prayerMalayNames[nextPrayer]} seterusnya pada jam ${nextPrayerTime}`;
      }
    }
  }

  function updateCountdown(nextPrayer, now) {
    if (!nextPrayer) return;

    nextPrayerNameEl.textContent = nextPrayer.name;

    const timeParts = nextPrayer.time.split(":");
    const targetDate = new Date();
    targetDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);

    if (nextPrayer.isTomorrow) {
      targetDate.setDate(targetDate.getDate() + 1);
    }

    const diff = targetDate - now;

    if (diff > 0) {
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      countdownEl.textContent = `-${String(h).padStart(2, "0")}:${String(
        m
      ).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    } else {
      countdownEl.textContent = "00:00:00";
    }
  }

  // Date formatting moved to utils.js

  function loadActivities() {
    const activitiesContainer = document.querySelector(".activities-content");

    if (!activitiesContainer) return;

    const q = query(collection(db, "activities"));

    onSnapshot(q, (snapshot) => {
      // RESET
      activitiesContainer.innerHTML = "";

      let activities = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const startTime = getActivityStartTime(data);

        if (!startTime) return;

        activities.push({
          id: docSnap.id,
          ...data,
          startTime,
        });
      });

      // SORT CHRONOLOGICALLY
      activities.sort((a, b) => {
        return a.startTime - b.startTime;
      });

      // GROUP BY DAY
      const groupedActivities = {};

      activities.forEach((activity) => {
        const dateKey = activity.startTime.toDateString();

        if (!groupedActivities[dateKey]) {
          groupedActivities[dateKey] = [];
        }

        groupedActivities[dateKey].push(activity);
      });

      // =========================
      // BUILD ORIGINAL CONTENT
      // =========================

      const fragment = document.createDocumentFragment();

      Object.keys(groupedActivities).forEach((dateKey) => {
        // DAY HEADER
        const header = document.createElement("div");

        header.className = "activity-day-header";

        header.innerHTML = new Date(dateKey).toLocaleDateString("ms-MY", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

        fragment.appendChild(header);

        // ACTIVITIES
        groupedActivities[dateKey].forEach((activity) => {
          let masaDisplay = activity.masa || "";

          if (activity.masa_option === "maghrib") {
            masaDisplay = "Selepas Maghrib";
          }

          if (activity.masa_option === "isyak") {
            masaDisplay = "Selepas Isyak";
          }

          if (activity.masa_option === "subuh") {
            masaDisplay = "Selepas Subuh";
          }

          const speakerPhoto = getSpeakerPhoto(activity);

          const activityCard = document.createElement("div");

          activityCard.className = `activity-group ${activity.is_batal ? "cancelled" : ""
            }`;

          activityCard.dataset.startTime = activity.startTime.toISOString();

          activityCard.innerHTML = `

              <div class="activity-time">
                ${activity.lain_from || "--:--"}
              </div>

              <div class="activity-item">

                <div class="act-details">

                  <div class="act-title">
                    ${activity.tajuk || ""}
                  </div>

                  <div class="act-lead">
                    ${activity.penceramah || ""}
                  </div>

                  <div class="act-masa">
                    ${masaDisplay}
                  </div>

                  ${activity.nota
              ? `
                        <div class="act-note">
                          ${activity.nota}
                        </div>
                      `
              : ""
            }

                </div>

                ${speakerPhoto}

                ${activity.is_batal
              ? `
                      <div class="batal-overlay">
                        <img
                          src="img/system/tangguh.png"
                          alt="Tangguh"
                        >
                      </div>
                    `
              : ""
            }

              </div>
            `;

          fragment.appendChild(activityCard);
        });
      });

      // =========================
      // APPEND ORIGINAL CONTENT
      // =========================

      activitiesContainer.appendChild(fragment);

      // =========================
      // DUPLICATE FOR MARQUEE
      // =========================

      const duplicatedContent = activitiesContainer.innerHTML;

      activitiesContainer.innerHTML += duplicatedContent;

      // RESET SCROLL POSITION
      const scrollArea = document.querySelector(".activities-scroll-area");

      if (scrollArea) {
        scrollArea.scrollTop = 0;
      }

      // UPDATE UI STATES
      updateActivitiesUIState();
    });
  }

  function initActivities() {
    const activitiesContent = document.querySelector(".activities-content");
    if (!activitiesContent) return;

    // Load from localStorage
    const storedActivities = JSON.parse(
      localStorage.getItem("surau_activities") || "[]"
    );

    if (storedActivities.length > 0) {
      // Clear existing hardcoded activities if we have stored ones
      activitiesContent.innerHTML = "";

      // Sort by date (Tarikh)
      storedActivities.sort((a, b) => new Date(a.tarikh) - new Date(b.tarikh));

      // Group by date to match HTML structure
      const grouped = storedActivities.reduce((acc, act) => {
        if (!acc[act.tarikh]) acc[act.tarikh] = [];
        acc[act.tarikh].push(act);
        return acc;
      }, {});

      for (const [date, acts] of Object.entries(grouped)) {
        const groupDiv = document.createElement("div");
        groupDiv.className = "activity-group";

        // Format the long date for display
        const dateObj = new Date(date);
        const formattedDate = formatDateDDMMYYYY(date);

        // Use image from first activity in group or default
        const imageSrc = acts[0].imageData || "img/ustaz/ustaz.png";

        groupDiv.innerHTML = `
                    <div class="box">
                        <img src="${imageSrc}" class="group-ustaz-img" alt="Ustaz">
                    </div>
                    <div class="activity-date">
                        <span class="day-badge">${acts[0].hari}</span>
                        <span class="date-text">${formattedDate}</span>
                    </div>
                `;

        acts.forEach((act) => {
          const itemDiv = document.createElement("div");
          itemDiv.className = "activity-item";

          // Pick icon based on keywords
          let icon = "fa-calendar-check";
          const title = act.acara.toLowerCase();
          if (title.includes("quran") || title.includes("mengaji"))
            icon = "fa-book-quran";
          else if (title.includes("kelas") || title.includes("kuliah"))
            icon = "fa-chalkboard-user";
          else if (title.includes("yasin") || title.includes("tahlil"))
            icon = "fa-book-open-reader";
          else if (title.includes("maghrib") || title.includes("isya"))
            icon = "fa-cloud-moon";
          else if (title.includes("subuh")) icon = "fa-sun";

          itemDiv.innerHTML = `
                        <div class="act-icon"><i class="fa-solid ${icon}"></i></div>
                        <div class="act-details">
                            <div class="act-title">${act.acara} ${act.masa ? `(${act.masa})` : ""
            }</div>
                            <div class="act-lead">${act.oleh}</div>
                        </div>
                    `;
          groupDiv.appendChild(itemDiv);
        });

        activitiesContent.appendChild(groupDiv);
      }
    }
  }
});

function loadDailyHadis() {
  const hadisList = [
    {
      arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
      text: "Sesungguhnya setiap amalan bergantung kepada niat.",
      source: "HR. Bukhari & Muslim",
    },

    {
      arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
      text: "Sebaik-baik manusia adalah yang paling bermanfaat kepada manusia lain.",
      source: "HR. Ahmad",
    },

    {
      arabic: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
      text: "Senyumanmu kepada saudaramu adalah sedekah.",
      source: "HR. Tirmizi",
    },

    {
      arabic: "لَا تَغْضَبْ",
      text: "Jangan marah.",
      source: "HR. Bukhari",
    },

    {
      arabic: "الدِّينُ النَّصِيحَةُ",
      text: "Agama itu adalah nasihat.",
      source: "HR. Muslim",
    },

    {
      arabic: "الطُّهُورُ شَطْرُ الإِيمَانِ",
      text: "Kebersihan itu sebahagian daripada iman.",
      source: "HR. Muslim",
    },

    {
      arabic: "مَنْ صَمَتَ نَجَا",
      text: "Barangsiapa banyak diam, dia akan selamat.",
      source: "HR. Tirmizi",
    },

    {
      arabic: "يَسِّرُوا وَلَا تُعَسِّرُوا",
      text: "Permudahkanlah dan jangan menyusahkan.",
      source: "HR. Bukhari",
    },

    {
      arabic: "الرَّاحِمُونَ يَرْحَمُهُمُ الرَّحْمَنُ",
      text: "Orang yang penyayang akan disayangi Allah.",
      source: "HR. Tirmizi",
    },

    {
      arabic: "مَنْ لَا يَرْحَمْ لَا يُرْحَمْ",
      text: "Barangsiapa tidak mengasihi, tidak akan dikasihi.",
      source: "HR. Bukhari",
    },

    {
      arabic: "الْمُؤْمِنُ مِرْآةُ الْمُؤْمِنِ",
      text: "Seorang mukmin adalah cermin bagi mukmin yang lain.",
      source: "HR. Abu Daud",
    },

    {
      arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ",
      text: "Bertakwalah kepada Allah di mana sahaja kamu berada.",
      source: "HR. Tirmizi",
    },

    {
      arabic: "إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ",
      text: "Sesungguhnya Allah itu indah dan menyukai keindahan.",
      source: "HR. Muslim",
    },

    {
      arabic: "مَنْ غَشَّنَا فَلَيْسَ مِنَّا",
      text: "Barangsiapa menipu maka dia bukan daripada kalangan kami.",
      source: "HR. Muslim",
    },

    {
      arabic: "الْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ",
      text: "Perkataan yang baik adalah sedekah.",
      source: "HR. Bukhari",
    },

    {
      arabic: "إِنَّ اللَّهَ يُحِبُّ الرِّفْقَ",
      text: "Sesungguhnya Allah menyukai kelembutan.",
      source: "HR. Muslim",
    },

    {
      arabic: "مَنْ تَوَاضَعَ لِلَّهِ رَفَعَهُ اللَّهُ",
      text: "Barangsiapa merendah diri kerana Allah, Allah akan mengangkat darjatnya.",
      source: "HR. Muslim",
    },

    {
      arabic: "الدُّعَاءُ هُوَ الْعِبَادَةُ",
      text: "Doa itu adalah ibadah.",
      source: "HR. Tirmizi",
    },

    {
      arabic: "الصَّبْرُ ضِيَاءٌ",
      text: "Sabar itu cahaya.",
      source: "HR. Muslim",
    },

    {
      arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      text: "Sesungguhnya bersama kesusahan ada kemudahan.",
      source: "Riwayat Muslim",
    },

    {
      arabic: "الْحَيَاءُ مِنَ الإِيمَانِ",
      text: "Malu itu sebahagian daripada iman.",
      source: "HR. Bukhari",
    },

    {
      arabic: "الْجَنَّةُ تَحْتَ أَقْدَامِ الأُمَّهَاتِ",
      text: "Syurga berada di bawah telapak kaki ibu.",
      source: "HR. Ahmad",
    },

    {
      arabic: "مَنْ لَا يَشْكُرِ النَّاسَ لَا يَشْكُرِ اللَّهَ",
      text: "Barangsiapa tidak berterima kasih kepada manusia, dia tidak bersyukur kepada Allah.",
      source: "HR. Tirmizi",
    },

    {
      arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
      text: "Sesungguhnya Allah bersama orang-orang yang sabar.",
      source: "HR. Bukhari",
    },

    {
      arabic: "أَفْضَلُ الصَّدَقَةِ سَقْيُ الْمَاءِ",
      text: "Sedekah yang paling utama adalah memberi air minum.",
      source: "HR. Ahmad",
    },

    {
      arabic: "خَيْرُكُمْ خَيْرُكُمْ لأَهْلِهِ",
      text: "Sebaik-baik kamu adalah yang paling baik terhadap keluarganya.",
      source: "HR. Tirmizi",
    },

    {
      arabic: "السَّاعِي عَلَى الأَرْمَلَةِ وَالْمِسْكِينِ كَالْمُجَاهِدِ",
      text: "Orang yang membantu janda dan orang miskin seperti berjihad di jalan Allah.",
      source: "HR. Bukhari",
    },

    {
      arabic: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ",
      text: "Amalan yang paling dicintai Allah adalah yang berterusan walaupun sedikit.",
      source: "HR. Muslim",
    },

    {
      arabic: "إِفْشَاءُ السَّلَامِ مِنَ الإِسْلَامِ",
      text: "Menyebarkan salam adalah sebahagian daripada Islam.",
      source: "HR. Bukhari",
    },

    {
      arabic: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",
      text: "Muslim sejati ialah yang orang lain selamat daripada lidah dan tangannya.",
      source: "HR. Bukhari & Muslim",
    },
  ];

  const today = new Date();

  const uniqueDayNumber = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));

  const hadisIndex = uniqueDayNumber % hadisList.length;

  const selectedHadis = hadisList[hadisIndex];

  document.getElementById("hadis-arabic").textContent = selectedHadis.arabic;

  document.getElementById("hadis-text").textContent = `"${selectedHadis.text}"`;

  document.getElementById("hadis-source").textContent = selectedHadis.source;
}

function setPrayerBadge(card, text) {
  // remove old badge first
  const oldBadge = card.querySelector(".prayer-state-badge");

  if (oldBadge) {
    oldBadge.remove();
  }

  // create new badge
  const badge = document.createElement("span");
  badge.className = "prayer-state-badge";
  badge.textContent = text;

  card.appendChild(badge);
}

function setupActivitiesAutoScroll() {
  // TV ONLY
  if (window.innerWidth < 1025) return;

  const scrollArea = document.querySelector(".activities-scroll-area");

  const activitiesContent = document.querySelector(".activities-content");

  if (!scrollArea || !activitiesContent) return;

  // SPEED = pixels per second
  let scrollSpeed = 13;

  let animationFrame;
  let lastTimestamp = 0;

  function autoScroll(timestamp) {
    if (!lastTimestamp) {
      lastTimestamp = timestamp;
    }

    const delta = timestamp - lastTimestamp;

    lastTimestamp = timestamp;

    // SMOOTH SCROLL
    scrollArea.scrollTop += (scrollSpeed * delta) / 1000;

    // IMPORTANT:
    // reset at HALF because content
    // has been duplicated
    const resetPoint = activitiesContent.scrollHeight / 2;

    if (scrollArea.scrollTop >= resetPoint) {
      scrollArea.scrollTop = 0;
    }

    animationFrame = requestAnimationFrame(autoScroll);
  }

  // START
  animationFrame = requestAnimationFrame(autoScroll);

  // PAUSE ON HOVER
  scrollArea.addEventListener("mouseenter", () => {
    cancelAnimationFrame(animationFrame);
  });

  scrollArea.addEventListener("mouseleave", () => {
    lastTimestamp = 0;

    animationFrame = requestAnimationFrame(autoScroll);
  });
}
