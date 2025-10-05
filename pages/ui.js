// Konstanten
const DISPLAY_KEY = "filterAreaDisplay"; // Speicher-Schlüssel
let globalPrompts = []; // Globale Variable für Prompts
let globalRows = []; // Globale Variable für DOM Rows

// DOM-Elemente
const filterStat = document.getElementById("toggleFilterBtn");
const filterArea = document.getElementById("filter-container");
const searchInput = document.getElementById("search-input"); // Assuming ID for search input
let folderSearchInput = document.getElementById("folder-search"); // Assuming ID for folder search

/* ------------------------------------------------------------------ */
/* 1) BEIM LADEN: gespeicherten Status holen und anwenden             */
/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  // Wert aus storage lesen (default: 'none')
  const { [DISPLAY_KEY]: saved = "none" } = await chrome.storage.local.get(
    DISPLAY_KEY
  );

  filterArea.style.display = saved;
  initializePrompts(); // Initialisierung der Prompts
});

/* ------------------------------------------------------------------ */
/* 2) BEIM KLICK: Status umschalten und speichern                     */
/* ------------------------------------------------------------------ */
filterStat.addEventListener("click", async () => {
  const hidden =
    filterArea.style.display === "none" || !filterArea.style.display;
  const newDisplay = hidden ? "flex" : "none";

  filterArea.style.display = newDisplay;
  await chrome.storage.local.set({ [DISPLAY_KEY]: newDisplay });

  if (newDisplay === "flex") {
    loadTagsFilter(); // Tags-Filter laden
    loadTypesFilter(); // Types-Filter laden
  }
});

// Set initial visibility to flex to ensure tags are visible
filterArea.style.display = "flex";

// Filter search functionality for goals
function filterGoals() {
  const folderList = document.querySelector(".folder-list");
  const goalsList = document.querySelector(".table-container tbody");
  const filter = searchInput.value.toLowerCase().trim();
  const rows = Array.from(goalsList.getElementsByTagName("tr"));
  const folders = Array.from(folderList.getElementsByTagName("li"));
  const accordionItems = document.querySelectorAll(".accordion-content li");
  const categories = Array.from(accordionItems);

  if (!filter) {
    rows.forEach((row) => {
      row.style.display = "";
      row.classList.remove("highlight");
    });
    folders.forEach((folder) => {
      folder.style.display = "";
      folder.classList.remove("highlight");
    });
    categories.forEach((category) => {
      category.style.display = "";
      category.classList.remove("highlight");
    });
    rows.forEach((row) => goalsList.appendChild(row));
    folders.forEach((folder) => folderList.appendChild(folder));
    return;
  }

  // Score prompts based on both title and content
  const scoredRows = rows.map((row) => {
    const titleCell = row.getElementsByTagName("td")[1]; // Title column
    const contentCell = row.getElementsByTagName("td")[2]; // Type column (assuming content is in type for search)
    if (!titleCell || !contentCell)
      return { item: row, distance: Infinity, type: "prompt" };

    const combinedText =
      `${titleCell.textContent} ${contentCell.textContent}`.toLowerCase();
    const distance = levenshteinDistance(combinedText, filter);

    return { item: row, distance, type: "prompt" };
  });

  const scoredFolders = folders.map((folder) => {
    const folderText = folder.textContent
      .toLowerCase()
      .replace("📁", "")
      .trim()
      .split(" ")[0];
    const distance = levenshteinDistance(folderText, filter);
    return { item: folder, distance, type: "folder" };
  });

  const scoredCategories = categories.map((category) => {
    const categoryText = category.textContent.toLowerCase().trim();
    const distance = leveshteinDistance(categoryText, filter);
    return { item: category, distance, type: "category" };
  });

  const allScoredItems = [
    ...scoredRows,
    ...scoredFolders,
    ...scoredCategories,
  ].sort((a, b) => a.distance - b.distance);

  rows.forEach((row) => (row.style.display = "none"));
  folders.forEach((folder) => (folder.style.display = "none"));
  categories.forEach((category) => (category.style.display = "none"));

  allScoredItems.forEach(({ item, distance, type }, index) => {
    item.style.display = "";
    if (index < 3 && distance !== Infinity) {
      item.classList.add("highlight");
    } else {
      item.classList.remove("highlight");
    }

    if (type === "prompt") {
      goalsList.appendChild(item);
    } else if (type === "folder") {
      folderList.appendChild(item);
    } else if (type === "category") {
      item.parentElement.appendChild(item);
    }
  });

  folderSearchInput.style.display =
    folderList.children.length > 5 ? "block" : "none";
}

// Filter folders
function filterFolders() {
  const folderList = document.querySelector(".folder-list");
  const filter = folderSearchInput.value.toLowerCase().trim();
  const folders = Array.from(folderList.querySelectorAll("li.folder-item"));

  if (!filter) {
    folders.forEach((folder) => {
      folder.style.display = "";
      folder.classList.remove("highlight");
    });
    folders.forEach((folder) => folderList.appendChild(folder));
    return;
  }

  const scoredFolders = folders.map((folder) => {
    const folderText = folder.getAttribute("data-folder").toLowerCase().trim();
    const distance = levenshteinDistance(folderText, filter);
    return { item: folder, distance };
  });

  scoredFolders.sort((a, b) => a.distance - b.distance);

  folders.forEach((folder) => (folder.style.display = "none"));

  scoredFolders.forEach(({ item, distance }, index) => {
    item.style.display = "";
    if (index < 3 && distance !== Infinity) {
      item.classList.add("highlight");
    } else {
      item.classList.remove("highlight");
    }
    folderList.appendChild(item);
  });
}

// Hilfsfunktionen für Sparkline
function getUsageLast7Days(usageHistory = []) {
  const now = Date.now();
  const days = Array(7).fill(0);

  usageHistory.forEach((entry) => {
    const ts = entry.timestamp; // Access the timestamp property
    const diffDays = Math.floor((now - ts) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      days[6 - diffDays]++;
    }
  });

  return days; // e.g., [0, 2, 3, 1, 5, 2, 0]
}

function getTrendColor(usage7d) {
  if (!usage7d.some((val) => val > 0)) return "gray";
  const trend = usage7d.reduce((sum, val, i) => sum + val * i, 0);
  return trend >= 0 ? "green" : "red";
}

function renderSparkline(usage7d, color) {
  if (!usage7d.some((val) => val > 0)) {
    return `<span>No usage data</span>`;
  }
  const max = Math.max(...usage7d, 1);
  const points = usage7d.map((val, i) => ({
    x: (i / (usage7d.length - 1)) * 100,
    y: 100 - (val / max) * 100,
  }));

  // Generate Bezier curve path
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
  }

  return `
    <svg viewBox="0 0 100 100" width="80" height="30" preserveAspectRatio="none">
      <path fill="none" stroke="${color}" stroke-width="2" d="${path}" />
    </svg>`;
}

function renderPPSScore(usage7d) {
  if (!usage7d || usage7d.length < 2) {
    return `<span>N/A</span>`;
  }

  const prev = usage7d[usage7d.length - 2];
  const curr = usage7d[usage7d.length - 1];

  if (prev === 0 && curr === 0) {
    return `<span>0%</span>`;
  }

  // Logarithmische Skalierung (z. B. log(1 + x) um Null zu vermeiden)
  const logPrev = Math.log1p(prev); // log1p(x) = log(1 + x)
  const logCurr = Math.log1p(curr);
  const diff = logCurr - logPrev;
  const percentChange = ((diff / (logPrev || 0.1)) * 100).toFixed(1);

  if (diff > 0) {
    return `<span style="color: green;">+${percentChange}% ▲</span>`;
  } else if (diff < 0) {
    return `<span style="color: red;">${percentChange}% ▼</span>`;
  } else {
    return `<span>0% ➝</span>`;
  }
}

// Responsible for initial table rendering
function renderPrompts(prompts) {
  const tbody = document.querySelector(".table-container tbody");
  const table = document.querySelector(".table-container");
  globalPrompts = prompts; // Update globalPrompts
  globalRows = []; // Reset globalRows
  tbody.innerHTML = ""; // Clear table only on initial render

  // Render der Prompts
  prompts.forEach((prompt, index) => {
    const row = document.createElement("tr");
    row.dataset.index = index;
    row.dataset.promptId = prompt.id || index;

    // Daten für Sparkline berechnen
    const usage7d = getUsageLast7Days(prompt.usageHistory || []);
    const trendColor = getTrendColor(usage7d);
    const sparkline = renderSparkline(usage7d, trendColor);
    const ppsScore = renderPPSScore(usage7d);

    row.innerHTML = `
    <td><input type="checkbox" id="prompt-checkbox-${
      prompt.id || index
    }" name="prompt-checkbox" /></td>
    <td>${prompt.title || "N/A"}</td>
    <td>${
      Array.isArray(prompt.types)
        ? prompt.types.join(", ")
        : prompt.types || "N/A"
    }</td>
    <td>${
      Array.isArray(prompt.compatibleModels)
        ? prompt.compatibleModels.join(", ")
        : prompt.compatibleModels || ""
    }</td>
    <td>${
      Array.isArray(prompt.incompatibleModels)
        ? prompt.incompatibleModels.join(", ")
        : prompt.incompatibleModels || "N/A"
    }</td>
    <td>${
      Array.isArray(prompt.tags) ? prompt.tags.join(", ") : prompt.tags || ""
    }</td>
    <td>${prompt.folderName || ""}</td>
    <td>${ppsScore}</td> <!-- Für den Prompt Performance Score -->
    <td>${sparkline}</td> <!-- Neue Spalte -->
    <td>${
      prompt.lastUsed
        ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
        : "N/A"
    }</td>
    <td>${
      prompt.createdAt
        ? new Date(prompt.createdAt).toLocaleDateString("de-DE")
        : "N/A"
    }</td>
    <td>
      <div class="prompt-actions">
        <button class="action-btn menu-btn" aria-label="Prompt actions">...</button>
        <div class="dropdown-menu">
          ${
            prompt.type === "Workflow"
              ? `
              <div class="dropdown-item" data-action="execute-workflow">Execute Workflow</div>
              <div class="dropdown-item" data-action="copy-workflow">Copy Workflow</div>
              <div class="dropdown-item" data-action="export-workflow">Export Workflow</div>
              <div class="dropdown-item" data-action="delete-workflow">Delete Workflow</div>
              <div class="dropdown-item" data-action="rename-workflow">Rename Workflow</div>
              `
              : `
              <div class="dropdown-item" data-action="copy">Copy Prompt</div>
              <div class="dropdown-item" data-action="export">Export Prompt</div>
              <div class="dropdown-item" data-action="${
                prompt.isTrash ? "remove-from-trash" : "trash"
              }">${prompt.isTrash ? "Remove from Trash" : "Move to Trash"}</div>
              <div class="dropdown-item" data-action="rename">Rename</div>
              <div class="dropdown-item" data-action="move-to-folder">Move to Folder</div>
              <div class="dropdown-item" data-action="share">Share</div>
              <div class="dropdown-item" data-action="add-to-favorites">${
                prompt.isFavorite ? "Remove from Favorites" : "Add to Favorites"
              }</div>
              <div class="dropdown-item" data-action="show-versions">Show Versions</div>
              `
          }
        </div>
      </div>
    </td>
  `;

    const menuBtn = row.querySelector(".menu-btn");
    const dropdown = row.querySelector(".dropdown-menu");
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        if (menu !== dropdown) menu.style.display = "none";
      });
      dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
    });

    row.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        if (action === "copy" && prompt.type !== "Workflow") {
          await copyPrompt(prompt, prompt.folderId);
        } else if (
          action === "execute-workflow" &&
          prompt.type === "Workflow"
        ) {
          await executeWorkflow(prompt.folderId);
        } else if (action === "copy-workflow" && prompt.type === "Workflow") {
          await copyWorkflow(prompt, prompt.folderId);
        } else if (action === "export-workflow" && prompt.type === "Workflow") {
          await exportWorkflow(prompt, prompt.folderId);
        } else if (action === "delete-workflow" && prompt.type === "Workflow") {
          await deleteWorkflow(prompt, prompt.folderId, row, prompts);
        } else if (action === "rename-workflow" && prompt.type === "Workflow") {
          await renameWorkflow(prompt, prompt.folderId, row);
        } else if (action === "rename" && prompt.type !== "Workflow") {
          await renamePrompt(prompt, prompt.folderId, row);
        } else if (action === "move-to-folder" && prompt.type !== "Workflow") {
          await moveToFolder(prompt, prompt.folderId, row);
        } else if (action === "share") {
          sharePrompt(prompt);
        } else if (action === "add-to-favorites") {
          toggleFavorite(prompt.promptId);
        } else if (action === "show-versions" && prompt.type !== "Workflow") {
          if (!prompt.promptId) {
            console.error("Prompt ID is missing for showPromptVersions");
            return;
          }
          showPromptVersions(prompt.promptId);
        } else if (action === "export" && prompt.type !== "Workflow") {
          await exportPrompt(prompt, prompt.folderId);
        } else if (action === "trash" && prompt.type !== "Workflow") {
          await trashPrompt(prompt, prompt.folderId, row, prompts);
        } else if (
          action === "remove-from-trash" &&
          prompt.type !== "Workflow"
        ) {
          await removeFromTrash(prompt, prompt.folderId, row, prompts);
        } else if (action === "delete" && prompt.type !== "Workflow") {
          await deletePrompt(prompt, prompt.folderId, row, prompts);
        }
        dropdown.style.display = "none";
      });
    });

    row.addEventListener("click", (e) => {
      if (!e.target.closest(".prompt-actions")) {
        showDetailsSidebar(prompt);
      }
    });

    tbody.appendChild(row);
    globalRows.push(row); // Store row in globalRows
  });

  // Load filter options after rendering table
  loadTagsFilter();
  loadTypesFilter();

  // Initial sort and filter
  applyFilterAndSort();

  // Event-Listener für Header-Klicks
  const headers = document.querySelectorAll(".table-container th");
  headers.forEach((header, index) => {
    if (index === 0 || index === 9) return; // Checkbox und Aktionen überspringen
    header.style.cursor = "pointer";
    header.addEventListener("click", () => {
      const columnMap = [
        "title",
        "type",
        "compatibleModels",
        "incompatibleModels",
        "tags",
        "category",
        "lastUsed",
        "createdAt",
      ];
      const column = columnMap[index - 1];
      if (sortState.column === column) {
        sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
      } else {
        sortState.column = column;
        sortState.direction = "asc";
      }
      applyFilterAndSort();
      headers.forEach(
        (h) => (h.innerHTML = h.innerHTML.replace(/ (↑|↓)$/, ""))
      );
      header.innerHTML += sortState.direction === "asc" ? " ↑" : " ↓";
    });
  });

  // Event-Listener für Filter-Änderungen
  const filterCheckboxes = document.querySelectorAll(
    "#compatible-models-filter input, #incompatible-models-filter input, #tags-filter input, #types-filter input"
  );
  filterCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      applyFilterAndSort();
    });
  });
  const categoryFilterSelect = document.getElementById("category-filter");
  if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener("change", () => {
      applyFilterAndSort();
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".prompt-actions")) {
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        menu.style.display = "none";
      });
    }
  });
}

// Sortierstatus verwalten
let sortState = {
  column: "createdAt",
  direction: "desc",
};

// Neue Funktion für DOM-basierte Filterung und Sortierung
function applyFilterAndSort() {
  const tbody = document.querySelector(".table-container tbody");
  const table = document.querySelector(".table-container");

  // Filterstatus für Modelle, Tags, Types und Kategorie
  const compatibleFilters = Array.from(
    document.querySelectorAll(
      "#compatible-models-filter input[name='compatible-filter']:checked"
    )
  ).map((cb) => cb.value);
  const incompatibleFilters = Array.from(
    document.querySelectorAll(
      "#incompatible-models-filter input[name='incompatible-filter']:checked"
    )
  ).map((cb) => cb.value);
  const tagsFilters = Array.from(
    document.querySelectorAll("#tags-filter input[name='tags-filter']:checked")
  ).map((cb) => cb.value);
  // Dynamically get the selected type from the <select> element
  const typesFilters = (() => {
    const select = document.getElementById("types-select-filter");
    return select && select.value ? [select.value] : [];
  })();
  const categoryFilter =
    document.getElementById("category-filter")?.value || "all";

  // Filter rows based on td values
  let visibleRows = globalRows.filter((row) => {
    const tds = row.getElementsByTagName("td");
    const types = tds[2].textContent
      .split(", ")
      .filter((t) => t && t !== "N/A");
    const compatibleModels = tds[3].textContent.split(", ").filter((m) => m);
    const incompatibleModels = tds[4].textContent
      .split(", ")
      .filter((m) => m && m !== "N/A");
    const tags = tds[5].textContent.split(", ").filter((t) => t);
    const folderName = tds[6].textContent;
    const lastUsed = tds[7].textContent;

    const hasCompatible =
      compatibleFilters.length === 0 ||
      compatibleFilters.every((model) => compatibleModels.includes(model));
    const hasIncompatible =
      incompatibleFilters.length === 0 ||
      incompatibleFilters.every((model) => incompatibleModels.includes(model));
    const hasTags =
      tagsFilters.length === 0 ||
      tagsFilters.every((tag) => tags.includes(tag));
    const hasTypes =
      typesFilters.length === 0 ||
      typesFilters.every((type) => types.includes(type));
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "recentlyUsed" &&
        lastUsed !== "N/A" &&
        new Date(lastUsed.split(".").reverse().join("-")).getTime() >
          Date.now() - 7 * 24 * 60 * 60 * 1000) ||
      (categoryFilter === "rarelyUsed" &&
        (!lastUsed ||
          lastUsed === "N/A" ||
          new Date(lastUsed.split(".").reverse().join("-")).getTime() <
            Date.now() - 30 * 24 * 60 * 60 * 1000));

    return (
      hasCompatible && hasIncompatible && hasTags && matchesCategory && hasTypes
    );
  });

  // Hide table if no rows match
  if (visibleRows.length === 0) {
    table.style.display = "none";
    return;
  } else {
    table.style.display = "";
  }

  // Sort rows based on td values
  visibleRows.sort((a, b) => {
    const tdsA = a.getElementsByTagName("td");
    const tdsB = b.getElementsByTagName("td");
    let valueA, valueB;
    switch (sortState.column) {
      case "title":
        valueA = (tdsA[1].textContent || "N/A").toLowerCase();
        valueB = (tdsB[1].textContent || "N/A").toLowerCase();
        return sortState.direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      case "type":
        valueA = (tdsA[2].textContent || "N/A").toLowerCase();
        valueB = (tdsB[2].textContent || "N/A").toLowerCase();
        return sortState.direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      case "compatibleModels":
        valueA = (tdsA[3].textContent || "").toLowerCase();
        valueB = (tdsB[3].textContent || "").toLowerCase();
        return sortState.direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      case "incompatibleModels":
        valueA = (tdsA[4].textContent || "").toLowerCase();
        valueB = (tdsB[4].textContent || "").toLowerCase();
        return sortState.direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      case "tags":
        valueA = (tdsA[5].textContent || "").toLowerCase();
        valueB = (tdsB[5].textContent || "").toLowerCase();
        return sortState.direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      case "category":
        valueA = (tdsA[6].textContent || "").toLowerCase();
        valueB = (tdsB[6].textContent || "").toLowerCase();
        return sortState.direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      case "lastUsed":
        valueA =
          tdsA[7].textContent !== "N/A"
            ? new Date(
                tdsA[7].textContent.split(".").reverse().join("-")
              ).getTime()
            : 0;
        valueB =
          tdsB[7].textContent !== "N/A"
            ? new Date(
                tdsB[7].textContent.split(".").reverse().join("-")
              ).getTime()
            : 0;
        return sortState.direction === "asc"
          ? valueA - valueB
          : valueB - valueA;
      case "createdAt":
        valueA =
          tdsA[8].textContent !== "N/A"
            ? new Date(
                tdsA[8].textContent.split(".").reverse().join("-")
              ).getTime()
            : 0;
        valueB =
          tdsB[8].textContent !== "N/A"
            ? new Date(
                tdsB[8].textContent.split(".").reverse().join("-")
              ).getTime()
            : 0;
        return sortState.direction === "asc"
          ? valueA - valueB
          : valueB - valueA;
      default:
        return 0;
    }
  });

  // Update DOM: hide non-matching rows, show and reorder matching rows
  globalRows.forEach((row) => (row.style.display = "none"));
  visibleRows.forEach((row) => {
    row.style.display = "";
    tbody.appendChild(row);
  });
}

const sidebar = document.getElementById("details-sidebar");
function showDetailsSidebar(item, folderId) {
  const sidebarContent = sidebar.querySelector(".sidebar-content");
  sidebarContent.innerHTML = "";
  sidebar.classList.add("open");
  document.getElementById("details-sidebar-resizer").style.display = "block";

  chrome.storage.local.get(["prompts"], (data) => {
    const allPrompts = data.prompts || {};
    const prompt = allPrompts[item.promptId];

    const metaChangeLogEntries = (prompt.metaChangeLog || [])
      .map((entry) => {
        const dateStr = new Date(entry.timestamp).toLocaleString("de-DE");
        let changesHtml = "";

        if (entry.changes && Object.keys(entry.changes).length > 0) {
          changesHtml = `
        <ul>
          ${Object.entries(entry.changes)
            .map(([key, change]) => {
              const formatValue = (v) =>
                Array.isArray(v)
                  ? v.join(", ") || "None"
                  : v === true
                  ? "Yes"
                  : v === false
                  ? "No"
                  : v || "None";
              return `<li><strong>${key}:</strong> From "${formatValue(
                change.from
              )}" to "${formatValue(change.to)}"</li>`;
            })
            .join("")}
        </ul>
      `;
        } else if (entry.type === "trash") {
          changesHtml = `
        <ul>
          <li><strong>isTrash:</strong> Yes</li>
          <li><strong>Trashed At:</strong> ${new Date(
            entry.trashedAt
          ).toLocaleString("de-DE")}</li>
          <li><strong>Folder ID:</strong> ${entry.folderId || "N/A"}</li>
        </ul>
      `;
        } else if (entry.type === "rename") {
          changesHtml = `
        <ul>
          <li><strong>Old Title:</strong> ${entry.oldTitle || "N/A"}</li>
          <li><strong>New Title:</strong> ${entry.newTitle || "N/A"}</li>
        </ul>
      `;
        } else {
          changesHtml = "<p>No metadata changes recorded.</p>";
        }

        return `
      <div style="margin-bottom: 10px;">
        <strong>${dateStr}</strong>
        ${changesHtml}
      </div>
    `;
      })
      .join("");

    let html = `
  <label>Title</label>
  <input type="text" value="${prompt.title || "N/A"}" readonly>
  
  <label>Description</label>
  <textarea readonly>${prompt.description || "N/A"}</textarea>
  
  <label>Content</label>
  <textarea readonly>${prompt.content || "N/A"}</textarea>
`;

    if (/\{\{[^}]+\}\}/.test(prompt.content)) {
      const matches = prompt.content.match(/\{\{([^}]+)\}\}/g) || [];
      const variables = matches.map((v) => v.replace(/\{\{|\}\}/g, ""));
      const jsonObj = {};
      variables.forEach((v) => (jsonObj[v] = ""));
      html += `
    <label>Variables (JSON)</label>
    <textarea readonly>${JSON.stringify(jsonObj, null, 2)}</textarea>
  `;
    }

    html += `
  <label>Last Used</label>
  <input type="text" value="${
    prompt.lastUsed
      ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
      : "N/A"
  }" readonly>

  <div id="statsContainer"></div> <!-- EINZIGER Stats-Platzhalter -->

  <label>Metadata Change Log</label>
  <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
    ${metaChangeLogEntries || "<p>No metadata changes recorded.</p>"}
  </div>

  <button class="edit-btn">Edit Prompt</button>
`;

    sidebarContent.innerHTML = html;

    // --- ExtensionPay integration: nur hier Stats / Unlock einfügen ---
    extpayClient.getUser().then((user) => {
      const statsContainer = sidebarContent.querySelector("#statsContainer");
      const statsLabel = document.createElement("label");
      statsLabel.textContent = "Stats";
      statsContainer.appendChild(statsLabel);

      if (user.paid) {
        const usageCanvas = document.createElement("canvas");
        usageCanvas.id = "usageChart";
        usageCanvas.style.width = "100%";
        usageCanvas.style.height = "200px";
        statsContainer.appendChild(usageCanvas);

        // Chart.js Daten vorbereiten
        const usageHistory = prompt.usageHistory || [];
        const now = new Date();
        const days = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (29 - i));
          return d;
        });

        const usagePerDay = days.map((day) => {
          const start = new Date(day);
          start.setHours(0, 0, 0, 0);
          const end = new Date(day);
          end.setHours(23, 59, 59, 999);
          return usageHistory.filter(
            (entry) =>
              entry.timestamp >= start.getTime() &&
              entry.timestamp <= end.getTime()
          ).length;
        });

        const ctx = usageCanvas.getContext("2d");
        new Chart(ctx, {
          type: "line",
          data: {
            labels: days.map((d) =>
              d.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
              })
            ),
            datasets: [
              {
                label: "Usage",
                data: usagePerDay,
                borderColor: "#4caf50",
                backgroundColor: "rgba(76, 175, 80, 0.15)",
                fill: true,
                tension: 0.35,
                pointRadius: 3,
                pointBackgroundColor: "#4caf50",
                pointHoverRadius: 5,
              },
            ],
          },
          options: {
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: (ctx) => ` ${ctx.parsed.y} uses` },
              },
            },
            scales: {
              x: { grid: { display: false } },
              y: { beginAtZero: true, ticks: { precision: 0 } },
            },
          },
        });
      } else {
        const unlockSpan = document.createElement("span");
        unlockSpan.id = "unlockUsageBar";
        unlockSpan.textContent = "🔒 Unlock with Basic Plan";
        unlockSpan.style.cursor = "pointer";
        unlockSpan.style.fontSize = "20px";
        unlockSpan.style.marginLeft = "10px";
        statsContainer.appendChild(unlockSpan);

        unlockSpan.onclick = () => extpayClient.openPaymentPage("basicmonthly");
      }
    });

    sidebarContent.querySelector(".edit-btn").addEventListener("click", () => {
      editPromptDetails(prompt.promptId, prompt, sidebarContent);
    });
  });
}

sidebar.querySelector(".close-sidebar").addEventListener("click", () => {
  sidebar.classList.remove("open");
  document.getElementById("details-sidebar-resizer").style.display = "none";
});

function initializePrompts() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");

  if (categoryFromUrl) {
    handleCategoryClick(decodeURIComponent(categoryFromUrl));
  } else {
    chrome.storage.local.get(["prompts", "folders"], (data) => {
      const prompts = data.prompts || {};
      const folders = data.folders || {};

      globalPrompts = Object.values(prompts)
        .filter((prompt) => {
          const folder = prompt.folderId ? folders[prompt.folderId] : null;
          const isInTrash = folder?.isTrash === true;
          const isHidden = folder?.isHidden === true;
          return !isInTrash && !isHidden;
        })
        .map((prompt) => {
          const folder = prompt.folderId ? folders[prompt.folderId] : null;
          return {
            ...prompt,
            folderName: folder?.name || "Unassigned",
          };
        });

      renderPrompts(globalPrompts);
      document.querySelector(".main-header h1").textContent = "All Prompts";
    });
  }
}

function handleCategoryClick(category) {
  chrome.storage.local.get(["prompts", "folders"], function (data) {
    const prompts = data.prompts || {};
    const folders = data.folders || {};
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Standard-Filter: immer nur nicht-Trash-Prompts
    const getPromptList = (filterFn) => {
      return Object.values(prompts)
        .filter((p) => !p.isTrash && filterFn(p))
        .map((p) => ({
          ...p,
          folderName: folders[p.folderId]?.name || "No folder",
        }));
    };

    let filteredPrompts = [];

    switch (category) {
      case "All Prompts":
        filteredPrompts = getPromptList(() => true);
        document.getElementById("addItemBtn").style.visibility = "visible";
        break;

      case "Favorites":
        filteredPrompts = getPromptList((p) => p.isFavorite);
        document.getElementById("addItemBtn").style.visibility = "visible";
        break;

      case "Single Prompts":
        filteredPrompts = getPromptList((p) => p.folderId === null).sort(
          (a, b) => {
            const dateA = a.createdAt || 0;
            const dateB = b.createdAt || 0;
            return (
              dateB - dateA || (a.title || "").localeCompare(b.title || "")
            );
          }
        );
        document.getElementById("addItemBtn").style.visibility = "visible";
        break;

      case "Categorised Prompts":
        filteredPrompts = getPromptList((p) => p.folderId !== null);
        document.getElementById("addItemBtn").style.visibility = "visible";
        break;

      case "Trash":
        filteredPrompts = Object.values(prompts)
          .filter((p) => p.isTrash) // Nur Trash-Prompts
          .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
          .map((p) => ({
            ...p,
            folderName: "Papierkorb",
          }));
        document.getElementById("addItemBtn").style.visibility = "hidden";
        break;

      case "Dynamic Prompts":
        filteredPrompts = getPromptList((p) => /\{[^}]+\}/.test(p.content));
        document.getElementById("addItemBtn").style.visibility = "visible";
        break;

      case "Static Prompts":
        filteredPrompts = getPromptList(
          (p) => p.content && !/\{[^}]+\}/.test(p.content)
        );
        document.getElementById("addItemBtn").style.visibility = "visible";
        break;

      case "Unused Prompts":
        filteredPrompts = getPromptList(
          (p) => !p.lastUsed || p.lastUsed < thirtyDaysAgo
        );
        document.getElementById("addItemBtn").style.visibility = "visible";
        break;

      default:
        const matchingFolderId = Object.entries(folders).find(
          ([, folder]) => folder.name?.toLowerCase() === category.toLowerCase()
        )?.[0];

        if (matchingFolderId) {
          const promptIds = folders[matchingFolderId].promptIds || [];
          filteredPrompts = promptIds
            .map((id) => prompts[id])
            .filter((p) => p && !p.isTrash) // Hier auch Trash rausfiltern
            .map((p) => ({
              ...p,
              folderName: folders[matchingFolderId].name,
            }));
        }
        break;
    }

    renderPrompts(filteredPrompts);

    const header = document.querySelector("#prompts-header");
    if (header) {
      header.textContent = category;
      header.dataset.category = category;
    }
  });
}

function handleFolderClick(folderName) {
  console.log("open folder")
  chrome.storage.local.get(["prompts", "folders"], function (data) {
    const { prompts = {}, folders = {} } = data;

    const matchingEntry = Object.entries(folders).find(
      ([, folder]) => folder.name?.toLowerCase() === folderName.toLowerCase()
    );

    if (!matchingEntry) {
      console.warn(`Kein Ordner mit Namen "${folderName}" gefunden.`);
      renderPrompts([]);
      return;
    }

    const [folderId, folderObj] = matchingEntry;
    const promptIds = folderObj.promptIds || [];

    const filteredPrompts = promptIds
      .map((id) => prompts[id])
      .filter((p) => p && !p.isTrash) // 🚨 Trash-Prompts hier rausfiltern
      .map((prompt) => ({
        ...prompt,
        folderId,
        folderName: folderObj.name,
      }));

    console.log(`Filtered prompts for folder ${folderName}:`, filteredPrompts);

    renderPrompts(filteredPrompts);
    document.querySelector(".main-header h1").textContent = folderName;
  });
}

function loadTagsFilter() {
  const tagsFilter = document.getElementById("tags-filter");
  if (!tagsFilter) return; // Exit if container is not found
  tagsFilter.innerHTML = ""; // Clear existing content

  // Alle einzigartigen Tags aus den DOM Rows extrahieren
  const tags = [
    ...new Set(
      globalRows
        .map((row) => row.getElementsByTagName("td")[5].textContent.split(", "))
        .flat()
        .filter((tag) => tag && tag !== "")
    ),
  ].sort();

  if (tags.length === 0) {
    tagsFilter.innerHTML = "<p>No prompts with a tag</p>";
    return;
  }

  tags.forEach((tag) => {
    const label = document.createElement("label");
    label.className = "tag-checkbox-label";
    label.innerHTML = `<input type="checkbox" name="tags-filter" value="${escapeHTML(
      tag
    )}"> ${escapeHTML(tag)}`;
    tagsFilter.appendChild(label);

    // Event-Listener für Filter-Änderungen
    const checkbox = label.querySelector("input");
    checkbox.addEventListener("change", () => {
      applyFilterAndSort();
    });
  });
}

function loadTypesFilter() {
  const typesFilter = document.getElementById("types-filter");
  if (!typesFilter) return; // Exit if container is not found
  typesFilter.innerHTML = ""; // Clear existing content

  // Alle einzigartigen Types aus den DOM Rows extrahieren
  const types = [
    ...new Set(
      globalRows
        .map((row) => row.getElementsByTagName("td")[2].textContent.trim())
        .filter((type) => type && type !== "N/A") // Nur echte Werte
    ),
  ].sort();

  if (types.length === 0) {
    typesFilter.innerHTML = "<p>No prompts with a type</p>";
    return;
  }

  // Create a select element
  const select = document.createElement("select");
  select.id = "types-select-filter";

  // Add an empty option at the top
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "-- All Types --";
  select.appendChild(emptyOption);

  // Add options for each real type
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = escapeHTML(type);
    option.textContent = escapeHTML(type);
    select.appendChild(option);
  });

  // Listen for change to apply filter
  select.addEventListener("change", () => {
    applyFilterAndSort();
  });

  typesFilter.appendChild(select);
}

// --- Replace old code to get selected types ---
const typesFilters = (() => {
  const select = document.getElementById("types-select-filter");
  if (!select || !select.value) return []; // no filter selected
  return [select.value]; // single selected type in an array to match old format
})();

// Levenshtein Distance function (assumed to be defined elsewhere)
function levenshteinDistance(a, b) {
  // ... existing implementation ...
}
