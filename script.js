// === CONFIG ===
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzgPKjo35hWqKmM3cYuH6c6hhrhHjelICcQPBMm5krn21H19gfIprzwvuI7u84oB2wHrQ/exec";
const WHATSAPP_PHONE = "601164553118";
const WHATSAPP_MESSAGE = "I want spin wheel feature on my product";

// === SPIN WHEEL (Demo) ===
const SEGMENTS = [
  "Free Demo Setup",
  "Lead Boost",
  "Custom Branding",
  "Lucky Offer",
  "VIP Feature",
  "Try It On Your Site",
  "More Sales",
  "Auto WhatsApp Leads",
];

let spinning = false;
let currentRotation = 0;

const wheelDisk = document.getElementById("wheelDisk");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("resultText");

// Modal elements
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const leadForm = document.getElementById("leadForm");
const formMsg = document.getElementById("formMsg");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const loader = document.getElementById("loader");

// Hidden inputs
const sourceInput = document.getElementById("source");
const locationInput = document.getElementById("location");

document.getElementById("year").textContent = new Date().getFullYear();
sourceInput.value = window.location.href;

resultText.textContent = "Click Spin to try the demo.";

// === Auto-detect location (hidden) via IP geolocation ===
// Note: this is approximate and may fail if user uses VPN / blocked requests.
// If it fails, we just store empty.
detectLocation().catch(() => { /* ignore */ });

async function detectLocation() {
  // ipapi.co supports simple JSON without API key for demos
  const res = await fetch("https://ipapi.co/json/");
  if (!res.ok) return;

  const data = await res.json();
  const city = (data.city || "").trim();
  const region = (data.region || "").trim();
  const country = (data.country_name || "").trim();

  // Build a clean location string
  const parts = [city, region, country].filter(Boolean);
  const loc = parts.join(", ");

  if (loc) locationInput.value = loc;
}

// === SPIN ACTION ===
spinBtn.addEventListener("click", () => {
  if (spinning) return;

  spinning = true;

  // Choose random segment
  const segmentIndex = Math.floor(Math.random() * SEGMENTS.length);

  // Each segment is 360 / 8 = 45 degrees
  const segmentAngle = 360 / SEGMENTS.length;

  // Align selected segment center to top pointer (0deg)
  const targetAngle = (segmentIndex * segmentAngle) + (segmentAngle / 2);

  // Add multiple spins
  const extraSpins = 5 * 360;
  const newRotation = currentRotation + extraSpins + (360 - targetAngle);

  wheelDisk.style.transform = `rotate(${newRotation}deg)`;
  currentRotation = newRotation;

  resultText.textContent = "Spinning…";

  setTimeout(() => {
    spinning = false;

    const demoPrize = SEGMENTS[segmentIndex];
    resultText.innerHTML =
      `🎉 You got: <b>${escapeHtml(demoPrize)}</b><br>` +
      `Unlocked: <b>Spin Wheel feature for your product</b>`;

    // Auto open the form after spin
    openModal();
  }, 3300);
});

// === MODAL ===
closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

function openModal() {
  modalBackdrop.classList.remove("hidden");
  formMsg.textContent = "";

  // focus first input
  setTimeout(() => document.getElementById("name").focus(), 50);
}

function closeModal() {
  modalBackdrop.classList.add("hidden");
}

// === FORM SUBMIT ===
leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Honeypot
  const honeypot = (document.getElementById("website").value || "").trim();
  if (honeypot) {
    goWhatsApp();
    return;
  }

  formMsg.textContent = "";
  setLoading(true);

  try {
    // Ensure location attempt happens (if not already)
    if (!locationInput.value) {
      try { await detectLocation(); } catch { /* ignore */ }
    }

    const formData = new FormData(leadForm);

    // Send as x-www-form-urlencoded to avoid CORS preflight problems
    const body = new URLSearchParams();
    for (const [k, v] of formData.entries()) body.append(k, String(v));

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { ok: res.ok };
    }

    if (!res.ok || !json.ok) {
      throw new Error(json.error || "Submit failed. Please try again.");
    }

    formMsg.textContent = "Thanks! Opening WhatsApp…";
    await delay(500);
    goWhatsApp();
  } catch (err) {
    formMsg.textContent = err.message || "Something went wrong. Please try again.";
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  loader.classList.toggle("hidden", !isLoading);
  submitBtnText.textContent = isLoading ? "Submitting…" : "Submit";
}

function goWhatsApp() {
  const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  window.location.href = url;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
