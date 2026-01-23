/* =========================================================
   Spin & Win Landing (config.json-driven)
   - Business card click => WhatsApp connect message (NEW TAB only)
   - Play Now => full-screen Spin modal
   - After spin => slide-up bottom sheet form
   - Submit => Google Sheets + Email (Apps Script)
             => "Thanks! Opening WhatsApp…" (0.5s) => WhatsApp (NEW TAB)
   Notes:
   - To avoid "both tabs redirect", we DO NOT force same-tab fallback.
   - For submit, we pre-open a blank tab on user gesture, then set its URL later.
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

  sourceInput.value = window.location.href;

  // Best-effort location capture (hidden)
  detectLocation().catch(() => {});
  resultText.textContent = "Tap Spin Now to try the demo.";
}

async function loadConfig() {
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

        <!-- NEW CTA at bottom -->
        <div class="biz-cta">
          Click here to WhatsApp me →
        </div>
      </div>
    </section>
  `;


  const spinCard = `
    <section class="card">
      <img class="banner" src="${escapeAttr(s.banner_image_url)}" alt="Spin & Win" />
      <div class="card-inner">
        <div class="hero-head">
          <div>
            <div class="pill">${escapeHtml(s.badge || "INSTANT WIN")}</div>
            <div class="card-title" style="margin-top:10px;">${escapeHtml(s.title || "Spin & Win Demo")}</div>
            <div class="card-sub">Play the demo. After you spin, fill the form and WhatsApp will open automatically.</div>
          </div>
        </div>
        <div class="hero-actions">
          <button id="playNowBtn" class="btn btn-primary btn-big" type="button">${escapeHtml(s.button_text || "Play Now")}</button>
        </div>
      </div>
    </section>
  `;

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

        <div class="social-mini">
          ${socialsMini}
        </div>

        <div style="margin-top:12px;">
          <a class="btn btn-secondary btn-big" href="${escapeAttr(c.vcf_path || "/syaqir-shaq.vcf")}" download>Save Contact</a>
        </div>
      </div>
    </section>
  `;

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
            <div class="platform">
              <div>
                <div class="pill">YouTube</div>
                <div class="card-title" style="margin-top:10px;">${escapeHtml(item.title || "YouTube Video")}</div>
              </div>
            </div>
            <div style="margin-top:12px;">
              <a class="btn btn-secondary btn-big" href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.button_text || "Open YouTube")}</a>
            </div>
          </div>
        </section>
      `;
    }

    return `
      <section class="card">
        <img class="post-thumb" src="${escapeAttr(item.thumbnail_url)}" alt="${escapeAttr(item.platform)} thumbnail" />
        <div class="card-inner">
          <div class="platform">
            <div>
              <div class="pill">${escapeHtml(item.platform || "Post")}</div>
              <div class="card-title" style="margin-top:10px;">${escapeHtml(item.title || (item.platform + " Post"))}</div>
              <div class="card-sub">Tap to open the post.</div>
            </div>
          </div>
          <div style="margin-top:12px;">
            <a class="btn btn-secondary btn-big" href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.button_text || "Open Post")}</a>
          </div>
        </div>
      </section>
    `;
  }).join("");

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

  businessCard.addEventListener("click", () =>
    openWhatsAppNewTab(config.whatsapp.number, config.whatsapp.connect_message)
  );

  businessCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      openWhatsAppNewTab(config.whatsapp.number, config.whatsapp.connect_message);
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
  resultText.textContent = "Tap Spin Now to try the demo.";
  spinBtn.disabled = false;
}

function closeSpinModal() {
  spinModalBackdrop.classList.add("hidden");
  closeBottomSheet();
  leadForm.reset();
  formMsg.textContent = "";
  setLoading(false);
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

  // ✅ Pre-open a blank tab NOW (user gesture), so later we can navigate it
  // This prevents the original tab from redirecting.
  const waTab = openBlankTab();

  const honeypot = (document.getElementById("website").value || "").trim();
  if (honeypot) {
    finishWhatsApp(waTab, config.whatsapp.number, config.whatsapp.feature_message);
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

    formMsg.textContent = "Thanks! Opening WhatsApp…";
    await delay(500);

    finishWhatsApp(waTab, config.whatsapp.number, config.whatsapp.feature_message);
  } catch (err) {
    // If submit fails, close the blank tab if we opened one
    if (waTab && !waTab.closed) waTab.close();

    formMsg.textContent = err.message || "Something went wrong. Please try again.";
    setLoading(false);
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
  submitBtnText.textContent = isLoading ? "Submitting…" : "Submit";
}

/* =========================
   WhatsApp tab helpers
   ========================= */

// Opens a blank tab immediately. Might be blocked -> returns null.
function openBlankTab() {
  const win = window.open("about:blank", "_blank", "noopener,noreferrer");
  return win || null;
}

// For normal click (business card) we can directly open WhatsApp new tab
function openWhatsAppNewTab(number, message) {
  const url = makeWaUrl(number, message);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) {
    // No same-tab redirect (to avoid your issue). Show a link instead.
    showManualLink(url);
  }
}

// After async submit, navigate the already-opened tab if possible
function finishWhatsApp(waTab, number, message) {
  const url = makeWaUrl(number, message);

  if (waTab && !waTab.closed) {
    waTab.location.href = url;
    return;
  }

  // If popup blocked, show manual link button
  showManualLink(url);
}

function makeWaUrl(number, message) {
  return `https://wa.me/${encodeURIComponent(number)}?text=${encodeURIComponent(message)}`;
}

function showManualLink(url) {
  // Put a clickable link in the form message area
  formMsg.innerHTML = `Popup blocked. <a href="${escapeAttr(url)}" target="_blank" rel="noopener" style="text-decoration:underline;">Tap here to open WhatsApp</a>`;
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

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("`", "&#096;");
}

