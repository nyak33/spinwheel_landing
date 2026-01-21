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
const contactBtn = document.getElementById("contactBtn");
const resultText = document.getElementById("resultText");

// Modal elements
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
const leadForm = document.getElementById("leadForm");
const formMsg = document.getElementById("formMsg");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const loader = document.getElementById("loader");

document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("source").value = window.location.href;

// Basic wheel label overlay (simple text list in result area)
resultText.textContent = "Click Spin to try the demo.";

spinBtn.addEventListener("click", () => {
  if (spinning) return;

  spinning = true;
  contactBtn.disabled = true;

  // Choose random segment
  const segmentIndex = Math.floor(Math.random() * SEGMENTS.length);

  // Each segment is 360 / 8 = 45 degrees
  const segmentAngle = 360 / SEGMENTS.length;

  // We want the selected segment to land under the pointer at the top.
  // Pointer is at 0deg (top). We'll rotate so that the segment center aligns to top.
  const targetAngle = (segmentIndex * segmentAngle) + (segmentAngle / 2);

  // Add multiple spins + adjust for current rotation
  const extraSpins = 5 * 360;
  const newRotation = currentRotation + extraSpins + (360 - targetAngle);

  wheelDisk.style.transform = `rotate(${newRotation}deg)`;
  currentRotation = newRotation;

  resultText.textContent = "Spinning…";

  // Wait for CSS transition to end
  setTimeout(() => {
    spinning = false;

    // Always same "offer", but show the demo label too
    const demoPrize = SEGMENTS[segmentIndex];
    resultText.innerHTML =
      `🎉 You got: <b>${escapeHtml(demoPrize)}</b><br>` +
      `Unlocked: <b>Spin Wheel feature for your product</b>`;

    contactBtn.disabled = false;
    contactBtn.focus();
  }, 3300);
});

// === MODAL ===
contactBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

function openModal() {
  modalBackdrop.classList.remove("hidden");
  formMsg.textContent = "";
  // Focus first input
  setTimeout(() => document.getElementById("company_name").focus(), 50);
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
    // Silent success
    goWhatsApp();
    return;
  }

  // Browser required validation will handle required fields,
  // but we also keep message clean:
  formMsg.textContent = "";

  setLoading(true);

  try {
    const formData = new FormData(leadForm);

    // IMPORTANT: send as application/x-www-form-urlencoded to avoid CORS preflight issues
    const body = new URLSearchParams();
    for (const [k, v] of formData.entries()) body.append(k, String(v));

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
    });

    // Apps Script returns JSON text
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

    // Success UX
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
