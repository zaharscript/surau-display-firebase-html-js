import { db } from "./firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { formatTime12h } from "./utils.js";

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

function getSpeakerPhotoPath(data) {
  if (!data.penceramah && !data.tajuk) return "";
  const searchStr = `${data.penceramah || ""} ${
    data.tajuk || ""
  }`.toLowerCase();

  for (const [keyword, path] of Object.entries(SPEAKER_PHOTOS)) {
    if (searchStr.includes(keyword)) return path;
  }
  return "";
}

function renderCards() {
  const container = document.getElementById("event-cards-container");
  const q = query(collection(db, "activities"), orderBy("tarikh", "asc"));

  onSnapshot(q, (snapshot) => {
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = `<div style="padding: 50px; font-family: 'Montserrat';">Tiada aktiviti akan datang.</div>`;

      console.log("Activities found:", snapshot.size);

      container.innerHTML = "";

      return;
    }

    const themes = ["navy", "maroon", "green"];
    let themeIndex = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const photoPath = getSpeakerPhotoPath(data);

      // Format Date
      const activityDate = new Date(data.tarikh);
      const dateStr = activityDate
        .toLocaleDateString("ms-MY", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
        .toUpperCase();

      const timeStr = formatTime12h(data.lain_from || "00:00");

      // Choose Theme
      const theme = themes[themeIndex % themes.length];
      themeIndex++;

      let context = data.masa_option || "Selepas";
      if (context === "subuh") context = "Selepas Subuh";
      if (context === "maghrib") context = "Selepas Maghrib";
      if (context === "isyak") context = "Selepas Isyak";

      const cardHtml = `
                <div class="event-card ${theme}">
                    <div class="card-top">
                        <div class="card-meta-box">${dateStr}</div>
                        <div class="card-time">${timeStr}</div>
                    </div>
                    
                    <div class="card-middle">
                        <div class="card-title">${
                          data.tajuk || "Aktiviti Surau"
                        }</div>
                    </div>

                    <div class="card-bottom">
                        <div class="card-speaker-label">Bersama</div>
                        <div class="card-speaker-name">${
                          data.penceramah || "Penceramah"
                        }</div>
                        <div class="card-context">${context}</div>
                    </div>

                    ${
                      photoPath
                        ? `
                    <div class="card-portrait-wrapper">
                        <img src="${photoPath}" class="card-portrait" alt="Speaker" onerror="this.parentElement.style.display='none'">
                    </div>
                    `
                        : ""
                    }
                </div>
            `;
      container.insertAdjacentHTML("beforeend", cardHtml);
    });
  });
}

document.addEventListener("DOMContentLoaded", renderCards);
