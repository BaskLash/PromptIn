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

function createNewFolder() {
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
  headerTitle.textContent = "Create New Folder";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const nameLabel = document.createElement("label");
  nameLabel.textContent = "Folder Name:";
  nameLabel.style.marginBottom = "10px";
  nameLabel.style.display = "block";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Enter folder name";
  nameInput.style.width = "100%";
  nameInput.style.padding = "8px";
  nameInput.style.borderRadius = "4px";
  nameInput.style.border = "1px solid #ddd";

  const createButton = document.createElement("button");
  createButton.textContent = "Create";
  createButton.classList.add("action-btn");
  createButton.style.marginTop = "15px";

  createButton.addEventListener("click", () => {
    const folderName = nameInput.value.trim();
    if (!folderName) {
      alert("Folder name is required.");
      return;
    }

    const folderId = `folder_${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}`;
    const newFolder = {
      name: folderName,
      prompts: [],
      isHidden: false,
    };

    chrome.storage.local.set({ [folderId]: newFolder }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error creating new folder:", chrome.runtime.lastError);
        alert("Fehler beim Erstellen des neuen Ordners.");
      } else {
        console.log(`New folder created with ID: ${folderId}`);
        loadFolders();
        loadFolderNavigation();
        showFolderContent(folderId);
      }
    });

    modal.style.display = "none";
    document.body.removeChild(modal);
    document.head.removeChild(style);
  });

  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);
  modalBody.appendChild(nameLabel);
  modalBody.appendChild(nameInput);
  modalBody.appendChild(createButton);
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

      .modal-body input {
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

  nameInput.focus();
}

function addNewPrompt(currentFolderId = null) {
  chrome.storage.local.get(null, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
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
    headerTitle.textContent = "Add New Prompt";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Prompt Title:";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.placeholder = "Enter prompt title";
    titleInput.style.width = "100%";
    titleInput.style.padding = "8px";
    titleInput.style.borderRadius = "4px";
    titleInput.style.border = "1px solid #ddd";

    const descLabel = document.createElement("label");
    descLabel.textContent = "Description (optional):";
    const descInput = document.createElement("textarea");
    descInput.placeholder = "Enter prompt description";
    descInput.style.width = "100%";
    descInput.style.padding = "8px";
    descInput.style.borderRadius = "4px";
    descInput.style.border = "1px solid #ddd";
    descInput.style.minHeight = "80px";

    const contentLabel = document.createElement("label");
    contentLabel.textContent = "Prompt Content:";
    const contentInput = document.createElement("textarea");
    contentInput.placeholder = "Enter prompt content";
    contentInput.style.width = "100%";
    contentInput.style.padding = "8px";
    contentInput.style.borderRadius = "4px";
    contentInput.style.border = "1px solid #ddd";
    contentInput.style.minHeight = "120px";

    const folderLabel = document.createElement("label");
    folderLabel.textContent = "Select Folder (optional):";
    const folderSelect = document.createElement("select");
    folderSelect.style.width = "100%";
    folderSelect.style.padding = "8px";
    folderSelect.style.borderRadius = "4px";
    folderSelect.style.border = "1px solid #ddd";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "No folder (single prompt)";
    folderSelect.appendChild(defaultOption);

    const folders = Object.entries(data).filter(
      ([, topic]) =>
        topic.prompts &&
        Array.isArray(topic.prompts) &&
        !topic.isHidden &&
        !topic.isTrash
    );
    folders.forEach(([id, topic]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = topic.name;
      if (id === currentFolderId) {
        option.selected = true;
      }
      folderSelect.appendChild(option);
    });

    const favoriteLabel = document.createElement("label");
    favoriteLabel.textContent = "Add to Favorites:";
    favoriteLabel.style.marginTop = "10px";
    favoriteLabel.style.display = "block";
    const favoriteCheckbox = document.createElement("input");
    favoriteCheckbox.type = "checkbox";
    favoriteCheckbox.style.marginLeft = "10px";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Prompt";
    saveButton.classList.add("action-btn");
    saveButton.style.marginTop = "15px";

    saveButton.addEventListener("click", () => {
      const title = titleInput.value.trim();
      const description = descInput.value.trim();
      const content = contentInput.value.trim();
      const folderId = folderSelect.value;
      const isFavorite = favoriteCheckbox.checked;

      if (!title || !content) {
        alert("Title and content are required.");
        return;
      }

      const newPrompt = {
        title,
        description,
        content,
        isFavorite,
        aiModels: aiModelCheckboxes
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => checkbox.value),
        incompatibleAIModels: incompatibleAIModelCheckboxes
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => checkbox.value),
        createdAt: Date.now(),
        lastUsed: Date.now(),
        usageCount: 0,
        versions: [
          {
            versionId: generateUUID(),
            title,
            description,
            content,
            timestamp: Date.now(),
          },
        ],
      };

      if (folderId) {
        data[folderId].prompts.push(newPrompt);
        chrome.storage.local.set({ [folderId]: data[folderId] }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving prompt:", chrome.runtime.lastError);
            alert("Fehler beim Speichern des Prompts.");
          } else {
            console.log(`Prompt added to folder ${folderId}`);
            loadFolderNavigation();
            if (mainHeaderTitle.textContent === "All Prompts") {
              showAllPrompts();
            } else if (mainHeaderTitle.textContent === "Single Prompts") {
              showSinglePrompts();
            } else if (mainHeaderTitle.textContent === "Categorised Prompts") {
              showCategorisedPrompts();
            } else if (mainHeaderTitle.textContent === "Favorites") {
              showFavoritePrompts();
            } else {
              showFolderContent(folderId);
            }
          }
        });
      } else {
        const newFolderId = `hidden_folder_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`;
        const newFolder = {
          name: title.slice(0, 50),
          prompts: [newPrompt],
          isHidden: true,
        };
        chrome.storage.local.set({ [newFolderId]: newFolder }, function () {
          if (chrome.runtime.lastError) {
            console.error("Error saving prompt:", chrome.runtime.lastError);
            alert("Fehler beim Speichern des Prompts.");
          } else {
            console.log(`Prompt added to new hidden folder ${newFolderId}`);
            loadFolderNavigation();
            if (mainHeaderTitle.textContent === "All Prompts") {
              showAllPrompts();
            } else if (mainHeaderTitle.textContent === "Single Prompts") {
              showSinglePrompts();
            } else if (mainHeaderTitle.textContent === "Favorites") {
              showFavoritePrompts();
            } else {
              showAllPrompts();
            }
          }
        });
      }

      modal.style.display = "none";
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(titleLabel);
    modalBody.appendChild(titleInput);
    modalBody.appendChild(descLabel);
    modalBody.appendChild(descInput);
    modalBody.appendChild(contentLabel);
    modalBody.appendChild(contentInput);
    modalBody.appendChild(folderLabel);
    modalBody.appendChild(folderSelect);
    modalBody.appendChild(favoriteLabel);
    modalBody.appendChild(favoriteCheckbox);

    const aiModelLabel = document.createElement("label");
    aiModelLabel.textContent = "Compatible AI Models:";
    aiModelLabel.style.marginTop = "10px";
    aiModelLabel.style.display = "block";
    const aiModelContainer = document.createElement("div");
    aiModelContainer.style.display = "flex";
    aiModelContainer.style.flexDirection = "column";
    aiModelContainer.style.gap = "8px";
    const aiModels = [
      "Grok",
      "Gemini",
      "ChatGPT",
      "Claude",
      "BlackBox",
      "GitHub Copilot",
      "Microsoft Copilot",
      "Mistral",
      "DuckDuckGo",
      "Perplexity",
      "DeepSeek",
      "Deepai",
      "Qwen AI",
    ];
    const aiModelCheckboxes = [];
    aiModels.forEach((model) => {
      const checkboxContainer = document.createElement("div");
      checkboxContainer.style.display = "flex";
      checkboxContainer.style.alignItems = "center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = model;
      checkbox.id = `ai-model-${model}`;
      checkbox.style.marginRight = "8px";
      const label = document.createElement("label");
      label.htmlFor = `ai-model-${model}`;
      label.textContent = model;
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      aiModelContainer.appendChild(checkboxContainer);
      aiModelCheckboxes.push(checkbox);
    });
    modalBody.appendChild(aiModelLabel);
    modalBody.appendChild(aiModelContainer);

    const incompatibleAIModelLabel = document.createElement("label");
    incompatibleAIModelLabel.textContent = "Incompatible AI Models:";
    incompatibleAIModelLabel.style.marginTop = "10px";
    incompatibleAIModelLabel.style.display = "block";
    const incompatibleAIModelContainer = document.createElement("div");
    incompatibleAIModelContainer.style.display = "flex";
    incompatibleAIModelContainer.style.flexDirection = "column";
    incompatibleAIModelContainer.style.gap = "8px";
    const incompatibleAIModelCheckboxes = [];
    aiModels.forEach((model) => {
      const checkboxContainer = document.createElement("div");
      checkboxContainer.style.display = "flex";
      checkboxContainer.style.alignItems = "center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = model;
      checkbox.id = `incompatible-ai-model-${model}`;
      checkbox.style.marginRight = "8px";
      const label = document.createElement("label");
      label.htmlFor = `incompatible-ai-model-${model}`;
      label.textContent = model;
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      incompatibleAIModelContainer.appendChild(checkboxContainer);
      incompatibleAIModelCheckboxes.push(checkbox);
    });
    modalBody.appendChild(incompatibleAIModelLabel);
    modalBody.appendChild(incompatibleAIModelContainer);

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
      .modal-body textarea,
      .modal-body select {
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
  });
}
function toggleFavoritePrompt(folderId, promptIndex, promptItem, prompt) {
  chrome.storage.local.get(folderId, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    const topic = data[folderId];
    if (!topic || !topic.prompts[promptIndex]) return;

    topic.prompts[promptIndex].isFavorite =
      !topic.prompts[promptIndex].isFavorite;

    chrome.storage.local.set({ [folderId]: topic }, function () {
      if (chrome.runtime.lastError) {
        console.error(
          "Error toggling favorite status:",
          chrome.runtime.lastError
        );
        alert("Fehler beim Umschalten des Favoritenstatus.");
      } else {
        console.log(`Favorite status toggled for prompt in ${folderId}`);
        promptItem.remove();
        if (mainHeaderTitle.textContent === "Favorites") {
          showFavoritePrompts();
        } else if (mainHeaderTitle.textContent === "All Prompts") {
          showAllPrompts();
        } else if (mainHeaderTitle.textContent === "Single Prompts") {
          showSinglePrompts();
        } else if (mainHeaderTitle.textContent === "Categorised Prompts") {
          showCategorisedPrompts();
        } else {
          showFolderContent(folderId);
        }
      }
    });
  });
}

function restorePrompt(trashFolderId, promptIndex, promptItem) {
  if (confirm("Are you sure you want to restore this prompt?")) {
    chrome.storage.local.get(trashFolderId, function (data) {
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

      chrome.storage.local.get(originalFolderId, function (folderData) {
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
          chrome.storage.local.remove(trashFolderId);
        } else {
          updates[trashFolderId] = trashFolder;
        }
        updates[originalFolderId] = targetFolder;

        chrome.storage.local.set(updates, function () {
          if (chrome.runtime.lastError) {
            console.error("Error restoring prompt:", chrome.runtime.lastError);
            alert("Fehler beim Wiederherstellen der Prompt.");
          } else {
            console.log(`Prompt restored to ${originalFolderId}`);
            promptItem.remove();
            loadFolderNavigation();
            showTrashedPrompts();
            if (mainHeaderTitle.textContent === "All Prompts") showAllPrompts();
            else if (mainHeaderTitle.textContent === "Single Prompts")
              showSinglePrompts();
            else if (mainHeaderTitle.textContent === "Categorised Prompts")
              showCategorisedPrompts();
          }
        });
      });
    });
  }
}

function permanentlyDeletePrompt(trashFolderId, promptIndex, promptItem) {
  if (
    confirm(
      "Are you sure you want to permanently delete this prompt? This action cannot be undone."
    )
  ) {
    chrome.storage.local.get(trashFolderId, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching trash data:", chrome.runtime.lastError);
        return;
      }

      const trashFolder = data[trashFolderId];
      if (!trashFolder || !trashFolder.prompts[promptIndex]) return;

      trashFolder.prompts.splice(promptIndex, 1);

      if (trashFolder.prompts.length === 0) {
        chrome.storage.local.remove(trashFolderId, function () {
          if (chrome.runtime.lastError) {
            console.error(
              "Error removing trash folder:",
              chrome.runtime.lastError
            );
          }
          console.log("Trash folder deleted (empty)");
          promptItem.remove();
          loadFolderNavigation();
          showTrashedPrompts();
        });
      } else {
        chrome.storage.local.set({ [trashFolderId]: trashFolder }, function () {
          if (chrome.runtime.lastError) {
            console.error(
              "Error deleting prompt from trash:",
              chrome.runtime.lastError
            );
            alert("Fehler beim endgültigen Löschen der Prompt.");
          } else {
            console.log("Prompt permanently deleted from trash");
            promptItem.remove();
            showTrashedPrompts();
          }
        });
      }
    });
  }
}

function copyPrompt(prompt, folderId, promptIndex) {
  const text = typeof prompt === "string" ? prompt : prompt.content;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Prompt copied to clipboard!");
      // Update lastUsed and usageCount in storage
      if (folderId && typeof promptIndex === "number") {
        chrome.storage.local.get(folderId, function (data) {
          if (chrome.runtime.lastError) {
            console.error("Error fetching data:", chrome.runtime.lastError);
            return;
          }
          const topic = data[folderId];
          if (!topic || !topic.prompts[promptIndex]) return;

          topic.prompts[promptIndex].lastUsed = Date.now();
          topic.prompts[promptIndex].usageCount =
            (topic.prompts[promptIndex].usageCount || 0) + 1;

          chrome.storage.local.set({ [folderId]: topic }, function () {
            if (chrome.runtime.lastError) {
              console.error(
                "Error updating prompt data:",
                chrome.runtime.lastError
              );
            } else {
              console.log(
                `lastUsed and usageCount updated for prompt in ${folderId}`
              );
              // Refresh UI if necessary
              if (mainHeaderTitle.textContent === "All Prompts") {
                showAllPrompts();
              } else if (mainHeaderTitle.textContent === "Single Prompts") {
                showSinglePrompts();
              } else if (
                mainHeaderTitle.textContent === "Categorised Prompts"
              ) {
                showCategorisedPrompts();
              } else if (mainHeaderTitle.textContent === "Favorites") {
                showFavoritePrompts();
              } else {
                showFolderContent(folderId);
              }
            }
          });
        });
      }
    })
    .catch((err) => {
      console.error("Failed to copy prompt:", err);
    });
}

function sharePrompt(prompt) {
  const text = typeof prompt === "string" ? prompt : prompt.content;
  if (navigator.share) {
    navigator
      .share({
        title: typeof prompt === "string" ? "Prompt" : prompt.title,
        text: text,
      })
      .catch((err) => {
        console.error("Failed to share prompt:", err);
      });
  } else {
    alert("Sharing is not supported in this browser.");
  }
}

function showPromptDetails(prompt, folderId, index) {
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
  headerTitle.textContent = "Prompt Details";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  const titleLabel = document.createElement("label");
  titleLabel.textContent = "Title:";
  const titleText = document.createElement("p");
  titleText.textContent =
    typeof prompt === "string" ? prompt.slice(0, 50) : prompt.title;

  const descLabel = document.createElement("label");
  descLabel.textContent = "Description:";
  const descText = document.createElement("p");
  descText.textContent =
    typeof prompt === "string" ? "N/A" : prompt.description || "No description";

  const contentLabel = document.createElement("label");
  contentLabel.textContent = "Content:";
  const contentText = document.createElement("p");
  contentText.textContent =
    typeof prompt === "string" ? prompt : prompt.content;

  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);
  modalBody.appendChild(titleLabel);
  modalBody.appendChild(titleText);
  modalBody.appendChild(descLabel);
  modalBody.appendChild(descText);
  modalBody.appendChild(contentLabel);
  modalBody.appendChild(contentText);

  const aiModelsLabel = document.createElement("label");
  aiModelsLabel.textContent = "Compatible AI Models:";
  const aiModelsText = document.createElement("p");
  aiModelsText.textContent =
    prompt.aiModels && prompt.aiModels.length > 0
      ? prompt.aiModels.join(", ")
      : "None";
  modalBody.appendChild(aiModelsLabel);
  modalBody.appendChild(aiModelsText);

  const incompatibleAIModelsLabel = document.createElement("label");
  incompatibleAIModelsLabel.textContent = "Incompatible AI Models:";
  const incompatibleAIModelsText = document.createElement("p");
  incompatibleAIModelsText.textContent =
    prompt.incompatibleAIModels && prompt.incompatibleAIModels.length > 0
      ? prompt.incompatibleAIModels.join(", ")
      : "None";
  modalBody.appendChild(incompatibleAIModelsLabel);
  modalBody.appendChild(incompatibleAIModelsText);

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

      .modal-body p {
        margin: 0 0 12px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        word-break: break-word;
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

  chrome.storage.local.get(folderId, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }
    const topic = data[folderId];
    if (!topic || !topic.prompts[index]) return;

    // Aktualisiere lastUsed
    topic.prompts[index].lastUsed = Date.now();
    chrome.storage.local.set({ [folderId]: topic }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error updating lastUsed:", chrome.runtime.lastError);
      } else {
        console.log(`lastUsed updated for prompt in ${folderId}`);
      }
    });
  });
}

function removeFromFolder(currentFolderId, promptIndex, promptItem) {
  if (confirm("Are you sure you want to remove this prompt from its folder?")) {
    chrome.storage.local.get(currentFolderId, function (data) {
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
      let folderName;
      if (typeof prompt === "string") {
        folderName = prompt.slice(0, 50);
      } else {
        folderName = prompt.title || prompt.content || "Untitled Prompt";
        folderName = folderName.slice(0, 50);
      }
      const hiddenFolder = {
        name: folderName,
        prompts: [prompt],
        isHidden: true,
      };

      const updates = {};
      if (topic.prompts.length === 0) {
        chrome.storage.local.remove(currentFolderId);
      } else {
        updates[currentFolderId] = topic;
      }
      updates[hiddenFolderId] = hiddenFolder;

      chrome.storage.local.set(updates, function () {
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
          loadFolderNavigation();
          showFolderContent(currentFolderId);
          if (mainHeaderTitle.textContent === "All Prompts") showAllPrompts();
          else if (mainHeaderTitle.textContent === "Single Prompts")
            showSinglePrompts();
          else if (mainHeaderTitle.textContent === "Categorised Prompts")
            showCategorisedPrompts();
        }
      });
    });
  }
}

function movePromptToFolder(currentFolderId, promptIndex, promptItem) {
  chrome.storage.local.get(null, function (data) {
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
        chrome.storage.local.remove(currentFolderId);
      } else {
        updates[currentFolderId] = data[currentFolderId];
      }
      updates[targetFolderId] = data[targetFolderId];

      chrome.storage.local.set(updates, function () {
        if (chrome.runtime.lastError) {
          console.error("Error moving prompt:", chrome.runtime.lastError);
        } else {
          console.log(
            `Prompt moved from ${currentFolderId} to ${targetFolderId}`
          );
          promptItem.remove();
          loadFolderNavigation();
          showFolderContent(currentFolderId);
          if (mainHeaderTitle.textContent === "All Prompts") showAllPrompts();
          else if (mainHeaderTitle.textContent === "Single Prompts")
            showSinglePrompts();
          else if (mainHeaderTitle.textContent === "Categorised Prompts")
            showCategorisedPrompts();
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
function deletePrompt(folderId, promptIndex, promptItem) {
  if (confirm("Are you sure you want to move this prompt to the trash?")) {
    chrome.storage.local.get([folderId, "trash_folder"], function (data) {
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
        chrome.storage.local.remove(folderId);
      } else {
        updates[folderId] = topic;
      }
      updates[trashFolderId] = trashFolder;

      chrome.storage.local.set(updates, function () {
        if (chrome.runtime.lastError) {
          console.error(
            "Error moving prompt to trash:",
            chrome.runtime.lastError
          );
          alert("Fehler beim Verschieben der Prompt in den Papierkorb.");
        } else {
          console.log(`Prompt moved to trash from ${folderId}`);
          promptItem.remove();
          loadFolderNavigation();
          if (topic.prompts.length > 0) showFolderContent(folderId);
          else loadFolders();
          if (mainHeaderTitle.textContent === "Favorites")
            showFavoritePrompts();
          if (mainHeaderTitle.textContent === "All Prompts") showAllPrompts();
          else if (mainHeaderTitle.textContent === "Single Prompts")
            showSinglePrompts();
          else if (mainHeaderTitle.textContent === "Categorised Prompts")
            showCategorisedPrompts();
        }
      });
    });
  }
}
function renameFolder(folderId, folderTitleElement, currentName) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentName;
  input.class = "rename-input";
  folderTitleElement.replaceWith(input);
  input.focus();

  function saveNewName() {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      chrome.storage.local.get(folderId, function (data) {
        if (data[folderId]) {
          data[folderId].name = newName;
          chrome.storage.local.set(data, function () {
            if (chrome.runtime.lastError) {
              console.error("Error renaming folder:", chrome.runtime.lastError);
            } else {
              console.log(`Folder ${folderId} renamed to ${newName}`);
              folderTitleElement.textContent = `${newName} (${data[folderId].prompts.length})`;
              input.replaceWith(folderTitleElement);
              loadFolderNavigation();
              showFolderContent(folderId);
            }
          });
        }
      });
    } else {
      input.replaceWith(folderTitleElement);
    }
  }

  input.addEventListener("blur", saveNewName);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveNewName();
  });
}

function deleteFolder(folderId, folderCard) {
  if (
    confirm("Are you sure you want to delete this folder and all its prompts?")
  ) {
    chrome.storage.local.remove(folderId, function () {
      if (chrome.runtime.lastError) {
        console.error("Error deleting folder:", chrome.runtime.lastError);
      } else {
        console.log(`Folder ${folderId} deleted`);
        folderCard.remove();
        loadFolderNavigation();
        loadFolders();
        if (mainHeaderTitle.textContent === "Favorites") showFavoritePrompts();
        else if (mainHeaderTitle.textContent === "All Prompts")
          showAllPrompts();
        else if (mainHeaderTitle.textContent === "Single Prompts")
          showSinglePrompts();
        else if (mainHeaderTitle.textContent === "Categorised Prompts")
          showCategorisedPrompts();
        else if (mainHeaderTitle.textContent === "Trash") showTrashedPrompts();
      }
    });
  }
}

function editPrompt(folderId, promptIndex, promptItem) {
  chrome.storage.local.get(folderId, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }

    const prompt = data[folderId].prompts[promptIndex];
    if (!prompt) return;

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
    titleInput.value =
      typeof prompt === "string" ? prompt.slice(0, 50) : prompt.title || "";
    titleInput.style.width = "100%";
    titleInput.style.padding = "8px";
    titleInput.style.borderRadius = "4px";
    titleInput.style.border = "1px solid #ddd";

    const descLabel = document.createElement("label");
    descLabel.textContent = "Description:";
    const descInput = document.createElement("textarea");
    descInput.value =
      typeof prompt === "string" ? "" : prompt.description || "";
    descInput.style.width = "100%";
    descInput.style.padding = "8px";
    descInput.style.borderRadius = "4px";
    descInput.style.border = "1px solid #ddd";
    descInput.style.minHeight = "80px";

    const contentLabel = document.createElement("label");
    contentLabel.textContent = "Prompt:";
    const contentInput = document.createElement("textarea");
    contentInput.value =
      typeof prompt === "string" ? prompt : prompt.content || "";
    contentInput.style.width = "100%";
    contentInput.style.padding = "8px";
    contentInput.style.borderRadius = "4px";
    contentInput.style.border = "1px solid #ddd";
    contentInput.style.minHeight = "120px";

    const folderLabel = document.createElement("label");
    folderLabel.textContent = "Folder:";
    const folderText = document.createElement("p");
    folderText.textContent = data[folderId].name || "No folder assigned";
    folderText.style.padding = "8px";
    folderText.style.background = "#f8f9fa";
    folderText.style.borderRadius = "4px";

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

      const currentPrompt = data[folderId].prompts[promptIndex];
      const newVersion = {
        versionId: generateUUID(),
        title: newTitle,
        description: newDesc,
        content: newContent,
        timestamp: Date.now(),
      };

      if (!currentPrompt.versions) {
        currentPrompt.versions = [];
      }
      currentPrompt.versions.push(newVersion);
      if (currentPrompt.versions.length > 50) {
        currentPrompt.versions.shift(); // Remove oldest version if limit exceeded
      }

      if (typeof prompt === "string") {
        data[folderId].prompts[promptIndex] = {
          title: newTitle,
          description: newDesc,
          content: newContent,
          isFavorite,
          versions: currentPrompt.versions,
        };
      } else {
        data[folderId].prompts[promptIndex].title = newTitle;
        data[folderId].prompts[promptIndex].description = newDesc;
        data[folderId].prompts[promptIndex].content = newContent;
        data[folderId].prompts[promptIndex].isFavorite = isFavorite;
        data[folderId].prompts[promptIndex].aiModels = aiModelCheckboxes
          .filter((checkbox) => checkbox.checked)
          .map((checkbox) => checkbox.value);
        data[folderId].prompts[promptIndex].incompatibleAIModels =
          incompatibleAIModelCheckboxes
            .filter((checkbox) => checkbox.checked)
            .map((checkbox) => checkbox.value);
        data[folderId].prompts[promptIndex].versions = currentPrompt.versions;
      }

      if (data[folderId].prompts.length === 1 && data[folderId].isHidden) {
        data[folderId].name = newTitle.slice(0, 50);
      }

      chrome.storage.local.set(data, function () {
        if (chrome.runtime.lastError) {
          console.error("Error editing prompt:", chrome.runtime.lastError);
        } else {
          console.log(`Prompt in ${folderId} edited`);
          promptItem.querySelector(".prompt-text").textContent = newTitle;
          if (!data[folderId].isHidden) {
            showFolderContent(folderId);
            if (mainHeaderTitle.textContent === "Categorised Prompts")
              showCategorisedPrompts();
          } else {
            if (mainHeaderTitle.textContent === "Single Prompts")
              showSinglePrompts();
          }
          if (mainHeaderTitle.textContent === "All Prompts") showAllPrompts();
          if (mainHeaderTitle.textContent === "Favorites")
            showFavoritePrompts();
        }
      });

      modal.style.display = "none";
      document.body.removeChild(modal);
      document.head.removeChild(style);
    });

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(titleLabel);
    modalBody.appendChild(titleInput);
    modalBody.appendChild(descLabel);
    modalBody.appendChild(descInput);
    modalBody.appendChild(contentLabel);
    modalBody.appendChild(contentInput);
    modalBody.appendChild(folderLabel);
    modalBody.appendChild(folderText);
    modalBody.appendChild(favoriteLabel);
    modalBody.appendChild(favoriteCheckbox);

    const aiModelLabel = document.createElement("label");
    aiModelLabel.textContent = "Compatible AI Models:";
    aiModelLabel.style.marginTop = "10px";
    aiModelLabel.style.display = "block";
    const aiModelContainer = document.createElement("div");
    aiModelContainer.style.display = "flex";
    aiModelContainer.style.flexDirection = "column";
    aiModelContainer.style.gap = "8px";
    const aiModels = [
      "Grok",
      "Gemini",
      "ChatGPT",
      "Claude",
      "BlackBox",
      "GitHub Copilot",
      "Microsoft Copilot",
      "Mistral",
      "DuckDuckGo",
      "Perplexity",
      "DeepSeek",
      "Deepai",
      "Qwen AI",
    ];
    const aiModelCheckboxes = [];
    aiModels.forEach((model) => {
      const checkboxContainer = document.createElement("div");
      checkboxContainer.style.display = "flex";
      checkboxContainer.style.alignItems = "center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = model;
      checkbox.id = `ai-model-${model}`;
      checkbox.style.marginRight = "8px";
      if (prompt.aiModels && prompt.aiModels.includes(model)) {
        checkbox.checked = true;
      }
      const label = document.createElement("label");
      label.htmlFor = `ai-model-${model}`;
      label.textContent = model;
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      aiModelContainer.appendChild(checkboxContainer);
      aiModelCheckboxes.push(checkbox);
    });
    modalBody.appendChild(aiModelLabel);
    modalBody.appendChild(aiModelContainer);

    const incompatibleAIModelLabel = document.createElement("label");
    incompatibleAIModelLabel.textContent = "Incompatible AI Models:";
    incompatibleAIModelLabel.style.marginTop = "10px";
    incompatibleAIModelLabel.style.display = "block";
    const incompatibleAIModelContainer = document.createElement("div");
    incompatibleAIModelContainer.style.display = "flex";
    incompatibleAIModelContainer.style.flexDirection = "column";
    incompatibleAIModelContainer.style.gap = "8px";
    const incompatibleAIModelCheckboxes = [];
    aiModels.forEach((model) => {
      const checkboxContainer = document.createElement("div");
      checkboxContainer.style.display = "flex";
      checkboxContainer.style.alignItems = "center";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = model;
      checkbox.id = `incompatible-ai-model-${model}`;
      checkbox.style.marginRight = "8px";
      if (
        prompt.incompatibleAIModels &&
        prompt.incompatibleAIModels.includes(model)
      ) {
        checkbox.checked = true;
      }
      const label = document.createElement("label");
      label.htmlFor = `incompatible-ai-model-${model}`;
      label.textContent = model;
      checkboxContainer.appendChild(checkbox);
      checkboxContainer.appendChild(label);
      incompatibleAIModelContainer.appendChild(checkboxContainer);
      incompatibleAIModelCheckboxes.push(checkbox);
    });
    modalBody.appendChild(incompatibleAIModelLabel);
    modalBody.appendChild(incompatibleAIModelContainer);

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

      .modal-body p {
        margin: 0 0 12px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        word-break: break-word;
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
  });
}
