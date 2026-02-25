import { db } from "./firebase.js";
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

  // Sync Status Logic
  function updateSyncStatus(isSynced, isError = false) {
    if (!syncStatus) return; // Be defensive

    if (isError) {
      syncStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> Ralat';
      syncStatus.className = "sync-badge error";
    } else if (isSynced) {
      syncStatus.innerHTML = '<i class="fas fa-check-circle"></i> Bersama';
      syncStatus.className = "sync-badge synced";
    } else {
      syncStatus.innerHTML =
        '<i class="fas fa-circle-notch fa-spin"></i> Menyinkron...';
      syncStatus.className = "sync-badge";
    }
  }

  // Initial status
  updateSyncStatus(navigator.onLine);
  window.addEventListener("online", () => updateSyncStatus(true));
  window.addEventListener("offline", () => updateSyncStatus(false));

  const malayDays = [
    "Ahad",
    "Isnin",
    "Selasa",
    "Rabu",
    "Khamis",
    "Jumaat",
    "Sabtu",
  ];

  // Auto fill hari
  tarikhInput.addEventListener("change", (e) => {
    updateDayDisplay(e.target.value);
  });

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

  // Load activities in real-time
  const q = query(collection(db, "activities"), orderBy("tarikh", "desc"));
  onSnapshot(q, (snapshot) => {
    activityList.innerHTML = "";
    if (snapshot.empty) {
      activityList.innerHTML =
        '<p style="text-align: center; color: #888;">Tiada aktiviti dijumpai.</p>';
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;

      const item = document.createElement("div");
      item.className = "activity-item";
      item.innerHTML = `
        <div class="activity-info">
          <h4>${data.tajuk}</h4>
          <p><strong>Tarikh:</strong> ${formatDateDDMMYYYY(data.tarikh)} (${data.hari})</p>
          <p><strong>Masa:</strong> ${data.masa || "-"}</p>
          <p><strong>Penceramah:</strong> ${data.penceramah}</p>
          ${data.nota ? `<p><strong>Nota:</strong> ${data.nota}</p>` : ""}
        </div>
        <div class="activity-actions">
          <button class="edit-btn" data-id="${id}">Edit Aktiviti</button>
          <button class="batal-btn ${data.is_batal ? 'active' : ''}" data-id="${id}" data-status="${data.is_batal || false}">
            ${data.is_batal ? 'Aktifkan Semula' : 'Tangguh Aktiviti'}
          </button>
          <button class="delete-btn" data-id="${id}">Padam Aktiviti</button>
        </div>
      `;
      activityList.appendChild(item);
    });

    // Add event listeners to buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleEdit(btn.dataset.id, snapshot));
    });
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleDelete(btn.dataset.id));
    });
    document.querySelectorAll(".batal-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleToggleBatal(btn.dataset.id, btn.dataset.status === 'true'));
    });
  });

  // Handle Toggle Batal click
  async function handleToggleBatal(id, currentStatus) {
    const newStatus = !currentStatus;
    const actionText = newStatus ? "membatalkan" : "mengaktifkan semula";

    if (confirm(`Adakah anda pasti mahu ${actionText} aktiviti ini?`)) {
      try {
        updateSyncStatus(false);
        await updateDoc(doc(db, "activities", id), {
          is_batal: newStatus,
          updatedAt: serverTimestamp()
        });
        updateSyncStatus(true);
        window.location.href = "index.html"; // Redirect to main display
      } catch (error) {
        console.error("Error toggling batal status:", error);
        updateSyncStatus(false, true);
        alert("Gagal mengemaskini status aktiviti.");
      }
    }
  }

  // Handle Edit click
  function handleEdit(id, snapshot) {
    const docData = snapshot.docs.find((d) => d.id === id).data();

    // Fill form
    editIdInput.value = id;
    tarikhInput.value = docData.tarikh;
    updateDayDisplay(docData.tarikh);

    // Handle Masa Radio Selection
    const masaValue = docData.masa_option || docData.masa || "";
    const options = ["maghrib", "isyak", "subuh"];

    if (options.includes(masaValue)) {
      document.querySelector(`input[name="masaOption"][value="${masaValue}"]`).checked = true;
      document.getElementById("masaLain").style.display = "none";
    } else {
      document.querySelector('input[name="masaOption"][value="lain"]').checked = true;
      const lainBox = document.getElementById("masaLain");
      lainBox.style.display = "block";
      lainBox.value = docData.masa || "";
    }

    document.getElementById("tajuk").value = docData.tajuk;
    document.getElementById("penceramah").value = docData.penceramah;
    document.getElementById("nota").value = docData.nota || "";

    // UI Updates
    submitBtn.textContent = "Simpan Kemaskini";
    submitBtn.style.backgroundColor = "#f1c40f";
    submitBtn.style.color = "#1a202c";
    cancelEditBtn.style.display = "block";

    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Handle Delete click
  async function handleDelete(id) {
    if (confirm("Adakah anda pasti mahu memadam aktiviti ini?")) {
      try {
        await deleteDoc(doc(db, "activities", id));
        alert("Aktiviti berjaya dipadam!");
      } catch (error) {
        console.error("Error deleting activity:", error);
        alert("Gagal memadam aktiviti.");
      }
    }
  }

  // Cancel Edit
  cancelEditBtn.addEventListener("click", () => {
    resetForm();
  });

  function resetForm() {
    activityForm.reset();
    editIdInput.value = "";
    hariDisp.textContent = "-";
    submitBtn.textContent = "Daftar Aktiviti";
    submitBtn.style.backgroundColor = ""; // Reset to CSS default
    submitBtn.style.color = "";
    cancelEditBtn.style.display = "none";
  }

  // Submit form (Add or Update)
  activityForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = editIdInput.value;

    // Optimistic UI state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    updateSyncStatus(false);

    try {
      const formData = new FormData(activityForm);
      const data = Object.fromEntries(formData.entries());

      let finalMasa = "";
      if (data.masaOption === "lain") {
        finalMasa = document.getElementById("masaLain").value;
      } else {
        finalMasa = data.masaOption;
      }

      const activityData = {
        tarikh: data.tarikh,
        hari: data.hari,
        masa: finalMasa,
        masa_option: data.masaOption,
        tajuk: data.tajuk,
        penceramah: data.penceramah,
        nota: data.nota || "",
        updatedAt: serverTimestamp(),
      };

      if (id) {
        // Update
        await updateDoc(doc(db, "activities", id), activityData);
        // Success feedback
        updateSyncStatus(true);
        alert("Aktiviti berjaya dikemaskini!");
        resetForm();
      } else {
        // Add
        activityData.createdAt = serverTimestamp();
        await addDoc(collection(db, "activities"), activityData);
        // Success feedback
        updateSyncStatus(true);
        alert("Aktiviti berjaya didaftarkan!");
        window.location.href = "index.html"; // Redirect to main display
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      updateSyncStatus(false, true);
      alert("Gagal menyimpan aktiviti. Sila cuba lagi.");

      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = id ? "Simpan Kemaskini" : "Daftar Aktiviti";
      submitBtn.style.backgroundColor = id ? "#f1c40f" : "";
      submitBtn.style.color = id ? "#1a202c" : "";
    }
  });
});

// Toggle textbox bila pilih lain-lain
document.querySelectorAll('input[name="masaOption"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const lainBox = document.getElementById("masaLain");
    if (radio.value === "lain" && radio.checked) {
      lainBox.style.display = "block";
      lainBox.required = true;
    } else {
      lainBox.style.display = "none";
      lainBox.required = false;
      lainBox.value = "";
    }
  });
});
