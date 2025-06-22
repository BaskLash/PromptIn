const overviewBtn = document.getElementById("overview-btn");
const faqBtn = document.getElementById("faq-btn");

document.addEventListener("DOMContentLoaded", () => {
  // Übersicht öffnen
  overviewBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/app.html") });
  });

  // Übersetzungen
  let translations = {};
  let currentLang =
    navigator.language.split("-")[0] ||
    localStorage.getItem("language") ||
    "en";

  let navigationState = { source: "main", folderId: null };

  async function loadTranslations(lang) {
    try {
      const response = await fetch(`i18n/${lang}.json`);
      if (!response.ok)
        throw new Error(`Fehler beim Laden der Übersetzungen für ${lang}`);
      translations[lang] = await response.json();
      applyTranslations(lang);
    } catch (error) {
      console.error(error);
      if (lang !== "de") loadTranslations("de"); // Fallback auf Deutsch
    }
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

  // UUID Generator
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Load Folders
  function loadFolders() {
    const folderList = document.querySelector(".folder-list");
    folderList.innerHTML = "";

    chrome.storage.local.get(null, function (data) {
      if (!data || Object.keys(data).length === 0) {
        folderList.innerHTML = "<li>Keine Ordner vorhanden</li>";
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
        folderList.innerHTML = "<li>Keine sichtbaren Ordner</li>";
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
    });
  }

  // Load All Prompts
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
        allPrompts
          .filter(({ isTrash }) => !isTrash)
          .forEach(({ prompt, folderId, index }) => {
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

  // Show Folder Contents
  function showFolder(folderId) {
    const folderEntries = document.getElementById("folder-entries");
    const promptSearchInput = document.getElementById("prompt-search");
    folderEntries.innerHTML = "";

    chrome.storage.local.get(folderId, function (data) {
      const topic = data[folderId];
      if (!topic || !topic.prompts || !Array.isArray(topic.prompts)) {
        folderEntries.innerHTML =
          '<tr><td colspan="2">Keine Prompts in diesem Ordner</td></tr>';
        promptSearchInput.style.display = "none";
        return;
      }

      document.getElementById("folder-title").textContent = topic.name;
      promptSearchInput.style.display = "block";

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

      renderPrompts(topic.prompts);

      promptSearchInput.value = "";
      promptSearchInput.addEventListener("input", function () {
        const searchTerm = this.value.trim().toLowerCase();

        if (!searchTerm) {
          // Keine Eingabe: Alle Prompts in Originalreihenfolge anzeigen
          renderPrompts(topic.prompts);
          return;
        }

        // Prompts mit Distanz berechnen
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

          // Minimale Distanz von Titel, Beschreibung und Inhalt
          const minDistance = Math.min(
            titleDistance,
            descriptionDistance,
            contentDistance
          );

          return { prompt, distance: minDistance };
        });

        // Nach Distanz sortieren
        scoredPrompts.sort((a, b) => a.distance - b.distance);

        // Gefilterte und sortierte Prompts rendern
        const filteredPrompts = scoredPrompts.map(({ prompt }) => prompt);
        renderPrompts(filteredPrompts);
      });

      // Levenshtein-Distanz Funktion (unverändert)
      function levenshteinDistance(a, b) {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
          matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
          matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
              );
            }
          }
        }

        return matrix[b.length][a.length];
      }

      document.getElementById("folder-overlay").classList.add("open");
      document.getElementById("side-nav").classList.remove("open");
      document.getElementById("plus-btn").style.display = "none";
      navigationState = { source: "folder", folderId: folderId };
    });
  }

  // Show Prompt Details
  function showPromptDetails(folderId, promptIndex) {
    chrome.storage.local.get(folderId, function (data) {
      const prompt = data[folderId]?.prompts?.[promptIndex];
      if (prompt) {
        const detailOverlay = document.getElementById("detail-overlay");
        const detailTitle = document.getElementById("detail-title");
        const entryTitle = document.getElementById("entry-title");
        const entryDescription = document.getElementById("entry-description");
        const entryContent = document.getElementById("entry-content");
        const entryFavorite = document.getElementById("entry-favorite");
        const entryCreatedAt = document.getElementById("entry-created-at");
        const entryLastUsed = document.getElementById("entry-last-used");
        const entryVersions = document.getElementById("entry-versions");
        const entryFolder = document.getElementById("entry-folder");

        detailTitle.textContent = prompt.title;
        entryTitle.value = prompt.title || "";
        entryDescription.value = prompt.description || "";
        entryContent.value = prompt.content || "";
        entryFavorite.checked = prompt.isFavorite || false;
        entryCreatedAt.value = prompt.createdAt
          ? new Date(prompt.createdAt).toISOString().slice(0, 16)
          : "";
        entryLastUsed.value = prompt.lastUsed
          ? new Date(prompt.lastUsed).toISOString().slice(0, 16)
          : "";
        entryVersions.innerHTML = "";
        if (prompt.versions && Array.isArray(prompt.versions)) {
          prompt.versions.forEach((version) => {
            const li = document.createElement("li");
            li.textContent = `Version vom ${new Date(
              version.timestamp
            ).toLocaleString()}: ${version.title}`;
            entryVersions.appendChild(li);
          });
        } else {
          entryVersions.innerHTML = "<li>Keine Versionen vorhanden</li>";
        }

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
          applyTranslations(currentLang); // Re-apply translations for dynamic content
        });

        // Set readonly/disabled
        entryTitle.readOnly = true;
        entryDescription.readOnly = true;
        entryContent.readOnly = true;
        entryFavorite.disabled = true;
        entryCreatedAt.readOnly = true;
        entryLastUsed.readOnly = true;
        entryFolder.disabled = true;

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

  // Attach Main Table Events
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

        // Bestehender Klick-Handler für die Zeile
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

  // Attach Folder Table Events
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

  // Burger Menu
  document.getElementById("burger-menu").addEventListener("click", () => {
    document.getElementById("side-nav").classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
    loadFolders();
  });

  document.getElementById("close-nav").addEventListener("click", () => {
    document.getElementById("side-nav").classList.remove("open");
    document.getElementById("plus-btn").style.display = "block";
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
      const folderName = prompt("Neuer Ordnername:");
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
  const folderList = document.querySelector(".folder-list");
  const folderSearchInput = document.querySelector(".folder-search");

  function updateFolderSearchVisibility() {
    const currentFolderItems = folderList.querySelectorAll("li");
    folderSearchInput.style.display =
      currentFolderItems.length > 5 ? "block" : "none";
  }

  folderSearchInput.addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    const currentFolderItems = folderList.querySelectorAll("li");
    currentFolderItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(filter) ? "" : "none";
    });
  });

  // Folder Click Handling
  function attachFolderClickEvents() {
    document.querySelectorAll(".folder-list li").forEach((folder) => {
      folder.addEventListener("click", () => {
        const folderId = folder.dataset.folderId;
        if (folderId) showFolder(folderId);
      });
    });
  }

  // Detail Overlay Buttons
  const backBtn = document.getElementById("back-btn");
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.querySelector(".save-btn");
  const cancelBtn = document.querySelector(".cancel-btn");

  backBtn.addEventListener("click", () => {
    document.getElementById("detail-overlay").classList.remove("open");
    document.getElementById("plus-btn").style.display = "block";
    if (navigationState.source === "folder" && navigationState.folderId) {
      showFolder(navigationState.folderId);
    }
  });

  editBtn.addEventListener("click", () => {
    document.getElementById("entry-title").readOnly = false;
    document.getElementById("entry-description").readOnly = false;
    document.getElementById("entry-content").readOnly = false;
    document.getElementById("entry-favorite").disabled = false;
    document.getElementById("entry-folder").disabled = false;
    document.querySelector(".detail-actions").style.display = "flex";
  });

  saveBtn.addEventListener("click", () => {
    const title = document.getElementById("entry-title").value.trim();
    const description = document
      .getElementById("entry-description")
      .value.trim();
    const content = document.getElementById("entry-content").value.trim();
    const isFavorite = document.getElementById("entry-favorite").checked;
    const folderId = document.getElementById("entry-title").dataset.folderId;
    const promptIndex = parseInt(
      document.getElementById("entry-title").dataset.promptIndex
    );
    const newFolderId = document.getElementById("entry-folder").value;

    if (!title) {
      alert(
        translations[currentLang]?.required_title || "Titel ist erforderlich!"
      );
      return;
    }

    chrome.storage.local.get(folderId, function (data) {
      const topic = data[folderId];
      if (!topic || !topic.prompts || !topic.prompts[promptIndex]) {
        alert("Prompt nicht gefunden!");
        return;
      }

      const promptObj = {
        title,
        description,
        content,
        isFavorite,
        createdAt: topic.prompts[promptIndex].createdAt || Date.now(),
        lastUsed: Date.now(),
        versions: topic.prompts[promptIndex].versions || [],
      };

      promptObj.versions.unshift({
        versionId: generateUUID(),
        title,
        description,
        content,
        timestamp: Date.now(),
      });

      if (newFolderId && newFolderId !== folderId) {
        // Move to new folder
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
        // Update in current folder
        topic.prompts[promptIndex] = promptObj;
        chrome.storage.local.set({ [folderId]: topic }, () => {
          finalizeSave();
        });
      }
    });

    function finalizeSave() {
      document.getElementById("detail-overlay").classList.remove("open");
      document.getElementById("plus-btn").style.display = "block";
      loadFolders();
      loadPromptsTable();
    }
  });

  cancelBtn.addEventListener("click", () => {
    document.getElementById("entry-title").readOnly = true;
    document.getElementById("entry-description").readOnly = true;
    document.getElementById("entry-content").readOnly = true;
    document.getElementById("entry-favorite").disabled = true;
    document.getElementById("entry-folder").disabled = true;
    document.querySelector(".detail-actions").style.display = "none";
    // Reload the prompt details to revert changes
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
              filteredPrompts = filteredPrompts.concat(
                topic.prompts
                  .filter((prompt) => {
                    return (
                      prompt.title.toLowerCase().includes(searchTerm) ||
                      (prompt.description &&
                        prompt.description
                          .toLowerCase()
                          .includes(searchTerm)) ||
                      prompt.content.toLowerCase().includes(searchTerm)
                    );
                  })
                  .map((prompt, index) => ({
                    prompt,
                    folderId: id,
                    index,
                    isHidden: topic.isHidden || false,
                    isTrash: topic.isTrash || false,
                  }))
              );
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

  let currentButton = null;
  let isDropdownOpen = false;
  let isMouseOverDropdown = false;
  let hoveredRow = null;

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
          if (!isDropdownOpen || btn !== currentButton) hideActionButton(btn);
          hoveredRow = null;
        });
      }
    });

  document.addEventListener("click", (e) => {
    if (
      !dropdown.contains(e.target) &&
      !e.target.classList.contains("action-btn")
    ) {
      dropdown.style.display = "none";
      isDropdownOpen = false;
      if (currentButton && currentButton.closest("tr") !== hoveredRow) {
        hideActionButton(currentButton);
      }
      currentButton = null;
    }
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

  dropdown.addEventListener("click", (e) => e.stopPropagation());

  dropdown.querySelector(".copy-btn").addEventListener("click", () => {
    const folderId = dropdown.dataset.folderId;
    const promptIndex = parseInt(dropdown.dataset.promptIndex);
    chrome.storage.local.get(folderId, function (data) {
      const prompt = data[folderId]?.prompts?.[promptIndex];
      if (prompt) {
        navigator.clipboard.writeText(prompt.content || prompt.title);
        alert(translations[currentLang]?.copied || "Prompt-Inhalt kopiert!");
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
      translations[currentLang]?.rename_prompt || "Neuer Prompt-Titel:",
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
    document.getElementById("plus-btn").style.display = "block";
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
    document.getElementById("plus-btn").style.display = "block";
  });

  // Prompt Import/Export
  document.getElementById("import-prompt-btn").addEventListener("click", () => {
    alert(
      translations[currentLang]?.import_prompt ||
        "Funktion zum Importieren von Prompts wird implementiert."
    );
  });

  document.getElementById("export-prompt-btn").addEventListener("click", () => {
    alert(
      translations[currentLang]?.export_prompt ||
        "Funktion zum Exportieren von Prompts wird implementiert."
    );
  });

  /* Highlight Text Section */
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
    alert(
      translations[currentLang]?.feedback_open ||
        "Feedback-Formular wird geöffnet..."
    );
  });

  document
    .getElementById("feature-request-btn")
    .addEventListener("click", () => {
      alert(
        translations[currentLang]?.feature_request_open ||
          "Feature Request-Formular wird geöffnet..."
      );
    });

  document.getElementById("review-btn").addEventListener("click", () => {
    alert(
      translations[currentLang]?.review_open ||
        "Review-Formular wird geöffnet..."
    );
  });

  // Folder Overlay Back Button
  document.getElementById("folder-back-btn").addEventListener("click", () => {
    document.getElementById("folder-overlay").classList.remove("open");
    document.getElementById("side-nav").classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
  });

  // Plus Button (Create New Prompt)
  document.getElementById("plus-btn").addEventListener("click", () => {
    const detailOverlay = document.getElementById("detail-overlay");
    const detailTitle = document.getElementById("detail-title");
    const entryTitle = document.getElementById("entry-title");
    const entryDescription = document.getElementById("entry-description");
    const entryContent = document.getElementById("entry-content");
    const entryType = document.getElementById("entry-type");
    const entryCompatible = document.getElementById("entry-compatible");
    const entryIncompatible = document.getElementById("entry-incompatible");
    const entryTags = document.getElementById("entry-tags");
    const newTagInput = document.getElementById("new-tag");
    const addTagBtn = document.getElementById("add-tag-btn");
    const entryFavorite = document.getElementById("entry-favorite");
    const entryCreatedAt = document.getElementById("entry-created-at");
    const entryLastUsed = document.getElementById("entry-last-used");
    const entryVersions = document.getElementById("entry-versions");
    const entryFolder = document.getElementById("entry-folder");

    detailTitle.textContent =
      translations[currentLang]?.new_prompt || "Neuer Prompt";
    entryTitle.value = "";
    entryDescription.value = "";
    entryContent.value = "";
    entryType.value = "";
    entryFavorite.checked = false;
    entryCreatedAt.value = "";
    entryLastUsed.value = "";
    entryVersions.innerHTML = "";
    entryFolder.innerHTML =
      '<option value="" data-i18n="folder_select"></option>';

    // Clear and enable compatible models checkboxes
    entryCompatible
      .querySelectorAll("input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.checked = false;
        checkbox.disabled = false;
      });

    // Clear and enable incompatible models checkboxes
    entryIncompatible
      .querySelectorAll("input[type='checkbox']")
      .forEach((checkbox) => {
        checkbox.checked = false;
        checkbox.disabled = false;
      });

    // Clear and populate tags
    entryTags.innerHTML = "";
    chrome.storage.local.get("tags", (data) => {
      const tags = data.tags || [
        "SEO",
        "Marketing",
        "Social Media",
        "Advertisement",
        "Copywriting",
        "Productivity",
        "E-Commerce",
        "Education",
        "Tech",
        "Healthcare",
        "HR",
      ];
      tags.forEach((tag) => {
        const label = document.createElement("label");
        label.innerHTML = `<input type="checkbox" name="tags" value="${tag}"> ${tag}`;
        entryTags.appendChild(label);
      });
    });

    // Enable new tag input and button
    newTagInput.readOnly = false;
    newTagInput.value = "";
    addTagBtn.disabled = false;

    // Populate folder dropdown
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

    // Enable fields
    entryTitle.readOnly = false;
    entryDescription.readOnly = false;
    entryContent.readOnly = false;
    entryType.disabled = false;
    entryFavorite.disabled = false;
    entryFolder.disabled = false;

    // Show save/cancel buttons
    document.querySelector(".detail-actions").style.display = "flex";

    // Clear dataset attributes
    entryTitle.removeAttribute("data-folderId");
    entryTitle.removeAttribute("data-promptIndex");
    navigationState = { source: "main", folderId: null };

    detailOverlay.classList.add("open");
    document.getElementById("plus-btn").style.display = "none";
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
      const isFavorite = document.getElementById("entry-favorite").checked;
      const folderId = document.getElementById("entry-folder").value;

      if (!title) {
        alert(
          translations[currentLang]?.required_title || "Titel ist erforderlich!"
        );
        return;
      }

      if (!folderId) {
        alert(
          translations[currentLang]?.select_folder ||
            "Bitte einen Ordner auswählen!"
        );
        return;
      }

      const promptObj = {
        title,
        description,
        content,
        type,
        compatibleModels,
        incompatibleModels,
        tags,
        isFavorite,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        versions: [
          {
            versionId: generateUUID(),
            title,
            description,
            content,
            timestamp: Date.now(),
          },
        ],
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
          document.getElementById("plus-btn").style.display = "block";
          loadFolders();
          loadPromptsTable();
        });
      });

      // Load tags
      chrome.storage.local.get("tags", (data) => {
        const tagContainer = document.querySelector("#entry-tags");
        const tags = data.tags || [
          "SEO",
          "Marketing",
          "Social Media",
          "Advertisement",
          "Copywriting",
          "Productivity",
          "E-Commerce",
          "Education",
          "Tech",
          "Healthcare",
          "HR",
        ];
        tags.forEach((tag) => {
          const label = document.createElement("label");
          label.innerHTML = `<input type="checkbox" name="tags" value="${tag}"> ${tag}`;
          tagContainer.appendChild(label);
        });
      });

      // Add tag functionality
      document.querySelector("#add-tag-btn").addEventListener("click", () => {
        const newTagInput = document.querySelector("#new-tag");
        const newTag = newTagInput.value.trim();
        if (
          newTag &&
          !document.querySelector(`#entry-tags input[value="${newTag}"]`)
        ) {
          chrome.storage.local.get("tags", (data) => {
            const tags = data.tags || [];
            if (!tags.includes(newTag)) {
              tags.push(newTag);
              chrome.storage.local.set({ tags }, () => {
                const tagContainer = document.querySelector("#entry-tags");
                const label = document.createElement("label");
                label.innerHTML = `<input type="checkbox" name="tags" value="${newTag}" checked> ${newTag}`;
                tagContainer.appendChild(label);
                newTagInput.value = "";
              });
            } else {
              alert(
                translations[currentLang]?.tag_exists ||
                  "Tag existiert bereits!"
              );
            }
          });
        } else if (!newTag) {
          alert(
            translations[currentLang]?.tag_empty || "Tag darf nicht leer sein!"
          );
        }
      });
    }
  });

  // Initial Load
  loadFolders();
  loadPromptsTable();
});
