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
  "Custom Branding",
  "Lead Boost",
  "Spin Wheel Feature",
];

let cfg = null;

// DOM
const app = document.getElementById("app");
const toast = document.getElementById("toast");

// Modal DOM
const spinModalBackdrop = document.getElementById("spinModalBackdrop");
const closeSpinModalBtn = document.getElementById("closeSpinModalBtn");
const wheelRotor = document.getElementById("wheelRotor");
const wheelDisk = document.getElementById("wheelDisk");
const spinBtn = document.getElementById("spinBtn");
const resultText = document.getElementById("resultText");
const wheelLabels = document.getElementById("wheelLabels");

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
  trackEvent("config_load_error", { code: "config_load_failed" });
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
  renderWheelLabels();
  window.addEventListener("resize", debounce(renderWheelLabels, 120));
  initClouds();

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
          <img class="avatar" src="${escapeAttr(safeUrl(b.photo_url))}" alt="${escapeAttr(b.name)}" />
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

        <div class="biz-cta">Click here to WhatsApp me -></div>
      </div>
    </section>
  `;

  // Spin demo card
  const spinCard = `
    <section class="card">
      <img class="banner" src="${escapeAttr(safeUrl(s.banner_image_url))}" alt="Spin & Win" />
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
    <a href="${escapeAttr(safeUrl(x.url))}" target="_blank" rel="noopener">
      <img src="${escapeAttr(safeUrl(x.icon_url))}" alt="${escapeAttr(x.label)}" />
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
          <a class="btn btn-secondary btn-big" href="${escapeAttr(safeUrl(c.vcf_path || "syaqir-shaq.vcf"))}" download>Save Contact</a>
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
              <a class="btn btn-secondary btn-big" href="${escapeAttr(safeUrl(item.url))}" target="_blank" rel="noopener">${escapeHtml(item.button_text || "Open YouTube")}</a>
            </div>
          </div>
        </section>
      `;
    }

    // IG / TikTok thumbnail link cards
    return `
      <section class="card">
        <img class="post-thumb" src="${escapeAttr(safeUrl(item.thumbnail_url))}" alt="${escapeAttr(item.platform)} thumbnail" />
        <div class="card-inner">
          <div class="pill">${escapeHtml(item.platform || "Post")}</div>
          <div class="card-title" style="margin-top:10px;">${escapeHtml(item.title || (item.platform + " Post"))}</div>
          <div class="card-sub">Tap to open the post.</div>
          <div style="margin-top:12px;">
            <a class="btn btn-secondary btn-big" href="${escapeAttr(safeUrl(item.url))}" target="_blank" rel="noopener">${escapeHtml(item.button_text || "Open Post")}</a>
          </div>
        </div>
      </section>
    `;
  }).join("");

  // Footer icons (rendered from config)
  const footerHtml = `
    <div class="footer" aria-label="Social links">
      ${footerIcons.map((x) => `
        <a href="${escapeAttr(safeUrl(x.url))}" target="_blank" rel="noopener" aria-label="${escapeAttr(x.label)}">
          <img src="${escapeAttr(safeUrl(x.icon_url))}" alt="${escapeAttr(x.label)}" />
        </a>
      `).join("")}
    </div>
  `;

  app.innerHTML = businessCard + spinCard + saveContactCard + socialHtml + footerHtml;
}

function bindEvents(config) {
  const businessCard = document.getElementById("businessCard");
  const playNowBtn = document.getElementById("playNowBtn");

  const openBusinessWhatsApp = () => {
    const url = makeWaUrl(config.whatsapp.number, config.whatsapp.connect_message);
    openNewTabOrToast(url, "Popup blocked. Tap here to WhatsApp me:");
  };

  waCtaBtn.addEventListener("click", () => {
    trackEvent("whatsapp_cta_click");
  });

  businessCard.addEventListener("click", () => {
    trackEvent("business_card_click");
    openBusinessWhatsApp();
  });

  businessCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      trackEvent("business_card_keydown", { key: e.key });
      openBusinessWhatsApp();
    }
  });

  playNowBtn.addEventListener("click", () => {
    trackEvent("play_now_click");
    openSpinModal();
  });

  closeSpinModalBtn.addEventListener("click", closeSpinModal);
  spinModalBackdrop.addEventListener("click", (e) => {
    if (e.target === spinModalBackdrop) closeSpinModal();
  });

  spinBtn.addEventListener("click", () => {
    trackEvent("spin_click");
    handleSpin();
  });

  leadForm.addEventListener("submit", (e) => handleSubmit(e, config));
}

function renderWheelLabels() {
  if (!wheelLabels) return;
  if (!wheelDisk) return;
  const rect = wheelDisk.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  if (!size) return;
  const segmentAngle = 360 / SEGMENTS.length;
  const offset = -90; // align with top pointer
  const cx = size / 2;
  const cy = size / 2;
  const wheelRadius = size / 2;
  const outerRingThickness = Math.max(10, Math.round(size * 0.03));
  const rimPadding = outerRingThickness + Math.max(10, Math.round(size * 0.02));
  const textRadius = wheelRadius - rimPadding - Math.max(6, Math.round(size * 0.015)) - 40;
  const sweepRad = (segmentAngle * Math.PI) / 180;
  const maxTextWidth = sweepRad * textRadius * 0.75;
  const forceFlip = new Set(["Lead Boost", "Custom Branding"]);

  wheelLabels.innerHTML = SEGMENTS.map((label, i) => {
    const start = offset + (i * segmentAngle);
    const mid = start + (segmentAngle / 2);
    const midRad = (mid * Math.PI) / 180;
    let rotation = midRad + (Math.PI / 2);
    rotation = ((rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    if (rotation > Math.PI / 2 && rotation < (3 * Math.PI) / 2) {
      rotation += Math.PI;
    }
    if (forceFlip.has(label)) {
      rotation += Math.PI;
    }

    const display = truncateLabel(label, maxTextWidth);
    const x = cx + Math.cos(midRad) * textRadius;
    const y = cy + Math.sin(midRad) * textRadius;

    return `
      <div class="wheel-label"
           style="left:${x}px; top:${y}px; transform: translate(-50%,-50%) rotate(${rotation}rad);">
        ${escapeHtml(display)}
      </div>
    `;
  }).join("");
}

function truncateLabel(text, maxWidth) {
  const avgChar = 9; // approx width for 18px bold
  const maxChars = Math.max(3, Math.floor(maxWidth / avgChar));
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(1, maxChars - 1)) + "...";
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
  setTimeout(renderWheelLabels, 0);
}

function closeSpinModal() {
  spinModalBackdrop.classList.add("hidden");
  closeBottomSheet();
  leadForm.reset();
  // Restore hidden fields cleared by reset
  sourceInput.value = window.location.href;
  locationInput.value = "";
  detectLocation().catch(() => {});
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

  const segmentAngle = 360 / SEGMENTS.length;
  const extraSpins = 5 * 360;
  const randomAngle = Math.random() * 360;
  const newRotation = currentRotation + extraSpins + randomAngle;

  wheelRotor.style.transform = `rotate(${newRotation}deg)`;
  currentRotation = newRotation;

  resultText.textContent = "Spinning...";

  setTimeout(() => {
    spinning = false;

    const demoPrize = SEGMENTS[getWinningIndex(currentRotation, segmentAngle)];
    resultText.innerHTML =
      `You got: <b>${escapeHtml(demoPrize)}</b><br>` +
      `Unlocked: <b>Spin Wheel feature for your product</b>`;

    openBottomSheet();
  }, 3300);
}

function getWinningIndex(rotationDeg, segmentAngle) {
  const norm = ((rotationDeg % 360) + 360) % 360;
  const pointerAngle = (360 - norm) % 360;
  return Math.floor(pointerAngle / segmentAngle) % SEGMENTS.length;
}

async function handleSubmit(e, config) {
  e.preventDefault();

  // hide WhatsApp CTA until success
  waCtaWrap.classList.add("hidden");
  waCtaBtn.href = "#";

  // Honeypot anti-spam
  const honeypot = (document.getElementById("website").value || "").trim();
  if (honeypot) {
    trackEvent("lead_submit_invalid");
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

    trackEvent("lead_submit_success");
    formMsg.textContent = "Thanks! Tap below to open WhatsApp.";
    setLoading(false);

    // Show the safe WhatsApp button (user click = not blocked)
    showAfterSubmitWhatsApp(config);
  } catch (err) {
    trackEvent("lead_submit_error", { code: "submit_failed" });
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

function trackEvent(name, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
  submitBtnText.textContent = isLoading ? "Submitting..." : "Submit";
}

function makeWaUrl(number, message) {
  return `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
}

function openNewTabOrToast(url, prefixText) {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    trackEvent("popup_blocked");
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

function safeUrl(url) {
  if (!url) return "#";
  const raw = String(url).trim();
  if (!raw) return "#";
  if (raw.startsWith("#")) return raw;
  // Allow relative URLs
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return raw;
  } catch {}
  return "#";
}

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function initClouds() {
  const container = document.getElementById("clouds");
  if (!container) return;

  const spawnMs = Number(container.dataset.spawnMs || 2200);
  const maxClouds = Number(container.dataset.max || 16);
  const minTop = 6;
  const maxTop = 86;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnCloud() {
    if (container.children.length >= maxClouds) return;

    const cloud = document.createElement("span");
    const shapes = ["shape-1", "shape-2", "shape-3"];
    cloud.className = `cloud ${shapes[Math.floor(Math.random() * shapes.length)]}`;

    const scale = rand(0.5, 1.8);
    const top = rand(minTop, maxTop);
    const duration = Math.random() < 0.5 ? rand(10, 22) : rand(40, 80);
    const opacity = rand(0.35, 0.75);
    const blur = rand(0.2, 0.8);

    cloud.style.top = `${top}%`;
    cloud.style.left = `${-300 - rand(0, 700)}px`;
    cloud.style.transform = `scale(${scale})`;
    cloud.style.opacity = opacity.toFixed(2);
    cloud.style.filter = `blur(${blur}px)`;
    cloud.style.animationDuration = `${duration}s`;

    container.appendChild(cloud);

    const totalMs = duration * 1000 + 2000;
    setTimeout(() => cloud.remove(), totalMs);
  }

  // Initial batch
  for (let i = 0; i < Math.min(6, maxClouds); i++) spawnCloud();

  setInterval(spawnCloud, spawnMs);
}


