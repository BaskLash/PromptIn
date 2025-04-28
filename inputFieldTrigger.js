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

  // Warte, bis das DOM geladen ist
  document.addEventListener("DOMContentLoaded", () => {
    // Warte zusätzlich 2 Sekunden nach DOM-Laden
    setTimeout(() => {
      const inputField = document.getElementById("prompt-textarea");

      if (!inputField) {
        console.error("Input field with ID 'prompt-textarea' not found.");
        return;
      }

      if (!document.body) {
        console.error("Document body is not available.");
        return;
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
      dropdown.style.maxHeight = "300px";
      dropdown.style.overflow = "hidden";
      dropdown.style.display = "none";
      dropdown.style.zIndex = "10000";
      dropdown.style.display = "flex";
      dropdown.style.flexDirection = "row";
      dropdown.style.fontFamily = "Segoe UI, sans-serif";
      dropdown.style.backdropFilter = "blur(6px)";
      dropdown.style.opacity = "0";
      dropdown.style.transform = "translateY(10px)";
      dropdown.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      document.body.appendChild(dropdown);

      // Left nav panel (used only when no search query)
      const navPanel = document.createElement("div");
      navPanel.style.width = "150px";
      navPanel.style.borderRight = "1px solid #eee";
      navPanel.style.padding = "10px";
      navPanel.style.backgroundColor = "#fafafa";
      navPanel.style.overflowY = "auto";
      dropdown.appendChild(navPanel);

      // Right content panel
      const contentPanel = document.createElement("div");
      contentPanel.style.flex = "1";
      contentPanel.style.padding = "10px";
      contentPanel.style.overflowY = "auto";
      dropdown.appendChild(contentPanel);

      // Initialize categories and promptSourceMap
      let categories = {
        Favorites: [], // Placeholder for favorites
        "All Prompts": [],
        "Single Prompts": [],
        "Categorised Prompts": { all: [] }, // Object with folder names as keys, prompt titles as values, and 'all' for combined view
      };

      let promptSourceMap = new Map(); // Maps prompt title to { category, folder, prompt, folderId }

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

          // Reset categories and promptSourceMap
          categories = {
            Favorites: [],
            "All Prompts": [],
            "Single Prompts": [],
            "Categorised Prompts": { all: [] },
          };
          promptSourceMap = new Map();

          // Process all prompts and folders
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
              });
            }
          });

          // Remove duplicates and sort
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

          // Execute callback (e.g., render the dropdown)
          if (callback) {
            callback();
          }
        });
      }

      // Function to render category navigation (for / only)
      function renderCategoryNavigation() {
        navPanel.style.display = "block";
        contentPanel.style.width = "250px";
        navPanel.innerHTML = "";
        contentPanel.innerHTML = "";

        Object.keys(categories).forEach((category) => {
          const navItem = document.createElement("div");
          navItem.textContent = category;
          navItem.style.padding = "10px";
          navItem.style.cursor = "pointer";
          navItem.style.borderRadius = "4px";
          navItem.style.transition =
            "background-color 0.2s ease, font-weight 0.2s ease";
          navItem.className = "nav-item";

          navItem.addEventListener("mouseover", () => {
            navItem.style.backgroundColor = "#f0f0f0";
          });

          navItem.addEventListener("mouseout", () => {
            if (!navItem.classList.contains("active")) {
              navItem.style.backgroundColor = "transparent";
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

            contentPanel.innerHTML = "";
            let items = [];
            if (category === "Categorised Prompts") {
              items = categories[category].all;
            } else {
              items = categories[category];
            }

            if (items.length === 0 && category === "Categorised Prompts") {
              const message = document.createElement("div");
              message.textContent = "No prompts in categorised folders";
              message.style.padding = "10px";
              message.style.color = "#888";
              contentPanel.appendChild(message);
            } else {
              items.forEach((itemText) => {
                const contentItem = document.createElement("div");
                contentItem.textContent = itemText;
                contentItem.style.padding = "10px";
                contentItem.style.cursor = "pointer";
                contentItem.style.borderRadius = "4px";
                contentItem.style.transition = "background-color 0.2s ease";
                contentItem.className = "dropdown-item";

                contentItem.addEventListener("mouseover", () => {
                  contentItem.style.backgroundColor = "#f8f8f8";
                });

                contentItem.addEventListener("mouseout", () => {
                  contentItem.style.backgroundColor = "white";
                });

                contentItem.addEventListener("click", () => {
                  const title = itemText.includes(": ")
                    ? itemText.split(": ")[1]
                    : itemText;
                  const key = Array.from(promptSourceMap.keys()).find((k) =>
                    k.startsWith(title + "_")
                  );
                  const source = promptSourceMap.get(key);
                  if (source && source.prompt) {
                    inputField.innerText =
                      typeof source.prompt === "string"
                        ? source.prompt
                        : source.prompt.content || "";
                  }
                  dropdown.style.display = "none";
                });

                contentPanel.appendChild(contentItem);
              });
            }
          });

          navPanel.appendChild(navItem);

          // Add folder sub-items under Categorised Prompts
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

                folderItem.addEventListener("mouseover", () => {
                  folderItem.style.backgroundColor = "#f0f0f0";
                });

                folderItem.addEventListener("mouseout", () => {
                  if (!folderItem.classList.contains("active")) {
                    folderItem.style.backgroundColor = "transparent";
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

                  contentPanel.innerHTML = "";
                  if (categories[category][folder].length === 0) {
                    const message = document.createElement("div");
                    message.textContent = "No prompts in this folder";
                    message.style.padding = "10px";
                    message.style.color = "#888";
                    contentPanel.appendChild(message);
                  } else {
                    categories[category][folder].forEach((title) => {
                      const contentItem = document.createElement("div");
                      contentItem.textContent = title;
                      contentItem.style.padding = "10px";
                      contentItem.style.cursor = "pointer";
                      contentItem.style.borderRadius = "4px";
                      contentItem.style.transition =
                        "background-color 0.2s ease";
                      contentItem.className = "dropdown-item";

                      contentItem.addEventListener("mouseover", () => {
                        contentItem.style.backgroundColor = "#f8f8f8";
                      });

                      contentItem.addEventListener("mouseout", () => {
                        contentItem.style.backgroundColor = "white";
                      });

                      contentItem.addEventListener("click", () => {
                        const key = Array.from(promptSourceMap.keys()).find(
                          (k) => k.startsWith(title + "_")
                        );
                        const source = promptSourceMap.get(key);
                        if (source && source.prompt) {
                          inputField.innerText =
                            typeof source.prompt === "string"
                              ? source.prompt
                              : source.prompt.content || "";
                        }
                        dropdown.style.display = "none";
                      });

                      contentPanel.appendChild(contentItem);
                    });
                  }
                });

                folderContainer.appendChild(folderItem);
              });
            navPanel.appendChild(folderContainer);
          }
        });

        // Select first category by default
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

        // Collect all prompt titles with their sources
        const allPrompts = [];
        promptSourceMap.forEach((source, key) => {
          const title = key.split("_")[0];
          allPrompts.push({ title, source });
        });

        // Score prompts based on Levenshtein distance
        const scoredPrompts = allPrompts.map(({ title, source }) => {
          const distance = levenshteinDistance(
            title.toLowerCase(),
            query.toLowerCase()
          );
          return { title, source, distance };
        });

        // Sort by distance (best match first)
        scoredPrompts.sort((a, b) => a.distance - b.distance);

        // Display results
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
              ? `${title} (${source.folder})`
              : `${title} (${source.category})`;
            contentItem.textContent = displayText;
            contentItem.style.padding = "10px";
            contentItem.style.cursor = "pointer";
            contentItem.style.borderRadius = "4px";
            contentItem.style.transition = "background-color 0.2s ease";
            contentItem.className = "dropdown-item";

            contentItem.addEventListener("mouseover", () => {
              contentItem.style.backgroundColor = "#f8f8f8";
            });

            contentItem.addEventListener("mouseout", () => {
              contentItem.style.backgroundColor = "white";
            });

            contentItem.addEventListener("click", () => {
              inputField.innerText =
                typeof source.prompt === "string"
                  ? source.prompt
                  : source.prompt.content || "";
              dropdown.style.display = "none";
            });

            contentPanel.appendChild(contentItem);
          });
        }
      }

      // Initial data load and render
      updateDropdownData(renderCategoryNavigation);

      // Listen for Chrome storage changes
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "sync") {
          console.log("Chrome storage changed, updating dropdown...");
          updateDropdownData(() => {
            // Only re-render if dropdown is open
            if (
              dropdown.style.display === "flex" &&
              inputField.innerText.includes("/")
            ) {
              const query = inputField.innerText
                .trim()
                .slice(inputField.innerText.indexOf("/") + 1)
                .trim();
              if (query) {
                renderSearchResults(query);
              } else {
                renderCategoryNavigation();
              }
            }
          });
        }
      });

      // Konfigurierbare Abstände
      const gapAbove = 2; // Abstand nach oben (in Pixeln), wenn Dropdown oberhalb
      const gapBelow = 2; // Abstand nach unten (in Pixeln), wenn Dropdown unterhalb

      // Funktion zum Positionieren des Dropdowns
      function positionDropdown() {
        const rect = inputField.getBoundingClientRect();
        const dropdownHeight = parseFloat(dropdown.style.maxHeight) || 300; // Dropdown-Höhe
        const spaceBelow = window.innerHeight - rect.bottom; // Platz unterhalb des Input-Feldes
        const spaceNeeded = dropdownHeight + 10; // Etwas Puffer

        dropdown.style.left = `${rect.left + window.scrollX}px`;

        if (spaceBelow < spaceNeeded) {
          // Nicht genug Platz unten -> Dropdown oberhalb platzieren
          dropdown.style.top = `${
            rect.top + window.scrollY - dropdownHeight - gapAbove
          }px`;
          dropdown.style.transform = "translateY(-5px)"; // Weniger weit nach oben animieren
        } else {
          // Genug Platz unten -> Dropdown unterhalb platzieren
          dropdown.style.top = `${rect.bottom + window.scrollY + gapBelow}px`;
          dropdown.style.transform = "translateY(10px)"; // Für Animation nach unten
        }

        // Sicherstellen, dass das Dropdown nicht über den rechten Rand hinausragt
        const dropdownRect = dropdown.getBoundingClientRect();
        if (dropdownRect.right > window.innerWidth) {
          dropdown.style.left = `${
            window.innerWidth - dropdownRect.width + window.scrollX - 10
          }px`;
        }
      }

      inputField.addEventListener("keyup", function (e) {
        const text = inputField.innerText.trim();
        const slashIndex = text.indexOf("/");

        if (slashIndex !== -1) {
          const query = text
            .slice(slashIndex + 1)
            .trim()
            .toLowerCase();
          dropdown.style.display = "flex";
          positionDropdown();

          // Animate in
          requestAnimationFrame(() => {
            dropdown.style.opacity = "1";
            dropdown.style.transform = "translateY(0)";
          });

          // Render based on query
          if (query) {
            renderSearchResults(query);
          } else {
            renderCategoryNavigation();
          }
        }

        if (e.key === "Escape" || !text.includes("/")) {
          dropdown.style.opacity = "0";
          dropdown.style.transform = "translateY(10px)";
          setTimeout(() => {
            dropdown.style.display = "none";
          }, 300);
        }
      });

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
      // Ziel-Element auswählen
      const container = document.querySelector(
        "[data-testid='composer-footer-actions']"
      );

      // Neuen Button erstellen
      const button = document.createElement("button");
      button.textContent = "+"; // "+" Zeichen
      button.style.width = "40px";
      button.style.height = "40px";
      button.style.borderRadius = "50%";
      button.style.backgroundColor = "white";
      button.style.color = "black";
      button.style.border = "none";
      button.style.cursor = "pointer";
      button.style.fontSize = "24px";
      button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      button.style.transition = "box-shadow 0.3s ease";
      button.style.display = "flex";
      button.style.alignItems = "center";
      button.style.justifyContent = "center";

      // Hover-Effekt mit JavaScript
      button.addEventListener("mouseover", () => {
        button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
      });
      button.addEventListener("mouseout", () => {
        button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      });

      button.addEventListener("click", ()=>{
        dropdown.style.display = "block";
      })

      // Button dem Container hinzufügen
      container.appendChild(button);
    }, 2000); // 2 Sekunden Verzögerung
  });
}
