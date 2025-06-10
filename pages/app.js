document.addEventListener("DOMContentLoaded", () => {
  // Search functionality
  const searchInput = document.getElementById("searchInput");
  const goalsList = document.querySelector(".table-container tbody");
  const folderList = document.querySelector(".folder-list");
  const accordionItems = document.querySelectorAll(".accordion-content li");
  const faqBtn = document.getElementById("faq-btn");
  const addFolderBtn = document.getElementById("addFolderBtn");

  // FAQ
  faqBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("faq.html") });
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

  document.querySelectorAll(".accordion-content li").forEach((item) => {
    item.addEventListener("click", () => {
      const category = item.textContent.trim();
      handleCategoryClick(category);
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

  // Initialisiere die Prompts
  initializePrompts();

  document.getElementById("addItemBtn").addEventListener("click", () => {
    const category = document.querySelector(".main-header h1").textContent;
    if (category === "Workflows") {
      showCreateWorkflowModal();
    } else {
      showCreatePromptModal(category);
    }
  });
});
