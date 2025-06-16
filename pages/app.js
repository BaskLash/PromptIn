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
      const category = urlParams.get("category") || "All Prompts";
      switchView("prompts-view");
      document.getElementById("prompts-header").textContent = category;
      handleCategoryClick(category);
    } else if (view === "tags") {
      switchView("tags-view");
      loadTags();
    } else {
      switchView("prompts-view");
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
    const tagName = prompt("Neuen Tag eingeben:");
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
      const text = item.textContent.trim();
      if (text === "Tag Overview") {
        switchView("tags-view", { view: "tags" });
        loadTags(); // Funktion zum Laden der Tags
      } else {
        switchView("prompts-view", { view: "prompts", category: text });
        document.getElementById("prompts-header").textContent = text; // Header aktualisieren
        handleCategoryClick(text);
      }
    });
  });

  document.querySelectorAll(".folder-list li").forEach((item) => {
    item.addEventListener("click", (event) => {
      if (event.target.classList.contains("folder-action")) return;
      const folder = item.textContent.replace("📁", "").trim().split(" ")[0];
      handleFolderClick(folder);
    });
  });

  // Initialisiere die Ordnerliste
  loadFolders();

  // Initialisiere die Prompts nur, wenn kein URL-Parameter vorhanden ist
  if (!categoryFromUrl) {
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
    const tags = data.tags || [];
    const tagContainer = document.getElementById("tag-container");
    const prompts = 0;
    tagContainer.innerHTML = tags
      .map((tag) => {
        const promptCount = prompts.filter((prompt) =>
          prompt.tags.includes(tag)
        ).length;
        return `
          <div class="tag-box" data-tag="${escapeHTML(tag)}">
            <span class="tag-name">${escapeHTML(tag)}</span>
            <span class="prompt-count">${promptCount} Prompt${
          promptCount !== 1 ? "s" : ""
        }</span>
            <button class="delete-tag-btn" data-tag="${escapeHTML(
              tag
            )}" title="Tag löschen">×</button>
          </div>
        `;
      })
      .join("");
    document.querySelectorAll(".tag-box").forEach((box) => {
      box.addEventListener("click", (e) => {
        if (!e.target.classList.contains("delete-tag-btn")) {
          const tag = box.dataset.tag;
          showPromptModal(tag, prompts);
        }
      });
    });
    document.querySelectorAll(".delete-tag-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
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
