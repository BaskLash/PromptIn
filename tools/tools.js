document.addEventListener("DOMContentLoaded", () => {
  // Initialisiere Tags
  initializeTags();

  // Lade Tags und Prompts
  loadTags();

  // Lade Ordner
  loadFolders();
  const foldersContent = document.querySelector(
    ".folders-accordion .accordion-content"
  );
  foldersContent.classList.add("open");

  // Akkordeon-Mechanik
  document.querySelectorAll(".accordion-header").forEach((header) => {
    header.addEventListener("click", (event) => {
      if (!event.target.classList.contains("add-folder-header-btn")) {
        const content = header.nextElementSibling;
        content.classList.toggle("open");
      }
    });
  });

  // Navigation
  document.querySelectorAll(".accordion-content li").forEach((item) => {
    item.addEventListener("click", () => {
      const category = item.textContent.trim();
      if (category !== "Tag Overview") {
        // Weiterleitung zur Hauptseite mit Kategorie als URL-Parameter
        window.location.assign(
          chrome.runtime.getURL("../pages/app.html") +
            "?category=" +
            encodeURIComponent(category)
        );
      }
    });
  });

  // Ordner-Suche
  const folderSearchInput = document.querySelector("#folder-search");
  if (folderSearchInput) {
    folderSearchInput.addEventListener("input", () => {
      const filter = folderSearchInput.value.toLowerCase();
      const folderItems = document.querySelectorAll(".folder-list li");
      folderItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(filter) ? "" : "none";
      });
    });

    // Ordner-Suchfeld einblenden bei mehr als 5 Einträgen
    const folderItems = document.querySelectorAll(".folder-list li");
    if (folderItems.length > 5) {
      folderSearchInput.classList.add("block");
    }
  }

  // Tag-Suche
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const tagBoxes = document.querySelectorAll(".tag-box");
    tagBoxes.forEach((box) => {
      const tagName = box.querySelector(".tag-name").textContent.toLowerCase();
      box.style.display = tagName.includes(filter) ? "" : "none";
    });
  });

  // Plus-Button für neuen Tag
  const addTagBtn = document.getElementById("addTagBtn");
  addTagBtn.addEventListener("click", () => {
    const tagName = prompt("Neuen Tag eingeben:");
    if (tagName && tagName.trim()) {
      const newTag = tagName.trim();
      chrome.storage.local.get("tags", (data) => {
        if (chrome.runtime.lastError) {
          console.error("Error getting tags:", chrome.runtime.lastError);
          return;
        }
        const tags = data.tags || [];
        if (tags.includes(newTag)) {
          alert("Tag exists already!");
          return;
        }
        tags.push(newTag);
        chrome.storage.local.set({ tags }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error saving tags:", chrome.runtime.lastError);
            return;
          }
          loadTags();
        });
      });
    }
  });

  // Modal schließen
  const closeModal = document.querySelector(".close-modal");
  closeModal.addEventListener("click", () => {
    document.getElementById("promptModal").style.display = "none";
  });

  // Sidebar-Resizer
  const resizer = document.getElementById("sidebar-resizer");
  let isResizing = false;
  let animationFrameId = null;
  let currentX = 0;
  const minWidth = 150;
  const maxWidth = 500;
  const sidebar = document.querySelector("aside");

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

  // Sidebar-Breite aus localStorage wiederherstellen
  const savedWidth = localStorage.getItem("sidebarWidth");
  if (savedWidth) {
    sidebar.style.width = `${savedWidth}px`;
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${savedWidth}px`
    );
  }
});

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

function loadFolders() {
  chrome.storage.local.get(null, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading folders:", chrome.runtime.lastError);
      return;
    }
    const folderList = document.querySelector(".folder-list");
    if (!folderList) {
      console.error("Folder list not found");
      return;
    }
    console.log("Daten aus chrome.storage.local:", data); // Debugging
    const folders = Object.values(data).filter(
      (value) => value.prompts && !value.isHidden && !value.isTrash
    );
    console.log("Gefilterte Ordner:", folders); // Debugging
    if (folders.length === 0) {
      folderList.innerHTML = "<li>Keine Ordner verfügbar</li>";
    } else {
      folderList.innerHTML = folders
        .map(
          (folder) => `
                    <li>
                        📁 ${escapeHTML(folder.name)}
                        <span class="folder-actions">
                            <button class="folder-action blue-dots-button" data-folder="${
                              folder.name
                            }">⋮</button>
                            <div class="folder-dropdown hidden" data-folder="${
                              folder.name
                            }">
                                <div class="dropdown-option rename-folder">Rename</div>
                                <div class="dropdown-option delete-folder">Delete</div>
                            </div>
                        </span>
                    </li>
                `
        )
        .join("");
    }
    console.log("Folder-List-Inhalt:", folderList.innerHTML); // Debugging
  });
}

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

    tagContainer.innerHTML = tags
      .map((tag) => {
        const promptCount = prompts.filter(
          (prompt) => Array.isArray(prompt.tags) && prompt.tags.includes(tag)
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
        const tag = btn.dataset.tag;
        console.log(`Delete tag button clicked for tag: ${tag}`); // Debugging
        deleteTag(tag);
      });
    });
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showPromptModal(tag, prompts) {
  const modal = document.getElementById("promptModal");
  const modalTagName = document.getElementById("modalTagName");
  const modalPromptList = document.getElementById("modalPromptList");

  if (!modal || !modalTagName || !modalPromptList) {
    console.error("Modal elements not found");
    return;
  }

  modalTagName.textContent = tag;
  const filteredPrompts = prompts.filter(
    (prompt) => Array.isArray(prompt.tags) && prompt.tags.includes(tag)
  );

  if (filteredPrompts.length === 0) {
    modalPromptList.innerHTML = "<p>No prompts found for this tag.</p>";
  } else {
    modalPromptList.innerHTML = filteredPrompts
      .map((prompt) => {
        // Keine temporäre ID-Generierung mehr nötig
        return `
          <div class="prompt-item" data-prompt-id="${
            prompt.id
          }" data-storage-key="${escapeHTML(prompt.storageKey)}">
            <h3>${escapeHTML(prompt.title || "Untitled")}</h3>
            <p>Category: ${escapeHTML(prompt.folderName || "Kein Ordner")}</p>
            <p>Created: ${new Date(prompt.createdAt || 0).toLocaleString()}</p>
            <button class="remove-tag-btn" data-tag="${escapeHTML(
              tag
            )}" data-prompt-id="${prompt.id}" data-storage-key="${escapeHTML(
          prompt.storageKey
        )}" title="Tag von diesem Prompt entfernen">×</button>
          </div>
        `;
      })
      .join("");
  }

  // Entferne alte Event-Listener
  const removeTagButtons = document.querySelectorAll(".remove-tag-btn");
  removeTagButtons.forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  // Füge neue Event-Listener hinzu
  document.querySelectorAll(".remove-tag-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tag = btn.dataset.tag;
      const promptId = btn.getAttribute("data-prompt-id");
      const storageKey = btn.dataset.storageKey;
      console.log(
        `Remove tag button clicked: tag=${tag}, promptId=${promptId}, storageKey=${storageKey}, button HTML=${btn.outerHTML}`
      );
      if (!promptId) {
        console.error("Prompt-ID fehlt oder ist undefined!");
      }
      removeTagFromPrompt(tag, storageKey, promptId);
    });
  });

  modal.style.display = "flex";
}

function removeTagFromPrompt(tag, storageKey, promptId) {
  console.log(
    `removeTagFromPrompt called: tag=${tag}, storageKey=${storageKey}, promptId=${promptId}`
  );
  if (!storageKey || !promptId) {
    console.error("Missing storage key or prompt ID");
    return;
  }

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
    if (!isFolder && !Array.isArray(promptsData)) {
      console.error(`Storage key ${storageKey} has no prompts`);
      return;
    }

    const updatedPrompts = (isFolder ? promptsData.prompts : promptsData).map(
      (prompt) => {
        if (
          String(prompt.id) === String(promptId) && // Sicherstellen, dass IDs als Strings verglichen werden
          Array.isArray(prompt.tags) &&
          prompt.tags.includes(tag)
        ) {
          console.log(
            `Removing tag ${tag} from prompt ${
              prompt.title || "Untitled"
            } (id=${prompt.id})`
          );
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
    console.log("Saving updated prompts:", saveData);

    chrome.storage.local.set(saveData, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving prompts:", chrome.runtime.lastError);
        return;
      }
      console.log(`Tag ${tag} removed from prompt ${promptId}`);
      // Modal und Tags aktualisieren
      loadTags(); // Dies lädt die Tags neu und aktualisiert das Modal indirekt
    });
  });
}

function deleteTag(tag) {
  console.log(`deleteTag called for tag: ${tag}`); // Debugging
  if (
    !confirm(
      `Confirm delete tag "${tag}"? This will remove the tag from all associated prompts.`
    )
  ) {
    console.log(`Deletion of tag ${tag} cancelled`); // Debugging
    return;
  }
  chrome.storage.local.get(null, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error loading data:", chrome.runtime.lastError);
      return;
    }
    let tags = data.tags || [];
    tags = tags.filter((t) => t !== tag);

    const updatedData = {};
    Object.keys(data).forEach((key) => {
      if (key === "noFolderPrompts" && Array.isArray(data[key])) {
        updatedData[key] = data[key].map((prompt) => {
          if (Array.isArray(prompt.tags) && prompt.tags.includes(tag)) {
            console.log(
              `Removing tag ${tag} from noFolderPrompt ${
                prompt.title || "Untitled"
              }`
            ); // Debugging
            return {
              ...prompt,
              tags: prompt.tags.filter((t) => t !== tag),
            };
          }
          return prompt;
        });
      } else if (
        data[key].prompts &&
        !data[key].isTrash &&
        (key.startsWith("folder_") ||
          key.startsWith("hidden_folder_") ||
          key.startsWith("single_prompt_"))
      ) {
        updatedData[key] = {
          ...data[key],
          prompts: data[key].prompts.map((prompt) => {
            if (Array.isArray(prompt.tags) && prompt.tags.includes(tag)) {
              console.log(
                `Removing tag ${tag} from prompt ${
                  prompt.title || "Untitled"
                } in ${key}`
              ); // Debugging
              return {
                ...prompt,
                tags: prompt.tags.filter((t) => t !== tag),
              };
            }
            return prompt;
          }),
        };
      } else {
        updatedData[key] = data[key];
      }
    });

    updatedData.tags = tags;
    console.log("Saving updated data:", updatedData); // Debugging
    chrome.storage.local.set(updatedData, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving data:", chrome.runtime.lastError);
        return;
      }
      console.log(`Tag ${tag} deleted successfully`); // Debugging
      loadTags();
    });
  });
}
