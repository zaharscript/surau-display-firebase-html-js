import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
  const nextPrayerNameEl = document.getElementById("next-prayer-name");
  const countdownEl = document.getElementById("countdown");
  const nextPrayerTickerEl = document.getElementById("next-prayer-ticker");

  // Initialize
  init();

  function init() {
    updateClock(); // Start immediately
    setInterval(updateClock, 1000);

    fetchPrayerTimes();
    // Refresh prayer times daily (or every 6 hours to be safe)
    setInterval(fetchPrayerTimes, 6 * 60 * 60 * 1000);

    // Initialize Advertisement Rotator
    initAdRotator();

    // Initialize Dynamic Activities
    loadActivities();

    // Kiosk optimizations
    setupTVOptimization();

    // Start Poster Slider
    setupPosterSlider();
  }

  // Poster Slider Logic
  function setupPosterSlider() {
    const sliderWrapper = document.getElementById('poster-slider');
    const posters = [
      "img/surau_poster/Ramadhan_takwim.jpeg",
      "img/surau_poster/gotong_royong.jpeg",
      "img/surau_poster/ihya_ramadan.jpeg",
      "img/surau_poster/ustaz_rozie.jpeg",
      "img/surau_qr.jpeg"
    ];

    if (!sliderWrapper) return;

    // Clear old container if exists and create new structure
    sliderWrapper.innerHTML = '';
    const slides = posters.map((src, index) => {
      const slide = document.createElement('div');
      slide.className = `poster-slide ${index === 0 ? 'active' : ''}`;
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
      currentSlide.classList.remove('active');
      currentSlide.classList.add('exit');

      // Next slide becomes active and enters from the right
      nextSlide.classList.remove('exit');
      nextSlide.classList.add('active');

      // Clean up exit class after transition
      setTimeout(() => {
        slides.forEach((s, idx) => {
          if (idx !== currentIndex) s.classList.remove('exit');
        });
      }, 1500); // Match CSS transition duration
    }

    // Change every 60 seconds (1 minute)
    setInterval(nextSlide, 60000);
  }

  function setupTVOptimization() {
    const fsBtn = document.getElementById("fullscreen-btn");
    let cursorTimeout;

    // 1. Fullscreen Toggle Function
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
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
    // Convert current time to minutes since midnight for comparison
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: "Subuh", time: prayerTimes.Fajr },
      { name: "Terbit Matahari (Syuruq)", time: prayerTimes.Sunrise },
      { name: "Zuhur", time: prayerTimes.Dhuhr },
      { name: "Asar", time: prayerTimes.Asr },
      { name: "Maghrib", time: prayerTimes.Maghrib },
      { name: "Isyak", time: prayerTimes.Isha },
    ];

    let nextPrayer = null;
    let currentPrayer = null;

    // Find next prayer
    for (let i = 0; i < prayers.length; i++) {
      const timeParts = prayers[i].time.split(":");
      const pMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

      if (pMinutes > nowMinutes) {
        nextPrayer = prayers[i];
        // Current is the one before next
        currentPrayer = i > 0 ? prayers[i - 1] : prayers[prayers.length - 1]; // logic slightly flawed for Fajr
        break;
      }
    }

    // If no next prayer found today, it's Fajr tomorrow
    if (!nextPrayer) {
      nextPrayer = prayers[0];
      nextPrayer.isTomorrow = true;
      currentPrayer = prayers[prayers.length - 1]; // Isha
    }

    // Update UI Classes
    document.querySelectorAll(".prayer-card").forEach((card) => {
      card.classList.remove("active", "next");
    });

    // Highlight Next
    // Note: ID mapping needs to match
    const nextId =
      nextPrayer.name === "Syuruq" ? "sunrise" : nextPrayer.name.toLowerCase();
    const nextCard = document.getElementById(`${nextId}-card`);
    if (nextCard) nextCard.classList.add("next");

    // Highlight Current (Active)
    // const currentId = currentPrayer.name === 'Syuruq' ? 'sunrise' : currentPrayer.name.toLowerCase();
    // const currentCard = document.getElementById(`${currentId}-card`);
    // if (currentCard) currentCard.classList.add('active'); // Optional: show what 'time zone' we are in

    // Update Countdown
    updateCountdown(nextPrayer, now);

    // Update Ticker
    if (nextPrayerTickerEl) {
      const tickerTime = formatTime12h(nextPrayer.time);
      const prayerLabel = nextPrayer.name;
      nextPrayerTickerEl.textContent = `${prayerLabel} bermula pada ${tickerTime}${nextPrayer.isTomorrow ? " esok" : ""
        }.`;
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


  function initAdRotator() {
    const adContainer = document.getElementById("ad-container");
    if (!adContainer) return;

    let currentSlide = 0;
    let slides = [];
    let rotatorInterval = null;

    // Listen for real-time updates to advertisements
    const q = query(
      collection(db, "advertisements"),
      orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {
      // Clear container
      adContainer.innerHTML = "";
      slides = [];

      if (snapshot.empty) {
        adContainer.innerHTML =
          '<div style="text-align: center; color: var(--text-dim); padding: 2rem;">Tiada iklan aktif.</div>';
        if (rotatorInterval) clearInterval(rotatorInterval);
        return;
      }

      snapshot.forEach((doc, index) => {
        const data = doc.data();
        const slide = document.createElement("div");
        slide.className = `ad-slide ad${index + 1}`;
        if (index === 0) slide.classList.add("active");

        slide.innerHTML = `
          <h3>${data.header}</h3>
          <div class="ad-content">
            <div class="ad-highlight">${data.highlight}</div>
            <div>${data.line1}</div>
            ${data.line2 ? `<div style="margin: 10px 0;">${data.line2}</div>` : ""}
            ${data.contact1 ? `<div class="ad-contact">${data.contact1}</div>` : ""}
            ${data.contact2 ? `<div class="ad-contact">${data.contact2}</div>` : ""}
          </div>
        `;
        adContainer.appendChild(slide);
        slides.push(slide);
      });

      // Restart rotator if multiple slides exist
      if (slides.length > 1) {
        startRotator();
      } else {
        if (rotatorInterval) clearInterval(rotatorInterval);
      }
    });

    function startRotator() {
      if (rotatorInterval) clearInterval(rotatorInterval);
      currentSlide = 0;
      const slideInterval = 8000; // 8 seconds

      rotatorInterval = setInterval(() => {
        if (slides.length <= 1) return;

        // Current slide exits
        const prevIndex = currentSlide;
        slides[prevIndex].classList.remove("active");
        slides[prevIndex].classList.add("exit");

        // Increment index
        currentSlide = (currentSlide + 1) % slides.length;

        // Next slide enters
        slides[currentSlide].classList.remove("exit");
        slides[currentSlide].classList.add("active");

        // Reset previous slide after transition
        setTimeout(() => {
          if (slides[prevIndex]) slides[prevIndex].classList.remove("exit");
        }, 800);
      }, slideInterval);
    }
  }

  function loadActivities() {
    const activitiesContainer = document.querySelector(".activities-content");

    const q = query(collection(db, "activities"), orderBy("tarikh", "asc"));

    onSnapshot(q, (snapshot) => {
      activitiesContainer.innerHTML = "";

      // Add visual feedback for update
      activitiesContainer.classList.remove("update-pulse");
      void activitiesContainer.offsetWidth; // Trigger reflow
      activitiesContainer.classList.add("update-pulse");

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Format Masa Display
        let masaDisplay = data.masa || "";
        if (data.masa_option === "maghrib") {
          masaDisplay = "Selepas solat Maghrib";
        } else if (data.masa_option === "isyak") {
          masaDisplay = "Selepas isyak";
        } else if (data.masa_option === "subuh") {
          masaDisplay = "Selepas solat subuh";
        } else if (data.masa_option === "lain" && data.masa) {
          masaDisplay = data.masa;
        }

        // ustaz photo logic
        let ustazPhotoHTML = "";
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
          "syawal": "img/ustaz/ustaz_syawal.png"
        };

        if (data.penceramah) {
          const penceramahName = data.penceramah.toLowerCase();
          for (const [nameKeyword, photoPath] of Object.entries(SPEAKER_PHOTOS)) {
            if (penceramahName.includes(nameKeyword)) {
              ustazPhotoHTML = `<img src="${photoPath}" class="lecturer-photo-brush" alt="${data.penceramah}">`;
              break;
            }
          }
        }

        // Logic to check if activity is done (date before today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activityDate = new Date(data.tarikh);
        const isDone = activityDate < today;

        const activityHTML = `
          <div class="activity-group ${data.is_batal ? 'cancelled' : ''} ${isDone ? 'done' : ''}">
            <div class="activity-date">
              <span class="day-badge">${data.hari}</span>
              <span class="date-text">${formatDateDDMMYYYY(data.tarikh)}</span>
            </div>
  
            <div class="activity-item">
              <div class="act-details">
                <div class="act-title">${data.tajuk} ${masaDisplay ? `(${masaDisplay})` : ""}</div>
                <div class="act-lead">${data.penceramah}</div>
                ${data.nota ? `<div class="act-note" style="font-size: 0.9rem; color: #666; font-style: italic; margin-top: 4px;">${data.nota}</div>` : ""}
              </div>
              ${ustazPhotoHTML}
              ${data.is_batal ? `<div class="batal-overlay"><img src="img/tangguh.png" alt="TANGGUH"></div>` : ""}
            </div>
          </div>
        `;

        activitiesContainer.innerHTML += activityHTML;
      });
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
