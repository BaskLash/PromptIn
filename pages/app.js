document.addEventListener("DOMContentLoaded", function () {
  const folderList = document.getElementById("folderList");
  const searchResults = document.getElementById("searchResults");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

  // Funktion zum Laden und Anzeigen aller Ordner und Prompts
  function loadFolders() {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      folderList.innerHTML = ""; // Bestehende Inhalte löschen
      const folders = Object.entries(data);

      if (folders.length === 0) {
        folderList.innerHTML = '<p class="no-results">No folders available</p>';
        return;
      }

      folders.forEach(([id, topic]) => {
        const folderCard = document.createElement("div");
        folderCard.classList.add("folder-card");

        const folderHeader = document.createElement("div");
        folderHeader.classList.add("folder-header");

        const folderTitle = document.createElement("h2");
        folderTitle.textContent = `${topic.name} (${topic.prompts.length})`;
        folderHeader.appendChild(folderTitle);

        const folderActions = document.createElement("div");
        folderActions.classList.add("folder-actions");

        const renameFolderBtn = document.createElement("button");
        renameFolderBtn.textContent = "Rename";
        renameFolderBtn.classList.add("action-btn");
        renameFolderBtn.addEventListener("click", () =>
          renameFolder(id, folderTitle, topic.name)
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
          promptList.appendChild(noPrompts);
        } else {
          topic.prompts.forEach((prompt, index) => {
            const promptItem = document.createElement("li");
            promptItem.classList.add("prompt-item");

            const promptText = document.createElement("span");
            promptText.classList.add("prompt-text");
            promptText.textContent = prompt;
            promptItem.appendChild(promptText);

            const promptActions = document.createElement("div");
            promptActions.classList.add("prompt-actions");

            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.classList.add("action-btn");
            editBtn.addEventListener("click", () =>
              editPrompt(id, index, promptText)
            );
            promptActions.appendChild(editBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.classList.add("action-btn");
            deleteBtn.addEventListener("click", () =>
              deletePrompt(id, index, promptItem)
            );
            promptActions.appendChild(deleteBtn);

            promptItem.appendChild(promptActions);
            promptList.appendChild(promptItem);
          });
        }

        folderCard.appendChild(promptList);
        folderList.appendChild(folderCard);
      });
    });
  }

  // Funktion zum Umbenennen eines Ordners
  function renameFolder(folderId, folderTitle, currentName) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.classList.add("rename-input");
    folderTitle.replaceWith(input);
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
                folderTitle.textContent = `${newName} (${data[folderId].prompts.length})`;
                input.replaceWith(folderTitle);
              }
            });
          }
        });
      } else {
        input.replaceWith(folderTitle);
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
          chrome.storage.sync.set(data, function () {
            if (chrome.runtime.lastError) {
              console.error("Error deleting prompt:", chrome.runtime.lastError);
            } else {
              console.log(`Prompt in ${folderId} deleted`);
              promptItem.remove();
              const folderTitle = promptItem
                .closest(".folder-card")
                .querySelector("h2");
              folderTitle.textContent = `${data[folderId].name} (${data[folderId].prompts.length})`;
            }
          });
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
      folderList.classList.add("hidden");

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

  // Suche starten bei Eingabe
  searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim();
    if (query) {
      clearSearch.style.display = "block";
      searchFoldersAndPrompts(query);
    } else {
      clearSearch.style.display = "none";
      searchResults.classList.add("hidden");
      folderList.classList.remove("hidden");
      loadFolders();
    }
  });

  // Suche zurücksetzen
  clearSearch.addEventListener("click", function () {
    searchInput.value = "";
    clearSearch.style.display = "none";
    searchResults.classList.add("hidden");
    folderList.classList.remove("hidden");
    loadFolders();
  });
});
