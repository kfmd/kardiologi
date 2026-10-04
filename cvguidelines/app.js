"use strict";

const DATA_FILE = "ESC_Guidelines_Master_2002_2026_v25_FULLY_SOURCE_VALIDATED_data.json";

const byId = (id) => document.getElementById(id);

const ui = {
  q: byId("q"),
  guideline: byId("g"),
  topic: byId("t"),
  recommendationClass: byId("c"),
  level: byId("l"),
  reset: byId("reset"),
  body: byId("body"),
  count: byId("count"),
  error: byId("load-error"),
  stats: {
    total: byId("stat-total"),
    I: byId("stat-I"),
    IIa: byId("stat-IIa"),
    IIb: byId("stat-IIb"),
    III: byId("stat-III"),
    validated: byId("stat-validated"),
    pending: byId("stat-pending")
  }
};

let recommendations = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function shortenLabel(value, maxLength) {
  const text = String(value ?? "");
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function addOptions(selectElement, values, { maxLabelLength = null } = {}) {
  const uniqueValues = [...new Set(values.filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));

  for (const value of uniqueValues) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = shortenLabel(value, maxLabelLength);
    option.title = String(value);
    selectElement.appendChild(option);
  }
}

function syncSelectTitle(selectElement) {
  selectElement.title = selectElement.value || "";
}

function populateSpecificTopics({ preserveSelection = false } = {}) {
  const previousValue = preserveSelection ? ui.topic.value : "";
  const selectedGuideline = ui.guideline.value;

  const relevantRows = selectedGuideline
    ? recommendations.filter((row) => row.guideline_topic === selectedGuideline)
    : recommendations;

  // Rebuild the dropdown from scratch while preserving its default option.
  ui.topic.innerHTML = '<option value="">All specific topics</option>';

  /*
   * Specific-topic labels can be extremely long. The full text remains the
   * option value (so filtering is exact), while the visible label is shortened.
   * This prevents native select popups from expanding to the longest option.
   */
  addOptions(ui.topic, relevantRows.map((row) => row.specific_topic), {
    maxLabelLength: 72
  });

  if (previousValue && [...ui.topic.options].some((option) => option.value === previousValue)) {
    ui.topic.value = previousValue;
  } else {
    ui.topic.value = "";
  }

  syncSelectTitle(ui.topic);
}

function populateFilters() {
  addOptions(ui.guideline, recommendations.map((row) => row.guideline_topic), {
    maxLabelLength: 58
  });

  populateSpecificTopics();
  addOptions(ui.level, recommendations.map((row) => row.level));
}

function updateStatistics() {
  const classCounts = recommendations.reduce((counts, row) => {
    counts[row.class] = (counts[row.class] || 0) + 1;
    return counts;
  }, {});

  const validatedCount = recommendations.filter((row) =>
    String(row.validation_status || "").toUpperCase().includes("VALIDATED")
  ).length;

  ui.stats.total.textContent = recommendations.length.toLocaleString();
  ui.stats.I.textContent = (classCounts.I || 0).toLocaleString();
  ui.stats.IIa.textContent = (classCounts.IIa || 0).toLocaleString();
  ui.stats.IIb.textContent = (classCounts.IIb || 0).toLocaleString();
  ui.stats.III.textContent = (classCounts.III || 0).toLocaleString();
  ui.stats.validated.textContent = validatedCount.toLocaleString();
  ui.stats.pending.textContent = (recommendations.length - validatedCount).toLocaleString();
}

function getFilteredRecommendations() {
  const searchText = ui.q.value.toLowerCase().trim();

  return recommendations.filter((row) => {
    const searchableText = [
      row.guideline_topic,
      row.guideline,
      row.specific_topic,
      row.simple,
      row.full,
      row.source_page
    ].join(" ").toLowerCase();

    return (
      (!searchText || searchableText.includes(searchText)) &&
      (!ui.guideline.value || row.guideline_topic === ui.guideline.value) &&
      (!ui.topic.value || row.specific_topic === ui.topic.value) &&
      (!ui.recommendationClass.value || row.class === ui.recommendationClass.value) &&
      (!ui.level.value || row.level === ui.level.value)
    );
  });
}

function validationLabel(row) {
  return String(row.validation_status || "").toUpperCase().includes("VALIDATED")
    ? "Validated"
    : escapeHtml(row.validation_status || "Pending");
}

function render() {
  const filtered = getFilteredRecommendations();

  ui.body.innerHTML = filtered.map((row) => `
    <tr>
      <td>${escapeHtml(row.guideline_topic)}</td>
      <td>${escapeHtml(row.specific_topic)}</td>
      <td class="cl ${escapeHtml(row.class)}">${escapeHtml(row.class)}</td>
      <td class="loe">${escapeHtml(row.level)}</td>
      <td>${escapeHtml(row.simple)}</td>
      <td>${escapeHtml(row.full)}</td>
      <td class="source">${escapeHtml(row.source_page)}</td>
      <td class="ok">${validationLabel(row)}</td>
    </tr>
  `).join("");

  ui.count.textContent = `${filtered.length.toLocaleString()} / ${recommendations.length.toLocaleString()} rows`;
}

function resetFilters() {
  ui.q.value = "";
  ui.guideline.value = "";
  ui.recommendationClass.value = "";
  ui.level.value = "";

  // Clearing the main topic restores the complete Specific Topic list.
  populateSpecificTopics();

  [ui.guideline, ui.topic, ui.recommendationClass, ui.level].forEach(syncSelectTitle);
  render();
}

function attachEvents() {
  ui.q.addEventListener("input", render);

  // Specific Topic is a cascading filter: its options depend on Main/Guideline Topic.
  ui.guideline.addEventListener("change", () => {
    syncSelectTitle(ui.guideline);
    populateSpecificTopics();
    render();
  });

  [ui.topic, ui.recommendationClass, ui.level].forEach((selectElement) => {
    selectElement.addEventListener("change", () => {
      syncSelectTitle(selectElement);
      render();
    });
  });

  ui.reset.addEventListener("click", resetFilters);
}

function showLoadError(error) {
  console.error(error);
  ui.error.hidden = false;

  const fileProtocolHelp = location.protocol === "file:"
    ? `<br><br><b>Local-file note:</b> modern browsers normally block JavaScript from fetching a sibling JSON file when an HTML file is opened directly with <code>file://</code>. Start a small local web server in this folder, for example <code>python3 -m http.server 8000</code>, then open <code>http://localhost:8000/</code>.`
    : "";

  ui.error.innerHTML = `
    <b>Could not load recommendation data.</b><br>
    Expected file: <code>${escapeHtml(DATA_FILE)}</code>
    ${fileProtocolHelp}
  `;
  ui.count.textContent = "Data could not be loaded.";
}

async function loadData() {
  const response = await fetch(DATA_FILE, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${DATA_FILE}: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.class_based_recommendations)) {
    throw new Error("JSON does not contain a class_based_recommendations array.");
  }

  recommendations = data.class_based_recommendations;
}

async function init() {
  try {
    await loadData();
    updateStatistics();
    populateFilters();
    attachEvents();
    render();
  } catch (error) {
    showLoadError(error);
  }
}

init();
