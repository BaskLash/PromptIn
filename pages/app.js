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
  const unusedPromptsLink = document.getElementById("unusedPromptsLink");
  const workflowsLink = document.getElementById("workflowsLink");
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

  const addPromptBtn = document.getElementById("addPromptBtn");
  if (addPromptBtn) {
    addPromptBtn.addEventListener("click", addNewPrompt);
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

  function showUnusedPrompts() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.remove("hidden");
      folderListSection.classList.add("hidden");
      searchResults.classList.add("hidden");

      document.getElementById("mainHeaderTitle").textContent = "Unused Prompts";
      promptsContainer.innerHTML = "";

      const promptList = document.createElement("ul");
      promptList.classList.add("prompt-list");

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      let unusedPrompts = [];

      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts) && !topic.isTrash) {
          topic.prompts.forEach((prompt, index) => {
            if (
              prompt.usageCount === 0 &&
              (!prompt.lastUsed || prompt.lastUsed < thirtyDaysAgo)
            ) {
              unusedPrompts.push({
                prompt,
                folderId: id,
                index,
                totalPrompts: topic.prompts.length,
              });
            }
          });
        }
      });

      if (unusedPrompts.length === 0) {
        const noPrompts = document.createElement("li");
        noPrompts.textContent = "No unused prompts found";
        noPrompts.style.color = "#888";
        noPrompts.style.padding = "15px";
        promptList.appendChild(noPrompts);
      } else {
        unusedPrompts.forEach(({ prompt, folderId, index, totalPrompts }) => {
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
        addPromptBtn.disabled = true; // Adding new prompts not allowed in this view
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
                    result.match.charAt(0).toUpperCase() + result.match.slice(1)
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

  function showWorkflows() {
    chrome.storage.local.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptListSection.classList.add("hidden");
      folderListSection.classList.remove("hidden");
      searchResults.classList.add("hidden");

      mainHeaderTitle.textContent = "Workflows";
      folderList.innerHTML = "";

      const createWorkflowBtn = document.createElement("button");
      createWorkflowBtn.textContent = "Create New Workflow";
      createWorkflowBtn.classList.add("action-btn");
      createWorkflowBtn.style.marginBottom = "10px";
      createWorkflowBtn.addEventListener("click", showCreateWorkflowModal);
      folderList.appendChild(createWorkflowBtn);

      const workflows = Object.entries(data).filter(([id, item]) =>
        id.startsWith("workflow_")
      );

      if (workflows.length === 0) {
        folderList.innerHTML +=
          '<p class="no-results">No workflows available</p>';
        folderList.insertBefore(createWorkflowBtn, folderList.firstChild);
        return;
      }

      workflows.forEach(([id, workflow]) => {
        const workflowCard = document.createElement("div");
        workflowCard.classList.add("folder-card");

        const workflowHeader = document.createElement("div");
        workflowHeader.classList.add("folder-header");

        const workflowTitleElement = document.createElement("h2");
        workflowTitleElement.textContent = `${workflow.name} (${workflow.steps.length} steps)`;
        workflowHeader.appendChild(workflowTitleElement);

        const workflowActions = document.createElement("div");
        workflowActions.classList.add("folder-actions");

        const editWorkflowBtn = document.createElement("button");
        editWorkflowBtn.textContent = "Edit";
        editWorkflowBtn.classList.add("action-btn");
        editWorkflowBtn.addEventListener("click", () => editWorkflow(id));
        workflowActions.appendChild(editWorkflowBtn);

        const renameWorkflowBtn = document.createElement("button");
        renameWorkflowBtn.textContent = "Rename";
        renameWorkflowBtn.classList.add("action-btn");
        renameWorkflowBtn.addEventListener("click", () =>
          renameWorkflow(id, workflowTitleElement, workflow.name)
        );
        workflowActions.appendChild(renameWorkflowBtn);

        const deleteWorkflowBtn = document.createElement("button");
        deleteWorkflowBtn.textContent = "Delete";
        deleteWorkflowBtn.classList.add("action-btn");
        deleteWorkflowBtn.addEventListener("click", () =>
          deleteWorkflow(id, workflowCard)
        );
        workflowActions.appendChild(deleteWorkflowBtn);

        const executeWorkflowBtn = document.createElement("button");
        executeWorkflowBtn.textContent = "Execute";
        executeWorkflowBtn.classList.add("action-btn");
        executeWorkflowBtn.addEventListener("click", () => executeWorkflow(id));
        workflowActions.appendChild(executeWorkflowBtn);

        workflowHeader.appendChild(workflowActions);
        workflowCard.appendChild(workflowHeader);

        const stepList = document.createElement("ul");
        stepList.classList.add("prompt-list");

        workflow.steps.forEach((step, index) => {
          const stepItem = document.createElement("li");
          stepItem.classList.add("prompt-item");
          stepItem.textContent = `Step ${index + 1}: ${step.title}`;
          stepList.appendChild(stepItem);
        });

        workflowCard.appendChild(stepList);
        folderList.appendChild(workflowCard);
      });
    });
  }

  // Aktualisierte injectStyles-Funktion mit Modal-CSS
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
          background: #1e90ff;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
      }
      .action-btn:hover {
          background: #187bcd;
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
      /* Modal Styles */
      .modal {
          display: block;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgba(0,0,0,0.4);
      }
      .modal-content {
          background-color: #fefefe;
          margin: 15% auto;
          padding: 20px;
          border: 1px solid #888;
          width: 80%;
          max-width: 600px;
          border-radius: 8px;
      }
      .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
      }
      .modal-body {
          padding: 20px 0;
      }
      .close {
          color: #aaa;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
      }
      .close:hover,
      .close:focus {
          color: #000;
          text-decoration: none;
      }
      .step-item {
          margin-bottom: 10px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
      }
      .step-item label {
          display: block;
          margin-bottom: 5px;
          color: #333;
      }
      .step-item input,
      .step-item select,
      .step-item textarea {
          width: 100%;
          padding: 8px;
          margin-bottom: 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
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
          .modal-content {
              width: 95%;
              margin: 10% auto;
          }
      }
  `;
    document.head.appendChild(style);
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
      unusedPromptsLink,
      workflowsLink,
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
      unusedPromptsLink,
      workflowsLink,
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
      unusedPromptsLink,
      workflowsLink,
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
      unusedPromptsLink,
      workflowsLink,
      trashLink,
    ].forEach((link) => link.classList.remove("active"));
    categorisedPromptsLink.classList.add("active");
    showCategorisedPrompts();
  });

  unusedPromptsLink.addEventListener("click", (e) => {
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
    unusedPromptsLink.classList.add("active");
    showUnusedPrompts();
  });

  workflowsLink.addEventListener("click", (e) => {
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
    workflowsLink.classList.add("active");
    showWorkflows();
  });

  trashLink.addEventListener("click", (e) => {
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
    favoritesLink,
    allPromptsLink,
    singlePromptsLink,
    categorisedPromptsLink,
    unusedPromptsLink,
    workflowsLink,
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

  function saveNewName() {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      chrome.storage.local.get(workflowId, function (data) {
        if (data[workflowId]) {
          data[workflowId].name = newName;
          chrome.storage.local.set(data, function () {
            if (chrome.runtime.lastError) {
              console.error(
                "Error renaming workflow:",
                chrome.runtime.lastError
              );
            } else {
              console.log(`Workflow ${workflowId} renamed to ${newName}`);
              workflowTitleElement.textContent = `${newName} (${data[workflowId].steps.length} steps)`;
              input.replaceWith(workflowTitleElement);
              showWorkflows();
            }
          });
        }
      });
    } else {
      input.replaceWith(workflowTitleElement);
    }
  }

  function renameWorkflow(workflowId, workflowTitleElement, currentName) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className = "rename-input";
    workflowTitleElement.replaceWith(input);
    input.focus();

    input.addEventListener("blur", saveNewName);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveNewName();
    });
  }

  function createNewWorkflow() {
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
    headerTitle.textContent = "Create New Workflow";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Workflow Name:";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Enter workflow name";
    nameInput.style.width = "100%";
    nameInput.style.padding = "8px";
    nameInput.style.borderRadius = "4px";
    nameInput.style.border = "1px solid #ddd";

    const stepsLabel = document.createElement("label");
    stepsLabel.textContent = "Steps:";
    const stepsContainer = document.createElement("div");
    stepsContainer.id = "stepsContainer";
    stepsContainer.style.marginTop = "10px";

    let steps = [];

    const addStepBtn = document.createElement("button");
    addStepBtn.textContent = "Add Step";
    addStepBtn.className = "action-btn";
    addStepBtn.style.marginBottom = "10px";
    addStepBtn.addEventListener("click", () =>
      addStep({}, stepsContainer, steps)
    );

    const createButton = document.createElement("button");
    createButton.textContent = "Create Workflow";
    createButton.className = "action-btn";
    createButton.style.marginTop = "15px";

    // Define style element early
    const style = document.createElement("style");
    style.textContent = `
    .modal { display: block; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
    .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; border-radius: 8px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    .modal-body { padding: 20px 0; }
    .close { color: #aaa; font-size: 24px; font-weight: bold; cursor: pointer; }
    .close:hover, .close:focus { color: #000; text-decoration: none; }
    .action-btn { background: #1e90ff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px; }
    .action-btn:hover { background: #187bcd; }
    .step-item { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    .step-item label { display: block; margin-bottom: 5px; }
    .step-item input, .step-item select, .step-item textarea { width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px; }
  `;

    createButton.addEventListener("click", () => {
      const workflowName = nameInput.value.trim();
      if (!workflowName) {
        alert("Workflow name is required.");
        return;
      }

      const workflowSteps = steps.map((step, index) => {
        if (!step.promptSelect.value) {
          alert(`Please select a prompt for step ${index + 1}.`);
          throw new Error("Prompt selection required.");
        }
        try {
          const params = JSON.parse(step.paramsInput.value.trim() || "{}");
          const promptIdParts = step.promptSelect.value.split("_");
          if (promptIdParts.length < 2) {
            alert(
              `Invalid prompt selection for step ${
                index + 1
              }: must include valid folderId and promptIndex.`
            );
            throw new Error("Invalid prompt selection.");
          }
          // Extract promptIndex as the last part, folderId as everything before joined back
          const promptIndex = promptIdParts[promptIdParts.length - 1];
          const folderId = promptIdParts.slice(0, -1).join("_");
          const parsedPromptIndex = parseInt(promptIndex);
          if (!folderId || isNaN(parsedPromptIndex)) {
            alert(
              `Invalid prompt selection for step ${
                index + 1
              }: folderId or promptIndex invalid. PromptId: ${
                step.promptSelect.value
              }`
            );
            throw new Error("Invalid prompt selection.");
          }
          return {
            stepId: generateUUID(),
            promptId: step.promptSelect.value,
            folderId: folderId,
            promptIndex: parsedPromptIndex,
            title: step.stepTitleInput.value.trim() || `Step ${index + 1}`,
            parameters: params,
          };
        } catch (e) {
          alert(
            `Invalid JSON in parameters for step ${index + 1}: ${e.message}`
          );
          throw e;
        }
      });

      if (workflowSteps.length === 0) {
        alert("At least one step is required.");
        return;
      }

      const workflowId = `workflow_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}`;
      const newWorkflow = {
        name: workflowName,
        steps: workflowSteps,
        createdAt: Date.now(),
        lastUsed: null,
        usageCount: 0,
      };

      chrome.storage.local.set({ [workflowId]: newWorkflow }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error creating workflow:", chrome.runtime.lastError);
          alert("Error creating workflow.");
        } else {
          console.log(`Workflow created with ID: ${workflowId}`);
          console.log("Created workflow steps:", workflowSteps); // Debugging
          modal.remove();
          document.head.removeChild(style);
          showWorkflows();
        }
      });
    });

    // Append elements in correct order
    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(nameLabel);
    modalBody.appendChild(nameInput);
    modalBody.appendChild(stepsLabel);
    modalBody.appendChild(addStepBtn);
    modalBody.appendChild(stepsContainer);
    modalBody.appendChild(createButton);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);

    document.head.appendChild(style);
    document.body.appendChild(modal);

    closeSpan.onclick = function () {
      modal.remove();
      document.head.removeChild(style);
    };

    // Initialize with one step
    addStep({}, stepsContainer, steps);
  }

  function addStep(stepData = {}, stepsContainer, steps) {
    if (!stepsContainer || !steps) {
      console.error(
        "Error in addStep: stepsContainer or steps array is missing."
      );
      return;
    }

    const stepDiv = document.createElement("div");
    stepDiv.className = "step-item";
    stepDiv.style.marginBottom = "10px";
    stepDiv.style.padding = "10px";
    stepDiv.style.border = "1px solid #ddd";
    stepDiv.style.borderRadius = "4px";

    const stepTitleLabel = document.createElement("label");
    stepTitleLabel.textContent = "Step Title:";
    const stepTitleInput = document.createElement("input");
    stepTitleInput.type = "text";
    stepTitleInput.placeholder = "Enter step title";
    stepTitleInput.value = stepData.title || "";
    stepTitleInput.style.width = "100%";
    stepTitleInput.style.marginBottom = "8px";

    const promptLabel = document.createElement("label");
    promptLabel.textContent = "Select Prompt:";
    const promptSelect = document.createElement("select");
    promptSelect.style.width = "100%";
    promptSelect.style.marginBottom = "8px";

    const paramsLabel = document.createElement("label");
    paramsLabel.textContent = "Parameters (JSON):";
    const paramsInput = document.createElement("textarea");
    paramsInput.placeholder = '{"key": "value"}';
    paramsInput.value = stepData.parameters
      ? JSON.stringify(stepData.parameters, null, 2)
      : "{}";
    paramsInput.style.width = "100%";
    paramsInput.style.minHeight = "60px";

    // Get prompts from chrome storage
    chrome.storage.local.get(null, (data) => {
      const prompts = [];

      Object.entries(data).forEach(([id, topic]) => {
        if (topic.prompts && Array.isArray(topic.prompts)) {
          topic.prompts.forEach((prompt, index) => {
            if (
              typeof prompt.content === "string" &&
              /\{[^}]+\}/.test(prompt.content)
            ) {
              prompts.push({
                id: `${id}_${index}`,
                title: prompt.title || `Prompt ${index + 1}`,
                content: prompt.content,
                folderId: id,
              });
            }
          });
        }
      });

      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Select a prompt";
      promptSelect.appendChild(defaultOption);

      prompts.forEach((prompt) => {
        const option = document.createElement("option");
        option.value = prompt.id;
        option.textContent = prompt.title;
        if (stepData.promptId === prompt.id) {
          option.selected = true;
        }
        promptSelect.appendChild(option);
      });

      // Initialize parameters based on selected prompt or existing data
      const initializeParams = (selectedPrompt) => {
        if (selectedPrompt) {
          const matches = [...selectedPrompt.content.matchAll(/\{([^}]+)\}/g)];
          let currentParams = {};
          // Try to parse existing paramsInput value
          try {
            currentParams = JSON.parse(paramsInput.value.trim() || "{}");
          } catch (e) {
            console.warn("Invalid JSON in paramsInput, resetting to empty:", e);
          }
          const newParams = {};
          matches.forEach((match) => {
            const paramName = match[1];
            // Preserve existing value if it exists, otherwise initialize empty
            newParams[paramName] = currentParams[paramName] || "";
          });
          paramsInput.value = JSON.stringify(newParams, null, 2);
        }
      };

      if (stepData.promptId) {
        const selectedPrompt = prompts.find((p) => p.id === stepData.promptId);
        initializeParams(selectedPrompt);
      }

      promptSelect.addEventListener("change", () => {
        const selectedId = promptSelect.value;
        const selectedPrompt = prompts.find((p) => p.id === selectedId);
        initializeParams(selectedPrompt);
      });
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove Step";
    removeBtn.className = "action-btn";
    removeBtn.style.marginTop = "8px";
    removeBtn.addEventListener("click", () => {
      stepsContainer.removeChild(stepDiv);
      const index = steps.findIndex((s) => s.stepDiv === stepDiv);
      if (index !== -1) {
        steps.splice(index, 1);
      }
    });

    stepDiv.appendChild(stepTitleLabel);
    stepDiv.appendChild(stepTitleInput);
    stepDiv.appendChild(promptLabel);
    stepDiv.appendChild(promptSelect);
    stepDiv.appendChild(paramsLabel);
    stepDiv.appendChild(paramsInput);
    stepDiv.appendChild(removeBtn);
    stepsContainer.appendChild(stepDiv);

    steps.push({ stepDiv, stepTitleInput, promptSelect, paramsInput });
  }

  function showCreateWorkflowModal() {
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
    headerTitle.textContent = "Create New Workflow";

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Workflow Name:";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Enter workflow name";
    nameInput.style.width = "100%";
    nameInput.style.padding = "8px";
    nameInput.style.borderRadius = "4px";
    nameInput.style.border = "1px solid #ddd";

    const stepsLabel = document.createElement("label");
    stepsLabel.textContent = "Steps:";
    const stepsContainer = document.createElement("div");
    stepsContainer.id = "stepsContainer";
    stepsContainer.style.marginTop = "10px";

    let steps = [];

    const addStepBtn = document.createElement("button");
    addStepBtn.textContent = "Add Step";
    addStepBtn.className = "action-btn";
    addStepBtn.style.marginBottom = "10px";
    addStepBtn.addEventListener("click", () =>
      addStep({}, stepsContainer, steps)
    );

    const createButton = document.createElement("button");
    createButton.textContent = "Create Workflow";
    createButton.className = "action-btn";
    createButton.style.marginTop = "15px";

    createButton.addEventListener("click", () => {
      const workflowName = nameInput.value.trim();
      if (!workflowName) {
        alert("Workflow name is required.");
        return;
      }

      const workflowSteps = steps.map((step, index) => {
        if (!step.promptSelect.value) {
          alert(`Please select a prompt for step ${index + 1}.`);
          throw new Error("Prompt selection required.");
        }
        try {
          const params = JSON.parse(step.paramsInput.value.trim() || "{}");
          const promptIdParts = step.promptSelect.value.split("_");
          if (promptIdParts.length < 2) {
            alert(
              `Invalid prompt selection for step ${
                index + 1
              }: must include valid folderId and promptIndex.`
            );
            throw new Error("Invalid prompt selection.");
          }
          // Extract promptIndex as the last part, folderId as everything before joined back
          const promptIndex = promptIdParts[promptIdParts.length - 1];
          const folderId = promptIdParts.slice(0, -1).join("_");
          const parsedPromptIndex = parseInt(promptIndex);
          if (!folderId || isNaN(parsedPromptIndex)) {
            alert(
              `Invalid prompt selection for step ${
                index + 1
              }: folderId or promptIndex invalid. PromptId: ${
                step.promptSelect.value
              }`
            );
            throw new Error("Invalid prompt selection.");
          }
          return {
            stepId: generateUUID(),
            promptId: step.promptSelect.value,
            folderId: folderId,
            promptIndex: parsedPromptIndex,
            title: step.stepTitleInput.value.trim() || `Step ${index + 1}`,
            parameters: params,
          };
        } catch (e) {
          alert(
            `Invalid JSON in parameters for step ${index + 1}: ${e.message}`
          );
          throw e;
        }
      });

      if (workflowSteps.length === 0) {
        alert("At least one step is required.");
        return;
      }

      const workflowId = `workflow_${Date.now()}_${Math.floor(
        Math.random() * 10000
      )}`;
      const newWorkflow = {
        name: workflowName,
        steps: workflowSteps,
        createdAt: Date.now(),
        lastUsed: null,
        usageCount: 0,
      };

      chrome.storage.local.set({ [workflowId]: newWorkflow }, function () {
        if (chrome.runtime.lastError) {
          console.error("Error creating workflow:", chrome.runtime.lastError);
          alert("Error creating workflow.");
        } else {
          console.log(`Workflow created with ID: ${workflowId}`);
          console.log("Created workflow steps:", workflowSteps); // Debugging
          modal.remove();
          showWorkflows();
        }
      });
    });

    modalHeader.appendChild(closeSpan);
    modalHeader.appendChild(headerTitle);
    modalBody.appendChild(nameLabel);
    modalBody.appendChild(nameInput);
    modalBody.appendChild(stepsLabel);
    modalBody.appendChild(addStepBtn);
    modalBody.appendChild(stepsContainer);
    modalBody.appendChild(createButton);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);

    closeSpan.onclick = function () {
      modal.remove();
    };

    addStep({}, stepsContainer, steps);
  }

  function editWorkflow(workflowId) {
    chrome.storage.local.get(workflowId, function (data) {
      if (chrome.runtime.lastError || !data[workflowId]) {
        alert("Error loading workflow.");
        return;
      }

      const workflow = data[workflowId];
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
      headerTitle.textContent = "Edit Workflow";

      const modalBody = document.createElement("div");
      modalBody.className = "modal-body";

      const nameLabel = document.createElement("label");
      nameLabel.textContent = "Workflow Name:";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = workflow.name;
      nameInput.placeholder = "Enter workflow name";
      nameInput.style.width = "100%";
      nameInput.style.padding = "8px";
      nameInput.style.borderRadius = "4px";
      nameInput.style.border = "1px solid #ddd";

      const stepsLabel = document.createElement("label");
      stepsLabel.textContent = "Steps:";
      const stepsContainer = document.createElement("div");
      stepsContainer.id = "stepsContainer";
      stepsContainer.style.marginTop = "10px";

      let steps = [];

      const addStepBtn = document.createElement("button");
      addStepBtn.textContent = "Add Step";
      addStepBtn.className = "action-btn";
      addStepBtn.style.marginBottom = "10px";
      addStepBtn.addEventListener("click", () =>
        addStep({}, stepsContainer, steps)
      );

      const saveButton = document.createElement("button");
      saveButton.textContent = "Save Changes";
      saveButton.className = "action-btn";
      saveButton.style.marginTop = "15px";

      saveButton.addEventListener("click", () => {
        const workflowName = nameInput.value.trim();
        if (!workflowName) {
          alert("Workflow name is required.");
          return;
        }

        const workflowSteps = steps.map((step, index) => {
          if (!step.promptSelect.value) {
            alert(`Please select a prompt for step ${index + 1}.`);
            throw new Error("Prompt selection required.");
          }
          try {
            const params = JSON.parse(step.paramsInput.value.trim() || "{}");
            const promptIdParts = step.promptSelect.value.split("_");
            if (promptIdParts.length < 2) {
              alert(
                `Invalid prompt selection for step ${
                  index + 1
                }: must include valid folderId and promptIndex.`
              );
              throw new Error("Invalid prompt selection.");
            }
            // Extract promptIndex as the last part, folderId as everything before joined back
            const promptIndex = promptIdParts[promptIdParts.length - 1];
            const folderId = promptIdParts.slice(0, -1).join("_");
            const parsedPromptIndex = parseInt(promptIndex);
            if (!folderId || isNaN(parsedPromptIndex)) {
              alert(
                `Invalid prompt selection for step ${
                  index + 1
                }: folderId or promptIndex invalid. PromptId: ${
                  step.promptSelect.value
                }`
              );
              throw new Error("Invalid prompt selection.");
            }
            return {
              stepId: generateUUID(),
              promptId: step.promptSelect.value,
              folderId: folderId,
              promptIndex: parsedPromptIndex,
              title: step.stepTitleInput.value.trim() || `Step ${index + 1}`,
              parameters: params,
            };
          } catch (e) {
            alert(
              `Invalid JSON in parameters for step ${index + 1}: ${e.message}`
            );
            throw e;
          }
        });

        if (workflowSteps.length === 0) {
          alert("At least one step is required.");
          return;
        }

        const updatedWorkflow = {
          ...workflow,
          name: workflowName,
          steps: workflowSteps,
        };

        chrome.storage.local.set(
          { [workflowId]: updatedWorkflow },
          function () {
            if (chrome.runtime.lastError) {
              console.error(
                "Error updating workflow:",
                chrome.runtime.lastError
              );
              alert("Error updating workflow.");
            } else {
              console.log(`Workflow updated with ID: ${workflowId}`);
              console.log("Updated workflow steps:", workflowSteps); // Debugging
              modal.remove();
              showWorkflows();
            }
          }
        );
      });

      modalHeader.appendChild(closeSpan);
      modalHeader.appendChild(headerTitle);
      modalBody.appendChild(nameLabel);
      modalBody.appendChild(nameInput);
      modalBody.appendChild(stepsLabel);
      modalBody.appendChild(addStepBtn);
      modalBody.appendChild(stepsContainer);
      modalBody.appendChild(saveButton);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modal.appendChild(modalContent);

      document.body.appendChild(modal);

      closeSpan.onclick = function () {
        modal.remove();
      };

      workflow.steps.forEach((step) => {
        addStep(
          {
            title: step.title,
            promptId: step.promptId,
            parameters: step.parameters,
          },
          stepsContainer,
          steps
        );
      });
    });
  }

  function deleteWorkflow(workflowId, workflowCard) {
    if (confirm("Are you sure you want to delete this workflow?")) {
      chrome.storage.local.remove(workflowId, function () {
        if (chrome.runtime.lastError) {
          console.error("Error deleting workflow:", chrome.runtime.lastError);
        } else {
          console.log(`Workflow ${workflowId} deleted`);
          workflowCard.remove();
          showWorkflows();
        }
      });
    }
  }
  async function executeWorkflow(workflowId) {
    try {
      const data = await new Promise((resolve, reject) => {
        chrome.storage.local.get(workflowId, (result) => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(
                `Error fetching workflow: ${chrome.runtime.lastError.message}`
              )
            );
          } else {
            resolve(result);
          }
        });
      });

      const workflow = data[workflowId];
      if (!workflow || !workflow.steps || !Array.isArray(workflow.steps)) {
        throw new Error("Workflow not found or has no valid steps.");
      }

      console.log("Loaded workflow:", workflow); // Debugging: Log the entire workflow

      // Validate all steps before execution
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        console.log(`Validating step ${i + 1}:`, step); // Debugging: Log each step
        if (
          !step.folderId ||
          step.promptIndex == null ||
          isNaN(step.promptIndex)
        ) {
          throw new Error(
            `Invalid configuration for step ${
              i + 1
            }: missing folderId or promptIndex. Step data: ${JSON.stringify(
              step
            )}`
          );
        }
        if (!step.promptId || !step.promptId.includes("_")) {
          throw new Error(
            `Invalid promptId for step ${i + 1}: ${step.promptId}`
          );
        }
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
      headerTitle.textContent = `Executing: ${
        workflow.name || "Unnamed Workflow"
      }`;

      const modalBody = document.createElement("div");
      modalBody.className = "modal-body";

      modalHeader.appendChild(closeSpan);
      modalHeader.appendChild(headerTitle);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modal.appendChild(modalContent);

      const style = document.createElement("style");
      style.textContent = `
      .modal { display: block; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
      .modal-content { background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%; max-width: 600px; border-radius: 8px; }
      .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
      .modal-body { padding: 20px 0; }
      .close { color: #aaa; font-size: 24px; font-weight: bold; cursor: pointer; }
      .close:hover, .close:focus { color: #000; text-decoration: none; }
      .action-btn { background: #1e90ff; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px; }
      .action-btn:hover { background: #187bcd; }
      .modal-body pre { background: #f8f9fa; padding: 10px; border-radius: 4px; }
      .result-text { margin-top: 10px; padding: 10px; background: #e9ecef; border-radius: 4px; }
      .error-text { color: red; font-weight: bold; }
      .copy-btn { background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; margin-left: 10px; }
      .copy-btn:hover { background: #218838; }
    `;
      document.head.appendChild(style);
      document.body.appendChild(modal);

      closeSpan.onclick = () => {
        modal.remove();
        document.head.removeChild(style);
      };

      let currentStepIndex = 0;
      const stepResults = [];

      // Pass modalBody, workflow, and other necessary variables to showStep
      await showStep(
        currentStepIndex,
        modalBody,
        workflow,
        stepResults,
        modal,
        style,
        workflowId
      );
    } catch (error) {
      alert(`Failed to execute workflow: ${error.message}`);
      console.error("Workflow execution error:", error);
    }
  }

  async function showStep(
    stepIndex,
    modalBody,
    workflow,
    stepResults,
    modal,
    style,
    workflowId
  ) {
    modalBody.innerHTML = "<p>Loading step...</p>";
    const step = workflow.steps[stepIndex];

    if (!step || !step.folderId || step.promptIndex == null) {
      modalBody.innerHTML = `<p class="error-text">Error: Invalid step configuration (missing folderId or promptIndex).</p>`;
      addCloseButton(modalBody, modal, style);
      return;
    }

    try {
      const folderData = await new Promise((resolve, reject) => {
        chrome.storage.local.get(step.folderId, (result) => {
          if (chrome.runtime.lastError) {
            reject(
              new Error(
                `Error fetching folder: ${chrome.runtime.lastError.message}`
              )
            );
          } else {
            resolve(result);
          }
        });
      });

      if (!folderData[step.folderId]) {
        throw new Error(`Folder with ID ${step.folderId} not found.`);
      }
      const prompts = folderData[step.folderId].prompts;
      if (!prompts || !Array.isArray(prompts)) {
        throw new Error(`No prompts array found in folder ${step.folderId}.`);
      }
      const prompt = prompts[step.promptIndex];
      if (!prompt || !prompt.content) {
        throw new Error(
          `Prompt at index ${step.promptIndex} not found or invalid.`
        );
      }

      let promptContentText = prompt.content;
      if (step.parameters && typeof step.parameters === "object") {
        const placeholders = (prompt.content.match(/\{[^{}]*\}/g) || []).map(
          (p) => p.slice(1, -1)
        );
        const paramKeys = Object.keys(step.parameters);

        for (const placeholder of placeholders) {
          if (!paramKeys.includes(placeholder)) {
            throw new Error(
              `Missing parameter for placeholder "${placeholder}" in step ${
                stepIndex + 1
              }.`
            );
          }
        }

        Object.entries(step.parameters).forEach(([key, value]) => {
          const placeholder = `{${key}}`;
          promptContentText = promptContentText.replace(
            new RegExp(placeholder, "g"),
            value
          );
        });

        // Check for unhandled placeholders
        const remainingPlaceholders = promptContentText.match(/\{[^{}]*\}/g);
        if (remainingPlaceholders) {
          throw new Error(
            `Unreplaced placeholders in step ${
              stepIndex + 1
            }: ${remainingPlaceholders.join(", ")}.`
          );
        }
      }

      modalBody.innerHTML = "";
      const stepTitle = document.createElement("h3");
      stepTitle.textContent = `Step ${stepIndex + 1}: ${
        step.title || "Untitled Step"
      }`;
      modalBody.appendChild(stepTitle);

      const promptContent = document.createElement("p");
      promptContent.textContent = `Prompt: ${promptContentText}`;
      modalBody.appendChild(promptContent);

      const openGrokBtn = document.createElement("button");
      openGrokBtn.textContent = "Open Grok and Copy Prompt";
      openGrokBtn.className = "action-btn";
      openGrokBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(promptContentText).then(() => {
          chrome.tabs.create({ url: "https://grok.com" });
          alert("Prompt copied to clipboard! Paste it into Grok.");
        });
      });
      modalBody.appendChild(openGrokBtn);

      const paramsLabel = document.createElement("label");
      paramsLabel.textContent = "Parameters:";
      const paramsText = document.createElement("pre");
      paramsText.textContent = JSON.stringify(step.parameters || {}, null, 2);
      modalBody.appendChild(paramsLabel);
      modalBody.appendChild(paramsText);

      const resultLabel = document.createElement("label");
      resultLabel.textContent = "Result (paste Grok response here):";
      const resultInput = document.createElement("textarea");
      resultInput.style.width = "100%";
      resultInput.style.minHeight = "100px";
      resultInput.placeholder = "Paste the response from Grok here...";
      modalBody.appendChild(resultLabel);
      modalBody.appendChild(resultInput);

      const nextButton = document.createElement("button");
      nextButton.textContent =
        stepIndex < workflow.steps.length - 1 ? "Next Step" : "Finish";
      nextButton.className = "action-btn";
      nextButton.addEventListener("click", () => {
        if (resultInput.value.trim()) {
          stepResults.push({
            stepIndex,
            prompt: promptContentText,
            response: resultInput.value.trim(),
          });
        }

        if (stepIndex < workflow.steps.length - 1) {
          showStep(
            stepIndex + 1,
            modalBody,
            workflow,
            stepResults,
            modal,
            style,
            workflowId
          );
        } else {
          modal.remove();
          document.head.removeChild(style);

          workflow.lastUsed = Date.now();
          workflow.usageCount = (workflow.usageCount || 0) + 1;
          chrome.storage.local.set({ [workflowId]: workflow });

          if (stepResults.length > 0) {
            chrome.storage.local.set({
              [`workflow_result_${workflowId}_${Date.now()}`]: stepResults,
            });
          }
        }
      });
      modalBody.appendChild(nextButton);
    } catch (error) {
      modalBody.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
      console.error("Step error:", error, {
        step,
        folderId: step.folderId,
        promptIndex: step.promptIndex,
      });
      addCloseButton(modalBody, modal, style);
    }
  }

  function addCloseButton(modalBody, modal, style) {
    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "action-btn";
    closeButton.addEventListener("click", () => {
      modal.remove();
      document.head.removeChild(style);
    });
    modalBody.appendChild(closeButton);
  }
});
