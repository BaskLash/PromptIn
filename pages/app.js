document.addEventListener("DOMContentLoaded", function () {
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

      chrome.storage.sync.set({ [folderId]: newFolder }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error creating new folder:", chrome.runtime.lastError);
          alert("Fehler beim Erstellen des neuen Ordners.");
        } else {
          console.log(`New folder created with ID: ${folderId}`);
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

    nameInput.focus();
  }

  function addNewPrompt(currentFolderId = null) {
    chrome.storage.sync.get(null, function (data) {
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

        const newPrompt = { title, content, isFavorite };
        if (description) newPrompt.description = description;

        if (folderId) {
          data[folderId].prompts.push(newPrompt);
          chrome.storage.sync.set({ [folderId]: data[folderId] }, function () {
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
          chrome.storage.sync.set({ [newFolderId]: newFolder }, function () {
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
    chrome.storage.sync.get(null, function (data) {
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
    chrome.storage.sync.get(folderId, function (data) {
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
    chrome.storage.sync.get(null, function (data) {
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

    const promptText = document.createElement("span");
    promptText.classList.add("prompt-text");

    chrome.storage.sync.get(folderId, (data) => {
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

    promptItem.appendChild(promptText);

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
        { text: "Copy Prompt", action: () => copyPrompt(prompt) },
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
          text: "Move to Trash",
          action: () => deletePrompt(folderId, index, promptItem),
        }
      );

      chrome.storage.sync.get(folderId, (data) => {
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
            loadFolderNavigation();
            showTrashedPrompts();
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

  function copyPrompt(prompt) {
    const text = typeof prompt === "string" ? prompt : prompt.content;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Prompt copied to clipboard!");
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
  }

  function removeFromFolder(currentFolderId, promptIndex, promptItem) {
    if (
      confirm("Are you sure you want to remove this prompt from its folder?")
    ) {
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
    chrome.storage.sync.get(null, function (data) {
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
    chrome.storage.sync.get(null, function (data) {
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
    chrome.storage.sync.get("trash_folder", function (data) {
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
    chrome.storage.sync.get(null, function (data) {
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
    chrome.storage.sync.get(null, function (data) {
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
        chrome.storage.sync.get(folderId, function (data) {
          if (data[folderId]) {
            data[folderId].name = newName;
            chrome.storage.sync.set(data, function () {
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
      chrome.storage.sync.remove(folderId, function () {
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
    chrome.storage.sync.get(folderId, function (data) {
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

        if (typeof prompt === "string") {
          data[folderId].prompts[promptIndex] = {
            title: newTitle,
            description: newDesc,
            content: newContent,
            isFavorite,
          };
        } else {
          data[folderId].prompts[promptIndex].title = newTitle;
          data[folderId].prompts[promptIndex].description = newDesc;
          data[folderId].prompts[promptIndex].content = newContent;
          data[folderId].prompts[promptIndex].isFavorite = isFavorite;
        }

        if (data[folderId].prompts.length === 1 && data[folderId].isHidden) {
          data[folderId].name = newTitle.slice(0, 50);
        }

        chrome.storage.sync.set(data, function () {
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

  function searchFoldersAndPrompts(query) {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      searchResults.innerHTML = "";
      searchResults.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      promptListSection.classList.add("hidden");

      document.getElementById("mainHeaderTitle").textContent = "Search Results";
      const results = [];
      const lowercaseQuery = query.toLowerCase();

      Object.entries(data).forEach(([id, topic]) => {
        if (
          topic.name.toLowerCase().includes(lowercaseQuery) &&
          !topic.isTrash
        ) {
          results.push({
            type: "folder",
            name: topic.name,
            id: id,
            prompts: topic.prompts,
          });
        }
        topic.prompts.forEach((prompt, index) => {
          const searchText =
            typeof prompt === "string"
              ? prompt
              : `${prompt.title || ""} ${prompt.content || ""} ${
                  prompt.description || ""
                }`;
          if (
            searchText.toLowerCase().includes(lowercaseQuery) &&
            !topic.isTrash
          ) {
            results.push({
              type: "prompt",
              prompt,
              folder: topic.name,
              folderId: id,
              promptIndex: index,
              isHidden: topic.isHidden || false,
            });
          }
        });
      });

      if (results.length === 0) {
        searchResults.innerHTML = '<p class="no-results">No results found</p>';
        return;
      }

      const resultsTitle = document.createElement("h2");
      resultsTitle.textContent = `Search Results (${results.length})`;
      searchResults.appendChild(resultsTitle);

      const resultsList = document.createElement("ul");
      results.forEach((result) => {
        const resultItem = document.createElement("li");
        if (result.type === "folder") {
          resultItem.textContent = `Folder: ${result.name} (${result.prompts.length} prompts)`;
        } else {
          const promptText =
            typeof result.prompt === "string"
              ? result.prompt
              : result.prompt.title;
          resultItem.innerHTML = result.isHidden
            ? `Prompt: "${promptText}"`
            : `Prompt: "${promptText}" <span>(in ${result.folder})</span>`;

          const actions = document.createElement("span");
          actions.classList.add("prompt-actions");

          const menuBtn = document.createElement("button");
          menuBtn.textContent = "...";
          menuBtn.classList.add("action-btn", "menu-btn");
          const dropdown = document.createElement("div");
          dropdown.classList.add("dropdown-menu");

          const menuItems = [
            { text: "Copy Prompt", action: () => copyPrompt(result.prompt) },
            {
              text: "Move to Folder",
              action: () =>
                movePromptToFolder(
                  result.folderId,
                  result.promptIndex,
                  resultItem
                ),
            },
            {
              text: "Edit",
              action: () =>
                editPrompt(result.folderId, result.promptIndex, resultItem),
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
                  resultItem,
                  result.prompt
                ),
            },
            {
              text: "Move to Trash",
              action: () =>
                deletePrompt(result.folderId, result.promptIndex, resultItem),
            },
          ];

          chrome.storage.sync.get(result.folderId, (data) => {
            const topic = data[result.folderId];
            if (topic && !topic.isHidden && !topic.isTrash) {
              menuItems.splice(5, 0, {
                text: "Remove from Folder",
                action: () =>
                  removeFromFolder(
                    result.folderId,
                    result.promptIndex,
                    resultItem
                  ),
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
          resultItem.appendChild(actions);

          document.addEventListener("click", (e) => {
            if (!actions.contains(e.target)) {
              dropdown.style.display = "none";
            }
          });
        }
        resultsList.appendChild(resultItem);
      });
      searchResults.appendChild(resultsList);
    });
  }

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
});
