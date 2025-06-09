document.addEventListener("DOMContentLoaded", () => {
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
  const folderList = document.querySelector(".folder-list");
  const folderSearchInput = document.querySelector(".folder-search");
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

  function renderPrompts(prompts) {
    const tbody = document.querySelector(".table-container tbody");
    tbody.innerHTML = ""; // Clear existing rows

    prompts.forEach((prompt) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td><input type="checkbox" /></td>
      <td>${prompt.title || "N/A"}</td>
      <td>${prompt.type || "N/A"}</td>
      <td>${prompt.compatibleModels || "N/A"}</td>
      <td>${prompt.incompatibleModels || "N/A"}</td>
      <td>${prompt.tags || "N/A"}</td>
      <td>${prompt.folderName || "N/A"}</td>
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
    `;
      tbody.appendChild(row);
    });
  }

  function loadFolders() {
    const folderList = document.querySelector(".folder-list");
    chrome.storage.local.get(null, function (data) {
      folderList.innerHTML = ""; // Clear existing folder list

      const folders = Object.entries(data).filter(
        ([id, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash
      );

      if (folders.length === 0) {
        folderList.innerHTML = "<li>Keine Ordner verfügbar</li>";
        return;
      }

      folders.forEach(([id, topic]) => {
        const li = document.createElement("li");
        li.innerHTML = `
        📁 ${topic.name}
        <span class="folder-actions">
          <button class="folder-action" title="Aktionen">⚙️</button>
        </span>
      `;
        li.addEventListener("click", (event) => {
          if (event.target.classList.contains("folder-action")) return;
          handleFolderClick(topic.name);
        });
        folderList.appendChild(li);
      });

      // Update folder search visibility
      const folderSearchInput = document.querySelector(".folder-search");
      if (folders.length > 5) {
        folderSearchInput.style.display = "block";
      } else {
        folderSearchInput.style.display = "none";
      }
    });
  }

  function initializePrompts() {
    chrome.storage.local.get(null, function (data) {
      const allPrompts = Object.entries(data)
        .filter(
          ([id, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash
        )
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

  document.querySelectorAll(".accordion-content li").forEach((item) => {
    item.addEventListener("click", () => {
      const category = item.textContent.trim();
      handleCategoryClick(category);
    });
  });

  function handleCategoryClick(category) {
    chrome.storage.local.get(null, function (data) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

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
            .filter(([, topic]) => isVisibleTopic(topic))
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
          break;

        case "Favorites":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
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
            .filter(([, topic]) => isHiddenTopic(topic))
            .flatMap(([id, topic]) => getPromptObjects(topic, id));
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
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
            .flatMap(([id, topic]) =>
              topic.prompts
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
                .filter((p) => p.content && !p.content.includes("{}"))
                .map((prompt) => ({
                  ...prompt,
                  folderId: id,
                  folderName: topic.name || "N/A",
                }))
            );
          break;

        case "Unused Prompts":
          filteredPrompts = Object.entries(data)
            .filter(([, topic]) => isVisibleTopic(topic))
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
            .map(([, topic]) => ({
              title: topic.name || "Unnamed Workflow",
              type: "Workflow",
              compatibleModels: "N/A",
              incompatibleModels: "N/A",
              tags: "N/A",
              folderName: "Workflows",
              lastUsed: topic.lastUsed
                ? new Date(topic.lastUsed).toLocaleDateString("de-DE")
                : "N/A",
              createdAt: topic.createdAt
                ? new Date(topic.createdAt).toLocaleDateString("de-DE")
                : "N/A",
            }));
          break;

        default:
          // Assume it's a folder name
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
      document.querySelector(".main-header h1").textContent = category;
    });
  }

  function handleFolderClick(folder) {
    chrome.storage.local.get(null, function (data) {
      const filteredPrompts = Object.entries(data)
        .filter(
          ([id, topic]) =>
            topic.name.toLowerCase() === folder.toLowerCase() &&
            !topic.isHidden &&
            !topic.isTrash
        )
        .flatMap(([id, topic]) =>
          topic.prompts.map((prompt) => ({
            ...prompt,
            folderId: id,
            folderName: topic.name,
          }))
        );
      renderPrompts(filteredPrompts);
      document.querySelector(".main-header h1").textContent = folder;
    });
  }

  document.querySelectorAll(".folder-list li").forEach((item) => {
    item.addEventListener("click", (event) => {
      // Ignoriere Klicks auf Aktions-Buttons
      if (event.target.classList.contains("folder-action")) return;
      const folder = item.textContent.replace("📁", "").trim().split(" ")[0]; // Entfernt Emoji und Aktions-Button-Text
      handleFolderClick(folder);
    });
  });

  // Initialisiere die Ordnerliste
  loadFolders(); // <--- HIER DEN AUFRUF EINFÜGEN

  // Initialisiere die Prompts
  initializePrompts();
});
