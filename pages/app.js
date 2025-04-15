document.addEventListener("DOMContentLoaded", function () {
  const folderList = document.getElementById("foldersContainer");
  const folderTitle = document.getElementById("folderTitle");
  const searchResults = document.getElementById("searchResults");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const folderNavList = document.getElementById("folderNavList");
  const promptListSection = document.getElementById("promptList");
  const folderListSection = document.getElementById("folderList");
  const promptListTitle = document.getElementById("promptListTitle");
  const promptsContainer = document.getElementById("promptsContainer");
  const allPromptsLink = document.getElementById("allPromptsLink");
  const singlePromptsLink = document.getElementById("singlePromptsLink");
  const categorisedPromptsLink = document.getElementById(
    "categorisedPromptsLink"
  );

  if (searchInput.value === "") {
    clearSearch.style.display = "none";
  } else {
    clearSearch.style.display = "block";
  }

  // Funktion zum Laden und Anzeigen der Ordner in der Seitenleiste
  function loadFolderNavigation() {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      folderNavList.innerHTML = "";
      if (!data || Object.keys(data).length === 0) {
        const noFolders = document.createElement("a");
        noFolders.textContent = "No folders available";
        noFolders.style.color = "#888";
        noFolders.style.pointerEvents = "none";
        folderNavList.appendChild(noFolders);
      } else {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && Array.isArray(topic.prompts)) {
            const folderLink = document.createElement("a");
            folderLink.href = `#folder-${id}`;
            folderLink.textContent = `${topic.name} (${topic.prompts.length})`;
            folderLink.dataset.folderId = id;
            folderLink.addEventListener("click", (e) => {
              e.preventDefault();
              showFolderContent(id);
            });
            folderNavList.appendChild(folderLink);
          }
        });
      }

      const collapsibleContent = folderNavList.closest(".collapsible-content");
      if (collapsibleContent.classList.contains("active")) {
        collapsibleContent.style.maxHeight =
          collapsibleContent.scrollHeight + "px";
      }
    });
  }

  // Funktion zum Anzeigen eines einzelnen Ordners
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

      folderTitle.textContent = `${topic.name} (${topic.prompts.length})`;
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
        renameFolder(folderId, folderTitle, topic.name)
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
    });
  }

  // Funktion zum Laden und Anzeigen aller Ordner
  function loadFolders() {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      folderList.innerHTML = "";
      if (!data || Object.keys(data).length === 0) {
        folderList.innerHTML = '<p class="no-results">No folders available</p>';
        folderTitle.textContent = "Folders";
        return;
      }

      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts)) {
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
      folderTitle.textContent = "Folders";
    });
  }

  // Funktion zum Erstellen eines Prompt-Elements
  function createPromptItem(prompt, folderId, index, totalPrompts) {
    const promptItem = document.createElement("li");
    promptItem.classList.add("prompt-item");

    const promptText = document.createElement("span");
    promptText.classList.add("prompt-text");
    // Fallback: Wenn prompt ein String ist, Titel ableiten; sonst prompt.title verwenden
    promptText.textContent =
      typeof prompt === "string" ? prompt.slice(0, 50) : prompt.title;
    promptItem.appendChild(promptText);

    const promptActions = document.createElement("div");
    promptActions.classList.add("prompt-actions");

    const isSinglePrompt = totalPrompts === 1;
    if (!isSinglePrompt) {
      const moveBtn = document.createElement("button");
      moveBtn.textContent = "Move";
      moveBtn.classList.add("action-btn", "reorder-btn");
      moveBtn.addEventListener("click", () =>
        movePromptToFolder(folderId, index, promptItem)
      );
      promptActions.appendChild(moveBtn);
    }

    // Details-Button für Modal
    const detailsBtn = document.createElement("button");
    detailsBtn.textContent = "Details";
    detailsBtn.classList.add("action-btn");
    detailsBtn.addEventListener("click", () =>
      showPromptDetails(prompt, folderId, index)
    );
    promptActions.appendChild(detailsBtn);

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("action-btn");
    editBtn.addEventListener("click", () =>
      editPrompt(folderId, index, promptText)
    );
    promptActions.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("action-btn");
    deleteBtn.addEventListener("click", () =>
      deletePrompt(folderId, index, promptItem)
    );
    promptActions.appendChild(deleteBtn);

    promptItem.appendChild(promptActions);
    return promptItem;
  }

  // Funktion zum Anzeigen der Prompt-Details in einem Modal
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

    // Zusammenbau des Modals
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

    // Modal-Stile
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

    // Modal schließen
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

  // Funktion zum Verschieben einer Prompt
  function movePromptToFolder(currentFolderId, promptIndex, promptItem) {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const folders = Object.entries(data).filter(
        ([id, topic]) => id !== currentFolderId && topic.prompts
      );

      if (folders.length === 0) {
        alert("No other folders available to move this prompt to.");
        return;
      }

      const select = document.createElement("select");
      select.classList.add("reorder-select");

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a folder";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      select.appendChild(defaultOption);

      folders.forEach(([id, topic]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = topic.name;
        select.appendChild(option);
      });

      const moveBtn = promptItem.querySelector(".reorder-btn");
      moveBtn.replaceWith(select);

      select.addEventListener("change", function () {
        const targetFolderId = select.value;
        if (!targetFolderId) return;

        const prompt = data[currentFolderId].prompts[promptIndex];
        data[currentFolderId].prompts.splice(promptIndex, 1);
        data[targetFolderId].prompts.push(prompt);

        const updates = {};
        if (data[currentFolderId].prompts.length === 0) {
          chrome.storage.sync.remove(currentFolderId, function () {
            if (chrome.runtime.lastError) {
              console.error("Error removing folder:", chrome.runtime.lastError);
            }
          });
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
            if (promptListTitle.textContent === "Categorised Prompts")
              showCategorisedPrompts();
            else if (promptListTitle.textContent === "All Prompts")
              showAllPrompts();
          }
        });
      });

      select.focus();
    });
  }

  // Funktion zum Anzeigen aller Prompts
  function showAllPrompts() {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      promptListTitle.textContent = "All Prompts";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      let allPrompts = [];
      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts) {
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
  }

  // Funktion zum Anzeigen einzelner Prompts
  function showSinglePrompts() {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      promptListTitle.textContent = "Single Prompts";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      const singlePrompts = Object.entries(data)
        .filter(([, topic]) => topic.prompts && topic.prompts.length === 1)
        .map(([id, topic]) => ({
          prompt: topic.prompts[0],
          folderId: id,
          index: 0,
          totalPrompts: 1,
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
  }

  // Funktion zum Anzeigen kategorisierter Prompts
  function showCategorisedPrompts() {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      promptListTitle.textContent = "Categorised Prompts";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      let categorisedPrompts = [];
      Object.entries(data)
        .filter(([, topic]) => topic.prompts && topic.prompts.length > 1)
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
  }

  // Funktion zum Umbenennen eines Ordners
  function renameFolder(folderId, folderTitleElement, currentName) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.classList.add("rename-input");
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

  // Funktion zum Löschen eines Ordners
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
          if (promptListTitle.textContent === "All Prompts") showAllPrompts();
          else if (promptListTitle.textContent === "Single Prompts")
            showSinglePrompts();
          else if (promptListTitle.textContent === "Categorised Prompts")
            showCategorisedPrompts();
        }
      });
    }
  }

  // Funktion zum Bearbeiten einer Prompt
  function editPrompt(folderId, promptIndex, promptTextElement) {
    const currentPrompt = promptTextElement.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentPrompt;
    input.classList.add("rename-input");
    promptTextElement.replaceWith(input);
    input.focus();

    function saveEdit() {
      const newText = input.value.trim();
      if (newText && newText !== currentPrompt) {
        chrome.storage.sync.get(folderId, function (data) {
          if (data[folderId]) {
            // Wenn prompt ein Objekt ist, nur title aktualisieren
            if (typeof data[folderId].prompts[promptIndex] === "object") {
              data[folderId].prompts[promptIndex].title = newText;
            } else {
              data[folderId].prompts[promptIndex] = newText; // Fallback für String
            }
            if (data[folderId].prompts.length === 1) {
              data[folderId].name = newText;
            }
            chrome.storage.sync.set(data, function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error editing prompt:",
                  chrome.runtime.lastError
                );
              } else {
                console.log(`Prompt in ${folderId} edited to: ${newText}`);
                promptTextElement.textContent = newText;
                input.replaceWith(promptTextElement);
                if (data[folderId].prompts.length > 1) {
                  showFolderContent(folderId);
                  if (promptListTitle.textContent === "Categorised Prompts")
                    showCategorisedPrompts();
                }
                if (promptListTitle.textContent === "All Prompts")
                  showAllPrompts();
                else if (promptListTitle.textContent === "Single Prompts")
                  showSinglePrompts();
              }
            });
          }
        });
      } else {
        input.replaceWith(promptTextElement);
      }
    }

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveEdit();
    });
  }

  // Funktion zum Löschen einer Prompt
  function deletePrompt(folderId, promptIndex, promptItem) {
    if (confirm("Are you sure you want to delete this prompt?")) {
      chrome.storage.sync.get(folderId, function (data) {
        if (data[folderId]) {
          data[folderId].prompts.splice(promptIndex, 1);
          if (data[folderId].prompts.length === 0) {
            chrome.storage.sync.remove(folderId, function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error deleting folder:",
                  chrome.runtime.lastError
                );
              } else {
                console.log(`Folder ${folderId} deleted (empty)`);
                promptItem.remove();
                loadFolderNavigation();
                loadFolders();
              }
            });
          } else {
            chrome.storage.sync.set(data, function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error deleting prompt:",
                  chrome.runtime.lastError
                );
              } else {
                console.log(`Prompt in ${folderId} deleted`);
                promptItem.remove();
                if (data[folderId].prompts.length > 1)
                  showFolderContent(folderId);
                if (promptListTitle.textContent === "All Prompts")
                  showAllPrompts();
                else if (promptListTitle.textContent === "Single Prompts")
                  showSinglePrompts();
                else if (promptListTitle.textContent === "Categorised Prompts")
                  showCategorisedPrompts();
              }
            });
          }
        }
      });
    }
  }

  // Funktion zum Suchen nach Ordnern oder Prompts
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

      const results = [];
      const lowercaseQuery = query.toLowerCase();

      Object.entries(data).forEach(([id, topic]) => {
        if (topic.name.toLowerCase().includes(lowercaseQuery)) {
          results.push({
            type: "folder",
            name: topic.name,
            id: id,
            prompts: topic.prompts,
          });
        }
        topic.prompts.forEach((prompt, index) => {
          const searchText = typeof prompt === "string" ? prompt : prompt.title;
          if (searchText.toLowerCase().includes(lowercaseQuery)) {
            results.push({
              type: "prompt",
              prompt,
              folder: topic.name,
              folderId: id,
              promptIndex: index,
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
          resultItem.innerHTML = `Prompt: "${promptText}" <span>(in ${result.folder})</span>`;
          const actions = document.createElement("span");
          actions.classList.add("prompt-actions");

          const editBtn = document.createElement("button");
          editBtn.textContent = "Edit";
          editBtn.classList.add("action-btn");
          editBtn.addEventListener("click", () => {
            const promptText = resultItem.querySelector("span:first-child");
            editPrompt(result.folderId, result.promptIndex, promptText);
          });
          actions.appendChild(editBtn);

          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "Delete";
          deleteBtn.classList.add("action-btn");
          deleteBtn.addEventListener("click", () =>
            deletePrompt(result.folderId, result.promptIndex, resultItem)
          );
          actions.appendChild(deleteBtn);

          const detailsBtn = document.createElement("button");
          detailsBtn.textContent = "Details";
          detailsBtn.classList.add("action-btn");
          detailsBtn.addEventListener("click", () =>
            showPromptDetails(
              result.prompt,
              result.folderId,
              result.promptIndex
            )
          );
          actions.appendChild(detailsBtn);

          resultItem.appendChild(actions);
        }
        resultsList.appendChild(resultItem);
      });
      searchResults.appendChild(resultsList);
    });
  }

  // Initiale Anzeige der Ordner
  loadFolders();
  loadFolderNavigation();

  // Event-Listener für Kategorien
  allPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    showAllPrompts();
  });

  singlePromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    showSinglePrompts();
  });

  categorisedPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    showCategorisedPrompts();
  });

  // Suche starten bei Eingabe
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

  // Suche zurücksetzen
  clearSearch.addEventListener("click", function () {
    searchInput.value = "";
    clearSearch.style.display = "none";
    searchResults.classList.add("hidden");
    folderListSection.classList.remove("hidden");
    loadFolders();
  });

  // Collapsible-Logik
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach((collapsible) => {
    collapsible.addEventListener("click", () => {
      collapsible.classList.toggle("active");
      const content = collapsible.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
});
