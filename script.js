/* =========================================================
   Spin & Win Landing (config.json-driven)
   - Business card click => WhatsApp connect message (NEW TAB)
   - Play Now => full-screen Spin modal
   - After spin => bottom sheet form
   - Submit => Google Sheets (Apps Script) + Email (Apps Script)
             => show "Tap to open WhatsApp" button (NEW TAB, no popup blocked)
   - GitHub Pages compatible: uses fetch("config.json")
   ========================================================= */

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

let cfg = null;

// DOM
const app = document.getElementById("app");
const toast = document.getElementById("toast");

// Modal DOM
const spinModalBackdrop = document.getElementById("spinModalBackdrop");
const closeSpinModalBtn = document.getElementById("closeSpinModalBtn");
const wheelDisk = document.getElementById("wheelDisk");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("resultText");

// Bottom sheet + form DOM
const sheet = document.getElementById("sheet");
const leadForm = document.getElementById("leadForm");
const formMsg = document.getElementById("formMsg");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const locationInput = document.getElementById("location");
const sourceInput = document.getElementById("source");

// After-submit WhatsApp CTA
const waCtaWrap = document.getElementById("waCtaWrap");
const waCtaBtn = document.getElementById("waCtaBtn");

let spinning = false;
let currentRotation = 0;

init().catch((err) => {
  console.error(err);
  app.innerHTML = `
    <div class="card"><div class="card-inner">
      <div class="card-title">Oops</div>
      <div class="card-sub">Could not load config.json. Please check your deployment.</div>
    </div></div>
  `;
});

async function init() {
  cfg = await loadConfig();
  renderLanding(cfg);
  bindEvents(cfg);

  // Hidden fields
  sourceInput.value = window.location.href;

  // Best-effort location capture (hidden)
  detectLocation().catch(() => {});

  resultText.textContent = "Tap Spin Now to try the demo.";
}

async function loadConfig() {
  // IMPORTANT: relative path for GitHub Pages
  const res = await fetch("config.json", { cache: "no-store" });
  if (!res.ok) throw new Error("config.json not found");
  return res.json();
}

function renderLanding(config) {
  const b = config.business_card;
  const s = config.spin_demo;
  const c = config.save_contact;
  const socialCards = config.social_cards || [];
  const footerIcons = config.footer_icons || [];

  // Business card (click => WhatsApp)
  const businessCard = `
    <section class="card business" id="businessCard" role="button" tabindex="0" aria-label="Open WhatsApp">
      <div class="card-inner">
        <div class="business-top">
          <img class="avatar" src="${escapeAttr(b.photo_url)}" alt="${escapeAttr(b.name)}" />
          <div>
            <div class="name">${escapeHtml(b.name)}</div>
            <div class="tagline">${escapeHtml(b.tagline || "")}</div>
          </div>
        </div>

        <div class="business-grid">
          <div class="info">
            <div class="label">Position</div>
            <div class="value">${escapeHtml(b.position)}</div>
          </div>
          <div class="info">
            <div class="label">Company</div>
            <div class="value">${escapeHtml(b.company)}</div>
          </div>
        </div>

        <div class="biz-cta">Click here to WhatsApp me →</div>
      </div>
    </section>
  `;

  // Spin demo card
  const spinCard = `
    <section class="card">
      <img class="banner" src="${escapeAttr(s.banner_image_url)}" alt="Spin & Win" />
      <div class="card-inner">
        <div>
          <div class="pill">${escapeHtml(s.badge || "INSTANT WIN")}</div>
          <div class="card-title" style="margin-top:10px;">${escapeHtml(s.title || "Spin & Win Demo")}</div>
          <div class="card-sub">Play the demo. After you spin, fill the form and then tap to open WhatsApp.</div>
        </div>
        <div class="hero-actions">
          <button id="playNowBtn" class="btn btn-primary btn-big" type="button">${escapeHtml(s.button_text || "Play Now")}</button>
        </div>
      </div>
    </section>
  `;

  // Save contact card
  const socialsMini = (c.socials || []).map(x => `
    <a href="${escapeAttr(x.url)}" target="_blank" rel="noopener">
      <img src="${escapeAttr(x.icon_url)}" alt="${escapeAttr(x.label)}" />
      ${escapeHtml(x.label)}
    </a>
  `).join("");

  const saveContactCard = `
    <section class="card">
      <div class="card-inner">
        <div class="card-title">${escapeHtml(c.card_title || "Save My Contact")}</div>
        <div class="card-sub">Save my contact to your phone in one tap.</div>

        <div class="contact-row">
          <div class="kv"><div class="k">Name</div><div class="v">${escapeHtml(c.full_name)}</div></div>
          <div class="kv"><div class="k">Phone</div><div class="v">${escapeHtml(c.phone)}</div></div>
          <div class="kv"><div class="k">Email</div><div class="v">${escapeHtml(c.email)}</div></div>
          <div class="kv"><div class="k">Company</div><div class="v">${escapeHtml(c.company)}</div></div>
          <div class="kv"><div class="k">Position</div><div class="v">${escapeHtml(c.job_title)}</div></div>
          <div class="kv"><div class="k">Website</div><div class="v">${escapeHtml(c.website)}</div></div>
        </div>

        <div class="social-mini">${socialsMini}</div>

        <div style="margin-top:12px;">
          <a class="btn btn-secondary btn-big" href="${escapeAttr(c.vcf_path || "syaqir-shaq.vcf")}" download>Save Contact</a>
        </div>
      </div>
    </section>
  `;

  // Social cards
  const socialHtml = socialCards.map((item) => {
    if (item.type === "youtube") {
      const ytId = getYouTubeId(item.url);
      const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : null;

      return `
        <section class="card">
          <div class="yt-wrap">
            ${embedUrl
              ? `<iframe src="${embedUrl}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
              : `<div class="card-inner"><div class="card-title">YouTube</div><div class="card-sub">Invalid YouTube link</div></div>`
            }
          </div>
          <div class="card-inner">
            <div class="pill">YouTube</div>
            <div class="card-title" style="margin-top:10px;">${escapeHtml(item.title || "YouTube Video")}</div>
            <div style="margin-top:12px;">
              <a class="btn btn-secondary btn-big" href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.button_text || "Open YouTube")}</a>
            </div>
          </div>
        </section>
      `;
    }

    // IG / TikTok thumbnail link cards
    return `
      <section class="card">
        <img class="post-thumb" src="${escapeAttr(item.thumbnail_url)}" alt="${escapeAttr(item.platform)} thumbnail" />
        <div class="card-inner">
          <div class="pill">${escapeHtml(item.platform || "Post")}</div>
          <div class="card-title" style="margin-top:10px;">${escapeHtml(item.title || (item.platform + " Post"))}</div>
          <div class="card-sub">Tap to open the post.</div>
          <div style="margin-top:12px;">
            <a class="btn btn-secondary btn-big" href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.button_text || "Open Post")}</a>
          </div>
        </div>
      </section>
    `;
  }).join("");

  // Footer icons (rendered from config)
  const footerHtml = `
    <div class="footer" aria-label="Social links">
      ${footerIcons.map((x) => `
        <a href="${escapeAttr(x.url)}" target="_blank" rel="noopener" aria-label="${escapeAttr(x.label)}">
          <img src="${escapeAttr(x.icon_url)}" alt="${escapeAttr(x.label)}" />
        </a>
      `).join("")}
    </div>
  `;

  app.innerHTML = businessCard + spinCard + saveContactCard + socialHtml + footerHtml;
}

function bindEvents(config) {
  const businessCard = document.getElementById("businessCard");
  const playNowBtn = document.getElementById("playNowBtn");

  businessCard.addEventListener("click", () => {
    const url = makeWaUrl(config.whatsapp.number, config.whatsapp.connect_message);
    openNewTabOrToast(url, "Popup blocked. Tap here to WhatsApp me:");
  });

  businessCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      const url = makeWaUrl(config.whatsapp.number, config.whatsapp.connect_message);
      openNewTabOrToast(url, "Popup blocked. Tap here to WhatsApp me:");
    }
  });

  playNowBtn.addEventListener("click", openSpinModal);

  closeSpinModalBtn.addEventListener("click", closeSpinModal);
  spinModalBackdrop.addEventListener("click", (e) => {
    if (e.target === spinModalBackdrop) closeSpinModal();
  });

  spinBtn.addEventListener("click", handleSpin);

  leadForm.addEventListener("submit", (e) => handleSubmit(e, config));
}

function openSpinModal() {
  spinModalBackdrop.classList.remove("hidden");
  closeBottomSheet();

  // reset after-submit CTA
  waCtaWrap.classList.add("hidden");
  waCtaBtn.href = "#";
  formMsg.textContent = "";

  resultText.textContent = "Tap Spin Now to try the demo.";
  spinBtn.disabled = false;
}

function closeSpinModal() {
  spinModalBackdrop.classList.add("hidden");
  closeBottomSheet();
  leadForm.reset();
  formMsg.textContent = "";
  setLoading(false);
  waCtaWrap.classList.add("hidden");
  waCtaBtn.href = "#";
}

function openBottomSheet() {
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");
  setTimeout(() => document.getElementById("name")?.focus(), 120);
}

function closeBottomSheet() {
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
}

function handleSpin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;

  const segmentIndex = Math.floor(Math.random() * SEGMENTS.length);
  const segmentAngle = 360 / SEGMENTS.length;
  const targetAngle = (segmentIndex * segmentAngle) + (segmentAngle / 2);

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

    openBottomSheet();
  }, 3300);
}

async function handleSubmit(e, config) {
  e.preventDefault();

  // hide WhatsApp CTA until success
  waCtaWrap.classList.add("hidden");
  waCtaBtn.href = "#";

  // Honeypot anti-spam
  const honeypot = (document.getElementById("website").value || "").trim();
  if (honeypot) {
    showAfterSubmitWhatsApp(config);
    return;
  }

  formMsg.textContent = "";
  setLoading(true);

  try {
    if (!locationInput.value) {
      try { await detectLocation(); } catch {}
    }

    const formData = new FormData(leadForm);
    const body = new URLSearchParams();
    for (const [k, v] of formData.entries()) body.append(k, String(v));

    const res = await fetch(config.apps_script.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body.toString(),
    });

    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { ok: res.ok }; }

    if (!res.ok || !json.ok) {
      throw new Error(json.error || "Submit failed. Please try again.");
    }

    formMsg.textContent = "Thanks! Tap below to open WhatsApp.";
    setLoading(false);

    // Show the safe WhatsApp button (user click = not blocked)
    showAfterSubmitWhatsApp(config);
  } catch (err) {
    formMsg.textContent = err.message || "Something went wrong. Please try again.";
    setLoading(false);
    waCtaWrap.classList.add("hidden");
  }
}

function showAfterSubmitWhatsApp(config) {
  const url = makeWaUrl(config.whatsapp.number, config.whatsapp.feature_message);
  waCtaBtn.href = url;
  waCtaWrap.classList.remove("hidden");
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
  submitBtnText.textContent = isLoading ? "Submitting…" : "Submit";
}

function makeWaUrl(number, message) {
  return `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
}

function openNewTabOrToast(url, prefixText) {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    showToast(`${prefixText} <a href="${escapeAttr(url)}" target="_blank" rel="noopener">Open WhatsApp</a>`);
  }
}

function showToast(html) {
  toast.innerHTML = html;
  toast.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add("hidden"), 4000);
}

async function detectLocation() {
  const res = await fetch("https://ipapi.co/json/");
  if (!res.ok) return;
  const data = await res.json();

  const parts = [data.city, data.region, data.country_name]
    .map(v => (v || "").trim())
    .filter(Boolean);

  const loc = parts.join(", ");
  if (loc) locationInput.value = loc;
}

function getYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
    return null;
  } catch {
    return null;
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}
