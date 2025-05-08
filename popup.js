document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("inputField");
  const promptList = document.getElementById("promptList");
  const noData = document.getElementById("noData");
  const burgerBtn = document.querySelector(".burger-btn");
  const sidebar = document.querySelector(".sidebar");
  const allPromptsLink = document.getElementById("all-prompts-link");
  const favoritesLink = document.getElementById("favorites-prompts-link");
  const singlePromptsLink = document.getElementById("single-prompts-link");
  const categorisedPromptsLink = document.getElementById(
    "categorised-prompts-link"
  );
  const trashLink = document.getElementById("trash-link");
  const folderNavList = document.getElementById("folderNavList");
  const collapsibles = document.querySelectorAll(".collapsible");
  const overviewBtn = document.getElementById("overview-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const faqBtn = document.getElementById("faq-btn");
  const newPromptBtn = document.querySelector(".new-prompt");
  const clearStorageBtn = document.getElementById("clear-storage");

  // Funktion zum Laden der Ordner in der Seitenleiste
  function loadFolders() {
    chrome.storage.sync.get(null, function (data) {
      folderNavList.innerHTML = "";

      if (!data || Object.keys(data).length === 0) {
        folderNavList.innerHTML = "<p>No folders yet!</p>";
        return;
      }

      const folders = Object.entries(data).filter(
        ([, topic]) =>
          topic.prompts &&
          Array.isArray(topic.prompts) &&
          !topic.isHidden &&
          !topic.isTrash
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

  // Funktion zum Anzeigen eines spezifischen Ordners
  function showFolder(folderId) {
    loadPrompts(folderId);
    sidebar.classList.remove("visible");
  }

  // Burger-Menü ein-/ausblenden
  burgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("visible");
    if (sidebar.classList.contains("visible")) {
      loadFolders();
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
  favoritesLink.addEventListener("click", (e) => {
    e.preventDefault();
    loadPrompts("favorites");
    sidebar.classList.remove("visible");
  });
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
  if (trashLink) {
    trashLink.addEventListener("click", (e) => {
      e.preventDefault();
      loadPrompts("trash");
      sidebar.classList.remove("visible");
    });
  }

  // Übersicht öffnen
  overviewBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("/pages/app.html") });
  });

  // Settings Modal
  const settingsModal = document.getElementById("settings-modal");
  settingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "block";
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
  const promptTitleInput = document.getElementById("prompt-title");
  const promptDescInput = document.getElementById("prompt-description");
  const promptContentInput = document.getElementById("prompt-content");
  const folderSelect = document.getElementById("folder-select");

  function updateFolderSelect() {
    chrome.storage.sync.get(null, function (data) {
      folderSelect.innerHTML =
        '<option value="">No folder (single prompt)</option>';
      if (data) {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && !topic.isHidden && !topic.isTrash) {
            const option = document.createElement("option");
            option.value = id;
            option.textContent = topic.name;
            folderSelect.appendChild(option);
          }
        });
      }
    });
  }

  newPromptBtn.addEventListener("click", () => {
    updateFolderSelect();
    newPromptModal.style.display = "block";
  });

  closeNewPromptModal.addEventListener("click", () => {
    newPromptModal.style.display = "none";
    promptTitleInput.value = "";
    promptDescInput.value = "";
    promptContentInput.value = "";
    folderSelect.value = "";
  });

  window.addEventListener("click", (event) => {
    if (event.target === newPromptModal) {
      newPromptModal.style.display = "none";
      promptTitleInput.value = "";
      promptDescInput.value = "";
      promptContentInput.value = "";
      folderSelect.value = "";
    }
  });

  createPromptBtn.addEventListener("click", () => {
    const title = promptTitleInput.value.trim();
    const description = promptDescInput.value.trim();
    const content = promptContentInput.value.trim();
    const selectedFolder = folderSelect.value;

    if (!title || !content) {
      alert("Title and content are required!");
      return;
    }

    chrome.storage.sync.get(null, function (data) {
      const updatedData = data || {};
      const promptObj = { title, content };
      if (description) promptObj.description = description;

      const updates = {};

      if (selectedFolder) {
        if (!updatedData[selectedFolder]) {
          console.error(`Folder ${selectedFolder} does not exist.`);
          alert("Selected folder does not exist. Please try again.");
          return;
        }
        updatedData[selectedFolder].prompts =
          updatedData[selectedFolder].prompts || [];
        updatedData[selectedFolder].prompts.push(promptObj);
        updates[selectedFolder] = updatedData[selectedFolder];
      } else {
        const newFolderId = `hidden_folder_${Date.now()}_${Math.floor(
          Math.random() * 10000
        )}`;
        updates[newFolderId] = {
          name: title.slice(0, 50),
          prompts: [promptObj],
          isHidden: true,
        };
      }

      chrome.storage.sync.set(updates, function () {
        if (chrome.runtime.lastError) {
          console.error("Error saving prompt:", chrome.runtime.lastError);
          alert("Error saving prompt. Please try again.");
        } else {
          console.log("Prompt created successfully");
          newPromptModal.style.display = "none";
          promptTitleInput.value = "";
          promptDescInput.value = "";
          promptContentInput.value = "";
          folderSelect.value = "";
          loadPrompts("all"); // Lade alle Prompts nach Erstellung
          loadFolders();
        }
      });
    });
  });

  // Suche
  inputField.addEventListener("input", function () {
    const searchTerm = inputField.value.trim().toLowerCase();
    chrome.storage.sync.get(null, function (data) {
      promptList.innerHTML = "";
      let filteredPrompts = [];

      if (data) {
        Object.entries(data).forEach(([id, topic]) => {
          if (topic.prompts && !topic.isTrash) {
            filteredPrompts = filteredPrompts.concat(
              topic.prompts
                .filter((prompt) => {
                  return (
                    prompt.title.toLowerCase().includes(searchTerm) ||
                    (prompt.description &&
                      prompt.description.toLowerCase().includes(searchTerm)) ||
                    prompt.content.toLowerCase().includes(searchTerm)
                  );
                })
                .map((prompt, index) => ({
                  prompt,
                  folderId: id,
                  index,
                  isHidden: topic.isHidden || false,
                }))
            );
          }
        });
      }

      if (filteredPrompts.length === 0) {
        noData.style.display = "block";
        noData.textContent = "No prompts found";
      } else {
        noData.style.display = "none";
        filteredPrompts.forEach(({ prompt, folderId, index, isHidden }) => {
          const promptItem = createPromptItem(
            prompt,
            folderId,
            index,
            isHidden,
            false
          );
          promptList.appendChild(promptItem);
        });
      }
    });
  });

  // Speicher leeren
  clearStorageBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      chrome.storage.sync.clear(() => {
        promptList.innerHTML = "";
        noData.style.display = "block";
        noData.textContent = "No prompts available";
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

  // Initiale Anzeige: Alle Prompts laden
  loadPrompts("all");
  loadFolders();

  document.getElementById("feedback-btn").addEventListener("click", () => {
    window.open("https://forms.gle/9fN4XeUbhFL1xsyx8", "_blank");
  });

  document
    .getElementById("feature-request-btn")
    .addEventListener("click", () => {
      window.open("https://forms.gle/5EM4tPz9b7d1p6iB7", "_blank");
    });
});
