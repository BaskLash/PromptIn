function createPromptItem(prompt, folderId, index, isHidden, isTrash, view) {
  const promptItem = document.createElement("li");
  promptItem.classList.add("prompt-item");
  if (prompt.isFavorite) {
    promptItem.classList.add("favorite");
  }

  const promptText = document.createElement("span");
  promptText.classList.add("prompt-text");
  chrome.storage.sync.get(folderId, (data) => {
    const topic = data[folderId];
    const folderName =
      topic && !topic.isHidden && !topic.isTrash ? topic.name : "";
    const displayText = prompt.title || prompt.content || "Untitled Prompt";
    promptText.textContent = folderName
      ? `${displayText.slice(0, 50)}${
          displayText.length > 50 ? "..." : ""
        } (in ${folderName})`
      : `${displayText.slice(0, 50)}${displayText.length > 50 ? "..." : ""}`;
    promptText.title = displayText;
  });
  promptItem.appendChild(promptText);

  if (isHidden && !isTrash) {
    promptItem.title = "This prompt is not assigned to a visible folder";
  }

  const actionsDiv = document.createElement("div");
  actionsDiv.classList.add("prompt-actions");

  const dropdownBtn = document.createElement("button");
  dropdownBtn.classList.add("dropdown-btn");
  dropdownBtn.innerHTML = "⋮";
  dropdownBtn.title = "More actions";

  const dropdownMenu = document.createElement("div");
  dropdownMenu.classList.add("dropdown-menu");

  let actions = [];
  if (isTrash) {
    actions = [
      {
        text: "Restore",
        class: "restore-btn",
        title: "Restore prompt",
        icon: "↩️",
      },
      {
        text: "Delete Permanently",
        class: "permanent-delete-btn",
        title: "Delete prompt permanently",
        icon: "🗑️",
      },
    ];
  } else {
    actions = [
      { text: "Use", class: "use-btn", title: "Use prompt", icon: "▶️" },
      {
        text: "Copy Prompt",
        class: "copy-btn",
        title: "Copy prompt",
        icon: "📋",
      },
      { text: "Edit", class: "edit-btn", title: "Edit prompt", icon: "✏️" },
      { text: "Share", class: "share-btn", title: "Share prompt", icon: "🔗" },
      {
        text:
          view === "favorites" ? "Remove from Favorites" : "Add to Favorites",
        class: "favorite-btn",
        title:
          view === "favorites" ? "Remove from favorites" : "Add to favorites",
        icon: prompt.isFavorite ? "★" : "☆",
      },
      {
        text: "Move to Folder",
        class: "move-folder-btn",
        title: "Move to folder",
        icon: "📁",
      },
      {
        text: "Move to Trash",
        class: "trash-btn",
        title: "Move to trash",
        icon: "🗑️",
      },
    ];

    if (!isHidden) {
      actions.splice(5, 0, {
        text: "Remove from Folder",
        class: "remove-folder-btn",
        title: "Remove from folder",
        icon: "📂",
      });
    }
  }

  actions.forEach((action) => {
    const actionItem = document.createElement("div");
    actionItem.classList.add("dropdown-item", action.class);
    actionItem.innerHTML = `${action.icon} ${action.text}`;
    actionItem.title = action.title;
    dropdownMenu.appendChild(actionItem);
  });

  actionsDiv.appendChild(dropdownBtn);
  actionsDiv.appendChild(dropdownMenu);
  promptItem.appendChild(actionsDiv);

  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = dropdownMenu.style.display === "block";
    document
      .querySelectorAll(".dropdown-menu")
      .forEach((menu) => (menu.style.display = "none"));
    dropdownMenu.style.display = isOpen ? "none" : "block";
  });

  const useBtn = dropdownMenu.querySelector(".use-btn");
  const copyBtn = dropdownMenu.querySelector(".copy-btn");
  const editBtn = dropdownMenu.querySelector(".edit-btn");
  const shareBtn = dropdownMenu.querySelector(".share-btn");
  const favoriteBtn = dropdownMenu.querySelector(".favorite-btn");
  const moveFolderBtn = dropdownMenu.querySelector(".move-folder-btn");
  const removeFolderBtn = dropdownMenu.querySelector(".remove-folder-btn");
  const trashBtn = dropdownMenu.querySelector(".trash-btn");
  const restoreBtn = dropdownMenu.querySelector(".restore-btn");
  const permanentDeleteBtn = dropdownMenu.querySelector(
    ".permanent-delete-btn"
  );

  if (useBtn) {
    useBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      usePrompt(prompt);
      dropdownMenu.style.display = "none";
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      copyPrompt(prompt);
      dropdownMenu.style.display = "none";
    });
  }

  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      editPrompt(prompt, folderId, index, promptItem);
      dropdownMenu.style.display = "none";
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sharePrompt(prompt);
      dropdownMenu.style.display = "none";
    });
  }

  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavoritePrompt(folderId, index, promptItem, prompt);
      dropdownMenu.style.display = "none";
    });
  }

  if (moveFolderBtn) {
    moveFolderBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      movePromptToFolder(folderId, index, promptItem);
      dropdownMenu.style.display = "none";
    });
  }

  if (removeFolderBtn) {
    removeFolderBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFromFolder(folderId, index, promptItem);
      dropdownMenu.style.display = "none";
    });
  }

  if (trashBtn) {
    trashBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deletePrompt(folderId, index, promptItem);
      dropdownMenu.style.display = "none";
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      restorePrompt(folderId, index, promptItem);
      dropdownMenu.style.display = "none";
    });
  }

  if (permanentDeleteBtn) {
    permanentDeleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      permanentlyDeletePrompt(folderId, index, promptItem);
      dropdownMenu.style.display = "none";
    });
  }

  document.addEventListener("click", (e) => {
    if (!dropdownBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.style.display = "none";
    }
  });

  return promptItem;
}

// Funktion zum Erstellen eines Prompt-Elements
function loadPrompts(view = "all") {
  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    const promptList = document.getElementById("promptList");
    const noData = document.getElementById("noData");
    const mainHeaderTitle = document.getElementById("mainHeaderTitle");

    if (!mainHeaderTitle) {
      console.error("Element with ID 'mainHeaderTitle' not found in DOM");
      return;
    }

    promptList.innerHTML = "";
    let allPrompts = [];

    if (!data || Object.keys(data).length === 0) {
      noData.style.display = "block";
      noData.textContent = "No prompts available";
      mainHeaderTitle.textContent = "All Prompts";
      return;
    }

    noData.style.display = "none";

    if (view === "favorites") {
      mainHeaderTitle.textContent = "Favorites";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts
              .filter((prompt) => prompt.isFavorite)
              .map((prompt, index) => ({
                prompt,
                folderId: id,
                index,
                isHidden: topic.isHidden || false,
                isTrash: false,
              }))
          );
        }
      });
    } else if (view === "all") {
      mainHeaderTitle.textContent = "All Prompts";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              isHidden: topic.isHidden || false,
              isTrash: false,
            }))
          );
        }
      });
    } else if (view === "single") {
      mainHeaderTitle.textContent = "Single Prompts";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && topic.isHidden && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              isHidden: true,
              isTrash: false,
            }))
          );
        }
      });
    } else if (view === "categorised") {
      mainHeaderTitle.textContent = "Categorised Prompts";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && !topic.isHidden && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              isHidden: false,
              isTrash: false,
            }))
          );
        }
      });
    } else if (view === "trash") {
      mainHeaderTitle.textContent = "Trash";
      const trashFolder = data["trash_folder"];
      if (trashFolder && trashFolder.prompts) {
        allPrompts = trashFolder.prompts.map((prompt, index) => ({
          prompt,
          folderId: "trash_folder",
          index,
          isHidden: false,
          isTrash: true,
        }));
      }
    } else {
      const folder = data[view];
      if (folder && folder.prompts && !folder.isTrash) {
        mainHeaderTitle.textContent = `${folder.name} (${folder.prompts.length})`;
        allPrompts = folder.prompts.map((prompt, index) => ({
          prompt,
          folderId: view,
          index,
          isHidden: folder.isHidden || false,
          isTrash: false,
        }));
      }
    }

    if (allPrompts.length === 0) {
      noData.style.display = "block";
      noData.textContent =
        view === "trash"
          ? "No prompts in trash"
          : view === "favorites"
          ? "No favorite prompts available"
          : "No prompts available";
      return;
    }

    allPrompts.forEach(({ prompt, folderId, index, isHidden, isTrash }) => {
      const promptItem = createPromptItem(
        prompt,
        folderId,
        index,
        isHidden,
        isTrash,
        view
      );
      promptList.appendChild(promptItem);
    });
  });
}
function toggleFavoritePrompt(folderId, promptIndex, promptItem, prompt) {
  chrome.storage.sync.get(folderId, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    const topic = data[folderId];
    if (!topic || !topic.prompts[promptIndex]) return;

    topic.prompts[promptIndex].isFavorite =
      !topic.prompts[promptIndex].isFavorite;

    chrome.storage.sync.set({ [folderId]: topic }, function () {
      if (chrome.runtime.lastError) {
        console.error(
          "Error toggling favorite status:",
          chrome.runtime.lastError
        );
        alert("Fehler beim Umschalten des Favoritenstatus.");
      } else {
        console.log(`Favorite status toggled for prompt in ${folderId}`);
        const currentView = document
          .getElementById("mainHeaderTitle")
          .textContent.toLowerCase();
        if (currentView.includes("favorites")) {
          window.loadPrompts("favorites");
        } else if (currentView.includes("all")) {
          window.loadPrompts("all");
        } else if (currentView.includes("single")) {
          window.loadPrompts("single");
        } else if (currentView.includes("categorised")) {
          window.loadPrompts("categorised");
        } else if (currentView.includes("trash")) {
          window.loadPrompts("trash");
        } else {
          window.loadPrompts(folderId);
        }
      }
    });
  });
}
function copyPrompt(prompt) {
  navigator.clipboard.writeText(prompt.content).then(() => {
    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.textContent = "Prompt copied to clipboard!";
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  });
}

function sharePrompt(prompt) {
  if (navigator.share) {
    navigator
      .share({
        title: prompt.title,
        text: prompt.content,
      })
      .catch((err) => {
        console.error("Failed to share prompt:", err);
      });
  } else {
    alert("Sharing is not supported in this browser.");
  }
}

function movePromptToFolder(currentFolderId, promptIndex, promptItem) {
  chrome.storage.sync.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
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
      alert("No folders available to move this prompt to.");
      return;
    }

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
    headerTitle.textContent = "Move Prompt to Folder";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const selectLabel = document.createElement("label");
    selectLabel.textContent = "Select Folder:";
    selectLabel.style.marginBottom = "10px";
    selectLabel.style.display = "block";

    const select = document.createElement("select");
    select.classList.add("reorder-select");
    select.style.width = "100%";
    select.style.padding = "8px";
    select.style.borderRadius = "4px";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select a folder";
    defaultOption.disabled = true;
    select.appendChild(defaultOption);

    folders.forEach(([id, topic]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = topic.name;
      if (id === currentFolderId) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    const moveButton = document.createElement("button");
    moveButton.textContent = "Move";
    moveButton.classList.add("action-btn");
    moveButton.style.marginTop = "15px";

    select.addEventListener("change", () => {
      moveButton.disabled =
        select.value === "" || select.value === currentFolderId;
    });

    moveButton.addEventListener("click", () => {
      const targetFolderId = select.value;
      if (!targetFolderId || targetFolderId === currentFolderId) return;

      const prompt = data[currentFolderId].prompts[promptIndex];
      data[currentFolderId].prompts.splice(promptIndex, 1);
      data[targetFolderId].prompts.push(prompt);

      const updates = {};
      if (data[currentFolderId].prompts.length === 0) {
        chrome.storage.sync.remove(currentFolderId);
      } else {
        updates[currentFolderId] = data[currentFolderId];
      }
      updates[targetFolderId] = data[targetFolderId];

      chrome.storage.sync.set(updates, function () {
        if (chrome.runtime.lastError) {
          console.error("Error moving prompt:", chrome.runtime.lastError);
        } else {
          console.log(
            `Prompt moved from ${currentFolderId} to ${targetFolderId}`
          );
          promptItem.remove();
          loadPrompts();
          loadFolders();
        }
      });

      modal.style.display = "none";
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(selectLabel);
    modalBody.appendChild(select);
    modalBody.appendChild(moveButton);
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
          margin: 10% auto;
          padding: 0;
          width: 90%;
          max-width: 500px;
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
          margin-bottom: 10px;
          display: block;
          color: #34495e;
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

      .action-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
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

    select.focus();
  });
}

function removeFromFolder(currentFolderId, promptIndex, promptItem) {
  if (confirm("Are you sure you want to remove this prompt from its folder?")) {
    chrome.storage.sync.get(currentFolderId, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const topic = data[currentFolderId];
      if (!topic || !topic.prompts[promptIndex]) return;

      const prompt = topic.prompts[promptIndex];
      topic.prompts.splice(promptIndex, 1);

      const hiddenFolderId = `hidden_folder_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}`;
      const hiddenFolder = {
        name: prompt.title.slice(0, 50),
        prompts: [prompt],
        isHidden: true,
      };

      const updates = {};
      if (topic.prompts.length === 0) {
        chrome.storage.sync.remove(currentFolderId);
      } else {
        updates[currentFolderId] = topic;
      }
      updates[hiddenFolderId] = hiddenFolder;

      chrome.storage.sync.set(updates, function () {
        if (chrome.runtime.lastError) {
          console.error(
            "Error moving prompt to hidden folder:",
            chrome.runtime.lastError
          );
        } else {
          console.log(
            `Prompt removed from ${currentFolderId} and moved to hidden folder ${hiddenFolderId}`
          );
          promptItem.remove();
          loadPrompts();
          loadFolders();
        }
      });
    });
  }
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
          // Copy prompt content to clipboard on failure
          navigator.clipboard
            .writeText(prompt.content)
            .then(() => {
              alert(
                "Failed to send prompt to the page. Prompt has been copied to clipboard."
              );
            })
            .catch((err) => {
              console.error("❌ Failed to copy to clipboard:", err);
              alert(
                "Failed to send prompt to the page and failed to copy to clipboard."
              );
            });
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

  const favoriteLabel = document.createElement("label");
  favoriteLabel.textContent = "Add to Favorites:";
  favoriteLabel.style.marginTop = "10px";
  favoriteLabel.style.display = "block";
  const favoriteCheckbox = document.createElement("input");
  favoriteCheckbox.type = "checkbox";
  favoriteCheckbox.checked = prompt.isFavorite || false;
  favoriteCheckbox.style.marginLeft = "10px";

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  saveButton.classList.add("action-btn");
  saveButton.style.marginTop = "15px";

  saveButton.addEventListener("click", () => {
    const newTitle = titleInput.value.trim();
    const newDesc = descInput.value.trim();
    const newContent = contentInput.value.trim();
    const isFavorite = favoriteCheckbox.checked;

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
        isFavorite,
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
  modalBody.appendChild(favoriteLabel);
  modalBody.appendChild(favoriteCheckbox);
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
            console.error("Error restoring prompt:", chrome.runtime.lastError);
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
        chrome.storage.sync.set({ [trashFolderId]: trashFolder }, function () {
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
        });
      }
    });
  }
}
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
      document.getElementById("mainHeaderTitle").textContent = "All Prompts";
      return;
    }

    noData.style.display = "none";

    if (view === "favorites") {
      document.getElementById("mainHeaderTitle").textContent = "Favorites";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts
              .filter((prompt) => prompt.isFavorite)
              .map((prompt, index) => ({
                prompt,
                folderId: id,
                index,
                isHidden: topic.isHidden || false,
                isTrash: false,
              }))
          );
        }
      });
    } else if (view === "all") {
      document.getElementById("mainHeaderTitle").textContent = "All Prompts";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              isHidden: topic.isHidden || false,
              isTrash: false,
            }))
          );
        }
      });
    } else if (view === "single") {
      document.getElementById("mainHeaderTitle").textContent = "Single Prompts";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && topic.isHidden && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              isHidden: true,
              isTrash: false,
            }))
          );
        }
      });
    } else if (view === "categorised") {
      document.getElementById("mainHeaderTitle").textContent =
        "Categorised Prompts";
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && !topic.isHidden && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              isHidden: false,
              isTrash: false,
            }))
          );
        }
      });
    } else if (view === "trash") {
      document.getElementById("mainHeaderTitle").textContent = "Trash";
      const trashFolder = data["trash_folder"];
      if (trashFolder && trashFolder.prompts) {
        allPrompts = trashFolder.prompts.map((prompt, index) => ({
          prompt,
          folderId: "trash_folder",
          index,
          isHidden: false,
          isTrash: true,
        }));
      }
    } else {
      const folder = data[view];
      if (folder && folder.prompts && !folder.isTrash) {
        document.getElementById(
          "mainHeaderTitle"
        ).textContent = `${folder.name} (${folder.prompts.length})`;
        allPrompts = folder.prompts.map((prompt, index) => ({
          prompt,
          folderId: view,
          index,
          isHidden: folder.isHidden || false,
          isTrash: false,
        }));
      }
    }

    if (allPrompts.length === 0) {
      noData.style.display = "block";
      noData.textContent =
        view === "trash"
          ? "No prompts in trash"
          : view === "favorites"
          ? "No favorite prompts available"
          : "No prompts available";
      return;
    }

    allPrompts.forEach(({ prompt, folderId, index, isHidden, isTrash }) => {
      const promptItem = createPromptItem(
        prompt,
        folderId,
        index,
        isHidden,
        isTrash,
        view
      );
      promptList.appendChild(promptItem);
    });
  });
}
