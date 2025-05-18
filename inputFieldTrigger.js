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
        chrome.storage.sync.get(null, function (data) {
          if (chrome.runtime.lastError) {
            console.error(
              "Error fetching data from Chrome storage:",
              chrome.runtime.lastError
            );
            return;
          }

          categories = {
            Favorites: [],
            "All Prompts": [],
            "Single Prompts": [],
            "Categorised Prompts": { all: [] },
          };
          promptSourceMap = new Map();

          Object.entries(data).forEach(([id, topic]) => {
            if (
              topic.prompts &&
              Array.isArray(topic.prompts) &&
              !topic.isTrash
            ) {
              topic.prompts.forEach((prompt) => {
                const title =
                  typeof prompt === "string"
                    ? prompt.slice(0, 50)
                    : prompt.title || "Untitled Prompt";
                const content =
                  typeof prompt === "string" ? prompt : prompt.content || "";

                // Add to All Prompts
                categories["All Prompts"].push(title);
                promptSourceMap.set(title + "_" + id, {
                  category: "All Prompts",
                  folder: null,
                  prompt: prompt,
                  folderId: id,
                });

                // Add to Single Prompts if hidden
                if (topic.isHidden) {
                  categories["Single Prompts"].push(title);
                  promptSourceMap.set(title + "_" + id, {
                    category: "Single Prompts",
                    folder: null,
                    prompt: prompt,
                    folderId: id,
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
                  promptSourceMap.set(title + "_" + id, {
                    category: "Categorised Prompts",
                    folder: topic.name,
                    prompt: prompt,
                    folderId: id,
                  });
                }

                // Add to Favorites if isFavorite is true
                if (prompt.isFavorite) {
                  categories["Favorites"].push(title);
                  promptSourceMap.set(title + "_" + id, {
                    category: "Favorites",
                    folder: topic.isHidden ? null : topic.name,
                    prompt: prompt,
                    folderId: id,
                  });
                }
              });
            }
          });

          Object.keys(categories).forEach((key) => {
            if (Array.isArray(categories[key])) {
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
              if (!currentFocusElement || currentFocusElement !== contentItem) {
                contentItem.style.backgroundColor = "#f8f8f8";
              }
            });

            contentItem.addEventListener("mouseout", () => {
              if (!currentFocusElement || currentFocusElement !== contentItem) {
                contentItem.style.backgroundColor = "white";
              }
            });

            contentItem.addEventListener("click", () => {
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
            });

            contentPanel.appendChild(contentItem);
          });
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

        const allPrompts = [];
        promptSourceMap.forEach((source, key) => {
          const title = key.split("_")[0];
          allPrompts.push({ title, source });
        });

        const scoredPrompts = allPrompts.map(({ title, source }) => {
          const distance = levenshteinDistance(
            title.toLowerCase(),
            query.toLowerCase()
          );
          return { title, source, distance };
        });

        scoredPrompts.sort((a, b) => a.distance - b.distance);

        if (scoredPrompts.length === 0) {
          const noResults = document.createElement("div");
          noResults.textContent = "No matching prompts found";
          noResults.style.padding = "10px";
          noResults.style.color = "#888";
          contentPanel.appendChild(noResults);
        } else {
          scoredPrompts.forEach(({ title, source }) => {
            const contentItem = document.createElement("div");
            const displayText = source.folder
              ? `${title} (in ${source.folder})`
              : `${title} (${source.category})`;
            contentItem.textContent = displayText;
            contentItem.style.padding = "10px";
            contentItem.style.cursor = "pointer";
            contentItem.style.borderRadius = "4px";
            contentItem.style.transition = "background-color 0.2s ease";
            contentItem.className = "dropdown-item";
            contentItem.tabIndex = 0;

            contentItem.addEventListener("mouseover", () => {
              if (!currentFocusElement || currentFocusElement !== contentItem) {
                contentItem.style.backgroundColor = "#f8f8f8";
              }
            });

            contentItem.addEventListener("mouseout", () => {
              if (!currentFocusElement || currentFocusElement !== contentItem) {
                contentItem.style.backgroundColor = "white";
              }
            });

            contentItem.addEventListener("click", () => {
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
            });

            contentPanel.appendChild(contentItem);
          });
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
        if (area === "sync") {
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
          url: "https://github.com",
          selector: ".ChatInput-module__trailingActions--q2BNB",
        }, // GitHub Copilot
        {
          url: "https://grok.com",
          selector: ".ml-auto.flex.flex-row.items-end.gap-1",
        }, // Grok
        {
          url: "https://gemini.google.com",
          selector: ".trailing-actions-wrapper",
        }, // Gemini
        { url: "https://duck.ai", selector: ".fTx8kArcxKUd9ZBMcuCc" }, // Duckai
        { url: "https://chat.mistral.ai", selector: ".ms-auto.flex.gap-2" }, // Mistral
        {
          url: "https://claude.ai",
          selector: ".flex.gap-2\\.5.w-full.items-center",
        }, // Claude
        { url: "https://www.deepseek.com", selector: ".bf38813a" }, // DeepSeek
        { url: "https://copilot.microsoft.com", selector: ".flex.gap-2" }, // Microsoft Copilot
        {
          url: "https://blackbox.ai",
          selector:
            ".flex.items-center.gap-2.overflow-hidden.whitespace-nowrap",
        }, // Blackbox
        { url: "https://deepai.org", selector: ".button-container" }, // Deepai
        {
          url: "https://qwen.alibaba.com",
          selector: ".flex.items-end.max-w-10.absolute.right-3",
        }, // Qwen
      ];

      let container = null;
      const currentUrl = window.location.href;

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
    }, 2000);
  });
}
