document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("inputField");
  const promptList = document.getElementById("promptList");
  const noData = document.getElementById("noData");
  const burgerBtn = document.querySelector(".burger-btn");
  const sidebar = document.querySelector(".sidebar");
  const allPromptsLink = document.getElementById("all-prompts-link");
  const singlePromptsLink = document.getElementById("single-prompts-link");
  const categorisedPromptsLink = document.getElementById(
    "categorised-prompts-link"
  );
  const trashLink = document.getElementById("trash-link");
  const folderNavList = document.getElementById("folderNavList");
  const collapsibles = document.querySelectorAll(".collapsible");
  const overviewBtn = document.getElementById("overview-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const faqBtn = document.getElementById("faq-btn");
  const newPromptBtn = document.querySelector(".new-prompt");
  const clearStorageBtn = document.getElementById("clear-storage");

  // Funktion zum Laden aller Prompts im Hauptinhalt
  function loadPrompts(view = "all") {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptList.innerHTML = "";
      let allPrompts = [];

      if (!data || Object.keys(data).length === 0) {
        noData.style.display = "block";
        noData.textContent = "No prompts available";
        return;
      }

      noData.style.display = "none";

      if (view === "all") {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
            allPrompts = allPrompts.concat(
              topic.prompts.map((prompt, index) => ({
                prompt,
                folderId: id,
                index,
                isHidden: topic.isHidden || false,
              }))
            );
          }
        });
      } else if (view === "single") {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && topic.isHidden && !topic.isTrash) {
            allPrompts = allPrompts.concat(
              topic.prompts.map((prompt, index) => ({
                prompt,
                folderId: id,
                index,
                isHidden: true,
              }))
            );
          }
        });
      } else if (view === "categorised") {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && !topic.isHidden && !topic.isTrash) {
            allPrompts = allPrompts.concat(
              topic.prompts.map((prompt, index) => ({
                prompt,
                folderId: id,
                index,
                isHidden: false,
              }))
            );
          }
        });
      } else if (view === "trash") {
        const trashFolder = data["trash_folder"];
        if (trashFolder && trashFolder.prompts) {
          allPrompts = trashFolder.prompts.map((prompt, index) => ({
            prompt,
            folderId: "trash_folder",
            index,
            isTrash: true,
          }));
        }
      } else {
        const folder = data[view];
        if (folder && folder.prompts && !folder.isTrash) {
          allPrompts = folder.prompts.map((prompt, index) => ({
            prompt,
            folderId: view,
            index,
            isHidden: folder.isHidden || false,
          }));
        }
      }

      if (allPrompts.length === 0) {
        noData.style.display = "block";
        noData.textContent =
          view === "trash" ? "No prompts in trash" : "No prompts available";
        return;
      }

      allPrompts.forEach(({ prompt, folderId, index, isHidden, isTrash }) => {
        const promptItem = createPromptItem(
          prompt,
          folderId,
          index,
          isHidden,
          isTrash
        );
        promptList.appendChild(promptItem);
      });
    });
  }

  // Funktion zum Laden der Ordner in der Seitenleiste
  function loadFolders() {
    chrome.storage.sync.get(null, function (data) {
      folderNavList.innerHTML = "";

      if (!data || Object.keys(data).length === 0) {
        folderNavList.innerHTML = "<p>No folders yet!</p>";
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
        folderNavList.innerHTML = "<p>No visible folders with prompts!</p>";
        return;
      }

      folders.forEach(([id, topic]) => {
        const folderItem = document.createElement("div");
        folderItem.classList.add("folder-item");

        const folderLink = document.createElement("a");
        folderLink.href = "#";
        folderLink.classList.add("folder-link");
        folderLink.textContent = `${topic.name} (${topic.prompts.length})`;

        folderLink.addEventListener("click", (e) => {
          e.preventDefault();
          showFolder(id);
          sidebar.classList.remove("visible");
        });

        folderItem.appendChild(folderLink);
        folderNavList.appendChild(folderItem);
      });

      const folderCollapsibleContent = folderNavList.closest(
        ".collapsible-content"
      );
      const folderCollapsible =
        folderCollapsibleContent?.previousElementSibling;

      if (
        folderCollapsible &&
        folderCollapsible.getAttribute("aria-expanded") === "true"
      ) {
        folderCollapsibleContent.style.maxHeight =
          folderCollapsibleContent.scrollHeight + "px";
      }
    });
  }

  // Funktion zum Erstellen eines Prompt-Elements
  function createPromptItem(prompt, folderId, index, isHidden, isTrash) {
    const promptItem = document.createElement("li");
    promptItem.classList.add("prompt-item");

    const promptText = document.createElement("span");
    promptText.classList.add("prompt-text");
    const displayText = prompt.title || prompt.content || "Untitled Prompt";
    promptText.textContent =
      displayText.length > 50 ? displayText.slice(0, 50) + "..." : displayText;
    promptText.title = displayText;
    promptItem.appendChild(promptText);

    if (isHidden) {
      promptItem.style.opacity = "0.8";
      promptItem.title = "This prompt is not assigned to a visible folder";
    }

    const promptActions = document.createElement("div");
    promptActions.classList.add("prompt-actions");

    if (!isTrash) {
      const useBtn = document.createElement("button");
      useBtn.textContent = "Use";
      useBtn.classList.add("action-btn");
      useBtn.addEventListener("click", () => usePrompt(prompt));
      promptActions.appendChild(useBtn);

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.classList.add("action-btn");
      editBtn.addEventListener("click", () =>
        editPrompt(prompt, folderId, index, promptItem)
      );
      promptActions.appendChild(editBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Move to Trash";
      deleteBtn.classList.add("action-btn");
      deleteBtn.addEventListener("click", () =>
        deletePrompt(folderId, index, promptItem)
      );
      promptActions.appendChild(deleteBtn);
    } else {
      const restoreBtn = document.createElement("button");
      restoreBtn.textContent = "Restore";
      restoreBtn.classList.add("action-btn");
      restoreBtn.addEventListener("click", () =>
        restorePrompt(folderId, index, promptItem)
      );
      promptActions.appendChild(restoreBtn);

      const permanentDeleteBtn = document.createElement("button");
      permanentDeleteBtn.textContent = "Delete Permanently";
      permanentDeleteBtn.classList.add("action-btn");
      permanentDeleteBtn.addEventListener("click", () =>
        permanentlyDeletePrompt(folderId, index, promptItem)
      );
      promptActions.appendChild(permanentDeleteBtn);
    }

    promptItem.appendChild(promptActions);
    return promptItem;
  }

  // Funktion zum Anzeigen eines spezifischen Ordners
  function showFolder(folderId) {
    loadPrompts(folderId);
    sidebar.classList.remove("visible");
  }

  // Funktion zum Verwenden eines Prompts
  function usePrompt(prompt) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("🚨 No active tab found.");
        alert("No active tab found. Please open a tab and try again.");
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "usePrompt", text: prompt.content },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Message failed:", chrome.runtime.lastError);
            alert("Failed to send prompt to the page. Please try again.");
          } else {
            console.log("📨 Response from content.js:", response);
            alert("Prompt successfully sent to the page!");
          }
        }
      );
    });
  }

  // Funktion zum Bearbeiten eines Prompts
  function editPrompt(prompt, folderId, promptIndex, promptItem) {
    const modal = document.createElement("div");
    modal.className = "modal";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";

    const closeSpan = document.createElement("span");
    closeSpan.className = "close";
    closeSpan.innerHTML = "×";

    const headerTitle = document.createElement("h2");
    headerTitle.textContent = "Edit Prompt";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Title:";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = prompt.title || "";
    titleInput.style.width = "100%";
    titleInput.style.padding = "8px";
    titleInput.style.borderRadius = "4px";
    titleInput.style.border = "1px solid #ddd";

    const descLabel = document.createElement("label");
    descLabel.textContent = "Description (optional):";
    const descInput = document.createElement("textarea");
    descInput.value = prompt.description || "";
    descInput.style.width = "100%";
    descInput.style.padding = "8px";
    descInput.style.borderRadius = "4px";
    descInput.style.border = "1px solid #ddd";
    descInput.style.minHeight = "80px";

    const contentLabel = document.createElement("label");
    contentLabel.textContent = "Content:";
    const contentInput = document.createElement("textarea");
    contentInput.value = prompt.content || "";
    contentInput.style.width = "100%";
    contentInput.style.padding = "8px";
    contentInput.style.borderRadius = "4px";
    contentInput.style.border = "1px solid #ddd";
    contentInput.style.minHeight = "120px";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.classList.add("action-btn");
    saveButton.style.marginTop = "15px";

    saveButton.addEventListener("click", () => {
      const newTitle = titleInput.value.trim();
      const newDesc = descInput.value.trim();
      const newContent = contentInput.value.trim();

      if (!newTitle || !newContent) {
        alert("Title and content are required.");
        return;
      }

      chrome.storage.sync.get(folderId, function (data) {
        if (chrome.runtime.lastError || !data[folderId]) {
          console.error("Error fetching folder:", chrome.runtime.lastError);
          alert("Error fetching folder data.");
          return;
        }

        data[folderId].prompts[promptIndex] = {
          title: newTitle,
          description: newDesc,
          content: newContent,
        };

        if (data[folderId].prompts.length === 1 && data[folderId].isHidden) {
          data[folderId].name = newTitle.slice(0, 50);
        }

        chrome.storage.sync.set({ [folderId]: data[folderId] }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving prompt:", chrome.runtime.lastError);
            alert("Error saving prompt.");
          } else {
            console.log(`Prompt in ${folderId} edited`);
            promptItem.querySelector(".prompt-text").textContent =
              newTitle.length > 50 ? newTitle.slice(0, 50) + "..." : newTitle;
            loadPrompts();
            loadFolders();
            modal.style.display = "none";
            document.body.removeChild(modal);
            document.head.removeChild(style);
          }
        });
      });
    });

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(titleLabel);
    modalBody.appendChild(titleInput);
    modalBody.appendChild(descLabel);
    modalBody.appendChild(descInput);
    modalBody.appendChild(contentLabel);
    modalBody.appendChild(contentInput);
    modalBody.appendChild(saveButton);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);

    const style = document.createElement("style");
    style.textContent = `
      .modal {
        display: block;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(3px);
      }

      .modal-content {
        background: #fff;
        margin: 5% auto;
        padding: 0;
        width: 90%;
        max-width: 600px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }

      .modal-header {
        padding: 16px 24px;
        background: linear-gradient(135deg, #1e90ff, #4169e1);
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.6em;
        font-weight: 600;
      }

      .modal-body {
        padding: 24px;
        color: #2c3e50;
      }

      .modal-body label {
        font-weight: 600;
        margin-top: 16px;
        margin-bottom: 6px;
        display: block;
        color: #34495e;
      }

      .modal-body input,
      .modal-body textarea {
        margin-bottom: 12px;
        box-sizing: border-box;
      }

      .close {
        color: white;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .close:hover,
      .close:focus {
        transform: scale(1.1);
      }

      .action-btn {
        padding: 8px 16px;
        background: #1e90ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .action-btn:hover {
        background: #4169e1;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    closeSpan.onclick = function () {
      modal.style.display = "none";
      document.body.removeChild(modal);
      document.head.removeChild(style);
    };

    window.addEventListener(
      "click",
      function (event) {
        if (event.target === modal) {
          modal.style.display = "none";
          document.body.removeChild(modal);
          document.head.removeChild(style);
        }
      },
      { once: true }
    );

    titleInput.focus();
  }

  // Funktion zum Löschen eines Prompts
  function deletePrompt(folderId, promptIndex, promptItem) {
    if (confirm("Are you sure you want to move this prompt to the trash?")) {
      chrome.storage.sync.get([folderId, "trash_folder"], function (data) {
        if (chrome.runtime.lastError) {
          console.error("Error fetching data:", chrome.runtime.lastError);
          return;
        }

        const topic = data[folderId];
        if (!topic || !topic.prompts[promptIndex]) return;

        const prompt = topic.prompts[promptIndex];
        topic.prompts.splice(promptIndex, 1);

        const trashFolderId = "trash_folder";
        let trashFolder = data[trashFolderId] || {
          name: "Trash",
          prompts: [],
          isTrash: true,
          isHidden: true,
        };
        trashFolder.prompts.push({
          ...prompt,
          originalFolderId: folderId,
          trashedAt: Date.now(),
        });

        const updates = {};
        if (topic.prompts.length === 0) {
          chrome.storage.sync.remove(folderId);
        } else {
          updates[folderId] = topic;
        }
        updates[trashFolderId] = trashFolder;

        chrome.storage.sync.set(updates, function () {
          if (chrome.runtime.lastError) {
            console.error(
              "Error moving prompt to trash:",
              chrome.runtime.lastError
            );
            alert("Error moving prompt to trash.");
          } else {
            console.log(`Prompt moved to trash from ${folderId}`);
            promptItem.remove();
            loadPrompts();
            loadFolders();
          }
        });
      });
    }
  }

  // Funktion zum Wiederherstellen eines Prompts
  function restorePrompt(trashFolderId, promptIndex, promptItem) {
    if (confirm("Are you sure you want to restore this prompt?")) {
      chrome.storage.sync.get(trashFolderId, function (data) {
        if (chrome.runtime.lastError) {
          console.error("Error fetching trash data:", chrome.runtime.lastError);
          return;
        }

        const trashFolder = data[trashFolderId];
        if (!trashFolder || !trashFolder.prompts[promptIndex]) return;

        const prompt = trashFolder.prompts[promptIndex];
        const originalFolderId =
          prompt.originalFolderId ||
          `hidden_folder_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

        chrome.storage.sync.get(originalFolderId, function (folderData) {
          let targetFolder = folderData[originalFolderId] || {
            name: prompt.title || "Restored Prompt",
            prompts: [],
            isHidden: !prompt.originalFolderId,
          };

          trashFolder.prompts.splice(promptIndex, 1);
          delete prompt.originalFolderId;
          delete prompt.trashedAt;
          targetFolder.prompts.push(prompt);

          const updates = {};
          if (trashFolder.prompts.length === 0) {
            chrome.storage.sync.remove(trashFolderId);
          } else {
            updates[trashFolderId] = trashFolder;
          }
          updates[originalFolderId] = targetFolder;

          chrome.storage.sync.set(updates, function () {
            if (chrome.runtime.lastError) {
              console.error(
                "Error restoring prompt:",
                chrome.runtime.lastError
              );
              alert("Error restoring prompt.");
            } else {
              console.log(`Prompt restored to ${originalFolderId}`);
              promptItem.remove();
              loadFolders();
              loadPrompts();
            }
          });
        });
      });
    }
  }

  // Funktion zum endgültigen Löschen eines Prompts
  function permanentlyDeletePrompt(trashFolderId, promptIndex, promptItem) {
    if (
      confirm(
        "Are you sure you want to permanently delete this prompt? This action cannot be undone."
      )
    ) {
      chrome.storage.sync.get(trashFolderId, function (data) {
        if (chrome.runtime.lastError) {
          console.error("Error fetching trash data:", chrome.runtime.lastError);
          return;
        }

        const trashFolder = data[trashFolderId];
        if (!trashFolder || !trashFolder.prompts[promptIndex]) return;

        trashFolder.prompts.splice(promptIndex, 1);

        if (trashFolder.prompts.length === 0) {
          chrome.storage.sync.remove(trashFolderId, function () {
            if (chrome.runtime.lastError) {
              console.error(
                "Error removing trash folder:",
                chrome.runtime.lastError
              );
            }
            console.log("Trash folder deleted (empty)");
            promptItem.remove();
            loadPrompts();
          });
        } else {
          chrome.storage.sync.set(
            { [trashFolderId]: trashFolder },
            function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error deleting prompt from trash:",
                  chrome.runtime.lastError
                );
                alert("Error deleting prompt from trash.");
              } else {
                console.log("Prompt permanently deleted from trash");
                promptItem.remove();
                loadPrompts();
              }
            }
          );
        }
      });
    }
  }

  // Burger-Menü ein-/ausblenden
  burgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("visible");
    if (sidebar.classList.contains("visible")) {
      loadFolders();
    }
  });

  // Collapsible ein-/ausklappen mit dynamischer Höhe
  collapsibles.forEach((collapsible) => {
    collapsible.addEventListener("click", function () {
      const isActive = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", !isActive);
      const content = this.nextElementSibling;

      if (!isActive) {
        content.classList.add("active");
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.classList.remove("active");
        content.style.maxHeight = null;
      }
    });
  });

  // Links in der Seitenleiste
  allPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    loadPrompts("all");
    sidebar.classList.remove("visible");
  });
  singlePromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    loadPrompts("single");
    sidebar.classList.remove("visible");
  });
  categorisedPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    loadPrompts("categorised");
    sidebar.classList.remove("visible");
  });
  if (trashLink) {
    trashLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadPrompts("trash");
      sidebar.classList.remove("visible");
    });
  }

  // Übersicht öffnen
  overviewBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/app.html") });
  });

  // Settings Modal
  const settingsModal = document.getElementById("settings-modal");
  settingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "block";
  });
  window.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      settingsModal.style.display = "none";
    }
  });

  // FAQ Modal
  const faqModal = document.getElementById("faq-modal");
  const closeFaqModal = document.getElementById("close-faq-modal");
  faqBtn.addEventListener("click", () => {
    faqModal.style.display = "block";
  });
  closeFaqModal.addEventListener("click", () => {
    faqModal.style.display = "none";
  });
  window.addEventListener("click", (event) => {
    if (event.target === faqModal) {
      faqModal.style.display = "none";
    }
  });

  // New Prompt Modal
  const newPromptModal = document.getElementById("new-prompt-modal");
  const closeNewPromptModal = document.getElementById("close-new-prompt-modal");
  const createPromptBtn = document.getElementById("create-prompt-btn");
  const promptTitleInput = document.getElementById("prompt-title");
  const promptDescInput = document.getElementById("prompt-description");
  const promptContentInput = document.getElementById("prompt-content");
  const folderSelect = document.getElementById("folder-select");

  function updateFolderSelect() {
    chrome.storage.sync.get(null, function (data) {
      folderSelect.innerHTML =
        '<option value="">No folder (single prompt)</option>';
      if (data) {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && !topic.isHidden && !topic.isTrash) {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = topic.name;
            folderSelect.appendChild(option);
          }
        });
      }
    });
  }

  newPromptBtn.addEventListener("click", () => {
    updateFolderSelect();
    newPromptModal.style.display = "block";
  });

  closeNewPromptModal.addEventListener("click", () => {
    newPromptModal.style.display = "none";
    promptTitleInput.value = "";
    promptDescInput.value = "";
    promptContentInput.value = "";
    folderSelect.value = "";
  });

  window.addEventListener("click", (event) => {
    if (event.target === newPromptModal) {
      newPromptModal.style.display = "none";
      promptTitleInput.value = "";
      promptDescInput.value = "";
      promptContentInput.value = "";
      folderSelect.value = "";
    }
  });

  createPromptBtn.addEventListener("click", () => {
    const title = promptTitleInput.value.trim();
    const description = promptDescInput.value.trim();
    const content = promptContentInput.value.trim();
    const selectedFolder = folderSelect.value;

    if (!title || !content) {
      alert("Title and content are required!");
      return;
    }

    chrome.storage.sync.get(null, function (data) {
      const updatedData = data || {};
      const promptObj = { title, content };
      if (description) promptObj.description = description;

      const updates = {};

      if (selectedFolder) {
        if (!updatedData[selectedFolder]) {
          console.error(`Folder ${selectedFolder} does not exist.`);
          alert("Selected folder does not exist. Please try again.");
          return;
        }
        updatedData[selectedFolder].prompts =
          updatedData[selectedFolder].prompts || [];
        updatedData[selectedFolder].prompts.push(promptObj);
        updates[selectedFolder] = updatedData[selectedFolder];
      } else {
        const newFolderId = `hidden_folder_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`;
        updates[newFolderId] = {
          name: title.slice(0, 50),
          prompts: [promptObj],
          isHidden: true,
        };
      }

      chrome.storage.sync.set(updates, function () {
        if (chrome.runtime.lastError) {
          console.error("Error saving prompt:", chrome.runtime.lastError);
          alert("Error saving prompt. Please try again.");
        } else {
          console.log("Prompt created successfully");
          newPromptModal.style.display = "none";
          promptTitleInput.value = "";
          promptDescInput.value = "";
          promptContentInput.value = "";
          folderSelect.value = "";
          loadPrompts("all"); // Lade alle Prompts nach Erstellung
          loadFolders();
        }
      });
    });
  });

  // Suche
  inputField.addEventListener("input", function () {
    const searchTerm = inputField.value.trim().toLowerCase();
    chrome.storage.sync.get(null, function (data) {
      promptList.innerHTML = "";
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
                      prompt.description.toLowerCase().includes(searchTerm)) ||
                    prompt.content.toLowerCase().includes(searchTerm)
                  );
                })
                .map((prompt, index) => ({
                  prompt,
                  folderId: id,
                  index,
                  isHidden: topic.isHidden || false,
                }))
            );
          }
        });
      }

      if (filteredPrompts.length === 0) {
        noData.style.display = "block";
        noData.textContent = "No prompts found";
      } else {
        noData.style.display = "none";
        filteredPrompts.forEach(({ prompt, folderId, index, isHidden }) => {
          const promptItem = createPromptItem(
            prompt,
            folderId,
            index,
            isHidden,
            false
          );
          promptList.appendChild(promptItem);
        });
      }
    });
  });

  // Speicher leeren
  clearStorageBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      chrome.storage.sync.clear(() => {
        promptList.innerHTML = "";
        noData.style.display = "block";
        noData.textContent = "No prompts available";
        loadFolders();
      });
    }
  });

  // Theme wechseln
  document
    .getElementById("theme-select")
    .addEventListener("change", function (e) {
      document.documentElement.setAttribute("data-theme", e.target.value);
      localStorage.setItem("theme", e.target.value);
    });
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("theme-select").value = savedTheme;

  // Initiale Anzeige: Alle Prompts laden
  loadPrompts("all");
  loadFolders();

  document.getElementById("feedback-btn").addEventListener("click", () => {
    window.open("https://forms.gle/9fN4XeUbhFL1xsyx8", "_blank");
  });

  document
    .getElementById("feature-request-btn")
    .addEventListener("click", () => {
      window.open("https://forms.gle/5EM4tPz9b7d1p6iB7", "_blank");
    });
});
