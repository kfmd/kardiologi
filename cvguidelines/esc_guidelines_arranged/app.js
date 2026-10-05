"use strict";

const DATA_FILE = "ESC_Guidelines_Master_2002_2026_v25_FULLY_SOURCE_VALIDATED_data.json";
const COLUMN_STORAGE_KEY = "esc-guidelines-v25-table-columns";

const COLUMN_DEFINITIONS = [
  { key: "guideline", label: "Guideline", minWidth: 180 },
  { key: "specific_topic", label: "Specific Topic", minWidth: 260 },
  { key: "class", label: "Class", minWidth: 90 },
  { key: "level", label: "Level", minWidth: 90 },
  { key: "simple", label: "Simplified Recommendation", minWidth: 360 },
  { key: "full", label: "Full Recommendation", minWidth: 480 },
  { key: "source", label: "Source Page", minWidth: 160 },
  { key: "validation", label: "Validation", minWidth: 130 }
];

const DEFAULT_COLUMN_ORDER = COLUMN_DEFINITIONS.map((column) => column.key);
const DEFAULT_VISIBLE_COLUMNS = new Set(DEFAULT_COLUMN_ORDER);

const byId = (id) => document.getElementById(id);

const ui = {
  q: byId("q"),
  guideline: byId("g"),
  topic: byId("t"),
  recommendationClass: byId("c"),
  level: byId("l"),
  reset: byId("reset"),
  body: byId("body"),
  headRow: byId("head-row"),
  table: byId("recommendation-table"),
  count: byId("count"),
  error: byId("load-error"),
  columnsToggle: byId("columns-toggle"),
  columnConfig: byId("column-config"),
  columnList: byId("column-list"),
  columnsReset: byId("columns-reset"),
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
let columnOrder = [...DEFAULT_COLUMN_ORDER];
let visibleColumns = new Set(DEFAULT_VISIBLE_COLUMNS);
let draggedColumnKey = null;

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

function sortedUnique(values) {
  return [...new Set(values.filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
}

function replaceOptions(selectElement, values, firstLabel, { maxLabelLength = null } = {}) {
  const currentValue = selectElement.value;
  selectElement.innerHTML = "";

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = firstLabel;
  selectElement.appendChild(firstOption);

  for (const value of sortedUnique(values)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = shortenLabel(value, maxLabelLength);
    option.title = String(value);
    selectElement.appendChild(option);
  }

  if ([...selectElement.options].some((option) => option.value === currentValue)) {
    selectElement.value = currentValue;
  }
}

function syncSelectTitle(selectElement) {
  selectElement.title = selectElement.value || "";
}

function populateSpecificTopics(guidelineTopic = "") {
  const sourceRows = guidelineTopic
    ? recommendations.filter((row) => row.guideline_topic === guidelineTopic)
    : recommendations;

  replaceOptions(
    ui.topic,
    sourceRows.map((row) => row.specific_topic),
    "All specific topics",
    { maxLabelLength: 72 }
  );
  syncSelectTitle(ui.topic);
}

function populateFilters() {
  replaceOptions(
    ui.guideline,
    recommendations.map((row) => row.guideline_topic),
    "All guideline topics",
    { maxLabelLength: 58 }
  );

  populateSpecificTopics();

  replaceOptions(
    ui.level,
    recommendations.map((row) => row.level),
    "All evidence levels"
  );
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

function getColumnDefinition(key) {
  return COLUMN_DEFINITIONS.find((column) => column.key === key);
}

function loadColumnSettings() {
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);
    const validKeys = new Set(DEFAULT_COLUMN_ORDER);

    if (Array.isArray(saved.order)) {
      const validSavedOrder = saved.order.filter((key) => validKeys.has(key));
      const missingKeys = DEFAULT_COLUMN_ORDER.filter((key) => !validSavedOrder.includes(key));
      columnOrder = [...validSavedOrder, ...missingKeys];
    }

    if (Array.isArray(saved.visible)) {
      const validVisible = saved.visible.filter((key) => validKeys.has(key));
      if (validVisible.length > 0) {
        visibleColumns = new Set(validVisible);
      }
    }
  } catch (error) {
    console.warn("Could not load locally saved column settings.", error);
  }
}

function saveColumnSettings() {
  try {
    localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify({
      order: columnOrder,
      visible: columnOrder.filter((key) => visibleColumns.has(key))
    }));
  } catch (error) {
    console.warn("Could not save column settings locally.", error);
  }
}

function resetColumnSettings() {
  columnOrder = [...DEFAULT_COLUMN_ORDER];
  visibleColumns = new Set(DEFAULT_VISIBLE_COLUMNS);
  saveColumnSettings();
  renderColumnConfigurator();
  render();
}

function moveColumn(key, direction) {
  const index = columnOrder.indexOf(key);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= columnOrder.length) return;

  [columnOrder[index], columnOrder[targetIndex]] = [columnOrder[targetIndex], columnOrder[index]];
  saveColumnSettings();
  renderColumnConfigurator();
  render();
}

function reorderColumn(draggedKey, targetKey) {
  if (!draggedKey || !targetKey || draggedKey === targetKey) return;

  const nextOrder = columnOrder.filter((key) => key !== draggedKey);
  const targetIndex = nextOrder.indexOf(targetKey);
  if (targetIndex < 0) return;

  nextOrder.splice(targetIndex, 0, draggedKey);
  columnOrder = nextOrder;
  saveColumnSettings();
  renderColumnConfigurator();
  render();
}

function renderColumnConfigurator() {
  const visibleCount = visibleColumns.size;

  ui.columnList.innerHTML = columnOrder.map((key, index) => {
    const column = getColumnDefinition(key);
    const isVisible = visibleColumns.has(key);
    const disableVisibilityToggle = isVisible && visibleCount === 1;

    return `
      <div class="column-option" draggable="true" data-column-key="${escapeHtml(key)}">
        <span class="drag-handle" aria-hidden="true">⋮⋮</span>
        <label class="column-visibility">
          <input type="checkbox" data-column-visibility="${escapeHtml(key)}" ${isVisible ? "checked" : ""} ${disableVisibilityToggle ? "disabled" : ""}>
          <span>${escapeHtml(column.label)}</span>
        </label>
        <div class="column-move-buttons" aria-label="Move ${escapeHtml(column.label)}">
          <button type="button" data-column-move="up" data-column-key="${escapeHtml(key)}" ${index === 0 ? "disabled" : ""} aria-label="Move ${escapeHtml(column.label)} up">↑</button>
          <button type="button" data-column-move="down" data-column-key="${escapeHtml(key)}" ${index === columnOrder.length - 1 ? "disabled" : ""} aria-label="Move ${escapeHtml(column.label)} down">↓</button>
        </div>
      </div>
    `;
  }).join("");
}

function getVisibleOrderedColumns() {
  return columnOrder
    .filter((key) => visibleColumns.has(key))
    .map(getColumnDefinition)
    .filter(Boolean);
}

function tableCellForColumn(row, key) {
  switch (key) {
    case "guideline":
      return `<td>${escapeHtml(row.guideline_topic)}</td>`;
    case "specific_topic":
      return `<td>${escapeHtml(row.specific_topic)}</td>`;
    case "class":
      return `<td class="cl ${escapeHtml(row.class)}">${escapeHtml(row.class)}</td>`;
    case "level":
      return `<td class="loe">${escapeHtml(row.level)}</td>`;
    case "simple":
      return `<td>${escapeHtml(row.simple)}</td>`;
    case "full":
      return `<td>${escapeHtml(row.full)}</td>`;
    case "source":
      return `<td class="source">${escapeHtml(row.source_page)}</td>`;
    case "validation": {
      const isValidated = String(row.validation_status || "").toUpperCase().includes("VALIDATED");
      return `<td class="${isValidated ? "ok" : ""}">${isValidated ? "Validated" : escapeHtml(row.validation_status || "Pending")}</td>`;
    }
    default:
      return "";
  }
}

function renderTableHeader(columns) {
  ui.headRow.innerHTML = columns
    .map((column) => `<th data-column-key="${escapeHtml(column.key)}">${escapeHtml(column.label)}</th>`)
    .join("");

  const minimumWidth = Math.max(
    720,
    columns.reduce((total, column) => total + column.minWidth, 0)
  );
  ui.table.style.minWidth = `${minimumWidth}px`;
}

function render() {
  const filtered = getFilteredRecommendations();
  const columns = getVisibleOrderedColumns();

  renderTableHeader(columns);

  ui.body.innerHTML = filtered.map((row) => `
    <tr>
      ${columns.map((column) => tableCellForColumn(row, column.key)).join("")}
    </tr>
  `).join("");

  ui.count.textContent = `${filtered.length.toLocaleString()} / ${recommendations.length.toLocaleString()} rows · ${columns.length} columns`;
}

function resetFilters() {
  ui.q.value = "";
  ui.guideline.value = "";
  ui.recommendationClass.value = "";
  ui.level.value = "";
  populateSpecificTopics();
  ui.topic.value = "";

  [ui.guideline, ui.topic, ui.recommendationClass, ui.level].forEach(syncSelectTitle);
  render();
}

function toggleColumnConfig() {
  const willOpen = ui.columnConfig.hidden;
  ui.columnConfig.hidden = !willOpen;
  ui.columnsToggle.setAttribute("aria-expanded", String(willOpen));
}

function attachColumnEvents() {
  ui.columnsToggle.addEventListener("click", toggleColumnConfig);
  ui.columnsReset.addEventListener("click", resetColumnSettings);

  ui.columnList.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-column-visibility]");
    if (!checkbox) return;

    const key = checkbox.dataset.columnVisibility;
    if (checkbox.checked) {
      visibleColumns.add(key);
    } else if (visibleColumns.size > 1) {
      visibleColumns.delete(key);
    } else {
      checkbox.checked = true;
      return;
    }

    saveColumnSettings();
    renderColumnConfigurator();
    render();
  });

  ui.columnList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-column-move]");
    if (!button) return;

    moveColumn(button.dataset.columnKey, button.dataset.columnMove === "up" ? -1 : 1);
  });

  ui.columnList.addEventListener("dragstart", (event) => {
    const row = event.target.closest(".column-option");
    if (!row) return;

    draggedColumnKey = row.dataset.columnKey;
    row.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedColumnKey);
    }
  });

  ui.columnList.addEventListener("dragend", (event) => {
    const row = event.target.closest(".column-option");
    if (row) row.classList.remove("is-dragging");
    draggedColumnKey = null;
    ui.columnList.querySelectorAll(".drag-over").forEach((item) => item.classList.remove("drag-over"));
  });

  ui.columnList.addEventListener("dragover", (event) => {
    const row = event.target.closest(".column-option");
    if (!row || row.dataset.columnKey === draggedColumnKey) return;

    event.preventDefault();
    ui.columnList.querySelectorAll(".drag-over").forEach((item) => item.classList.remove("drag-over"));
    row.classList.add("drag-over");
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  });

  ui.columnList.addEventListener("dragleave", (event) => {
    const row = event.target.closest(".column-option");
    if (row) row.classList.remove("drag-over");
  });

  ui.columnList.addEventListener("drop", (event) => {
    const row = event.target.closest(".column-option");
    if (!row) return;

    event.preventDefault();
    row.classList.remove("drag-over");
    const draggedKey = draggedColumnKey || event.dataTransfer?.getData("text/plain");
    reorderColumn(draggedKey, row.dataset.columnKey);
    draggedColumnKey = null;
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !ui.columnConfig.hidden) {
      ui.columnConfig.hidden = true;
      ui.columnsToggle.setAttribute("aria-expanded", "false");
      ui.columnsToggle.focus();
    }
  });
}

function attachEvents() {
  ui.q.addEventListener("input", render);

  ui.guideline.addEventListener("change", () => {
    syncSelectTitle(ui.guideline);
    ui.topic.value = "";
    populateSpecificTopics(ui.guideline.value);
    render();
  });

  [ui.topic, ui.recommendationClass, ui.level].forEach((selectElement) => {
    selectElement.addEventListener("change", () => {
      syncSelectTitle(selectElement);
      render();
    });
  });

  ui.reset.addEventListener("click", resetFilters);
  attachColumnEvents();
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
    loadColumnSettings();
    renderColumnConfigurator();
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
