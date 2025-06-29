function inputFieldTrigger() {
  // Warte, bis das DOM geladen ist
  document.addEventListener("DOMContentLoaded", () => {
    // Warte zusätzlich 2 Sekunden nach DOM-Laden
    setTimeout(() => {
      /**
       * Finds the most likely input field on the page by checking for textareas, contenteditable elements, or inputs.
       * @returns {HTMLElement|null} The input field element or null if none found.
       */
      function findInputField() {
        // Try specific IDs first (e.g., ChatGPT)
        let input = document.getElementById("prompt-textarea");
        if (input) return input;

        input = document.getElementById("copilot-chat-textarea");
        if (input) return input;

        // Try common textarea
        input = document.querySelector(
          "textarea:not([readonly]):not([disabled])"
        );
        if (input) return input;

        // Try contenteditable elements (e.g., Perplexity, Claude)
        input = document.querySelector(
          "[contenteditable='true']:not([readonly]):not([disabled])"
        );
        if (input) return input;

        // Try role-based textboxes (e.g., Gemini)
        input = document.querySelector(
          "[role='textbox']:not([readonly]):not([disabled])"
        );
        if (input) return input;

        // Try input elements
        input = document.querySelector(
          "input[type='text']:not([readonly]):not([disabled])"
        );
        if (input) return input;

        // Try specific selectors for known platforms
        input =
          document.querySelector(
            "[enterkeyhint='enter']:not([readonly]):not([disabled])"
          ) ||
          document.querySelector(
            "textarea#copilot-chat-textarea:not([readonly]):not([disabled])"
          );
        if (input) return input;

        return null;
      }

      /**
       * Gets the text content from an input field, handling different element types.
       * @param {HTMLElement} inputField The input field element.
       * @returns {string} The text content.
       */
      function getInputText(inputField) {
        if (!inputField) return "";
        if (
          inputField.tagName === "TEXTAREA" ||
          inputField.tagName === "INPUT"
        ) {
          return inputField.value || "";
        }
        if (inputField.isContentEditable) {
          return inputField.textContent || "";
        }
        return inputField.innerText || "";
      }

      /**
       * Sets the text content of an input field, handling different element types.
       * @param {HTMLElement} inputField The input field element.
       * @param {string} text The text to set.
       */
      function setInputText(inputField, text) {
        if (!inputField) return;
        if (
          inputField.tagName === "TEXTAREA" ||
          inputField.tagName === "INPUT"
        ) {
          inputField.value = text;
        } else if (inputField.isContentEditable) {
          inputField.textContent = text;
        } else {
          inputField.innerText = text;
        }
        // Trigger input event to notify the platform of changes
        const event = new Event("input", { bubbles: true });
        inputField.dispatchEvent(event);
      }

      /**
       * Sets the cursor to the end of the input field.
       * @param {HTMLElement} inputField The input field element.
       */
      function setCursorToEnd(inputField) {
        if (!inputField) return;
        if (
          inputField.tagName === "TEXTAREA" ||
          inputField.tagName === "INPUT"
        ) {
          inputField.selectionStart = inputField.selectionEnd =
            inputField.value.length;
        } else if (inputField.isContentEditable) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(inputField);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      /**
       * Levenshtein distance for fuzzy matching.
       * @param {string} a First string.
       * @param {string} b Second string.
       * @returns {number} The Levenshtein distance.
       */
      function levenshteinDistance(a, b) {
        const matrix = Array(b.length + 1)
          .fill()
          .map(() => Array(a.length + 1).fill(0));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
          for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
              matrix[j][i - 1] + 1,
              matrix[j - 1][i] + 1,
              matrix[j - 1][i - 1] + indicator
            );
          }
        }
        return matrix[b.length][a.length];
      }

      // Initialize input field
      const inputField = findInputField();

      if (!inputField) {
        console.error("No suitable input field found on the page.");
      }

      if (!document.body) {
        console.error("Document body is not available.");
      }

      // Create dropdown
      const dropdown = document.createElement("div");
      dropdown.id = "dropdown";
      dropdown.style.position = "absolute";
      dropdown.style.backgroundColor = "white";
      dropdown.style.color = "#333";
      dropdown.style.border = "1px solid #ddd";
      dropdown.style.borderRadius = "8px";
      dropdown.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.15)";
      dropdown.style.width = "400px";
      dropdown.style.maxHeight = "350px";
      dropdown.style.overflow = "hidden";
      dropdown.style.display = "none";
      dropdown.style.zIndex = "10000";
      dropdown.style.flexDirection = "column";
      dropdown.style.fontFamily = "Segoe UI, sans-serif";
      dropdown.style.backdropFilter = "blur(6px)";
      dropdown.style.opacity = "0";
      dropdown.style.transform = "translateY(10px)";
      dropdown.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      document.body.appendChild(dropdown);

      // Panels container for nav and content
      const panelsContainer = document.createElement("div");
      panelsContainer.style.display = "flex";
      panelsContainer.style.flex = "1";
      panelsContainer.style.overflow = "hidden";
      dropdown.appendChild(panelsContainer);

      // Left nav panel (used only when no search query)
      const navPanel = document.createElement("div");
      navPanel.style.borderRight = "1px solid #eee";
      navPanel.style.padding = "10px";
      navPanel.style.backgroundColor = "#fafafa";
      navPanel.style.overflowY = "auto";
      panelsContainer.appendChild(navPanel);

      // Right content panel
      const contentPanel = document.createElement("div");
      contentPanel.style.flex = "1";
      contentPanel.style.padding = "10px";
      contentPanel.style.overflowY = "auto";
      panelsContainer.appendChild(contentPanel);

      // Footer panel for keyboard shortcuts
      const footerPanel = document.createElement("div");
      footerPanel.style.padding = "8px 10px";
      footerPanel.style.backgroundColor = "#f5f5f5";
      footerPanel.style.borderTop = "1px solid #eee";
      footerPanel.style.fontSize = "12px";
      footerPanel.style.color = "#666";
      footerPanel.style.display = "flex";
      footerPanel.style.justifyContent = "space-between";
      footerPanel.innerHTML = `
    <span>↑↓: Navigate</span>
    <span>←→: Switch</span>
    <span>Enter: Select</span>
    <span>Esc: Close</span>
`;
      dropdown.appendChild(footerPanel);

      // Initialize categories and promptSourceMap
      let categories = {
        Favorites: [],
        Workflows: [], // Added Workflows category
        "All Prompts": [],
        "Single Prompts": [],
        "Categorised Prompts": { all: [] },
      };

      let promptSourceMap = new Map();
      let currentFocusElement = null;
      let selectedCategoryOrFolder = null;
      let isPasting = false;
      let isEscaped = false;
      // Initialize state variables for slash handling
      let isDropdownTriggered = false;
      let isSlashKeyboardInput = false;

      // Function to update dropdown data from Chrome storage
      function updateDropdownData(callback) {
        chrome.storage.local.get(null, function (data) {
          if (chrome.runtime.lastError) {
            console.error(
              "Error fetching data from Chrome storage:",
              chrome.runtime.lastError
            );
            return;
          }

          categories = {
            "Last Used": [],
            Favorites: [],
            Workflows: [],
            "All Prompts": [],
            "Single Prompts": [],
            "Categorised Prompts": { all: [] },
          };
          promptSourceMap = new Map();

          const allPrompts = [];
          // Handle workflows
          // *** Code below is responsible for populating the Workflows category ***
          Object.entries(data).forEach(([key, value]) => {
            if (key.startsWith("workflow_") && !value.isTrash) {
              categories.Workflows.push(value.name);
              promptSourceMap.set(value.name + "_" + key, {
                category: "Workflows",
                workflow: value,
                workflowId: key,
              });
            }
          });
          // *** End of workflow population code ***
          Object.entries(data).forEach(([id, topic]) => {
            if (
              topic.prompts &&
              Array.isArray(topic.prompts) &&
              !topic.isTrash
            ) {
              topic.prompts.forEach((prompt, index) => {
                const title =
                  typeof prompt === "string"
                    ? prompt.slice(0, 50)
                    : prompt.title || "Untitled Prompt";
                const content =
                  typeof prompt === "string" ? prompt : prompt.content || "";

                // Store for Last Used sorting, including prompts without lastUsed
                allPrompts.push({
                  title,
                  prompt,
                  folderId: id,
                  promptIndex: index, // Speichere den Index für spätere Updates
                  lastUsed: prompt.lastUsed || 0, // Fallback auf 0, wenn kein lastUsed existiert
                  folder: topic.isHidden ? null : topic.name,
                });

                // Add to All Prompts
                categories["All Prompts"].push(title);
                promptSourceMap.set(title + "_" + id + "_" + index, {
                  // Eindeutiger Schlüssel
                  category: "All Prompts",
                  folder: null,
                  prompt: prompt,
                  folderId: id,
                  promptIndex: index,
                });

                // Add to Single Prompts if hidden
                if (topic.isHidden) {
                  categories["Single Prompts"].push(title);
                  promptSourceMap.set(title + "_" + id + "_" + index, {
                    category: "Single Prompts",
                    folder: null,
                    prompt: prompt,
                    folderId: id,
                    promptIndex: index,
                  });
                }

                // Add to Categorised Prompts if not hidden
                if (!topic.isHidden) {
                  if (!categories["Categorised Prompts"][topic.name]) {
                    categories["Categorised Prompts"][topic.name] = [];
                  }
                  categories["Categorised Prompts"][topic.name].push(title);
                  categories["Categorised Prompts"].all.push(
                    `${topic.name}: ${title}`
                  );
                  promptSourceMap.set(title + "_" + id + "_" + index, {
                    category: "Categorised Prompts",
                    folder: topic.name,
                    prompt: prompt,
                    folderId: id,
                    promptIndex: index,
                  });
                }

                // Add to Favorites if isFavorite is true
                if (prompt.isFavorite) {
                  categories["Favorites"].push(title);
                  promptSourceMap.set(title + "_" + id + "_" + index, {
                    category: "Favorites",
                    folder: topic.isHidden ? null : topic.name,
                    prompt: prompt,
                    folderId: id,
                    promptIndex: index,
                  });
                }
              });
            }
          });

          // Sort and populate Last Used category (up to 10 prompts)
          allPrompts.sort((a, b) => b.lastUsed - a.lastUsed); // Sort descending by lastUsed timestamp
          categories["Last Used"] = [];
          promptSourceMap.forEach((source, key) => {
            if (source.category === "Last Used") {
              promptSourceMap.delete(key); // Clear previous Last Used mappings
            }
          });
          allPrompts
            .slice(0, 10)
            .forEach(({ title, prompt, folderId, promptIndex, folder }) => {
              const key = title + "_" + folderId + "_" + promptIndex;
              if (!promptSourceMap.has(key)) {
                console.warn(`Duplicate or missing prompt key: ${key}`);
                return;
              }
              categories["Last Used"].push(title);
              promptSourceMap.set(key, {
                category: "Last Used",
                folder,
                prompt,
                folderId,
                promptIndex,
              });
            });

          // Sort other categories alphabetically
          Object.keys(categories).forEach((key) => {
            if (Array.isArray(categories[key]) && key !== "Last Used") {
              categories[key] = [...new Set(categories[key])].sort();
            } else if (key === "Categorised Prompts") {
              categories[key].all = [...new Set(categories[key].all)].sort();
              Object.keys(categories[key]).forEach((folder) => {
                if (folder !== "all") {
                  categories[key][folder] = [
                    ...new Set(categories[key][folder]),
                  ].sort();
                }
              });
            }
          });

          if (callback) {
            callback();
          }
        });
      }

      // Function to set focus styling
      function setFocus(element) {
        console.log("Setting focus to:", element?.textContent || "null");
        if (currentFocusElement) {
          currentFocusElement.style.outline = "none";
          currentFocusElement.style.backgroundColor =
            currentFocusElement.classList.contains("active") &&
            (currentFocusElement.classList.contains("nav-item") ||
              currentFocusElement.classList.contains("folder-item"))
              ? "#e3e3e3"
              : currentFocusElement.classList.contains("dropdown-item")
              ? "white"
              : "transparent";
        }
        currentFocusElement = element;
        if (element) {
          element.style.outline = "2px solid #007bff";
          element.style.backgroundColor = "#e6f0ff";
          element.scrollIntoView({ block: "nearest" });
        }
      }

      // Function to clear focus
      function clearFocus() {
        if (currentFocusElement) {
          currentFocusElement.style.outline = "none";
          currentFocusElement.style.backgroundColor =
            currentFocusElement.classList.contains("active") &&
            (currentFocusElement.classList.contains("nav-item") ||
              currentFocusElement.classList.contains("folder-item"))
              ? "#e3e3e3"
              : currentFocusElement.classList.contains("dropdown-item")
              ? "white"
              : "transparent";
          currentFocusElement = null;
        }
      }

      // Function to render content panel based on selected category/folder
      function renderContentPanel(categoryOrFolder) {
        contentPanel.innerHTML = "";
        let items = [];
        if (categoryOrFolder === "Categorised Prompts") {
          items = categories[categoryOrFolder].all;
        } else if (categories["Categorised Prompts"][categoryOrFolder]) {
          items = categories["Categorised Prompts"][categoryOrFolder];
        } else {
          items = categories[categoryOrFolder] || [];
        }

        if (items.length === 0) {
          const message = document.createElement("div");
          message.textContent =
            categoryOrFolder === "Categorised Prompts"
              ? "No prompts in categorised folders"
              : categoryOrFolder === "Favorites"
              ? "No favorite prompts available"
              : "No prompts in this folder";
          message.style.padding = "10px";
          message.style.color = "#888";
          contentPanel.appendChild(message);
        } else {
          if (categoryOrFolder === "Workflows") {
            items.forEach((workflowName) => {
              const contentItem = document.createElement("div");
              contentItem.textContent = workflowName;
              contentItem.style.padding = "10px";
              contentItem.style.cursor = "pointer";
              contentItem.style.borderRadius = "4px";
              contentItem.style.transition = "background-color 0.2s ease";
              contentItem.className = "dropdown-item";
              contentItem.tabIndex = 0;

              contentItem.addEventListener("mouseover", () => {
                if (
                  !currentFocusElement ||
                  currentFocusElement !== contentItem
                ) {
                  contentItem.style.backgroundColor = "#f8f8f8";
                }
              });

              contentItem.addEventListener("mouseout", () => {
                if (
                  !currentFocusElement ||
                  currentFocusElement !== contentItem
                ) {
                  contentItem.style.backgroundColor = "white";
                }
              });

              contentItem.addEventListener("click", () => {
                const key = Array.from(promptSourceMap.keys()).find((k) =>
                  k.startsWith(workflowName + "_")
                );
                const source = promptSourceMap.get(key);
                if (source && source.workflowId) {
                  console.log("Workflow selected:", source.workflow.name);
                  showDynamicVariablesModal(source.workflowId);
                  dropdown.style.display = "none"; // Dropdown nach Auswahl schließen
                  clearFocus();
                }
              });

              contentItem.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  contentItem.click();
                }
              });

              contentPanel.appendChild(contentItem);
            });
          } else {
            // Für Last Used: Sortiere explizit nach lastUsed
            if (categoryOrFolder === "Last Used") {
              const sortedItems = items
                .map((itemText) => {
                  const key = Array.from(promptSourceMap.keys()).find((k) =>
                    k.startsWith(itemText + "_")
                  );
                  const source = promptSourceMap.get(key);
                  return { itemText, source };
                })
                .sort((a, b) => {
                  const lastUsedA = a.source.prompt.lastUsed || 0;
                  const lastUsedB = b.source.prompt.lastUsed || 0;
                  return lastUsedB - lastUsedA;
                })
                .map(({ itemText }) => itemText);
              items = sortedItems;
            }

            items.forEach((itemText) => {
              const contentItem = document.createElement("div");
              const title = itemText.includes(": ")
                ? itemText.split(": ")[1]
                : itemText;
              const key = Array.from(promptSourceMap.keys()).find((k) =>
                k.startsWith(title + "_")
              );
              const source = promptSourceMap.get(key);
              const displayText =
                source && source.category === "Favorites" && source.folder
                  ? `${title} (in ${source.folder})`
                  : source && source.category === "Categorised Prompts"
                  ? `${title} (${source.folder})`
                  : title;
              contentItem.textContent = displayText;
              contentItem.style.padding = "10px";
              contentItem.style.cursor = "pointer";
              contentItem.style.borderRadius = "4px";
              contentItem.style.transition = "background-color 0.2s ease";
              contentItem.className = "dropdown-item";
              contentItem.tabIndex = 0;

              contentItem.addEventListener("mouseover", () => {
                if (
                  !currentFocusElement ||
                  currentFocusElement !== contentItem
                ) {
                  contentItem.style.backgroundColor = "#f8f8f8";
                }
              });

              contentItem.addEventListener("mouseout", () => {
                if (
                  !currentFocusElement ||
                  currentFocusElement !== contentItem
                ) {
                  contentItem.style.backgroundColor = "white";
                }
              });

              contentItem.addEventListener("click", async () => {
                const currentText = getInputText(inputField);
                const slashIndex = currentText.indexOf("/");
                let newText = "";
                const selectedPrompt =
                  source && source.prompt
                    ? typeof source.prompt === "string"
                      ? source.prompt
                      : source.prompt.content || ""
                    : "";

                if (slashIndex !== -1) {
                  const textBeforeSlash = currentText
                    .substring(0, slashIndex)
                    .trim();
                  if (textBeforeSlash === "") {
                    newText = selectedPrompt;
                  } else {
                    const hasSpace =
                      currentText[slashIndex - 1] === " " ||
                      currentText[slashIndex + 1] === " ";
                    newText = hasSpace
                      ? `${textBeforeSlash} ${selectedPrompt}`
                      : `${textBeforeSlash}${selectedPrompt}`;
                  }
                } else {
                  newText = currentText
                    ? `${currentText} ${selectedPrompt}`
                    : selectedPrompt;
                }

                setInputText(inputField, newText);
                inputField.focus();
                setCursorToEnd(inputField);
                dropdown.style.display = "none";
                clearFocus();

                // Nur für reguläre Prompts lastUsed aktualisieren
                if (
                  source.category !== "Workflows" &&
                  source.promptIndex !== undefined
                ) {
                  updatePromptLastUsed(source.folderId, source.promptIndex);
                }
              });

              contentPanel.appendChild(contentItem);
            });
          }
        }
      }

      // Function to render category navigation (for / only)
      function renderCategoryNavigation() {
        navPanel.style.display = "block";
        contentPanel.style.width = "250px";
        navPanel.innerHTML = "";
        clearFocus();

        Object.keys(categories).forEach((category) => {
          const navItem = document.createElement("div");
          navItem.textContent = category;
          navItem.style.padding = "10px";
          navItem.style.cursor = "pointer";
          navItem.style.borderRadius = "4px";
          navItem.style.transition =
            "background-color 0.2s ease, font-weight 0.2s ease";
          navItem.className = "nav-item";
          navItem.tabIndex = 0;

          navItem.addEventListener("mouseover", () => {
            if (!currentFocusElement || currentFocusElement !== navItem) {
              navItem.style.backgroundColor = "#f0f0f0";
            }
          });

          navItem.addEventListener("mouseout", () => {
            if (!currentFocusElement || currentFocusElement !== navItem) {
              navItem.style.backgroundColor = navItem.classList.contains(
                "active"
              )
                ? "#e3e3e3"
                : "transparent";
            }
          });

          navItem.addEventListener("click", () => {
            document
              .querySelectorAll(".nav-item, .folder-item")
              .forEach((item) => {
                item.classList.remove("active");
                item.style.fontWeight = "normal";
                item.style.backgroundColor = "transparent";
              });

            navItem.classList.add("active");
            navItem.style.fontWeight = "bold";
            navItem.style.backgroundColor = "#e3e3e3";
            selectedCategoryOrFolder = category;
            renderContentPanel(category);
            setFocus(navItem);
          });

          navPanel.appendChild(navItem);

          if (category === "Categorised Prompts") {
            const folderContainer = document.createElement("div");
            folderContainer.style.paddingLeft = "10px";
            Object.keys(categories[category])
              .sort()
              .filter((key) => key !== "all")
              .forEach((folder) => {
                const folderItem = document.createElement("div");
                folderItem.textContent = folder;
                folderItem.style.padding = "8px 10px";
                folderItem.style.cursor = "pointer";
                folderItem.style.borderRadius = "4px";
                folderItem.style.transition =
                  "background-color 0.2s ease, font-weight 0.2s ease";
                folderItem.className = "folder-item";
                folderItem.tabIndex = 0;

                folderItem.addEventListener("mouseover", () => {
                  if (
                    !currentFocusElement ||
                    currentFocusElement !== folderItem
                  ) {
                    folderItem.style.backgroundColor = "#f0f0f0";
                  }
                });

                folderItem.addEventListener("mouseout", () => {
                  if (
                    !currentFocusElement ||
                    currentFocusElement !== folderItem
                  ) {
                    folderItem.style.backgroundColor =
                      folderItem.classList.contains("active")
                        ? "#e3e3e3"
                        : "transparent";
                  }
                });

                folderItem.addEventListener("click", () => {
                  document
                    .querySelectorAll(".nav-item, .folder-item")
                    .forEach((item) => {
                      item.classList.remove("active");
                      item.style.fontWeight = "normal";
                      item.style.backgroundColor = "transparent";
                    });

                  folderItem.classList.add("active");
                  folderItem.style.fontWeight = "bold";
                  folderItem.style.backgroundColor = "#e3e3e3";
                  selectedCategoryOrFolder = folder;
                  renderContentPanel(folder);
                  setFocus(folderItem);
                });

                folderContainer.appendChild(folderItem);
              });
            navPanel.appendChild(folderContainer);
          }
        });

        const firstNavItem = navPanel.querySelector(".nav-item");
        if (firstNavItem) {
          firstNavItem.click();
        }
      }

      // Function to render filtered search results
      function renderSearchResults(query) {
        navPanel.style.display = "none";
        contentPanel.style.width = "100%";
        contentPanel.innerHTML = "";
        clearFocus();

        const normalizedQuery = query.trim().toLowerCase();

        const allPrompts = [];
        promptSourceMap.forEach((source, key) => {
          const title = key.split("_")[0];
          const content =
            typeof source.prompt === "string"
              ? source.prompt
              : source.prompt.content || "";
          allPrompts.push({ title, content, source });
        });

        const scoredPrompts = allPrompts.map(({ title, content, source }) => {
          const titleLower = title.toLowerCase();
          const contentLower = content.toLowerCase();

          const titleIncludes = titleLower.includes(normalizedQuery);
          const contentIncludes = contentLower.includes(normalizedQuery);

          const titleDistance = levenshteinDistance(
            titleLower,
            normalizedQuery
          );
          const contentDistance = levenshteinDistance(
            contentLower,
            normalizedQuery
          );

          // Bessere Gewichtung: 1. direkte Matches, 2. Distanz-Mix
          const score =
            (titleIncludes ? -20 : 0) +
            (contentIncludes ? -10 : 0) +
            titleDistance * 1.5 +
            contentDistance * 0.5;

          return {
            title,
            source,
            score,
            folder: source.folder || source.category || "Uncategorized",
          };
        });

        scoredPrompts.sort((a, b) => a.score - b.score);

        if (scoredPrompts.length === 0) {
          const noResults = document.createElement("div");
          noResults.textContent = "No matching prompts found";
          noResults.style.padding = "10px";
          noResults.style.color = "#888";
          contentPanel.appendChild(noResults);
        } else {
          // Optional: Gruppieren nach Folder/Kategorie
          const grouped = new Map();
          for (const prompt of scoredPrompts) {
            if (!grouped.has(prompt.folder)) grouped.set(prompt.folder, []);
            grouped.get(prompt.folder).push(prompt);
          }

          for (const [folder, prompts] of grouped) {
            const groupTitle = document.createElement("div");
            groupTitle.textContent = folder;
            groupTitle.style.padding = "6px 10px";
            groupTitle.style.fontWeight = "bold";
            groupTitle.style.background = "#f0f0f0";
            contentPanel.appendChild(groupTitle);

            prompts.forEach(({ title, source }) => {
              const contentItem = document.createElement("div");
              contentItem.textContent = title;
              contentItem.style.padding = "10px";
              contentItem.style.cursor = "pointer";
              contentItem.style.borderRadius = "4px";
              contentItem.style.transition = "background-color 0.2s ease";
              contentItem.className = "dropdown-item";
              contentItem.tabIndex = 0;

              contentItem.addEventListener("mouseover", () => {
                if (
                  !currentFocusElement ||
                  currentFocusElement !== contentItem
                ) {
                  contentItem.style.backgroundColor = "#f8f8f8";
                }
              });

              contentItem.addEventListener("mouseout", () => {
                if (
                  !currentFocusElement ||
                  currentFocusElement !== contentItem
                ) {
                  contentItem.style.backgroundColor = "white";
                }
              });

              contentItem.addEventListener("click", async () => {
                const currentText = getInputText(inputField);
                const slashIndex = currentText.indexOf("/");
                let newText = "";
                const selectedPrompt =
                  typeof source.prompt === "string"
                    ? source.prompt
                    : source.prompt.content || "";

                if (slashIndex !== -1) {
                  const textBeforeSlash = currentText
                    .substring(0, slashIndex)
                    .trim();
                  if (textBeforeSlash === "") {
                    newText = selectedPrompt;
                  } else {
                    const hasSpace =
                      currentText[slashIndex - 1] === " " ||
                      currentText[slashIndex + 1] === " ";
                    newText = hasSpace
                      ? `${textBeforeSlash} ${selectedPrompt}`
                      : `${textBeforeSlash}${selectedPrompt}`;
                  }
                } else {
                  newText = currentText
                    ? `${currentText} ${selectedPrompt}`
                    : selectedPrompt;
                }

                setInputText(inputField, newText);
                inputField.focus();
                setCursorToEnd(inputField);
                dropdown.style.display = "none";
                clearFocus();

                const promptIndex = await findPromptIndex(
                  source.folderId,
                  source.prompt
                );
                if (promptIndex !== -1) {
                  updatePromptLastUsed(source.folderId, promptIndex);
                } else {
                  console.error(
                    "Prompt index not found for folder:",
                    source.folderId
                  );
                }
              });

              contentPanel.appendChild(contentItem);
            });
          }
        }

        requestAnimationFrame(() => {
          const firstResult = contentPanel.querySelector(".dropdown-item");
          if (firstResult) {
            setFocus(firstResult);
          }
        });
      }

      // Function to handle keyboard navigation
      function handleKeyboardNavigation(e) {
        if (dropdown.style.display !== "flex") return;

        const navigationKeys = [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Enter",
          "Escape",
          "Backspace",
          "Delete",
        ];
        if (navigationKeys.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          return;
        }

        const navItems = Array.from(
          navPanel.querySelectorAll(".nav-item, .folder-item")
        );
        const contentItems = Array.from(
          contentPanel.querySelectorAll(".dropdown-item")
        );

        if (e.key === "ArrowDown") {
          if (currentFocusElement) {
            const items =
              currentFocusElement.classList.contains("nav-item") ||
              currentFocusElement.classList.contains("folder-item")
                ? navItems
                : contentItems;
            const currentIndex = items.indexOf(currentFocusElement);
            if (currentIndex < items.length - 1) {
              const nextItem = items[currentIndex + 1];
              setFocus(nextItem);
              if (
                nextItem.classList.contains("nav-item") ||
                nextItem.classList.contains("folder-item")
              ) {
                document
                  .querySelectorAll(".nav-item, .folder-item")
                  .forEach((item) => {
                    item.classList.remove("active");
                    item.style.fontWeight = "normal";
                    item.style.backgroundColor = "transparent";
                  });
                nextItem.classList.add("active");
                nextItem.style.fontWeight = "bold";
                nextItem.style.backgroundColor = "#e3e3e3";
                selectedCategoryOrFolder = nextItem.textContent;
                renderContentPanel(nextItem.textContent);
              }
            }
          } else if (navItems.length > 0) {
            setFocus(navItems[0]);
            document
              .querySelectorAll(".nav-item, .folder-item")
              .forEach((item) => {
                item.classList.remove("active");
                item.style.fontWeight = "normal";
                item.style.backgroundColor = "transparent";
              });
            navItems[0].classList.add("active");
            navItems[0].style.fontWeight = "bold";
            navItems[0].style.backgroundColor = "#e3e3e3";
            selectedCategoryOrFolder = navItems[0].textContent;
            renderContentPanel(navItems[0].textContent);
          }
        } else if (e.key === "ArrowUp") {
          if (currentFocusElement) {
            const items =
              currentFocusElement.classList.contains("nav-item") ||
              currentFocusElement.classList.contains("folder-item")
                ? navItems
                : contentItems;
            const currentIndex = items.indexOf(currentFocusElement);
            if (currentIndex > 0) {
              const prevItem = items[currentIndex - 1];
              setFocus(prevItem);
              if (
                prevItem.classList.contains("nav-item") ||
                prevItem.classList.contains("folder-item")
              ) {
                document
                  .querySelectorAll(".nav-item, .folder-item")
                  .forEach((item) => {
                    item.classList.remove("active");
                    item.style.fontWeight = "normal";
                    item.style.backgroundColor = "transparent";
                  });
                prevItem.classList.add("active");
                prevItem.style.fontWeight = "bold";
                prevItem.style.backgroundColor = "#e3e3e3";
                selectedCategoryOrFolder = prevItem.textContent;
                renderContentPanel(prevItem.textContent);
              }
            }
          } else if (navItems.length > 0) {
            setFocus(navItems[0]);
            document
              .querySelectorAll(".nav-item, .folder-item")
              .forEach((item) => {
                item.classList.remove("active");
                item.style.fontWeight = "normal";
                item.style.backgroundColor = "transparent";
              });
            navItems[0].classList.add("active");
            navItems[0].style.fontWeight = "bold";
            navItems[0].style.backgroundColor = "#e3e3e3";
            selectedCategoryOrFolder = navItems[0].textContent;
            renderContentPanel(navItems[0].textContent);
          }
        } else if (e.key === "ArrowRight") {
          if (
            currentFocusElement &&
            (currentFocusElement.classList.contains("nav-item") ||
              currentFocusElement.classList.contains("folder-item"))
          ) {
            const firstContentItem =
              contentPanel.querySelector(".dropdown-item");
            if (firstContentItem) {
              setFocus(firstContentItem);
            }
          }
        } else if (e.key === "ArrowLeft") {
          if (
            currentFocusElement &&
            currentFocusElement.classList.contains("dropdown-item")
          ) {
            const activeNavItem = navPanel.querySelector(
              ".nav-item.active, .folder-item.active"
            );
            if (activeNavItem) {
              setFocus(activeNavItem);
            } else if (navItems.length > 0) {
              setFocus(navItems[0]);
              document
                .querySelectorAll(".nav-item, .folder-item")
                .forEach((item) => {
                  item.classList.remove("active");
                  item.style.fontWeight = "normal";
                  item.style.backgroundColor = "transparent";
                });
              navItems[0].classList.add("active");
              navItems[0].style.fontWeight = "bold";
              navItems[0].style.backgroundColor = "#e3e3e3";
              selectedCategoryOrFolder = navItems[0].textContent;
              renderContentPanel(navItems[0].textContent);
            }
          }
        } else if (e.key === "Enter") {
          if (currentFocusElement) {
            if (currentFocusElement.classList.contains("dropdown-item")) {
              currentFocusElement.click();
              isDropdownTriggered = false;
              isSlashKeyboardInput = false;
            }
          }
        } else if (e.key === "Escape") {
          isDropdownTriggered = false;
          isSlashKeyboardInput = false;
          hideDropdown();
          isEscaped = true;
          inputField.focus();
        } else if (e.key === "Backspace") {
          const currentText = getInputText(inputField);
          const slashIndex = currentText.lastIndexOf("/");

          if (slashIndex !== -1) {
            let cursorPos = getCursorPosition(inputField);

            if (cursorPos > slashIndex + 1) {
              const queryStart = slashIndex + 1;
              const queryIndex = cursorPos - queryStart;
              const query = currentText.substring(queryStart);
              const newQuery =
                query.substring(0, queryIndex - 1) +
                query.substring(queryIndex);
              const newText =
                currentText.substring(0, slashIndex + 1) + newQuery;

              setInputText(inputField, newText);
              const newCursorPos = cursorPos - 1; // Cursor wird korrekt nach links verschoben
              setCursorPosition(inputField, newCursorPos);
            } else {
              // Cursor direkt nach dem Slash oder davor: nichts löschen, Cursor bleibt
              setCursorPosition(inputField, slashIndex + 1);
            }
          }
        } else if (e.key === "Delete") {
          const currentText = getInputText(inputField);
          const slashIndex = currentText.lastIndexOf("/");

          if (slashIndex !== -1) {
            let cursorPos = getCursorPosition(inputField);
            const queryStart = slashIndex + 1;
            const query = currentText.substring(queryStart);

            if (cursorPos >= queryStart && cursorPos < currentText.length) {
              const queryIndex = cursorPos - queryStart;
              const newQuery =
                query.substring(0, queryIndex) +
                query.substring(queryIndex + 1);
              const newText =
                currentText.substring(0, slashIndex + 1) + newQuery;

              setInputText(inputField, newText);
              setCursorPosition(inputField, cursorPos); // Cursor bleibt an der gleichen Position
            }
          }
        }
      }

      function getCursorPosition(el) {
        if (el.selectionStart !== undefined) return el.selectionStart;

        if (el.isContentEditable) {
          const selection = window.getSelection();
          if (!selection.rangeCount) return 0;

          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(el);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          return preCaretRange.toString().length;
        }
        return 0;
      }

      function setCursorPosition(el, pos) {
        if (el.selectionStart !== undefined) {
          el.selectionStart = el.selectionEnd = pos;
          el.focus();
          return;
        }

        if (el.isContentEditable) {
          el.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          let charCount = 0;
          let found = false;

          function traverse(node) {
            if (found) return;
            if (node.nodeType === 3) {
              if (charCount + node.length >= pos) {
                range.setStart(node, pos - charCount);
                range.setEnd(node, pos - charCount);
                found = true;
              }
              charCount += node.length;
            } else {
              for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
              }
            }
          }

          traverse(el);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }

      // Initial data load and render
      updateDropdownData(renderCategoryNavigation);

      // Listen for Chrome storage changes
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local") {
          console.log("Chrome storage changed, updating dropdown...");
          updateDropdownData(() => {
            if (dropdown.style.display === "flex") {
              const query = getInputText(inputField)
                .slice(getInputText(inputField).indexOf("/") + 1)
                .trim();
              if (query) {
                renderSearchResults(query);
              } else {
                renderCategoryNavigation();
                if (selectedCategoryOrFolder) {
                  renderContentPanel(selectedCategoryOrFolder);
                  const activeNavItem = navPanel.querySelector(
                    ".nav-item.active, .folder-item.active"
                  );
                  if (activeNavItem) {
                    setFocus(activeNavItem);
                  }
                }
              }
            }
          });
        }
      });

      // Configurable gaps
      const gapAbove = 2;
      const gapBelow = 2;

      // Function to position the dropdown
      function positionDropdown() {
        const rect = inputField.getBoundingClientRect();
        const dropdownHeight = parseFloat(dropdown.style.maxHeight) || 350;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceNeeded = dropdownHeight + 10;

        dropdown.style.left = `${rect.left + window.scrollX}px`;

        if (spaceBelow < spaceNeeded) {
          dropdown.style.top = `${
            rect.top + window.scrollY - dropdownHeight - gapAbove
          }px`;
          dropdown.style.transform = "translateY(-5px)";
        } else {
          dropdown.style.top = `${rect.bottom + window.scrollY + gapBelow}px`;
          dropdown.style.transform = "translateY(10px)";
        }

        const dropdownRect = dropdown.getBoundingClientRect();
        if (dropdownRect.right > window.innerWidth) {
          dropdown.style.left = `${
            window.innerWidth - dropdownRect.width + window.scrollX - 10
          }px`;
        }
      }

      // Function to show dropdown
      function showDropdown(query = "") {
        dropdown.style.display = "flex";
        positionDropdown();
        requestAnimationFrame(() => {
          dropdown.style.opacity = "1";
          dropdown.style.transform = "translateY(0)";
          if (query) {
            renderSearchResults(query);
            const firstResult = contentPanel.querySelector(".dropdown-item");
            if (firstResult) {
              firstResult.focus();
              setFocus(firstResult);
            }
          } else {
            renderCategoryNavigation();
            const firstNavItem = navPanel.querySelector(".nav-item");
            if (firstNavItem) {
              firstNavItem.focus();
              setFocus(firstNavItem);
            }
          }
        });
      }

      // Function to hide dropdown
      function hideDropdown() {
        dropdown.style.opacity = "0";
        dropdown.style.transform = "translateY(10px)";
        setTimeout(() => {
          dropdown.style.display = "none";
          clearFocus();
          selectedCategoryOrFolder = null;
        }, 300);
      }

      // Replace the existing paste event listener
      inputField.addEventListener("paste", function (e) {
        isPasting = true;
        isSlashKeyboardInput = false; // Prevent dropdown on pasted "/"
        setTimeout(() => {
          isPasting = false;
          const text = getInputText(inputField);
          if (text.includes("/") && !isSlashKeyboardInput) {
            isDropdownTriggered = false;
            hideDropdown();
          }
        }, 100);
      });

      // Handle input events for dynamic search and dropdown control
      inputField.addEventListener("input", function (e) {
        const text = getInputText(inputField);
        const slashIndex = text.lastIndexOf("/");

        if (slashIndex !== -1 && isSlashKeyboardInput && !isPasting) {
          isDropdownTriggered = true;
          const query = text
            .slice(slashIndex + 1)
            .trim()
            .toLowerCase();
          if (isEscaped && text.lastIndexOf("/") === slashIndex) {
            if (!query) {
              isEscaped = false;
              showDropdown(query);
            }
          } else {
            isEscaped = false;
            showDropdown(query);
          }
        } else if (!text.includes("/") && !dropdown.dataset.openedByButton) {
          isDropdownTriggered = false;
          isSlashKeyboardInput = false;
          hideDropdown();
          isEscaped = false;
        }
      });

      // Prevent Enter key from submitting when dropdown is open
      inputField.addEventListener("keydown", function (e) {
        if (e.key === "/" && !isPasting) {
          isSlashKeyboardInput = true; // Mark "/" as keyboard input
        } else if (e.key === "Enter" && dropdown.style.display === "flex") {
          e.preventDefault();
          e.stopPropagation();
        } else if (e.key === "Escape" && isDropdownTriggered) {
          isDropdownTriggered = false;
          isSlashKeyboardInput = false;
          hideDropdown();
          isEscaped = true;
          inputField.focus();
          e.preventDefault();
        } else if (
          (e.key === "Backspace" || e.key === "Delete") &&
          isDropdownTriggered
        ) {
          setTimeout(() => {
            const text = getInputText(inputField);
            if (!text.includes("/")) {
              isDropdownTriggered = false;
              isSlashKeyboardInput = false;
              hideDropdown();
            }
          }, 0);
        }
      });

      // Global keyboard handler for navigation
      document.addEventListener("keydown", handleKeyboardNavigation);

      // Adjust on resize
      window.addEventListener("resize", () => {
        if (dropdown.style.display === "flex") {
          positionDropdown();
        }
      });

      // Adjust on scroll
      window.addEventListener("scroll", () => {
        if (dropdown.style.display === "flex") {
          positionDropdown();
        }
      });
      function positionTooltip() {
        const buttonRect = button.getBoundingClientRect();
        tooltip.style.left = `${
          buttonRect.left + buttonRect.width / 2 + window.scrollX
        }px`;
        tooltip.style.top = `${buttonRect.top - 40 + window.scrollY}px`;
        tooltip.style.transform = "translateX(-50%)";
        tooltip.style.opacity = "1";
      }
      /* Plus Button */
      const selectorMap = [
        {
          url: "https://chatgpt.com",
          selector: "[data-testid='composer-trailing-actions']",
        }, // ChatGPT
        {
          url: "https://www.perplexity.ai",
          selector: "div.bg-background:nth-child(3)",
        }, // Perplexity
        {
          url: "https://github.com/copilot",
          selector: ".ChatInput-module__toolbarRight--PiQJn",
        }, // GitHub Copilot
        {
          url: "https://grok.com",
          selector: ".ml-auto.flex.flex-row.items-end.gap-1",
        }, // Grok
        {
          url: "https://gemini.google.com",
          selector: ".trailing-actions-wrapper",
        }, // Gemini
        {
          url: "https://duckduckgo.com",
          selector: ".VxPe9cw5s4CtJMWgwO3A.PzT4Zd7XtUNtxwg6HUlG",
        }, // Duckai
        { url: "https://chat.mistral.ai", selector: ".ms-auto.flex.gap-2" }, // Mistral
        {
          url: "https://claude.ai",
          selector: ".flex.gap-2\\.5.w-full.items-center",
        }, // Claude
        { url: "https://www.chat.deepseek.com", selector: ".bf38813a" }, // DeepSeek
        { url: "https://copilot.microsoft.com", selector: ".flex.gap-2" }, // Microsoft Copilot
        {
          url: "https://www.blackbox.ai",
          selector: ".flex.items-center.justify-between.gap-4:nth-child(1)",
        }, // Blackbox
        { url: "https://deepai.org", selector: ".button-container" }, // Deepai
        {
          url: "https://qwen.alibaba.com",
          selector: ".flex.items-end.max-w-10.absolute.right-3",
        }, // Qwen
      ];

      let container = null;
      const currentUrl = window.location.href;

      console.log(currentUrl);

      // Finde den passenden Selektor basierend auf der URL
      const matchedSite = selectorMap.find((site) =>
        currentUrl.startsWith(site.url)
      );

      if (matchedSite) {
        container = document.querySelector(matchedSite.selector);
        if (!container) {
          console.warn(
            `Container not found using selector: '${matchedSite.selector}' for URL: '${currentUrl}'`
          );
        }
      } else {
        console.warn(`No selector mapping found for URL: '${currentUrl}'`);
      }

      if (!container) {
        console.error("No suitable container found for the plus button.");
      } else {
        // Wrapper with shadow root
        const shadowHost = document.createElement("div");
        shadowHost.style.display = "inline-block";
        const shadowRoot = shadowHost.attachShadow({ mode: "closed" });

        // Add styles + button inside shadow DOM
        shadowRoot.innerHTML = `
    <style>
      .plus-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: white;
        color: black;
        border: none;
        cursor: pointer;
        font-weight: bold;
        font-size: 24px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: box-shadow 0.3s ease, transform 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }

      .plus-button:hover {
        background-color: black;
        color: white;
      }

      .tooltip {
        position: fixed;
        background-color: black;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        white-space: nowrap;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }

      .tooltip::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid black;
      }
    </style>
    <button class="plus-button">+</button>
    <div class="tooltip">Open the PromptIn Management Menu</div>
  `;

        const button = shadowRoot.querySelector(".plus-button");
        const tooltip = shadowRoot.querySelector(".tooltip");

        button.addEventListener("mouseout", () => {
          tooltip.style.opacity = "0";
          setTimeout(() => {
            if (tooltip.parentNode === document.body) {
              document.body.removeChild(tooltip);
            }
          }, 200);
        });

        window.addEventListener("scroll", () => {
          if (tooltip.style.opacity === "1") positionTooltip();
        });
        window.addEventListener("resize", () => {
          if (tooltip.style.opacity === "1") positionTooltip();
        });

        // Click behavior
        button.addEventListener("click", (e) => {
          e.preventDefault();
          if (
            typeof dropdown === "undefined" ||
            typeof inputField === "undefined"
          ) {
            console.error("Dropdown or inputField not defined.");
            return;
          }
          if (dropdown.style.display === "flex") {
            hideDropdown();
            delete dropdown.dataset.openedByButton;
            dropdownClosedByUser = false;
            tooltip.textContent = "Open the PromptIn Management Menu";
          } else {
            const currentText = getInputText(inputField);
            if (!currentText.includes("/")) {
              setInputText(inputField, currentText + "/");
            }
            inputField.focus();
            setCursorToEnd(inputField);
            showDropdown();
            dropdown.dataset.openedByButton = "true";
            dropdownClosedByUser = false;
            tooltip.textContent = "Close the PromptIn Management Menu";
          }
        });

        container.appendChild(shadowHost);
      }

      // Periodic check for shortcut and plus button
      setInterval(() => {
        // Re-find input field in case DOM changes
        const inputField = findInputField();
        if (!inputField) {
          console.warn("Input field not found during periodic check.");
          return;
        }

        // Check and restore "/" shortcut functionality
        let isSlashListenerActive = false;
        const inputListeners = (inputField._eventListeners || []).input || [];
        inputListeners.forEach((listener) => {
          if (listener.toString().includes("isSlashKeyboardInput")) {
            isSlashListenerActive = true;
          }
        });

        if (!isSlashListenerActive) {
          console.log("Restoring '/' shortcut listener...");
          inputField.addEventListener("input", function (e) {
            const text = getInputText(inputField);
            const slashIndex = text.lastIndexOf("/");

            if (slashIndex !== -1 && isSlashKeyboardInput && !isPasting) {
              isDropdownTriggered = true;
              const query = text
                .slice(slashIndex + 1)
                .trim()
                .toLowerCase();
              if (isEscaped && text.lastIndexOf("/") === slashIndex) {
                if (!query) {
                  isEscaped = false;
                  showDropdown(query);
                }
              } else {
                isEscaped = false;
                showDropdown(query);
              }
            } else if (
              !text.includes("/") &&
              !dropdown.dataset.openedByButton
            ) {
              isDropdownTriggered = false;
              isSlashKeyboardInput = false;
              hideDropdown();
              isEscaped = false;
            }
          });

          inputField.addEventListener("keydown", function (e) {
            if (e.key === "/" && !isPasting) {
              isSlashKeyboardInput = true;
            } else if (e.key === "Enter" && dropdown.style.display === "flex") {
              e.preventDefault();
              e.stopPropagation();
            } else if (e.key === "Escape" && isDropdownTriggered) {
              isDropdownTriggered = false;
              isSlashKeyboardInput = false;
              hideDropdown();
              isEscaped = true;
              inputField.focus();
              e.preventDefault();
            } else if (
              (e.key === "Backspace" || e.key === "Delete") &&
              isDropdownTriggered
            ) {
              setTimeout(() => {
                const text = getInputText(inputField);
                if (!text.includes("/")) {
                  isDropdownTriggered = false;
                  isSlashKeyboardInput = false;
                  hideDropdown();
                }
              }, 0);
            }
          });
        }

        // Check and restore plus button
        const matchedSite = selectorMap.find((site) =>
          window.location.href.startsWith(site.url)
        );
        if (!matchedSite) {
          console.warn(
            "No selector mapping found for current URL during periodic check."
          );
          return;
        }

        let container = document.querySelector(matchedSite.selector);
        if (!container) {
          console.warn(
            `Container not found using selector: '${matchedSite.selector}' during periodic check.`
          );
          return;
        }

        // Check for the shadowHost instead of the button to avoid duplicates
        const existingShadowHost = container.querySelector(
          "div[style='display: inline-block;']"
        );
        if (!existingShadowHost) {
          console.log("Restoring plus button...");
          const shadowHost = document.createElement("div");
          shadowHost.style.display = "inline-block";
          const shadowRoot = shadowHost.attachShadow({ mode: "closed" });

          shadowRoot.innerHTML = `
    <style>
      .plus-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: white;
        color: black;
        border: none;
        cursor: pointer;
        font-weight: bold;
        font-size: 24px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: box-shadow 0.3s ease, transform 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .plus-button:hover {
        background-color: black;
        color: white;
      }
      .tooltip {
        position: fixed;
        background-color: black;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        white-space: nowrap;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .tooltip::after {
        content: '';
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid black;
      }
    </style>
    <button class="plus-button">+</button>
    <div class="tooltip">Open the PromptIn Management Menu</div>
  `;

          const button = shadowRoot.querySelector(".plus-button");
          const tooltip = shadowRoot.querySelector(".tooltip");

          button.title = "Display the menu";
          button.addEventListener("mouseout", () => {
            tooltip.style.opacity = "0";
            setTimeout(() => {
              if (tooltip.parentNode === document.body) {
                document.body.removeChild(tooltip);
              }
            }, 200);
          });

          window.addEventListener("scroll", () => {
            if (tooltip.style.opacity === "1") positionTooltip();
          });
          window.addEventListener("resize", () => {
            if (tooltip.style.opacity === "1") positionTooltip();
          });

          button.addEventListener("click", (e) => {
            e.preventDefault();
            if (
              typeof dropdown === "undefined" ||
              typeof inputField === "undefined"
            ) {
              console.error("Dropdown or inputField not defined.");
              return;
            }
            if (dropdown.style.display === "flex") {
              hideDropdown();
              delete dropdown.dataset.openedByButton;
              dropdownClosedByUser = false;
              tooltip.textContent = "Open the PromptIn Management Menu";
            } else {
              const currentText = getInputText(inputField);
              if (!currentText.includes("/")) {
                setInputText(inputField, currentText + "/");
              }
              inputField.focus();
              setCursorToEnd(inputField);
              showDropdown();
              dropdown.dataset.openedByButton = "true";
              dropdownClosedByUser = false;
              tooltip.textContent = "Close the PromptIn Management Menu";
            }
          });

          container.appendChild(shadowHost);
        }
      }, 5000); // Check every 5 seconds
    }, 2000);
  });
}
function updatePromptLastUsed(folderId, promptIndex) {
  chrome.storage.local.get(folderId, function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      return;
    }
    const topic = data[folderId];
    if (!topic || !topic.prompts[promptIndex]) {
      console.error(
        `No prompt found at index ${promptIndex} in folder ${folderId}`
      );
      return;
    }

    topic.prompts[promptIndex].lastUsed = Date.now();
    topic.prompts[promptIndex].usageCount =
      (topic.prompts[promptIndex].usageCount || 0) + 1;

    chrome.storage.local.set({ [folderId]: topic }, function () {
      if (chrome.runtime.lastError) {
        console.error("Error updating prompt data:", chrome.runtime.lastError);
      } else {
        console.log(
          `lastUsed and usageCount updated for prompt in ${folderId}`
        );
        updateDropdownData(() => {
          if (dropdown.style.display === "flex") {
            renderCategoryNavigation();
            if (selectedCategoryOrFolder) {
              renderContentPanel(selectedCategoryOrFolder);
            }
          }
        });
      }
    });
  });
}
function findPromptIndex(folderId, prompt) {
  return new Promise((resolve) => {
    chrome.storage.local.get(folderId, function (data) {
      if (
        chrome.runtime.lastError ||
        !data[folderId] ||
        !data[folderId].prompts
      ) {
        console.error("Error fetching prompts for folder:", folderId);
        resolve(-1);
        return;
      }
      const prompts = data[folderId].prompts;
      const index = prompts.findIndex(
        (p) =>
          (typeof p === "string" &&
            typeof prompt === "string" &&
            p === prompt) ||
          (typeof p !== "string" &&
            typeof prompt !== "string" &&
            p.title === prompt.title &&
            p.content === prompt.content)
      );
      if (index === -1) {
        console.warn(`Prompt not found in folder ${folderId}:`, prompt);
      }
      resolve(index);
    });
  });
}

function setInputText(element, text) {
  return new Promise((resolve) => {
    element.innerText = "";
    element.innerText = text;
    element.dispatchEvent(new Event("input", { bubbles: true }));

    // Warten bis zur nächsten Event-Loop-Tick, damit DOM aktualisiert wird
    requestAnimationFrame(() => {
      setTimeout(resolve, 50); // kleiner Puffer für Sicherheit
    });
  });
}

// Function to show modal for dynamic variables in a workflow
function showDynamicVariablesModal(workflowId) {
  const inputField = document.getElementById("prompt-textarea");
  if (inputField) {
    inputField.innerText = "";
  }

  console.log("Fetching workflow with ID:", workflowId);
  chrome.storage.local.get(workflowId, function (data) {
    if (chrome.runtime.lastError) {
      console.error(
        "Error fetching workflow from Chrome storage:",
        chrome.runtime.lastError
      );
      alert("Failed to load workflow. Please try again.");
      return;
    }

    const workflow = data[workflowId];
    if (!workflow || !workflow.name || !Array.isArray(workflow.steps)) {
      console.error(
        "Invalid or missing workflow data for ID:",
        workflowId,
        workflow
      );
      alert("Invalid workflow data. Please check the workflow configuration.");
      return;
    }

    console.log("Creating modal for workflow:", workflow.name);
    const modal = document.createElement("div");
    modal.className = "modal";
    Object.assign(modal.style, {
      display: "block",
      position: "fixed",
      zIndex: "10001",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.4)",
    });

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    Object.assign(modalContent.style, {
      backgroundColor: "#fefefe",
      margin: "15% auto",
      padding: "20px",
      color: "black",
      border: "1px solid #888",
      width: "80%",
      maxWidth: "600px",
      borderRadius: "8px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    });

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.style.cssText =
      "display: flex; justify-content: space-between; align-items: center;";
    modalHeader.innerHTML = `<span class="close" style="color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer;">×</span><h2>Configure Workflow: ${workflow.name}</h2>`;

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.style.cssText = "max-height: 400px; overflow-y: auto;";

    // Kein form, sondern einfacher div container
    const stepsContainer = document.createElement("div");
    stepsContainer.id = "workflow-steps";

    // Buttons Container
    const buttonsDiv = document.createElement("div");
    buttonsDiv.style.marginTop = "15px";
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.gap = "10px";

    const addRepetitionBtn = document.createElement("button");
    addRepetitionBtn.type = "button";
    addRepetitionBtn.className = "action-btn";
    addRepetitionBtn.textContent = "Add Repetition +";

    const sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.className = "action-btn";
    sendBtn.textContent = "Send";

    buttonsDiv.appendChild(addRepetitionBtn);
    buttonsDiv.appendChild(sendBtn);

    modalBody.appendChild(stepsContainer);
    modalBody.appendChild(buttonsDiv);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // ** Hier speichern wir die Eingabewerte für jede Repetition + Step **
    // Format: repetitions[repIndex][stepIndex][variableName] = value
    const repetitions = [];

    // Hilfsfunktionen: dynamic vars prüfen und extrahieren
    function hasDynamicVariables(prompt) {
      return typeof prompt === "string" && /\{[^}]+\}/.test(prompt);
    }

    function extractVariables(prompt) {
      if (typeof prompt !== "string") return [];
      const matches = prompt.match(/\{\{([^}]+)\}\}/g);
      return matches ? matches.map((m) => m.slice(1, -1)) : [];
    }

    // Neue Repetition initialisieren
    function initRepetition() {
      const repData = workflow.steps.map((step) => {
        if (step.customPrompt && hasDynamicVariables(step.customPrompt)) {
          const vars = extractVariables(step.customPrompt);
          const varObj = {};
          vars.forEach((v) => (varObj[v] = ""));
          return varObj;
        } else {
          return null;
        }
      });
      return repData;
    }

    // Beim Start eine Repetition anlegen
    if (repetitions.length === 0) repetitions.push(initRepetition());

    // Rendern der Schritte und Inputs
    function renderSteps() {
      stepsContainer.innerHTML = "";

      repetitions.forEach((repData, repIndex) => {
        const repDiv = document.createElement("div");
        repDiv.className = "repetition";
        repDiv.style.cssText =
          "margin-left: 20px; padding: 10px; border-left: 2px solid #ddd;";

        repDiv.innerHTML = `<h3>Execution ${repIndex + 1}</h3>`;

        workflow.steps.forEach((step, stepIndex) => {
          if (step.customPrompt && hasDynamicVariables(step.customPrompt)) {
            const variables = extractVariables(step.customPrompt);
            const stepDiv = document.createElement("div");
            stepDiv.className = "step-group";
            stepDiv.style.cssText =
              "margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;";

            stepDiv.innerHTML = `<h4>${
              step.title || "Step " + (stepIndex + 1)
            }</h4><p style="font-size: 12px; color: #666; margin: 5px 0;">${
              step.customPrompt
            }</p>`;

            variables.forEach((variable) => {
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = variable;
              input.dataset.variable = variable;
              input.dataset.stepIndex = stepIndex;
              input.dataset.repIndex = repIndex;

              // Wert aus repetitions-Array setzen, falls vorhanden
              input.value = repData[stepIndex]?.[variable] || "";

              input.addEventListener("input", (e) => {
                const val = e.target.value;
                repetitions[repIndex][stepIndex][variable] = val;
                updatePreview(stepIndex, repIndex);
              });

              stepDiv.appendChild(input);
            });

            const preview = document.createElement("div");
            preview.className = "preview";
            preview.dataset.stepIndex = stepIndex;
            preview.dataset.repIndex = repIndex;
            preview.style.cssText =
              "margin-top: 10px; padding: 10px; background-color: #f8f8f8; border-radius: 4px;";

            stepDiv.appendChild(preview);
            repDiv.appendChild(stepDiv);
          }
        });

        if (repDiv.children.length > 1) {
          stepsContainer.appendChild(repDiv);
        }
      });

      if (stepsContainer.children.length === 0) {
        stepsContainer.innerHTML =
          "<p>No dynamic variables found in this workflow.</p>";
      } else {
        updateAllPreviews();
      }
    }

    // Vorschau updaten
    function updatePreview(stepIndex, repIndex) {
      const step = workflow.steps[stepIndex];
      if (!step || !step.customPrompt) return;
      let previewText = step.customPrompt;

      const vars = extractVariables(step.customPrompt);
      vars.forEach((variable) => {
        const val =
          repetitions[repIndex][stepIndex]?.[variable] || `{${variable}}`;
        previewText = previewText.replace(`{${variable}}`, val);
      });

      const previewElement = stepsContainer.querySelector(
        `.preview[data-step-index="${stepIndex}"][data-rep-index="${repIndex}"]`
      );
      if (previewElement) {
        previewElement.textContent = previewText;
      }
    }

    // Alle Vorschauen updaten
    function updateAllPreviews() {
      workflow.steps.forEach((step, stepIndex) => {
        if (step.customPrompt && hasDynamicVariables(step.customPrompt)) {
          repetitions.forEach((_, repIndex) => {
            updatePreview(stepIndex, repIndex);
          });
        }
      });
    }

    // Button-Handler: Neue Repetition hinzufügen
    addRepetitionBtn.addEventListener("click", () => {
      repetitions.push(initRepetition());
      renderSteps();
    });

    // Button-Handler: Send
    sendBtn.addEventListener("click", async () => {
      // Alle Prompts sammeln aus repetitions + workflow
      const executions = repetitions.map((repData, repIndex) => {
        return workflow.steps.map((step, stepIndex) => {
          if (!step.customPrompt || !hasDynamicVariables(step.customPrompt)) {
            return step.customPrompt || "";
          }
          let promptText = step.customPrompt;
          const vars = extractVariables(step.customPrompt);
          vars.forEach((variable) => {
            const val = repData[stepIndex]?.[variable] || `{${variable}}`;
            promptText = promptText.replace(`{${variable}}`, val);
          });
          return promptText;
        });
      });

      const allPrompts = executions.flat();

      modal.remove(); // Modal schließen

      for (const prompt of allPrompts) {
        await sendPrompt(prompt);
      }
      console.log("Workflow execution completed.");
    });

    // Hilfsfunktion zum Eingeben und Senden des Prompts
    async function sendPrompt(prompt) {
      const inputField = document.getElementById("prompt-textarea");
      if (!inputField) {
        console.error("Input field not found.");
        return;
      }

      // Warten bis der Text wirklich gesetzt wurde
      await setInputText(inputField, prompt);

      const sendButton = document.querySelector("[data-testid='send-button']");
      if (sendButton) {
        sendButton.click();
      } else {
        inputField.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
        );
      }

      await waitForProcessing();
    }

    async function waitForProcessing() {
      const stopButtonSelector = "[data-testid='stop-button']";

      while (!document.querySelector(stopButtonSelector)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      while (document.querySelector(stopButtonSelector)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Modal schließen
    modalHeader.querySelector(".close").onclick = () => modal.remove();
    window.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    // Initial render
    renderSteps();
  });
}
