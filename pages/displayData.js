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
              unusedPromptsLink,
              workflowsLink,
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

    // Add note for unused prompts view
    const unusedNote = document.createElement("span");
    unusedNote.classList.add("prompt-unused-note");
    if (mainHeaderTitle.textContent === "Unused Prompts") {
      unusedNote.style.color = "#dc3545";
      unusedNote.style.fontSize = "0.85em";
      unusedNote.textContent = prompt.lastUsed
        ? "Not used in the last 30 days"
        : "Never used (usage count: 0)";
    }

    promptContent.appendChild(promptText);
    promptContent.appendChild(lastUsedText);
    if (unusedNote.textContent) {
      promptContent.appendChild(unusedNote);
    }

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