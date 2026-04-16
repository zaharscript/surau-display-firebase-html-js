import { db } from "./firebase.js";
import { resetIdleTimer } from "./auth.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { formatDateDDMMYYYY } from "./utils.js";

// ─── Fixed times for preset masa options (24-hour) ───────────────────────────
const PRESET_TIMES = {
  subuh: { start: "06:30", end: "08:30" },  // Subuh 6:30 AM, fade 2h after → 8:30 AM → delete
  maghrib: { start: "20:30", end: "22:30" },  // Maghrib 8:30 PM
  isyak: { start: "21:30", end: "23:30" },  // Isyak  9:30 PM
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert 12-h picker values to 24-h "HH:MM" string. Returns "" if incomplete. */
function to24h(hour, minute, ampm) {
  if (!hour || !minute || !ampm) return "";
  let h = parseInt(hour, 10);
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

/** Parse a "HH:MM" 24-h string back into { hour12, minute, ampm } for the picker. */
function from24h(timeStr) {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return { hour12: String(h), minute: mStr, ampm };
}

document.addEventListener("DOMContentLoaded", () => {
  const tarikhInput = document.getElementById("tarikh");
  const hariDisp = document.getElementById("hariDisp");
  const hariInput = document.getElementById("hari");
  const activityForm = document.getElementById("activityForm");
  const activityList = document.getElementById("activityList");
  const editIdInput = document.getElementById("editId");
  const submitBtn = document.getElementById("submitBtn");
  const cancelEditBtn = document.getElementById("cancelEdit");
  const syncStatus = document.getElementById("syncStatus");

  // Lain-lain time-picker elements
  const masaLainContainer = document.getElementById("masaLainContainer");
  const fromHourSel = document.getElementById("fromHour");
  const fromMinuteSel = document.getElementById("fromMinute");
  const fromAmPmSel = document.getElementById("fromAmPm");
  const toHourSel = document.getElementById("toHour");
  const toMinuteSel = document.getElementById("toMinute");
  const toAmPmSel = document.getElementById("toAmPm");

  // ── Sync Status ────────────────────────────────────────────────────────────
  function updateSyncStatus(isSynced, isError = false) {
    if (!syncStatus) return;
    if (isError) {
      syncStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Ralat';
      syncStatus.className = "sync-badge error";
    } else if (isSynced) {
      syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Bersama';
      syncStatus.className = "sync-badge synced";
    } else {
      syncStatus.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menyinkron...';
      syncStatus.className = "sync-badge";
    }
  }

  updateSyncStatus(navigator.onLine);
  window.addEventListener("online", () => updateSyncStatus(true));
  window.addEventListener("offline", () => updateSyncStatus(false));

  // ── Day display ────────────────────────────────────────────────────────────
  const malayDays = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];

  tarikhInput.addEventListener("change", (e) => updateDayDisplay(e.target.value));

  function updateDayDisplay(dateVal) {
    if (dateVal) {
      const date = new Date(dateVal);
      const dayName = malayDays[date.getDay()];
      hariDisp.textContent = dayName;
      hariInput.value = dayName;
    } else {
      hariDisp.textContent = "-";
      hariInput.value = "";
    }
  }

  // ── Toggle Lain-lain picker ────────────────────────────────────────────────
  document.querySelectorAll('input[name="masaOption"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      const isLain = radio.value === "lain" && radio.checked;
      masaLainContainer.style.display = isLain ? "block" : "none";
      // make lain fields required when visible
      [fromHourSel, fromMinuteSel, fromAmPmSel,
        toHourSel, toMinuteSel, toAmPmSel].forEach(el => {
          el.required = isLain;
        });
    });
  });

  // ── Real-time activity list ────────────────────────────────────────────────
  const q = query(collection(db, "activities"), orderBy("tarikh", "desc"));
  onSnapshot(q, (snapshot) => {
    activityList.innerHTML = "";
    if (snapshot.empty) {
      activityList.innerHTML = '<p style="text-align:center;color:#888;">Tiada aktiviti dijumpai.</p>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = docSnap.id;
      const isBatal = data.is_batal || false;

      // Resolve display masa
      let masaDisplay = "";
      if (data.masa_option === "subuh") masaDisplay = "Subuh (6:30 AM)";
      else if (data.masa_option === "maghrib") masaDisplay = "Maghrib (8:30 PM)";
      else if (data.masa_option === "isyak") masaDisplay = "Selepas Isyak (9:30 PM)";
      else if (data.masa_option === "lain") {
        const fromStr = data.lain_from ? formatTime12hDisplay(data.lain_from) : "";
        const toStr = data.lain_to ? formatTime12hDisplay(data.lain_to) : "";
        masaDisplay = fromStr && toStr ? `${fromStr} – ${toStr}` : (fromStr || data.masa || "");
      }

      const item = document.createElement("div");
      item.className = "activity-item";
      item.innerHTML = `
        <div class="activity-info">
          <h4>${data.tajuk}</h4>
          <p><strong>Tarikh:</strong> ${formatDateDDMMYYYY(data.tarikh)} (${data.hari})</p>
          <p><strong>Masa:</strong> ${masaDisplay || "-"}</p>
          <p><strong>Penceramah:</strong> ${data.penceramah}</p>
          ${data.nota ? `<p><strong>Nota:</strong> ${data.nota}</p>` : ""}
        </div>
        <div class="activity-actions">
          <button class="batal-btn ${isBatal ? 'active' : ''}" data-id="${id}" data-status="${isBatal}">
            ${isBatal ? 'Aktifkan Semula' : 'Tangguh Aktiviti'}
          </button>
          <button class="edit-btn" data-id="${id}">Edit</button>
          <button class="delete-btn ${isBatal ? 'danger' : 'secondary'}" data-id="${id}" data-is-batal="${isBatal}">
            Padam
          </button>
        </div>
      `;
      activityList.appendChild(item);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleEdit(btn.dataset.id, snapshot));
    });
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleDelete(btn.dataset.id, btn.dataset.isBatal === "true"));
    });
    document.querySelectorAll(".batal-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleToggleBatal(btn.dataset.id, btn.dataset.status === "true"));
    });
  });

  // ── Toggle Batal ───────────────────────────────────────────────────────────
  async function handleToggleBatal(id, currentStatus) {
    const newStatus = !currentStatus;
    const actionText = newStatus ? "membatalkan" : "mengaktifkan semula";
    if (confirm(`Adakah anda pasti mahu ${actionText} aktiviti ini?`)) {
      try {
        updateSyncStatus(false);
        await updateDoc(doc(db, "activities", id), {
          is_batal: newStatus,
          updatedAt: serverTimestamp(),
        });
        updateSyncStatus(true);
        resetIdleTimer(); // ← reset idle clock on action
      } catch (error) {
        console.error("Error toggling batal status:", error);
        updateSyncStatus(false, true);
        alert("Gagal mengemaskini status aktiviti.");
      }
    }
  }

  // ── Edit ───────────────────────────────────────────────────────────────────
  function handleEdit(id, snapshot) {
    const docData = snapshot.docs.find((d) => d.id === id).data();

    editIdInput.value = id;
    tarikhInput.value = docData.tarikh;
    updateDayDisplay(docData.tarikh);

    const masaOption = docData.masa_option || "lain";
    const radioEl = document.querySelector(`input[name="masaOption"][value="${masaOption}"]`);
    if (radioEl) {
      radioEl.checked = true;
      radioEl.dispatchEvent(new Event("change"));
    }

    // Populate Lain-lain pickers if applicable
    if (masaOption === "lain") {
      const fromParsed = from24h(docData.lain_from);
      const toParsed = from24h(docData.lain_to);
      if (fromParsed) {
        fromHourSel.value = fromParsed.hour12;
        fromMinuteSel.value = fromParsed.minute;
        fromAmPmSel.value = fromParsed.ampm;
      }
      if (toParsed) {
        toHourSel.value = toParsed.hour12;
        toMinuteSel.value = toParsed.minute;
        toAmPmSel.value = toParsed.ampm;
      }
    }

    document.getElementById("tajuk").value = docData.tajuk;
    document.getElementById("penceramah").value = docData.penceramah;
    document.getElementById("nota").value = docData.nota || "";

    submitBtn.textContent = "Simpan Kemaskini";
    submitBtn.style.backgroundColor = "#f1c40f";
    submitBtn.style.color = "#1a202c";
    cancelEditBtn.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(id, isBatal) {
    let confirmMsg = "Adakah anda pasti mahu memadam aktiviti ini secara kekal?";
    if (!isBatal) {
      confirmMsg = "Adakah aktiviti ini dibatalkan? \n\nJika YA, sila gunakan butang 'Tangguh Aktiviti' supaya rekod tetap disimpan. \n\nAdakah anda masih mahu memadamnya secara kekal (contoh: untuk membetulkan kesilapan taip)?";
    }
    if (confirm(confirmMsg)) {
      try {
        await deleteDoc(doc(db, "activities", id));
        alert("Aktiviti berjaya dipadam!");
        resetIdleTimer(); // ← reset idle clock on action
      } catch (error) {
        console.error("Error deleting activity:", error);
        alert("Gagal memadam aktiviti.");
      }
    }
  }

  // ── Cancel Edit ────────────────────────────────────────────────────────────
  cancelEditBtn.addEventListener("click", () => resetForm());

  function resetForm() {
    activityForm.reset();
    editIdInput.value = "";
    hariDisp.textContent = "-";
    masaLainContainer.style.display = "none";
    submitBtn.disabled = false;
    submitBtn.textContent = "Daftar Aktiviti";
    submitBtn.style.backgroundColor = "";
    submitBtn.style.color = "";
    cancelEditBtn.style.display = "none";
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  activityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = editIdInput.value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    updateSyncStatus(false);

    try {
      const formData = new FormData(activityForm);
      const data = Object.fromEntries(formData.entries());

      const masaOption = data.masaOption;
      let masaDisplay = "";
      let lainFrom = "";
      let lainTo = "";

      if (masaOption === "subuh") {
        masaDisplay = "Subuh";
        lainFrom = PRESET_TIMES.subuh.start;
        lainTo = PRESET_TIMES.subuh.end;
      } else if (masaOption === "maghrib") {
        masaDisplay = "Maghrib";
        lainFrom = PRESET_TIMES.maghrib.start;
        lainTo = PRESET_TIMES.maghrib.end;
      } else if (masaOption === "isyak") {
        masaDisplay = "Selepas Isyak";
        lainFrom = PRESET_TIMES.isyak.start;
        lainTo = PRESET_TIMES.isyak.end;
      } else if (masaOption === "lain") {
        lainFrom = to24h(fromHourSel.value, fromMinuteSel.value, fromAmPmSel.value);
        lainTo = to24h(toHourSel.value, toMinuteSel.value, toAmPmSel.value);

        if (!lainFrom || !lainTo) {
          alert("Sila pilih masa 'Dari' dan 'Hingga' untuk pilihan Lain-lain.");
          submitBtn.disabled = false;
          submitBtn.textContent = id ? "Simpan Kemaskini" : "Daftar Aktiviti";
          updateSyncStatus(true);
          return;
        }

        masaDisplay = `${formatTime12hDisplay(lainFrom)} – ${formatTime12hDisplay(lainTo)}`;
      }

      const activityData = {
        tarikh: data.tarikh,
        hari: data.hari,
        masa: masaDisplay,
        masa_option: masaOption,
        // Store 24-h times for lifecycle calculation
        lain_from: lainFrom,
        lain_to: lainTo,
        tajuk: data.tajuk,
        penceramah: data.penceramah,
        nota: data.nota || "",
        updatedAt: serverTimestamp(),
      };

      if (id) {
        await updateDoc(doc(db, "activities", id), activityData);
        updateSyncStatus(true);
        alert("Aktiviti berjaya dikemaskini!");
        resetIdleTimer(); // ← reset idle clock on action
        resetForm();
      } else {
        activityData.createdAt = serverTimestamp();
        await addDoc(collection(db, "activities"), activityData);
        updateSyncStatus(true);
        alert("Aktiviti berjaya didaftarkan!");
        resetIdleTimer(); // ← reset idle clock on action
        resetForm();
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      updateSyncStatus(false, true);
      alert("Gagal menyimpan aktiviti. Sila cuba lagi.");
      submitBtn.disabled = false;
      submitBtn.textContent = id ? "Simpan Kemaskini" : "Daftar Aktiviti";
      submitBtn.style.backgroundColor = id ? "#f1c40f" : "";
      submitBtn.style.color = id ? "#1a202c" : "";
    }
  });
});

// ─── Utility: format 24h "HH:MM" → display "H:MM AM/PM" ─────────────────────
function formatTime12hDisplay(timeStr) {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return timeStr || "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}
