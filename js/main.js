// ═══════════════════════════════════════════════════════════════
// KFMD Cardiology Apps — homepage behavior
// ═══════════════════════════════════════════════════════════════

// Optional: add your real contact email here.
// When blank, the contact form safely copies the prepared message instead.
const CONTACT_EMAIL = "";

const APPS = [
  { id: "wiggers",      url: "/cardiac-cycle",         status: "live", icon: "📈", featured: true  },
  { id: "ecgaxis",      url: "/ecgaxistrainer",       status: "live", icon: "⚡", featured: false },
  { id: "vessels",      url: "/vessels",              status: "beta", icon: "🩸", featured: false },
  { id: "cvguidelines", url: "/cvguidelines",         status: "live", icon: "🫀", featured: false },
  { id: "nodalblock",   url: "/conduction-block-sim", status: "live", icon: "🔌", featured: false }
];

const PILL_ICONS = ["📱", "🔬", "🎓", "🔄", "🆓", "💡"];
const RESOURCE_LINKS = ["#about", "#contact", "#contact", "#about"];
const HTML_KEYS = new Set(["heroTitle", "footerDesc", "footerCopy"]);

let currentLang = localStorage.getItem("kfmd_lang") || "en";
let t = {};

async function loadLang(lang) {
  const res = await fetch(`lang/${lang}.json`);
  if (!res.ok) throw new Error(`Cannot load lang/${lang}.json`);
  return res.json();
}

function statusBadge(status) {
  const suffix = status.charAt(0).toUpperCase() + status.slice(1);
  return {
    dot: `status-${status === "soon" ? "soon" : status}`,
    label: t[`status${suffix}`] || status,
    pill: status === "live" ? "live" : status === "beta" ? "beta" : "soon"
  };
}

function renderApps() {
  const grid = document.getElementById("appsGrid");
  const footerApps = document.getElementById("footerAppLinks");
  const preview = document.getElementById("heroPreviewRows");
  if (!grid || !footerApps || !preview) return;

  grid.innerHTML = "";
  footerApps.innerHTML = "";
  preview.innerHTML = "";

  let liveCount = 0;

  APPS.forEach((app) => {
    const tr = (t.apps && t.apps[app.id]) || {};
    const title = tr.title || app.id;
    const desc = tr.desc || "";
    const category = tr.category || "";
    const tag = tr.tag || "";
    const st = statusBadge(app.status);

    if (app.status === "live") liveCount += 1;

    const card = document.createElement(app.status === "soon" ? "article" : "a");
    card.className = `app-card${app.featured ? " featured" : ""}`;

    if (app.status !== "soon") {
      card.href = app.url;
      card.setAttribute("aria-label", `${title} — ${st.label}`);
    }

    card.innerHTML = `
      <div class="card-img">
        ${app.featured ? `<span class="card-new-pill">${t.featuredLabel || "Featured"}</span>` : ""}
        <span class="card-emoji" aria-hidden="true">${app.icon}</span>
      </div>
      <div class="card-body">
        <div class="card-category">${category}</div>
        <div class="card-title">${title}</div>
        <div class="card-desc">${desc}</div>
        <div class="card-footer-row">
          <div class="card-meta">
            <span class="card-tag">${tag}</span>
            <span class="card-status"><span class="status-dot ${st.dot}"></span>${st.label}</span>
          </div>
          <span class="card-arrow-btn" aria-hidden="true">→</span>
        </div>
      </div>`;

    grid.appendChild(card);

    const row = document.createElement("div");
    row.className = "hcp-row";
    row.innerHTML = `
      <div class="hcp-icon" aria-hidden="true">${app.icon}</div>
      <div>
        <div class="hcp-name">${title}</div>
        <div class="hcp-sub">${category}</div>
      </div>
      <span class="hcp-badge ${st.pill}">${st.label}</span>`;
    preview.appendChild(row);

    if (app.status !== "soon") {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${app.url}">${title}</a>`;
      footerApps.appendChild(li);
    }
  });

  const appCount = document.getElementById("appCount");
  const liveCountEl = document.getElementById("liveCount");
  if (appCount) appCount.textContent = String(liveCount);
  if (liveCountEl) liveCountEl.textContent = (t.appsCount || "{n} apps available").replace("{n}", APPS.length);
}

function renderFeatureGrid() {
  const grid = document.getElementById("featureGrid");
  if (!grid) return;
  grid.innerHTML = "";

  (t.pills || []).forEach((label, index) => {
    const item = document.createElement("div");
    item.className = "feature-item";
    item.innerHTML = `
      <div class="feature-icon" aria-hidden="true">${PILL_ICONS[index] || "•"}</div>
      <div class="feature-label">${label}</div>`;
    grid.appendChild(item);
  });
}

function renderFooterResources() {
  const ul = document.getElementById("footerResourceLinks");
  if (!ul) return;
  ul.innerHTML = "";

  (t.footerLinks || []).forEach((label, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${RESOURCE_LINKS[index] || "#contact"}">${label}</a>`;
    ul.appendChild(li);
  });
}

function applyStaticStrings() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] === undefined) return;
    if (HTML_KEYS.has(key)) el.innerHTML = t[key];
    else el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  updateContactSubmitLabel();
}

function updateLanguageButtons(lang) {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle("lang-btn--active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
}

async function applyTranslations(lang) {
  try {
    currentLang = lang;
    localStorage.setItem("kfmd_lang", lang);
    document.documentElement.lang = lang;
    t = await loadLang(lang);
    applyStaticStrings();
    renderApps();
    renderFeatureGrid();
    renderFooterResources();
    updateLanguageButtons(lang);
  } catch (error) {
    console.error(error);
  }
}

function setActiveSection(sectionId) {
  document.querySelectorAll("[data-section-link]").forEach((link) => {
    const active = link.dataset.sectionLink === sectionId;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function updateScrollState() {
  const nav = document.getElementById("topNav");
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 10);

  const sections = [...document.querySelectorAll("[data-nav-section]")];
  if (!sections.length) return;

  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12) {
    setActiveSection("contact");
    return;
  }

  const navHeight = nav ? nav.offsetHeight : 80;
  const marker = window.scrollY + navHeight + Math.min(180, window.innerHeight * 0.28);
  let active = "apps";

  sections.forEach((section) => {
    if (section.offsetTop <= marker) active = section.dataset.navSection;
  });

  setActiveSection(active);
}

function wireScrollSpy() {
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateScrollState();
      ticking = false;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateScrollState();
}

function wireContactTopicShortcuts() {
  const topicSelect = document.getElementById("contactTopic");
  const message = document.getElementById("contactMessage");

  document.querySelectorAll("[data-contact-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      if (topicSelect) topicSelect.value = button.dataset.contactTopic || "";
      if (message) message.focus({ preventScroll: false });
    });
  });
}

function updateContactSubmitLabel() {
  const label = document.querySelector("[data-contact-submit-label]");
  if (!label) return;
  label.textContent = CONTACT_EMAIL
    ? (t.contactSubmitEmail || "Send email")
    : (t.contactSubmitFallback || "Copy message");
}

function buildContactMessage(form) {
  const data = new FormData(form);
  const topicSelect = document.getElementById("contactTopic");
  const topicLabel = topicSelect?.selectedOptions?.[0]?.textContent?.trim() || String(data.get("topic") || "");

  return [
    `Name: ${String(data.get("name") || "").trim()}`,
    `Email: ${String(data.get("email") || "").trim()}`,
    `Topic: ${topicLabel}`,
    "",
    String(data.get("message") || "").trim()
  ].join("\n");
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const status = document.getElementById("formStatus");
  const data = new FormData(form);
  const topic = String(data.get("topic") || "Contact");
  const message = buildContactMessage(form);

  if (CONTACT_EMAIL) {
    const subject = encodeURIComponent(`KFMD Cardiology Apps — ${topic}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    if (status) status.textContent = t.contactSuccessEmail || "Your email app should open with the message prepared.";
    return;
  }

  try {
    await navigator.clipboard.writeText(message);
    if (status) status.textContent = t.contactSuccessCopied || "Message copied. Paste it into your preferred email or messaging app.";
  } catch {
    if (status) status.textContent = t.contactCopyFailed || "Could not copy automatically. Please copy the message manually.";
  }
}

function wireInteractions() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => applyTranslations(button.dataset.lang || "en"));
  });

  const contactForm = document.getElementById("contactForm");
  if (contactForm) contactForm.addEventListener("submit", handleContactSubmit);

  wireContactTopicShortcuts();
  wireScrollSpy();
}

(async function boot() {
  wireInteractions();
  await applyTranslations(currentLang);
  updateScrollState();
})();
