function inputFieldTrigger() {
  console.log("inputFieldTrigger is running!");

  // Levenshtein Distance Funktion
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
          matrix[j][i - 1] + 1, // Deletion
          matrix[j - 1][i] + 1, // Insertion
          matrix[j - 1][i - 1] + indicator // Substitution
        );
      }
    }
    return matrix[b.length][a.length];
  }

  // Hilfsfunktion zur Bestimmung der Zugriffsmethode
  function getInputFieldAccessMethod(inputField) {
    if (!inputField) return { read: "innerText", write: "innerText" };

    // Zuordnung basierend auf Selektor und Kommentaren
    const selectors = [
      {
        selector: "#prompt-textarea", // ChatGPT
        read: "innerText",
        write: "innerText",
      },
      {
        selector: "textarea", // Grok, Blackbox, Microsoft Copilot, Mistral, Duckduckgo, Perplexity, DeepSeek, Deepai
        read: "value",
        write: "value",
      },
      {
        selector: "[role='textbox']", // Gemini
        read: "value", // Gemini verwendet value gemäß Kommentar
        write: "value",
      },
      {
        selector: "[enterkeyhint='enter']", // Claude
        read: "innerText",
        write: "innerText",
      },
      {
        selector: "textarea#copilot-chat-textarea", // GitHub
        read: "value",
        write: "value",
      },
    ];

    // Finde den passenden Selektor
    for (const { selector, read, write } of selectors) {
      if (inputField.matches(selector)) {
        return { read, write };
      }
    }

    // Fallback: Prüfe den Elementtyp
    if (inputField.tagName === "TEXTAREA" || inputField.tagName === "INPUT") {
      return { read: "value", write: "value" };
    }
    return { read: "innerText", write: "innerText" };
  }

  // Hilfsfunktion zum Lesen des Textes
  function getInputText(inputField) {
    const { read } = getInputFieldAccessMethod(inputField);
    return inputField[read]?.trim() || "";
  }

  // Hilfsfunktion zum Schreiben des Textes
  function setInputText(inputField, text) {
    const { write } = getInputFieldAccessMethod(inputField);
    inputField[write] = text;
  }

  // Funktion zum Setzen des Cursors ans Ende
  function setCursorToEnd(element) {
    const { read } = getInputFieldAccessMethod(element);

    if (read === "innerText") {
      // Für contenteditable oder div-Elemente
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Für textarea oder input
      if (element && typeof element.value === "string") {
        element.focus();
        const len = element.value.length;

        // Alternativ zu setSelectionRange
        element.selectionStart = len;
        element.selectionEnd = len;
      } else {
        console.warn(
          "Element does not support value-based cursor positioning."
        );
        element.focus();
      }
    }
  }

  // Warte, bis das DOM geladen ist
  document.addEventListener("DOMContentLoaded", () => {
    // Warte zusätzlich 2 Sekunden nach DOM-Laden
    setTimeout(() => {
      let inputField =
        // ChatGPT
        // using innerText
        document.getElementById("prompt-textarea") ||
        // Grok, Blackbox, Microsoft Copilot, Mistral, Duckduckgo, Perplexity, DeepSeek, Deepai
        document.querySelector("textarea") ||
        // using value
        // Gemini
        // using innerText
        document.querySelector("[role='textbox']") ||
        // Claude
        // using innerText
        document.querySelector("[enterkeyhint='enter']") ||
        // GitHub
        // using innerText
        document.querySelector("textarea#copilot-chat-textarea");

      if (!inputField) {
        console.error("Nothing possible");
      }

      if (!document.body) {
        console.error("Document body is not available.");
      }

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
            }
          }
        } else if (e.key === "Escape") {
          hideDropdown();
          isEscaped = true;
          inputField.focus();
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
                    `.nav-item.active, .folder-item.active`
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

      // Konfigurierbare Abstände
      const gapAbove = 2;
      const gapBelow = 2;

      // Funktion zum Positionieren des Dropdowns
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

      // Handle paste events
      inputField.addEventListener("paste", function (e) {
        isPasting = true;
        setTimeout(() => {
          isPasting = false;
        }, 100);
      });

      // Handle input events for dynamic search and dropdown control
      inputField.addEventListener("input", function (e) {
        const text = getInputText(inputField);
        const slashIndex = text.indexOf("/");

        if (slashIndex !== -1 && !isPasting) {
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
          hideDropdown();
          isEscaped = false;
        }
      });

      // Prevent Enter key from submitting when dropdown is open
      inputField.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && dropdown.style.display === "flex") {
          e.preventDefault();
          e.stopPropagation();
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

      // For ChatGPT
      let container = document.querySelector(
        "[data-testid='composer-trailing-actions']"
      );

      if (!container) {
        console.error(
          "Container with data-testid='composer-trailing-actions' not found."
        );

        const selectors = [
          "div.bg-background:nth-child(3)", // Perplexity
          ".ChatInput-module__trailingActions--q2BNB", // GitHub Copilot
          ".ml-auto.flex.flex-row.items-end.gap-1", // Grok
          ".trailing-actions-wrapper", // Gemini
          ".fTx8kArcxKUd9ZBMcuCc", // Duckai
          ".ms-auto.flex.gap-2", // Mistral
          ".flex.gap-2\\.5.w-full.items-center", // Claude
          ".bf38813a", // DeepSeek
          ".flex.gap-2", // Microsoft Copilot
          ".absolute.right-2.top-4.flex.items-end", // Blackbox
          ".button-container", // Deepai
          ".flex.items-end.max-w-10.absolute.right-3", // Qwen
        ];

        for (const selector of selectors) {
          container = document.querySelector(selector);
          if (container) break;
          console.error(`Container not found using selector: '${selector}'`);
        }
      }

      const button = document.createElement("button");
      button.textContent = "+";
      button.style.width = "40px";
      button.style.height = "40px";
      button.style.borderRadius = "50%";
      button.style.backgroundColor = "white";
      button.style.color = "black";
      button.style.border = "none";
      button.style.cursor = "pointer";
      button.style.objectFit = "contain";
      button.style.fontWeight = "bold";
      button.style.fontSize = "24px";
      button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      button.style.transition = "box-shadow 0.3s ease, transform 0.2s ease";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";
      button.style.position = "relative";

      // Tooltip-Element erstellen
      const tooltip = document.createElement("div");
      tooltip.textContent = "Open the PromptIn Management Menu";
      tooltip.style.position = "fixed";
      tooltip.style.backgroundColor = "black";
      tooltip.style.color = "white";
      tooltip.style.padding = "8px 12px";
      tooltip.style.borderRadius = "4px";
      tooltip.style.fontSize = "14px";
      tooltip.style.whiteSpace = "nowrap";
      tooltip.style.zIndex = "1000";
      tooltip.style.opacity = "0";
      tooltip.style.pointerEvents = "none";
      tooltip.style.transition = "opacity 0.2s ease";

      // Pfeil für Tooltip
      tooltip.style.setProperty("--tooltip-arrow-size", "6px");
      tooltip.innerHTML += `
  <div style="
    position: absolute;
    bottom: calc(-1 * var(--tooltip-arrow-size));
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: var(--tooltip-arrow-size) solid transparent;
    border-right: var(--tooltip-arrow-size) solid transparent;
    border-top: var(--tooltip-arrow-size) solid black;
  "></div>
`;

      // Funktion zum Positionieren des Tooltips
      function positionTooltip() {
        const rect = button.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 45}px`;
        tooltip.style.transform = "translateX(-50%)";
      }

      // Hover-Effekte für Button und Tooltip
      button.addEventListener("mouseover", () => {
        button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
        button.style.color = "white";
        button.style.backgroundColor = "black";
        positionTooltip();
        document.body.appendChild(tooltip);
        tooltip.style.opacity = "1";
      });

      button.addEventListener("mouseout", () => {
        button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        button.style.color = "black";
        button.style.backgroundColor = "white";
        tooltip.style.opacity = "0";
        setTimeout(() => {
          if (tooltip.parentNode) {
            document.body.removeChild(tooltip);
          }
        }, 200);
      });

      // Bei Fenstergrößenänderung oder Scroll repositionieren
      window.addEventListener("resize", () => {
        if (tooltip.style.opacity === "1") {
          positionTooltip();
        }
      });
      window.addEventListener("scroll", () => {
        if (tooltip.style.opacity === "1") {
          positionTooltip();
        }
      });

      // Click-Handler
      button.addEventListener("click", (e) => {
        e.preventDefault();
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

      // Button zum DOM hinzufügen
      container.appendChild(button);
    }, 2000);
  });
}
