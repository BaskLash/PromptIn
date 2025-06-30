// Konstanten
const DISPLAY_KEY = "filterAreaDisplay"; // Speicher-Schlüssel

// DOM-Elemente
const filterStat = document.getElementById("toggleFilterBtn");
const filterArea = document.getElementById("filter-container");

/* ------------------------------------------------------------------ */
/* 1) BEIM LADEN: gespeicherten Status holen und anwenden             */
/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  // Wert aus storage lesen (default: 'none')
  const { [DISPLAY_KEY]: saved = "none" } = await chrome.storage.local.get(
    DISPLAY_KEY
  );

  filterArea.style.display = saved;
  if (saved === "flex") {
    loadTagsFilter(); // Beim Öffnen direkt nachladen
  }
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
    loadTagsFilter();
  }
});

// Set initial visibility to flex to ensure tags are visible
filterArea.style.display = "flex";
loadTagsFilter(); // Load tags immediately on page load

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
    const contentCell = row.getElementsByTagName("td")[2]; // Content column (adjust index if needed)
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
    const distance = levenshteinDistance(categoryText, filter);
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

  folderSearchInput = document.querySelector(".folder-search");
  folderSearchInput.style.display =
    folderList.children.length > 5 ? "block" : "none";
}

function filterFolders() {
  const folderList = document.querySelector(".folder-list");
  const filter = folderSearchInput.value.toLowerCase().trim();
  const folders = Array.from(folderList.querySelectorAll("li.folder-item"));

  if (!filter) {
    // No input: Reset to original state
    folders.forEach((folder) => {
      folder.style.display = "";
      folder.classList.remove("highlight");
    });
    folders.forEach((folder) => folderList.appendChild(folder));
    return;
  }

  // Calculate Levenshtein distance for folders
  const scoredFolders = folders.map((folder) => {
    const folderText = folder.getAttribute("data-folder").toLowerCase().trim(); // Verwende data-folder statt textContent
    const distance = levenshteinDistance(folderText, filter);
    return { item: folder, distance };
  });

  // Sort by distance
  scoredFolders.sort((a, b) => a.distance - b.distance);

  // Clear current display
  folders.forEach((folder) => (folder.style.display = "none"));

  // Apply sorted order and display
  scoredFolders.forEach(({ item, distance }, index) => {
    item.style.display = "";
    // Highlight top 3 results
    if (index < 3 && distance !== Infinity) {
      item.classList.add("highlight");
    } else {
      item.classList.remove("highlight");
    }
    folderList.appendChild(item);
  });
}
function renderPrompts(prompts) {
  const tbody = document.querySelector(".table-container tbody");
  tbody.innerHTML = "";

  // Sortierstatus verwalten
  let sortState = {
    column: "createdAt",
    direction: "desc",
  };

  // Filterstatus für Modelle, Tags und Kategorie
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
  const categoryFilter =
    document.getElementById("category-filter")?.value || "all";

  // Filter anwenden
  let filteredPrompts = prompts.filter((prompt) => {
    const hasCompatible =
      compatibleFilters.length === 0 ||
      (Array.isArray(prompt.compatibleModels) &&
        compatibleFilters.every((model) =>
          prompt.compatibleModels.includes(model)
        ));
    const hasIncompatible =
      incompatibleFilters.length === 0 ||
      (Array.isArray(prompt.incompatibleModels) &&
        incompatibleFilters.every((model) =>
          prompt.incompatibleModels.includes(model)
        ));
    const hasTags =
      tagsFilters.length === 0 ||
      (Array.isArray(prompt.tags) &&
        tagsFilters.every((tag) => prompt.tags.includes(tag)));
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "recentlyUsed" &&
        prompt.lastUsed &&
        new Date(prompt.lastUsed).getTime() >
          Date.now() - 7 * 24 * 60 * 60 * 1000) ||
      (categoryFilter === "rarelyUsed" &&
        (!prompt.lastUsed ||
          new Date(prompt.lastUsed).getTime() <
            Date.now() - 30 * 24 * 60 * 60 * 1000));
    return hasCompatible && hasIncompatible && hasTags && matchesCategory;
  });

  // Sortierfunktion
  function sortPrompts(promptsToSort, column, direction) {
    const sortedPrompts = [...promptsToSort];
    sortedPrompts.sort((a, b) => {
      let valueA, valueB;
      switch (column) {
        case "title":
          valueA = (a.title || "N/A").toLowerCase();
          valueB = (b.title || "N/A").toLowerCase();
          return direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "type":
          valueA = (a.type || "N/A").toLowerCase();
          valueB = (b.type || "N/A").toLowerCase();
          return direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "compatibleModels":
          valueA = Array.isArray(a.compatibleModels)
            ? a.compatibleModels.join(", ").toLowerCase()
            : "";
          valueB = Array.isArray(b.compatibleModels)
            ? b.compatibleModels.join(", ").toLowerCase()
            : "";
          return direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "incompatibleModels":
          valueA = Array.isArray(a.incompatibleModels)
            ? a.incompatibleModels.join(", ").toLowerCase()
            : "";
          valueB = Array.isArray(b.incompatibleModels)
            ? b.incompatibleModels.join(", ").toLowerCase()
            : "";
          return direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "tags":
          valueA = Array.isArray(a.tags) ? a.tags.join(", ").toLowerCase() : "";
          valueB = Array.isArray(b.tags) ? b.tags.join(", ").toLowerCase() : "";
          return direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "category":
          valueA = (a.folderName || "").toLowerCase();
          valueB = (b.folderName || "").toLowerCase();
          return direction === "asc"
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        case "lastUsed":
          valueA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          valueB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return direction === "asc" ? valueA - valueB : valueB - valueA;
        case "createdAt":
          valueA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valueB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return direction === "asc" ? valueA - valueB : valueB - valueA;
        default:
          return 0;
      }
    });
    return sortedPrompts;
  }

  // Initiale Sortierung
  const sortedPrompts = sortPrompts(
    filteredPrompts,
    sortState.column,
    sortState.direction
  );

  // Render der Prompts
  sortedPrompts.forEach((prompt, index) => {
    const row = document.createElement("tr");
    row.dataset.index = index;
    row.dataset.promptId = prompt.id || index;
    row.innerHTML = `
      <td><input type="checkbox" id="prompt-checkbox-${
        prompt.id || index
      }" name="prompt-checkbox" /></td>
      <td>${prompt.title || "N/A"}</td>
      <td>${prompt.type || "N/A"}</td>
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
                <div class="dropdown-item" data-action="delete">Delete Prompt</div>
                <div class="dropdown-item" data-action="rename">Rename</div>
                <div class="dropdown-item" data-action="move-to-folder">Move to Folder</div>
                <div class="dropdown-item" data-action="share">Share</div>
                <div class="dropdown-item" data-action="add-to-favorites">${
                  prompt.isFavorite
                    ? "Remove from Favorites"
                    : "Add to Favorites"
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
          await sharePrompt(prompt);
        } else if (action === "add-to-favorites") {
          await toggleFavorite(prompt, prompt.folderId, row);
        } else if (action === "show-versions" && prompt.type !== "Workflow") {
          chrome.storage.local.get(prompt.folderId, (data) => {
            const topic = data[prompt.folderId];
            if (!topic || !topic.prompts) return;
            const promptIndex = topic.prompts.findIndex(
              (p) => p.title === prompt.title && p.content === prompt.content
            );
            if (promptIndex !== -1) {
              showPromptVersions(prompt.folderId, promptIndex, row);
            }
          });
        } else if (action === "export" && prompt.type !== "Workflow") {
          await exportPrompt(prompt, prompt.folderId);
        } else if (action === "delete" && prompt.type !== "Workflow") {
          await deletePrompt(prompt, prompt.folderId, row, prompts);
        }
        dropdown.style.display = "none";
      });
    });

    row.addEventListener("click", (e) => {
      if (!e.target.closest(".prompt-actions")) {
        showDetailsSidebar(prompt, prompt.folderId);
      }
    });

    tbody.appendChild(row);
  });

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
      const sortedPrompts = sortPrompts(
        filteredPrompts,
        sortState.column,
        sortState.direction
      );
      renderPrompts(prompts); // Original prompts übergeben, um Filter zu behalten
      headers.forEach(
        (h) => (h.innerHTML = h.innerHTML.replace(/ (↑|↓)$/, ""))
      );
      header.innerHTML += sortState.direction === "asc" ? " ↑" : " ↓";
    });
  });

  // Event-Listener für Filter-Änderungen
  const filterCheckboxes = document.querySelectorAll(
    "#compatible-models-filter input, #incompatible-models-filter input, #tags-filter input"
  );
  filterCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      renderPrompts(prompts);
    });
  });
  const categoryFilterSelect = document.getElementById("category-filter");
  if (categoryFilterSelect) {
    categoryFilterSelect.addEventListener("change", () => {
      renderPrompts(prompts);
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
function showDetailsSidebar(item, folderId) {
  const sidebar = document.getElementById("details-sidebar");
  const sidebarContent = sidebar.querySelector(".sidebar-content");
  sidebarContent.innerHTML = "";
  sidebar.classList.add("open");

  if (item.type === "Workflow") {
    chrome.storage.local.get(null, (data) => {
      const workflow = data[folderId];
      if (!workflow) {
        sidebarContent.innerHTML = "<p>Error: Workflow not found.</p>";
        return;
      }

      const stepDetails = workflow.steps.map((step, index) => {
        // Fall 1: Kein Prompt-ID vorhanden (z. B. benutzerdefinierter Prompt ohne gespeicherte ID)
        if (!step.promptId && !step.useCustomPrompt) {
          return `
            <li class="step-item">
              <strong>Step ${index + 1}: ${
            step.title || "Untitled Step"
          }</strong><br>
              AI Model: ${step.aiModel || "N/A"}<br>
              Prompt Title: N/A<br>
              Prompt Content: N/A<br>
              Parameters: ${
                step.parameters && Object.keys(step.parameters).length > 0
                  ? `<pre>${JSON.stringify(step.parameters, null, 2)}</pre>`
                  : "None"
              }
            </li>
          `;
        }

        // Fall 2: Benutzerdefinierter Prompt
        if (step.useCustomPrompt && step.customPrompt) {
          const promptTitle =
            step.customPrompt.length > 5
              ? step.customPrompt.substring(0, 5)
              : step.customPrompt;
          return `
            <li class="step-item">
              <strong>Step ${index + 1}: ${
            step.title || "Untitled Step"
          }</strong><br>
              AI Model: ${step.aiModel || "N/A"}<br>
              Prompt Title: ${promptTitle || "N/A"}<br>
              Prompt Content: <pre style="background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-top: 5px; white-space: pre-wrap;">${
                step.customPrompt || "N/A"
              }</pre>
              Parameters: ${
                step.parameters && Object.keys(step.parameters).length > 0
                  ? `<pre>${JSON.stringify(step.parameters, null, 2)}</pre>`
                  : "None"
              }
            </li>
          `;
        }

        // Fall 3: Gespeicherter Prompt mit Prompt-ID
        const parsedId = parsePromptId(step.promptId);
        if (!parsedId) {
          return `
            <li class="step-item">
              <strong>Step ${index + 1}: ${
            step.title || "Untitled Step"
          }</strong><br>
              AI Model: ${step.aiModel || "N/A"}<br>
              Prompt Title: Ungültige Prompt-ID (${step.promptId})<br>
              Prompt Content: N/A<br>
              Parameters: ${
                step.parameters && Object.keys(step.parameters).length > 0
                  ? `<pre>${JSON.stringify(step.parameters, null, 2)}</pre>`
                  : "None"
              }
            </li>
          `;
        }

        const { folderId: promptFolderId, promptIndex } = parsedId;
        const topic = data[promptFolderId];

        if (
          !topic ||
          !topic.prompts ||
          isNaN(promptIndex) ||
          !topic.prompts[promptIndex]
        ) {
          return `
            <li class="step-item">
              <strong>Step ${index + 1}: ${
            step.title || "Untitled Step"
          }</strong><br>
              AI Model: ${step.aiModel || "N/A"}<br>
              Prompt Title: Nicht gefunden (ID: ${step.promptId})<br>
              Prompt Content: N/A<br>
              Parameters: ${
                step.parameters && Object.keys(step.parameters).length > 0
                  ? `<pre>${JSON.stringify(step.parameters, null, 2)}</pre>`
                  : "None"
              }
            </li>
          `;
        }

        const prompt = topic.prompts[promptIndex];
        return `
          <li class="step-item">
            <strong>Step ${index + 1}: ${
          step.title || "Untitled Step"
        }</strong><br>
            AI Model: ${step.aiModel || "N/A"}<br>
            Prompt Title: ${prompt.title || "N/A"}<br>
            Prompt Content: <pre style="background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-top: 5px; white-space: pre-wrap;">${
              prompt.content || "N/A"
            }</pre>
            Parameters: ${
              step.parameters && Object.keys(step.parameters).length > 0
                ? `<pre>${JSON.stringify(step.parameters, null, 2)}</pre>`
                : "None"
            }
          </li>
        `;
      });

      sidebarContent.innerHTML = `
        <label>Name</label>
        <input type="text" value="${workflow.name || "N/A"}" readonly>
        <label>AI Model</label>
        <label>Steps</label>
        <ul class="step-list">${stepDetails.join("")}</ul>
        <label>Created At</label>
        <input type="text" value="${
          workflow.createdAt
            ? new Date(workflow.createdAt).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Last Used</label>
        <input type="text" value="${
          workflow.lastUsed
            ? new Date(workflow.lastUsed).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <button class="edit-btn">Edit Workflow</button>
      `;

      sidebarContent
        .querySelector(".edit-btn")
        .addEventListener("click", () => {
          editWorkflowDetails(folderId, workflow, sidebarContent);
        });
    });
  } else {
    if (!item || !item.title || !item.content) {
      sidebarContent.innerHTML = "<p>Error: Invalid prompt data.</p>";
      return;
    }

    chrome.storage.local.get(folderId, (data) => {
      const topic = data[folderId];
      if (!topic || !topic.prompts) {
        sidebarContent.innerHTML = "<p>Error: Prompt not found.</p>";
        return;
      }

      const promptIndex = topic.prompts.findIndex(
        (p) => p.title === item.title && p.content === item.content
      );
      if (promptIndex === -1) {
        sidebarContent.innerHTML = "<p>Error: Prompt not found.</p>";
        return;
      }

      const prompt = topic.prompts[promptIndex];

      const metaChangeLogEntries = (prompt.metaChangeLog || [])
        .map(
          (entry) => `
        <div style="margin-bottom: 10px;">
          <strong>${new Date(entry.timestamp).toLocaleString("de-DE")}</strong>
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
        </div>
      `
        )
        .join("");

      sidebarContent.innerHTML = `
        <label>Title</label>
        <input type="text" value="${prompt.title || "N/A"}" readonly>
        <label>Description</label>
        <textarea readonly>${prompt.description || "N/A"}</textarea>
        <label>Content</label>
        <textarea readonly>${prompt.content || "N/A"}</textarea>
        <label>Notes</label>
        <textarea readonly>${prompt.notes || "N/A"}</textarea>
        <label>Type</label>
        <input type="text" value="${prompt.type || "N/A"}" readonly>
        <label>Compatible Models</label>
        <input type="text" value="${
          Array.isArray(prompt.compatibleModels)
            ? prompt.compatibleModels.join(", ")
            : prompt.compatibleModels || "N/A"
        }" readonly>
        <label>Incompatible Models</label>
        <input type="text" value="${
          Array.isArray(prompt.incompatibleModels)
            ? prompt.incompatibleModels.join(", ")
            : prompt.incompatibleModels || "N/A"
        }" readonly>
        <label>Tags</label>
        <input type="text" value="${
          Array.isArray(prompt.tags)
            ? prompt.tags.join(", ")
            : prompt.tags || "N/A"
        }" readonly>
        <label>Folder</label>
        <input type="text" value="${prompt.folderName || "N/A"}" readonly>
        <label>Favorite</label>
        <input type="text" value="${prompt.isFavorite ? "Yes" : "No"}" readonly>
        <label>Created At</label>
        <input type="text" value="${
          prompt.createdAt
            ? new Date(prompt.createdAt).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Updated At</label>
        <input type="text" value="${
          prompt.updatedAt
            ? new Date(prompt.updatedAt).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Last Used</label>
        <input type="text" value="${
          prompt.lastUsed
            ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
            : "N/A"
        }" readonly>
        <label>Metadata Change Log</label>
        <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
          ${metaChangeLogEntries || "<p>No metadata changes recorded.</p>"}
        </div>
        <button class="edit-btn">Edit Prompt</button>
      `;

      sidebarContent
        .querySelector(".edit-btn")
        .addEventListener("click", () => {
          editPromptDetails(folderId, promptIndex, prompt, sidebarContent);
        });
    });
  }

  sidebar.querySelector(".close-sidebar").addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
}

function initializePrompts() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFromUrl = urlParams.get("category");
  loadTagsFilter(); // Tags-Filter laden
  if (categoryFromUrl) {
    handleCategoryClick(decodeURIComponent(categoryFromUrl));
  } else {
    chrome.storage.local.get(null, function (data) {
      const allPrompts = Object.entries(data)
        .filter(([, topic]) => topic.prompts && !topic.isTrash)
        .flatMap(([id, topic]) =>
          topic.prompts.map((prompt) => ({
            ...prompt,
            folderId: id,
            folderName: topic.name,
          }))
        );
      renderPrompts(allPrompts);
      document.querySelector(".main-header h1").textContent = "All Prompts";
    });
  }
}
function handleCategoryClick(category) {
  chrome.storage.local.get(null, function (data) {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const isVisibleOrHiddenTopic = (topic) => topic.prompts && !topic.isTrash;
    const isVisibleTopic = (topic) =>
      topic.prompts && !topic.isHidden && !topic.isTrash;
    const isHiddenTopic = (topic) =>
      topic.prompts && topic.isHidden && !topic.isTrash;
    const isTrashTopic = (topic) => topic.prompts && topic.isTrash;
    const getPromptObjects = (topic, id) =>
      (topic.prompts || []).map((prompt) => ({
        ...prompt,
        folderId: id,
        folderName: topic.name || "N/A",
      }));

    let filteredPrompts = [];

    switch (category) {
      case "All Prompts":
        filteredPrompts = Object.entries(data)
          .filter(([, topic]) => isVisibleOrHiddenTopic(topic))
          .flatMap(([id, topic]) => getPromptObjects(topic, id));
        break;

      case "Favorites":
        filteredPrompts = Object.entries(data)
          .filter(([, topic]) => isVisibleTopic(topic) || isHiddenTopic(topic))
          .flatMap(([id, topic]) =>
            topic.prompts
              .filter((p) => p.isFavorite)
              .map((prompt) => ({
                ...prompt,
                folderId: id,
                folderName: topic.name || "N/A",
              }))
          );
        break;

      case "Single Prompts":
        filteredPrompts = Object.entries(data)
          .filter(
            ([key]) =>
              key.startsWith("single_prompt_") || key === "noFolderPrompts"
          )
          .flatMap(([key, topic]) => {
            const promptList =
              key === "noFolderPrompts" ? topic : topic.prompts || [];
            return promptList.map((prompt) => ({
              ...prompt,
              folderId: key,
              folderName: "Kein Ordner",
              storageKey: key,
            }));
          })
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA; // Neueste zuerst
            return (a.title || "N/A").localeCompare(b.title || "N/A"); // Alphabetisch als Fallback
          });
        break;

      case "Categorised Prompts":
        filteredPrompts = Object.entries(data)
          .filter(([, topic]) => isVisibleTopic(topic))
          .flatMap(([id, topic]) => getPromptObjects(topic, id));
        break;

      case "Trash":
        filteredPrompts = Object.entries(data)
          .filter(([, topic]) => isTrashTopic(topic))
          .flatMap(([id, topic]) => getPromptObjects(topic, id));
        break;

      case "Dynamic Prompts":
        filteredPrompts = Object.entries(data).flatMap(([id, topic]) =>
          (topic.prompts || [])
            .filter((p) => p.content && /\{[^}]+\}/.test(p.content))
            .map((prompt) => ({
              ...prompt,
              folderId: id,
              folderName: topic.name || "N/A",
            }))
        );
        break;

      case "Static Prompts":
        filteredPrompts = Object.entries(data)
          .filter(([, topic]) => isVisibleTopic(topic))
          .flatMap(([id, topic]) =>
            topic.prompts
              .filter((p) => p.content && !/\{[^}]+\}/.test(p.content))
              .map((prompt) => ({
                ...prompt,
                folderId: id,
                folderName: topic.name || "N/A",
              }))
          );
        break;

      case "Unused Prompts":
        filteredPrompts = Object.entries(data)
          .filter(([, topic]) => isVisibleTopic(topic) || isHiddenTopic(topic))
          .flatMap(([id, topic]) =>
            topic.prompts
              .filter((p) => !p.lastUsed || p.lastUsed < thirtyDaysAgo)
              .map((prompt) => ({
                ...prompt,
                folderId: id,
                folderName: topic.name || "N/A",
              }))
          );
        break;

      case "Workflows":
        filteredPrompts = Object.entries(data)
          .filter(([, topic]) => topic.steps)
          .map(([id, topic]) => ({
            title: topic.name || "Unnamed Workflow",
            type: "Workflow",
            compatibleModels: topic.aiModel || "N/A",
            incompatibleModels: "N/A",
            tags: "N/A",
            folderName: "Workflows",
            folderId: id,
            lastUsed: topic.lastUsed
              ? new Date(topic.lastUsed).toLocaleDateString("de-DE")
              : "N/A",
            createdAt: topic.createdAt
              ? new Date(topic.createdAt).toLocaleDateString("de-DE")
              : "N/A",
          }));
        break;

      default:
        filteredPrompts = Object.entries(data)
          .filter(
            ([, topic]) =>
              topic?.name?.toLowerCase() === category.toLowerCase() &&
              !topic.isHidden &&
              !topic.isTrash
          )
          .flatMap(([id, topic]) => getPromptObjects(topic, id));
        break;
    }

    renderPrompts(filteredPrompts);
    const header = document.querySelector("#prompts-header");
    if (header) {
      header.textContent = category; // Später für Übersetzung anpassbar
      header.dataset.category = category; // Setze das data-category-Attribut
    }
  });
}
function handleFolderClick(folder) {
  chrome.storage.local.get(null, function (data) {
    const filteredPrompts = Object.entries(data)
      .filter(
        ([id, topic]) =>
          topic &&
          typeof topic.name === "string" &&
          topic.name.toLowerCase() === folder.toLowerCase() &&
          !topic.isHidden &&
          !topic.isTrash
      )
      .flatMap(([id, topic]) =>
        (topic.prompts || []).map((prompt) => ({
          ...prompt,
          folderId: id,
          folderName: topic.name,
        }))
      );
    console.log(`Filtered prompts for folder ${folder}:`, filteredPrompts);

    renderPrompts(filteredPrompts);
    document.querySelector(".main-header h1").textContent = folder;
  });
}
function loadTagsFilter() {
  chrome.storage.local.get("tags", (data) => {
    const tagsFilter = document.getElementById("tags-filter");
    if (!tagsFilter) return; // Exit if container is not found
    tagsFilter.innerHTML = ""; // Clear existing content

    const tags = data.tags || []; // Fallback to empty array if no tags
    if (tags.length === 0) {
      tagsFilter.innerHTML = "<p>Keine Tags verfügbar</p>";
      return;
    }

    tags.forEach((tag) => {
      const label = document.createElement("label");
      label.className = "tag-checkbox-label";
      label.innerHTML = `<input type="checkbox" name="tags-filter" value="${escapeHTML(
        tag
      )}"> ${escapeHTML(tag)}`;
      tagsFilter.appendChild(label);

      // Add event listener to trigger filtering on change
      const checkbox = label.querySelector("input");
      checkbox.addEventListener("change", () => {
        // Fetch all prompts and re-render with updated filters
        chrome.storage.local.get(null, (data) => {
          const allPrompts = Object.entries(data)
            .filter(([, topic]) => topic.prompts && !topic.isTrash)
            .flatMap(([id, topic]) =>
              topic.prompts.map((prompt) => ({
                ...prompt,
                folderId: id,
                folderName: topic.name,
              }))
            );
          renderPrompts(allPrompts);
        });
      });
    });
  });
}
