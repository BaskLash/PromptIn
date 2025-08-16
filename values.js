document.addEventListener("DOMContentLoaded", () => {
  // Übersetzungen
  let translations = {};
  let currentLang = localStorage.getItem("language") || "de";

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

  // Initiale Sprache laden
  loadTranslations(currentLang);
  document.getElementById("language-select").value = currentLang;

  // Sprachauswahl
  document.getElementById("language-select").addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("language", currentLang);
    loadTranslations(currentLang);
  });

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

  // Funktion zum Laden der Ordner aus Chrome Storage
  function loadFolders() {
    const folderList = document.getElementById("folder-list");
    folderList.innerHTML = "";

    chrome.storage.local.get(null, function (data) {
      if (!data || Object.keys(data).length === 0) {
        folderList.innerHTML = "<li>Keine Ordner vorhanden!</li>";
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
        folderList.innerHTML = "<li>Keine sichtbaren Ordner mit Prompts!</li>";
        return;
      }

      folders.forEach(([id, topic]) => {
        const li = document.createElement("li");
        li.textContent = `📁 ${topic.name} (${topic.prompts.length})`;
        li.dataset.folderId = id;
        li.addEventListener("click", () => showFolder(id));
        folderList.appendChild(li);
      });
    });
  }

  // Funktion zum Laden aller Prompts in der Haupttabelle
  function loadPromptsTable() {
    const tableBody = document.getElementById("prompts-table-body");
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
        return;
      }

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
          tr.addEventListener("click", (event) => {
            if (!event.target.classList.contains("action-btn")) {
              showPromptDetails(folderId, index);
            }
          });
          tableBody.appendChild(tr);
        });
    });
  }

  // Funktion zum Anzeigen der Inhalte eines Ordners
  function showFolder(folderId) {
    const folderEntries = document.getElementById("folder-entries");
    folderEntries.innerHTML = "";

    chrome.storage.local.get(null, function (data) {
      const topic = data[folderId];
      if (!topic || !topic.prompts || !Array.isArray(topic.prompts)) {
        folderEntries.innerHTML =
          '<tr><td colspan="2">Keine Prompts in diesem Ordner</td></tr>';
        return;
      }

      document.getElementById("folder-title").textContent = topic.name;
      topic.prompts.forEach((prompt, index) => {
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
        tr.addEventListener("click", (event) => {
          if (!event.target.classList.contains("action-btn")) {
            showPromptDetails(folderId, index);
          }
        });
        folderEntries.appendChild(tr);
      });

      document.getElementById("folder-overlay").style.display = "block";
    });
  }

  function showPromptDetails(folderId, promptIndex) {
    chrome.storage.local.get(folderId, function (data) {
      const prompt = data[folderId]?.prompts?.[promptIndex];
      if (prompt) {
        const detailSidebar = document.getElementById("detail-sidebar");
        const detailTitle = document.getElementById("detail-title");
        const entryTitle = document.getElementById("entry-title");
        const entryDescription = document.getElementById("entry-description");
        const entryContent = document.getElementById("entry-content");
        const entryFavorite = document.getElementById("entry-favorite");
        const entryCreatedAt = document.getElementById("entry-created-at");
        const entryLastUsed = document.getElementById("entry-last-used");
        const entryVersions = document.getElementById("entry-versions");

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

        // Felder auf readonly/disabled setzen
        entryTitle.readOnly = true;
        entryDescription.readOnly = true;
        entryContent.readOnly = true;
        entryFavorite.disabled = true;
        entryCreatedAt.readOnly = true;
        entryLastUsed.readOnly = true;
        document.getElementById("detail-actions").style.display = "none";

        // Speichere folderId und promptIndex für Bearbeitung
        entryTitle.dataset.folderId = folderId;
        entryTitle.dataset.promptIndex = promptIndex;

        detailSidebar.classList.add("open");
      }
    });
  }

  // Suchfunktion
  document
    .getElementById("search-input")
    .addEventListener("input", function () {
      const searchTerm = this.value.trim().toLowerCase();
      const tableBody = document.getElementById("prompts-table-body");
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
          return;
        }

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
          tr.addEventListener("click", (event) => {
            if (!event.target.classList.contains("action-btn")) {
              showPromptDetails(folderId, index);
            }
          });
          tableBody.appendChild(tr);
        });
      });
    });

  // Event-Listener für Navigation
  document.getElementById("burger-menu").addEventListener("click", () => {
    const sideNav = document.getElementById("side-nav");
    sideNav.style.display = "block";
    loadFolders();
  });

  document.getElementById("close-nav").addEventListener("click", () => {
    document.getElementById("side-nav").style.display = "none";
  });

  document.getElementById("folder-back-btn").addEventListener("click", () => {
    document.getElementById("folder-overlay").style.display = "none";
    document.getElementById("detail-sidebar").classList.remove("open");
  });

  // Detail Sidebar Buttons
  document.getElementById("detail-back-btn").addEventListener("click", () => {
    document.getElementById("detail-sidebar").classList.remove("open");
  });

  document.getElementById("edit-btn").addEventListener("click", () => {
    const entryTitle = document.getElementById("entry-title");
    const entryDescription = document.getElementById("entry-description");
    const entryContent = document.getElementById("entry-content");
    const entryFavorite = document.getElementById("entry-favorite");

    entryTitle.readOnly = false;
    entryDescription.readOnly = false;
    entryContent.readOnly = false;
    entryFavorite.disabled = false;
    document.getElementById("detail-actions").style.display = "flex";
  });

  document.getElementById("save-btn").addEventListener("click", () => {
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

    if (!title) {
      alert("Titel ist erforderlich!");
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
        versionId: `${Date.now()}_${generateUUID()}`,
        title,
        description,
        content,
        timestamp: Date.now(),
      });

      topic.prompts[promptIndex] = promptObj;
      chrome.storage.local.set({ [folderId]: topic }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error saving prompt:", chrome.runtime.lastError);
          alert("Fehler beim Speichern des Prompts.");
        } else {
          document.getElementById("detail-sidebar").classList.remove("open");
          loadFolders();
          loadPromptsTable();
        }
      });
    });
  });

  document.getElementById("cancel-btn").addEventListener("click", () => {
    const entryTitle = document.getElementById("entry-title");
    const entryDescription = document.getElementById("entry-description");
    const entryContent = document.getElementById("entry-content");
    const entryFavorite = document.getElementById("entry-favorite");

    entryTitle.readOnly = true;
    entryDescription.readOnly = true;
    entryContent.readOnly = true;
    entryFavorite.disabled = true;
    document.getElementById("detail-actions").style.display = "none";

    document.getElementById("detail-sidebar").classList.remove("open");
  });

  // Theme-Wechsel
  const themeSelect = document.getElementById("theme-select");
  themeSelect.addEventListener("change", function (e) {
    document.documentElement.setAttribute("data-theme", e.target.value);
    localStorage.setItem("theme", e.target.value);
  });
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeSelect.value = savedTheme;

  // Initiales Laden
  loadFolders();
  loadPromptsTable();
});
