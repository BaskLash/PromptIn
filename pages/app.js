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

  // Funktion zum Laden und Anzeigen der Ordner in der Seitenleiste
  function loadFolderNavigation() {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      folderNavList.innerHTML = "";
      const folders = Object.entries(data).filter(
        ([, topic]) => topic.prompts.length > 1 // Nur echte Ordner
      );

      if (folders.length === 0) {
        const noFolders = document.createElement("a");
        noFolders.textContent = "No folders available";
        noFolders.style.color = "#888";
        noFolders.style.pointerEvents = "none";
        folderNavList.appendChild(noFolders);
      } else {
        folders.forEach(([id, topic]) => {
          const folderLink = document.createElement("a");
          folderLink.href = `#folder-${id}`;
          folderLink.textContent = topic.name;
          folderLink.addEventListener("click", (e) => {
            e.preventDefault();
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
      const folders = Object.entries(data).filter(
        ([, topic]) => topic.prompts.length > 1 // Nur echte Ordner
      );

      if (folders.length === 0) {
        folderList.innerHTML = '<p class="no-results">No folders available</p>';
        folderTitle.textContent = "Folders";
        return;
      }

      folders.forEach(([id, topic]) => {
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
    promptText.textContent = prompt;
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

  function movePromptToFolder(currentFolderId, promptIndex, promptItem) {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const folders = Object.entries(data).filter(
        ([id, topic]) => id !== currentFolderId && topic.prompts.length > 1
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

        const promptText = data[currentFolderId].prompts[promptIndex];
        data[currentFolderId].prompts.splice(promptIndex, 1);
        data[targetFolderId].prompts.push(promptText);

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
        allPrompts = allPrompts.concat(
          topic.prompts.map((prompt, index) => ({
            prompt,
            folderId: id,
            index,
            totalPrompts: topic.prompts.length,
          }))
        );
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
        .filter(([, topic]) => topic.prompts.length === 1)
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
        .filter(([, topic]) => topic.prompts.length > 1)
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
    const currentText = promptTextElement.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentText;
    input.classList.add("rename-input");
    promptTextElement.replaceWith(input);
    input.focus();

    function saveEdit() {
      const newText = input.value.trim();
      if (newText && newText !== currentText) {
        chrome.storage.sync.get(folderId, function (data) {
          if (data[folderId]) {
            data[folderId].prompts[promptIndex] = newText;
            if (data[folderId].prompts.length === 1)
              data[folderId].name = newText; // Titel anpassen, wenn einzelnes Prompt
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
          if (prompt.toLowerCase().includes(lowercaseQuery)) {
            results.push({
              type: "prompt",
              text: prompt,
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
          resultItem.innerHTML = `Prompt: "${result.text}" <span>(in ${result.folder})</span>`;
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
