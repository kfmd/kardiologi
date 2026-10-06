// ═══════════════════════════════════════════════════════════════
// KFMD Cardiology Apps — homepage behavior
// ═══════════════════════════════════════════════════════════════

// Optional: add your real contact email here.
// When blank, the contact form safely copies the prepared message instead.
const CONTACT_EMAIL = "dokterkhariz@gmail.com";

const APPS = [
  { id: "wiggers", url: "/cardiac-cycle", status: "live", icon: "📈", featured: true },
  { id: "ecgaxis", url: "/ecgaxistrainer", status: "live", icon: "⚡", featured: false },
  { id: "vessels", url: "/vessels", status: "beta", icon: "🩸", featured: false },
  { id: "cvguidelines", url: "/cvguidelines", status: "live", icon: "🫀", featured: false },
  { id: "cvtrials", url: "/cvtrials", status: "live", icon: "💊", featured: false },
  { id: "nodalblock", url: "/conduction-block-sim", status: "live", icon: "🔌", featured: false },
];

const PILL_ICONS = ["📱", "✅", "👆🏻", "🔄", "🆓", "💡"];
const RESOURCE_LINKS = ["#about", "#contact", "#contact", "#about"];

let currentLang = localStorage.getItem("kfmd_lang") || "id";
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
    pill: status === "live" ? "live" : status === "beta" ? "beta" : "soon",
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
  if (liveCountEl)
    liveCountEl.textContent = (t.appsCount || "{n} apps available").replace("{n}", APPS.length);
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

function stripHTML(value = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = String(value);
  return tmp.textContent || tmp.innerText || "";
}

function renderRoadmap() {
  const flow = document.getElementById("roadmapFlow");
  if (!flow) return;

  const items = Array.isArray(t.roadmapItems) ? t.roadmapItems : [];
  flow.innerHTML = "";

  items.forEach((item, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "roadmap-card";
    if (index === Math.max(0, items.length - 2)) card.classList.add("is-current");
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", [stripHTML(item.title), item.date].filter(Boolean).join(", "));
    card.innerHTML = `
      <span class="roadmap-node" aria-hidden="true"><span>${String(index + 1).padStart(2, "0")}</span></span>
      <span class="roadmap-card-copy">
        <span class="roadmap-card-title">${item.title || ""}</span>
        ${item.date ? `<span class="roadmap-card-date">${item.date}</span>` : ""}
      </span>`;

    card.addEventListener("click", () => {
      const wasActive = card.classList.contains("is-active");
      flow.querySelectorAll(".roadmap-card").forEach((node) => {
        node.classList.remove("is-active");
        node.setAttribute("aria-pressed", "false");
      });
      if (!wasActive) {
        card.classList.add("is-active");
        card.setAttribute("aria-pressed", "true");
      }
    });

    flow.appendChild(card);

    if (index < items.length - 1) {
      const connector = document.createElement("span");
      connector.className = "roadmap-connector";
      connector.setAttribute("aria-hidden", "true");
      connector.innerHTML = `<span class="roadmap-line"></span><span class="roadmap-arrow">→</span>`;
      flow.appendChild(connector);
    }
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
  // Plain translations: safe text only.
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // Trusted rich translations from the local lang/*.json files.
  // Use data-i18n-html="key" when you want tags such as <br>, <strong>, <em>, etc.
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.dataset.i18nAriaLabel;
    if (t[key] !== undefined) el.setAttribute("aria-label", stripHTML(t[key]));
  });

  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.dataset.i18nAlt;
    if (t[key] !== undefined) el.alt = stripHTML(t[key]);
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
    renderRoadmap();
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

function wireHeroMotion() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const orbs = [...hero.querySelectorAll(".hero-orb")];
  if (!orbs.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let pointer = null;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const setPointer = (clientX, clientY) => {
    pointer = { x: clientX, y: clientY };
    hero.classList.add("is-orb-reacting");
    scheduleUpdate();
  };

  const clearPointer = () => {
    pointer = null;
    hero.classList.remove("is-orb-reacting");
    scheduleUpdate();
  };

  const update = () => {
    frame = 0;

    if (reduceMotion.matches) {
      orbs.forEach((orb) => {
        orb.style.setProperty("--avoid-x", "0px");
        orb.style.setProperty("--avoid-y", "0px");
        orb.style.setProperty("--scroll-x", "0px");
        orb.style.setProperty("--scroll-y", "0px");
      });
      return;
    }

    const heroRect = hero.getBoundingClientRect();
    const scrollProgress = clamp(-heroRect.top / Math.max(heroRect.height, 1), 0, 1.15);

    orbs.forEach((orb, index) => {
      // Opposing parallax speeds make the circles separate gently as the page scrolls.
      const scrollY = (index === 0 ? 58 : -42) * scrollProgress;
      const scrollX = (index === 0 ? -14 : 18) * scrollProgress;
      orb.style.setProperty("--scroll-y", `${scrollY.toFixed(2)}px`);
      orb.style.setProperty("--scroll-x", `${scrollX.toFixed(2)}px`);

      if (!pointer) {
        orb.style.setProperty("--avoid-x", "0px");
        orb.style.setProperty("--avoid-y", "0px");
        return;
      }

      const rect = orb.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = cx - pointer.x;
      const dy = cy - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;
      const influence = index === 0 ? 340 : 290;

      if (distance >= influence) {
        orb.style.setProperty("--avoid-x", "0px");
        orb.style.setProperty("--avoid-y", "0px");
        return;
      }

      // Move away from the pointer/finger, strongest when it gets close.
      const strength = Math.pow(1 - distance / influence, 1.45);
      const maxPush = index === 0 ? 54 : 44;
      const push = strength * maxPush;
      const avoidX = (dx / distance) * push;
      const avoidY = (dy / distance) * push;

      orb.style.setProperty("--avoid-x", `${avoidX.toFixed(2)}px`);
      orb.style.setProperty("--avoid-y", `${avoidY.toFixed(2)}px`);
    });
  };

  function scheduleUpdate() {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  }

  hero.addEventListener(
    "pointermove",
    (event) => {
      // Mouse, pen and touch-capable pointer events all use the same repulsion logic.
      setPointer(event.clientX, event.clientY);
    },
    { passive: true },
  );

  hero.addEventListener("pointerleave", clearPointer, { passive: true });
  hero.addEventListener("pointercancel", clearPointer, { passive: true });

  // Some mobile browsers cancel pointer streams as soon as scrolling starts.
  // A passive touch listener keeps the avoidance effect alive without blocking scroll.
  hero.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches?.[0];
      if (touch) setPointer(touch.clientX, touch.clientY);
    },
    { passive: true },
  );
  hero.addEventListener("touchend", clearPointer, { passive: true });
  hero.addEventListener("touchcancel", clearPointer, { passive: true });

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  reduceMotion.addEventListener?.("change", scheduleUpdate);
  scheduleUpdate();
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
    ? t.contactSubmitEmail || "Send Message"
    : t.contactSubmitFallback || "Send Message";
}

function buildContactMessage(form) {
  const data = new FormData(form);
  const topicSelect = document.getElementById("contactTopic");
  const topicLabel =
    topicSelect?.selectedOptions?.[0]?.textContent?.trim() || String(data.get("topic") || "");

  return [
    `Name: ${String(data.get("name") || "").trim()}`,
    `Email: ${String(data.get("email") || "").trim()}`,
    `Topic: ${topicLabel}`,
    "",
    String(data.get("message") || "").trim(),
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
    if (status)
      status.textContent =
        t.contactSuccessEmail || "Your email app should open with the message prepared.";
    return;
  }

  try {
    await navigator.clipboard.writeText(message);
    if (status)
      status.textContent =
        t.contactSuccessCopied ||
        "Message copied. Paste it into your preferred email or messaging app.";
  } catch {
    if (status)
      status.textContent =
        t.contactCopyFailed || "Could not copy automatically. Please copy the message manually.";
  }
}

function wireSupportModal() {
  const modal = document.getElementById("supportModal");
  const openButton = document.getElementById("supportOpen");
  const closeButton = document.getElementById("supportClose");
  const doneButton = document.getElementById("supportDone");
  const image = document.getElementById("supportQrImage");
  const qrWrap = document.getElementById("supportQrWrap");
  const qrButton = document.getElementById("supportQrButton");
  const placeholder = document.getElementById("supportImagePlaceholder");
  if (!modal || !openButton) return;

  let returnFocus = null;

  const showPlaceholder = () => {
    if (qrWrap) qrWrap.hidden = true;
    if (placeholder) placeholder.hidden = false;
  };

  const showImage = () => {
    if (qrWrap) qrWrap.hidden = false;
    if (placeholder) placeholder.hidden = true;
  };

  const collapseQr = () => {
    modal.classList.remove("qr-enlarged");
    qrButton?.setAttribute("aria-pressed", "false");
  };

  const toggleQr = () => {
    const enlarged = modal.classList.toggle("qr-enlarged");
    qrButton?.setAttribute("aria-pressed", String(enlarged));
  };

  if (image) {
    image.addEventListener("load", showImage);
    image.addEventListener("error", showPlaceholder);
    if (image.complete) {
      if (image.naturalWidth > 0) showImage();
      else showPlaceholder();
    }
  }

  const openModal = () => {
    returnFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => modal.classList.add("is-open"));
    closeButton?.focus();
  };

  const closeModal = () => {
    collapseQr();
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => {
      modal.hidden = true;
      if (returnFocus instanceof HTMLElement) returnFocus.focus();
    }, 180);
  };

  openButton.addEventListener("click", openModal);
  closeButton?.addEventListener("click", closeModal);
  doneButton?.addEventListener("click", closeModal);
  qrButton?.addEventListener("click", toggleQr);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || modal.hidden) return;
    if (modal.classList.contains("qr-enlarged")) collapseQr();
    else closeModal();
  });
}

function wireInteractions() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", () => applyTranslations(button.dataset.lang || "en"));
  });

  const contactForm = document.getElementById("contactForm");
  if (contactForm) contactForm.addEventListener("submit", handleContactSubmit);

  wireContactTopicShortcuts();
  wireSupportModal();
  wireScrollSpy();
  wireHeroMotion();
}

(async function boot() {
  wireInteractions();
  await applyTranslations(currentLang);
  updateScrollState();
})();
