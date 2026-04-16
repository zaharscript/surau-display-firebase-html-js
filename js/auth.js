import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ─── Idle Timeout Configuration ───────────────────────────────────────────────
const IDLE_LIMIT_MS = 60 * 60 * 1000;  // 1 hour
const WARN_BEFORE_MS = 5 * 60 * 1000;  // warn 5 minutes before logout
const WARN_AT_MS = IDLE_LIMIT_MS - WARN_BEFORE_MS; // 55 minutes

let idleTimer = null;
let warnTimer = null;
let countdownInterval = null;
let isAdmin = false;

// Exposed so activity_form.js can call resetIdleTimer() after any CRUD action
export function resetIdleTimer() {
    if (!isAdmin) return;
    clearTimeout(idleTimer);
    clearTimeout(warnTimer);
    clearInterval(countdownInterval);
    hideIdleWarning();

    // Re-arm timers
    warnTimer = setTimeout(showIdleWarning, WARN_AT_MS);
    idleTimer = setTimeout(autoLogout, IDLE_LIMIT_MS);
}

function autoLogout() {
    clearInterval(countdownInterval);
    hideIdleWarning();
    alert("Sesi anda telah tamat kerana tiada aktiviti selama 1 jam. Anda akan dilog keluar.");
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
}

// ─── Warning Modal ────────────────────────────────────────────────────────────
function createWarningModal() {
    if (document.getElementById("idle-warning-modal")) return;

    const modal = document.createElement("div");
    modal.id = "idle-warning-modal";
    modal.innerHTML = `
        <div id="idle-warning-box">
            <div id="idle-warning-icon">⏱️</div>
            <h3>Sesi Hampir Tamat</h3>
            <p>Anda tidak melakukan sebarang aktiviti.<br>
               Anda akan dilog keluar secara automatik dalam:</p>
            <div id="idle-countdown">5:00</div>
            <div id="idle-warning-actions">
                <button id="idle-stay-btn">Teruskan Sesi</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("idle-stay-btn").addEventListener("click", () => {
        resetIdleTimer();
    });
}

function showIdleWarning() {
    createWarningModal();
    const modal = document.getElementById("idle-warning-modal");
    modal.style.display = "flex";

    // Countdown display
    let secsLeft = WARN_BEFORE_MS / 1000; // 300 seconds
    const countdownEl = document.getElementById("idle-countdown");

    function updateCountdown() {
        const m = Math.floor(secsLeft / 60);
        const s = secsLeft % 60;
        countdownEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
        secsLeft--;
    }

    updateCountdown();
    countdownInterval = setInterval(() => {
        if (secsLeft < 0) {
            clearInterval(countdownInterval);
            return;
        }
        updateCountdown();
    }, 1000);
}

function hideIdleWarning() {
    const modal = document.getElementById("idle-warning-modal");
    if (modal) modal.style.display = "none";
}

// ─── Handle Login ──────────────────────────────────────────────────────────────
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const loginBtn = document.getElementById("loginBtn");
        const errorMessage = document.getElementById("errorMessage");

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Log Masuk...';
        errorMessage.style.display = "none";

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Login Error:", error);
            errorMessage.textContent = "Gagal log masuk. Sila semak e-mel dan kata laluan anda.";
            errorMessage.style.display = "block";
            loginBtn.disabled = false;
            loginBtn.textContent = "Log Masuk";
        }
    });
}

// ─── Universal Auth Guard ─────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
    const currentPage = window.location.pathname.split("/").pop();
    const protectedPages = ["activity_form.html", "ad_form.html"];

    if (user) {
        isAdmin = true;

        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "block");
        document.querySelectorAll(".guest-only").forEach(el => el.style.display = "none");

        if (currentPage === "login.html") {
            window.location.href = "index.html";
        }

        // Start idle timer only on protected (admin) pages
        if (protectedPages.includes(currentPage)) {
            resetIdleTimer();
        }
    } else {
        isAdmin = false;
        clearTimeout(idleTimer);
        clearTimeout(warnTimer);
        clearInterval(countdownInterval);

        if (protectedPages.includes(currentPage)) {
            window.location.href = "login.html";
        }

        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
        document.querySelectorAll(".guest-only").forEach(el => el.style.display = "block");
    }
});

// ─── Logout Function ──────────────────────────────────────────────────────────
export async function logout() {
    try {
        clearTimeout(idleTimer);
        clearTimeout(warnTimer);
        clearInterval(countdownInterval);
        await signOut(auth);
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout Error:", error);
        alert("Gagal log keluar.");
    }
}

// Add logout event listeners
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".logout-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    });
});
