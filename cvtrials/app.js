let DATA = [];

const state = {
  search: "",
  domain: "All disease entities",
  design: "All evidence types",
  year: "all",
  sortKey: "year",
  ascending: true
};

const tbody = document.getElementById("tbody");
const empty = document.getElementById("empty");
const visibleCount = document.getElementById("visibleCount");
const sortState = document.getElementById("sortState");
const search = document.getElementById("search");
const domain = document.getElementById("domain");
const design = document.getElementById("design");
const year = document.getElementById("year");

function matchesYear(y, bucket) {
  if (bucket === "all") return true;
  const [a,b] = bucket.split("-").map(Number);
  return y >= a && y <= b;
}

function inferDesignClass(designText) {
  const d = designText.toLowerCase();
  if (d.includes("case-control")) return "Case-control";
  if (d.includes("cohort")) return "Cohort";
  if (d.includes("random")) return "Randomized";
  return "Other";
}

function filtered() {
  const q = state.search.trim().toLowerCase();

  let items = DATA.filter(r => {
    const haystack = [r.study, r.domain, r.design, r.comparison, r.finding, r.year].join(" ").toLowerCase();
    const qOK = !q || haystack.includes(q);
    const dOK = state.domain === "All disease entities" || r.domain === state.domain;
    const eOK = state.design === "All evidence types" || inferDesignClass(r.design) === state.design;
    const yOK = matchesYear(r.year, state.year);
    return qOK && dOK && eOK && yOK;
  });

  items.sort((a,b) => {
    let av = a[state.sortKey], bv = b[state.sortKey];
    if (state.sortKey === "year") {
      av = Number(av); bv = Number(bv);
    } else {
      av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
    }
    if (av < bv) return state.ascending ? -1 : 1;
    if (av > bv) return state.ascending ? 1 : -1;
    return 0;
  });

  return items;
}

function render() {
  const items = filtered();
  visibleCount.textContent = items.length;
  sortState.textContent = `Sorted by ${state.sortKey} ${state.ascending ? "↑" : "↓"}`;

  tbody.innerHTML = items.map(r => `
    <tr>
      <td class="year">${r.year}</td>
      <td class="study">${escapeHTML(r.study)}</td>
      <td class="domain">${escapeHTML(r.domain)}</td>
      <td class="design">${escapeHTML(r.design)}</td>
      <td>${escapeHTML(r.comparison)}</td>
      <td class="finding">${escapeHTML(r.finding)}</td>
    </tr>
  `).join("");

  empty.hidden = items.length !== 0;

  document.querySelectorAll("button.sort").forEach(btn => {
    const key = btn.dataset.key;
    btn.textContent = key === state.sortKey
      ? `${key === "year" ? "Year" : "Study"} ${state.ascending ? "↑" : "↓"}`
      : `${key === "year" ? "Year" : "Study"} ↕`;
  });
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  })[ch]);
}

search.addEventListener("input", e => { state.search = e.target.value; render(); });
domain.addEventListener("change", e => { state.domain = e.target.value; render(); });
design.addEventListener("change", e => { state.design = e.target.value; render(); });
year.addEventListener("change", e => { state.year = e.target.value; render(); });

document.querySelectorAll("button.sort").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.key;
    if (state.sortKey === key) state.ascending = !state.ascending;
    else { state.sortKey = key; state.ascending = true; }
    render();
  });
});

document.getElementById("toggleOrder").addEventListener("click", e => {
  state.sortKey = "year";
  state.ascending = !state.ascending;
  e.target.textContent = state.ascending ? "Newest first" : "Oldest first";
  render();
});

document.getElementById("reset").addEventListener("click", () => {
  state.search = "";
  state.domain = "All disease entities";
  state.design = "All evidence types";
  state.year = "all";
  state.sortKey = "year";
  state.ascending = true;
  search.value = "";
  domain.value = "All disease entities";
  design.value = "All evidence types";
  year.value = "all";
  document.getElementById("toggleOrder").textContent = "Newest first";
  render();
});

async function init() {
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    DATA = await response.json();
    render();
  } catch (error) {
    console.error("Failed to load data.json:", error);
    tbody.innerHTML = "";
    empty.hidden = false;
    empty.textContent = "Unable to load data.json. Run this folder through a local web server.";
  }
}

init();
