const extPay = ExtPay("promptin"); // ExtPay global verfügbar

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

// Mapping of domains to model names (moved to global scope)
const domainToModelMap = {
  "chatgpt.com": "ChatGPT",
  "grok.com": "Grok",
  "gemini.google.com": "Gemini",
  "claude.ai": "Claude",
  "blackbox.ai": "BlackBox",
  "github.com": "GitHub Copilot",
  "copilot.microsoft.com": "Microsoft Copilot",
  "chat.mistral.ai": "Mistral",
  "duckduckgo.com": "DuckDuckGo AI Chat",
  "perplexity.ai": "Perplexity",
  "chat.deepseek.com": "DeepSeek",
  "deepai.org": "DeepAI",
  "chat.qwen.ai": "Qwen AI",
};

// Function to get current mode based on domain
function getCurrentMode() {
  const currentDomain = window.location.hostname;
  for (const [domain, model] of Object.entries(domainToModelMap)) {
    if (currentDomain.includes(domain)) {
      return model;
    }
  }
  return null; // Fallback if no matching domain is found
}

// Function to update dropdown data from Chrome storage
function updateDropdownData(callback) {
  chrome.storage.local.get(["prompts", "folders", "workflows"], (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        "Error fetching data from Chrome storage:",
        chrome.runtime.lastError
      );
      return;
    }

    const currentMode = getCurrentMode();

    categories = {
      Recommended: [],
      "Last Used": [],
      Favorites: [],
      Workflows: [],
      "All Prompts": [],
      "Single Prompts": [],
      "Categorised Prompts": { all: [] },
    };
    promptSourceMap = new Map();
    const allPrompts = [];

    // Workflows
    const workflows = data.workflows || {};
    for (const [workflowId, workflow] of Object.entries(workflows)) {
      if (!workflow.isTrash) {
        categories.Workflows.push(workflow.name);
        promptSourceMap.set(`${workflow.name}_${workflowId}`, {
          category: "Workflows",
          workflow,
          workflowId,
        });
      }
    }

    const prompts = data.prompts || {};
    const folders = data.folders || {};

    // Alle Prompts durchgehen
    let recommended = [];
    for (const [promptId, prompt] of Object.entries(prompts)) {
      if (prompt.isTrash) continue;

      const title = prompt.title || "Untitled Prompt";
      const folderId = prompt.folderId || null;
      const folder = folderId && folders[folderId]?.name;
      const lastUsed = prompt.lastUsed || 0;

      const key = `${title}_${promptId}`;

      allPrompts.push({
        title,
        prompt,
        folderId,
        promptId,
        lastUsed,
        folder: folder || null,
      });

      // Recommended (filtered by compatibleModels)
      if (
        currentMode &&
        Array.isArray(prompt.compatibleModels) &&
        prompt.compatibleModels.includes(currentMode)
      ) {
        recommended.push({
          title,
          usageCount: prompt.usageCount || 0,
          key,
          folder,
          prompt,
          folderId,
          promptId,
        });
        promptSourceMap.set(key, {
          category: "Recommended",
          folder,
          prompt,
          folderId,
          promptId,
        });
      }

      // All Prompts
      categories["All Prompts"].push(title);
      promptSourceMap.set(key, {
        category: "All Prompts",
        folder,
        prompt,
        folderId,
        promptId,
      });

      // Single Prompts (folderId null)
      if (folderId === null) {
        categories["Single Prompts"].push(title);
        promptSourceMap.set(key, {
          category: "Single Prompts",
          folder: null,
          prompt,
          folderId,
          promptId,
        });
      }

      // Categorised Prompts
      if (folderId && folder) {
        if (!categories["Categorised Prompts"][folder]) {
          categories["Categorised Prompts"][folder] = [];
        }
        categories["Categorised Prompts"][folder].push(title);
        categories["Categorised Prompts"].all.push(`${folder}: ${title}`);
        promptSourceMap.set(key, {
          category: "Categorised Prompts",
          folder,
          prompt,
          folderId,
          promptId,
        });
      }

      // Favorites
      if (prompt.isFavorite) {
        categories["Favorites"].push(title);
        promptSourceMap.set(key, {
          category: "Favorites",
          folder: folder || null,
          prompt,
          folderId,
          promptId,
        });
      }
    }

    // Sort Recommended by usageCount descending
    recommended.sort((a, b) => b.usageCount - a.usageCount);
    categories["Recommended"] = recommended.map((r) => r.title);

    // Sort Last Used
    allPrompts.sort((a, b) => b.lastUsed - a.lastUsed);
    categories["Last Used"] = [];
    allPrompts
      .slice(0, 10)
      .forEach(({ title, prompt, folderId, promptId, folder }) => {
        const key = `${title}_${promptId}`;
        categories["Last Used"].push(title);
        promptSourceMap.set(key, {
          category: "Last Used",
          folder,
          prompt,
          folderId,
          promptId,
        });
      });

    // Alphabetisch sortieren
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

    if (callback) callback();
  });
}

function inputFieldTrigger() {
  // Liste der erlaubten Domains (nur Domains, ohne Pfad)
  const allowedDomains = [
    "grok.com",
    "gemini.google.com",
    "chatgpt.com",
    "claude.ai",
    "blackbox.ai",
    "github.com/copilot",
    "copilot.microsoft.com",
    "chat.mistral.ai",
    "duckduckgo.com", // hier nur Domain
    "perplexity.ai",
    "chat.deepseek.com",
    "deepai.org",
    "chat.qwen.ai",
  ];

  const currentDomain = window.location.hostname
    .toLowerCase()
    .replace(/^www\./, "");

  if (
    !allowedDomains.some(
      (domain) => currentDomain === domain.replace(/^www\./, "")
    )
  ) {
    console.log(
      `Script nicht aktiv auf: ${currentDomain}${window.location.pathname}`
    );
    return;
  }

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
        ).textContent;
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
              if (categoryOrFolder === "Last Used") {
                const lastUsedDate = source.prompt.lastUsed
                  ? new Date(source.prompt.lastUsed).toLocaleString()
                  : "Never used";
                contentItem.textContent = `${displayText} - Last used: ${lastUsedDate}`;
              } else {
                contentItem.textContent = displayText;
              }
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
                if (source.category !== "Workflows") {
                  updatePromptLastUsed(source.promptId);
                }
              });

              contentPanel.appendChild(contentItem);
            });
          }
        }
      }

      // Global variable to track payment status
      let isRecommendedUnlocked = false;

      // Function to check ExtensionPay payment status
      function checkPaymentStatus(callback) {
        try {
          extPay
            .getUser()
            .then((user) => {
              isRecommendedUnlocked =
                user.paid || user.trialPeriod.daysLeft > 0;
              callback();
            })
            .catch((err) => {
              console.error("ExtensionPay error:", err);
              isRecommendedUnlocked = false;
              callback();
            });
        } catch (err) {
          console.error("ExtensionPay not initialized:", err);
          isRecommendedUnlocked = false;
          callback();
        }
      }

      function renderCategoryNavigation() {
        navPanel.style.display = "block";
        contentPanel.style.width = "250px";
        navPanel.innerHTML = "";
        clearFocus();

        Object.keys(categories).forEach((category) => {
          const navItem = document.createElement("div");
          // Add lock symbol for Recommended if not unlocked
          const lockSymbol =
            category === "Recommended" && !isRecommendedUnlocked ? " 🔒" : "";
          navItem.textContent = `${category}${lockSymbol}`;
          navItem.style.padding = "10px";
          navItem.style.cursor =
            category === "Recommended" && !isRecommendedUnlocked
              ? "not-allowed"
              : "pointer";
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
            if (category === "Recommended" && !isRecommendedUnlocked) {
              extPay.openPaymentPage("basicmonthly");
              return;
            }
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
        if (
          firstNavItem &&
          (!firstNavItem.textContent.includes("Recommended") ||
            isRecommendedUnlocked)
        ) {
          firstNavItem.click();
        } else if (navPanel.querySelectorAll(".nav-item")[1]) {
          navPanel.querySelectorAll(".nav-item")[1].click(); // Select second item if Recommended is locked
        }
      }

      // Initialize payment status before rendering
      checkPaymentStatus(() => {
        renderCategoryNavigation();
      });

      // Function to render filtered search results
      function renderSearchResults(query) {
        console.log("Rendering search results for query:", query);
        navPanel.style.display = "none";
        contentPanel.style.width = "100%";
        contentPanel.innerHTML = "";
        clearFocus();

        const normalizedQuery = query.trim().toLowerCase();
        console.log("Normalized query:", normalizedQuery);

        const allPrompts = [];
        promptSourceMap.forEach((source, key) => {
          // Skip workflows, as they don't have a prompt property
          if (source.workflow) {
            return; // Continue to next iteration
          }

          const title = key.split("_")[0];
          const content =
            typeof source.prompt === "string"
              ? source.prompt
              : source.prompt?.content || "";
          allPrompts.push({ title, content, source });
        });
        console.log("All prompts:", allPrompts);

        const scoredPrompts = allPrompts
          .filter(
            ({ title, content }) =>
              title.toLowerCase().includes(normalizedQuery) ||
              content.toLowerCase().includes(normalizedQuery)
          )
          .map(({ title, content, source }) => ({
            title,
            source,
            folder: source.folder || source.category || "Uncategorized",
          }));

        console.log("Filtered prompts:", scoredPrompts);

        if (scoredPrompts.length === 0) {
          console.warn(
            "No matching prompts found, showing category navigation"
          );
          renderCategoryNavigation();
        } else {
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
                contentItem.style.backgroundColor = "#f8f8f8";
              });

              contentItem.addEventListener("mouseout", () => {
                contentItem.style.backgroundColor = "white";
              });

              contentItem.addEventListener("click", async () => {
                const currentText = getInputText(inputField);
                const slashIndex = currentText.indexOf("/");
                let newText = "";
                const selectedPrompt =
                  typeof source.prompt === "string"
                    ? source.prompt
                    : source.prompt?.content || "";

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

                updatePromptLastUsed(source.promptId);
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
          selector: "div[data-testid='composer-speech-button-container']", // ChatGPT
        },
        {
          url: "https://www.perplexity.ai",
          selector: "div.bg-background:nth-child(3)",
        },
        {
          url: "https://github.com/copilot",
          selector: ".ChatInput-module__toolbarRight--PiQJn",
        },
        {
          url: "https://grok.com",
          selector: ".ml-auto.flex.flex-row.items-end.gap-1",
        },
        {
          url: "https://gemini.google.com",
          selector: ".trailing-actions-wrapper",
        },
        {
          url: "https://duckduckgo.com",
          selector: ".VxPe9cw5s4CtJMWgwO3A.PzT4Zd7XtUNtxwg6HUlG",
        },
        { url: "https://chat.mistral.ai", selector: ".ms-auto.flex.gap-2" }, // Mistral
        {
          url: "https://claude.ai",
          selector: ".flex.gap-2\\.5.w-full.items-center",
        },
        { url: "https://www.chat.deepseek.com", selector: ".bf38813a" }, // DeepSeek
        { url: "https://copilot.microsoft.com", selector: ".flex.gap-2" }, // Microsoft Copilot
        {
          url: "https://www.blackbox.ai",
          selector: ".flex.items-center.justify-between.gap-4:nth-child(1)",
        },
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
        // Find the parent element of the target div
        const parentElement = container.parentElement;

        // Create a new button
        const newButton = document.createElement("button");
        newButton.textContent = "+"; // Text des Buttons anpassen
        newButton.className = "custom-button"; // Optional: Klasse für Styling

        // Tooltip erstellen
        const tooltip = document.createElement("div");
        tooltip.className = "tooltip";
        tooltip.textContent = "Open the PromptIn Management Menu";
        tooltip.style.opacity = "0"; // Initial unsichtbar

        // Stil des Buttons und Tooltips
        const style = document.createElement("style");
        style.textContent = `
    .custom-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: white;
      color: black;
      border: none;
      cursor: pointer;
      font-weight: bold;
      font-size: 24px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: box-shadow 0.3s ease, transform 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .custom-button:hover {
      background-color: black;
      color: white;
    }

    .tooltip {
      position: absolute;
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
  `;
        document.head.appendChild(style);

        // Button und Tooltip an das Parent-Element anhängen
        parentElement.appendChild(newButton);
        parentElement.appendChild(tooltip);

        // Tooltip-Position anpassen
        const positionTooltip = () => {
          const rect = newButton.getBoundingClientRect();
          tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
          tooltip.style.left = `${
            rect.left + rect.width / 2 - tooltip.offsetWidth / 2
          }px`;
        };

        // Tooltip anzeigen
        newButton.addEventListener("mouseover", () => {
          tooltip.style.opacity = "1";
          positionTooltip();
        });

        // Tooltip ausblenden
        newButton.addEventListener("mouseout", () => {
          tooltip.style.opacity = "0";
        });

        // Klickverhalten des Buttons
        newButton.addEventListener("click", (e) => {
          e.preventDefault();
          // Hier kannst du das Verhalten für das Öffnen und Schließen des PromptIn Management Menüs einbauen
          if (
            typeof dropdown === "undefined" ||
            typeof inputField === "undefined"
          ) {
            console.error("Dropdown oder InputField nicht definiert.");
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
function updatePromptLastUsed(promptId) {
  console.log("Ok, we're updating");
  chrome.storage.local.get("prompts", (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error fetching prompts:", chrome.runtime.lastError);
      return;
    }

    const prompts = data.prompts || {};
    const prompt = prompts[promptId];

    if (!prompt) {
      console.error(`No prompt found with ID: ${promptId}`);
      return;
    }

    // Update timestamp and usage counter
    prompt.lastUsed = Date.now();
    prompt.usageCount = (prompt.usageCount || 0) + 1;

    // usageHistory initialisieren, falls nicht vorhanden
    prompt.usageHistory = prompt.usageHistory || [];
    prompt.usageHistory.push({
      timestamp: Date.now(),
      // context: "manual-run", // optional
      modelUsed: getCurrentMode() || "Unknown", // Use the current model
    });

    // Save updated prompt back to storage
    chrome.storage.local.set(
      {
        prompts: {
          ...prompts,
          [promptId]: prompt,
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error saving updated prompt:",
            chrome.runtime.lastError
          );
        } else {
          console.log(`lastUsed and usageCount updated for prompt ${promptId}`);
          updateDropdownData(() => {
            if (dropdown.style.display === "flex") {
              renderCategoryNavigation();
              if (selectedCategoryOrFolder) {
                renderContentPanel(selectedCategoryOrFolder);
              }
            }
          });
        }
      }
    );
  });
}
function findPromptIndex(folderId, prompt) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["folders", "prompts"], function (data) {
      const folders = data.folders || {};
      const prompts = data.prompts || {};
      const folder = folders[folderId];

      if (!folder || !Array.isArray(folder.promptIds)) {
        console.error("Invalid folder or missing promptIds:", folderId);
        resolve(-1);
        return;
      }

      const index = folder.promptIds.findIndex((promptId) => {
        const p = prompts[promptId];
        if (!p) return false;

        // Match string prompts
        if (typeof p === "string" && typeof prompt === "string") {
          return p === prompt;
        }

        // Match object prompts
        if (typeof p === "object" && typeof prompt === "object") {
          return p.title === prompt.title && p.content === prompt.content;
        }

        return false;
      });

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
// Function to execute workflow on sight
// Function to show modal for dynamic variables in a workflow
// Function to show modal for dynamic variables in a workflow
// Function to show modal for dynamic variables in a workflow
// Function to execute workflow on sight
function showDynamicVariablesModal(workflowId) {
  const inputField = document.getElementById("prompt-textarea");
  if (inputField) {
    inputField.value = "";
  }

  console.log("Fetching workflow with ID:", workflowId);
  chrome.storage.local.get(["workflows", "prompts"], async function (data) {
    if (chrome.runtime.lastError) {
      console.error("Error fetching data:", chrome.runtime.lastError);
      alert("Failed to load workflow. Please try again.");
      return;
    }

    const workflow = data.workflows?.[workflowId];
    if (!workflow || !workflow.name || !Array.isArray(workflow.steps)) {
      console.error("Invalid workflow data for ID:", workflowId, workflow);
      alert("Invalid workflow data. Please check the workflow configuration.");
      return;
    }

    // Enhance steps with effective prompt content
    for (const step of workflow.steps) {
      if (step.useCustomPrompt && step.customPrompt) {
        console.log(
          `Step ${step.title || "unknown"}: Using customPrompt`,
          step.customPrompt
        );
        step.effectivePrompt = step.customPrompt;
      } else if (step.promptId) {
        console.log(
          `Step ${step.title || "unknown"}: Fetching prompt for promptId`,
          step.promptId
        );
        const prompt = data.prompts?.[step.promptId];
        if (prompt && prompt.content) {
          step.effectivePrompt = prompt.content;
          console.log(
            `Step ${step.title || "unknown"}: Fetched content for promptId ${
              step.promptId
            }`,
            prompt.content
          );
        } else {
          console.error(
            `No prompt found for promptId ${step.promptId} in step ${
              step.title || "unknown"
            }`
          );
          step.effectivePrompt = "No prompt defined";
        }
      } else {
        console.warn(
          `Step ${step.title || "unknown"}: No customPrompt or promptId defined`
        );
        step.effectivePrompt = "No prompt defined";
      }
    }

    // Create modal
    const modal = document.createElement("div");
    modal.className = "modal";
    Object.assign(modal.style, {
      display: "flex",
      position: "fixed",
      zIndex: "10001",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      animation: "fadeIn 0.3s ease-in",
    });

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    Object.assign(modalContent.style, {
      backgroundColor: "white",
      padding: "20px",
      color: "#333",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      width: "90%",
      maxWidth: "80vw",
      maxHeight: "80vh",
      overflowY: "auto",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    });

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.style.cssText =
      "display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;";
    modalHeader.innerHTML = `
      <h2 style="margin: 0; font-size: 24px; color: #1a1a1a;">Configure Workflow: ${escapeHTML(
        workflow.name
      )}</h2>
      <span class="close" style="cursor: pointer; font-size: 24px; color: #666; transition: color 0.2s ease;">×</span>
    `;

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.style.cssText = "flex: 1; overflow: hidden;";

    const stepsContainer = document.createElement("div");
    stepsContainer.id = "workflow-steps";
    stepsContainer.style.cssText = `
      display: flex;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 10px;
      background-color: #f9f9f9;
      border-radius: 8px;
      margin-bottom: 15px;
    `;

    const buttonsDiv = document.createElement("div");
    buttonsDiv.style.cssText =
      "display: flex; gap: 10px; justify-content: flex-end;";

    const scrollLeftBtn = document.createElement("button");
    scrollLeftBtn.className = "scroll-btn scroll-btn-left";
    scrollLeftBtn.textContent = "←";
    scrollLeftBtn.style.cssText = `
      background-color: #4a90e2;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 20px;
      cursor: pointer;
      display: none;
      position: fixed;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10002;
      transition: background 0.2s ease;
    `;
    scrollLeftBtn.onmouseover = () =>
      (scrollLeftBtn.style.backgroundColor = "#357abd");
    scrollLeftBtn.onmouseout = () =>
      (scrollLeftBtn.style.backgroundColor = "#4a90e2");
    scrollLeftBtn.onclick = () => {
      stepsContainer.scrollBy({ left: -220, behavior: "smooth" });
      updateScrollButtons();
    };

    const scrollRightBtn = document.createElement("button");
    scrollRightBtn.className = "scroll-btn scroll-btn-right";
    scrollRightBtn.textContent = "→";
    scrollRightBtn.style.cssText = `
      background-color: #4a90e2;
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 20px;
      cursor: pointer;
      display: none;
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10002;
      transition: background 0.2s ease;
    `;
    scrollRightBtn.onmouseover = () =>
      (scrollRightBtn.style.backgroundColor = "#357abd");
    scrollRightBtn.onmouseout = () =>
      (scrollRightBtn.style.backgroundColor = "#4a90e2");
    scrollRightBtn.onclick = () => {
      stepsContainer.scrollBy({ left: 220, behavior: "smooth" });
      updateScrollButtons();
    };

    const importCycleBtn = document.createElement("button");
    importCycleBtn.type = "button";
    importCycleBtn.className = "action-btn import-btn";
    importCycleBtn.textContent = "Import Cycle";
    importCycleBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 14px;
      cursor: pointer;
      background-color: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      transition: background 0.2s ease, transform 0.2s ease;
    `;
    importCycleBtn.onmouseover = () =>
      (importCycleBtn.style.backgroundColor = "#5a6268");
    importCycleBtn.onmouseout = () =>
      (importCycleBtn.style.backgroundColor = "#6c757d");
    importCycleBtn.onclick = () => {
      console.log("Import Cycle clicked");
      // Implement import functionality if needed
    };

    const exportCycleBtn = document.createElement("button");
    exportCycleBtn.type = "button";
    exportCycleBtn.className = "action-btn export-btn";
    exportCycleBtn.textContent = "Export Cycle";
    exportCycleBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 14px;
      cursor: pointer;
      background-color: #17a2b8;
      color: white;
      border: none;
      border-radius: 6px;
      transition: background 0.2s ease, transform 0.2s ease;
    `;
    exportCycleBtn.onmouseover = () =>
      (exportCycleBtn.style.backgroundColor = "#138496");
    exportCycleBtn.onmouseout = () =>
      (exportCycleBtn.style.backgroundColor = "#17a2b8");
    exportCycleBtn.onclick = () => {
      console.log("Export Cycle clicked");
      const exportData = { workflowId, repetitions };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workflow_${workflow.name.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const addRepetitionBtn = document.createElement("button");
    addRepetitionBtn.type = "button";
    addRepetitionBtn.className = "action-btn";
    addRepetitionBtn.textContent = "Add Repetition +";
    addRepetitionBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 14px;
      cursor: pointer;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 6px;
      transition: background 0.2s ease, transform 0.2s ease;
    `;
    addRepetitionBtn.onmouseover = () =>
      (addRepetitionBtn.style.backgroundColor = "#218838");
    addRepetitionBtn.onmouseout = () =>
      (addRepetitionBtn.style.backgroundColor = "#28a745");

    const sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.className = "action-btn";
    sendBtn.textContent = "Execute Workflow";
    sendBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 14px;
      cursor: pointer;
      background-color: #4a90e2;
      color: white;
      border: none;
      border-radius: 6px;
      transition: background 0.2s ease, transform 0.2s ease;
    `;
    sendBtn.onmouseover = () => (sendBtn.style.backgroundColor = "#357abd");
    sendBtn.onmouseout = () => (sendBtn.style.backgroundColor = "#4a90e2");

    buttonsDiv.appendChild(importCycleBtn);
    buttonsDiv.appendChild(exportCycleBtn);
    buttonsDiv.appendChild(addRepetitionBtn);
    buttonsDiv.appendChild(sendBtn);

    modalBody.appendChild(stepsContainer);
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(buttonsDiv);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    document.body.appendChild(scrollLeftBtn);
    document.body.appendChild(scrollRightBtn);

    const repetitions = [];

    function hasDynamicVariables(prompt) {
      return typeof prompt === "string" && /\{\{[^}]+}\}/.test(prompt);
    }

    function extractVariables(prompt) {
      if (typeof prompt !== "string") return [];
      const matches = prompt.match(/\{\{([^}]+)\}\}/g);
      return matches ? matches.map((m) => m.slice(2, -2)) : [];
    }

    function initRepetition() {
      return workflow.steps.map((step) => {
        const stepData = {};
        if (hasDynamicVariables(step.effectivePrompt)) {
          const vars = extractVariables(step.effectivePrompt);
          vars.forEach((v) => (stepData[v] = ""));
        }
        return stepData;
      });
    }

    if (repetitions.length === 0) repetitions.push(initRepetition());

    function updateScrollButtons() {
      const isOverflowing =
        stepsContainer.scrollWidth > stepsContainer.clientWidth;
      scrollLeftBtn.style.display = isOverflowing ? "block" : "none";
      scrollRightBtn.style.display = isOverflowing ? "block" : "none";
    }

    function renderSteps() {
      stepsContainer.innerHTML = `
        <style>
          #workflow-steps::-webkit-scrollbar {
            height: 10px;
          }
          #workflow-steps::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 5px;
          }
          .repetition {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            width: 400px;
            margin-right: 10px;
            flex-shrink: 0;
            position: relative;
            overflow-y: auto;
            max-height: 500px;
            transition: transform 0.2s ease;
          }
          .repetition:hover {
            transform: translateY(-2px);
          }
          .repetition h3 {
            margin: 0 0 10px;
            font-size: 16px;
            color: #333;
          }
          .step-group {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .step-group h4 {
            margin: 0 0 5px;
            font-size: 14px;
            color: #333;
          }
          .step-group p {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          .step-group input {
            display: block;
            width: 90%;
            margin: 5px 0;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s ease;
          }
          .step-group input:focus {
            border-color: #4a90e2;
            outline: none;
          }
          .preview {
            margin-top: 10px;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 6px;
            font-size: 12px;
            color: #333;
            overflow-y: auto;
            max-height: 150px;
          }
          .preview.constant {
            font-style: italic;
            color: #555;
          }
          .repetition-close-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            transition: background-color 0.2s ease;
          }
          .repetition-close-btn:hover {
            background-color: #c82333;
          }
        </style>
      `;

      repetitions.forEach((repData, repIndex) => {
        const repDiv = document.createElement("div");
        repDiv.className = "repetition";

        const closeBtn = document.createElement("button");
        closeBtn.className = "repetition-close-btn";
        closeBtn.innerText = "×";
        closeBtn.dataset.repIndex = repIndex;
        closeBtn.onclick = () => {
          console.log("Deleting repetition, index:", repIndex);
          repetitions.splice(repIndex, 1);
          renderSteps();
          if (repetitions.length === 0) {
            console.log("No repetitions left, closing modal.");
            modal.remove();
            scrollLeftBtn.remove();
            scrollRightBtn.remove();
          }
        };
        repDiv.appendChild(closeBtn);

        const executionHeader = document.createElement("h3");
        executionHeader.textContent = `Execution ${repIndex + 1}`;
        repDiv.appendChild(executionHeader);

        workflow.steps.forEach((step, stepIndex) => {
          const stepDiv = document.createElement("div");
          stepDiv.className = "step-group";
          stepDiv.innerHTML = `
            <h4>${escapeHTML(step.title || "Step " + (stepIndex + 1))}</h4>
            <p style="font-size: 12px; color: #666; margin: 5px 0;">${escapeHTML(
              step.effectivePrompt
            )}</p>
          `;

          if (hasDynamicVariables(step.effectivePrompt)) {
            const variables = extractVariables(step.effectivePrompt);
            variables.forEach((variable) => {
              const input = document.createElement("input");
              input.type = "text";
              input.placeholder = `Enter ${variable}`;
              input.dataset.variable = variable;
              input.dataset.stepIndex = stepIndex;
              input.dataset.repIndex = repIndex;
              input.value =
                (repData[stepIndex] && repData[stepIndex][variable]) || "";
              input.addEventListener("input", (e) => {
                if (!repData[stepIndex]) repData[stepIndex] = {};
                repData[stepIndex][variable] = e.target.value;
                updatePreview(stepIndex, repIndex);
              });
              stepDiv.appendChild(input);
            });

            const preview = document.createElement("div");
            preview.className = "preview";
            preview.dataset.stepIndex = stepIndex;
            preview.dataset.repIndex = repIndex;
            stepDiv.appendChild(preview);
          } else {
            const preview = document.createElement("div");
            preview.className = "preview constant";
            preview.textContent = step.effectivePrompt;
            stepDiv.appendChild(preview);
          }

          repDiv.appendChild(stepDiv);
        });

        stepsContainer.appendChild(repDiv);
      });

      if (stepsContainer.children.length === 0) {
        stepsContainer.innerHTML += "<p>No steps found in this workflow.</p>";
      } else {
        updateAllPreviews();
        stepsContainer.scrollLeft = stepsContainer.scrollWidth;
      }
      updateScrollButtons();
    }

    function updatePreview(stepIndex, repIndex) {
      const step = workflow.steps[stepIndex];
      if (
        !step ||
        !step.effectivePrompt ||
        !hasDynamicVariables(step.effectivePrompt)
      )
        return;
      let previewText = step.effectivePrompt;
      const vars = extractVariables(step.effectivePrompt);
      vars.forEach((variable) => {
        const val =
          (repetitions[repIndex][stepIndex] &&
            repetitions[repIndex][stepIndex][variable]) ||
          `{${variable}}`;
        previewText = previewText.replace(`{{${variable}}}`, escapeHTML(val));
      });

      const previewElement = stepsContainer.querySelector(
        `.preview[data-step-index="${stepIndex}"][data-rep-index="${repIndex}"]`
      );
      if (previewElement) {
        previewElement.textContent = previewText;
      }
    }

    function updateAllPreviews() {
      workflow.steps.forEach((step, stepIndex) => {
        if (step.effectivePrompt && hasDynamicVariables(step.effectivePrompt)) {
          repetitions.forEach((_, repIndex) => {
            updatePreview(stepIndex, repIndex);
          });
        }
      });
    }

    addRepetitionBtn.addEventListener("click", () => {
      repetitions.push(initRepetition());
      renderSteps();
    });

    sendBtn.addEventListener("click", async () => {
      const executions = repetitions.map((repData) =>
        workflow.steps.map((step, stepIndex) => {
          if (!step.effectivePrompt) return "";
          if (!hasDynamicVariables(step.effectivePrompt))
            return step.effectivePrompt;
          let promptText = step.effectivePrompt;
          const vars = extractVariables(step.effectivePrompt);
          vars.forEach((variable) => {
            const val =
              (repData[stepIndex] && repData[stepIndex][variable]) ||
              `{${variable}}`;
            promptText = promptText.replace(`{{${variable}}}`, val);
          });
          return promptText;
        })
      );

      const allPrompts = executions.flat().filter((item) => item);
      modal.remove();
      scrollLeftBtn.remove();
      scrollRightBtn.remove();

      for (const prompt of allPrompts) {
        await sendPrompt(prompt);
      }

      // Update lastUsed timestamp
      chrome.storage.local.get(["workflows"], (data) => {
        const updatedWorkflow = {
          ...data.workflows[workflowId],
          lastUsed: Date.now(),
        };
        chrome.storage.local.set(
          { workflows: { ...data.workflows, [workflowId]: updatedWorkflow } },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error updating workflow:",
                chrome.runtime.lastError
              );
            }
            console.log("Workflow execution completed.");
            renderWorkflows(); // Assumes renderWorkflows is globally available
          }
        );
      });
    });

    async function sendPrompt(prompt) {
      const geminiSendButton = document.querySelector(
        "[data-mat-icon-name='send']"
      );
      const chatgptSendButton = document.querySelector(
        "[data-testid='send-button']"
      );
      const grokSendButton = document.querySelector("[type='submit']");

      const geminiInput = document.querySelector(
        "[role='textbox']:not([readonly]):not([disabled])"
      );
      const chatgptInput = document.getElementById("prompt-textarea");
      const grokInput = document.querySelector(
        "textarea:not([readonly]):not([disabled])"
      );

      const activeInput = geminiInput || chatgptInput || grokInput;

      if (!activeInput) {
        console.error("Kein Eingabefeld gefunden.");
        alert("Kein Eingabefeld gefunden.");
        return;
      }

      await setInputText(activeInput, prompt);

      if (geminiSendButton?.parentNode) {
        geminiSendButton.parentNode.click();
      } else if (chatgptSendButton) {
        chatgptSendButton.click();
      } else if (grokSendButton) {
        grokSendButton.click();
      } else {
        activeInput.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
        );
      }

      await waitForProcessing();
    }

    async function setInputText(element, text) {
      if (
        element.tagName === "TEXTAREA" ||
        element instanceof HTMLTextAreaElement
      ) {
        element.value = text;
      } else {
        element.innerText = text;
      }

      element.dispatchEvent(new Event("input", { bubbles: true }));

      return new Promise((resolve) => {
        requestAnimationFrame(() => setTimeout(resolve, 50));
      });
    }

    async function waitForProcessing() {
      const stopSelectorGemini = "[data-mat-icon-name='stop']";
      const stopSelectorChatGPT = "[data-testid='stop-button']";
      const stopSelectorGrok = "[data-label='Modell-Antwort stoppen']";
      const grokSendButtonSelector = "[type='submit']";

      let activeStopSelector = null;

      while (true) {
        if (document.querySelector(stopSelectorGemini)) {
          activeStopSelector = stopSelectorGemini;
          break;
        }
        if (document.querySelector(stopSelectorChatGPT)) {
          activeStopSelector = stopSelectorChatGPT;
          break;
        }
        if (document.querySelector(stopSelectorGrok)) {
          activeStopSelector = stopSelectorGrok;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      while (document.querySelector(activeStopSelector)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (activeStopSelector === stopSelectorGrok) {
        while (true) {
          const grokSendButton = document.querySelector(grokSendButtonSelector);
          if (grokSendButton && !grokSendButton.disabled) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    function escapeHTML(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    modalHeader.querySelector(".close").onclick = () => {
      modal.remove();
      scrollLeftBtn.remove();
      scrollRightBtn.remove();
    };

    renderSteps();
  });
}

// Ensure escapeHTML is available
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
