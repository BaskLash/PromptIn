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
let currentLang = "";
let isSortDropdownOpen = false;
let isFolderSortDropdownOpen = false;
let currentButton = null;
let isDropdownOpen = false;
let isMouseOverDropdown = false;
let hoveredRow = null;

// Global Functions
function updateSortButtonText() {
  const sortKeyMap = {
    lastUsed: "last_used",
    title: "title",
    ascending: "ascending",
    descending: "descending",
  };

  const sortByKey = `sort_by_${
    sortKeyMap[sortState.sortBy] || sortState.sortBy
  }`;
  const sortOrderKey = `sort_${
    sortKeyMap[sortState.sortOrder] || sortState.sortOrder
  }`;

  const sortByText =
    translations[currentLang]?.[sortByKey] ||
    translations["de"]?.[sortByKey] || // Fallback to German
    sortState.sortBy; // Fallback to raw sortBy value
  const sortOrderText =
    translations[currentLang]?.[sortOrderKey] ||
    translations["de"]?.[sortOrderKey] || // Fallback to German
    sortState.sortOrder; // Fallback to raw sortOrder value

  console.log(
    `Updating sort button: Lang=${currentLang}, sortByKey=${sortByKey}, sortOrderKey=${sortOrderKey}, sortByText=${sortByText}, sortOrderText=${sortOrderText}`
  ); // Debugging

  sortBtn.textContent = `${sortByText} (${sortOrderText})`;

  // Always update folderSortBtn to ensure consistency
  folderSortBtn.textContent = `${sortByText} (${sortOrderText})`;
}

function updateDropdownTranslations(dropdown, prompt) {
  const favoritBtn = dropdown.querySelector(".favorit-btn");
  favoritBtn.textContent = prompt?.isFavorite
    ? translations[currentLang]?.remove_from_favorites ||
      "Remove from Favorites"
    : translations[currentLang]?.add_to_favorites || "Add to Favorites";

  const shareBtn = dropdown.querySelector(".share-btn");
  shareBtn.textContent = translations[currentLang]?.share || "Share";

  const copyBtn = dropdown.querySelector(".copy-btn");
  copyBtn.textContent = translations[currentLang]?.copy || "Copy";

  const renameBtn = dropdown.querySelector(".rename-btn");
  renameBtn.textContent = translations[currentLang]?.rename || "Rename";

  const restoreBtn = dropdown.querySelector(".restore-btn");
  if (restoreBtn) {
    restoreBtn.textContent =
      translations[currentLang]?.restore_prompt || "Restore Prompt";
  }

  const trashBtn = dropdown.querySelector(".trash-btn");
  const deleteBtn = dropdown.querySelector(".delete-btn");

  if (navigationState.category === "category_trash") {
    if (trashBtn) {
      const newDeleteBtn = document.createElement("button");
      newDeleteBtn.classList.add("delete-btn");
      newDeleteBtn.textContent =
        translations[currentLang]?.delete_permanently || "Delete Permanently";

      trashBtn.replaceWith(newDeleteBtn);
    } else if (deleteBtn) {
      deleteBtn.textContent =
        translations[currentLang]?.delete_permanently || "Delete Permanently";
    }

    // Restore sichtbar machen
    if (restoreBtn) {
      restoreBtn.style.display = "inline-block";
      restoreBtn.textContent =
        translations[currentLang]?.restore_prompt || "Restore Prompt";
    }
  } else {
    // Restore ausblenden
    if (restoreBtn) {
      restoreBtn.style.display = "none";
    }

    if (deleteBtn) {
      const newTrashBtn = document.createElement("button");
      newTrashBtn.classList.add("trash-btn");
      newTrashBtn.textContent =
        translations[currentLang]?.move_to_trash || "Move to Trash";
      deleteBtn.replaceWith(newTrashBtn);
    } else if (trashBtn) {
      trashBtn.textContent =
        translations[currentLang]?.move_to_trash || "Move to Trash";
    }
  }
}

// Ensure dataset attributes are set in loadPromptsTable
function loadPromptsTable() {
  const tableBody = document.querySelector(
    ".entry-table:not(.folder-entry-table) tbody"
  );
  tableBody.innerHTML = "";

  chrome.storage.local.get(["prompts", "folders"], function (data) {
    const promptsData = data.prompts || {};
    const foldersData = data.folders || {};

    const allPromptEntries = Object.entries(promptsData)
      .filter(([, prompt]) => !prompt.isTrash)
      .map(([promptId, prompt]) => ({
        promptId,
        prompt,
        folderId: prompt.folderId || null,
        folderName:
          (prompt.folderId && foldersData[prompt.folderId]?.name) ||
          "No Folder",
      }));

    if (allPromptEntries.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="2">Keine Prompts vorhanden</td></tr>';
    } else {
      const sortedPrompts = sortPrompts(allPromptEntries);
      sortedPrompts.forEach(({ prompt, promptId, folderId, folderName }) => {
        const tr = document.createElement("tr");
        tr.dataset.entry = prompt.title;
        tr.dataset.promptId = promptId;
        tr.dataset.folderId = folderId || "";
        tr.dataset.folderName = folderName;
        tr.innerHTML = `
          <td>${prompt.title}</td>
          <td class="action-cell">
            <button class="action-btn">⋮</button>
          </td>
        `;
        tableBody.appendChild(tr);
        console.log(
          `Prompt Row: ID=${promptId}, FolderID=${folderId}, FolderName=${folderName}, Title=${prompt.title}`
        );
      });
    }

    attachMainTableEvents();
  });
}

// Prompt in Detail Mode
function showPromptDetails(promptId) {
  console.log(`showPromptDetails called with PromptID=${promptId}`);

  chrome.storage.local.get(
    ["prompts", "folders", "tags", "types"],
    function (data) {
      const prompts = data.prompts || {};
      const folders = data.folders || {};
      const tags = data.tags || {};
      const allTypes = Array.isArray(data.types) ? data.types : [];

      const prompt = prompts[promptId];
      if (!prompt) {
        console.error(`Prompt with ID ${promptId} not found!`);
        return;
      }

      const detailOverlay = document.getElementById("detail-overlay");
      const editBtn = document.getElementById("edit-btn");
      const saveBtnEdit = document.querySelector(".save-btn-edit");
      saveBtnEdit.dataset.promptId = promptId;

      // Track edit mode state internally
      let isEditMode = false;

      function renderView(isEdit = false) {
        const entryTitle = document.getElementById("entry-title");
        const entryDescription = document.getElementById("entry-description");
        const entryContent = document.getElementById("entry-content");
        const entryTypes = document.getElementById("entry-types");
        const entryCompatible = document.getElementById("entry-compatible");
        const entryIncompatible = document.getElementById("entry-incompatible");
        const entryTags = document.getElementById("entry-tags");
        const tagInputGroup = document.getElementById("tag-input-group");
        const newTagInput = document.getElementById("new-tag");
        const addTagBtn = document.getElementById("add-tag-btn");
        const entryFavorite = document.getElementById("entry-favorite");
        const entryCreatedAt = document.getElementById("entry-created-at");
        const entryLastUsed = document.getElementById("entry-last-used");
        const entryLastModified = document.getElementById(
          "entry-last-modified"
        );
        const entryNotes = document.getElementById("entry-notes");
        const entryFolder = document.getElementById("entry-folder");
        const detailTitle = document.getElementById("detail-title");

        // Basic content
        detailTitle.textContent = prompt.title;
        entryTitle.value = prompt.title || "";
        entryDescription.value = prompt.description || "";
        entryContent.value = prompt.content || "";
        entryNotes.value = prompt.notes || "";

        // Zuerst aufräumen (alte Variablenfelder entfernen, falls vorhanden)
        const oldLabel = document.getElementById("variables-label");
        const oldTextarea = document.getElementById("variables-textarea");
        if (oldLabel) oldLabel.remove();
        if (oldTextarea) oldTextarea.remove();

        if (/\{\{[^}]+\}\}/.test(prompt.content)) {
          const matches = prompt.content.match(/\{\{([^}]+)\}\}/g) || [];
          const variables = matches.map((v) => v.replace(/\{\{|\}\}/g, ""));

          // JSON-Objekt bauen
          const jsonObj = {};
          variables.forEach((v) => {
            jsonObj[v] = "";
          });

          // Label erzeugen
          const label = document.createElement("label");
          label.textContent = "Variables (JSON)";
          label.id = "variables-label"; // eindeutige ID, damit wir es später entfernen können

          // Textarea erzeugen
          const textarea = document.createElement("textarea");
          textarea.readOnly = true;
          textarea.id = "variables-textarea"; // eindeutige ID
          textarea.value = JSON.stringify(jsonObj, null, 2);

          // Direkt nach entryContent einfügen (Label zuerst, dann Textarea)
          entryContent.insertAdjacentElement("afterend", textarea);
          entryContent.insertAdjacentElement("afterend", label);
        }

        // Favorite
        entryFavorite.checked = !!prompt.isFavorite;

        // Types
        const selectedTypes = Array.isArray(prompt.types) ? prompt.types : [];
        if (isEdit) {
          entryTypes.innerHTML =
            `<option value="" selected>${
              translations[currentLang]?.type_placeholder ||
              "Bitte Typ auswählen"
            }</option>` +
            allTypes
              .map(
                (t) =>
                  `<option value="${t}" ${
                    selectedTypes.includes(t) ? "selected" : ""
                  }>${t}</option>`
              )
              .join("");
          document.getElementById("type-input-group").style.display = "block";
          entryTypes.disabled = false;
        } else {
          entryTypes.innerHTML = selectedTypes.length
            ? selectedTypes
                .map((t) => `<option selected disabled>${t}</option>`)
                .join("")
            : `<option value="">${
                translations[currentLang]?.type_placeholder ||
                "Bitte Typ auswählen"
              }</option>`;
          document.getElementById("type-input-group").style.display = "none";
          entryTypes.disabled = true;
        }

        // Tags
        const selectedTags = Array.isArray(prompt.tags) ? prompt.tags : [];
        const allTagValues = Object.values(tags);
        if (isEdit) {
          entryTags.innerHTML = allTagValues
            .map(
              (tag) =>
                `<label><input type="checkbox" value="${tag}" ${
                  selectedTags.includes(tag) ? "checked" : ""
                }> ${tag}</label>`
            )
            .join(" ");
          tagInputGroup.style.display = "block";
          newTagInput.readOnly = false;
          addTagBtn.disabled = false;
        } else {
          entryTags.innerHTML = selectedTags.length
            ? selectedTags
                .map((tag) => `<span class="readonly-pill">${tag}</span>`)
                .join(" ")
            : `<p style="font-style: italic; color: gray;">${translations[currentLang]?.this_prompt_no_tags}</p>`;
          tagInputGroup.style.display = "none";
        }

        // Compatible / Incompatible models
        const modelList = [
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
        ];
        const compatible = prompt.compatibleModels || [];
        const incompatible = prompt.incompatibleModels || [];
        if (isEdit) {
          entryCompatible.innerHTML = modelList
            .map(
              (m) =>
                `<label><input type="checkbox" value="${m}" ${
                  compatible.includes(m) ? "checked" : ""
                }> ${m}</label>`
            )
            .join(" ");
          entryIncompatible.innerHTML = modelList
            .map(
              (m) =>
                `<label><input type="checkbox" value="${m}" ${
                  incompatible.includes(m) ? "checked" : ""
                }> ${m}</label>`
            )
            .join(" ");
        } else {
          entryCompatible.innerHTML = compatible.length
            ? compatible
                .map((m) => `<span class="readonly-pill">${m}</span>`)
                .join(" ")
            : `<p style="font-style: italic; color: gray;">${translations[currentLang]?.no_match_with_compatible_modell}</p>`;
          entryIncompatible.innerHTML = incompatible.length
            ? incompatible
                .map((m) => `<span class="readonly-pill">${m}</span>`)
                .join(" ")
            : `<p style="font-style: italic; color: gray;">${translations[currentLang]?.no_match_with_incompatible_modell}</p>`;
        }

        // Dates
        entryCreatedAt.value = prompt.createdAt
          ? new Date(prompt.createdAt).toLocaleDateString("de-DE")
          : "Not available";
        entryLastUsed.value = prompt.lastUsed
          ? new Date(prompt.lastUsed).toLocaleDateString("de-DE")
          : "Never used";
        entryLastModified.value = prompt.updatedAt
          ? new Date(prompt.updatedAt).toLocaleDateString("de-DE")
          : "Not available";

        // Folder
        entryFolder.innerHTML =
          '<option value="">Not assigned to any folder</option>';
        Object.entries(folders).forEach(([fid, folder]) => {
          const option = document.createElement("option");
          option.value = fid;
          option.textContent = folder.name || "Unnamed folder";
          if (prompt.folderId === fid) option.selected = true;
          entryFolder.appendChild(option);
        });

        // Toggle readonly / editable
        const readonly = !isEdit;
        entryTitle.readOnly = readonly;
        entryDescription.readOnly = readonly;
        entryContent.readOnly = readonly;
        entryNotes.readOnly = readonly;
        entryFolder.disabled = readonly;
        entryFavorite.disabled = readonly;

        entryCompatible
          .querySelectorAll("input[type='checkbox']")
          .forEach((cb) => (cb.disabled = readonly));
        entryIncompatible
          .querySelectorAll("input[type='checkbox']")
          .forEach((cb) => (cb.disabled = readonly));
        entryTags
          .querySelectorAll("input[type='checkbox']")
          .forEach((cb) => (cb.disabled = readonly));

        document.querySelector(".detail-actions").style.display = isEdit
          ? "flex"
          : "none";

        // Update edit button text
        editBtn.textContent = isEdit
          ? translations[currentLang]?.finish_editing || "Bearbeitung beenden"
          : translations[currentLang]?.edit || "Edit";
      }

      // Initial render in read-only mode
      renderView(false);
      detailOverlay.classList.add("open");
      document.getElementById("plus-btn").style.display = "none";

      // Bind edit button toggle
      editBtn.onclick = () => {
        isEditMode = !isEditMode;
        renderView(isEditMode);
      };

      // Optional: reset edit mode when closing or navigating back
      document.getElementById("back-btn").onclick = () => {
        isEditMode = false;
        detailOverlay.classList.remove("open");
      };

      // Cancel button
      document.querySelector(".cancel-btn-edit").onclick = () => {
        isEditMode = false;
        detailOverlay.classList.remove("open");
      };
    }
  );
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

function sortPrompts(prompts) {
  return prompts.sort((a, b) => {
    let aValue, bValue;

    switch (sortState.sortBy) {
      case "title":
        aValue = a.prompt.title?.toLowerCase() || "";
        bValue = b.prompt.title?.toLowerCase() || "";
        break;
      case "lastUsed":
        aValue = a.prompt.lastUsed || 0;
        bValue = b.prompt.lastUsed || 0;
        break;
      default:
        aValue = a.prompt.title?.toLowerCase() || "";
        bValue = b.prompt.title?.toLowerCase() || "";
    }

    const order = sortState.sortOrder === "ascending" ? 1 : -1;

    if (aValue < bValue) return -1 * order;
    if (aValue > bValue) return 1 * order;
    return 0;
  });
}

function handleSortOptionClick(option) {
  const dropdown = option.closest(".sort-dropdown");
  const previousSortState = { ...sortState }; // For debugging

  if (option.dataset.sortOrder) {
    sortState.sortOrder = option.dataset.sortOrder;
  } else if (option.dataset.sortBy) {
    sortState.sortBy = option.dataset.sortBy;
  }

  console.log(
    `Sort option clicked: Previous state=${JSON.stringify(
      previousSortState
    )}, New state=${JSON.stringify(sortState)}`
  ); // Debugging

  dropdown.style.display = "none";
  if (dropdown.id === "sort-dropdown") {
    isSortDropdownOpen = false;
  } else if (dropdown.id === "folder-sort-dropdown") {
    isFolderSortDropdownOpen = false;
  }

  updateSortDropdownSelection(dropdown); // Update dropdown selection and button text
  // Refresh table based on context
  if (navigationState.source === "folder" && navigationState.folderId) {
    console.log(`Refreshing folder view: FolderID=${navigationState.folderId}`);
    showFolder(navigationState.folderId);
  } else if (
    navigationState.source === "category" &&
    navigationState.category
  ) {
    console.log(
      `Refreshing category view: Category=${navigationState.category}`
    );
    showCategory(navigationState.category);
  } else {
    console.log("Refreshing main prompts table");
    loadPromptsTable();
  }
}

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

// Action Dropdown (restore-btn IMMER mit anlegen)
const dropdown = document.createElement("div");
dropdown.classList.add("action-dropdown");
dropdown.innerHTML = `
  <button class="favorit-btn"></button>
  <button class="share-btn"></button>
  <button class="copy-btn"></button>
  <button class="rename-btn"></button>
  <button class="${
    navigationState.category === "category_trash" ? "delete-btn" : "trash-btn"
  }"></button>
  <button class="restore-btn"></button>
`;
document.body.appendChild(dropdown);

// Mark prompt as favorite
dropdown.querySelector(".favorit-btn").addEventListener("click", () => {
  const promptId = dropdown.dataset.promptId;
  console.log(`Marking prompt as favorite: ID=${promptId}`);

  chrome.storage.local.get(["prompts"], function (data) {
    const prompts = data.prompts || {};
    const prompt = prompts[promptId];
    if (prompt) {
      prompt.isFavorite = !prompt.isFavorite;
      prompt.updatedAt = Date.now();
      chrome.storage.local.set({ prompts }, () => {
        console.log(
          `Prompt ${promptId} favorite status updated to ${prompt.isFavorite}`
        );
        loadPromptsTable();
        if (dropdown.dataset.table === "folder") {
          showFolder(dropdown.dataset.folderId);
        }
      });
    } else {
      console.error(`Prompt with ID ${promptId} not found`);
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

// Copy Prompt Content
dropdown.querySelector(".copy-btn").addEventListener("click", () => {
  const promptId = dropdown.dataset.promptId;

  chrome.storage.local.get(["prompts"], function (data) {
    const prompts = data.prompts || {};
    const prompt = prompts?.[promptId];
    if (prompt) {
      navigator.clipboard.writeText(prompt.content || prompt.title);
      alert(translations[currentLang]?.copied || "Prompt-Content copied!");

      const now = Date.now();
      prompt.lastUsed = now;
      prompt.usageCount = (prompt.usageCount || 0) + 1; // robustes ++

      // optional MetaChangeLog wie im ersten Beispiel
      prompt.metaChangeLog = prompt.metaChangeLog || [];
      prompt.metaChangeLog.push({
        type: "copy",
        message: `Prompt copied to clipboard`,
        timestamp: now,
      });

      prompts[promptId] = prompt;
      chrome.storage.local.set({ prompts }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Fehler beim Aktualisieren von lastUsed:",
            chrome.runtime.lastError
          );
        }
      });
    } else {
      console.error(`Prompt with ID ${promptId} not found`);
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

// Share Prompt
dropdown.querySelector(".share-btn").addEventListener("click", () => {
  const promptId = dropdown.dataset.promptId;
  console.log(`Sharing prompt: ID=${promptId}`);

  chrome.storage.local.get(["prompts"], function (data) {
    const prompt = data.prompts?.[promptId];
    if (prompt) {
      const textToShare =
        prompt.content || prompt.title || "Check out this prompt!";
      if (navigator.share) {
        navigator
          .share({
            title: "Shared Prompt",
            text: textToShare,
          })
          .catch((err) => {
            console.error("Share failed:", err);
          });
      } else {
        const encodedText = encodeURIComponent(textToShare);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;
        const emailUrl = `mailto:?subject=Shared Prompt&body=${encodedText}`;
        const choice = confirm(
          "Click OK to share via WhatsApp, Cancel for Email"
        );
        if (choice) {
          window.open(whatsappUrl, "_blank");
        } else {
          window.open(emailUrl, "_blank");
        }
      }
    } else {
      console.error(`Prompt with ID ${promptId} not found`);
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

// Rename Prompt
dropdown.querySelector(".rename-btn").addEventListener("click", () => {
  const promptId = dropdown.dataset.promptId;
  const folderId = dropdown.dataset.folderId;
  const newName = prompt(
    translations[currentLang]?.rename_prompt || "New prompt title:",
    dropdown.dataset.entry
  );

  if (newName) {
    chrome.storage.local.get(["prompts"], function (data) {
      const prompts = data.prompts || {};
      if (prompts[promptId]) {
        prompts[promptId].title = newName;
        prompts[promptId].updatedAt = Date.now();
        chrome.storage.local.set({ prompts }, () => {
          loadPromptsTable();
          if (dropdown.dataset.table === "folder") showFolder(folderId);
        });
      } else {
        console.error(`Prompt with ID ${promptId} not found`);
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

  // Recreate dropdown HTML based on current category
  dropdown.innerHTML = `
    <button class="favorit-btn"></button>
    <button class="share-btn"></button>
    <button class="copy-btn"></button>
    <button class="rename-btn"></button>
    <button class="${
      navigationState.category === "category_trash" ? "delete-btn" : "trash-btn"
    }"></button>
    <button class='restore-btn'></button>
    }
  `;

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

  // Set dataset attributes for dropdown
  dropdown.dataset.promptId = tr.dataset.promptId;
  dropdown.dataset.folderId = tr.dataset.folderId || "";
  dropdown.dataset.folderName = tr.dataset.folderName || "";
  dropdown.dataset.entry = tr.dataset.entry;
  dropdown.dataset.table = tr
    .closest("table")
    .classList.contains("folder-entry-table")
    ? "folder"
    : "main";

  // Update dropdown translations
  chrome.storage.local.get(["prompts"], function (data) {
    const prompts = data.prompts || {};
    const prompt = prompts[tr.dataset.promptId];

    // Update all button texts
    updateDropdownTranslations(dropdown, prompt);

    // Add event listener for delete-btn if in trash category
    const deleteBtn = dropdown.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        const promptId = dropdown.dataset.promptId;
        if (
          !confirm(
            translations[currentLang]?.confirm_delete ||
              "Are you sure you want to permanently delete this prompt?"
          )
        ) {
          return;
        }
        chrome.storage.local.get(["prompts"], function (data) {
          const prompts = data.prompts || {};
          if (prompts[promptId]) {
            delete prompts[promptId];
            chrome.storage.local.set({ prompts }, () => {
              if (navigationState.category === "category_trash") {
                showCategory("category_trash");
              } else {
                loadPromptsTable();
                if (dropdown.dataset.table === "folder")
                  showFolder(dropdown.dataset.folderId);
                else
                  document
                    .getElementById("folder-overlay")
                    .classList.remove("open");
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
          } else {
            console.error(`Prompt with ID ${promptId} not found`);
          }
        });
      });
    }
  });

  console.log(
    `Dropdown opened: promptId=${tr.dataset.promptId}, folderId=${tr.dataset.folderId}, folderName=${tr.dataset.folderName}`
  );
}

// Ordner umbenennen (renameFolder)
function renameFolder(folderId, newName) {
  chrome.storage.local.get("folders", (data) => {
    const folders = data.folders || {};
    if (folders[folderId]) {
      folders[folderId].name = newName;
      chrome.storage.local.set({ folders }, () => {
        loadFolders(); // Ordnerliste aktualisieren
      });
    } else {
      console.warn("Ordner nicht gefunden:", folderId);
    }
  });
}

// Ordner löschen (deleteFolder)
function deleteFolder(folderId) {
  chrome.storage.local.get(["folders", "prompts"], (data) => {
    const folders = data.folders || {};
    const prompts = data.prompts || {};

    if (folders[folderId]) {
      // Alle zugehörigen Prompts löschen
      const promptIds = folders[folderId].promptIds || [];
      promptIds.forEach((pid) => {
        delete prompts[pid];
      });

      // Ordner selbst löschen
      delete folders[folderId];

      chrome.storage.local.set({ folders, prompts }, () => {
        loadFolders(); // Ordnerliste aktualisieren
      });
    } else {
      console.warn("Ordner nicht gefunden:", folderId);
    }
  });
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

function attachFolderTableEvents() {
  const rows = document.querySelectorAll(".folder-entry-table tr");
  console.log(`Found ${rows.length} rows in folder-entry-table`);
  rows.forEach((row) => {
    const actionBtn = row.querySelector(".action-btn");
    const promptId = row.dataset.promptId;
    const folderId = row.dataset.folderId;
    if (!promptId) {
      console.error(
        `Missing promptId for row: Dataset=${JSON.stringify(row.dataset)}`
      );
      return;
    }
    console.log(
      `Binding events for row: PromptID=${promptId}, FolderID=${folderId}, Dataset=${JSON.stringify(
        row.dataset
      )}`
    );
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
        console.log(
          `Row clicked: PromptID=${promptId}, FolderID=${folderId}, Dataset=${JSON.stringify(
            row.dataset
          )}`
        );
        navigationState = {
          source: navigationState.source === "category" ? "category" : "folder",
          folderId: navigationState.source === "category" ? null : folderId,
          category:
            navigationState.source === "category"
              ? navigationState.category
              : null,
        };
        console.log(
          `navigationState updated: ${JSON.stringify(navigationState)}`
        );
        showPromptDetails(promptId);
      }
    });
  });
}

function attachMainTableEvents() {
  document
    .querySelectorAll(".entry-table:not(.folder-entry-table) tr")
    .forEach((tr) => {
      const btn = tr.querySelector(".action-btn");
      const promptId = tr.dataset.promptId;
      if (!promptId) {
        console.error(
          `Missing promptId for row: Dataset=${JSON.stringify(tr.dataset)}`
        );
        return;
      }
      console.log(
        `Binding events for row: PromptID=${promptId}, Dataset=${JSON.stringify(
          tr.dataset
        )}`
      );
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
          console.log(
            `Row clicked: PromptID=${promptId}, Dataset=${JSON.stringify(
              tr.dataset
            )}`
          );
          navigationState = {
            source: navigationState.source === "category" ? "category" : "main",
            folderId: null,
            category:
              navigationState.source === "category"
                ? navigationState.category
                : null,
          };
          console.log(
            `navigationState updated: ${JSON.stringify(navigationState)}`
          );
          showPromptDetails(promptId);
        }
      });
    });
}

// Ensure dataset attributes are set in showFolder
function showFolder(folderId) {
  const folderEntries = document.getElementById("folder-entries");
  const promptSearchInput = document.getElementById("prompt-search");
  folderEntries.innerHTML = "";

  chrome.storage.local.get(["folders", "prompts"], function (data) {
    const folders = data.folders || {};
    const prompts = data.prompts || {};
    const folder = folders[folderId];

    document.getElementById("folder-overlay").classList.add("open");
    document.getElementById("side-nav").classList.remove("open");
    document.getElementById("plus-btn").style.display = "none";
    navigationState = { source: "folder", folderId: folderId };

    if (
      !folder ||
      !Array.isArray(folder.promptIds) ||
      folder.promptIds.length === 0
    ) {
      const noPromptsText =
        translations[currentLang]?.noPromptsInFolder ||
        translations["de"]?.noPromptsInFolder ||
        "Keine Prompts in diesem Ordner";
      folderEntries.innerHTML = `<tr><td colspan="2" style="display: block; visibility: visible;">${noPromptsText}</td></tr>`;
      promptSearchInput.style.display = "none";
      folderSortBtn.style.display = "none";
      folderSortDropdown.style.display = "none";
      document.getElementById("folder-title").textContent =
        folder?.name || "Unbekannter Ordner";
      return;
    }

    document.getElementById("folder-title").textContent = folder.name;
    promptSearchInput.style.display = "block";
    folderSortBtn.style.display = "block";

    function renderPrompts(promptsToRender, folderId) {
      folderEntries.innerHTML = "";
      if (promptsToRender.length === 0) {
        const noPromptsText =
          translations[currentLang]?.noPromptsFound ||
          translations["de"]?.noPromptsFound ||
          "No prompts found";
        folderEntries.innerHTML = `<tr><td colspan="2" style="display: block; visibility: visible;">${noPromptsText}</td></tr>`;
        return;
      }

      promptsToRender.forEach(({ prompt, id }) => {
        const tr = document.createElement("tr");
        tr.dataset.entry = prompt.title;
        tr.dataset.folderId = folderId;
        tr.dataset.promptId = id;
        tr.dataset.folderName = folder.name || "Unbekannter Ordner";
        tr.innerHTML = `
          <td>${prompt.title}</td>
          <td class="action-cell">
            <button class="action-btn">⋮</button>
          </td>
        `;
        folderEntries.appendChild(tr);
        console.log(
          `Prompt Row: ID=${id}, FolderID=${folderId}, Title=${prompt.title}, FolderName=${folder.name}`
        );
      });

      attachFolderTableEvents();
    }

    let promptsWithDetails = folder.promptIds
      .map((pid) => {
        const prompt = prompts[pid];
        if (prompt) return { prompt, id: pid };
        console.warn(`Prompt with ID ${pid} not found in prompts`);
        return null;
      })
      .filter(Boolean);

    promptsWithDetails = sortPrompts(promptsWithDetails);
    renderPrompts(promptsWithDetails, folderId);

    promptSearchInput.value = "";
    promptSearchInput.oninput = function () {
      const searchTerm = this.value.trim().toLowerCase();
      if (!searchTerm) {
        renderPrompts(promptsWithDetails, folderId);
        return;
      }
      const scoredPrompts = promptsWithDetails.map(({ prompt, id }) => {
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
        return { prompt, id, distance: minDistance };
      });
      scoredPrompts.sort((a, b) => a.distance - b.distance);
      const filteredPrompts = scoredPrompts.map(({ prompt, id }) => ({
        prompt,
        id,
      }));
      renderPrompts(filteredPrompts, folderId);
    };
  });
}

function showCategory(category) {
  console.log(`showCategory called with category: ${category}`);
  const folderEntries = document.getElementById("folder-entries");
  const promptSearchInput = document.getElementById("prompt-search");
  folderEntries.innerHTML = "";

  chrome.storage.local.get(["folders", "prompts"], function (data) {
    const folders = data.folders || {};
    const prompts = data.prompts || {};

    let allPrompts = [];
    console.log("Storage Data:", data); // Debugging

    // Prompts aus Ordnern laden
    Object.entries(folders).forEach(([folderId, folder]) => {
      if (Array.isArray(folder.promptIds)) {
        folder.promptIds.forEach((promptId) => {
          const prompt = prompts[promptId];
          if (prompt) {
            allPrompts.push({
              prompt,
              folderId,
              promptId,
              isTrash: folder.isTrash || false,
              isHidden: folder.isHidden || false,
            });
          }
        });
      }
    });

    // Prompts ohne Ordnerzuweisung
    Object.entries(prompts).forEach(([promptId, prompt]) => {
      if (!prompt.folderId) {
        allPrompts.push({
          prompt,
          folderId: null,
          promptId,
          isTrash: false,
          isHidden: false,
        });
      }
    });

    let filteredPrompts = [];
    let displayName = category;

    switch (category) {
      case "category_favorites":
        filteredPrompts = allPrompts.filter(
          ({ prompt }) => prompt.isFavorite && !prompt.isTrash
        );
        displayName =
          translations[currentLang]?.category_favorites || "Favorites";
        break;
      case "category_all_prompts":
        filteredPrompts = allPrompts.filter(({ prompt }) => !prompt.isTrash);
        displayName =
          translations[currentLang]?.category_all_prompts || "All Prompts";
        break;
      case "category_single_prompts":
        filteredPrompts = allPrompts.filter(
          ({ prompt }) => !prompt.folderId && !prompt.isTrash
        );
        displayName =
          translations[currentLang]?.category_single_prompts ||
          "Single Prompts";
        break;
      case "category_categorised_prompts":
        filteredPrompts = allPrompts.filter(
          ({ prompt }) => prompt.folderId && !prompt.isTrash
        );
        displayName =
          translations[currentLang]?.category_categorised_prompts ||
          "Categorised Prompts";
        break;
      case "category_dynamic_prompts":
        filteredPrompts = allPrompts.filter(
          ({ prompt }) =>
            [...prompt.content.matchAll(/\{\{([^}]+)\}\}/g)].length > 0
        );
        displayName =
          translations[currentLang]?.category_dynamic_prompts ||
          "Dynamic Prompts";
        break;
      case "category_static_prompts":
        filteredPrompts = allPrompts.filter(
          ({ prompt }) => !/\{\{([^}]+)\}\}/g.test(prompt.content)
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
      case "category_trash":
        filteredPrompts = allPrompts.filter(({ prompt }) => prompt.isTrash);
        displayName = translations[currentLang]?.category_trash || "Trash";
        break;
      default:
        filteredPrompts = [];
    }

    document.getElementById("folder-title").textContent = displayName;
    promptSearchInput.style.display =
      filteredPrompts.length > 0 ? "block" : "none";
    folderSortBtn.style.display = filteredPrompts.length > 0 ? "block" : "none";

    function renderPrompts(promptsToRender) {
      folderEntries.innerHTML = "";
      if (promptsToRender.length === 0) {
        folderEntries.innerHTML = `<tr><td colspan="2">${
          translations[currentLang]?.no_prompts_found ||
          "Keine Prompts gefunden"
        }</td></tr>`;
        return;
      }

      promptsToRender.forEach(({ prompt, folderId, promptId }) => {
        const tr = document.createElement("tr");
        tr.dataset.entry = prompt.title;
        tr.dataset.folderId = folderId || "";
        tr.dataset.promptId = promptId;
        tr.dataset.folderName =
          folderId && folders[folderId]?.name
            ? folders[folderId].name
            : "No Folder";
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
        ({ prompt, folderId, promptId }) => {
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
          return { prompt, folderId, promptId, distance: minDistance };
        }
      );

      scoredPrompts.sort((a, b) => a.distance - b.distance);

      const searchedPrompts = scoredPrompts.map(
        ({ prompt, folderId, promptId }) => ({
          prompt,
          folderId,
          promptId,
        })
      );

      renderPrompts(searchedPrompts);
    });

    document.getElementById("folder-overlay").classList.add("open");
    document.getElementById("side-nav").classList.remove("open");
    document.getElementById("plus-btn").style.display = "none";

    // Setze navigationState korrekt
    navigationState = { source: "category", folderId: null, category };
    console.log(`navigationState updated: ${JSON.stringify(navigationState)}`);
  });
}

function validateFolderPrompts() {
  chrome.storage.local.get(["folders", "prompts"], (data) => {
    const folders = data.folders || {};
    const prompts = data.prompts || {};
    let updated = false;

    Object.entries(folders).forEach(([folderId, folder]) => {
      if (folder.promptIds) {
        const validPromptIds = folder.promptIds.filter(
          (pid) => prompts[pid] && prompts[pid].promptId === pid
        );
        if (validPromptIds.length !== folder.promptIds.length) {
          console.warn(
            `Invalid prompt IDs removed from folder ${folderId}:`,
            folder.promptIds.filter(
              (pid) => !prompts[pid] || prompts[pid].promptId !== pid
            )
          );
          folder.promptIds = validPromptIds;
          updated = true;
        }
      }
    });

    if (updated) {
      chrome.storage.local.set({ folders }, () => {
        console.log("Folders updated with valid prompt IDs");
      });
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

// Update handleActionButtonClick to set dataset attributes correctly
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

  // Set dataset attributes for dropdown
  dropdown.dataset.promptId = tr.dataset.promptId;
  dropdown.dataset.folderId = tr.dataset.folderId || "";
  dropdown.dataset.folderName = tr.dataset.folderName || "";
  dropdown.dataset.entry = tr.dataset.entry;
  dropdown.dataset.table = tr
    .closest("table")
    .classList.contains("folder-entry-table")
    ? "folder"
    : "main";

  // Update dropdown translations
  chrome.storage.local.get(["prompts"], function (data) {
    const prompts = data.prompts || {};
    const prompt = prompts[tr.dataset.promptId];

    // Update all button texts
    updateDropdownTranslations(dropdown, prompt);

    // Add event listener for delete-btn if in trash category
    const deleteBtn = dropdown.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        const promptId = dropdown.dataset.promptId;
        if (
          !confirm(
            translations[currentLang]?.confirm_delete ||
              "Are you sure you want to permanently delete this prompt?"
          )
        ) {
          return;
        }
        chrome.storage.local.get(["prompts"], function (data) {
          const prompts = data.prompts || {};
          if (prompts[promptId]) {
            delete prompts[promptId];
            chrome.storage.local.set({ prompts }, () => {
              loadPromptsTable();
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
          } else {
            console.error(`Prompt with ID ${promptId} not found`);
          }
        });
      });
    }

    // Add event listener for restore-btn
    const restoreBtn = dropdown.querySelector(".restore-btn");
    if (restoreBtn) {
      console.log("Reestore process enabled");
      restoreBtn.addEventListener("click", () => {
        const folderId = dropdown.dataset.folderId;
        const promptId = dropdown.dataset.promptId;

        if (
          !confirm(
            translations[currentLang]?.confirm_restore ||
              "Möchtest du diesen Prompt wiederherstellen?"
          )
        ) {
          return;
        }

        chrome.storage.local.get(["prompts"], function (data) {
          const prompts = data.prompts || {};
          if (prompts[promptId]) {
            const targetPrompt = prompts[promptId];
            const now = Date.now();

            targetPrompt.isTrash = false;
            targetPrompt.trashedAt = null;
            targetPrompt.metaChangeLog = targetPrompt.metaChangeLog || [];
            targetPrompt.metaChangeLog.push({
              type: "restore",
              restoredAt: now,
              folderId: targetPrompt.folderId || null,
              timestamp: now,
            });

            prompts[promptId] = targetPrompt;

            chrome.storage.local.set({ prompts }, () => {
              showCategory("category_trash"); // Refresh trash view
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
          } else {
            console.error(`Prompt with ID ${promptId} not found`);
          }
        });
      });
    }

    // Existing event listener for trash-btn
    const trashBtn = dropdown.querySelector(".trash-btn");
    if (trashBtn) {
      trashBtn.addEventListener("click", () => {
        const folderId = dropdown.dataset.folderId;
        const promptId = dropdown.dataset.promptId;

        if (
          !confirm(
            translations[currentLang]?.confirm_trash ||
              "Möchtest du diese Prompt in den Papierkorb verschieben?"
          )
        ) {
          return;
        }

        chrome.storage.local.get(["folders", "prompts"], function (data) {
          const folders = data.folders || {};
          const prompts = data.prompts || {};

          if (prompts[promptId]) {
            const targetPrompt = prompts[promptId];
            const now = Date.now();

            targetPrompt.isTrash = true;
            targetPrompt.trashedAt = now;
            targetPrompt.metaChangeLog = targetPrompt.metaChangeLog || [];
            targetPrompt.metaChangeLog.push({
              type: "trash",
              trashedAt: now,
              folderId: targetPrompt.folderId || null,
              timestamp: now,
            });

            prompts[promptId] = targetPrompt;

            chrome.storage.local.set({ prompts }, () => {
              loadPromptsTable();
              if (dropdown.dataset.table === "folder") showFolder(folderId);
              else
                document
                  .getElementById("folder-overlay")
                  .classList.remove("open");
            });
          } else {
            console.error(`Prompt with ID ${promptId} not found`);
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
    }
  });

  console.log(
    `Dropdown opened: promptId=${tr.dataset.promptId}, folderId=${tr.dataset.folderId}, folderName=${tr.dataset.folderName}`
  );
}

dropdown.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const folderId = dropdown.dataset.folderId;
    const promptId = dropdown.dataset.promptId;

    if (
      !confirm(
        translations[currentLang]?.confirm_delete ||
          "Möchtest du diesen Prompt endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }

    chrome.storage.local.get(["folders", "prompts"], function (data) {
      const folders = data.folders || {};
      const prompts = data.prompts || {};

      if (prompts[promptId]) {
        // Entferne Prompt-ID aus dem Ordner
        if (folders[folderId]) {
          folders[folderId].promptIds = (
            folders[folderId].promptIds || []
          ).filter((id) => id !== promptId);
        }

        // Entferne den Prompt
        delete prompts[promptId];

        chrome.storage.local.set({ folders, prompts }, () => {
          console.log(`Prompt ${promptId} permanently deleted`);
          // Aktualisiere die Ansicht
          if (navigationState.category === "category_trash") {
            showCategory("category_trash");
          } else {
            loadPromptsTable();
            if (dropdown.dataset.table === "folder") showFolder(folderId);
            else
              document
                .getElementById("folder-overlay")
                .classList.remove("open");
          }
        });
      } else {
        console.error(`Prompt with ID ${promptId} not found`);
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
  }
});

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

  chrome.storage.local.get(["folders", "prompts"], function (data) {
    const folders = data.folders || {};
    const prompts = data.prompts || {};

    const visibleFolders = Object.entries(folders).filter(
      ([, folder]) => !folder.isHidden && !folder.isTrash
    );

    if (visibleFolders.length === 0) {
      folderList.innerHTML = "<li>No visible folders</li>";
    } else {
      visibleFolders.forEach(([folderId, folder]) => {
        const promptCount = (folder.promptIds || []).filter(
          (id) => prompts[id] !== undefined
        ).length;

        const li = document.createElement("li");
        li.textContent = `📁 ${folder.name} (${promptCount})`;
        li.dataset.folderId = folderId;
        folderList.appendChild(li);
        console.log(`Folder added: ${folder.name}, ID: ${folderId}`); // Debugging
      });
    }

    updateFolderSearchVisibility();
    attachFolderClickEvents();
  });
}

function attachFolderClickEvents() {
  document.querySelectorAll(".folder-list li").forEach((folder) => {
    folder.addEventListener("click", () => {
      const folderId = folder.dataset.folderId;
      if (folderId) {
        console.log(`Folder clicked: ID=${folderId}`); // Debugging
        showFolder(folderId);
      } else {
        console.error("No folderId found for folder:", folder.textContent);
      }
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
      tags: Array.isArray(data.tags) ? data.tags : [],
    };

    const folders = data.folders || {};
    const prompts = data.prompts || {};
    const workflows = data.workflows || {};

    // Folders exportieren
    Object.entries(folders).forEach(([folderId, folder]) => {
      exportData.folders.push({
        ...folder, // Alle Eigenschaften des Ordners übernehmen
        folderId, // Sicherstellen, dass folderId explizit gesetzt ist
        promptIds: Array.isArray(folder.promptIds) ? folder.promptIds : [],
      });
    });

    // Prompts exportieren
    Object.entries(prompts).forEach(([promptId, prompt]) => {
      const folder = prompt.folderId && folders[prompt.folderId];
      exportData.prompts.push({
        folderId: prompt.folderId || null,
        folderName: folder ? folder.name || "Unnamed Folder" : "No Folder",
        isHidden: folder ? folder.isHidden || false : false,
        isTrash: folder ? folder.isTrash || false : false,
        prompt: {
          ...prompt, // Alle Eigenschaften des Prompts übernehmen
          promptId:
            prompt.promptId || promptId || `${Date.now()}_${generateUUID()}`,
          tags: Array.isArray(prompt.tags) ? prompt.tags : [],
          versions: Array.isArray(prompt.versions)
            ? prompt.versions.map((version) => ({
                ...version, // Alle Eigenschaften der Version übernehmen
                versionId:
                  version.versionId || `${Date.now()}_${generateUUID()}`,
              }))
            : [],
          metaChangeLog: Array.isArray(prompt.metaChangeLog)
            ? prompt.metaChangeLog
            : [],
          performanceHistory: Array.isArray(prompt.performanceHistory)
            ? prompt.performanceHistory
            : [],
          createdAt: prompt.createdAt || Date.now(),
          updatedAt: prompt.updatedAt || Date.now(),
          usageCount: prompt.usageCount || 0,
          lastUsed: prompt.lastUsed || null,
          isTrash: prompt.isTrash || false,
          deletedAt: prompt.deletedAt || null,
        },
      });
    });

    // Workflows exportieren
    Object.entries(workflows).forEach(([workflowId, workflow]) => {
      exportData.workflows.push({
        ...workflow, // Alle Eigenschaften des Workflows übernehmen
        workflowId, // Sicherstellen, dass workflowId explizit gesetzt ist
        steps: Array.isArray(workflow.steps) ? workflow.steps : [],
        tags: Array.isArray(workflow.tags) ? workflow.tags : [],
      });
    });

    // Prüfen, ob etwas exportiert wird
    if (
      exportData.folders.length === 0 &&
      exportData.prompts.length === 0 &&
      exportData.workflows.length === 0 &&
      exportData.tags.length === 0
    ) {
      alert("No data to export!");
      return;
    }

    // JSON-Datei erstellen und herunterladen
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

      // Basis-Validierung
      if (
        !Array.isArray(importedData.prompts) ||
        !Array.isArray(importedData.folders) ||
        !Array.isArray(importedData.workflows) ||
        !Array.isArray(importedData.tags)
      ) {
        alert(
          "Invalid JSON structure: Required properties missing or invalid!"
        );
        return;
      }

      chrome.storage.local.get(null, function (existingData) {
        const updatedData = existingData || {};
        updatedData.prompts = updatedData.prompts || {};
        updatedData.folders = updatedData.folders || {};
        updatedData.workflows = updatedData.workflows || {};
        updatedData.tags = updatedData.tags || [];

        // Tags mergen (Duplikate entfernen)
        const allTags = new Set([...updatedData.tags, ...importedData.tags]);
        updatedData.tags = Array.from(allTags);

        // Mapping für neue IDs
        const promptIdMapping = {};
        const folderIdMapping = {};
        const workflowIdMapping = {};
        const versionIdMapping = {};

        // Prompts importieren
        importedData.prompts.forEach((promptEntry) => {
          const prompt = promptEntry.prompt;
          let newPromptId = prompt.promptId || prompt.id;
          if (updatedData.prompts[newPromptId]) {
            newPromptId = `${Date.now()}_${generateUUID()}`;
          }
          promptIdMapping[prompt.promptId || prompt.id] = newPromptId;

          // Version-IDs mappen
          const versions = Array.isArray(prompt.versions)
            ? prompt.versions.map((version) => {
                let newVersionId = version.versionId;
                if (
                  versionIdMapping[newVersionId] ||
                  Object.values(versionIdMapping).includes(newVersionId)
                ) {
                  newVersionId = `${Date.now()}_${generateUUID()}`;
                }
                versionIdMapping[version.versionId] = newVersionId;
                return {
                  ...version,
                  versionId: newVersionId,
                };
              })
            : [];

          prompt.tags = Array.isArray(prompt.tags)
            ? prompt.tags.filter((tag) => updatedData.tags.includes(tag))
            : [];
          updatedData.prompts[newPromptId] = {
            ...prompt,
            promptId: newPromptId,
            folderId: promptEntry.folderId || null,
            versions,
            metaChangeLog: Array.isArray(prompt.metaChangeLog)
              ? prompt.metaChangeLog
              : [],
            performanceHistory: Array.isArray(prompt.performanceHistory)
              ? prompt.performanceHistory
              : [],
            createdAt: prompt.createdAt || Date.now(),
            updatedAt: prompt.updatedAt || Date.now(),
            usageCount: prompt.usageCount || 0,
            lastUsed: prompt.lastUsed || null,
            isTrash: prompt.isTrash || false,
            deletedAt: prompt.deletedAt || null,
          };
        });

        // Folders importieren
        importedData.folders.forEach((folder) => {
          let newFolderId = folder.folderId;
          if (updatedData.folders[newFolderId]) {
            newFolderId = `${Date.now()}_${generateUUID()}`;
          }
          folderIdMapping[folder.folderId] = newFolderId;
          updatedData.folders[newFolderId] = {
            ...folder, // Alle Eigenschaften des Ordners übernehmen
            name: folder.folderName || folder.name || "Unnamed Folder",
            promptIds: Array.isArray(folder.promptIds)
              ? folder.promptIds
                  .map((id) => promptIdMapping[id] || id)
                  .filter((id) => updatedData.prompts[id])
              : [],
            isHidden: !!folder.isHidden,
            isTrash: !!folder.isTrash,
            createdAt: folder.createdAt || Date.now(),
            updatedAt: folder.updatedAt || Date.now(),
          };
        });

        // Prompt-IDs in Folders basierend auf prompt.folderId aktualisieren
        Object.entries(updatedData.prompts).forEach(([promptId, prompt]) => {
          if (prompt.folderId) {
            const newFolderId =
              folderIdMapping[prompt.folderId] || prompt.folderId;
            if (updatedData.folders[newFolderId]) {
              if (!Array.isArray(updatedData.folders[newFolderId].promptIds)) {
                updatedData.folders[newFolderId].promptIds = [];
              }
              if (
                !updatedData.folders[newFolderId].promptIds.includes(promptId)
              ) {
                updatedData.folders[newFolderId].promptIds.push(promptId);
              }
              updatedData.prompts[promptId].folderId = newFolderId;
            } else {
              updatedData.prompts[promptId].folderId = null;
            }
          }
        });

        // Workflows importieren
        importedData.workflows.forEach((workflow) => {
          let newWorkflowId = workflow.workflowId;
          if (updatedData.workflows[newWorkflowId]) {
            newWorkflowId = `workflow_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }
          workflowIdMapping[workflow.workflowId] = newWorkflowId;
          workflow.tags = Array.isArray(workflow.tags)
            ? workflow.tags.filter((tag) => updatedData.tags.includes(tag))
            : [];
          updatedData.workflows[newWorkflowId] = {
            ...workflow, // Alle Eigenschaften des Workflows übernehmen
            name: workflow.workflowName || workflow.name || "Unnamed Workflow",
            steps: Array.isArray(workflow.steps) ? workflow.steps : [],
            createdAt: workflow.createdAt || Date.now(),
            tags: workflow.tags,
          };
        });

        chrome.storage.local.set(updatedData, function () {
          if (chrome.runtime.lastError) {
            console.error("Error importing data:", chrome.runtime.lastError);
            alert("Error importing data. Please try again.");
          } else {
            console.log("Data imported successfully");
            alert("Data imported successfully!");
            if (typeof loadPromptsTable === "function") loadPromptsTable();
            if (typeof loadFolders === "function") loadFolders();
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
  validateFolderPrompts();
  document.getElementById("language-select").addEventListener("change", (e) => {
    currentLang = e.target.value;
    chrome.storage.local.set({ language: currentLang }, () => {
      loadTranslations(currentLang);
    });
  });
  async function loadTranslations(lang) {
    try {
      const response = await fetch(`i18n/${lang}.json`);
      if (!response.ok)
        throw new Error(`Fehler beim Laden der Übersetzungen für ${lang}`);
      translations[lang] = await response.json();
      currentLang = lang; // Update currentLang explicitly
      applyTranslations(lang);
      updateSortButtonText(); // Ensure sort button text updates after loading translations
    } catch (error) {
      console.error(error);
      if (lang !== "de") {
        console.warn(`Falling back to German for language: ${lang}`);
        loadTranslations("de"); // Fallback to German
      }
    }
  }

  // Sprache aus Chrome Storage laden (oder fallback auf navigator.language)
  chrome.storage.local.get(["language"], (result) => {
    let currentLang =
      result.language || navigator.language.split("-")[0] || "en";

    // Wenn noch keine Sprache gesetzt wurde, speichere die ermittelte
    if (!result.language) {
      chrome.storage.local.set({ language: currentLang });
    }

    // Initiale Sprache laden
    loadTranslations(currentLang);
    document.getElementById("language-select").value = currentLang;

    // Sprachauswahl
    document
      .getElementById("language-select")
      .addEventListener("change", (e) => {
        currentLang = e.target.value;

        chrome.storage.local.set({ language: currentLang }, () => {
          loadTranslations(currentLang);
        });
      });
  });

  attachCategoryClickEvents();

  // Übersicht öffnen
  overviewBtn.addEventListener("click", () => {
    const appBaseUrl = chrome.runtime.getURL("/pages/app.html");

    chrome.tabs.query({}, function (tabs) {
      const existingTab = tabs.find(
        (tab) => tab.url && tab.url.startsWith(appBaseUrl)
      );

      if (existingTab) {
        // Tab with the base URL (even with params) exists
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        // No matching tab found, open new one
        chrome.tabs.create({ url: appBaseUrl });
      }
    });
  });

  document.querySelector(".workflows").addEventListener("click", () => {
    const appUrl = chrome.runtime.getURL("/pages/app.html?view=workflows");

    chrome.tabs.query({ url: appUrl }, function (tabs) {
      if (tabs.length > 0) {
        // Ein Tab mit der URL existiert bereits
        const existingTab = tabs[0]; // Nimm den ersten passenden Tab
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        // Kein Tab mit der URL existiert, erstelle einen neuen
        chrome.tabs.create({ url: appUrl });
      }
    });
  });

  document.querySelector(".tags").addEventListener("click", () => {
    const appUrl = chrome.runtime.getURL("/pages/app.html?view=tags");

    chrome.tabs.query({ url: appUrl }, function (tabs) {
      if (tabs.length > 0) {
        // Ein Tab mit der URL existiert bereits
        const existingTab = tabs[0]; // Nimm den ersten passenden Tab
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        // Kein Tab mit der URL existiert, erstelle einen neuen
        chrome.tabs.create({ url: appUrl });
      }
    });
  });

  document.querySelector(".types").addEventListener("click", () => {
    const appUrl = chrome.runtime.getURL("/pages/app.html?view=types");

    chrome.tabs.query({ url: appUrl }, function (tabs) {
      if (tabs.length > 0) {
        // Ein Tab mit der URL existiert bereits
        const existingTab = tabs[0]; // Nimm den ersten passenden Tab
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        // Kein Tab mit der URL existiert, erstelle einen neuen
        chrome.tabs.create({ url: appUrl });
      }
    });
  });

  document.querySelector(".text-anonymizer").addEventListener("click", () => {
    const appUrl = chrome.runtime.getURL("/pages/app.html?view=anonymizer");

    chrome.tabs.query({ url: appUrl }, function (tabs) {
      if (tabs.length > 0) {
        // Ein Tab mit der URL existiert bereits
        const existingTab = tabs[0]; // Nimm den ersten passenden Tab
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        // Kein Tab mit der URL existiert, erstelle einen neuen
        chrome.tabs.create({ url: appUrl });
      }
    });
  });

  document.querySelector(".prompt-analytics").addEventListener("click", () => {
    const appUrl = chrome.runtime.getURL("/pages/app.html?view=analytics");

    chrome.tabs.query({ url: appUrl }, function (tabs) {
      if (tabs.length > 0) {
        // Ein Tab mit der URL existiert bereits
        const existingTab = tabs[0]; // Nimm den ersten passenden Tab
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        // Kein Tab mit der URL existiert, erstelle einen neuen
        chrome.tabs.create({ url: appUrl });
      }
    });
  });

  // FAQ
  faqBtn.addEventListener("click", () => {
    const appUrl = chrome.runtime.getURL("/pages/faq.html");

    chrome.tabs.query({ url: appUrl }, function (tabs) {
      if (tabs.length > 0) {
        // Ein Tab mit der URL existiert bereits
        const existingTab = tabs[0]; // Nimm den ersten passenden Tab
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          chrome.windows.update(existingTab.windowId, { focused: true });
        });
      } else {
        // Kein Tab mit der URL existiert, erstelle einen neuen
        chrome.tabs.create({ url: appUrl });
      }
    });
  });

  // Theme Initialization (mit chrome.storage.local)
  const themeSelect = document.getElementById("theme-select");

  chrome.storage.local.get(["theme"], (result) => {
    const savedTheme = result.theme || "system";

    // Falls kein Theme gesetzt ist, speichere den Systemwert
    if (!result.theme) {
      chrome.storage.local.set({ theme: savedTheme });
    }

    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
  });

  // Theme-Anwendung
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

    chrome.storage.local.set({ theme });
  }

  // Theme-Änderung durch User
  themeSelect.addEventListener("change", (e) => {
    const selectedTheme = e.target.value;
    applyTheme(selectedTheme);
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
      const folderName = prompt(
        translations[currentLang]?.new_foldername || "Neuer Ordnername"
      );
      if (folderName) {
        const folderId = `${Date.now()}_${generateUUID()}`;
        chrome.storage.local.get("folders", (data) => {
          const folders = data.folders || {};

          folders[folderId] = {
            name: folderName,
            promptIds: [],
            isHidden: false,
            isTrash: false,
          };

          chrome.storage.local.set({ folders }, () => {
            loadFolders();
          });
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
    console.log(
      `Back button clicked: navigationState=${JSON.stringify(navigationState)}`
    );

    if (navigationState.source === "folder" && navigationState.folderId) {
      showFolder(navigationState.folderId); // Zurück zur Ordneransicht
    } else if (
      navigationState.source === "category" &&
      navigationState.category
    ) {
      showCategory(navigationState.category); // Zurück zur Kategorieansicht
    } else {
      // Zurück zur Hauptübersicht
      document.getElementById("folder-overlay").classList.remove("open");
      document.getElementById("side-nav").classList.remove("open");
      loadPromptsTable(); // Hauptübersicht neu laden
    }
  });

  // Change Mode
  editBtn.addEventListener("click", () => {
    const entryCompatible = document.getElementById("entry-compatible");
    const entryIncompatible = document.getElementById("entry-incompatible");
    const entryTitle = document.getElementById("entry-title");
    const entryDescription = document.getElementById("entry-description");
    const entryContent = document.getElementById("entry-content");
    const entryNotes = document.getElementById("entry-notes");
    const entryTypes = document.getElementById("entry-types");
    const entryFavorite = document.getElementById("entry-favorite");
    const entryFolder = document.getElementById("entry-folder");
    const tagInputGroup = document.getElementById("tag-input-group");
    const newTagInput = document.getElementById("new-tag");
    const newTypeInput = document.getElementById("new-type");
    const addTypeBtn = document.getElementById("add-type-btn");
    const addTagBtn = document.getElementById("add-tag-btn");
    const entryTags = document.getElementById("entry-tags");

    const isEditing = editBtn.dataset.editing === "true";

    if (!isEditing) {
      // --- Bearbeiten aktivieren ---
      entryTitle.readOnly = false;
      entryDescription.readOnly = false;
      entryContent.readOnly = false;
      entryNotes.readOnly = false;
      entryTypes.readOnly = false;
      entryFavorite.disabled = false;
      entryFolder.disabled = false;
      newTypeInput.readonly = false;
      newTagInput.readOnly = false;
      addTypeBtn.disabled = false;
      addTagBtn.disabled = false;
      tagInputGroup.style.display = "block";

      entryCompatible
        .querySelectorAll("input[type='checkbox']")
        .forEach((cb) => (cb.disabled = false));
      entryIncompatible
        .querySelectorAll("input[type='checkbox']")
        .forEach((cb) => (cb.disabled = false));
      entryTags
        .querySelectorAll("input[type='checkbox']")
        .forEach((cb) => (cb.disabled = false));

      document.querySelector(".detail-actions").style.display = "block";
      editBtn.textContent =
        translations[currentLang]?.finish_editing || "Bearbeitung beenden";
      editBtn.dataset.editing = "true";
    } else {
      // --- Bearbeiten deaktivieren ---
      entryTitle.readOnly = true;
      entryDescription.readOnly = true;
      entryContent.readOnly = true;
      entryNotes.readOnly = true;
      entryTypes.readOnly = true;
      entryFavorite.disabled = true;
      entryFolder.disabled = true;
      newTypeInput.readonly = true;
      newTagInput.readOnly = true;
      addTypeBtn.disabled = true;
      addTagBtn.disabled = true;
      tagInputGroup.style.display = "none";

      entryCompatible
        .querySelectorAll("input[type='checkbox']")
        .forEach((cb) => (cb.disabled = true));
      entryIncompatible
        .querySelectorAll("input[type='checkbox']")
        .forEach((cb) => (cb.disabled = true));
      entryTags
        .querySelectorAll("input[type='checkbox']")
        .forEach((cb) => (cb.disabled = true));

      document.querySelector(".detail-actions").style.display = "none";
      editBtn.textContent = translations[currentLang]?.edit || "Bearbeiten";
      editBtn.dataset.editing = "false";
    }
  });

  const saveBtnEdit = document.querySelector(".save-btn-edit");

  saveBtnEdit.addEventListener("click", async () => {
    const promptId = saveBtnEdit.dataset.promptId;
    if (!promptId) {
      console.error("Prompt-ID fehlt");
      return;
    }

    // load current prompts from storage
    const data = await chrome.storage.local.get(["prompts"]);
    const prompts = data.prompts || {};

    if (!prompts[promptId]) {
      console.error("Prompt nicht gefunden");
      return;
    }

    // --- Werte aus dem Formular holen ---
    const entryTitle = document.getElementById("entry-title").value.trim();
    const entryDescription = document
      .getElementById("entry-description")
      .value.trim();
    const entryContent = document.getElementById("entry-content").value.trim();
    const entryNotes = document.getElementById("entry-notes").value.trim();
    const entryTypes = Array.from(
      document.getElementById("entry-types").selectedOptions
    )
      .map((opt) => opt.value)
      .filter((val) => val && val.trim() !== ""); // Placeholder rausfiltern
    const entryFavorite = document.getElementById("entry-favorite").checked;
    const entryFolder = document.getElementById("entry-folder").value || null;

    const compatibleModels = Array.from(
      document.querySelectorAll(
        "#entry-compatible input[type='checkbox']:checked"
      )
    ).map((cb) => cb.value);

    const incompatibleModels = Array.from(
      document.querySelectorAll(
        "#entry-incompatible input[type='checkbox']:checked"
      )
    ).map((cb) => cb.value);

    const tags = Array.from(
      document.querySelectorAll("#entry-tags input[type='checkbox']:checked")
    ).map((cb) => cb.value);

    // --- Prompt-Daten aktualisieren ---
    prompts[promptId] = {
      ...prompts[promptId],
      title: entryTitle,
      description: entryDescription,
      content: entryContent,
      notes: entryNotes,
      types: entryTypes, // Array (leer falls nichts gewählt)
      isFavorite: entryFavorite, // ✅ wichtig: field isFavorite
      folderId: entryFolder,
      tags,
      compatibleModels,
      incompatibleModels,
      updatedAt: Date.now(),
    };

    try {
      await chrome.storage.local.set({ prompts });
      console.log(`Prompt ${promptId} wurde erfolgreich gespeichert.`);

      // Overlay schließen + UI zurücksetzen
      document.getElementById("detail-overlay").classList.remove("open");
      document.getElementById("plus-btn").style.display = "flex";

      // richtige Ansicht neu laden
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
    } catch (err) {
      console.error("Fehler beim Speichern des Prompts:", err);
    }
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

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const title = document.getElementById("entry-title").value.trim();
      const description = document
        .getElementById("entry-description")
        .value.trim();
      const content = document.getElementById("entry-content").value.trim();
      const type = document.getElementById("entry-types").value;
      const isFavorite = document.getElementById("entry-favorite").checked;
      const folderId = document.getElementById("entry-folder").value;
      const promptId =
        document.getElementById("entry-title").dataset.promptId || null;
      const tags = Array.from(
        document.querySelectorAll("#entry-tags input[type='checkbox']:checked")
      ).map((cb) => cb.value);
      const notes = document.getElementById("entry-notes").value.trim();

      if (!title) {
        alert(
          translations[currentLang]?.required_title || "Title is required!"
        );
        return;
      }

      savePrompt(
        {
          promptId,
          title,
          description,
          content,
          type,
          isFavorite,
          tags,
          notes,
        },
        {
          folderId,
          overwritePromptId: promptId,
          onSuccess: () => {
            document.getElementById("detail-overlay").classList.remove("open");
            document.getElementById("plus-btn").style.display = "flex";
            loadFolders();
            loadPromptsTable();
          },
        }
      );
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      const folderId = document.getElementById("entry-title").dataset.folderId;
      const promptIndex = parseInt(
        document.getElementById("entry-title").dataset.promptIndex
      );
      if (folderId && !isNaN(promptIndex)) {
        showPromptDetails(folderId, promptIndex);
      }
    });
  }

  // Search Prompts (mit Fuzzy Matching)
  document
    .getElementById("search-input")
    .addEventListener("input", function () {
      const searchTerm = this.value.trim().toLowerCase();
      const tableBody = document.querySelector(
        ".entry-table:not(.folder-entry-table) tbody"
      );
      tableBody.innerHTML = "";

      chrome.storage.local.get(["folders", "prompts"], function (data) {
        const prompts = data.prompts || {};
        const folders = data.folders || {};

        let promptsWithDetails = Object.entries(prompts)
          .filter(([, prompt]) => !prompt.isTrash) // Exclude trashed prompts
          .map(([promptId, prompt]) => ({
            promptId,
            prompt,
            folderId: prompt.folderId,
            folderName: folders[prompt.folderId]?.name || "Unbekannt",
            isHidden: folders[prompt.folderId]?.isHidden || false,
            isTrash: folders[prompt.folderId]?.isTrash || false,
          }))
          .filter(({ isTrash }) => !isTrash); // Exclude prompts in trashed folders

        // Falls nichts eingegeben: alle anzeigen
        if (!searchTerm) {
          promptsWithDetails.forEach(({ prompt, promptId, folderId }) => {
            const tr = document.createElement("tr");
            tr.dataset.entry = prompt.title;
            tr.dataset.folderId = folderId || "";
            tr.dataset.promptId = promptId;
            tr.innerHTML = `
            <td>${prompt.title}</td>
            <td class="action-cell">
              <button class="action-btn">⋮</button>
            </td>
          `;
            tableBody.appendChild(tr);
          });
          attachMainTableEvents();
          return;
        }

        // Fuzzy Matching (Levenshtein)
        const scoredPrompts = promptsWithDetails.map(
          ({ prompt, promptId, folderId }) => {
            const titleDistance = levenshteinDistance(
              prompt.title.toLowerCase(),
              searchTerm
            );
            const descriptionDistance = prompt.description
              ? levenshteinDistance(
                  prompt.description.toLowerCase(),
                  searchTerm
                )
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
            return { prompt, promptId, folderId, distance: minDistance };
          }
        );

        scoredPrompts.sort((a, b) => a.distance - b.distance);

        scoredPrompts.forEach(({ prompt, promptId, folderId }) => {
          const tr = document.createElement("tr");
          tr.dataset.entry = prompt.title;
          tr.dataset.folderId = folderId || "";
          tr.dataset.promptId = promptId;
          tr.innerHTML = `
          <td>${prompt.title}</td>
          <td class="action-cell">
            <button class="action-btn">⋮</button>
          </td>
        `;
          tableBody.appendChild(tr);
        });

        attachMainTableEvents();
      });
    });

  dropdown.addEventListener("click", (e) => e.stopPropagation());

  dropdown.querySelector(".rename-btn").addEventListener("click", () => {
    const folderId = dropdown.dataset.folderId;
    const promptId = dropdown.dataset.promptId; // promptIndex → promptId
    const newName = prompt(
      translations[currentLang]?.rename_prompt || "New prompt title:",
      dropdown.dataset.entry
    );
    if (newName) {
      chrome.storage.local.get(["prompts"], (data) => {
        const prompt = data.prompts?.[promptId];
        if (prompt) {
          prompt.title = newName;
          chrome.storage.local.set({ prompts: data.prompts }, () => {
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

  document.getElementById("discord-link-btn").addEventListener("click", () => {
    window.open("https://discord.gg/MJ35Q3EcED", "_blank");
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
    const entryTypes = document.getElementById("entry-types-add");
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
    entryTypes.value = "";
    entryFavorite.checked = false;
    entryFolder.innerHTML = `<option value="">${translations[currentLang]?.folder_select}</option>`;

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

    // Populate tags
    chrome.storage.local.get("types", (typeData) => {
      console.log("Geladene Tags:", typeData.types); // Debugging
      const storedTypes = Array.isArray(typeData.types) ? typeData.types : [];
      if (storedTypes.length === 0) {
        entryTypes.innerHTML =
          '<p data-i18n="no_tags">Keine Tags vorhanden</p>';
      } else {
        entryTypes.innerHTML = storedTypes
          .map(
            (type) => `
          <label>
            <input type="checkbox" name="types" value="${type}">
            ${type}
          </label>
        `
          )
          .join("");
      }
      applyTranslations(currentLang); // Übersetzungen nach dem Rendern anwenden
    });

    // Populate folders
    chrome.storage.local.get(["folders"], function (data) {
      const folders = data.folders || {};
      Object.entries(folders).forEach(([folderId, folder]) => {
        if (!folder.isHidden && !folder.isTrash) {
          const option = document.createElement("option");
          option.value = folderId;
          option.textContent = folder.name || folderId;
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
    entryTypes.disabled = false;
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
  chrome.storage.local.get(["folders"], function (data) {
    const entryFolderAdd = document.getElementById("entry-folder-add");
    // Reset options, preserve the placeholder
    entryFolderAdd.innerHTML =
      '<option value="" data-i18n="folder_select">Ordner auswählen</option>';
    const folders = data.folders || {};
    Object.entries(folders).forEach(([folderId, folder]) => {
      if (!folder.isHidden && !folder.isTrash) {
        const option = document.createElement("option");
        option.value = folderId;
        option.textContent = folder.name || folderId;
        entryFolderAdd.appendChild(option);
      }
    });
  });

  document.getElementById("add-type-btn").addEventListener("click", () => {
    const newTypeInput = document.getElementById("new-type");
    const newType = newTypeInput.value.trim();
    const entryTypes = document.getElementById("entry-types");

    // aktuelle Optionen einsammeln
    const existingTypes = Array.from(entryTypes.options).map(
      (opt) => opt.value
    );

    if (newType && !existingTypes.includes(newType)) {
      // Neue Option erzeugen
      const option = document.createElement("option");
      option.value = newType;
      option.textContent = newType;
      option.selected = true; // gleich markieren
      entryTypes.appendChild(option);

      // in chrome.storage.local speichern
      chrome.storage.local.get("types", (typeData) => {
        const storedTypes = typeData.types || [];
        if (!storedTypes.includes(newType)) {
          storedTypes.push(newType);
          chrome.storage.local.set({ types: storedTypes }, () => {
            console.log(`Type "${newType}" saved to chrome.storage.local`);
          });
        }
      });

      // Eingabe zurücksetzen
      newTypeInput.value = "";
    } else if (!newType) {
      alert(
        translations?.[currentLang]?.type_empty || "Type darf nicht leer sein!"
      );
    } else {
      alert(
        translations?.[currentLang]?.type_exists ||
          "Dieser Type existiert bereits!"
      );
    }
  });

  document.getElementById("add-tag-btn_add").addEventListener("click", () => {
    const newTagInput = document.getElementById("new-tag_add");
    const newTag = newTagInput.value.trim();
    const entryTags = document.getElementById("entry-tags-add");
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
    const title = document.getElementById("entry-title-add").value.trim();
    const description = document
      .getElementById("entry-description-add")
      .value.trim();
    const content = document.getElementById("entry-content-add").value.trim();
    const notes = document.getElementById("entry-notes-add").value.trim();
    const type = document.getElementById("entry-types-add").value;
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

    // Validierung
    if (!title) {
      alert(
        translations[currentLang]?.required_title || "Titel ist erforderlich!"
      );
      return;
    }
    if (!content) {
      alert(
        translations[currentLang]?.content_required ||
          "Bitte geben Sie einen Prompt ein!"
      );
      return;
    }

    // Prompt über zentrale Funktion speichern
    savePrompt(
      {
        title,
        description,
        content,
        type,
        tags,
        isFavorite,
        notes,
        // compatibleModels, incompatibleModels, versions, metaChangeLog etc. werden automatisch gesetzt
      },
      {
        folderId: folderId || null,
        folderName: folderName || null,
        onSuccess: () => {
          document.getElementById("add-overlay").classList.remove("open");
          document.getElementById("plus-btn").style.display = "flex";

          // Falls gerade geöffneter Ordner aktualisiert werden muss
          if (
            navigationState.source === "folder" &&
            navigationState.folderId === folderId
          ) {
            showFolder(folderId);
          }

          loadFolders();
          loadPromptsTable();
        },
      }
    );
  });

  // Save New Prompt (über zentrale savePrompt-Funktion)
  if (saveBtn) {
    saveBtn.addEventListener("click", (e) => {
      const hasFolderId =
        document.getElementById("entry-title").dataset.folderId;

      // Nur bei neuem Prompt (kein folderId gesetzt)
      if (!hasFolderId) {
        const title = document.getElementById("entry-title").value.trim();
        const description = document
          .getElementById("entry-description")
          .value.trim();
        const content = document.getElementById("entry-content").value.trim();
        const type = document.getElementById("entry-types").value;
        const newTag = document.getElementById("new-tag").value.trim();
        const isFavorite = document.getElementById("entry-favorite").checked;
        const folderId = document.getElementById("entry-folder").value;

        const tags = Array.from(
          document.querySelectorAll("#entry-tags input[name='tags']:checked")
        ).map((checkbox) => checkbox.value);

        if (!title) {
          alert(
            translations[currentLang]?.required_title || "Title is required!"
          );
          return;
        }

        // Prompt speichern über zentrale Funktion
        savePrompt(
          {
            title,
            description,
            content,
            type,
            tags: newTag ? [...tags, newTag] : tags,
            isFavorite,
            // compatibleModels, incompatibleModels und notes werden automatisch auf Defaults gesetzt
          },
          {
            folderId,
            onSuccess: () => {
              document
                .getElementById("detail-overlay")
                .classList.remove("open");
              document.getElementById("plus-btn").style.display = "flex";
              loadFolders();
              loadPromptsTable();
            },
          }
        );
      }
    });
  }

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
