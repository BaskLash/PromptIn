document.addEventListener("DOMContentLoaded", function () {
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
  const folderList = document.getElementById("foldersContainer");
  const searchResults = document.getElementById("searchResults");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const folderNavList = document.getElementById("folderNavList");
  const promptListSection = document.getElementById("promptList");
  const folderListSection = document.getElementById("folderList");
  const promptsContainer = document.getElementById("promptsContainer");
  const allPromptsLink = document.getElementById("allPromptsLink");
  const favoritesLink = document.getElementById("favoritesLink");
  const singlePromptsLink = document.getElementById("singlePromptsLink");
  const mainHeaderTitle = document.getElementById("mainHeaderTitle");
  const categorisedPromptsLink = document.getElementById(
    "categorisedPromptsLink"
  );
  const trashLink = document.getElementById("trashLink");

  if (searchInput.value === "") {
    clearSearch.style.display = "none";
  } else {
    clearSearch.style.display = "block";
  }

  // Status-Flag, ob das Icon geklickt wurde
  let iconClicked = false;

  // Click-Handler für das Icon
  document
    .getElementById("createFolderIcon")
    .addEventListener("click", function (event) {
      iconClicked = true;
      event.stopPropagation();
      createNewFolder();
      setTimeout(() => {
        iconClicked = false;
      }, 100);
    });

  // Collapsible-Logik
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach((collapsible) => {
    collapsible.addEventListener("click", (event) => {
      if (iconClicked) return;
      collapsible.classList.toggle("active");
      const content = collapsible.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

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

  const addPromptBtn = document.getElementById("addPromptBtn");
  if (addPromptBtn) {
    addPromptBtn.addEventListener("click", addNewPrompt);
  }

  function loadFolderNavigation() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      folderNavList.innerHTML = "";

      const validFolders = Object.entries(data).filter(
        ([id, topic]) =>
          topic.prompts &&
          Array.isArray(topic.prompts) &&
          !topic.isHidden &&
          !topic.isTrash
      );

      if (validFolders.length === 0) {
        const noFolders = document.createElement("a");
        noFolders.textContent = "No folders available";
        noFolders.style.color = "#888";
        noFolders.style.pointerEvents = "none";
        folderNavList.appendChild(noFolders);
      } else {
        validFolders.forEach(([id, topic]) => {
          const folderLink = document.createElement("a");
          folderLink.href = `#folder-${id}`;
          folderLink.textContent = `${topic.name} (${topic.prompts.length})`;
          folderLink.dataset.folderId = id;
          folderLink.addEventListener("click", (e) => {
            e.preventDefault();
            [
              favoritesLink,
              allPromptsLink,
              singlePromptsLink,
              categorisedPromptsLink,
              trashLink,
            ].forEach((link) => link.classList.remove("active"));
            showFolderContent(id);
          });
          folderNavList.appendChild(folderLink);
        });
      }

      const collapsibleContent = folderNavList.closest(".collapsible-content");
      if (collapsibleContent.classList.contains("active")) {
        collapsibleContent.style.maxHeight =
          collapsibleContent.scrollHeight + "px";
      }
    });
  }

  function showFolderContent(folderId) {
    chrome.storage.local.get(folderId, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching folder data:", chrome.runtime.lastError);
        return;
      }

      const topic = data[folderId];
      if (!topic) return;

      promptListSection.classList.add("hidden");
      folderListSection.classList.remove("hidden");
      searchResults.classList.add("hidden");

      mainHeaderTitle.textContent = `${topic.name} (${topic.prompts.length})`;
      folderList.innerHTML = "";

      const folderCard = document.createElement("div");
      folderCard.classList.add("folder-card");

      const folderHeader = document.createElement("div");
      folderHeader.classList.add("folder-header");

      const folderActions = document.createElement("div");
      folderActions.classList.add("folder-actions");

      const renameFolderBtn = document.createElement("button");
      renameFolderBtn.textContent = "Rename";
      renameFolderBtn.classList.add("action-btn");
      renameFolderBtn.addEventListener("click", () =>
        renameFolder(folderId, mainHeaderTitle, topic.name)
      );
      folderActions.appendChild(renameFolderBtn);

      const deleteFolderBtn = document.createElement("button");
      deleteFolderBtn.textContent = "Delete";
      deleteFolderBtn.classList.add("action-btn");
      deleteFolderBtn.addEventListener("click", () =>
        deleteFolder(folderId, folderCard)
      );
      folderActions.appendChild(deleteFolderBtn);

      folderHeader.appendChild(folderActions);
      folderCard.appendChild(folderHeader);

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      if (topic.prompts.length === 0) {
        const noPrompts = document.createElement("li");
        noPrompts.textContent = "No prompts in this folder";
        noPrompts.style.color = "#888";
        noPrompts.style.padding = "15px";
        promptList.appendChild(noPrompts);
      } else {
        topic.prompts.forEach((prompt, index) => {
          const promptItem = createPromptItem(
            prompt,
            folderId,
            index,
            topic.prompts.length
          );
          promptList.appendChild(promptItem);
        });
      }

      folderCard.appendChild(promptList);
      folderList.appendChild(folderCard);

      const addPromptBtn = document.getElementById("addPromptBtn");
      if (addPromptBtn) {
        const newButton = addPromptBtn.cloneNode(true);
        addPromptBtn.parentNode.replaceChild(newButton, addPromptBtn);
        newButton.addEventListener("click", () => addNewPrompt(folderId));
      }
    });
  }

  function loadFolders() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      folderList.innerHTML = "";
      document.getElementById("mainHeaderTitle").textContent = "Folders";
      if (!data || Object.keys(data).length === 0) {
        folderList.innerHTML = '<p class="no-results">No folders available</p>';
        mainHeaderTitle.textContent = "Folders";
        return;
      }

      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isHidden) {
          const folderCard = document.createElement("div");
          folderCard.classList.add("folder-card");

          const folderHeader = document.createElement("div");
          folderHeader.classList.add("folder-header");

          const folderTitleElement = document.createElement("h2");
          folderTitleElement.textContent = `${topic.name} (${topic.prompts.length})`;
          folderHeader.appendChild(folderTitleElement);

          const folderActions = document.createElement("div");
          folderActions.classList.add("folder-actions");

          const renameFolderBtn = document.createElement("button");
          renameFolderBtn.textContent = "Rename";
          renameFolderBtn.classList.add("action-btn");
          renameFolderBtn.addEventListener("click", () =>
            renameFolder(id, folderTitleElement, topic.name)
          );
          folderActions.appendChild(renameFolderBtn);

          const deleteFolderBtn = document.createElement("button");
          deleteFolderBtn.textContent = "Delete";
          deleteFolderBtn.classList.add("action-btn");
          deleteFolderBtn.addEventListener("click", () =>
            deleteFolder(id, folderCard)
          );
          folderActions.appendChild(deleteFolderBtn);

          folderHeader.appendChild(folderActions);
          folderCard.appendChild(folderHeader);

          const promptList = document.createElement("ul");
          promptList.classList.add("prompt-list");

          if (topic.prompts.length === 0) {
            const noPrompts = document.createElement("li");
            noPrompts.textContent = "No prompts in this folder";
            noPrompts.style.color = "#888";
            noPrompts.style.padding = "15px";
            promptList.appendChild(noPrompts);
          } else {
            topic.prompts.forEach((prompt, index) => {
              const promptItem = createPromptItem(
                prompt,
                id,
                index,
                topic.prompts.length
              );
              promptList.appendChild(promptItem);
            });
          }

          folderCard.appendChild(promptList);
          folderList.appendChild(folderCard);
        }
      });
      mainHeaderTitle.textContent = "Folders";
    });
    const addPromptBtn = document.getElementById("addPromptBtn");
    if (addPromptBtn) {
      addPromptBtn.disabled = false;
    }
  }

  function createPromptItem(prompt, folderId, index, totalPrompts) {
    const promptItem = document.createElement("li");
    promptItem.classList.add("prompt-item");
    if (prompt.isFavorite) {
      promptItem.classList.add("favorite");
    }

    const promptContent = document.createElement("div");
    promptContent.classList.add("prompt-content");

    const promptText = document.createElement("span");
    promptText.classList.add("prompt-text");

    chrome.storage.local.get(folderId, (data) => {
      const topic = data[folderId];
      const folderName =
        topic && !topic.isHidden && !topic.isTrash ? topic.name : "";
      promptText.textContent =
        typeof prompt === "string"
          ? prompt.slice(0, 50)
          : folderName
          ? `${prompt.title} (in ${folderName})`
          : prompt.title || "Untitled Prompt";
    });

    const lastUsedText = document.createElement("span");
    lastUsedText.classList.add("prompt-last-used");
    lastUsedText.textContent = prompt.lastUsed
      ? `Lastly used: ${new Date(prompt.lastUsed).toLocaleString()}`
      : "Never used";

    promptContent.appendChild(promptText);
    promptContent.appendChild(lastUsedText);

    const aiModelsText = document.createElement("span");
    aiModelsText.classList.add("prompt-ai-models");
    aiModelsText.textContent =
      prompt.aiModels && prompt.aiModels.length > 0
        ? `AI Models: ${prompt.aiModels.join(", ")}`
        : "AI Models: None";
    promptContent.appendChild(aiModelsText);

    const incompatibleAIModelsText = document.createElement("span");
incompatibleAIModelsText.classList.add("prompt-incompatible-ai-models");
incompatibleAIModelsText.textContent =
  prompt.incompatibleAIModels && prompt.incompatibleAIModels.length > 0
    ? `Incompatible AI Models: ${prompt.incompatibleAIModels.join(", ")}`
    : "Incompatible AI Models: None";
promptContent.appendChild(incompatibleAIModelsText);

    promptItem.appendChild(promptContent);

    const promptActions = document.createElement("div");
    promptActions.classList.add("prompt-actions");

    const menuBtn = document.createElement("button");
    menuBtn.textContent = "...";
    menuBtn.classList.add("action-btn", "menu-btn");
    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown-menu");

    const menuItems = [];
    if (folderId === "trash_folder") {
      menuItems.push(
        {
          text: "Restore",
          action: () => restorePrompt(folderId, index, promptItem),
        },
        {
          text: "Delete Permanently",
          action: () => permanentlyDeletePrompt(folderId, index, promptItem),
        }
      );
    } else {
      menuItems.push(
        {
          text: "Copy Prompt",
          action: () => copyPrompt(prompt, folderId, index),
        },
        {
          text: "Move to Folder",
          action: () => movePromptToFolder(folderId, index, promptItem),
        },
        { text: "Edit", action: () => editPrompt(folderId, index, promptItem) },
        { text: "Share", action: () => sharePrompt(prompt) },
        {
          text: prompt.isFavorite
            ? "Remove from Favorites"
            : "Add to Favorites",
          action: () =>
            toggleFavoritePrompt(folderId, index, promptItem, prompt),
        },
        {
          text: "Show Versions",
          action: () => showPromptVersions(folderId, index, promptItem),
        },
        {
          text: "Move to Trash",
          action: () => deletePrompt(folderId, index, promptItem),
        }
      );

      chrome.storage.local.get(folderId, (data) => {
        const topic = data[folderId];
        if (topic && !topic.isHidden && !topic.isTrash) {
          menuItems.splice(5, 0, {
            text: "Remove from Folder",
            action: () => removeFromFolder(folderId, index, promptItem),
          });
        }

        menuItems.forEach((item) => {
          const menuItem = document.createElement("div");
          menuItem.classList.add("dropdown-item");
          menuItem.textContent = item.text;
          menuItem.addEventListener("click", item.action);
          dropdown.appendChild(menuItem);
        });
      });
    }

    if (folderId === "trash_folder") {
      menuItems.forEach((item) => {
        const menuItem = document.createElement("div");
        menuItem.classList.add("dropdown-item");
        menuItem.textContent = item.text;
        menuItem.addEventListener("click", item.action);
        dropdown.appendChild(menuItem);
      });
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = dropdown.style.display === "block";
      document.querySelectorAll(".dropdown-menu").forEach((menu) => {
        menu.style.display = "none";
      });
      dropdown.style.display = isVisible ? "none" : "block";
    });

    promptActions.appendChild(menuBtn);
    promptActions.appendChild(dropdown);
    promptItem.appendChild(promptActions);

    promptItem.addEventListener("click", (e) => {
      if (!promptActions.contains(e.target)) {
        showPromptDetails(prompt, folderId, index);
      }
    });

    return promptItem;
  }

  // Einmaliger globaler Event-Listener für das Schließen der Dropdowns
  document.addEventListener("click", (e) => {
    const dropdownMenus = document.querySelectorAll(".dropdown-menu");
    dropdownMenus.forEach((menu) => {
      const promptActions = menu.closest(".prompt-actions");
      if (promptActions && !promptActions.contains(e.target)) {
        menu.style.display = "none";
      }
    });
  });

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
              console.error(
                "Error restoring prompt:",
                chrome.runtime.lastError
              );
              alert("Fehler beim Wiederherstellen der Prompt.");
            } else {
              console.log(`Prompt restored to ${originalFolderId}`);
              promptItem.remove();
              loadFolderNavigation();
              showTrashedPrompts();
              if (mainHeaderTitle.textContent === "All Prompts")
                showAllPrompts();
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
          chrome.storage.local.set(
            { [trashFolderId]: trashFolder },
            function () {
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
            }
          );
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
        // Update lastUsed in storage
        if (folderId && typeof promptIndex === "number") {
          chrome.storage.local.get(folderId, function (data) {
            if (chrome.runtime.lastError) {
              console.error("Error fetching data:", chrome.runtime.lastError);
              return;
            }
            const topic = data[folderId];
            if (!topic || !topic.prompts[promptIndex]) return;

            topic.prompts[promptIndex].lastUsed = Date.now();
            chrome.storage.local.set({ [folderId]: topic }, function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error updating lastUsed:",
                  chrome.runtime.lastError
                );
              } else {
                console.log(`lastUsed updated for prompt in ${folderId}`);
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
      typeof prompt === "string"
        ? "N/A"
        : prompt.description || "No description";

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
    if (
      confirm("Are you sure you want to remove this prompt from its folder?")
    ) {
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

  function showAllPrompts() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      document.getElementById("mainHeaderTitle").textContent = "All Prompts";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      let allPrompts = [];
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              totalPrompts: topic.prompts.length,
            }))
          );
        }
      });

      // Sort prompts by lastUsed date (most recent first)
      allPrompts.sort((a, b) => {
        const lastUsedA = a.prompt.lastUsed || 0;
        const lastUsedB = b.prompt.lastUsed || 0;
        return lastUsedB - lastUsedA; // Descending order
      });

      if (allPrompts.length === 0) {
        const noPrompts = document.createElement("li");
        noPrompts.textContent = "No prompts available";
        noPrompts.style.color = "#888";
        noPrompts.style.padding = "15px";
        promptList.appendChild(noPrompts);
      } else {
        allPrompts.forEach(({ prompt, folderId, index, totalPrompts }) => {
          const promptItem = createPromptItem(
            prompt,
            folderId,
            index,
            totalPrompts
          );
          promptList.appendChild(promptItem);
        });
      }

      promptsContainer.appendChild(promptList);
    });
    const addPromptBtn = document.getElementById("addPromptBtn");
    if (addPromptBtn) {
      addPromptBtn.disabled = false;
    }
  }

  function showSinglePrompts() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      document.getElementById("mainHeaderTitle").textContent = "Single Prompts";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      const singlePrompts = Object.entries(data)
        .filter(
          ([, topic]) => topic.prompts && topic.isHidden && !topic.isTrash
        )
        .map(([id, topic]) => ({
          prompt: topic.prompts[0],
          folderId: id,
          index: 0,
          totalPrompts: topic.prompts.length,
          isHidden: topic.isHidden,
        }));

      if (singlePrompts.length === 0) {
        const noPrompts = document.createElement("li");
        noPrompts.textContent = "No single prompts available";
        noPrompts.style.color = "#888";
        noPrompts.style.padding = "15px";
        promptList.appendChild(noPrompts);
      } else {
        singlePrompts.forEach(({ prompt, folderId, index, totalPrompts }) => {
          const promptItem = createPromptItem(
            prompt,
            folderId,
            index,
            totalPrompts
          );
          promptList.appendChild(promptItem);
        });
      }

      promptsContainer.appendChild(promptList);
    });
    const addPromptBtn = document.getElementById("addPromptBtn");
    if (addPromptBtn) {
      addPromptBtn.disabled = false;
    }
  }

  function showTrashedPrompts() {
    chrome.storage.local.get("trash_folder", function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching trash data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      document.getElementById("mainHeaderTitle").textContent = "Trash";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      const trashFolder = data["trash_folder"];
      if (
        !trashFolder ||
        !trashFolder.prompts ||
        trashFolder.prompts.length === 0
      ) {
        const noPrompts = document.createElement("li");
        noPrompts.textContent = "No prompts in trash";
        noPrompts.style.color = "#888";
        noPrompts.style.padding = "15px";
        promptList.appendChild(noPrompts);
      } else {
        trashFolder.prompts.forEach((prompt, index) => {
          const promptItem = createPromptItem(
            prompt,
            "trash_folder",
            index,
            trashFolder.prompts.length
          );
          promptList.appendChild(promptItem);
        });
      }

      promptsContainer.appendChild(promptList);

      const addPromptBtn = document.getElementById("addPromptBtn");
      if (addPromptBtn) {
        addPromptBtn.disabled = true;
      }
    });
  }

  function showCategorisedPrompts() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      document.getElementById("mainHeaderTitle").textContent =
        "Categorised Prompts";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      let categorisedPrompts = [];
      Object.entries(data)
        .filter(
          ([, topic]) => topic.prompts && !topic.isHidden && !topic.isTrash
        )
        .forEach(([id, topic]) => {
          categorisedPrompts = categorisedPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
              totalPrompts: topic.prompts.length,
            }))
          );
        });

      if (categorisedPrompts.length === 0) {
        const noPrompts = document.createElement("li");
        noPrompts.textContent = "No categorised prompts available";
        noPrompts.style.color = "#888";
        noPrompts.style.padding = "15px";
        promptList.appendChild(noPrompts);
      } else {
        categorisedPrompts.forEach(
          ({ prompt, folderId, index, totalPrompts }) => {
            const promptItem = createPromptItem(
              prompt,
              folderId,
              index,
              totalPrompts
            );
            promptList.appendChild(promptItem);
          }
        );
      }

      promptsContainer.appendChild(promptList);
    });
    const addPromptBtn = document.getElementById("addPromptBtn");
    if (addPromptBtn) {
      addPromptBtn.disabled = false;
    }
  }

  function showFavoritePrompts() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      document.getElementById("mainHeaderTitle").textContent = "Favorites";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      let favoritePrompts = [];
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
          topic.prompts.forEach((prompt, index) => {
            if (prompt.isFavorite) {
              favoritePrompts.push({
                prompt,
                folderId: id,
                index,
                totalPrompts: topic.prompts.length,
              });
            }
          });
        }
      });

      if (favoritePrompts.length === 0) {
        const noPrompts = document.createElement("li");
        noPrompts.textContent = "No favorite prompts available";
        noPrompts.style.color = "#888";
        noPrompts.style.padding = "15px";
        promptList.appendChild(noPrompts);
      } else {
        favoritePrompts.forEach(({ prompt, folderId, index, totalPrompts }) => {
          const promptItem = createPromptItem(
            prompt,
            folderId,
            index,
            totalPrompts
          );
          promptList.appendChild(promptItem);
        });
      }

      promptsContainer.appendChild(promptList);

      const addPromptBtn = document.getElementById("addPromptBtn");
      if (addPromptBtn) {
        addPromptBtn.disabled = false;
      }
    });
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
                console.error(
                  "Error renaming folder:",
                  chrome.runtime.lastError
                );
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
      confirm(
        "Are you sure you want to delete this folder and all its prompts?"
      )
    ) {
      chrome.storage.local.remove(folderId, function () {
        if (chrome.runtime.lastError) {
          console.error("Error deleting folder:", chrome.runtime.lastError);
        } else {
          console.log(`Folder ${folderId} deleted`);
          folderCard.remove();
          loadFolderNavigation();
          loadFolders();
          if (mainHeaderTitle.textContent === "Favorites")
            showFavoritePrompts();
          else if (mainHeaderTitle.textContent === "All Prompts")
            showAllPrompts();
          else if (mainHeaderTitle.textContent === "Single Prompts")
            showSinglePrompts();
          else if (mainHeaderTitle.textContent === "Categorised Prompts")
            showCategorisedPrompts();
          else if (mainHeaderTitle.textContent === "Trash")
            showTrashedPrompts();
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
  if (prompt.incompatibleAIModels && prompt.incompatibleAIModels.includes(model)) {
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

  // Function to compute the diff between two texts (adapted from promptSaver's computePromptDiff)
  function computePromptDiff(currentPrompt, selectedPrompt, diffContainer) {
    diffContainer.innerHTML = ""; // Clear the container

    // Normalize whitespace and split into words
    const words1 = (selectedPrompt || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((w) => w);
    const words2 = (currentPrompt || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((w) => w);

    // Compute diff
    let i = 0,
      j = 0;
    const unifiedDiff = [];
    let diffCount = 0; // Count differences

    while (i < words1.length || j < words2.length) {
      if (i < words1.length && j < words2.length && words1[i] === words2[j]) {
        unifiedDiff.push({ value: words1[i], type: "common" });
        i++;
        j++;
      } else {
        let foundMatch = false;
        for (let k = j; k < Math.min(words2.length, j + 3); k++) {
          for (let m = i; m < Math.min(words1.length, i + 3); m++) {
            if (words1[m] === words2[k]) {
              while (i < m) {
                unifiedDiff.push({ value: words1[i], type: "removed" });
                diffCount++;
                i++;
              }
              while (j < k) {
                unifiedDiff.push({ value: words2[j], type: "added" });
                diffCount++;
                j++;
              }
              unifiedDiff.push({ value: words1[m], type: "common" });
              i++;
              j++;
              foundMatch = true;
              break;
            }
          }
          if (foundMatch) break;
        }
        if (!foundMatch) {
          if (i < words1.length) {
            unifiedDiff.push({ value: words1[i], type: "removed" });
            diffCount++;
            i++;
          }
          if (j < words2.length) {
            unifiedDiff.push({ value: words2[j], type: "added" });
            diffCount++;
            j++;
          }
        }
      }
    }

    // Render diff
    let lastWasRemoved = false;
    unifiedDiff.forEach((part, index) => {
      const span = document.createElement("span");
      span.className = `diff-word ${part.type}`;
      span.textContent = part.value + " ";

      if (lastWasRemoved && part.type === "added") {
        const prevPart = unifiedDiff[index - 1];
        if (prevPart && prevPart.type === "removed") {
          const arrow = document.createElement("span");
          arrow.textContent = "→ ";
          arrow.className = "arrow";
          diffContainer.appendChild(arrow);
        }
      }

      diffContainer.appendChild(span);
      lastWasRemoved = part.type === "removed";
    });

    return { diffCount };
  }

  function showPromptVersions(folderId, promptIndex, promptItem) {
    chrome.storage.local.get(folderId, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const prompt = data[folderId].prompts[promptIndex];
      if (!prompt || !prompt.versions) return;

      const modal = document.createElement("div");
      modal.className = "modal";

      const modalContent = document.createElement("div");
      modalContent.className = "modal-content";

      const modalHeader = document.createElement("div");
      modalHeader.className = "modal-header";

      const closeSpan = document.createElement("span");
      closeSpan.className = "close";
      closeSpan.innerHTML = "×";
      closeSpan.title = "Modal schließen";

      const headerTitle = document.createElement("h2");
      headerTitle.textContent = "Prompt-Versionsverlauf";
      headerTitle.title = "Zeigt alle gespeicherten Versionen dieses Prompts";

      const modalBody = document.createElement("div");
      modalBody.className = "modal-body";

      // Custom Diff Section (oben im Modal)
      const customDiffSection = document.createElement("div");
      customDiffSection.className = "custom-diff-section";
      customDiffSection.style.display = "none";

      const diffHeader = document.createElement("h3");
      diffHeader.className = "diff-header";
      diffHeader.textContent = "Versionsvergleich";
      diffHeader.title = "Vergleiche zwei Versionen, um Unterschiede zu sehen";
      customDiffSection.appendChild(diffHeader);

      const diffSelectWrapper = document.createElement("div");
      diffSelectWrapper.className = "diff-select-wrapper";

      const baseSelectLabel = document.createElement("label");
      baseSelectLabel.textContent = "Basis-Version:";
      baseSelectLabel.setAttribute("for", "baseSelect");
      diffSelectWrapper.appendChild(baseSelectLabel);

      const baseSelect = document.createElement("select");
      baseSelect.id = "baseSelect";
      baseSelect.className = "diff-select";
      const baseDefaultOption = document.createElement("option");
      baseDefaultOption.value = "";
      baseDefaultOption.textContent = "Wähle Basis-Version";
      baseDefaultOption.disabled = true;
      baseDefaultOption.selected = true;
      baseSelect.appendChild(baseDefaultOption);

      const compareSelectLabel = document.createElement("label");
      compareSelectLabel.textContent = "Vergleichen mit:";
      compareSelectLabel.setAttribute("for", "compareSelect");
      diffSelectWrapper.appendChild(compareSelectLabel);

      const compareSelect = document.createElement("select");
      compareSelect.id = "compareSelect";
      compareSelect.className = "diff-select";
      const compareDefaultOption = document.createElement("option");
      compareDefaultOption.value = "";
      compareDefaultOption.textContent = "Wähle Vergleichs-Version";
      compareDefaultOption.disabled = true;
      compareDefaultOption.selected = true;
      compareSelect.appendChild(compareDefaultOption);

      diffSelectWrapper.appendChild(baseSelect);
      diffSelectWrapper.appendChild(compareSelectLabel);
      diffSelectWrapper.appendChild(compareSelect);
      customDiffSection.appendChild(diffSelectWrapper);

      const customDiffContainer = document.createElement("div");
      customDiffContainer.className = "custom-diff-container";
      customDiffSection.appendChild(customDiffContainer);

      // Timeline (unverändert)
      const timeline = document.createElement("div");
      timeline.className = "version-timeline";

      const versions = prompt.versions
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp);

      versions.forEach((version, index) => {
        // Populate dropdowns
        const optionBase = document.createElement("option");
        optionBase.value = version.versionId;
        optionBase.textContent = `Version ${
          versions.length - index
        } - ${new Date(version.timestamp).toLocaleString()}`;
        baseSelect.appendChild(optionBase);

        const optionCompare = document.createElement("option");
        optionCompare.value = version.versionId;
        optionCompare.textContent = `Version ${
          versions.length - index
        } - ${new Date(version.timestamp).toLocaleString()}`;
        compareSelect.appendChild(optionCompare);

        // Create version item (unverändert)
        const versionItem = document.createElement("div");
        versionItem.className = "version-item";
        if (index === 0) {
          versionItem.classList.add("current-version");
        }

        const versionHeader = document.createElement("div");
        versionHeader.className = "version-header";

        const versionTitleWrapper = document.createElement("div");
        versionTitleWrapper.className = "version-title-wrapper";

        const versionTitle = document.createElement("h3");
        versionTitle.textContent = `Version ${versions.length - index}`;
        versionTitleWrapper.appendChild(versionTitle);

        if (index === 0) {
          const currentBadge = document.createElement("span");
          currentBadge.className = "current-badge";
          currentBadge.textContent = "Aktuell";
          currentBadge.title = "Dies ist die aktuelle Version des Prompts";
          versionTitleWrapper.appendChild(currentBadge);
        }

        const versionDate = document.createElement("span");
        versionDate.className = "version-date";
        versionDate.textContent = new Date(version.timestamp).toLocaleString();
        versionDate.title = "Erstellungs- oder Änderungsdatum";

        versionHeader.appendChild(versionTitleWrapper);
        versionHeader.appendChild(versionDate);

        const versionContent = document.createElement("div");
        versionContent.className = "version-content";

        // Show full content for oldest version
        if (index === versions.length - 1) {
          const titleLabel = document.createElement("label");
          titleLabel.textContent = "Titel:";
          const titleText = document.createElement("p");
          titleText.textContent = version.title || "Ohne Titel";
          titleText.title = version.title || "Kein Titel angegeben";
          versionContent.appendChild(titleLabel);
          versionContent.appendChild(titleText);

          const descLabel = document.createElement("label");
          descLabel.textContent = "Beschreibung:";
          const descText = document.createElement("p");
          descText.textContent = version.description || "Keine Beschreibung";
          descText.title =
            version.description || "Keine Beschreibung angegeben";
          versionContent.appendChild(descLabel);
          versionContent.appendChild(descText);

          const contentLabel = document.createElement("label");
          contentLabel.textContent = "Inhalt:";
          const contentText = document.createElement("p");
          contentText.textContent = version.content || "Kein Inhalt";
          contentText.title = version.content || "Kein Inhalt angegeben";
          versionContent.appendChild(contentLabel);
          versionContent.appendChild(contentText);
        } else {
          // Show diffs for all other versions compared to the previous version
          const prevVersion = versions[index + 1];
          const diffWrapper = document.createElement("div");
          diffWrapper.className = "version-diff-wrapper";

          const diffTitle = document.createElement("h4");
          diffTitle.textContent = `Änderungen von Version ${
            versions.length - (index + 1)
          } zu Version ${versions.length - index}`;
          diffWrapper.appendChild(diffTitle);

          // Title diff
          const titleDiffWrapper = document.createElement("div");
          titleDiffWrapper.className = "diff-wrapper";
          const titleHeader = document.createElement("label");
          titleHeader.textContent = "Titel Änderungen:";
          titleDiffWrapper.appendChild(titleHeader);
          const titleDiffContainer = document.createElement("div");
          titleDiffContainer.className = "diff-output";
          const { diffCount: titleDiffCount } = computePromptDiff(
            version.title || "",
            prevVersion.title || "",
            titleDiffContainer
          );
          const titleSummary = document.createElement("div");
          titleSummary.className = "diff-summary";
          titleSummary.textContent = `Unterschiede: ${titleDiffCount} Wörter`;
          titleDiffWrapper.appendChild(titleDiffContainer);
          titleDiffWrapper.appendChild(titleSummary);
          diffWrapper.appendChild(titleDiffWrapper);

          // Description diff
          const descDiffWrapper = document.createElement("div");
          descDiffWrapper.className = "diff-wrapper";
          const descHeader = document.createElement("label");
          descHeader.textContent = "Beschreibung Änderungen:";
          descDiffWrapper.appendChild(descHeader);
          const descDiffContainer = document.createElement("div");
          descDiffContainer.className = "diff-output";
          const { diffCount: descDiffCount } = computePromptDiff(
            version.description || "",
            prevVersion.description || "",
            descDiffContainer
          );
          const descSummary = document.createElement("div");
          descSummary.className = "diff-summary";
          descSummary.textContent = `Unterschiede: ${descDiffCount} Wörter`;
          descDiffWrapper.appendChild(descDiffContainer);
          descDiffWrapper.appendChild(descSummary);
          diffWrapper.appendChild(descDiffWrapper);

          // Content diff
          const contentDiffWrapper = document.createElement("div");
          contentDiffWrapper.className = "diff-wrapper";
          const contentHeader = document.createElement("label");
          contentHeader.textContent = "Inhalt Änderungen:";
          contentDiffWrapper.appendChild(contentHeader);
          const contentDiffContainer = document.createElement("div");
          contentDiffContainer.className = "diff-output";
          const { diffCount: contentDiffCount } = computePromptDiff(
            version.content || "",
            prevVersion.content || "",
            contentDiffContainer
          );
          const contentSummary = document.createElement("div");
          contentSummary.className = "diff-summary";
          contentSummary.textContent = `Unterschiede: ${contentDiffCount} Wörter`;
          contentDiffWrapper.appendChild(contentDiffContainer);
          contentDiffWrapper.appendChild(contentSummary); // KORREKTUR: contentWrapper → contentDiffWrapper
          diffWrapper.appendChild(contentDiffWrapper);

          versionContent.appendChild(diffWrapper);
        }

        const actions = document.createElement("div");
        actions.className = "version-actions";

        if (versions.length > 1) {
          const restoreButton = document.createElement("button");
          restoreButton.textContent = "Wiederherstellen";
          restoreButton.classList.add("action-btn");
          restoreButton.title =
            "Diese Version als aktuelle Version wiederherstellen";
          restoreButton.addEventListener("click", () => {
            restoreVersion(
              folderId,
              promptIndex,
              version.versionId,
              promptItem
            );
            modal.style.display = "none";
            document.body.removeChild(modal);
            document.head.removeChild(style);
          });
          actions.appendChild(restoreButton);

          const compareButton = document.createElement("button");
          compareButton.textContent = "Vergleichen";
          compareButton.classList.add("action-btn");
          compareButton.title = "Unterschiede zu anderen Versionen anzeigen";
          compareButton.addEventListener("click", () => {
            customDiffSection.style.display = "block";
            baseSelect.value = version.versionId;
            compareSelect.value = "";
            customDiffContainer.innerHTML = "";
            diffHeader.textContent = "Versionsvergleich";
            modalBody.scrollTop = 0;
          });
          actions.appendChild(compareButton);
        }

        versionContent.appendChild(actions);
        versionItem.appendChild(versionHeader);
        versionItem.appendChild(versionContent);
        timeline.appendChild(versionItem);
      });

      // Handle dropdown changes for custom comparisons
      function updateCustomDiffView() {
        const baseVersionId = baseSelect.value;
        const compareVersionId = compareSelect.value;

        if (
          !baseVersionId ||
          !compareVersionId ||
          baseVersionId === compareVersionId
        ) {
          customDiffContainer.innerHTML = "";
          diffHeader.textContent = "Versionsvergleich";
          return;
        }

        const baseVersion = versions.find((v) => v.versionId === baseVersionId);
        const compareVersion = versions.find(
          (v) => v.versionId === compareVersionId
        );
        if (!baseVersion || !compareVersion) return;

        // Calculate version numbers
        const baseVersionIndex = versions.findIndex(
          (v) => v.versionId === baseVersionId
        );
        const baseVersionNumber = versions.length - baseVersionIndex;
        const compareVersionIndex = versions.findIndex(
          (v) => v.versionId === compareVersionId
        );
        const compareVersionNumber = versions.length - compareVersionIndex;

        // Update diff header
        diffHeader.textContent = `Version ${baseVersionNumber} vs. Version ${compareVersionNumber}`;

        customDiffContainer.innerHTML = "";

        // Render diff for title
        const titleWrapper = document.createElement("div");
        titleWrapper.className = "diff-wrapper";
        const titleHeader = document.createElement("h4");
        titleHeader.textContent = "Titel Änderungen";
        titleWrapper.appendChild(titleHeader);
        const titleDiffContainer = document.createElement("div");
        titleDiffContainer.className = "diff-output";
        const { diffCount: titleDiffCount } = computePromptDiff(
          baseVersion.title || "",
          compareVersion.title || "",
          titleDiffContainer
        );
        const titleSummary = document.createElement("div");
        titleSummary.className = "diff-summary";
        titleSummary.textContent = `Unterschiede: ${titleDiffCount} Wörter`;
        titleWrapper.appendChild(titleDiffContainer);
        titleWrapper.appendChild(titleSummary);
        customDiffContainer.appendChild(titleWrapper);

        // Render diff for description
        const descWrapper = document.createElement("div");
        descWrapper.className = "diff-wrapper";
        const descHeader = document.createElement("h4");
        descHeader.textContent = "Beschreibung Änderungen";
        descWrapper.appendChild(descHeader);
        const descDiffContainer = document.createElement("div");
        descDiffContainer.className = "diff-output";
        const { diffCount: descDiffCount } = computePromptDiff(
          baseVersion.description || "",
          compareVersion.description || "",
          descDiffContainer
        );
        const descSummary = document.createElement("div");
        descSummary.className = "diff-summary";
        descSummary.textContent = `Unterschiede: ${descDiffCount} Wörter`;
        descWrapper.appendChild(descDiffContainer);
        descWrapper.appendChild(descSummary);
        customDiffContainer.appendChild(descWrapper);

        // Render diff for content
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "diff-wrapper";
        const contentHeader = document.createElement("h4");
        contentHeader.textContent = "Inhalt Änderungen";
        contentWrapper.appendChild(contentHeader);
        const contentDiffContainer = document.createElement("div");
        contentDiffContainer.className = "diff-output";
        const { diffCount: contentDiffCount } = computePromptDiff(
          baseVersion.content || "",
          compareVersion.content || "",
          contentDiffContainer
        );
        const contentSummary = document.createElement("div");
        contentSummary.className = "diff-summary";
        contentSummary.textContent = `Unterschiede: ${contentDiffCount} Wörter`;
        contentWrapper.appendChild(contentDiffContainer);
        contentWrapper.appendChild(contentSummary);
        customDiffContainer.appendChild(contentWrapper);
      }

      baseSelect.addEventListener("change", updateCustomDiffView);
      compareSelect.addEventListener("change", updateCustomDiffView);

      modalHeader.appendChild(closeSpan);
      modalHeader.appendChild(headerTitle);
      modalBody.appendChild(customDiffSection);
      modalBody.appendChild(timeline);

      // Export Dropdown
      const exportContainer = document.createElement("div");
      exportContainer.style.marginTop = "15px";
      exportContainer.style.display = "flex";
      exportContainer.style.alignItems = "center";
      exportContainer.style.gap = "8px";

      const exportLabel = document.createElement("label");
      exportLabel.textContent = "Export History:";
      exportLabel.style.fontWeight = "600";
      exportLabel.style.color = "#34495e";

      const exportSelect = document.createElement("select");
      exportSelect.className = "action-btn";
      exportSelect.style.padding = "8px";
      exportSelect.style.borderRadius = "4px";
      exportSelect.style.border = "1px solid #ddd";
      exportSelect.title = "Wähle ein Exportformat für den Versionsverlauf";

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select Export Format";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      exportSelect.appendChild(defaultOption);

      const exportOptions = [
        { value: "latex", text: "Export as PDF (LaTeX)" },
        { value: "json", text: "Export as JSON" },
        { value: "html", text: "Export as HTML" },
      ];

      exportOptions.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        exportSelect.appendChild(option);
      });

      exportSelect.addEventListener("change", () => {
        const format = exportSelect.value;
        if (format === "latex") {
          exportVersionHistory(prompt);
        } else if (format === "json") {
          exportVersionHistoryAsJson(prompt);
        } else if (format === "html") {
          exportVersionHistoryAsHtml(prompt);
        }
        exportSelect.value = ""; // Reset dropdown
      });

      exportContainer.appendChild(exportLabel);
      exportContainer.appendChild(exportSelect);
      modalBody.appendChild(exportContainer);

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
        max-height: 70vh;
        overflow-y: auto;
      }

      .version-timeline {
        position: relative;
        padding-left: 30px;
      }

      .version-item {
        position: relative;
        margin-bottom: 20px;
        padding: 16px;
        padding-left: 20px;
        border-left: 2px solid #1e90ff;
        background: #f8f9fa;
        border-radius: 4px;
        transition: background 0.2s ease;
      }

      .version-item.current-version {
        background: #e6f3ff;
        border-left-color: #28a745;
      }

      .version-item.current-version::before {
        background: #28a745;
      }

      .version-item::before {
        content: '';
        position: absolute;
        left: -9px;
        top: 16px;
        width: 16px;
        height: 16px;
        background: #1e90ff;
        border-radius: 50%;
        border: 2px solid #fff;
      }

      .version-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .version-title-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .version-header h3 {
        margin: 0;
        font-size: 1.2em;
        color: #1e90ff;
      }

      .current-badge {
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: 600;
      }

      .version-date {
        font-size: 0.9em;
        color: #666;
      }

      .version-content label {
        font-weight: 600;
        margin-top: 12px;
        margin-bottom: 6px;
        display: block;
        color: #34495e;
      }

      .version-content p {
        margin: 0 0 12px;
        padding: 8px;
        background: #fff;
        border-radius: 4px;
        word-break: break-word;
        font-size: 0.95em;
      }

      .version-actions {
        display: flex;
        gap: 12px;
        margin-top: 12px;
      }

      .action-btn {
        padding: 8px 16px;
        background: #1e90ff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9em;
        font-weight: 600;
        transition: background 0.2s ease;
      }

      .action-btn:hover {
        background: #4169e1;
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

      .custom-diff-section {
        margin-bottom: 24px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .diff-header {
        margin: 0 0 12px;
        color: #1e90ff;
        font-size: 1.3em;
        font-weight: 600;
        border-bottom: 2px solid #1e90ff;
        padding-bottom: 8px;
      }

      .diff-select-wrapper {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 12px;
        align-items: center;
      }

      .diff-select-wrapper label {
        font-weight: 600;
        margin-bottom: 8px;
        display: block;
        color: #34495e;
        flex: 0 0 120px;
      }

      .diff-select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fff;
        color: #2c3e50;
        font-size: 0.95em;
        flex: 1;
        min-width: 0;
      }

      .custom-diff-container {
        max-height: 300px;
        overflow-y: auto;
        padding: 12px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .diff-wrapper {
        margin-bottom: 16px;
      }

      .diff-wrapper h4,
      .version-diff-wrapper h4 {
        margin: 0 0 8px;
        color: #34495e;
        font-size: 1.1em;
      }

      .diff-output {
        min-height: 50px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 13px;
        white-space: pre-wrap;
        line-height: 1.5;
      }

      .diff-summary {
        margin-top: 12px;
        font-weight: 600;
        color: #1e90ff;
        font-size: 0.9em;
      }

      .version-diff-wrapper {
        margin-top: 12px;
        padding: 12px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .diff-word.common {
        color: #2c3e50;
      }

      .diff-word.added {
        background: #e6ffed;
        color: #28a745;
      }

      .diff-word.removed {
        background: #ffe6e6;
        color: #dc3545;
      }

      .arrow {
        color: #1e90ff;
        font-weight: bold;
      }

      /* Responsive Design */
      @media (max-width: 500px) {
        .modal-content {
          width: 95%;
          margin: 10% auto;
        }
        .modal-body {
          padding: 16px;
        }
        .version-item {
          padding: 12px;
        }
        .version-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
        .version-actions {
          flex-direction: column;
          gap: 8px;
        }
        .action-btn {
          width: 100%;
          text-align: center;
        }
          .action-btn select {
  background: #1e90ff;
  color: white;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}
.action-btn select:hover {
  background: #4169e1;
}
.action-btn select option {
  background: #fff;
  color: #2c3e50;
}
        .diff-select-wrapper {
          flex-direction: column;
        }
        .diff-select-wrapper label,
        .diff-select {
          flex: 1 1 100%;
        }
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
    });
  }

  function restoreVersion(folderId, promptIndex, versionId, promptItem) {
    chrome.storage.local.get(folderId, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const prompt = data[folderId].prompts[promptIndex];
      if (!prompt || !prompt.versions) return;

      const version = prompt.versions.find((v) => v.versionId === versionId);
      if (!version) return;

      // Check if the restored version differs from the current state
      const isDifferent =
        prompt.title !== version.title ||
        (prompt.description || "") !== (version.description || "") ||
        prompt.content !== version.content;

      if (isDifferent) {
        // Save current state as a new version only if there's a difference
        prompt.versions.push({
          versionId: generateUUID(),
          title: prompt.title,
          description: prompt.description || "",
          content: prompt.content,
          timestamp: Date.now(),
        });
      }

      // Update prompt to selected version
      prompt.title = version.title;
      prompt.description = version.description || "";
      prompt.content = version.content;

      // Enforce version limit
      if (prompt.versions.length > 50) {
        prompt.versions.shift();
      }

      chrome.storage.local.set({ [folderId]: data[folderId] }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error restoring version:", chrome.runtime.lastError);
          alert("Fehler beim Wiederherstellen der Version.");
        } else {
          console.log(
            `Version ${versionId} restored for prompt in ${folderId}`
          );
          promptItem.querySelector(".prompt-text").textContent = version.title;
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

  // Inject CSS styles dynamically
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .search-results-container {
            margin-top: 20px;
        }
        .results-section {
            margin-bottom: 30px;
        }
        .results-section h3 {
            font-size: 1.3em;
            color: #1e90ff;
            margin-bottom: 15px;
            border-bottom: 2px solid #1e90ff;
            padding-bottom: 8px;
        }
        .results-list {
            list-style: none;
            padding: 0;
        }
        .result-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        .result-item:hover {
            background: #e6f3ff;
        }
        .folder-item {
            font-weight: 600;
        }
        .prompt-item .result-content {
            flex-grow: 1;
        }
        .result-type {
            font-weight: 600;
            color: #34495e;
            margin-right: 8px;
        }
        .result-name {
            font-size: 1em;
            color: #2c3e50;
        }
        .result-folder {
            font-size: 0.9em;
            color: #666;
            margin-left: 8px;
        }
        .result-meta {
            font-size: 0.9em;
            color: #666;
            margin-left: 8px;
        }
        .result-preview {
            font-size: 0.85em;
            color: #555;
            margin-top: 8px;
            padding-left: 20px;
            line-height: 1.4;
        }
        .match-field {
            font-weight: 600;
            color: #1e90ff;
            margin-right: 8px;
        }
        .highlight {
            background: #fff3cd;
            padding: 0 2px;
            border-radius: 2px;
        }
        .no-results {
            color: #666;
            font-style: italic;
            padding: 16px;
        }
            .modal-body .checkbox-container {
  display: flex;
  align-items: center;
  padding: 8px 0;
}
.modal-body input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.modal-body input[type="checkbox"] + label {
  cursor: pointer;
  color: #34495e;
  font-size: 0.95em;
}
        .prompt-actions {
            display: flex;
            align-items: center;
        }
        .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1em;
            padding: 4px 8px;
            color: #666;
        }
        .menu-btn {
            font-weight: bold;
        }
        .dropdown-menu {
            display: none;
            position: absolute;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 150px;
            right: 0;
        }
        .dropdown-item {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 0.9em;
            color: #333;
        }
        .dropdown-item:hover {
            background: #f0f0f0;
        }
        .loading {
            color: #666;
            font-style: italic;
            padding: 16px;
            text-align: center;
        }
        @media (max-width: 500px) {
            .result-item {
                flex-direction: column;
                align-items: flex-start;
            }
            .prompt-actions {
                margin-top: 8px;
                align-self: flex-end;
            }
            .result-preview {
                padding-left: 10px;
            }
            .dropdown-menu {
                right: auto;
                left: 0;
            }
        }
    `;
    document.head.appendChild(style);
  }

  // Call injectStyles when the script loads
  injectStyles();

  // Simple fuzzy matching function
  function fuzzyMatch(text, query) {
    if (!text || !query) return 0;
    text = text.toLowerCase();
    query = query.toLowerCase();
    let score = 0;
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        score += 1;
        queryIndex++;
      } else {
        score -= 0.1; // Small penalty for non-matching characters
      }
    }
    return queryIndex === query.length ? score : -1;
  }

  function searchFoldersAndPrompts(query) {
    searchResults.innerHTML = '<p class="loading">Loading...</p>';
    searchResults.classList.remove("hidden");
    folderListSection.classList.add("hidden");
    promptListSection.classList.add("hidden");

    document.getElementById("mainHeaderTitle").textContent = "Search Results";
    document
      .getElementById("mainHeaderTitle")
      .setAttribute("aria-live", "polite");

    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        searchResults.innerHTML =
          '<p class="no-results">Error loading data</p>';
        return;
      }

      const results = [];
      const lowercaseQuery = query.toLowerCase().trim();
      const queryWords = lowercaseQuery
        .split(/\s+/)
        .filter((word) => word.length > 0);

      // Helper function to highlight matches
      function highlightMatch(text, queryWords) {
        if (!text) return "";
        let highlighted = text;
        queryWords.forEach((word) => {
          const regex = new RegExp(`(${word})`, "gi");
          highlighted = highlighted.replace(
            regex,
            '<span class="highlight">$1</span>'
          );
        });
        return highlighted;
      }

      // Helper function to get a preview snippet
      function getPreview(text, queryWords, maxLength = 100) {
        if (!text) return "";
        const lowercaseText = text.toLowerCase();
        let startIndex = 0;
        for (const word of queryWords) {
          const index = lowercaseText.indexOf(word);
          if (index !== -1) {
            startIndex = Math.max(0, index - 20);
            break;
          }
        }
        const snippet = text.slice(startIndex, startIndex + maxLength);
        return snippet.length < text.length ? `${snippet}...` : snippet;
      }

      Object.entries(data).forEach(([id, topic]) => {
        // Validate topic and topic.name
        if (
          !topic ||
          typeof topic !== "object" ||
          !topic.name ||
          typeof topic.name !== "string"
        ) {
          console.warn(`Invalid topic data for ID ${id}:`, topic);
          return;
        }

        // Search in folder name
        const folderScore = fuzzyMatch(topic.name, lowercaseQuery);
        if (folderScore > 0 && !topic.isTrash) {
          results.push({
            type: "folder",
            name: topic.name,
            id: id,
            prompts: topic.prompts || [],
            match: "name",
            matchedText: highlightMatch(topic.name, queryWords),
            score: folderScore,
          });
        }

        // Search in prompts
        const prompts = Array.isArray(topic.prompts) ? topic.prompts : [];
        prompts.forEach((prompt, index) => {
          if (!prompt) {
            console.warn(`Invalid prompt at index ${index} in topic ${id}`);
            return;
          }

          if (typeof prompt === "string") {
            const promptScore = fuzzyMatch(prompt, lowercaseQuery);
            if (promptScore > 0 && !topic.isTrash) {
              results.push({
                type: "prompt",
                prompt,
                folder: topic.name,
                folderId: id,
                promptIndex: index,
                isHidden: topic.isHidden || false,
                match: "content",
                matchedText: highlightMatch(
                  getPreview(prompt, queryWords),
                  queryWords
                ),
                score: promptScore,
              });
            }
          } else {
            const fields = [
              { key: "title", value: prompt.title || "" },
              { key: "description", value: prompt.description || "" },
              { key: "content", value: prompt.content || "" },
            ];

            fields.forEach((field) => {
              const fieldScore = fuzzyMatch(field.value, lowercaseQuery);
              if (fieldScore > 0 && !topic.isTrash) {
                results.push({
                  type: "prompt",
                  prompt,
                  folder: topic.name,
                  folderId: id,
                  promptIndex: index,
                  isHidden: topic.isHidden || false,
                  match: field.key,
                  matchedText: highlightMatch(
                    getPreview(field.value, queryWords),
                    queryWords
                  ),
                  score: fieldScore,
                });
              }
            });
          }
        });
      });

      if (results.length === 0) {
        searchResults.innerHTML = '<p class="no-results">No results found</p>';
        return;
      }

      // Sort results by score (higher score = better match)
      results.sort((a, b) => b.score - a.score);

      // Group results by type
      const folderResults = results.filter((r) => r.type === "folder");
      const promptResults = results.filter((r) => r.type === "prompt");

      // Create results container
      const resultsContainer = document.createElement("div");
      resultsContainer.classList.add("search-results-container");
      resultsContainer.setAttribute("aria-label", "Search results");

      // Folder results section
      if (folderResults.length > 0) {
        const folderSection = document.createElement("div");
        folderSection.classList.add("results-section");
        const folderTitle = document.createElement("h3");
        folderTitle.textContent = `Folders (${folderResults.length})`;
        folderSection.appendChild(folderTitle);

        const folderList = document.createElement("ul");
        folderList.classList.add("results-list");
        folderResults.forEach((result) => {
          const folderItem = document.createElement("li");
          folderItem.classList.add("result-item", "folder-item");
          folderItem.setAttribute("role", "button");
          folderItem.setAttribute("aria-label", `Open folder ${result.name}`);
          folderItem.innerHTML = `
                    <div class="result-content">
                        <span class="result-type">Folder:</span>
                        <span class="result-name">${result.matchedText}</span>
                        <span class="result-meta">(${result.prompts.length} prompts)</span>
                    </div>
                `;
          folderItem.addEventListener("click", () =>
            showFolderContent(result.id)
          );
          folderList.appendChild(folderItem);
        });
        folderSection.appendChild(folderList);
        resultsContainer.appendChild(folderSection);
      }

      // Prompt results section
      if (promptResults.length > 0) {
        const promptSection = document.createElement("div");
        promptSection.classList.add("results-section");
        const promptTitle = document.createElement("h3");
        promptTitle.textContent = `Prompts (${promptResults.length})`;
        promptSection.appendChild(promptTitle);

        const promptList = document.createElement("ul");
        promptList.classList.add("results-list");
        promptResults.forEach((result) => {
          const promptItem = document.createElement("li");
          promptItem.classList.add("result-item", "prompt-item");
          promptItem.setAttribute("role", "button");
          promptItem.setAttribute(
            "aria-label",
            `View prompt ${result.prompt.title || "Untitled"}`
          );
          const promptText =
            typeof result.prompt === "string"
              ? result.prompt
              : result.prompt.title || "Untitled";
          const folderInfo = result.isHidden
            ? ""
            : `<span class="result-folder">in ${result.folder}</span>`;
          promptItem.innerHTML = `
          <div class="result-content">
              <span class="result-type">Prompt:</span>
              <span class="result-name">${highlightMatch(
                promptText,
                queryWords
              )}</span>
              ${folderInfo}
              <div class="result-preview">
                  <span class="match-field">${
                    result.match.charAt(0).toUpperCase() +
                    result.match.slice(1)
                  }:</span>
                  ${result.matchedText}
              </div>
              <div class="result-meta">
                  Compatible AI Models: ${
                    result.prompt.aiModels && result.prompt.aiModels.length > 0
                      ? result.prompt.aiModels.join(", ")
                      : "None"
                  }
              </div>
              <div class="result-meta">
                  Incompatible AI Models: ${
                    result.prompt.incompatibleAIModels &&
                    result.prompt.incompatibleAIModels.length > 0
                      ? result.prompt.incompatibleAIModels.join(", ")
                      : "None"
                  }
              </div>
          </div>
      `;

          // Add actions for prompts
          const actions = document.createElement("div");
          actions.classList.add("prompt-actions");

          const menuBtn = document.createElement("button");
          menuBtn.textContent = "...";
          menuBtn.classList.add("action-btn", "menu-btn");
          menuBtn.setAttribute("aria-label", "Prompt actions");
          const dropdown = document.createElement("div");
          dropdown.classList.add("dropdown-menu");

          const menuItems = [
            {
              text: "Copy Prompt",
              action: () =>
                copyPrompt(result.prompt, result.folderId, result.promptIndex),
            },
            {
              text: "Move to Folder",
              action: () =>
                movePromptToFolder(
                  result.folderId,
                  result.promptIndex,
                  promptItem
                ),
            },
            {
              text: "Edit",
              action: () =>
                editPrompt(result.folderId, result.promptIndex, promptItem),
            },
            { text: "Share", action: () => sharePrompt(result.prompt) },
            {
              text: result.prompt.isFavorite
                ? "Remove from Favorites"
                : "Add to Favorites",
              action: () =>
                toggleFavoritePrompt(
                  result.folderId,
                  result.promptIndex,
                  promptItem,
                  result.prompt
                ),
            },
            {
              text: "Show Versions",
              action: () =>
                showPromptVersions(
                  result.folderId,
                  result.promptIndex,
                  promptItem
                ),
            },
            {
              text: "Move to Trash",
              action: () =>
                deletePrompt(result.folderId, result.promptIndex, promptItem),
            },
          ];

          chrome.storage.local.get(result.folderId, (data) => {
            const topic = data[result.folderId];
            if (topic && !topic.isHidden && !topic.isTrash) {
              menuItems.splice(5, 0, {
                text: "Remove from Folder",
                action: () =>
                  removeFromFolder(
                    result.folderId,
                    result.promptIndex,
                    promptItem
                  ),
              });
            }

            menuItems.forEach((item) => {
              const menuItem = document.createElement("div");
              menuItem.classList.add("dropdown-item");
              menuItem.textContent = item.text;
              menuItem.setAttribute("role", "menuitem");
              menuItem.setAttribute("aria-label", item.text);
              menuItem.addEventListener("click", item.action);
              dropdown.appendChild(menuItem);
            });
          });

          menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isVisible = dropdown.style.display === "block";
            document.querySelectorAll(".dropdown-menu").forEach((menu) => {
              menu.style.display = "none";
            });
            dropdown.style.display = isVisible ? "none" : "block";
          });

          actions.appendChild(menuBtn);
          actions.appendChild(dropdown);
          promptItem.appendChild(actions);

          promptItem.addEventListener("click", (e) => {
            if (!actions.contains(e.target)) {
              showPromptDetails(
                result.prompt,
                result.folderId,
                result.promptIndex
              );
            }
          });

          promptList.appendChild(promptItem);
        });
        promptSection.appendChild(promptList);
        resultsContainer.appendChild(promptSection);
      }

      // Append total results count
      const resultsTitle = document.createElement("h2");
      resultsTitle.textContent = `Search Results (${results.length})`;
      searchResults.innerHTML = "";
      searchResults.appendChild(resultsTitle);
      searchResults.appendChild(resultsContainer);

      // Close dropdowns on outside click
      document.addEventListener(
        "click",
        (e) => {
          document.querySelectorAll(".prompt-actions").forEach((actions) => {
            const dropdown = actions.querySelector(".dropdown-menu");
            if (dropdown && !actions.contains(e.target)) {
              dropdown.style.display = "none";
            }
          });
        },
        { once: true }
      );
    });
  }

  // Debounced search input handler
  let debounceTimeout;
  searchInput.addEventListener("input", function () {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const query = searchInput.value.trim();
      if (query) {
        clearSearch.style.display = "block";
        searchFoldersAndPrompts(query);
      } else {
        clearSearch.style.display = "none";
        searchResults.classList.add("hidden");
        folderListSection.classList.remove("hidden");
        loadFolders(); // Assumed to exist
      }
    }, 300);
  });

  favoritesLink.addEventListener("click", (e) => {
    e.preventDefault();
    [
      favoritesLink,
      allPromptsLink,
      singlePromptsLink,
      categorisedPromptsLink,
      trashLink,
    ].forEach((link) => link.classList.remove("active"));
    favoritesLink.classList.add("active");
    showFavoritePrompts();
  });

  allPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    [
      favoritesLink,
      allPromptsLink,
      singlePromptsLink,
      categorisedPromptsLink,
      trashLink,
    ].forEach((link) => link.classList.remove("active"));
    allPromptsLink.classList.add("active");
    showAllPrompts();
  });

  singlePromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    [
      favoritesLink,
      allPromptsLink,
      singlePromptsLink,
      categorisedPromptsLink,
      trashLink,
    ].forEach((link) => link.classList.remove("active"));
    singlePromptsLink.classList.add("active");
    showSinglePrompts();
  });

  categorisedPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    [
      favoritesLink,
      allPromptsLink,
      singlePromptsLink,
      categorisedPromptsLink,
      trashLink,
    ].forEach((link) => link.classList.remove("active"));
    categorisedPromptsLink.classList.add("active");
    showCategorisedPrompts();
  });

  trashLink.addEventListener("click", (e) => {
    e.preventDefault();
    [
      favoritesLink,
      allPromptsLink,
      singlePromptsLink,
      categorisedPromptsLink,
      trashLink,
    ].forEach((link) => link.classList.remove("active"));
    trashLink.classList.add("active");
    showTrashedPrompts();
  });

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim();
    if (query) {
      clearSearch.style.display = "block";
      searchFoldersAndPrompts(query);
    } else {
      clearSearch.style.display = "none";
      searchResults.classList.add("hidden");
      folderListSection.classList.remove("hidden");
      loadFolders();
    }
  });

  clearSearch.addEventListener("click", function () {
    searchInput.value = "";
    clearSearch.style.display = "none";
    searchResults.classList.add("hidden");
    folderListSection.classList.remove("hidden");
    loadFolders();
  });

  showAllPrompts();
  loadFolderNavigation();
  [
    allPromptsLink,
    singlePromptsLink,
    categorisedPromptsLink,
    trashLink,
  ].forEach((link) => link.classList.remove("active"));
  allPromptsLink.classList.add("active");

  function updateStorageInfo() {
    const totalBytes = 10 * 1024 * 1024; // 10 MB
    chrome.storage.local.getBytesInUse(null, function (bytesInUse) {
      const remainingBytes = totalBytes - bytesInUse;
      const usedPercentage = (bytesInUse / totalBytes) * 100;

      // Update progress bar and percentage
      document.getElementById("usedBar").style.width = usedPercentage + "%";
      document.getElementById("percentageText").textContent =
        usedPercentage.toFixed(1) + "%";

      // Convert and display only MB values
      document.getElementById("usedMB").textContent = (
        bytesInUse /
        (1024 * 1024)
      ).toFixed(2);
      document.getElementById("remainingMB").textContent = (
        remainingBytes /
        (1024 * 1024)
      ).toFixed(2);
      document.getElementById("totalMB").textContent = (
        totalBytes /
        (1024 * 1024)
      ).toFixed(2);
    });
  }

  // Initiale Aktualisierung
  updateStorageInfo();
  // Optional: Regelmäßige Aktualisierung alle 5 Sekunden
  setInterval(updateStorageInfo, 5000);
});
