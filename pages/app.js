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
  } else if (view === "anonymizer") {
    switchView("anonymizer-view", { view: "anonymizer" });
    initializeAnonymizer();
  } else if (view === "analytics") {
    switchView("analytics-view", { view: "analytics" });
    initializeAnalytics();
  } else if (view === "storage") {
    switchView("storage-view", { view: "storage" });
    initializeStorage();
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
    chrome.tabs.create({ url: chrome.runtime.getURL("pages/faq.html") });
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

  // Details Sidebar Resizer
  const detailsResizer = document.getElementById("details-sidebar-resizer");
  const detailsSidebar = document.querySelector(".details-sidebar");
  let isDetailsResizing = false;
  let detailsAnimationFrameId = null;
  let detailsCurrentX = 0;

  const detailsMinWidth = 200;
  const detailsMaxWidth = 600;

  // Restore saved width from localStorage
  const savedDetailsWidth = localStorage.getItem("detailsSidebarWidth");
  if (savedDetailsWidth) {
    detailsSidebar.style.width = `${savedDetailsWidth}px`;
    document.documentElement.style.setProperty(
      "--details-sidebar-width",
      `${savedDetailsWidth}px`
    );
  }

  const resizeDetailsSidebar = () => {
    const newWidth = Math.min(
      Math.max(window.innerWidth - detailsCurrentX, detailsMinWidth),
      detailsMaxWidth
    );
    detailsSidebar.style.width = `${newWidth}px`;
    document.documentElement.style.setProperty(
      "--details-sidebar-width",
      `${newWidth}px`
    );
    detailsAnimationFrameId = null;
  };

  const onDetailsPointerMove = (e) => {
    if (!isDetailsResizing) return;
    detailsCurrentX = e.clientX;
    if (!detailsAnimationFrameId) {
      detailsAnimationFrameId = requestAnimationFrame(resizeDetailsSidebar);
    }
  };

  const onDetailsPointerUp = () => {
    if (!isDetailsResizing) return;
    isDetailsResizing = false;
    document.body.style.cursor = "default";
    document.removeEventListener("pointermove", onDetailsPointerMove);
    document.removeEventListener("pointerup", onDetailsPointerUp);

    const finalWidth = detailsSidebar.offsetWidth;
    localStorage.setItem("detailsSidebarWidth", finalWidth.toString());
  };

  detailsResizer.addEventListener("pointerdown", (e) => {
    isDetailsResizing = true;
    detailsCurrentX = e.clientX;
    document.body.style.cursor = "col-resize";
    document.addEventListener("pointermove", onDetailsPointerMove);
    document.addEventListener("pointerup", onDetailsPointerUp);
    e.preventDefault();
  });

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
      } else if (view === "anonymizer") {
        switchView("anonymizer-view", { view: "anonymizer" });
        initializeAnonymizer();
      } else if (view === "analytics") {
        switchView("analytics-view", { view: "analytics" });
        initializeAnalytics();
      } else if (view === "storage") {
        switchView("storage-view", { view: "storage" });
        initializeStorage();
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
  chrome.storage.local.get(null, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data:", chrome.runtime.lastError);
      return;
    }
    const tags = data.tags || [];
    const tagContainer = document.getElementById("tag-container");
    if (!tagContainer) {
      console.error("Tag container not found");
      return;
    }

    // Clear the container
    tagContainer.innerHTML = "";

    // Check if there are no tags
    if (tags.length === 0) {
      const noTags = document.createElement("div");
      noTags.className = "no-tags";
      noTags.textContent = "No tags available. Create one to get started!";
      tagContainer.appendChild(noTags);
      return;
    }

    // Sammle und aktualisiere Prompts
    const folderPrompts = Object.entries(data)
      .filter(
        ([key, topic]) =>
          topic.prompts && !topic.isTrash && key.startsWith("folder_")
      )
      .flatMap(([key, topic]) => {
        const updatedPrompts = topic.prompts.map((prompt) => {
          if (!prompt.id) {
            prompt.id = `prompt_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }
          return {
            ...prompt,
            storageKey: key,
            folderId: prompt.folderId || key,
            tags: Array.isArray(prompt.tags) ? prompt.tags : [],
          };
        });
        // Speichere die aktualisierten Prompts zurück
        chrome.storage.local.set({
          [key]: { ...topic, prompts: updatedPrompts },
        });
        return updatedPrompts;
      });

    const hiddenFolderPrompts = Object.entries(data)
      .filter(
        ([key, topic]) =>
          topic.prompts && !topic.isTrash && key.startsWith("hidden_folder_")
      )
      .flatMap(([key, topic]) => {
        const updatedPrompts = topic.prompts.map((prompt) => {
          if (!prompt.id) {
            prompt.id = `prompt_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }
          return {
            ...prompt,
            storageKey: key,
            folderId: prompt.folderId || key,
            tags: Array.isArray(prompt.tags) ? prompt.tags : [],
          };
        });
        chrome.storage.local.set({
          [key]: { ...topic, prompts: updatedPrompts },
        });
        return updatedPrompts;
      });

    const singlePrompts = Object.entries(data)
      .filter(
        ([key, topic]) =>
          topic.prompts && !topic.isTrash && key.startsWith("single_prompt_")
      )
      .flatMap(([key, topic]) => {
        const updatedPrompts = topic.prompts.map((prompt) => {
          if (!prompt.id) {
            prompt.id = `prompt_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;
          }
          return {
            ...prompt,
            storageKey: key,
            folderId: prompt.folderId || key,
            tags: Array.isArray(prompt.tags) ? prompt.tags : [],
          };
        });
        chrome.storage.local.set({
          [key]: { ...topic, prompts: updatedPrompts },
        });
        return updatedPrompts;
      });

    const noFolderPrompts = (data.noFolderPrompts || []).map((prompt) => {
      if (!prompt.id) {
        prompt.id = `prompt_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
      }
      return {
        ...prompt,
        storageKey: "noFolderPrompts",
        folderId: null,
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
      };
    });
    if (data.noFolderPrompts) {
      chrome.storage.local.set({ noFolderPrompts: noFolderPrompts });
    }

    const prompts = [
      ...folderPrompts,
      ...hiddenFolderPrompts,
      ...singlePrompts,
      ...noFolderPrompts,
    ];

    const tagGrid = document.createElement("div");
    tagGrid.className = "tag-grid";

    tags.forEach((tag) => {
      const promptCount = prompts.filter(
        (prompt) => Array.isArray(prompt.tags) && prompt.tags.includes(tag)
      ).length;
      const tagBox = document.createElement("div");
      tagBox.className = "tag-box";
      tagBox.dataset.tag = escapeHTML(tag);
      tagBox.innerHTML = `
        <span class="tag-name">${escapeHTML(tag)}</span>
        <span class="prompt-count">${promptCount} Prompt${
        promptCount !== 1 ? "s" : ""
      }</span>
        <button class="delete-tag-btn" data-tag="${escapeHTML(
          tag
        )}" title="Tag löschen">×</button>
      `;
      tagGrid.appendChild(tagBox);
    });

    tagContainer.appendChild(tagGrid);

    // Event-Listener für Tag-Boxen (Modal öffnen)
    document.querySelectorAll(".tag-box").forEach((box) => {
      box.addEventListener("click", (e) => {
        if (!e.target.classList.contains("delete-tag-btn")) {
          const tag = box.dataset.tag;
          showPromptModal(tag, prompts);
        }
      });
    });

    // Event-Listener für Delete-Tag-Buttons
    document.querySelectorAll(".delete-tag-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation(); // Verhindert das Öffnen des Modals
        deleteTag(btn.dataset.tag);
      });
    });
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

function showPromptModal(tag, prompts) {
  const modal = document.getElementById("promptModal");
  const modalTagName = document.getElementById("modalTagName");
  const modalPromptList = document.getElementById("modalPromptList");

  if (!modal || !modalTagName || !modalPromptList) {
    console.error("Modal elements not found");
    return;
  }

  modalTagName.textContent = escapeHTML(tag);
  const filteredPrompts = prompts.filter(
    (prompt) => Array.isArray(prompt.tags) && prompt.tags.includes(tag)
  );

  if (filteredPrompts.length === 0) {
    modalPromptList.innerHTML = "<p>No prompts found for this tag.</p>";
  } else {
    modalPromptList.innerHTML = filteredPrompts
      .map((prompt) => {
        return `
          <div class="prompt-item" data-prompt-id="${escapeHTML(
            prompt.id
          )}" data-storage-key="${escapeHTML(
          prompt.storageKey
        )}" data-folder="${escapeHTML(
          prompt.folderName || "Kein Ordner"
        )}" style="cursor: pointer;">
            <h3>${escapeHTML(prompt.title || "Untitled")}</h3>
            <p>Category: ${escapeHTML(prompt.folderName || "Kein Ordner")}</p>
            <p>Created: ${new Date(prompt.createdAt || 0).toLocaleString()}</p>
            <button class="remove-tag-btn" data-tag="${escapeHTML(
              tag
            )}" data-prompt-id="${escapeHTML(
          prompt.id
        )}" data-storage-key="${escapeHTML(
          prompt.storageKey
        )}" title="Tag von diesem Prompt entfernen">×</button>
          </div>
        `;
      })
      .join("");
  }

  // Entferne alte Event-Listener für remove-tag-btn
  const removeTagButtons = document.querySelectorAll(".remove-tag-btn");
  removeTagButtons.forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  // Füge neue Event-Listener für remove-tag-btn hinzu
  document.querySelectorAll(".remove-tag-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tag = btn.dataset.tag;
      const promptId = btn.dataset.promptId;
      const storageKey = btn.dataset.storageKey;
      console.log(
        `Remove tag button clicked: tag=${tag}, promptId=${promptId}, storageKey=${storageKey}`
      );
      if (!promptId) {
        console.error("Prompt-ID fehlt oder ist undefined!");
      }
      removeTagFromPrompt(tag, storageKey, promptId);
    });
  });

  // Füge Event-Listener für Klicks auf prompt-item hinzu
  document.querySelectorAll(".prompt-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      if (!e.target.classList.contains("remove-tag-btn")) {
        const folder = item.dataset.folder;
        const storageKey = item.dataset.storageKey;
        console.log(
          `Prompt item clicked, navigating to folder: ${folder}, storageKey: ${storageKey}`
        );
        if (
          folder === "Kein Ordner" ||
          storageKey.startsWith("single_prompt_") ||
          storageKey === "noFolderPrompts"
        ) {
          modal.style.display = "none";
          switchView("prompts-view", {
            view: "prompts",
            category: "Single Prompts",
          });
          // Verwende den übersetzten Text aus der Navigation
          const singlePromptsNavItem = document.querySelector(
            '.accordion-content li[data-folder="Single Prompts"]'
          );
          document.getElementById("prompts-header").textContent =
            singlePromptsNavItem
              ? singlePromptsNavItem.textContent.trim()
              : "Single Prompts"; // Fallback
          handleCategoryClick("Single Prompts");
        } else {
          modal.style.display = "none";
          switchView("prompts-view", { view: "prompts", folder: folder });
          handleFolderClick(folder);
        }
      }
    });
  });

  // Modal schließen bei Klick auf close-modal
  const closeModal = document.querySelector(".close-modal");
  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.style.display = "flex";
}

function removeTagFromPrompt(tag, storageKey, promptId) {
  chrome.storage.local.get(storageKey, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading storage key:", chrome.runtime.lastError);
      return;
    }
    let promptsData = data[storageKey];
    if (!promptsData) {
      console.error(`Storage key ${storageKey} not found`);
      return;
    }

    const isFolder = storageKey !== "noFolderPrompts" && promptsData.prompts;
    const updatedPrompts = (isFolder ? promptsData.prompts : promptsData).map(
      (prompt) => {
        if (
          String(prompt.id) === String(promptId) &&
          Array.isArray(prompt.tags) &&
          prompt.tags.includes(tag)
        ) {
          return {
            ...prompt,
            tags: prompt.tags.filter((t) => t !== tag),
          };
        }
        return prompt;
      }
    );

    const saveData = isFolder
      ? { [storageKey]: { ...promptsData, prompts: updatedPrompts } }
      : { [storageKey]: updatedPrompts };
    chrome.storage.local.set(saveData, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving prompts:", chrome.runtime.lastError);
        return;
      }
      console.log(`Tag ${tag} removed from prompt ${promptId}`);
      // DOM direkt aktualisieren
      const promptItem = document.querySelector(
        `.prompt-item[data-prompt-id="${escapeHTML(
          promptId
        )}"][data-storage-key="${escapeHTML(storageKey)}"]`
      );
      if (promptItem) {
        const remainingTags =
          updatedPrompts.find((p) => String(p.id) === String(promptId))?.tags ||
          [];
        if (!remainingTags.includes(tag)) {
          promptItem.remove(); // Entferne das prompt-item, wenn der Tag nicht mehr vorhanden ist
        }
      }
      // Optional: loadTags(), falls die Tag-Boxen aktualisiert werden sollen
      loadTags(); // Tags neu laden, um Modal und Tag-Counts zu aktualisieren
    });
  });
}
