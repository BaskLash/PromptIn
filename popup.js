document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("inputField");
  const promptList = document.getElementById("promptList");
  const noData = document.getElementById("noData");

  const burgerBtn = document.querySelector(".burger-btn");
  const sidebar = document.querySelector(".sidebar");
  const allPromptsLink = document.getElementById("all-prompts-link");
  const singlePromptsLink = document.getElementById("single-prompts-link");
  const categorisedPromptsLink = document.getElementById(
    "categorised-prompts-link"
  );
  const folderNavList = document.getElementById("folderNavList");
  const collapsibles = document.querySelectorAll(".collapsible");
  const overviewBtn = document.getElementById("overview-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const faqBtn = document.getElementById("faq-btn");
  const newPromptBtn = document.querySelector(".new-prompt");
  const clearStorageBtn = document.getElementById("clear-storage");

  // Funktion zum Laden aller Prompts im Hauptinhalt
  function loadPrompts(view = "all") {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      promptList.innerHTML = "";
      let allPrompts = [];

      if (!data || Object.keys(data).length === 0) {
        noData.style.display = "block";
        return;
      }

      noData.style.display = "none";

      if (view === "all") {
        Object.entries(data).forEach(([id, topic]) => {
          allPrompts = allPrompts.concat(
            topic.prompts.map((prompt, index) => ({
              prompt,
              folderId: id,
              index,
            }))
          );
        });
      } else if (view === "single") {
        Object.entries(data).forEach(([id, topic]) => {
          if (
            topic.prompts.length === 1 &&
            topic.name === topic.prompts[0].slice(0, 20)
          ) {
            allPrompts.push({
              prompt: topic.prompts[0],
              folderId: id,
              index: 0,
            });
          }
        });
      } else if (view === "categorised") {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts.length > 1) {
            allPrompts = allPrompts.concat(
              topic.prompts.map((prompt, index) => ({
                prompt: `${topic.name}: ${prompt}`,
                folderId: id,
                index,
              }))
            );
          }
        });
      } else {
        const folder = data[view];
        if (folder) {
          allPrompts = folder.prompts.map((prompt, index) => ({
            prompt,
            folderId: view,
            index,
          }));
        }
      }

      if (allPrompts.length === 0) {
        noData.style.display = "block";
        return;
      }

      allPrompts.forEach(({ prompt, folderId, index }) => {
        const promptItem = createPromptItem(prompt, folderId, index);
        promptList.appendChild(promptItem);
      });
    });
  }

  // Funktion zum Laden der Ordner in der Seitenleiste (nur Foldernamen)
  // Funktion zum Laden der Ordner (angepasst)
  function loadFolders() {
    chrome.storage.sync.get(null, function (data) {
      folderNavList.innerHTML = "";

      if (!data || Object.keys(data).length === 0) {
        folderNavList.innerHTML = "<p>No folders yet!</p>";
        return;
      }

      const folders = Object.entries(data).filter(
        ([, topic]) =>
          topic.prompts && Array.isArray(topic.prompts) && !topic.isHidden
      );

      if (folders.length === 0) {
        folderNavList.innerHTML = "<p>No visible folders with prompts!</p>";
        return;
      }

      folders.forEach(([id, topic]) => {
        const folderItem = document.createElement("div");
        folderItem.classList.add("folder-item");

        const folderLink = document.createElement("a");
        folderLink.href = "#";
        folderLink.classList.add("folder-link");
        folderLink.textContent = `${topic.name} (${topic.prompts.length})`;

        folderLink.addEventListener("click", (e) => {
          e.preventDefault();
          showFolder(id);
          sidebar.classList.remove("visible");
        });

        folderItem.appendChild(folderLink);
        folderNavList.appendChild(folderItem);
      });

      // Höhe des Folders-Collapsible-Inhalts anpassen
      const folderCollapsibleContent = folderNavList.closest(
        ".collapsible-content"
      );
      const folderCollapsible =
        folderCollapsibleContent?.previousElementSibling;

      if (
        folderCollapsible &&
        folderCollapsible.getAttribute("aria-expanded") === "true"
      ) {
        folderCollapsibleContent.style.maxHeight =
          folderCollapsibleContent.scrollHeight + "px";
      }
    });
  }

  document.getElementById("export-btn").addEventListener("click", function () {
    chrome.storage.sync.get(null, function (data) {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        alert("Fehler beim Abrufen der Daten. Bitte versuche es erneut.");
        return;
      }

      // Filter to include only folders with prompts
      const folders = Object.entries(data)
        .filter(([, topic]) => topic.prompts && Array.isArray(topic.prompts))
        .reduce((acc, [id, topic]) => {
          acc[id] = {
            name: topic.name,
            prompts: topic.prompts,
            isHidden: topic.isHidden || false,
          };
          return acc;
        }, {});

      // Convert to JSON with indentation for readability
      const jsonData = JSON.stringify(folders, null, 2);

      // Create a Blob with the JSON data
      const blob = new Blob([jsonData], { type: "application/json" });

      // Create a temporary URL for the Blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `prompts_backup_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Prompts exported successfully");
    });
  });

  document.getElementById("import-btn").addEventListener("click", function () {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) {
        alert("Keine Datei ausgewählt. Bitte wähle eine JSON-Datei aus.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const importedData = JSON.parse(e.target.result);

          // Validate the imported data
          if (typeof importedData !== "object" || importedData === null) {
            alert(
              "Ungültiges JSON-Format. Bitte lade eine gültige Datei hoch."
            );
            return;
          }

          // Prepare data for storage
          const validFolders = {};
          let hasValidData = false;

          for (const [folderId, folder] of Object.entries(importedData)) {
            // Check if folder has required properties
            if (
              folder &&
              typeof folder === "object" &&
              folder.name &&
              Array.isArray(folder.prompts)
            ) {
              // Validate prompts
              const validPrompts = folder.prompts.filter((prompt) => {
                if (typeof prompt === "string") {
                  return true; // Support legacy string prompts
                }
                return (
                  prompt &&
                  typeof prompt === "object" &&
                  prompt.title &&
                  prompt.description &&
                  prompt.content
                );
              });

              if (validPrompts.length > 0) {
                validFolders[folderId] = {
                  name: folder.name,
                  prompts: validPrompts,
                  isHidden: folder.isHidden === true, // Ensure isHidden is boolean
                };
                hasValidData = true;
              }
            }
          }

          if (!hasValidData) {
            alert("Keine gültigen Ordner oder Prompts in der Datei gefunden.");
            return;
          }

          // Confirm with user before overwriting existing data
          if (
            !confirm(
              "Das Importieren überschreibt vorhandene Daten. Möchtest du fortfahren?"
            )
          ) {
            return;
          }

          // Store the imported data
          chrome.storage.sync.clear(function () {
            if (chrome.runtime.lastError) {
              console.error(
                "Error clearing storage:",
                chrome.runtime.lastError
              );
              alert("Fehler beim Löschen der vorhandenen Daten.");
              return;
            }

            chrome.storage.sync.set(validFolders, function () {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error saving imported data:",
                  chrome.runtime.lastError
                );
                alert("Fehler beim Speichern der importierten Daten.");
              } else {
                console.log("Prompts imported successfully:", validFolders);
                alert("Prompts erfolgreich importiert!");
                // Refresh UI
                loadFolderNavigation();
                if (promptListTitle.textContent === "All Prompts")
                  showAllPrompts();
                else if (promptListTitle.textContent === "Single Prompts")
                  showSinglePrompts();
                else if (promptListTitle.textContent === "Categorised Prompts")
                  showCategorisedPrompts();
                else loadFolders();
              }
            });
          });
        } catch (error) {
          console.error("Error parsing JSON:", error);
          alert(
            "Fehler beim Lesen der JSON-Datei. Bitte überprüfe das Format."
          );
        }
      };

      reader.onerror = function () {
        console.error("Error reading file:", reader.error);
        alert("Fehler beim Lesen der Datei. Bitte versuche es erneut.");
      };

      reader.readAsText(file);
    });

    // Trigger file selection
    input.click();
  });

  // Funktion zum Erstellen eines Prompt-Elements
  function createPromptItem(prompt, folderId, index) {
    const promptItem = document.createElement("li");
    promptItem.classList.add("prompt-item");

    const promptText = document.createElement("span");
    promptText.classList.add("prompt-text");
    promptText.textContent =
      prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt;
    promptText.title = prompt;
    promptItem.appendChild(promptText);

    const promptActions = document.createElement("div");
    promptActions.classList.add("prompt-actions");

    const useBtn = document.createElement("button");
    useBtn.textContent = "Use";
    useBtn.classList.add("action-btn");
    useBtn.addEventListener("click", () => usePrompt(prompt));
    promptActions.appendChild(useBtn);

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("action-btn");
    editBtn.addEventListener("click", () =>
      editPrompt(prompt, folderId, index)
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

  // Funktion zum Anzeigen eines spezifischen Ordners
  function showFolder(folderId) {
    loadPrompts(folderId);
    sidebar.classList.remove("visible"); // Seitenleiste schließen
  }

  // Funktion zum Verwenden eines Prompts
  function usePrompt(prompt) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("🚨 No active tab found.");
        return;
      }
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "usePrompt", text: prompt },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Message failed:", chrome.runtime.lastError);
          } else {
            console.log("📨 Response from content.js:", response);
          }
        }
      );
    });
  }

  // Funktion zum Bearbeiten eines Prompts
  function editPrompt(prompt, folderId, promptIndex) {
    const url =
      chrome.runtime.getURL("/pages/editPrompt.html") +
      `?folderId=${encodeURIComponent(folderId)}` +
      `&promptIndex=${encodeURIComponent(promptIndex)}` +
      `&prompt=${encodeURIComponent(prompt)}`;
    chrome.tabs.create({ url: url });
  }

  // Funktion zum Löschen eines Prompts
  function deletePrompt(folderId, promptIndex, promptItem) {
    if (confirm("Are you sure you want to delete this prompt?")) {
      chrome.storage.sync.get(folderId, function (data) {
        if (data[folderId]) {
          data[folderId].prompts.splice(promptIndex, 1);
          if (data[folderId].prompts.length === 0) {
            chrome.storage.sync.remove(folderId);
          } else {
            chrome.storage.sync.set({ [folderId]: data[folderId] });
          }
          promptItem.remove();
          loadPrompts();
          loadFolders(); // Ordnerliste aktualisieren
        }
      });
    }
  }

  // Burger-Menü ein-/ausblenden
  burgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("visible");
    if (sidebar.classList.contains("visible")) {
      loadFolders(); // Ordner laden, wenn Seitenleiste geöffnet wird
    }
  });

  // Collapsible ein-/ausklappen mit dynamischer Höhe
  collapsibles.forEach((collapsible) => {
    collapsible.addEventListener("click", function () {
      const isActive = this.getAttribute("aria-expanded") === "true";
      this.setAttribute("aria-expanded", !isActive);
      const content = this.nextElementSibling;

      if (!isActive) {
        content.classList.add("active");
        content.style.maxHeight = content.scrollHeight + "px";
      } else {
        content.classList.remove("active");
        content.style.maxHeight = null;
      }
    });
  });

  // Links in der Seitenleiste
  allPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    loadPrompts("all");
    sidebar.classList.remove("visible");
  });
  singlePromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    loadPrompts("single");
    sidebar.classList.remove("visible");
  });
  categorisedPromptsLink.addEventListener("click", (e) => {
    e.preventDefault();
    loadPrompts("categorised");
    sidebar.classList.remove("visible");
  });

  // Übersicht öffnen
  overviewBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/app.html") });
  });

  // Settings Modal
  const settingsModal = document.getElementById("settings-modal");
  const closeModal = document.getElementById("close-modal");
  settingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "block";
  });
  closeModal.addEventListener("click", () => {
    settingsModal.style.display = "none";
  });
  window.addEventListener("click", (event) => {
    if (event.target === settingsModal) {
      settingsModal.style.display = "none";
    }
  });

  // FAQ Modal
  const faqModal = document.getElementById("faq-modal");
  const closeFaqModal = document.getElementById("close-faq-modal");
  faqBtn.addEventListener("click", () => {
    faqModal.style.display = "block";
  });
  closeFaqModal.addEventListener("click", () => {
    faqModal.style.display = "none";
  });
  window.addEventListener("click", (event) => {
    if (event.target === faqModal) {
      faqModal.style.display = "none";
    }
  });

  // New Prompt Modal
  const newPromptModal = document.getElementById("new-prompt-modal");
  const closeNewPromptModal = document.getElementById("close-new-prompt-modal");
  const createPromptBtn = document.getElementById("create-prompt-btn");
  const promptTextInput = document.getElementById("prompt-text");
  const folderSelect = document.getElementById("folder-select");

  function updateFolderSelect() {
    chrome.storage.sync.get(null, function (data) {
      folderSelect.innerHTML = '<option value="">-- Kein Ordner --</option>';
      Object.entries(data).forEach(([id, topic]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = topic.name;
        folderSelect.appendChild(option);
      });
    });
  }

  newPromptBtn.addEventListener("click", () => {
    updateFolderSelect();
    newPromptModal.style.display = "block";
  });
  closeNewPromptModal.addEventListener("click", () => {
    newPromptModal.style.display = "none";
    promptTextInput.value = "";
    folderSelect.value = "";
  });
  window.addEventListener("click", (event) => {
    if (event.target === newPromptModal) {
      newPromptModal.style.display = "none";
      promptTextInput.value = "";
      folderSelect.value = "";
    }
  });

  createPromptBtn.addEventListener("click", () => {
    const promptText = promptTextInput.value.trim();
    const selectedFolder = folderSelect.value || `prompt_${Date.now()}`;

    if (promptText) {
      chrome.storage.sync.get(null, function (data) {
        const updatedData = data || {};
        if (selectedFolder in updatedData) {
          updatedData[selectedFolder].prompts.push(promptText);
        } else {
          updatedData[selectedFolder] = {
            name: promptText.slice(0, 20),
            prompts: [promptText],
          };
        }
        chrome.storage.sync.set(updatedData, () => {
          newPromptModal.style.display = "none";
          promptTextInput.value = "";
          folderSelect.value = "";
          loadPrompts();
          loadFolders();
        });
      });
    } else {
      alert("Bitte geben Sie eine Prompt ein!");
    }
  });

  // Suche
  inputField.addEventListener("input", function () {
    const searchTerm = inputField.value.trim().toLowerCase();
    chrome.storage.sync.get(null, function (data) {
      promptList.innerHTML = "";
      let filteredPrompts = [];

      Object.entries(data).forEach(([id, topic]) => {
        filteredPrompts = filteredPrompts.concat(
          topic.prompts
            .filter((prompt) => prompt.toLowerCase().includes(searchTerm))
            .map((prompt, index) => ({ prompt, folderId: id, index }))
        );
      });

      if (filteredPrompts.length === 0) {
        noData.style.display = "block";
      } else {
        noData.style.display = "none";
        filteredPrompts.forEach(({ prompt, folderId, index }) => {
          const promptItem = createPromptItem(prompt, folderId, index);
          promptList.appendChild(promptItem);
        });
      }
    });
  });

  // Speicher leeren
  clearStorageBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all data?")) {
      chrome.storage.sync.clear(() => {
        promptList.innerHTML = "";
        noData.style.display = "block";
        loadFolders();
      });
    }
  });

  // Theme wechseln
  document
    .getElementById("theme-select")
    .addEventListener("change", function (e) {
      document.documentElement.setAttribute("data-theme", e.target.value);
      localStorage.setItem("theme", e.target.value);
    });
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("theme-select").value = savedTheme;

  // Initiale Anzeige
  loadPrompts();
});
