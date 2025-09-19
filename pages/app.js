document.addEventListener("DOMContentLoaded", () => {
  // URL-Parameter auslesen und Kategorie verarbeiten
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view");
  if (view === "prompts") {
    const category = urlParams.get("category") || "All Prompts";
    switchView("prompts-view", { view: "prompts", category: category });
    document.getElementById("prompts-header").textContent = category;
    handleCategoryClick(category);
  } else if (view === "tags") {
    switchView("tags-view", { view: "tags" });
    loadTags();
  } else if (view === "types") {
    switchView("types-view", { view: "types" });
    loadTypes();
  } else if (view === "anonymizer") {
    switchView("anonymizer-view", { view: "anonymizer" });
    initializeAnonymizer();
  } else if (view === "analytics") {
    switchView("analytics-view", { view: "analytics" });
    initializeAnalytics();
  } else if (view === "benchmarking") {
    switchView("benchmarking-view", { view: "benchmarking" });
    initializeBenchmarking();
  } else if (view === "workflows") {
    switchView("workflow-view", { view: "workflows" });
    initializeWorkflows();
  } else {
    switchView("prompts-view", { view: "prompts", category: "All Prompts" });
    document.getElementById("prompts-header").textContent = "All Prompts";
    handleCategoryClick("All Prompts");
  }

  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const goalsList = document.querySelector(".table-container tbody");
  const folderList = document.querySelector(".folder-list");
  const accordionItems = document.querySelectorAll(".accordion-content li");
  const faqBtn = document.getElementById("faq-btn");
  const surveyBtn = document.getElementById("survey-btn");
  const addFolderBtn = document.getElementById("addFolderBtn");

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

  surveyBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://forms.gle/wZ43fNgqrBSPPE6N8" });
  });

  let folderSearchInput = document.querySelector("#folder-search");

  folderSearchInput.addEventListener("input", filterFolders);

  searchInput.addEventListener("input", filterGoals);

  // Sidebar-Breite aus localStorage wiederherstellen
  const savedWidth = localStorage.getItem("sidebarWidth");
  const sidebar = document.querySelector("aside");
  if (savedWidth) {
    sidebar.style.width = `${savedWidth}px`;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${savedWidth}px`
    );
  }

  window.addEventListener("popstate", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view");
    if (view === "prompts") {
      const category = urlParams.get("category");
      const folder = urlParams.get("folder");
      if (folder) {
        switchView("prompts-view", { view: "prompts", folder: folder });
        document.getElementById("prompts-header").textContent = folder;
        handleFolderClick(folder);
      } else {
        const categoryName = category || "All Prompts";
        switchView("prompts-view", { view: "prompts", category: categoryName });
        document.getElementById("prompts-header").textContent = categoryName;
        handleCategoryClick(categoryName);
      }
    } else if (view === "tags") {
      switchView("tags-view", { view: "tags" });
      loadTags();
    } else {
      switchView("prompts-view", { view: "prompts", category: "All Prompts" });
      document.getElementById("prompts-header").textContent = "All Prompts";
      handleCategoryClick("All Prompts");
    }
  });

  // Accordion-Mechanik
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", (event) => {
      if (!event.target.classList.contains("add-folder-header-btn")) {
        const content = header.nextElementSibling;
        content.classList.toggle("open");
      }
    });
  });

  // Folder-Suchfeld einblenden bei mehr als 5 Einträgen
  folderSearchInput = document.querySelector(".folder-search");
  const folderItems = folderList.querySelectorAll("li");

  if (folderItems.length > 5) {
    folderSearchInput.style.display = "block";
  } else {
    folderSearchInput.style.display = "none";
  }

  folderSearchInput.addEventListener("input", function () {
    const filter = this.value.toLowerCase();
    folderItems.forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(filter) ? "" : "none";
    });
  });

  // Sidebar-Resizer
  const resizer = document.getElementById("sidebar-resizer");
  let isResizing = false;
  let animationFrameId = null;
  let currentX = 0;

  const minWidth = 150;
  const maxWidth = 500;

  const resizeSidebar = () => {
    const newWidth = Math.min(Math.max(currentX, minWidth), maxWidth);
    sidebar.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${newWidth}px`
    );
    animationFrameId = null;
  };

  const onPointerMove = (e) => {
    if (!isResizing) return;
    currentX = e.clientX;
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(resizeSidebar);
    }
  };

  const onPointerUp = () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = "default";
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);

    const finalWidth = sidebar.offsetWidth;
    localStorage.setItem("sidebarWidth", finalWidth.toString());
  };

  resizer.addEventListener("pointerdown", (e) => {
    isResizing = true;
    currentX = e.clientX;
    document.body.style.cursor = "col-resize";
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    e.preventDefault();
  });

  const savedDetailsWidth = localStorage.getItem("detailsSidebarWidth");
  if (savedDetailsWidth) {
    document.getElementById(
      "details-sidebar"
    ).style.width = `${savedDetailsWidth}px`;
    document.documentElement.style.setProperty(
      "--details-sidebar-width",
      `${savedDetailsWidth}px`
    );
  }

  // Details Sidebar Resizer
  const resizerB = document.getElementById("details-sidebar-resizer");
  const sidebarB = document.getElementById("details-sidebar");

  let isResizingB = false;
  let animationFrameIdB = null;
  let currentX_B = 0;

  const minWidthB = 200;
  const maxWidthB = 800;

  // Funktion zur Anpassung der Resizer-Höhe
  const updateResizerHeight = () => {
    const sidebarHeight = sidebarB.scrollHeight; // Gesamte Höhe des Sidebars
    resizerB.style.height = `${sidebarHeight}px`;
  };

  // Breite setzen
  const resizeSidebarB = () => {
    const windowWidth = window.innerWidth;
    const newWidth = Math.min(
      Math.max(windowWidth - currentX_B, minWidthB),
      maxWidthB
    );
    sidebarB.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty(
      "--details-sidebar-width",
      `${newWidth}px`
    );
    updateResizerHeight(); // Höhe des Resizers bei jeder Breitenänderung aktualisieren
    animationFrameIdB = null;
  };

  // Mausbewegung während des Resizings
  const onPointerMoveB = (e) => {
    if (!isResizingB) return;
    currentX_B = e.clientX;
    if (!animationFrameIdB) {
      animationFrameIdB = requestAnimationFrame(resizeSidebarB);
    }
  };

  // Maus loslassen → speichern
  const onPointerUpB = () => {
    if (!isResizingB) return;
    isResizingB = false;
    document.body.style.cursor = "default";
    document.removeEventListener("pointermove", onPointerMoveB);
    document.removeEventListener("pointerup", onPointerUpB);

    const finalWidthB = sidebarB.offsetWidth;
    localStorage.setItem("detailsSidebarWidth", finalWidthB.toString());
  };

  // Start-Event
  resizerB.addEventListener("pointerdown", (e) => {
    isResizingB = true;
    currentX_B = e.clientX;
    document.body.style.cursor = "col-resize";
    document.addEventListener("pointermove", onPointerMoveB);
    document.addEventListener("pointerup", onPointerUpB);
    e.preventDefault();
  });

  // Initiale Anpassung der Resizer-Höhe
  document.addEventListener("DOMContentLoaded", () => {
    updateResizerHeight();

    // MutationObserver für Änderungen im Sidebar-Inhalt
    const observer = new MutationObserver(() => {
      updateResizerHeight();
    });
    observer.observe(sidebarB, {
      childList: true, // Änderungen an direkten Kindern
      subtree: true, // Änderungen an allen Nachkommen
      attributes: true, // Änderungen an Attributen (z. B. style)
    });
  });

  // Bei Fenstergrößenänderung Resizer-Höhe aktualisieren
  window.addEventListener("resize", updateResizerHeight);

  // Call injectStyles
  injectStyles();

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    if (document.getElementById("prompts-view").style.display === "block") {
      filterGoals(); // Bestehende Funktion zum Filtern der Prompts
    } else if (document.getElementById("tags-view").style.display === "block") {
      const tagBoxes = document.querySelectorAll(".tag-box");
      tagBoxes.forEach((box) => {
        const tagName = box
          .querySelector(".tag-name")
          .textContent.toLowerCase();
        box.style.display = tagName.includes(filter) ? "" : "none";
      });
    }
  });

  document.getElementById("addTypeBtn").addEventListener("click", () => {
    const typeName = prompt("Enter a new type:");
    if (typeName && typeName.trim()) {
      const newType = typeName.trim();
      chrome.storage.local.get("types", (data) => {
        const types = data.types || [];
        if (types.includes(newType)) {
          alert("Type exists already!");
          return;
        }
        types.push(newType);
        chrome.storage.local.set({ types }, () => {
          loadTypes();
        });
      });
    }
  });

  document.getElementById("addTagBtn").addEventListener("click", () => {
    const tagName = prompt("Enter a new tag:");
    if (tagName && tagName.trim()) {
      const newTag = tagName.trim();
      chrome.storage.local.get("tags", (data) => {
        const tags = data.tags || [];
        if (tags.includes(newTag)) {
          alert("Tag exists already!");
          return;
        }
        tags.push(newTag);
        chrome.storage.local.set({ tags }, () => {
          loadTags();
        });
      });
    }
  });

  document.querySelectorAll(".accordion-content li").forEach((item) => {
    item.addEventListener("click", () => {
      const view = item.getAttribute("data-view");
      const folder = item.getAttribute("data-folder");
      if (view === "tags") {
        switchView("tags-view", { view: "tags" });
        loadTags();
      } else if (view === "type") {
        switchView("types-view", { view: "types" });
        loadTypes();
      } else if (view === "anonymizer") {
        switchView("anonymizer-view", { view: "anonymizer" });
        initializeAnonymizer();
      } else if (view === "analytics") {
        switchView("analytics-view", { view: "analytics" });
        initializeAnalytics();
      } else if (view === "benchmarking") {
        switchView("benchmarking-view", { view: "benchmarking" });
        initializeBenchmarking();
      } else if (view === "workflows") {
        switchView("workflow-view", { view: "workflows" });
        initializeWorkflows();
      } else if (folder) {
        switchView("prompts-view", { view: "prompts", category: folder });
        document.getElementById("prompts-header").textContent =
          item.textContent.trim();
        handleCategoryClick(folder);
      }
    });
  });

  // Initialisiere die Ordnerliste
  loadFolders();

  // Event-Delegation für Folder-Klicks
  folderList.addEventListener("click", (event) => {
    const li = event.target.closest("li.folder-item");
    if (!li) return; // Kein Listenelement gefunden
    if (
      event.target.classList.contains("folder-action") ||
      event.target.classList.contains("dropdown-option")
    )
      return; // Ignoriere Klicks auf Aktions-Buttons oder Dropdown-Optionen
    const folder = li.getAttribute("data-folder");
    if (folder) {
      console.log(`Folder clicked: ${folder}`);
      switchView("prompts-view", { view: "prompts", folder: folder });
      handleFolderClick(folder);
    }
  });

  // Initialisiere die Prompts nur, wenn kein URL-Parameter vorhanden ist
  const category = urlParams.get("category");
  const folder = urlParams.get("folder");
  if (!category && !folder) {
    initializePrompts();
  }

  document.getElementById("addItemBtn").addEventListener("click", () => {
    const category = document.querySelector(".main-header h1").textContent;
    if (category === "Workflows") {
      showCreateWorkflowModal();
    } else {
      showCreatePromptModal(category);
    }
  });
});

function loadTags() {
  chrome.storage.local.get(["tags", "prompts"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data:", chrome.runtime.lastError);
      return;
    }

    const tags = data.tags || [];
    const allPrompts = data.prompts || {};
    const tagContainer = document.getElementById("tag-container");

    if (!tagContainer) {
      console.error("Tag container not found");
      return;
    }

    // Container leeren
    tagContainer.innerHTML = "";

    // Falls keine Tags vorhanden
    if (tags.length === 0) {
      const noTags = document.createElement("div");
      noTags.className = "no-tags";
      noTags.textContent =
        "No tags available. Create one to get started! Enter for example: blog-post, email, tweet, press-release, finance, healthcare, marketing, e-commerce, education";
      tagContainer.appendChild(noTags);
      return;
    }

    // Prompts in Array-Form bringen
    const promptsArray = Object.entries(allPrompts).map(
      ([promptId, prompt]) => ({
        ...prompt,
        id: promptId,
        folderId: prompt.folderId || null,
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        usageHistory: Array.isArray(prompt.usageHistory)
          ? prompt.usageHistory
          : [],
      })
    );

    // Tag-Gitter erstellen
    const tagGrid = document.createElement("div");
    tagGrid.className = "tag-grid";
    tagGrid.style.display = "flex";

    // Tägliche durchschnittliche Nutzung pro Tag berechnen
    const tagUsageStats = new Map();
    let maxDailyAverage = 0;

    tags.forEach((tag) => {
      const promptsOfTag = promptsArray.filter((p) => p.tags.includes(tag));
      let totalDailyAverage = 0;
      const promptCount = promptsOfTag.length;

      promptsOfTag.forEach((prompt) => {
        const usageHistory = prompt.usageHistory;
        if (usageHistory.length === 0) return;

        const timestamps = usageHistory
          .map((entry) => entry.timestamp)
          .filter((ts) => typeof ts === "number" && !isNaN(ts));

        if (timestamps.length === 0) return;

        const earliest = Math.min(...timestamps);
        const latest = Math.max(...timestamps);
        const timeSpanDays = (latest - earliest) / (1000 * 60 * 60 * 24) || 1; // Mindestens 1 Tag
        const dailyAverage = usageHistory.length / timeSpanDays;
        totalDailyAverage += dailyAverage;
      });

      const tagDailyAverage =
        promptCount > 0 ? totalDailyAverage / promptCount : 0;
      tagUsageStats.set(tag, { dailyAverage: tagDailyAverage, promptCount });
      if (tagDailyAverage > maxDailyAverage) {
        maxDailyAverage = tagDailyAverage;
      }
    });

    // Definiere Vergleichszeiträume
    const now = Date.now();
    const recentPeriod = 7 * 24 * 60 * 60 * 1000; // letzte 7 Tage
    const pastPeriod = 7 * 24 * 60 * 60 * 1000; // 7 Tage davor

    // Tag-Boxen erstellen
    tags.forEach((tag) => {
      const promptsOfTag = promptsArray.filter((p) => p.tags.includes(tag));
      const promptCount = promptsOfTag.length;

      // Performance-Berechnung
      let recentUses = 0;
      let pastUses = 0;

      promptsOfTag.forEach((prompt) => {
        if (Array.isArray(prompt.usageHistory)) {
          prompt.usageHistory.forEach((entry) => {
            if (!entry.timestamp) return;
            if (entry.timestamp >= now - recentPeriod) {
              recentUses++;
            } else if (
              entry.timestamp < now - recentPeriod &&
              entry.timestamp >= now - (recentPeriod + pastPeriod)
            ) {
              pastUses++;
            }
          });
        }
      });

      let performancePercent = 0;
      let trendArrow = "→";
      let colorStyle = "color: gray;";
      let statusText = "Inactive";

      if (recentUses > 0 || pastUses > 0) {
        if (pastUses === 0 && recentUses > 0) {
          performancePercent = 100;
          trendArrow = "↑";
          colorStyle = "color: green;";
          statusText = `${performancePercent}% ↑`;
        } else if (pastUses > 0) {
          performancePercent = Math.round(
            ((recentUses - pastUses) / pastUses) * 100
          );
          if (performancePercent > 0) {
            trendArrow = "↑";
            colorStyle = "color: green;";
            statusText = `${performancePercent}% ↑`;
          } else if (performancePercent < 0) {
            trendArrow = "↓";
            colorStyle = "color: red;";
            statusText = `${performancePercent}% ↓`;
          } else {
            statusText = "0% →";
          }
        }
      }

      // Neue Statistik: tägliche durchschnittliche Nutzung
      const stats = tagUsageStats.get(tag) || {
        dailyAverage: 0,
        promptCount: 0,
      };
      const dailyAverage = stats.dailyAverage.toFixed(4);
      const percentage =
        maxDailyAverage > 0
          ? ((stats.dailyAverage / maxDailyAverage) * 100).toFixed(2)
          : 0;

      // Tag-Box rendern
      const tagBox = document.createElement("div");
      tagBox.className = "tag-box";
      tagBox.dataset.tag = escapeHTML(tag);
      tagBox.innerHTML = `
        <span class="tag-name">${escapeHTML(tag)}</span>
        <span class="prompt-count">${promptCount} Prompt${
        promptCount !== 1 ? "s" : ""
      }</span>
        <span class="stats" style="${colorStyle}">
          ${statusText} | Avg Daily: ${dailyAverage} (${percentage}%)
        </span>
        <button class="delete-tag-btn" data-tag="${escapeHTML(
          tag
        )}" title="Delete Tag">×</button>
      `;

      tagGrid.appendChild(tagBox);
    });

    tagContainer.appendChild(tagGrid);

    // Event-Listener für Tag-Boxen (Modal öffnen)
    document.querySelectorAll(".tag-box").forEach((box) => {
      box.addEventListener("click", (e) => {
        if (!e.target.classList.contains("delete-tag-btn")) {
          const tag = box.dataset.tag;
          showPromptTagModal(tag, promptsArray);
        }
      });
    });

    // Event-Listener für Delete-Tag-Buttons
    document.querySelectorAll(".delete-tag-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTag(btn.dataset.tag);
      });
    });
  });
}

// ===============================================
// Function: loadTypes()
// Purpose:  Display all types, calculate usage
//           statistics (including daily averages
//           and performance trends), and render
//           them in the UI with delete controls.
// ===============================================
function loadTypes() {
  chrome.storage.local.get(["types", "prompts"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data:", chrome.runtime.lastError);
      return;
    }

    const types = data.types || [];
    const allPrompts = data.prompts || {};
    const typeContainer = document.getElementById("type-container");

    if (!typeContainer) {
      console.error("Type container not found");
      return;
    }

    // Clear container
    typeContainer.innerHTML = "";

    // If no types exist
    if (types.length === 0) {
      const noTypes = document.createElement("div");
      noTypes.className = "no-tags";
      noTypes.textContent =
        "No types available. Create one to get started! Enter for example: textgen, rewrite, summarize, translate, ideation, adcopy, storytelling, analyze, classify, extract, compare, codegen, debug, refactor, explain-code, prompt-engineering, meta-prompt, assistant";
      typeContainer.appendChild(noTypes);
      return;
    }

    // Convert prompts object into array form
    const promptsArray = Object.entries(allPrompts).map(
      ([promptId, prompt]) => ({
        ...prompt,
        id: promptId,
        folderId: prompt.folderId || null,
        types: Array.isArray(prompt.types) ? prompt.types : [],
        usageHistory: Array.isArray(prompt.usageHistory)
          ? prompt.usageHistory
          : [],
      })
    );

    // Create grid container
    const typeGrid = document.createElement("div");
    typeGrid.className = "tag-grid";
    typeGrid.style.display = "flex";

    // Daily average usage calculation across all types
    const typeUsageStats = new Map();
    let maxDailyAverage = 0;

    // Check overall activity in the last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const hasRecentActivity = promptsArray.some((prompt) =>
      prompt.usageHistory.some((entry) => entry.timestamp >= sevenDaysAgo)
    );

    types.forEach((type) => {
      const promptsOfType = promptsArray.filter((prompt) =>
        prompt.types.includes(type)
      );
      let totalDailyAverage = 0;
      const promptCount = promptsOfType.length;

      promptsOfType.forEach((prompt) => {
        const usageHistory = prompt.usageHistory;
        if (usageHistory.length === 0) return;

        const timestamps = usageHistory
          .map((entry) => entry.timestamp)
          .filter((ts) => typeof ts === "number" && !isNaN(ts));
        if (timestamps.length === 0) return;

        const earliest = Math.min(...timestamps);
        const latest = Math.max(...timestamps);
        const timeSpanDays = (latest - earliest) / (1000 * 60 * 60 * 24) || 1;
        const dailyAverage = usageHistory.length / timeSpanDays;
        totalDailyAverage += dailyAverage;
      });

      const typeDailyAverage =
        promptCount > 0 ? totalDailyAverage / promptCount : 0;
      typeUsageStats.set(type, { dailyAverage: typeDailyAverage, promptCount });

      if (typeDailyAverage > maxDailyAverage) {
        maxDailyAverage = typeDailyAverage;
      }
    });

    // Render type boxes
    types.forEach((type) => {
      const promptsOfType = promptsArray.filter((prompt) =>
        prompt.types.includes(type)
      );
      const promptCount = promptsOfType.length;

      // Performance calculation with inactivity check
      let performancePercent = 0;
      let trendArrow = "→";
      let colorStyle = "color: gray;";
      let statusText = "";

      if (!hasRecentActivity) {
        statusText = "No usage (inactive)";
        performancePercent = 0;
        trendArrow = "−";
      } else {
        let recentUses = 0;
        let totalUsesBefore = 0;

        promptsOfType.forEach((prompt) => {
          if (Array.isArray(prompt.usageHistory)) {
            prompt.usageHistory.forEach((ts) => {
              if (ts.timestamp >= sevenDaysAgo) {
                recentUses++;
              } else {
                totalUsesBefore++;
              }
            });
          }
        });

        if (recentUses > 0 || totalUsesBefore > 0) {
          const pastAvg = totalUsesBefore / (promptCount || 1);
          const recentAvg = recentUses / (promptCount || 1);

          if (pastAvg === 0 && recentAvg > 0) {
            performancePercent = 100;
            trendArrow = "↑";
            colorStyle = "color: green;";
            statusText = `${performancePercent}% ↑`;
          } else if (pastAvg > 0) {
            performancePercent = Math.round(
              ((recentAvg - pastAvg) / pastAvg) * 100
            );
            if (performancePercent > 0) {
              trendArrow = "↑";
              colorStyle = "color: green;";
              statusText = `${performancePercent}% ↑`;
            } else if (performancePercent < 0) {
              trendArrow = "↓";
              colorStyle = "color: red;";
              statusText = `${performancePercent}% ↓`;
            } else {
              statusText = "0% →";
            }
          } else {
            statusText = "0% →";
          }
        } else {
          statusText = "No usage";
        }
      }

      // Daily averages & percentages
      const stats = typeUsageStats.get(type) || {
        dailyAverage: 0,
        promptCount: 0,
      };
      const dailyAverage = stats.dailyAverage.toFixed(4);
      const percentage =
        maxDailyAverage > 0
          ? ((stats.dailyAverage / maxDailyAverage) * 100).toFixed(2)
          : 0;

      // Build type box
      const typeBox = document.createElement("div");
      typeBox.className = "tag-box";
      typeBox.dataset.type = escapeHTML(type);
      typeBox.innerHTML = `
        <span class="tag-name">${escapeHTML(type)}</span>
        <span class="prompt-count">${promptCount} Prompt${
        promptCount !== 1 ? "s" : ""
      }</span>
        <span class="stats" style="${colorStyle}">
          ${statusText} | Avg Daily: ${dailyAverage} (${percentage}%)
        </span>
        <button class="delete-tag-btn" data-type="${escapeHTML(
          type
        )}" title="Delete type">×</button>
      `;

      typeGrid.appendChild(typeBox);
    });

    typeContainer.appendChild(typeGrid);

    // Event listener for type boxes (open modal)
    document.querySelectorAll(".tag-box").forEach((box) => {
      box.addEventListener("click", (e) => {
        if (!e.target.classList.contains("delete-tag-btn")) {
          const type = box.dataset.type;
          showPromptTypeModal(type, promptsArray);
        }
      });
    });

    // Event listener for delete buttons
    document.querySelectorAll(".delete-tag-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteType(btn.dataset.type);
      });
    });
  });
}

function deleteType(typeToDelete) {
  if (!typeToDelete) return;

  chrome.storage.local.get(["types", "prompts"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data:", chrome.runtime.lastError);
      return;
    }

    const types = data.types || [];
    const prompts = data.prompts || {};

    // 1. Type aus der globalen Type-Liste entfernen
    const updatedTypes = types.filter((type) => type !== typeToDelete);

    // 2. Type bei allen Prompts löschen
    const updatedPrompts = {};
    for (const [promptId, prompt] of Object.entries(prompts)) {
      if (Array.isArray(prompt.types) && prompt.types.includes(typeToDelete)) {
        updatedPrompts[promptId] = {
          ...prompt,
          types: prompt.types.filter((type) => type !== typeToDelete),
        };
      }
    }

    // 3. Änderungen speichern
    chrome.storage.local.set(
      {
        types: updatedTypes,
        prompts: { ...prompts, ...updatedPrompts },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving updated tags:", chrome.runtime.lastError);
        } else {
          console.log(
            `Tag "${typeToDelete}" gelöscht und aus allen Prompts entfernt.`
          );
          loadTypes(); // UI neu laden
        }
      }
    );
  });
}

function deleteTag(tagToDelete) {
  if (!tagToDelete) return;

  chrome.storage.local.get(["tags", "prompts"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data:", chrome.runtime.lastError);
      return;
    }

    const tags = data.tags || [];
    const prompts = data.prompts || {};

    // 1. Tag aus der globalen Tag-Liste entfernen
    const updatedTags = tags.filter((tag) => tag !== tagToDelete);

    // 2. Tag bei allen Prompts löschen
    const updatedPrompts = {};
    for (const [promptId, prompt] of Object.entries(prompts)) {
      if (Array.isArray(prompt.tags) && prompt.tags.includes(tagToDelete)) {
        updatedPrompts[promptId] = {
          ...prompt,
          tags: prompt.tags.filter((tag) => tag !== tagToDelete),
        };
      }
    }

    // 3. Änderungen speichern
    chrome.storage.local.set(
      {
        tags: updatedTags,
        prompts: { ...prompts, ...updatedPrompts },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving updated tags:", chrome.runtime.lastError);
        } else {
          console.log(
            `Tag "${tagToDelete}" gelöscht und aus allen Prompts entfernt.`
          );
          loadTags(); // UI neu laden
        }
      }
    );
  });
}

function switchView(viewId, params = {}) {
  document.querySelectorAll("main > div").forEach((div) => {
    div.style.display = "none";
  });
  const selectedView = document.getElementById(viewId);
  if (selectedView) {
    selectedView.style.display = "block";
  }
  const url = new URL(window.location);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  window.history.pushState({}, "", url);
}

function initializeTags() {
  chrome.storage.local.get("tags", (data) => {
    if (!data.tags) {
      const defaultTags = [
        "SEO",
        "Marketing",
        "Social Media",
        "Advertising",
        "Creative Writing",
        "Productivity",
        "E-Commerce",
        "Education",
        "Technology",
        "Healthcare",
        "Human Resources",
      ];
      chrome.storage.local.set({ tags: defaultTags }, () => {
        console.log("Default tags initialized");
      });
    }
  });
}

function initializeTypes() {
  chrome.storage.local.get("types", (data) => {
    if (!data.types) {
      const defaultTypes = [
        //  <!-- Generative Aufgaben -->
        "textgen",
        "rewrite",
        "summarize",
        "translate",
        "ideation",
        "adcopy",
        "storytelling",
        // <!-- Analytische Aufgaben -->
        "analyze",
        "classify",
        "extract",
        "compare",
        // <!-- Technische Aufgaben -->
        "codegen",
        "debug",
        "refactor",
        "explain-code",
        // <!-- Prompt-spezifische Aufgaben -->
        "prompt-engineering",
        "meta-prompt",
        // <!-- Sonstige -->
        "assistant",
      ];
      chrome.storage.local.set({ types: defaultTypes }, () => {
        console.log("Default types initialized");
      });
    }
  });
}

// Funktion zum Entfernen von HTML-Sonderzeichen
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===============================================
// Function: showPromptTagModal(tag)
// Purpose:  Display all prompts with the given tag,
//           calculate their usage stats, and visualize
//           the results both numerically and graphically.
// ===============================================
function showPromptTagModal(tag) {
  const modal = document.getElementById("promptModal");
  const modalTagName = document.getElementById("modalTagName");
  const modalPromptList = document.getElementById("modalPromptList");

  if (!modal || !modalTagName || !modalPromptList) {
    console.error("Modal elements not found");
    return;
  }

  // Load prompts and folders from Chrome storage
  chrome.storage.local.get(["prompts", "folders"], (data) => {
    const allPrompts = data.prompts || {};
    const folders = data.folders || {};

    // Set modal title
    modalTagName.textContent = `Tag: ${escapeHTML(tag)}`;

    // Step 1: Filter all prompts that include this tag
    const filteredPrompts = Object.values(allPrompts)
      .filter(
        (prompt) => Array.isArray(prompt.tags) && prompt.tags.includes(tag)
      )
      .map((prompt) => ({
        ...prompt,
        usageHistory: Array.isArray(prompt.usageHistory)
          ? prompt.usageHistory
          : [],
      }));

    // Step 2: Calculate daily averages for each prompt
    let maxDailyAverage = 0;
    const promptStats = filteredPrompts.map((prompt) => {
      let dailyAverage = 0;

      if (prompt.usageHistory.length > 0) {
        const timestamps = prompt.usageHistory
          .map((entry) => entry.timestamp)
          .filter((ts) => typeof ts === "number" && !isNaN(ts));

        if (timestamps.length > 0) {
          const earliest = Math.min(...timestamps);
          const latest = Math.max(...timestamps);
          const timeSpanDays = (latest - earliest) / (1000 * 60 * 60 * 24) || 1; // At least 1 day
          dailyAverage = prompt.usageHistory.length / timeSpanDays;
        }
      }

      if (dailyAverage > maxDailyAverage) {
        maxDailyAverage = dailyAverage;
      }

      return { ...prompt, dailyAverage };
    });

    // Step 3: Build HTML list of prompts
    let promptListHTML = "";
    if (promptStats.length === 0) {
      promptListHTML = "<p>No prompts found for this tag.</p>";
    } else {
      promptListHTML = promptStats
        .map((prompt) => {
          const folderName = prompt.folderId
            ? folders[prompt.folderId]?.name || "Unknown Folder"
            : "No Folder";
          const percentage =
            maxDailyAverage > 0
              ? ((prompt.dailyAverage / maxDailyAverage) * 100).toFixed(2)
              : 0;

          return `
            <div class="prompt-item" 
                 data-prompt-id="${escapeHTML(prompt.promptId)}" 
                 data-folder-id="${escapeHTML(prompt.folderId || "")}"
                 style="cursor: pointer;">
              <h3>${escapeHTML(prompt.title || "Untitled")}</h3>
              <p>Category: ${escapeHTML(folderName)}</p>
              <p>Created: ${new Date(
                prompt.createdAt || 0
              ).toLocaleString()}</p>
              <p>Avg Daily Usage: ${prompt.dailyAverage.toFixed(
                4
              )} (${percentage}%)</p>
              <button class="remove-tag-btn" 
                      data-tag="${escapeHTML(tag)}" 
                      data-prompt-id="${escapeHTML(prompt.promptId)}" 
                      title="Remove this tag from the prompt">×</button>
            </div>
          `;
        })
        .join("");
    }

    // Step 4: Add chart containers (Bar Chart + optional Line Chart)
    const chartHTML = `
      <div id="usageChartContainer" style="margin-top: 20px;">
        <h3>Daily Usage Comparison</h3>
        <canvas id="usageBarChart" style="max-width: 600px; max-height: 400px;"></canvas>
      </div>
      <div id="trendChartContainer" style="margin-top: 20px;">
        <h3>Usage Trend Over Time</h3>
        <canvas id="usageLineChart" style="max-width: 600px; max-height: 400px;"></canvas>
      </div>
    `;

    modalPromptList.innerHTML = promptListHTML + chartHTML;

    // Step 5: Load Chart.js
    const script = document.createElement("script");
    script.src = "chart.umd.min.js";
    script.onload = () => {
      // ========== Bar Chart (Average Daily Usage) ==========
      const barCtx = document.getElementById("usageBarChart").getContext("2d");
      if (promptStats.length > 0) {
        new Chart(barCtx, {
          type: "bar",
          data: {
            labels: promptStats.map((prompt) =>
              escapeHTML(prompt.title || "Untitled").substring(0, 15)
            ),
            datasets: [
              {
                label: "Avg Daily Usage",
                data: promptStats.map((p) => p.dailyAverage.toFixed(4)),
                backgroundColor: "rgba(100, 150, 255, 0.6)",
                borderColor: "rgba(100, 150, 255, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "Average Daily Usage" },
              },
              x: { title: { display: true, text: "Prompts" } },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw;
                    const percentage =
                      maxDailyAverage > 0
                        ? ((value / maxDailyAverage) * 100).toFixed(2)
                        : 0;
                    return `Usage: ${value} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      } else {
        barCtx.canvas.parentNode.innerHTML += "<p>No data available</p>";
      }

      // ========== Line Chart (Usage Trend Over Time) ==========
      const lineCtx = document
        .getElementById("usageLineChart")
        .getContext("2d");
      const trendData = buildTrendData(promptStats);

      if (trendData.labels.length > 0) {
        new Chart(lineCtx, {
          type: "line",
          data: {
            labels: trendData.labels,
            datasets: trendData.datasets,
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "Daily Usage Count" },
              },
              x: { title: { display: true, text: "Date" } },
            },
          },
        });
      } else {
        lineCtx.canvas.parentNode.innerHTML +=
          "<p>Not enough timestamp data for trend analysis</p>";
      }
    };
    document.body.appendChild(script);

    // Step 6: Event handlers (remove tag + open prompt details)
    document.querySelectorAll(".remove-tag-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const tag = btn.dataset.tag;
        const promptId = btn.dataset.promptId;
        if (!promptId) {
          console.error("Prompt-ID missing!");
          return;
        }
        removeTagFromPrompt(tag, promptId);
      });
    });

    document.querySelectorAll(".prompt-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-tag-btn")) return;
        const folderId = item.dataset.folderId;
        modal.style.display = "none";

        if (!folderId) {
          switchView("prompts-view", {
            view: "prompts",
            category: "Single Prompts",
          });
          handleCategoryClick("Single Prompts");
        } else {
          switchView("prompts-view", { view: "prompts", folderId });
          handleFolderClick(folderId);
        }
      });
    });

    // Step 7: Close modal
    const closeModal = document.querySelector(".close-modal");
    if (closeModal) {
      closeModal.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    modal.style.display = "flex";
  });
}

function showPromptTypeModal(type) {
  const modal = document.getElementById("promptModal");
  const modalTagName = document.getElementById("modalTagName");
  const modalPromptList = document.getElementById("modalPromptList");

  if (!modal || !modalTagName || !modalPromptList) {
    console.error("Modal elements not found");
    return;
  }

  // Load prompts and folders from Chrome storage
  chrome.storage.local.get(["prompts", "folders"], (data) => {
    const allPrompts = data.prompts || {};
    const folders = data.folders || {};

    // Set modal title
    modalTagName.textContent = `Type: ${escapeHTML(type)}`;

    // Step 1: Filter all prompts that include this type
    const filteredPrompts = Object.entries(allPrompts)
      .map(([promptId, prompt]) => ({
        ...prompt,
        promptId,
        usageHistory: Array.isArray(prompt.usageHistory)
          ? prompt.usageHistory
          : [],
      }))
      .filter(
        (prompt) => Array.isArray(prompt.types) && prompt.types.includes(type)
      );

    // Step 2: Calculate daily averages for each prompt
    let maxDailyAverage = 0;
    const promptStats = filteredPrompts.map((prompt) => {
      let dailyAverage = 0;

      if (prompt.usageHistory.length > 0) {
        const timestamps = prompt.usageHistory
          .map((entry) => entry.timestamp)
          .filter((ts) => typeof ts === "number" && !isNaN(ts));

        if (timestamps.length > 0) {
          const earliest = Math.min(...timestamps);
          const latest = Math.max(...timestamps);
          const timeSpanDays = (latest - earliest) / (1000 * 60 * 60 * 24) || 1; // At least 1 day
          dailyAverage = prompt.usageHistory.length / timeSpanDays;
        }
      }

      if (dailyAverage > maxDailyAverage) {
        maxDailyAverage = dailyAverage;
      }

      return { ...prompt, dailyAverage };
    });

    // Step 3: Build HTML list of prompts
    let promptListHTML = "";
    if (promptStats.length === 0) {
      promptListHTML = "<p>No prompts found for this type.</p>";
    } else {
      promptListHTML = promptStats
        .map((prompt) => {
          const folderName = prompt.folderId
            ? folders[prompt.folderId]?.name || "Unknown Folder"
            : "No Folder";
          const percentage =
            maxDailyAverage > 0
              ? ((prompt.dailyAverage / maxDailyAverage) * 100).toFixed(2)
              : 0;

          return `
            <div class="prompt-item" 
                 data-prompt-id="${escapeHTML(prompt.promptId)}" 
                 data-folder-id="${escapeHTML(prompt.folderId || "")}"
                 style="cursor: pointer;">
              <h3>${escapeHTML(prompt.title || "Untitled")}</h3>
              <p>Category: ${escapeHTML(folderName)}</p>
              <p>Created: ${new Date(
                prompt.createdAt || 0
              ).toLocaleString()}</p>
              <p>Avg Daily Usage: ${prompt.dailyAverage.toFixed(
                4
              )} (${percentage}%)</p>
              <button class="remove-type-btn" 
                      data-type="${escapeHTML(type)}" 
                      data-prompt-id="${escapeHTML(prompt.promptId)}" 
                      title="Remove this type from the prompt">×</button>
            </div>
          `;
        })
        .join("");
    }

    // Step 4: Add chart containers (Bar Chart + optional Line Chart)
    const chartHTML = `
      <div id="usageChartContainer" style="margin-top: 20px;">
        <h3>Daily Usage Comparison</h3>
        <canvas id="usageBarChart" style="max-width: 600px; max-height: 400px;"></canvas>
      </div>
      <div id="trendChartContainer" style="margin-top: 20px;">
        <h3>Usage Trend Over Time</h3>
        <canvas id="usageLineChart" style="max-width: 600px; max-height: 400px;"></canvas>
      </div>
    `;

    modalPromptList.innerHTML = promptListHTML + chartHTML;

    // Step 5: Load Chart.js
    const script = document.createElement("script");
    script.src = "chart.umd.min.js";
    script.onload = () => {
      // ========== Bar Chart (Average Daily Usage) ==========
      const barCtx = document.getElementById("usageBarChart").getContext("2d");
      if (promptStats.length > 0) {
        new Chart(barCtx, {
          type: "bar",
          data: {
            labels: promptStats.map((prompt) =>
              escapeHTML(prompt.title || "Untitled").substring(0, 15)
            ),
            datasets: [
              {
                label: "Avg Daily Usage",
                data: promptStats.map((p) => p.dailyAverage.toFixed(4)),
                backgroundColor: "rgba(100, 150, 255, 0.6)",
                borderColor: "rgba(100, 150, 255, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "Average Daily Usage" },
              },
              x: { title: { display: true, text: "Prompts" } },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const value = context.raw;
                    const percentage =
                      maxDailyAverage > 0
                        ? ((value / maxDailyAverage) * 100).toFixed(2)
                        : 0;
                    return `Usage: ${value} (${percentage}%)`;
                  },
                },
              },
            },
          },
        });
      } else {
        barCtx.canvas.parentNode.innerHTML += "<p>No data available</p>";
      }

      // ========== Line Chart (Usage Trend Over Time) ==========
      const lineCtx = document
        .getElementById("usageLineChart")
        .getContext("2d");
      const trendData = buildTrendData(promptStats);

      if (trendData.labels.length > 0) {
        new Chart(lineCtx, {
          type: "line",
          data: {
            labels: trendData.labels,
            datasets: trendData.datasets,
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: "Daily Usage Count" },
              },
              x: { title: { display: true, text: "Date" } },
            },
          },
        });
      } else {
        lineCtx.canvas.parentNode.innerHTML +=
          "<p>Not enough timestamp data for trend analysis</p>";
      }
    };
    document.body.appendChild(script);

    // Step 6: Event handlers (remove type + open prompt details)
    document.querySelectorAll(".remove-type-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = btn.dataset.type;
        const promptId = btn.dataset.promptId;
        if (!promptId) {
          console.error("Prompt-ID missing!");
          return;
        }
        removeTypeFromPrompt(type, promptId);
      });
    });

    document.querySelectorAll(".prompt-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-type-btn")) return;
        const folderId = item.dataset.folderId;
        modal.style.display = "none";

        if (!folderId) {
          switchView("prompts-view", {
            view: "prompts",
            category: "Single Prompts",
          });
          handleCategoryClick("Single Prompts");
        } else {
          switchView("prompts-view", { view: "prompts", folderId });
          handleFolderClick(folderId);
        }
      });
    });

    // Step 7: Close modal
    const closeModal = document.querySelector(".close-modal");
    if (closeModal) {
      closeModal.addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    modal.style.display = "flex";
  });
}

// ===============================================
// Helper: buildTrendData()
// Groups usageHistory by day for all prompts,
// prepares datasets for Chart.js line chart.
// ===============================================
function buildTrendData(promptStats) {
  const dateMap = {}; // {dateString: {promptId: count}}

  promptStats.forEach((prompt) => {
    prompt.usageHistory.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      if (!dateMap[date]) dateMap[date] = {};
      if (!dateMap[date][prompt.promptId]) dateMap[date][prompt.promptId] = 0;
      dateMap[date][prompt.promptId]++;
    });
  });

  const labels = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));

  const datasets = promptStats.map((prompt, idx) => {
    const data = labels.map((date) => dateMap[date][prompt.promptId] || 0);
    return {
      label: escapeHTML(prompt.title || "Untitled"),
      data,
      borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
      fill: false,
      tension: 0.3,
    };
  });

  return { labels, datasets };
}

/**
 * Entfernt einen Tag aus einem Prompt und aktualisiert den Speicher + DOM.
 */
function removeTagFromPrompt(tag, promptId) {
  chrome.storage.local.get(["prompts"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading prompts:", chrome.runtime.lastError);
      return;
    }

    const prompts = data.prompts || {};

    if (!prompts[promptId]) {
      console.error(`Prompt mit ID ${promptId} nicht gefunden`);
      return;
    }

    const prompt = prompts[promptId];

    if (!Array.isArray(prompt.tags) || !prompt.tags.includes(tag)) {
      console.warn(`Tag "${tag}" nicht im Prompt ${promptId} enthalten`);
      return;
    }

    // Tag entfernen
    prompts[promptId] = {
      ...prompt,
      tags: prompt.tags.filter((t) => t !== tag),
    };

    // Änderungen speichern
    chrome.storage.local.set({ prompts }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving updated prompts:",
          chrome.runtime.lastError
        );
        return;
      }

      console.log(`Tag "${tag}" wurde aus Prompt ${promptId} entfernt.`);

      // Prompt-Element aus der Tag-Liste entfernen
      const promptElement = document.querySelector(
        `#modalPromptList .prompt-item[data-prompt-id="${CSS.escape(
          promptId
        )}"]`
      );
      if (promptElement) {
        promptElement.remove();
      }
    });
  });
}

function removeTypeFromPrompt(type, promptId) {
  chrome.storage.local.get(["prompts"], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading prompts:", chrome.runtime.lastError);
      return;
    }

    const prompts = data.prompts || {};

    if (!prompts[promptId]) {
      console.error(`Prompt mit ID ${promptId} nicht gefunden`);
      return;
    }

    const prompt = prompts[promptId];

    if (!Array.isArray(prompt.types) || !prompt.types.includes(type)) {
      console.warn(`Type "${type}" nicht im Prompt ${promptId} enthalten`);
      return;
    }

    // Type entfernen
    prompts[promptId] = {
      ...prompt,
      types: prompt.types.filter((t) => t !== type),
    };

    // Änderungen speichern
    chrome.storage.local.set({ prompts }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving updated prompts:",
          chrome.runtime.lastError
        );
        return;
      }

      console.log(`Type "${type}" wurde aus Prompt ${promptId} entfernt.`);

      // Prompt-Element aus der Tag-Liste entfernen
      const promptElement = document.querySelector(
        `#modalPromptList .prompt-item[data-prompt-id="${CSS.escape(
          promptId
        )}"]`
      );
      if (promptElement) {
        promptElement.remove();
      }
    });
  });
}