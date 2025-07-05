// Global Variables
const overviewBtn = document.getElementById("overview-btn");
const faqBtn = document.getElementById("faq-btn");
const sortBtn = document.querySelector(".sort-btn");
const sortDropdown = document.getElementById("sort-dropdown");
const folderSortBtn = document.getElementById("folder-sort-btn");
const folderSortDropdown = document.getElementById("folder-sort-dropdown");
let navigationState = { source: "main", folderId: null };
let sortState = { sortBy: "title", sortOrder: "ascending" };
let translations = {};
let currentLang =
  navigator.language.split("-")[0] || localStorage.getItem("language") || "en";
let isSortDropdownOpen = false;
let isFolderSortDropdownOpen = false;
let currentButton = null;
let isDropdownOpen = false;
let isMouseOverDropdown = false;
let hoveredRow = null;

function levenshteinDistance(a, b) {
  // Erstelle eine Matrix mit den Dimensionen (m+1) x (n+1)
  const m = a.length;
  const n = b.length;
  const matrix = Array(m + 1)
    .fill()
    .map(() => Array(n + 1).fill(0));

  // Initialisiere die erste Zeile und Spalte
  for (let i = 0; i <= m; i++) {
    matrix[i][0] = i; // Kosten für das Löschen
  }
  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j; // Kosten für das Einfügen
  }

  // Fülle die Matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1; // Kosten für Ersetzen
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Löschen
        matrix[i][j - 1] + 1, // Einfügen
        matrix[i - 1][j - 1] + cost // Ersetzen
      );
    }
  }

  // Rückgabe der Levenshtein-Distanz
  return matrix[m][n];
}

// Action Dropdown
const dropdown = document.createElement("div");
dropdown.classList.add("action-dropdown");
dropdown.innerHTML = `
    <button class="copy-btn">Copy</button>
    <button class="rename-btn">Rename</button>
    <button class="delete-btn">Delete</button>
  `;
document.body.appendChild(dropdown);

dropdown.querySelector(".copy-btn").addEventListener("click", () => {
  const folderId = dropdown.dataset.folderId;
  const promptIndex = parseInt(dropdown.dataset.promptIndex);
  chrome.storage.local.get(folderId, function (data) {
    const prompt = data[folderId]?.prompts?.[promptIndex];
    if (prompt) {
      navigator.clipboard.writeText(prompt.content || prompt.title);
      alert(translations[currentLang]?.copied || "Prompt-Content copied!");
    }
  });
  dropdown.style.display = "none";
  isDropdownOpen = false;
  if (currentButton) {
    if (currentButton.closest("tr") === hoveredRow) {
      keepActionButtonVisible(currentButton);
    } else {
      hideActionButton(currentButton);
    }
  }
  currentButton = null;
});

dropdown.querySelector(".rename-btn").addEventListener("click", () => {
  const folderId = dropdown.dataset.folderId;
  const promptIndex = parseInt(dropdown.dataset.promptIndex);
  const newName = prompt(
    translations[currentLang]?.rename_prompt || "New prompt title:",
    dropdown.dataset.entry
  );
  if (newName) {
    chrome.storage.local.get(folderId, function (data) {
      const topic = data[folderId];
      if (topic && topic.prompts && topic.prompts[promptIndex]) {
        topic.prompts[promptIndex].title = newName;
        chrome.storage.local.set({ [folderId]: topic }, () => {
          loadPromptsTable();
          if (dropdown.dataset.table === "folder") showFolder(folderId);
        });
      }
    });
  }
  dropdown.style.display = "none";
  isDropdownOpen = false;
  if (currentButton) {
    if (currentButton.closest("tr") === hoveredRow) {
      keepActionButtonVisible(currentButton);
    } else {
      hideActionButton(currentButton);
    }
  }
  currentButton = null;
});

dropdown.querySelector(".delete-btn").addEventListener("click", () => {
  if (
    confirm(
      translations[currentLang]?.confirm_delete || "Prompt wirklich löschen?"
    )
  ) {
    const folderId = dropdown.dataset.folderId;
    const promptIndex = parseInt(dropdown.dataset.promptIndex);
    chrome.storage.local.get(folderId, function (data) {
      const topic = data[folderId];
      if (topic && topic.prompts && topic.prompts[promptIndex]) {
        topic.prompts.splice(promptIndex, 1);
        chrome.storage.local.set({ [folderId]: topic }, () => {
          loadPromptsTable();
          if (dropdown.dataset.table === "folder") showFolder(folderId);
          else
            document.getElementById("folder-overlay").classList.remove("open");
        });
      }
    });
  }
  dropdown.style.display = "none";
  isDropdownOpen = false;
  if (currentButton) {
    if (currentButton.closest("tr") === hoveredRow) {
      keepActionButtonVisible(currentButton);
    } else {
      hideActionButton(currentButton);
    }
  }
  currentButton = null;
});

function handleActionButtonClick(event) {
  event.stopPropagation();
  const folder = event.currentTarget.closest("li.folder-item").dataset.folder;
  dropdown(event, folder);
}

// Beispiel für renameFolder und deleteFolder (passe sie an deine Logik an)
function renameFolder(oldName, newName) {
  chrome.storage.local.get(null, (data) => {
    const folderKey = `folder_${oldName}`;
    if (data[folderKey]) {
      const folderData = data[folderKey];
      chrome.storage.local.set({ [`folder_${newName}`]: folderData }, () => {
        chrome.storage.local.remove(folderKey, () => {
          loadFolders(); // Ordnerliste aktualisieren
        });
      });
    }
  });
}

function deleteFolder(folder) {
  chrome.storage.local.remove(`folder_${folder}`, () => {
    loadFolders(); // Ordnerliste aktualisieren
  });
}

// Global Functions
function updateSortButtonText() {
  const sortByKey = `sort_by_${sortState.sortBy}`;
  const sortOrderKey = `sort_${sortState.sortOrder}`;
  sortBtn.textContent = `${
    translations[currentLang]?.[sortByKey] || sortState.sortBy
  } (${translations[currentLang]?.[sortOrderKey] || sortState.sortOrder})`;
  // Update folder sort button text if in folder or category view
  if (
    navigationState.source === "folder" ||
    navigationState.source === "category"
  ) {
    folderSortBtn.textContent = `${
      translations[currentLang]?.[sortByKey] || sortState.sortBy
    } (${translations[currentLang]?.[sortOrderKey] || sortState.sortOrder})`;
  }
}

function updateSortDropdownSelection(dropdown = sortDropdown) {
  dropdown.querySelectorAll(".sort-option").forEach((option) => {
    option.classList.remove("selected");
    if (
      (option.dataset.sortOrder &&
        option.dataset.sortOrder === sortState.sortOrder) ||
      (option.dataset.sortBy && option.dataset.sortBy === sortState.sortBy)
    ) {
      option.classList.add("selected");
    }
  });
  updateSortButtonText();
}

function toggleSortDropdown() {
  if (isSortDropdownOpen) {
    sortDropdown.style.display = "none";
    isSortDropdownOpen = false;
  } else {
    const rect = sortBtn.getBoundingClientRect();
    sortDropdown.style.display = "flex";
    sortDropdown.style.top = `${rect.bottom + window.scrollY}px`;
    sortDropdown.style.left = `${rect.left + window.scrollX}px`;
    isSortDropdownOpen = true;
    updateSortDropdownSelection(sortDropdown);
  }
}

function toggleFolderSortDropdown() {
  if (isFolderSortDropdownOpen) {
    folderSortDropdown.style.display = "none";
    isFolderSortDropdownOpen = false;
  } else {
    const rect = folderSortBtn.getBoundingClientRect();
    folderSortDropdown.style.display = "flex";
    folderSortDropdown.style.top = `${rect.bottom + window.scrollY}px`;
    folderSortDropdown.style.left = `${rect.left + window.scrollX}px`;
    isFolderSortDropdownOpen = true;
    updateSortDropdownSelection(folderSortDropdown);
  }
}

function handleSortOptionClick(option) {
  const dropdown = option.closest(".sort-dropdown");
  if (option.dataset.sortOrder) {
    sortState.sortOrder = option.dataset.sortOrder;
  } else if (option.dataset.sortBy) {
    sortState.sortBy = option.dataset.sortBy;
  }
  dropdown.style.display = "none";
  if (dropdown.id === "sort-dropdown") {
    isSortDropdownOpen = false;
  } else if (dropdown.id === "folder-sort-dropdown") {
    isFolderSortDropdownOpen = false;
  }
  updateSortButtonText();
  // Refresh table based on context
  if (navigationState.source === "folder" && navigationState.folderId) {
    showFolder(navigationState.folderId);
  } else if (
    navigationState.source === "category" &&
    navigationState.category
  ) {
    showCategory(navigationState.category);
  } else {
    loadPromptsTable();
  }
}

function sortPrompts(prompts) {
  return prompts.sort((a, b) => {
    let aValue, bValue;
    if (sortState.sortBy === "title") {
      aValue = a.prompt.title.toLowerCase();
      bValue = b.prompt.title.toLowerCase();
    } else if (sortState.sortBy === "lastUsed") {
      aValue = a.prompt.lastUsed || 0;
      bValue = b.prompt.lastUsed || 0;
    }
    if (sortState.sortOrder === "ascending") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
}

function attachMainTableEvents() {
  document
    .querySelectorAll(".entry-table:not(.folder-entry-table) tr")
    .forEach((tr) => {
      const btn = tr.querySelector(".action-btn");
      if (btn) {
        tr.addEventListener("mouseenter", () => {
          hoveredRow = tr;
          keepActionButtonVisible(btn);
        });

        tr.addEventListener("mouseleave", () => {
          if (!isDropdownOpen || btn !== currentButton) {
            hideActionButton(btn);
          }
          hoveredRow = null;
        });

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleActionButtonClick(btn, tr);
        });
      }

      tr.addEventListener("click", (event) => {
        if (!event.target.classList.contains("action-btn")) {
          const folderId = tr.dataset.folderId;
          const promptIndex = parseInt(tr.dataset.promptIndex);
          navigationState = { source: "main", folderId: null };
          showPromptDetails(folderId, promptIndex);
        }
      });
    });
}

function attachFolderTableEvents() {
  document.querySelectorAll(".folder-entry-table tr").forEach((row) => {
    const actionBtn = row.querySelector(".action-btn");
    if (actionBtn) {
      row.addEventListener("mouseenter", () => {
        hoveredRow = row;
        keepActionButtonVisible(actionBtn);
      });

      row.addEventListener("mouseleave", () => {
        if (!isDropdownOpen || actionBtn !== currentButton) {
          hideActionButton(actionBtn);
        }
        hoveredRow = null;
      });

      actionBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleActionButtonClick(actionBtn, row);
      });
    }

    row.addEventListener("click", (event) => {
      if (!event.target.classList.contains("action-btn")) {
        const folderId = row.dataset.folderId;
        const promptIndex = parseInt(row.dataset.promptIndex);
        showPromptDetails(folderId, promptIndex);
        document.getElementById("folder-overlay").classList.remove("open");
      }
    });
  });
}

function showFolder(folderId) {
  const folderEntries = document.getElementById("folder-entries");
  const promptSearchInput = document.getElementById("prompt-search");
  folderEntries.innerHTML = "";

  chrome.storage.local.get(folderId, function (data) {
    const topic = data[folderId];
    if (!topic || !topic.prompts || !Array.isArray(topic.prompts)) {
      folderEntries.innerHTML =
        '<tr><td colspan="2">No prompts in this folder</td></tr>';
      promptSearchInput.style.display = "none";
      folderSortBtn.style.display = "none";
      folderSortDropdown.style.display = "none";
      return;
    }

    document.getElementById("folder-title").textContent = topic.name;
    promptSearchInput.style.display = "block";
    folderSortBtn.style.display = "block";

    function renderPrompts(prompts) {
      folderEntries.innerHTML = "";
      if (prompts.length === 0) {
        folderEntries.innerHTML =
          '<tr><td colspan="2">Keine Prompts gefunden</td></tr>';
        return;
      }
      prompts.forEach((prompt, index) => {
        const tr = document.createElement("tr");
        tr.dataset.entry = prompt.title;
        tr.dataset.folderId = folderId;
        tr.dataset.promptIndex = index;
        tr.innerHTML = `
          <td>${prompt.title}</td>
          <td class="action-cell">
            <button class="action-btn">⋮</button>
          </td>
        `;
        folderEntries.appendChild(tr);
      });
      attachFolderTableEvents();
    }

    let promptsWithDetails = topic.prompts.map((prompt, index) => ({
      prompt,
      folderId,
      index,
    }));
    promptsWithDetails = sortPrompts(promptsWithDetails);
    renderPrompts(promptsWithDetails.map(({ prompt }) => prompt));

    promptSearchInput.value = "";
    promptSearchInput.addEventListener("input", function () {
      const searchTerm = this.value.trim().toLowerCase();
      if (!searchTerm) {
        renderPrompts(topic.prompts);
        return;
      }
      const scoredPrompts = topic.prompts.map((prompt) => {
        const titleDistance = levenshteinDistance(
          prompt.title.toLowerCase(),
          searchTerm
        );
        const descriptionDistance = prompt.description
          ? levenshteinDistance(prompt.description.toLowerCase(), searchTerm)
          : Infinity;
        const contentDistance = levenshteinDistance(
          prompt.content.toLowerCase(),
          searchTerm
        );
        const minDistance = Math.min(
          titleDistance,
          descriptionDistance,
          contentDistance
        );
        return { prompt, distance: minDistance };
      });
      scoredPrompts.sort((a, b) => a.distance - b.distance);
      const filteredPrompts = scoredPrompts.map(({ prompt }) => prompt);
      renderPrompts(filteredPrompts);
    });

    document.getElementById("folder-overlay").classList.add("open");
    document.getElementById("side-nav").classList.remove("open");
    document.getElementById("plus-btn").style.display = "none";
    navigationState = { source: "folder", folderId: folderId };
  });
}

function showCategory(category) {
  const folderEntries = document.getElementById("folder-entries");
  const promptSearchInput = document.getElementById("prompt-search");
  folderEntries.innerHTML = "";

  chrome.storage.local.get(null, function (data) {
    let allPrompts = [];
    Object.entries(data).forEach(([id, topic]) => {
      if (topic.prompts && Array.isArray(topic.prompts)) {
        allPrompts = allPrompts.concat(
          topic.prompts.map((prompt, index) => ({
            prompt,
            folderId: id,
            index,
            isHidden: topic.isHidden || false,
            isTrash: topic.isTrash || false,
          }))
        );
      }
    });

    let filteredPrompts = [];
    let displayName = category;
    switch (category) {
      case "category_favorites":
        filteredPrompts = allPrompts.filter(({ prompt }) => prompt.isFavorite);
        displayName =
          translations[currentLang]?.category_favorites || "Favorites";
        break;
      case "category_all_prompts":
        filteredPrompts = allPrompts.filter(({ isTrash }) => !isTrash);
        displayName =
          translations[currentLang]?.category_all_prompts || "All Prompts";
        break;
      case "category_single_prompts":
        filteredPrompts = allPrompts.filter(({ folderId }) =>
          folderId.startsWith("single_prompt_")
        );
        displayName =
          translations[currentLang]?.category_single_prompts ||
          "Single Prompts";
        break;
      case "category_categorised_prompts":
        filteredPrompts = allPrompts.filter(
          ({ folderId }) =>
            !folderId.startsWith("single_prompt_") &&
            !folderId.startsWith("workflow_")
        );
        displayName =
          translations[currentLang]?.category_categorised_prompts ||
          "Categorised Prompts";
        break;
      case "category_dynamic_prompts":
        filteredPrompts = allPrompts.filter(
          ({ prompt }) =>
            prompt.type === "prompt-engineering" ||
            prompt.type === "meta-prompt"
        );
        displayName =
          translations[currentLang]?.category_dynamic_prompts ||
          "Dynamic Prompts";
        break;
      case "category_static_prompts":
        filteredPrompts = allPrompts.filter(
          ({ prompt }) =>
            prompt.type &&
            !["prompt-engineering", "meta-prompt"].includes(prompt.type)
        );
        displayName =
          translations[currentLang]?.category_static_prompts ||
          "Static Prompts";
        break;
      case "category_unused_prompts":
        filteredPrompts = allPrompts.filter(({ prompt }) => !prompt.lastUsed);
        displayName =
          translations[currentLang]?.category_unused_prompts ||
          "Unused Prompts";
        break;
      case "category_workflows":
        filteredPrompts = allPrompts.filter(({ folderId }) =>
          folderId.startsWith("workflow_")
        );
        displayName =
          translations[currentLang]?.category_workflows || "Workflows";
        break;
      case "category_trash":
        filteredPrompts = allPrompts.filter(({ isTrash }) => isTrash);
        displayName = translations[currentLang]?.category_trash || "Trash";
        break;
      default:
        filteredPrompts = [];
    }

    document.getElementById("folder-title").textContent = displayName;
    promptSearchInput.style.display =
      filteredPrompts.length > 0 ? "block" : "none";
    folderSortBtn.style.display = filteredPrompts.length > 0 ? "block" : "none";

    function renderPrompts(prompts) {
      folderEntries.innerHTML = "";
      if (prompts.length === 0) {
        folderEntries.innerHTML = `<tr><td colspan="2">${
          translations[currentLang]?.no_prompts_found ||
          "Keine Prompts gefunden"
        }</td></tr>`;
        return;
      }
      prompts.forEach(({ prompt, folderId, index }) => {
        const tr = document.createElement("tr");
        tr.dataset.entry = prompt.title;
        tr.dataset.folderId = folderId;
        tr.dataset.promptIndex = index;
        tr.innerHTML = `
          <td>${prompt.title}</td>
          <td class="action-cell">
            <button class="action-btn">⋮</button>
          </td>
        `;
        folderEntries.appendChild(tr);
      });
      attachFolderTableEvents();
    }

    filteredPrompts = sortPrompts(filteredPrompts);
    renderPrompts(filteredPrompts);

    promptSearchInput.value = "";
    promptSearchInput.addEventListener("input", function () {
      const searchTerm = this.value.trim().toLowerCase();
      if (!searchTerm) {
        renderPrompts(filteredPrompts);
        return;
      }
      const scoredPrompts = filteredPrompts.map(
        ({ prompt, folderId, index }) => {
          const titleDistance = levenshteinDistance(
            prompt.title.toLowerCase(),
            searchTerm
          );
          const descriptionDistance = prompt.description
            ? levenshteinDistance(prompt.description.toLowerCase(), searchTerm)
            : Infinity;
          const contentDistance = levenshteinDistance(
            prompt.content.toLowerCase(),
            searchTerm
          );
          const minDistance = Math.min(
            titleDistance,
            descriptionDistance,
            contentDistance
          );
          return { prompt, folderId, index, distance: minDistance };
        }
      );
      scoredPrompts.sort((a, b) => a.distance - b.distance);
      const searchedPrompts = scoredPrompts.map(
        ({ prompt, folderId, index }) => ({
          prompt,
          folderId,
          index,
        })
      );
      renderPrompts(searchedPrompts);
    });

    document.getElementById("folder-overlay").classList.add("open");
    document.getElementById("side-nav").classList.remove("open");
    document.getElementById("plus-btn").style.display = "none";
    navigationState = { source: "category", folderId: null, category };
  });
}

function loadPromptsTable() {
  const tableBody = document.querySelector(
    ".entry-table:not(.folder-entry-table) tbody"
  );
  tableBody.innerHTML = "";

  chrome.storage.local.get(null, function (data) {
    if (!data || Object.keys(data).length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="2">Keine Prompts vorhanden</td></tr>';
      return;
    }

    let allPrompts = [];
    Object.entries(data).forEach(([id, topic]) => {
      if (topic.prompts && Array.isArray(topic.prompts)) {
        allPrompts = allPrompts.concat(
          topic.prompts.map((prompt, index) => ({
            prompt,
            folderId: id,
            index,
            isHidden: topic.isHidden || false,
            isTrash: topic.isTrash || false,
          }))
        );
      }
    });

    if (allPrompts.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="2">Keine Prompts vorhanden</td></tr>';
    } else {
      allPrompts = sortPrompts(allPrompts.filter(({ isTrash }) => !isTrash));
      allPrompts.forEach(({ prompt, folderId, index }) => {
        const tr = document.createElement("tr");
        tr.dataset.entry = prompt.title;
        tr.dataset.folderId = folderId;
        tr.dataset.promptIndex = index;
        tr.innerHTML = `
          <td>${prompt.title}</td>
          <td class="action-cell">
            <button class="action-btn">⋮</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
    }
    attachMainTableEvents();
  });
}

function showPromptDetails(folderId, promptIndex) {
  chrome.storage.local.get(folderId, function (data) {
    const prompt = data[folderId]?.prompts?.[promptIndex];
    if (prompt) {
      const detailOverlay = document.getElementById("detail-overlay");
      const detailTitle = document.getElementById("detail-title");
      const entryTitle = document.getElementById("entry-title");
      const entryDescription = document.getElementById("entry-description");
      const entryContent = document.getElementById("entry-content");
      const entryType = document.getElementById("entry-type");
      const entryCompatible = document.getElementById("entry-compatible");
      const entryIncompatible = document.getElementById("entry-incompatible");
      const entryTags = document.getElementById("entry-tags");
      const tagInputGroup = document.getElementById("tag-input-group");
      const newTagInput = document.getElementById("new-tag");
      const addTagBtn = document.getElementById("add-tag-btn");
      const entryFavorite = document.getElementById("entry-favorite");
      const entryCreatedAt = document.getElementById("entry-created-at");
      const entryLastUsed = document.getElementById("entry-last-used");
      const entryLastModified = document.getElementById("entry-last-modified");
      const entryNotes = document.getElementById("entry-notes");
      const entryFolder = document.getElementById("entry-folder");

      detailTitle.textContent = prompt.title;
      entryTitle.value = prompt.title || "";
      entryDescription.value = prompt.description || "";
      entryContent.value = prompt.content || "";
      entryFavorite.checked = prompt.isFavorite || false;
      entryCreatedAt.value = prompt.createdAt
        ? new Date(prompt.createdAt).toLocaleDateString("de-DE")
        : "N/A";
      entryLastUsed.value = prompt.lastUsed
        ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
        : "N/A";
      entryLastModified.value = prompt.updatedAt
        ? new Date(prompt.updatedAt).toLocaleDateString("de-DE")
        : "N/A";
      entryNotes.value = prompt.notes || "";

      // Populate type dropdown
      entryType.value = prompt.type || "";

      // Populate compatible models
      entryCompatible.innerHTML = [
        "Grok",
        "Gemini",
        "ChatGPT",
        "Claude",
        "BlackBox",
        "GitHub Copilot",
        "Microsoft Copilot",
        "Mistral",
        "DuckDuckGo",
        "Perplexity",
        "DeepSeek",
        "Deepai",
        "Qwen AI",
      ]
        .map(
          (model) => `
          <label>
            <input type="checkbox" name="compatible" value="${model}" 
              ${
                prompt.compatibleModels?.includes(model) ? "checked" : ""
              } disabled>
            ${model}
          </label>
        `
        )
        .join("");

      // Populate incompatible models
      entryIncompatible.innerHTML = [
        "Grok",
        "Gemini",
        "ChatGPT",
        "Claude",
        "BlackBox",
        "GitHub Copilot",
        "Microsoft Copilot",
        "Mistral",
        "DuckDuckGo",
        "Perplexity",
        "DeepSeek",
        "Deepai",
        "Qwen AI",
      ]
        .map(
          (model) => `
          <label>
            <input type="checkbox" name="incompatible" value="${model}" 
              ${
                prompt.incompatibleModels?.includes(model) ? "checked" : ""
              } disabled>
            ${model}
          </label>
        `
        )
        .join("");

      // Populate tags
      chrome.storage.local.get("tags", (tagData) => {
        const storedTags = tagData.tags || [];
        entryTags.innerHTML = storedTags
          .map(
            (tag) => `
            <label>
              <input type="checkbox" name="tags" value="${tag}" 
                ${prompt.tags?.includes(tag) ? "checked" : ""} disabled>
              ${tag}
            </label>
          `
          )
          .join("");
      });

      // Populate folder dropdown
      entryFolder.innerHTML =
        '<option value="" data-i18n="folder_select"></option>';
      chrome.storage.local.get(null, function (data) {
        Object.entries(data).forEach(([id, topic]) => {
          if (
            topic.prompts &&
            Array.isArray(topic.prompts) &&
            !topic.isHidden &&
            !topic.isTrash
          ) {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = topic.name;
            if (id === folderId) option.selected = true;
            entryFolder.appendChild(option);
          }
        });
        applyTranslations(currentLang);
      });

      // Set readonly/disabled
      entryTitle.readOnly = true;
      entryDescription.readOnly = true;
      entryContent.readOnly = true;
      entryType.disabled = true;
      entryFavorite.disabled = true;
      entryCreatedAt.readOnly = true;
      entryLastUsed.readOnly = true;
      entryLastModified.readOnly = true;
      entryNotes.readOnly = true;
      entryFolder.disabled = true;
      newTagInput.readOnly = true;
      addTagBtn.disabled = true;
      tagInputGroup.style.display = "none";

      // Hide detail-actions initially
      document.querySelector(".detail-actions").style.display = "none";

      // Store folderId and promptIndex
      entryTitle.dataset.folderId = folderId;
      entryTitle.dataset.promptIndex = promptIndex;

      detailOverlay.classList.add("open");
      document.getElementById("plus-btn").style.display = "none";
    }
  });
}

function keepActionButtonVisible(button) {
  if (button) {
    button.style.visibility = "visible";
    button.style.opacity = "1";
  }
}

function hideActionButton(button) {
  if (button) {
    button.style.visibility = "hidden";
    button.style.opacity = "0";
  }
}

function handleActionButtonClick(btn, tr) {
  if (btn === currentButton && isDropdownOpen) {
    dropdown.style.display = "none";
    isDropdownOpen = false;
    if (hoveredRow === tr) keepActionButtonVisible(btn);
    else hideActionButton(btn);
    currentButton = null;
    return;
  }

  if (isDropdownOpen && currentButton && currentButton !== btn) {
    dropdown.style.display = "none";
    isDropdownOpen = false;
    if (currentButton && currentButton.closest("tr") !== hoveredRow) {
      hideActionButton(currentButton);
    }
  }

  currentButton = btn;
  isDropdownOpen = true;

  const rect = btn.getBoundingClientRect();
  dropdown.style.display = "flex";
  dropdown.style.visibility = "hidden";
  dropdown.style.top = "0px";
  dropdown.style.left = "0px";

  const dropdownHeight = dropdown.offsetHeight;
  const enoughSpaceBelow = rect.bottom + dropdownHeight < window.innerHeight;

  if (enoughSpaceBelow) {
    dropdown.style.top = `${rect.bottom + window.scrollY}px`;
  } else {
    dropdown.style.top = `${rect.top + window.scrollY - dropdownHeight}px`;
  }

  dropdown.style.left = `${rect.left + window.scrollX - 100}px`;
  dropdown.style.visibility = "visible";
  keepActionButtonVisible(btn);
  dropdown.dataset.folderId = tr.dataset.folderId;
  dropdown.dataset.promptIndex = tr.dataset.promptIndex;
  dropdown.dataset.table = tr
    .closest("table")
    .classList.contains("folder-entry-table")
    ? "folder"
    : "main";
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadFolders() {
  const folderList = document.querySelector(".folder-list");
  folderList.innerHTML = "";

  chrome.storage.local.get(null, function (data) {
    if (!data || Object.keys(data).length === 0) {
      folderList.innerHTML = "<li>No folders available</li>";
      updateFolderSearchVisibility();
      return;
    }

    const folders = Object.entries(data).filter(
      ([, topic]) =>
        topic.prompts &&
        Array.isArray(topic.prompts) &&
        !topic.isHidden &&
        !topic.isTrash
    );

    if (folders.length === 0) {
      folderList.innerHTML = "<li>No visible folders</li>";
    } else {
      folders.forEach(([id, topic]) => {
        const li = document.createElement("li");
        li.textContent = `📁 ${topic.name} (${topic.prompts.length})`;
        li.dataset.folderId = id;
        folderList.appendChild(li);
      });
    }
    updateFolderSearchVisibility();
    attachFolderClickEvents();
    attachCategoryClickEvents();
  });
}

function attachFolderClickEvents() {
  document.querySelectorAll(".folder-list li").forEach((folder) => {
    folder.addEventListener("click", () => {
      const folderId = folder.dataset.folderId;
      if (folderId) showFolder(folderId);
    });
  });
}

function attachCategoryClickEvents() {
  document.querySelectorAll(".accordion-content ul li").forEach((category) => {
    const categoryKey = category.getAttribute("data-i18n");
    if (categoryKey) {
      category.addEventListener("click", () => {
        showCategory(categoryKey);
      });
    }
  });
}

function updateFolderSearchVisibility() {
  const folderList = document.querySelector(".folder-list");
  const folderSearchInput = document.querySelector(".folder-search");
  const currentFolderItems = folderList.querySelectorAll("li");
  folderSearchInput.style.display =
    currentFolderItems.length > 5 ? "block" : "none";
}

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (translations[lang] && translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });
}

function exportDataToJSON() {
  chrome.storage.local.get(null, function (data) {
    if (!data || Object.keys(data).length === 0) {
      alert("No data to export!");
      return;
    }

    const exportData = {
      exportDate: Date.now(),
      folders: [],
      prompts: [],
      workflows: [],
      tags: data.tags || [],
    };

    Object.entries(data).forEach(([key, topic]) => {
      if (key.startsWith("folder_") || key.startsWith("hidden_folder_")) {
        exportData.folders.push({
          folderId: key,
          folderName: topic.name || "Unnamed Folder",
          isHidden: key.startsWith("hidden_folder_") || topic.isHidden || false,
          isTrash: topic.isTrash || false,
        });

        if (topic.prompts && Array.isArray(topic.prompts)) {
          topic.prompts.forEach((prompt) => {
            exportData.prompts.push({
              folderId: key,
              folderName: topic.name || "Unnamed Folder",
              isHidden:
                key.startsWith("hidden_folder_") || topic.isHidden || false,
              isTrash: topic.isTrash || false,
              prompt: {
                ...prompt,
                id:
                  prompt.id ||
                  `prompt_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                tags: Array.isArray(prompt.tags) ? prompt.tags : [],
              },
            });
          });
        }
      }

      if (
        key.startsWith("single_prompt_") &&
        topic.prompts &&
        Array.isArray(topic.prompts)
      ) {
        topic.prompts.forEach((prompt) => {
          exportData.prompts.push({
            folderId: key,
            folderName: topic.name || "Single Prompt",
            isHidden: topic.isHidden || false,
            isTrash: topic.isTrash || false,
            prompt: {
              ...prompt,
              id:
                prompt.id ||
                `prompt_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              tags: Array.isArray(prompt.tags) ? prompt.tags : [],
            },
          });
        });
      }

      if (key === "noFolderPrompts" && Array.isArray(topic)) {
        topic.forEach((prompt) => {
          exportData.prompts.push({
            folderId: "noFolderPrompts",
            folderName: "No Folder",
            isHidden: false,
            isTrash: false,
            prompt: {
              ...prompt,
              id:
                prompt.id ||
                `prompt_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              tags: Array.isArray(prompt.tags) ? prompt.tags : [],
            },
          });
        });
      }

      if (
        key.startsWith("workflow_") &&
        topic.steps &&
        Array.isArray(topic.steps)
      ) {
        exportData.workflows.push({
          workflowId: key,
          workflowName: topic.name || "Unnamed Workflow",
          steps: topic.steps,
          createdAt: topic.createdAt || Date.now(),
          tags: Array.isArray(topic.tags) ? topic.tags : [],
        });
      }
    });

    if (
      exportData.folders.length === 0 &&
      exportData.prompts.length === 0 &&
      exportData.workflows.length === 0 &&
      exportData.tags.length === 0
    ) {
      alert("No data to export!");
      return;
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `data_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Data exported successfully");
  });
}

function importDataFromJSON(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected!");
    return;
  }

  if (!file.name.endsWith(".json")) {
    alert("Please select a valid JSON file!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (
        !importedData.prompts ||
        !Array.isArray(importedData.prompts) ||
        !importedData.folders ||
        !Array.isArray(importedData.folders) ||
        !importedData.workflows ||
        !Array.isArray(importedData.workflows) ||
        !importedData.tags ||
        !Array.isArray(importedData.tags)
      ) {
        alert(
          "Invalid JSON structure: Required properties missing or invalid!"
        );
        return;
      }

      chrome.storage.local.get(null, function (existingData) {
        const updatedData = existingData || {};

        const existingTags = updatedData.tags || [];
        const newTags = [...new Set([...existingTags, ...importedData.tags])];
        updatedData.tags = newTags;

        importedData.folders.forEach((folder) => {
          const { folderId, folderName, isHidden, isTrash } = folder;
          if (!updatedData[folderId]) {
            updatedData[folderId] = {
              name: folderName || "Unnamed Folder",
              prompts: [],
              isHidden: isHidden || false,
              isTrash: isTrash || false,
            };
          } else {
            updatedData[folderId].name =
              updatedData[folderId].name || folderName || "Unnamed Folder";
            updatedData[folderId].isHidden =
              updatedData[folderId].isHidden !== undefined
                ? updatedData[folderId].isHidden
                : isHidden || false;
            updatedData[folderId].isTrash =
              updatedData[folderId].isTrash !== undefined
                ? updatedData[folderId].isTrash
                : isTrash || false;
            updatedData[folderId].prompts = updatedData[folderId].prompts || [];
          }
        });

        importedData.prompts.forEach((item) => {
          const { folderId, folderName, isHidden, isTrash, prompt } = item;
          if (!updatedData[folderId]) {
            updatedData[folderId] = {
              name: folderName || "Unnamed Folder",
              prompts: [],
              isHidden: isHidden || false,
              isTrash: isTrash || false,
            };
          }
          prompt.id =
            prompt.id ||
            `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          prompt.tags = Array.isArray(prompt.tags)
            ? prompt.tags.filter((tag) => newTags.includes(tag))
            : [];
          updatedData[folderId].prompts.push(prompt);
        });

        importedData.workflows.forEach((workflow) => {
          const { workflowId, workflowName, steps, createdAt, tags } = workflow;
          updatedData[workflowId] = {
            name: workflowName || "Unnamed Workflow",
            steps: steps || [],
            createdAt: createdAt || Date.now(),
            tags: Array.isArray(tags)
              ? tags.filter((tag) => newTags.includes(tag))
              : [],
          };
        });

        const noFolderPrompts = importedData.prompts
          .filter((item) => item.folderId === "noFolderPrompts")
          .map((item) => ({
            ...item.prompt,
            id:
              item.prompt.id ||
              `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            tags: Array.isArray(item.prompt.tags)
              ? item.prompt.tags.filter((tag) => newTags.includes(tag))
              : [],
          }));
        updatedData.noFolderPrompts = updatedData.noFolderPrompts
          ? [...updatedData.noFolderPrompts, ...noFolderPrompts]
          : noFolderPrompts;

        chrome.storage.local.set(updatedData, function () {
          if (chrome.runtime.lastError) {
            console.error("Error importing data:", chrome.runtime.lastError);
            alert("Error importing data. Please try again.");
          } else {
            console.log("Data imported successfully");
            loadPromptsTable();
            loadFolders();
            alert("Data imported successfully!");
          }
        });
      });
    } catch (error) {
      console.error("Error parsing JSON:", error);
      alert("Error parsing JSON file. Please check the file and try again.");
    }
  };
  reader.readAsText(file);
}

// DOMContentLoaded Event Listener
document.addEventListener("DOMContentLoaded", () => {
  async function loadTranslations(lang) {
    try {
      const response = await fetch(`i18n/${lang}.json`);
      if (!response.ok)
        throw new Error(`Fehler beim Laden der Übersetzungen für ${lang}`);
      translations[lang] = await response.json();
      applyTranslations(lang);
      updateSortButtonText(); // Initialize sort button text after translations are loaded
    } catch (error) {
      console.error(error);
      if (lang !== "de") loadTranslations("de"); // Fallback auf Deutsch
    }
  }

  // Übersicht öffnen
  overviewBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/app.html") });
  });

  // FAQ
  faqBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/faq.html") });
  });

  // Initiale Sprache laden
  loadTranslations(currentLang);
  document.getElementById("language-select").value = currentLang;

  // Sprachauswahl
  document.getElementById("language-select").addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("language", currentLang);
    loadTranslations(currentLang);
  });

  // Theme Initialization
  const savedTheme = localStorage.getItem("theme") || "system";
  const themeSelect = document.getElementById("theme-select");
  themeSelect.value = savedTheme;

  function applyTheme(theme) {
    document.body.classList.remove("light-theme", "dark-theme");
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
    } else if (theme === "light") {
      document.body.classList.add("light-theme");
    } else if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.body.classList.add(prefersDark ? "dark-theme" : "light-theme");
    }
    localStorage.setItem("theme", theme);
  }

  applyTheme(savedTheme);

  // Theme Selection
  themeSelect.addEventListener("change", (e) => {
    applyTheme(e.target.value);
  });

  // System Theme Listener
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (themeSelect.value === "system") applyTheme("system");
    });

  // Sort button click handler
  sortBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSortDropdown();
  });

  // Event listener for folder sort button
  folderSortBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFolderSortDropdown();
  });

  // Sort option click handlers for both dropdowns
  [sortDropdown, folderSortDropdown].forEach((dropdown) => {
    dropdown.querySelectorAll(".sort-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        handleSortOptionClick(option);
      });
    });
  });

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (
      sortDropdown &&
      !sortDropdown.contains(e.target) &&
      !e.target.classList.contains("sort-btn")
    ) {
      sortDropdown.style.display = "none";
      isSortDropdownOpen = false;
    }
    if (
      folderSortDropdown &&
      !folderSortDropdown.contains(e.target) &&
      !e.target.classList.contains("sort-btn")
    ) {
      folderSortDropdown.style.display = "none";
      isFolderSortDropdownOpen = false;
    }
  });

  // Burger Menu
  document.getElementById("burger-menu").addEventListener("click", () => {
    document.getElementById("side-nav").classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
    loadFolders();
  });

  document.getElementById("close-nav").addEventListener("click", () => {
    document.getElementById("side-nav").classList.remove("open");
    document.getElementById("plus-btn").style.display = "flex";
  });

  // Accordion Mechanik
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", (event) => {
      if (!event.target.classList.contains("add-folder-header-btn")) {
        const parentItem = header.parentElement;
        const content = header.nextElementSibling;
        parentItem.classList.toggle("open");
        content.classList.toggle("open");
      }
    });
  });

  // Add Folder Button
  document
    .querySelector(".add-folder-header-btn")
    .addEventListener("click", () => {
      const folderName = prompt("New Foldername:");
      if (folderName) {
        const folderId = generateUUID();
        const newFolder = {
          name: folderName,
          prompts: [],
          isHidden: false,
          isTrash: false,
        };
        chrome.storage.local.set({ [folderId]: newFolder }, () => {
          loadFolders();
        });
      }
    });

  // Folder Search
  const folderSearchInput = document.querySelector(".folder-search");
  folderSearchInput.addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const currentFolderItems = document.querySelectorAll(".folder-list li");
    currentFolderItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(filter) ? "" : "none";
    });
  });

  // Detail Overlay Buttons
  const backBtn = document.getElementById("back-btn");
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.querySelector(".save-btn");
  const cancelBtn = document.querySelector(".cancel-btn");

  backBtn.addEventListener("click", () => {
    document.getElementById("detail-overlay").classList.remove("open");
    document.getElementById("plus-btn").style.display = "flex";
    if (navigationState.source === "folder" && navigationState.folderId) {
      showFolder(navigationState.folderId);
    }
  });

  editBtn.addEventListener("click", () => {
    const entryCompatible = document.getElementById("entry-compatible");
    const entryIncompatible = document.getElementById("entry-incompatible");
    const entryTitle = document.getElementById("entry-title");
    const entryDescription = document.getElementById("entry-description");
    const entryContent = document.getElementById("entry-content");
    const entryNotes = document.getElementById("entry-notes");
    const entryType = document.getElementById("entry-type");
    const entryFavorite = document.getElementById("entry-favorite");
    const entryFolder = document.getElementById("entry-folder");
    const tagInputGroup = document.getElementById("tag-input-group");
    const newTagInput = document.getElementById("new-tag");
    const addTagBtn = document.getElementById("add-tag-btn");
    const entryTags = document.getElementById("entry-tags");

    entryTitle.readOnly = false;
    entryDescription.readOnly = false;
    entryContent.readOnly = false;
    entryNotes.readOnly = false;
    entryType.disabled = false;
    entryFavorite.disabled = false;
    entryFolder.disabled = false;
    newTagInput.readOnly = false;
    addTagBtn.disabled = false;
    tagInputGroup.style.display = "block";

    entryCompatible
      .querySelectorAll("input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.disabled = false;
      });

    entryIncompatible
      .querySelectorAll("input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.disabled = false;
      });

    entryTags.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
      checkbox.disabled = false;
    });

    document.querySelector(".detail-actions").style.display = "block";
    editBtn.textContent =
      translations[currentLang]?.finish_editing || "Bearbeitung beenden";
    editBtn.dataset.editing = "true";
  });

  // Add Overlay Buttons
  const backBtnAdd = document.getElementById("back-btn-add");
  const cancelBtnAdd = document.querySelector(".cancel-btn-add");

  backBtnAdd.addEventListener("click", () => {
    document.getElementById("add-overlay").classList.remove("open");
    document.getElementById("plus-btn").style.display = "flex";
    if (navigationState.source === "folder" && navigationState.folderId) {
      showFolder(navigationState.folderId);
    }
  });

  cancelBtnAdd.addEventListener("click", () => {
    document.getElementById("add-overlay").classList.remove("open");
    document.getElementById("plus-btn").style.display = "flex";
    if (navigationState.source === "folder" && navigationState.folderId) {
      showFolder(navigationState.folderId);
    }
  });

  saveBtn.addEventListener("click", () => {
    const title = document.getElementById("entry-title").value.trim();
    const description = document
      .getElementById("entry-description")
      .value.trim();
    const content = document.getElementById("entry-content").value.trim();
    const type = document.getElementById("entry-type").value;
    const isFavorite = document.getElementById("entry-favorite").checked;
    const folderId = document.getElementById("entry-title").dataset.folderId;
    const promptIndex = parseInt(
      document.getElementById("entry-title").dataset.promptIndex
    );
    const newFolderId = document.getElementById("entry-folder").value;
    const compatibleModels = Array.from(
      document.querySelectorAll(
        "#entry-compatible input[type='checkbox']:checked"
      )
    ).map((checkbox) => checkbox.value);
    const incompatibleModels = Array.from(
      document.querySelectorAll(
        "#entry-incompatible input[type='checkbox']:checked"
      )
    ).map((checkbox) => checkbox.value);
    const notes = document.getElementById("entry-notes").value.trim();
    const tags = Array.from(
      document.querySelectorAll("#entry-tags input[type='checkbox']:checked")
    ).map((checkbox) => checkbox.value);

    if (!title) {
      alert(translations[currentLang]?.required_title || "Title is required!");
      return;
    }

    if (!folderId) {
      const folderId = document.getElementById("entry-folder").value;
      if (!folderId) {
        alert(
          translations[currentLang]?.select_folder || "Please select a folder!"
        );
        return;
      }

      const promptObj = {
        title,
        description,
        content,
        type,
        tags,
        isFavorite,
        compatibleModels,
        incompatibleModels,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        updatedAt: Date.now(),
        notes,
        folderId,
        folderName:
          document.querySelector(`#entry-folder option[value="${folderId}"]`)
            ?.textContent || "Single Prompt",
        metaChangeLog: [],
      };

      chrome.storage.local.get(folderId, function (data) {
        const topic = data[folderId] || { name: "Unbekannt", prompts: [] };
        topic.prompts = topic.prompts || [];
        topic.prompts.push(promptObj);
        chrome.storage.local.set({ [folderId]: topic }, () => {
          document.getElementById("detail-overlay").classList.remove("open");
          document.getElementById("plus-btn").style.display = "flex";
          loadFolders();
          loadPromptsTable();
        });
      });
    } else {
      chrome.storage.local.get(folderId, function (data) {
        const topic = data[folderId];
        if (!topic || !topic.prompts || !topic.prompts[promptIndex]) {
          alert("Prompt nicht gefunden!");
          return;
        }

        const promptObj = {
          ...topic.prompts[promptIndex],
          title,
          description,
          content,
          type,
          isFavorite,
          compatibleModels,
          incompatibleModels,
          tags,
          lastUsed: Date.now(),
          updatedAt: Date.now(),
          notes,
        };

        if (newFolderId && newFolderId !== folderId) {
          topic.prompts.splice(promptIndex, 1);
          chrome.storage.local.set({ [folderId]: topic }, () => {
            chrome.storage.local.get(newFolderId, function (newData) {
              const newTopic = newData[newFolderId];
              newTopic.prompts.push(promptObj);
              chrome.storage.local.set({ [newFolderId]: newTopic }, () => {
                finalizeSave();
              });
            });
          });
        } else {
          topic.prompts[promptIndex] = promptObj;
          chrome.storage.local.set({ [folderId]: topic }, () => {
            finalizeSave();
          });
        }
      });

      function finalizeSave() {
        document.getElementById("detail-overlay").classList.remove("open");
        document.getElementById("plus-btn").style.display = "flex";
        loadFolders();
        loadPromptsTable();
      }
    }
  });

  cancelBtn.addEventListener("click", () => {
    const folderId = document.getElementById("entry-title").dataset.folderId;
    const promptIndex = parseInt(
      document.getElementById("entry-title").dataset.promptIndex
    );
    if (folderId && !isNaN(promptIndex)) {
      showPromptDetails(folderId, promptIndex);
    }
  });

  // Search Prompts
  document
    .getElementById("search-input")
    .addEventListener("input", function () {
      const searchTerm = this.value.trim().toLowerCase();
      const tableBody = document.querySelector(
        ".entry-table:not(.folder-entry-table) tbody"
      );
      tableBody.innerHTML = "";

      chrome.storage.local.get(null, function (data) {
        let filteredPrompts = [];

        if (data) {
          Object.entries(data).forEach(([id, topic]) => {
            if (topic.prompts && !topic.isTrash) {
              const filtered = topic.prompts
                .map((prompt, idx) => ({ prompt, idx }))
                .filter(({ prompt }) => {
                  return (
                    prompt.title.toLowerCase().includes(searchTerm) ||
                    (prompt.description &&
                      prompt.description.toLowerCase().includes(searchTerm)) ||
                    prompt.content.toLowerCase().includes(searchTerm)
                  );
                })
                .map(({ prompt, idx }) => ({
                  prompt,
                  folderId: id,
                  index: idx,
                  isHidden: topic.isHidden || false,
                  isTrash: topic.isTrash || false,
                }));

              filteredPrompts = filteredPrompts.concat(filtered);
            }
          });
        }

        if (filteredPrompts.length === 0) {
          tableBody.innerHTML =
            '<tr><td colspan="2">Keine Prompts gefunden</td></tr>';
        } else {
          filteredPrompts.forEach(({ prompt, folderId, index }) => {
            const tr = document.createElement("tr");
            tr.dataset.entry = prompt.title;
            tr.dataset.folderId = folderId;
            tr.dataset.promptIndex = index;
            tr.innerHTML = `
            <td>${prompt.title}</td>
            <td class="action-cell">
              <button class="action-btn">⋮</button>
            </td>
          `;
            tableBody.appendChild(tr);
          });
        }
        attachMainTableEvents();
      });
    });

  // Action Dropdown
  const dropdown = document.createElement("div");
  dropdown.classList.add("action-dropdown");
  dropdown.innerHTML = `
    <button class="copy-btn">Copy</button>
    <button class="rename-btn">Rename</button>
    <button class="delete-btn">Delete</button>
  `;
  document.body.appendChild(dropdown);

  dropdown.addEventListener("click", (e) => e.stopPropagation());

  dropdown.querySelector(".copy-btn").addEventListener("click", () => {
    const folderId = dropdown.dataset.folderId;
    const promptIndex = parseInt(dropdown.dataset.promptIndex);
    chrome.storage.local.get(folderId, function (data) {
      const prompt = data[folderId]?.prompts?.[promptIndex];
      if (prompt) {
        navigator.clipboard.writeText(prompt.content || prompt.title);
        alert(translations[currentLang]?.copied || "Prompt-Content copied!");
      }
    });
    dropdown.style.display = "none";
    isDropdownOpen = false;
    if (currentButton) {
      if (currentButton.closest("tr") === hoveredRow) {
        keepActionButtonVisible(currentButton);
      } else {
        hideActionButton(currentButton);
      }
    }
    currentButton = null;
  });

  dropdown.querySelector(".rename-btn").addEventListener("click", () => {
    const folderId = dropdown.dataset.folderId;
    const promptIndex = parseInt(dropdown.dataset.promptIndex);
    const newName = prompt(
      translations[currentLang]?.rename_prompt || "New prompt title:",
      dropdown.dataset.entry
    );
    if (newName) {
      chrome.storage.local.get(folderId, function (data) {
        const topic = data[folderId];
        if (topic && topic.prompts && topic.prompts[promptIndex]) {
          topic.prompts[promptIndex].title = newName;
          chrome.storage.local.set({ [folderId]: topic }, () => {
            loadPromptsTable();
            if (dropdown.dataset.table === "folder") showFolder(folderId);
          });
        }
      });
    }
    dropdown.style.display = "none";
    isDropdownOpen = false;
    if (currentButton) {
      if (currentButton.closest("tr") === hoveredRow) {
        keepActionButtonVisible(currentButton);
      } else {
        hideActionButton(currentButton);
      }
    }
    currentButton = null;
  });

  dropdown.querySelector(".delete-btn").addEventListener("click", () => {
    if (
      confirm(
        translations[currentLang]?.confirm_delete || "Prompt wirklich löschen?"
      )
    ) {
      const folderId = dropdown.dataset.folderId;
      const promptIndex = parseInt(dropdown.dataset.promptIndex);
      chrome.storage.local.get(folderId, function (data) {
        const topic = data[folderId];
        if (topic && topic.prompts && topic.prompts[promptIndex]) {
          topic.prompts.splice(promptIndex, 1);
          chrome.storage.local.set({ [folderId]: topic }, () => {
            loadPromptsTable();
            if (dropdown.dataset.table === "folder") showFolder(folderId);
            else
              document
                .getElementById("folder-overlay")
                .classList.remove("open");
          });
        }
      });
    }
    dropdown.style.display = "none";
    isDropdownOpen = false;
    if (currentButton) {
      if (currentButton.closest("tr") === hoveredRow) {
        keepActionButtonVisible(currentButton);
      } else {
        hideActionButton(currentButton);
      }
    }
    currentButton = null;
  });

  dropdown.addEventListener("mouseenter", () => {
    isMouseOverDropdown = true;
    if (currentButton) keepActionButtonVisible(currentButton);
  });

  dropdown.addEventListener("mouseleave", () => {
    isMouseOverDropdown = false;
    if (currentButton) {
      if (isDropdownOpen || currentButton.closest("tr") === hoveredRow) {
        keepActionButtonVisible(currentButton);
      } else {
        hideActionButton(currentButton);
      }
    }
  });

  // Tools Overlay
  const toolsIcon = document.getElementById("tools-icon");
  const toolsOverlay = document.getElementById("tools-overlay");
  const toolsBackBtn = document.getElementById("tools-back-btn");

  toolsIcon.addEventListener("click", () => {
    toolsOverlay.classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
  });

  toolsBackBtn.addEventListener("click", () => {
    toolsOverlay.classList.remove("open");
    document.getElementById("plus-btn").style.display = "flex";
  });

  // Settings Overlay
  const settingsIcon = document.getElementById("settings-icon");
  const settingsOverlay = document.getElementById("settings-overlay");
  const settingsBackBtn = document.getElementById("settings-back-btn");

  settingsIcon.addEventListener("click", () => {
    settingsOverlay.classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
  });

  settingsBackBtn.addEventListener("click", () => {
    settingsOverlay.classList.remove("open");
    document.getElementById("plus-btn").style.display = "flex";
  });

  // Prompt Import/Export
  document.getElementById("import-prompt-btn").addEventListener("click", () => {
    importInput.click();
  });

  document.getElementById("export-prompt-btn").addEventListener("click", () => {
    exportDataToJSON();
  });

  // Verstecktes Input-Element für Datei-Auswahl erstellen
  const importInput = document.createElement("input");
  importInput.type = "file";
  importInput.accept = ".json";
  importInput.style.display = "none";
  importInput.addEventListener("change", importDataFromJSON);
  document.body.appendChild(importInput);

  // Highlight Text Section
  const toggle = document.getElementById("highlight-toggle");

  chrome.storage.local.get(["enabled", "savedTexts"], (result) => {
    toggle.checked = result.enabled || false;
  });

  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ enabled: toggle.checked });
  });

  // Delete Data
  document.getElementById("delete-data-btn").addEventListener("click", () => {
    if (
      confirm(
        translations[currentLang]?.confirm_delete_all ||
          "Möchten Sie wirklich alle Daten löschen?"
      )
    ) {
      chrome.storage.local.clear(() => {
        alert(
          translations[currentLang]?.data_deleted || "Daten wurden gelöscht."
        );
        loadFolders();
        loadPromptsTable();
      });
    }
  });

  // Feedback, Feature Request, Review
  document.getElementById("feedback-btn").addEventListener("click", () => {
    window.open("https://forms.gle/9fN4XeUbhFL1xsyx8", "_blank");
  });

  document
    .getElementById("feature-request-btn")
    .addEventListener("click", () => {
      window.open("https://forms.gle/5EM4tPz9b7d1p6iB7", "_blank");
    });

  document.getElementById("review-btn").addEventListener("click", () => {
    window.open(
      "https://chromewebstore.google.com/detail/promptin-ai-prompt-manage/pbfmkjjnmjfjlebpfcndpdhofoccgkje/reviews",
      "_blank"
    );
  });

  // Folder Overlay Back Button
  document.getElementById("folder-back-btn").addEventListener("click", () => {
    document.getElementById("folder-overlay").classList.remove("open");
    document.getElementById("side-nav").classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
    navigationState = { source: "main", folderId: null, category: null };
  });

  // Plus Button (Create New Prompt)
  document.getElementById("plus-btn").addEventListener("click", () => {
    const detailOverlay = document.getElementById("add-overlay");
    const detailTitle = document.getElementById("detail-title-add");
    const entryTitle = document.getElementById("entry-title-add");
    const entryDescription = document.getElementById("entry-description-add");
    const entryContent = document.getElementById("entry-content-add");
    const entryNotes = document.getElementById("entry-notes-add");
    const entryType = document.getElementById("entry-type-add");
    const entryCompatible = document.getElementById("entry-compatible-add");
    const entryIncompatible = document.getElementById("entry-incompatible-add");
    const entryTags = document.getElementById("entry-tags-add");
    const tagInputGroup = document.getElementById("tag-input-group");
    const newTagInput = document.getElementById("new-tag_add");
    const addTagBtn = document.getElementById("add-tag-btn-add");
    const entryFavorite = document.getElementById("entry-favorite");
    const entryFolder = document.getElementById("entry-folder-add");

    detailTitle.textContent =
      translations[currentLang]?.new_prompt || "Neuer Prompt";
    entryTitle.value = "";
    entryDescription.value = "";
    entryContent.value = "";
    entryNotes.value = "";
    entryType.value = "";
    entryCompatible
      .querySelectorAll("input")
      .forEach((input) => (input.checked = false));
    entryIncompatible
      .querySelectorAll("input")
      .forEach((input) => (input.checked = false));
    entryFavorite.checked = false;
    entryFolder.innerHTML = '<option value="">Ordner auswählen</option>';

    // Populate tags
    chrome.storage.local.get("tags", (tagData) => {
      console.log("Geladene Tags:", tagData.tags); // Debugging
      const storedTags = Array.isArray(tagData.tags) ? tagData.tags : [];
      if (storedTags.length === 0) {
        entryTags.innerHTML = '<p data-i18n="no_tags">Keine Tags vorhanden</p>';
      } else {
        entryTags.innerHTML = storedTags
          .map(
            (tag) => `
          <label>
            <input type="checkbox" name="tags" value="${tag}">
            ${tag}
          </label>
        `
          )
          .join("");
      }
      applyTranslations(currentLang); // Übersetzungen nach dem Rendern anwenden
    });

    // Populate folders
    chrome.storage.local.get(null, function (data) {
      Object.entries(data).forEach(([id, topic]) => {
        if (
          topic.prompts &&
          Array.isArray(topic.prompts) &&
          !topic.isHidden &&
          !topic.isTrash
        ) {
          const option = document.createElement("option");
          option.value = id;
          option.textContent = topic.name;
          entryFolder.appendChild(option);
        }
      });
      applyTranslations(currentLang);
    });

    // Enable all inputs
    entryTitle.readOnly = false;
    entryDescription.readOnly = false;
    entryContent.readOnly = false;
    entryNotes.readOnly = false;
    entryType.disabled = false;
    entryFavorite.disabled = false;
    entryFolder.disabled = false;
    document.querySelector(".detail-actions").style.display = "flex";
    entryTitle.removeAttribute("data-folderId");
    entryTitle.removeAttribute("data-promptIndex");
    navigationState = { source: "main", folderId: null };
    detailOverlay.classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
  });

  // Populate folders for entry-folder-add
  chrome.storage.local.get(null, function (data) {
    const entryFolderAdd = document.getElementById("entry-folder-add");
    // Reset options, preserve the placeholder
    entryFolderAdd.innerHTML =
      '<option value="" data-i18n="folder_select">Ordner auswählen</option>';
    Object.entries(data).forEach(([id, topic]) => {
      if (
        topic.prompts &&
        Array.isArray(topic.prompts) &&
        !topic.isHidden &&
        !topic.isTrash
      ) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = topic.name;
        entryFolderAdd.appendChild(option);
      }
    });
  });

  document.getElementById("add-tag-btn_add").addEventListener("click", () => {
    const newTagInput = document.getElementById("new-tag_add");
    const newTag = newTagInput.value.trim();
    const entryTags = document.getElementById("entry-tags-add"); // angepasst: Zielcontainer für die Checkboxen
    const existingTags = Array.from(
      entryTags.querySelectorAll("input[type='checkbox']")
    ).map((cb) => cb.value);

    if (newTag && !existingTags.includes(newTag)) {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" name="tags" value="${newTag}" checked> ${newTag}`;
      entryTags.appendChild(label);

      chrome.storage.local.get("tags", (tagData) => {
        const storedTags = tagData.tags || [];
        if (!storedTags.includes(newTag)) {
          storedTags.push(newTag);
          chrome.storage.local.set({ tags: storedTags }, () => {
            console.log(`Tag "${newTag}" saved to chrome.storage.local`);
          });
        }
      });

      newTagInput.value = "";
    } else if (!newTag) {
      alert(
        translations?.[currentLang]?.tag_empty || "Tag darf nicht leer sein!"
      );
    }
  });

  document.querySelector(".save-btn-add").addEventListener("click", () => {
    // Eingabefelder auslesen
    const title = document.getElementById("entry-title-add").value.trim();
    const description = document
      .getElementById("entry-description-add")
      .value.trim();
    const content = document.getElementById("entry-content-add").value.trim();
    const notes = document.getElementById("entry-notes-add").value.trim();
    const type = document.getElementById("entry-type-add").value;
    const compatibleModels = Array.from(
      document
        .getElementById("entry-compatible-add")
        .querySelectorAll("input:checked")
    ).map((input) => input.value);
    const incompatibleModels = Array.from(
      document
        .getElementById("entry-incompatible-add")
        .querySelectorAll("input:checked")
    ).map((input) => input.value);
    const tags = Array.from(
      document
        .getElementById("entry-tags-add")
        .querySelectorAll("input:checked")
    ).map((input) => input.value);
    const isFavorite = document.getElementById("entry-favorite-add").checked;
    const folderId = document.getElementById("entry-folder-add").value;
    const folderName = folderId
      ? document.getElementById("entry-folder-add").selectedOptions[0]
          ?.textContent
      : null;

    // Validierung: Titel und Ordner sind Pflichtfelder
    if (!title) {
      alert(
        translations[currentLang]?.title_required || "Titel ist erforderlich!"
      );
      return;
    }
    if (!content) {
      alert(
        translations[currentLang]?.content_required ||
          "Bitte geben sie eine Prompt ein!"
      );
      return;
    }

    // Neues Prompt-Objekt mit der neuen Datenstruktur erstellen
    const newPrompt = {
      title,
      description,
      content,
      type,
      compatibleModels,
      incompatibleModels,
      tags,
      isFavorite,
      folderId: folderId || null,
      folderName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      lastUsed: null,
      notes,
      versions: [
        {
          versionId: generateUUID(),
          title,
          description,
          content,
          timestamp: Date.now(),
        },
      ],
      metaChangeLog: [
        {
          timestamp: Date.now(),
          changes: {
            title: { from: null, to: title },
            description: { from: null, to: description },
            content: { from: null, to: content },
            type: { from: null, to: type },
            compatibleModels: { from: [], to: compatibleModels },
            incompatibleModels: { from: [], to: incompatibleModels },
            tags: { from: [], to: tags },
            isFavorite: { from: false, to: isFavorite },
            folderId: { from: null, to: folderId || null },
            folderName: { from: null, to: folderName },
            notes: { from: null, to: notes },
          },
        },
      ],
      performanceHistory: [],
    };

    // Prompt in den ausgewählten Ordner speichern
    chrome.storage.local.get(folderId, (data) => {
      const folder = data[folderId] || {
        name: folderName || "",
        prompts: [],
        isHidden: false,
        isTrash: false,
      };
      folder.prompts = Array.isArray(folder.prompts) ? folder.prompts : [];
      folder.prompts.push(newPrompt);

      // Speichern in chrome.storage.local
      chrome.storage.local.set({ [folderId]: folder }, () => {
        console.log(`Prompt "${title}" in Ordner "${folderId}" gespeichert`);

        // Overlay schließen und UI zurücksetzen
        document.getElementById("add-overlay").classList.remove("open");
        document.getElementById("plus-btn").style.display = "flex";

        // Ordneransicht aktualisieren, falls der Ordner geöffnet ist
        if (
          navigationState.source === "folder" &&
          navigationState.folderId === folderId
        ) {
          showFolder(folderId);
        }

        // Folders und Prompts-Tabelle aktualisieren
        loadFolders();
        loadPromptsTable();
      });
    });
  });

  // Save New Prompt
  saveBtn.addEventListener("click", (e) => {
    if (!document.getElementById("entry-title").dataset.folderId) {
      const title = document.getElementById("entry-title").value.trim();
      const description = document
        .getElementById("entry-description")
        .value.trim();
      const content = document.getElementById("entry-content").value.trim();
      const type = document.getElementById("entry-type").value;
      const newTag = document.getElementById("new-tag").value.trim();
      const isFavorite = document.getElementById("entry-favorite").checked;
      const folderId = document.getElementById("entry-folder").value;
      const compatibleModels = Array.from(
        document.querySelectorAll(
          "#entry-compatible input[name='compatible']:checked"
        )
      ).map((checkbox) => checkbox.value);
      const incompatibleModels = Array.from(
        document.querySelectorAll(
          "#entry-incompatible input[name='incompatible']:checked"
        )
      ).map((checkbox) => checkbox.value);
      const tags = Array.from(
        document.querySelectorAll("#entry-tags input[name='tags']:checked")
      ).map((checkbox) => checkbox.value);

      if (!title) {
        alert(
          translations[currentLang]?.required_title || "Title is required!"
        );
        return;
      }

      if (!folderId) {
        alert(
          translations[currentLang]?.select_folder || "Please select a folder!"
        );
        return;
      }

      const promptObj = {
        title,
        description,
        content,
        type,
        tags: newTag ? [...tags, newTag] : tags,
        isFavorite,
        compatibleModels,
        incompatibleModels,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        updatedAt: Date.now(),
        folderId,
        folderName:
          document.querySelector(`#entry-folder option[value="${folderId}"]`)
            ?.textContent || "Single Prompt",
        metaChangeLog: [],
      };

      chrome.storage.local.get(folderId, function (data) {
        const topic = data[folderId] || { name: "Unbekannt", prompts: [] };
        topic.prompts = topic.prompts || [];
        topic.prompts.push(promptObj);
        chrome.storage.local.set({ [folderId]: topic }, () => {
          document.getElementById("detail-overlay").classList.remove("open");
          document.getElementById("plus-btn").style.display = "flex";
          loadFolders();
          loadPromptsTable();
        });
      });
    }
  });

  document.getElementById("add-tag-btn").addEventListener("click", () => {
    const newTagInput = document.getElementById("new-tag");
    const newTag = newTagInput.value.trim();
    const entryTags = document.getElementById("entry-tags");
    const existingTags = Array.from(
      entryTags.querySelectorAll("input[type='checkbox']")
    ).map((cb) => cb.value);

    if (newTag && !existingTags.includes(newTag)) {
      const label = document.createElement("label");
      label.innerHTML = `<input type="checkbox" name="tags" value="${newTag}" checked> ${newTag}`;
      entryTags.appendChild(label);

      chrome.storage.local.get("tags", (tagData) => {
        const storedTags = tagData.tags || [];
        if (!storedTags.includes(newTag)) {
          storedTags.push(newTag);
          chrome.storage.local.set({ tags: storedTags }, () => {
            console.log(`Tag "${newTag}" saved to chrome.storage.local`);
          });
        }
      });

      newTagInput.value = "";
    } else if (!newTag) {
      alert(
        translations[currentLang]?.tag_empty || "Tag darf nicht leer sein!"
      );
    }
  });

  // Initial Load
  loadFolders();
  loadPromptsTable();
});
