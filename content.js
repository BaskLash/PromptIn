setInterval(() => {
  // Always in use; That's why on top
  const path = window.location.pathname;

  // Only hide if the user is on the Home Feed
  if (
    window.location.hostname === "github.com" &&
    path.startsWith("/copilot/c/")
  ) {
    addCopilotButton();
  }
  if (window.location.hostname === "chatgpt.com") {
    addChatGPTButton();
  }
  if (
    window.location.hostname === "gemini.google.com" &&
    path.startsWith("/app/")
  ) {
    addGeminiButton();
  }
  if (window.location.hostname === "grok.com" && path.startsWith("/chat/")) {
    addGrokButton();
  }
  if (
    (window.location.hostname === "blackbox.ai" ||
      window.location.hostname === "www.blackbox.ai") &&
    path.startsWith("/chat/")
  ) {
    addBlackBoxButton();
  }
  if (
    (window.location.hostname === "claude.ai" ||
      window.location.hostname === "www.claude.ai") &&
    path.startsWith("/chat/")
  ) {
    addClaudeButton();
  }
  if (
    (window.location.hostname === "copilot.microsoft.com" ||
      window.location.hostname === "www.copilot.microsoft.com") &&
    path.startsWith("/chats/")
  ) {
    addMicrosoftCopilotButton();
  }
  if (
    (window.location.hostname === "chat.mistral.ai" ||
      window.location.hostname === "www.chat.mistral.ai") &&
    path.startsWith("/chat/")
  ) {
    addMistralButton();
  }
  if (
    window.location.hostname === "duckduckgo.com" ||
    window.location.hostname === "www.duckduckgo.com"
  ) {
    addDuckduckGoButton();
  }
  if (
    window.location.hostname === "perplexity.ai" ||
    (window.location.hostname === "www.perplexity.ai" &&
      path.startsWith("/search/"))
  ) {
    addPerplexityButton();
  }
  if (
    window.location.hostname === "chat.deepseek.com" ||
    (window.location.hostname === "www.chat.deepseek.com" &&
      path.startsWith("/a/chat/s/"))
  ) {
    addDeepSeekButton();
  }
  if (
    window.location.hostname === "v0.dev" ||
    (window.location.hostname === "www.v0.dev" && path.startsWith("/chat/"))
  ) {
    addV0DevButton();
  }
  if (
    window.location.hostname === "deepai.org" ||
    (window.location.hostname === "www.deepai.org" && path.startsWith("/chat/"))
  ) {
    addDeepaiButton();
  }
  if (
    window.location.hostname === "chat.qwen.ai" ||
    (window.location.hostname === "www.chat.qwen.ai" && path.startsWith("/c/"))
  ) {
    addQwenAiButton();
  }
}, 3000); // Alle 3 Sekunden prüfen

inputFieldTrigger();

// Subfunction to handle creating a new prompt
async function createNewPrompt(
  promptTitle,
  promptDescription,
  promptContent,
  closeModal
) {
  const promptId = `prompt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

  const newPrompt = {
    title: promptTitle,
    description: promptDescription,
    content: promptContent,
    createdAt: Date.now(),
    folderId: null, // kein zugewiesener Ordner
    versions: [
      {
        versionId: generateUUID(),
        title: promptTitle,
        description: promptDescription,
        content: promptContent,
        timestamp: Date.now(),
      },
    ],
  };

  try {
    // Bestehende Prompts laden
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["prompts"], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    const prompts = data.prompts || {};
    prompts[promptId] = newPrompt;

    // Neuen Prompt speichern
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ prompts }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log("Neuer Prompt gespeichert:", { promptId });
          resolve();
        }
      });
    });

    closeModal();
  } catch (error) {
    console.error("Fehler beim Erstellen des Prompts:", error);
    alert("Fehler beim Erstellen des Prompts: " + error.message);
  }
}

// Subfunction to handle replacing an existing prompt
async function replacePrompt(
  promptTitle,
  promptDescription,
  promptContent,
  folderId,
  promptId,
  closeModal
) {
  try {
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["prompts", "folders"], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    const { prompts = {}, folders = {} } = data;

    if (!prompts[promptId]) {
      alert("Prompt nicht gefunden!");
      return;
    }

    const oldPrompt = prompts[promptId];

    // Neue Version anhängen
    const newVersion = {
      versionId: generateUUID(),
      title: promptTitle,
      description: promptDescription,
      content: promptContent,
      timestamp: Date.now(),
    };

    const updatedPrompt = {
      ...oldPrompt,
      title: promptTitle,
      description: promptDescription,
      content: promptContent,
      updatedAt: Date.now(),
      versions: [newVersion, ...(oldPrompt.versions || [])],
    };

    prompts[promptId] = updatedPrompt;

    // Optional: Wenn das Prompt der einzige Eintrag in einem Folder ist, kann man den Namen anpassen
    if (folderId && folders[folderId]) {
      const folder = folders[folderId];
      if (folder.promptIds.length === 1) {
        folder.name = promptTitle;
      }
    }

    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ prompts, folders }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Prompt ${promptId} erfolgreich ersetzt.`);
          resolve();
        }
      });
    });

    closeModal();
  } catch (error) {
    console.error("Fehler beim Ersetzen des Prompts:", error);
    alert("Fehler beim Ersetzen des Prompts.");
  }
}

// Subfunction to handle adding a prompt to a folder
async function addPromptToFolder(
  promptTitle,
  promptDescription,
  promptContent,
  folderId,
  closeModal
) {
  const promptId = `prompt_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const promptObject = {
    title: promptTitle,
    description: promptDescription,
    content: promptContent,
    createdAt: Date.now(),
    folderId: folderId,
    versions: [
      {
        versionId: generateUUID(),
        title: promptTitle,
        description: promptDescription,
        content: promptContent,
        timestamp: Date.now(),
      },
    ],
  };

  try {
    // Fetch existing prompts and folders
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["prompts", "folders"], (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    const prompts = data.prompts || {};
    const folders = data.folders || {};

    // Ensure the folder exists
    if (!folders[folderId]) {
      throw new Error(`Folder ${folderId} does not exist.`);
    }

    // Add new prompt to prompts object
    prompts[promptId] = promptObject;

    // Update folder's promptIds
    folders[folderId].promptIds = folders[folderId].promptIds || [];
    folders[folderId].promptIds.push(promptId);

    // Save updated prompts and folders
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ prompts, folders }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Prompt ${promptId} added to folder ${folderId}`);
          resolve();
        }
      });
    });

    closeModal();
  } catch (error) {
    console.error("Error adding prompt to folder:", error);
    alert("Fehler beim Hinzufügen des Prompts: " + error.message);
  }
}

// Subfunction to handle combining with an existing prompt
async function combineWithExistingPrompt(
  promptTitle,
  promptDescription,
  combinedText,
  promptId,
  closeModal
) {
  try {
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get("prompts", (data) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });

    const prompts = data.prompts || {};

    if (!prompts[promptId]) {
      alert("Prompt nicht gefunden!");
      return;
    }

    const existingPrompt = prompts[promptId];

    // Nur content aktualisieren
    existingPrompt.content = combinedText;

    // Neue Version hinzufügen
    const newVersion = {
      versionId: generateUUID(),
      title: existingPrompt.title || "Untitled Prompt",
      description: existingPrompt.description || "",
      content: combinedText,
      timestamp: Date.now(),
    };

    if (!existingPrompt.versions) {
      existingPrompt.versions = [];
    }

    existingPrompt.versions.unshift(newVersion); // Neueste Version zuerst

    prompts[promptId] = existingPrompt;

    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ prompts }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(
            `Prompt ${promptId} erfolgreich kombiniert und gespeichert.`
          );
          resolve();
        }
      });
    });

    closeModal();
  } catch (error) {
    console.error("Fehler beim Kombinieren des Prompts:", error);
    alert("Fehler beim Kombinieren des Prompts.");
  }
}

async function promptSaver(message) {
  // Sicherstellen, dass der DOM verfügbar ist
  if (!document.body || !document.head) {
    console.error(
      "DOM nicht verfügbar: document.body oder document.head fehlt."
    );
    alert("Fehler: Seite nicht vollständig geladen. Bitte versuche es erneut.");
    return;
  }

  console.log("promptSaver aufgerufen mit message:", message);

  // Shadow Host erstellen
  const shadowHost = document.createElement("div");
  shadowHost.id = "prompt-saver-shadow-host";
  document.body.appendChild(shadowHost);

  // Shadow Root anfügen
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });

  // Modal-Elemente erstellen
  const modal = document.createElement("div");
  modal.id = "myModal";
  modal.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const modalHeader = document.createElement("div");
  modalHeader.className = "modal-header";

  const closeSpan = document.createElement("span");
  closeSpan.className = "close";
  closeSpan.innerHTML = "×";

  const headerTitle = document.createElement("h2");
  headerTitle.textContent = "Save Prompt";

  const modalBody = document.createElement("div");
  modalBody.className = "modal-body";

  // Schritt 1: Prompt-Titel und Beschreibung
  const titleSection = document.createElement("div");
  titleSection.className = "step-section active";

  const promptTitleLabel = document.createElement("label");
  promptTitleLabel.setAttribute("for", "promptTitle");
  promptTitleLabel.textContent = "Prompt Title:";

  const promptTitleInput = document.createElement("input");
  promptTitleInput.type = "text";
  promptTitleInput.id = "promptTitle";
  promptTitleInput.name = "promptTitle";
  promptTitleInput.placeholder = "Gib einen Titel für deinen Prompt ein";

  const promptDescLabel = document.createElement("label");
  promptDescLabel.setAttribute("for", "promptDescription");
  promptDescLabel.textContent = "Prompt Description:";

  const promptDescInput = document.createElement("textarea");
  promptDescInput.id = "promptDescription";
  promptDescInput.name = "promptDescription";
  promptDescInput.rows = 3;
  promptDescInput.placeholder = "Gib eine Beschreibung für deinen Prompt ein";

  const nextToPromptButton = document.createElement("button");
  nextToPromptButton.textContent = "Next";
  nextToPromptButton.className = "next-button";

  // Schritt 2: Prompt-Textarea
  const promptSection = document.createElement("div");
  promptSection.className = "step-section";

  const promptTextareaLabel = document.createElement("label");
  promptTextareaLabel.setAttribute("for", "promptTextarea");
  promptTextareaLabel.textContent = "Your Prompt:";

  const promptTextarea = document.createElement("textarea");
  promptTextarea.id = "promptTextarea";
  promptTextarea.name = "promptTextarea";
  promptTextarea.rows = 10;
  promptTextarea.style.width = "100%";

  message =
    typeof message === "string" ? message.trim() : String(message).trim();
  const originalMessage = message;
  let processedMessage = message.includes(":")
    ? message.split(":")[0].trim()
    : message;

  promptTextarea.value = processedMessage;
  promptTextarea.placeholder = "Bearbeite deinen Prompt hier...";

  const checkboxContainer = document.createElement("div");
  checkboxContainer.style.marginTop = "10px";
  checkboxContainer.style.display = "flex";
  checkboxContainer.style.alignItems = "center";
  checkboxContainer.style.display = message.includes(":") ? "flex" : "none";

  const showFullContentCheckbox = document.createElement("input");
  showFullContentCheckbox.type = "checkbox";
  showFullContentCheckbox.id = "showFullContent";
  showFullContentCheckbox.name = "showFullContent";
  showFullContentCheckbox.style.width = "16px";
  showFullContentCheckbox.style.height = "16px";
  showFullContentCheckbox.style.marginRight = "10px";

  const checkboxLabel = document.createElement("label");
  checkboxLabel.setAttribute("for", "showFullContent");
  checkboxLabel.textContent = "Gesamten Inhalt anzeigen (inkl. Text nach ':')";
  checkboxLabel.style.fontSize = "14px";
  checkboxLabel.style.marginTop = "5px";
  checkboxLabel.style.userSelect = "none";

  showFullContentCheckbox.addEventListener("change", (e) => {
    promptTextarea.value = e.target.checked
      ? originalMessage
      : originalMessage.includes(":")
      ? originalMessage.split(":")[0].trim()
      : originalMessage;
  });

  promptTextarea.addEventListener("input", (e) => {
    const currentText = e.target.value;
    checkboxContainer.style.display = currentText.includes(":")
      ? "flex"
      : "none";
  });

  const promptButtons = document.createElement("div");
  promptButtons.className = "button-group";
  promptButtons.style.marginTop = "10px";

  const backToTitleButton = document.createElement("button");
  backToTitleButton.textContent = "Back";
  backToTitleButton.className = "back-button";

  const nextToOptionsButton = document.createElement("button");
  nextToOptionsButton.textContent = "Next";
  nextToOptionsButton.className = "next-button";

  promptSection.appendChild(promptTextareaLabel);
  promptSection.appendChild(promptTextarea);
  checkboxContainer.appendChild(showFullContentCheckbox);
  checkboxContainer.appendChild(checkboxLabel);
  promptSection.appendChild(checkboxContainer);
  promptButtons.appendChild(backToTitleButton);
  promptButtons.appendChild(nextToOptionsButton);
  promptSection.appendChild(promptButtons);

  // Schritt 3: Optionen
  const optionsSection = document.createElement("div");
  optionsSection.className = "step-section";

  const optionsHeader = document.createElement("p");
  optionsHeader.textContent = "Options:";

  const optionsSwitch = document.createElement("div");
  optionsSwitch.className = "options-switch";

  const subOptionButtons = [
    { text: "Create new prompt", id: "create" },
    { text: "Replace prompt", id: "replace" },
    { text: "Add prompt to folder", id: "add" },
    { text: "Combine with existing prompt", id: "combine" },
  ];

  subOptionButtons.forEach((btn, index) => {
    const button = document.createElement("button");
    button.textContent = btn.text;
    button.setAttribute("data-tab", btn.id);
    if (index === 0) button.classList.add("active");
    optionsSwitch.appendChild(button);
  });

  const createContent = document.createElement("div");
  createContent.id = "create";
  createContent.className = "option-content active";
  const createText = document.createElement("p");
  createText.textContent =
    "Creates a new prompt without assigning it to a folder. Click 'Save' to confirm.";
  createContent.appendChild(createText);

  const replaceContent = document.createElement("div");
  replaceContent.id = "replace";
  replaceContent.className = "option-content";
  const replaceText = document.createElement("p");
  replaceText.textContent =
    "Select a folder and prompt to replace with the new prompt:";

  const replaceFolderLabel = document.createElement("label");
  replaceFolderLabel.setAttribute("for", "replaceFolderSelect");
  replaceFolderLabel.textContent = "Select folder or Category focusing:";

  const replaceFolderSelect = document.createElement("select");
  replaceFolderSelect.id = "replaceFolderSelect";
  replaceFolderSelect.innerHTML = '<option value="">Select a folder</option>';

  const similarPromptsLabel = document.createElement("label");
  similarPromptsLabel.setAttribute("for", "similarPromptsDropdown");
  similarPromptsLabel.textContent = "Similar Prompts:";

  const similarPromptsDropdown = document.createElement("div");
  similarPromptsDropdown.id = "similarPromptsDropdown";
  similarPromptsDropdown.className = "dropdown";

  const dropdownButton = document.createElement("button");
  dropdownButton.className = "dropdown-button";
  dropdownButton.textContent = "Select a similar prompt";
  dropdownButton.style.width = "100%";
  dropdownButton.style.padding = "10px";
  dropdownButton.style.border = "1px solid #dcdcdc";
  dropdownButton.style.borderRadius = "4px";
  dropdownButton.style.background = "#fff";
  dropdownButton.style.textAlign = "left";

  const dropdownContent = document.createElement("div");
  dropdownContent.className = "dropdown-content";
  dropdownContent.style.display = "none";
  dropdownContent.style.position = "absolute";
  dropdownContent.style.backgroundColor = "#fff";
  dropdownContent.style.border = "1px solid #dcdcdc";
  dropdownContent.style.borderRadius = "4px";
  dropdownContent.style.width = "100%";
  dropdownContent.style.maxHeight = "300px";
  dropdownContent.style.overflowY = "auto";
  dropdownContent.style.zIndex = "10001";
  dropdownContent.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";

  similarPromptsDropdown.appendChild(dropdownButton);
  similarPromptsDropdown.appendChild(dropdownContent);

  const replacePromptLabel = document.createElement("label");
  replacePromptLabel.setAttribute("for", "replacePromptSelect");
  replacePromptLabel.textContent = "Select prompt to replace:";

  const replacePromptSelect = document.createElement("select");
  replacePromptSelect.id = "replacePromptSelect";
  replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';
  replacePromptSelect.disabled = true;

  const diffOutputLabel = document.createElement("label");
  diffOutputLabel.setAttribute("for", "promptDiffOutput");
  diffOutputLabel.textContent = "Prompt Differences:";

  const diffOutput = document.createElement("div");
  diffOutput.id = "promptDiffOutput";
  diffOutput.className =
    "diff-output border rounded p-2 bg-gray-50 min-h-[100px] text-sm font-mono whitespace-pre-wrap";

  replaceContent.appendChild(replaceText);
  replaceContent.appendChild(similarPromptsLabel);
  replaceContent.appendChild(similarPromptsDropdown);
  replaceContent.appendChild(replaceFolderLabel);
  replaceContent.appendChild(replaceFolderSelect);
  replaceContent.appendChild(replacePromptLabel);
  replaceContent.appendChild(replacePromptSelect);
  replaceContent.appendChild(diffOutputLabel);
  replaceContent.appendChild(diffOutput);

  const addContent = document.createElement("div");
  addContent.id = "add";
  addContent.className = "option-content";
  const addFolderLabel = document.createElement("label");
  addFolderLabel.setAttribute("for", "addFolderSelect");
  addFolderLabel.textContent = "Select folder to add prompt to:";
  const addFolderSelect = document.createElement("select");
  addFolderSelect.id = "addFolderSelect";
  addFolderSelect.innerHTML = '<option value="">Select a folder</option>';

  addContent.appendChild(addFolderLabel);
  addContent.appendChild(addFolderSelect);

  const newFolderSection = document.createElement("div");
  newFolderSection.className = "new-folder-section";
  newFolderSection.style.marginTop = "10px";

  const newFolderLabel = document.createElement("label");
  newFolderLabel.setAttribute("for", "newFolderName");
  newFolderLabel.textContent = "Or create a new folder:";
  newFolderLabel.style.marginBottom = "6px";

  const newFolderInput = document.createElement("input");
  newFolderInput.type = "text";
  newFolderInput.id = "newFolderName";
  newFolderInput.name = "newFolderName";
  newFolderInput.placeholder = "Enter new folder name";
  newFolderInput.style.marginBottom = "10px";

  const createFolderButton = document.createElement("button");
  createFolderButton.textContent = "Create Folder";
  createFolderButton.className = "create-folder-button";
  createFolderButton.style.padding = "8px 16px";
  createFolderButton.style.background = "#1e90ff";
  createFolderButton.style.color = "white";
  createFolderButton.style.border = "none";
  createFolderButton.style.borderRadius = "4px";
  createFolderButton.style.cursor = "pointer";
  createFolderButton.style.fontWeight = "600";
  createFolderButton.style.transition = "background 0.2s ease";
  createFolderButton.addEventListener("mouseover", () => {
    createFolderButton.style.background = "#4169e1";
  });
  createFolderButton.addEventListener("mouseout", () => {
    createFolderButton.style.background = "#1e90ff";
  });

  newFolderSection.appendChild(newFolderLabel);
  newFolderSection.appendChild(newFolderInput);
  newFolderSection.appendChild(createFolderButton);
  addContent.appendChild(newFolderSection);

  const combineContent = document.createElement("div");
  combineContent.id = "combine";
  combineContent.className = "option-content";

  const combineText = document.createElement("p");
  combineText.textContent =
    "Select an existing prompt to combine with the new prompt:";

  const suggestedPromptsLabel = document.createElement("label");
  suggestedPromptsLabel.setAttribute("for", "suggestedPromptsDropdown");
  suggestedPromptsLabel.textContent = "Suggested Prompts:";

  const suggestedPromptsDropdown = document.createElement("div");
  suggestedPromptsDropdown.id = "suggestedPromptsDropdown";
  suggestedPromptsDropdown.className = "dropdown";
  suggestedPromptsDropdown.style.marginBottom = "12px";

  const suggestedDropdownButton = document.createElement("button");
  suggestedDropdownButton.className = "dropdown-button";
  suggestedDropdownButton.textContent = "Select a suggested prompt";
  suggestedDropdownButton.style.width = "100%";
  suggestedDropdownButton.style.padding = "10px";
  suggestedDropdownButton.style.border = "1px solid #dcdcdc";
  suggestedDropdownButton.style.borderRadius = "4px";
  suggestedDropdownButton.style.background = "#fff";
  suggestedDropdownButton.style.textAlign = "left";

  const suggestedDropdownContent = document.createElement("div");
  suggestedDropdownContent.className = "dropdown-content";
  suggestedDropdownContent.style.display = "none";
  suggestedDropdownContent.style.position = "absolute";
  suggestedDropdownContent.style.backgroundColor = "#fff";
  suggestedDropdownContent.style.border = "1px solid #dcdcdc";
  suggestedDropdownContent.style.borderRadius = "4px";
  suggestedDropdownContent.style.width = "100%";
  suggestedDropdownContent.style.maxHeight = "300px";
  suggestedDropdownContent.style.overflowY = "auto";
  suggestedDropdownContent.style.zIndex = "10001";
  suggestedDropdownContent.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";

  suggestedPromptsDropdown.appendChild(suggestedDropdownButton);
  suggestedPromptsDropdown.appendChild(suggestedDropdownContent);

  const combinePromptLabel = document.createElement("label");
  combinePromptLabel.setAttribute("for", "combinePromptSelect");
  combinePromptLabel.textContent = "Select existing prompt:";

  const combinePromptSelect = document.createElement("select");
  combinePromptSelect.id = "combinePromptSelect";
  combinePromptSelect.innerHTML = '<option value="">Select a prompt</option>';

  const previewLabel = document.createElement("label");
  previewLabel.setAttribute("for", "combinedPromptPreview");
  previewLabel.textContent = "Combined Prompt Preview:";

  const combinedPromptPreview = document.createElement("textarea");
  combinedPromptPreview.id = "combinedPromptPreview";
  combinedPromptPreview.className = "combined-prompt-diff";
  combinedPromptPreview.style.width = "100%";
  combinedPromptPreview.style.color = "black";
  combinedPromptPreview.style.minHeight = "150px";
  combinedPromptPreview.style.padding = "10px";
  combinedPromptPreview.style.border = "1px solid #dcdcdc";
  combinedPromptPreview.style.borderRadius = "4px";
  combinedPromptPreview.style.background = "#f8f9fa";
  combinedPromptPreview.style.fontSize = "14px";
  combinedPromptPreview.style.whiteSpace = "pre-wrap";
  combinedPromptPreview.placeholder = "The combined prompt will appear here...";

  combineContent.appendChild(combineText);
  combineContent.appendChild(suggestedPromptsLabel);
  combineContent.appendChild(suggestedPromptsDropdown);
  combineContent.appendChild(combinePromptLabel);
  combineContent.appendChild(combinePromptSelect);
  combineContent.appendChild(previewLabel);
  combineContent.appendChild(combinedPromptPreview);

  const optionsButtons = document.createElement("div");
  optionsButtons.className = "button-group";

  const backToPromptEditButton = document.createElement("button");
  backToPromptEditButton.textContent = "Back";
  backToPromptEditButton.className = "back-button";

  const saveButton = document.createElement("button");
  saveButton.className = "save-button";
  saveButton.textContent = "Speichern";

  optionsButtons.appendChild(backToPromptEditButton);
  optionsButtons.appendChild(saveButton);

  optionsSection.appendChild(optionsHeader);
  optionsSection.appendChild(optionsSwitch);
  optionsSection.appendChild(createContent);
  optionsSection.appendChild(replaceContent);
  optionsSection.appendChild(addContent);
  optionsSection.appendChild(combineContent);
  optionsSection.appendChild(optionsButtons);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer";

  // Stile definieren
  const style = document.createElement("style");
  style.textContent = `
    .modal {
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(3px);
    }
    .modal-content {
      background: #fff;
      margin: 5% auto;
      padding: 0;
      width: 90%;
      max-width: 800px;
      min-height: 500px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
    .modal-header {
      padding: 16px 24px;
      background: linear-gradient(135deg, #1e90ff, #4169e1);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.6em;
      font-weight: 600;
    }
    .modal-body {
      padding: 24px;
      color: #2c3e50;
    }
    .step-section {
      display: none;
    }
    .step-section.active {
      display: block;
    }
    .options-switch {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      background: #f1f3f5;
      padding: 4px;
      border-radius: 6px;
    }
    .options-switch button {
      flex: 1;
      padding: 10px;
      background: none;
      border: none;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border-radius: 4px;
      color: black;
    }
    .options-switch button:hover {
      background: #e9ecef;
    }
    .options-switch button.active {
      background: #1e90ff;
      color: white;
    }
    .option-content {
      display: none;
    }
    .option-content.active {
      display: block;
    }
    .new-folder-section {
      margin-top: 10px;
    }
    .create-folder-button:hover {
      background: #4169e1 !important;
    }
    .modal-body label {
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 6px;
      display: block;
      color: #34495e;
    }
    .modal-body input,
    .modal-body select,
    .modal-body textarea,
    .modal-body .diff-output {
      width: 100%;
      padding: 10px;
      margin-bottom: 12px;
      border: 1px solid #dcdcdc;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s ease;
    }
    .modal-body input:focus,
    .modal-body select:focus,
    .modal-body textarea:focus,
    .modal-body .diff-output:focus {
      border-color: #1e90ff;
      outline: none;
    }
    .modal-body textarea {
      resize: vertical;
      min-height: 120px;
    }
    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
    .next-button, .back-button {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .next-button {
      background: #1e90ff;
      color: white;
    }
    .next-button:hover {
      background: #4169e1;
    }
    .back-button {
      background: #6c757d;
      color: white;
    }
    .back-button:hover {
      background: #5a6268;
    }
    .modal-footer {
      padding: 16px 24px;
      background: #f8f9fa;
      text-align: right;
    }
    .save-button {
      padding: 10px 20px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
      display: none;
    }
    .modal-content.options-active .save-button {
      display: block;
    }
    .save-button:hover {
      background: #218838;
    }
    .close {
      color: white;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .close:hover,
    .close:focus {
      transform: scale(1.1);
    }
    .diff-word.added {
      background-color: #d4fcbc;
      color: black;
    }
    .diff-word.removed {
      background-color: #fbb6c2;
      color: black;
      text-decoration: line-through;
    }
    .diff-word.common {
      background-color: #e5e7eb;
    }
    .diff-word {
      padding: 2px;
      margin: 2px;
      border-radius: 2px;
      transition: background-color 0.2s;
    }
    .arrow {
      color: #1e90ff;
      font-weight: bold;
      margin: 0 4px;
    }
    .dropdown {
      position: relative;
      margin-bottom: 12px;
    }
    .dropdown-button {
      cursor: pointer;
      color: #2c3e50 !important;
      width: 100%;
      padding: 10px;
      border: 1px solid #dcdcdc;
      border-radius: 4px;
      background: #ffffff !important;
      text-align: left;
      font-size: 14px;
    }
    .diff-word.existing {
      background-color: #b3e5fc;
      color: black;
    }
    .diff-word.new {
      background-color: #d4fcbc;
      color: black;
    }
    .combined-prompt-diff {
      box-sizing: border-box;
      overflow-y: auto;
      max-height: 300px;
    }
    #combine p,
    #combine label,
    #combine select,
    #combine div {
      margin-bottom: 12px;
    }
    .dropdown-content {
      display: none;
      background: #ffffff !important;
      color: #2c3e50 !important;
      border: 1px solid #dcdcdc;
      border-radius: 4px;
      width: 100%;
      max-height: 300px;
      overflow-y: auto;
      z-index: 10010;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      position: absolute;
      top: calc(100% + 5px);
      left: 0;
    }
    .dropdown-content[style*="display: block"] {
      display: block !important;
    }
    .dropdown-item {
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      background: #ffffff !important;
      color: #2c3e50 !important;
    }
    .dropdown-item:last-child {
      border-bottom: none;
    }
    .dropdown-item:hover {
      background: #f1f3f5 !important;
    }
    .dropdown-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dropdown-item-title {
      font-weight: 600;
      color: #34495e !important;
      font-size: 14px;
    }
    .dropdown-item-toggle {
      cursor: pointer;
      color: #1e90ff !important;
      font-size: 13px;
    }
    .modal-body textarea,
    .combined-prompt-diff,
    .dropdown-content {
      max-width: 100%;
    }
    .dropdown-item-content {
      margin-top: 8px;
      padding: 10px;
      background: #f8f9fa !important;
      color: #2c3e50 !important;
      border-radius: 4px;
      font-size: 13px;
      white-space: pre-wrap;
    }
    .dropdown-item-content.active {
      display: block !important;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dropdown-item-diff .diff-word.added {
      background-color: #d4fcbc;
      color: black;
    }
    .dropdown-item-diff .diff-word.removed {
      background-color: #fbb6c2;
      color: black;
      text-decoration: line-through;
    }
    .dropdown-item-diff .diff-word.common {
      background-color: #e5e7eb;
    }
    .dropdown-item-diff .diff-word {
      padding: 2px;
      margin: 2px;
      border-radius: 2px;
    }
    .dropdown-item-diff .arrow {
      color: #1e90ff;
      font-weight: bold;
      margin: 0 4px;
    }
    .dropdown-item-label {
      font-weight: 600;
      color: #34495e;
      font-size: 14px;
      margin-bottom: 5px;
    }
  `;

  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);

  titleSection.appendChild(promptTitleLabel);
  titleSection.appendChild(promptTitleInput);
  titleSection.appendChild(promptDescLabel);
  titleSection.appendChild(promptDescInput);
  titleSection.appendChild(nextToPromptButton);

  modalBody.appendChild(titleSection);
  modalBody.appendChild(promptSection);
  modalBody.appendChild(optionsSection);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);

  modal.appendChild(modalContent);

  try {
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(modal);
    console.log("Modal created and appended to shadow root");
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Modals zum Shadow Root:", error);
    alert("Fehler beim Erstellen des Modals. Bitte versuche es erneut.");
    return;
  }

  function closeModal() {
    modal.style.display = "none";
    observer.disconnect();
    try {
      document.body.removeChild(shadowHost);
    } catch (error) {
      console.error("Fehler beim Entfernen des Shadow Hosts:", error);
    }
  }

  setTimeout(() => {
    modal.style.display = "block";
    console.log("Modal display set to block");
    if (promptTitleInput) {
      promptTitleInput.focus();
    }
  }, 100);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (modal.style.display !== "block") {
        console.warn("Modal display changed unexpectedly, restoring...");
        modal.style.display = "block";
      }
    });
  });
  observer.observe(modal, { attributes: true, attributeFilter: ["style"] });

  closeSpan.addEventListener("click", closeModal);

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  function computeCosineSimilarity(text1, text2) {
    const words1 = text1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w);
    const words2 = text2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w);
    const allWords = [...new Set([...words1, ...words2])];

    const vector1 = allWords.map(
      (word) => words1.filter((w) => w === word).length
    );
    const vector2 = allWords.map(
      (word) => words2.filter((w) => w === word).length
    );

    const dotProduct = vector1.reduce((sum, a, i) => sum + a * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, a) => sum + a * a, 0));

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  function computePromptDiff(currentPrompt, selectedPrompt) {
    const diffOutput = shadowRoot.getElementById("promptDiffOutput");
    diffOutput.innerHTML = "";

    const words1 = selectedPrompt.split(/\s+/).filter((w) => w);
    const words2 = currentPrompt.split(/\s+/).filter((w) => w);

    let i = 0,
      j = 0;
    const unifiedDiff = [];

    while (i < words1.length || j < words2.length) {
      if (i < words1.length && j < words2.length && words1[i] === words2[j]) {
        unifiedDiff.push({ value: words1[i], type: "common" });
        i++;
        j++;
      } else {
        let foundMatch = false;
        for (let k = j; k < Math.min(words2.length, j + 3); k++) {
          for (let m = i; m < Math.min(words1.length, i + 3); m++) {
            if (words1[m] === words2[k]) {
              while (i < m) {
                unifiedDiff.push({ value: words1[i], type: "removed" });
                i++;
              }
              while (j < k) {
                unifiedDiff.push({ value: words2[j], type: "added" });
                j++;
              }
              unifiedDiff.push({ value: words1[m], type: "common" });
              i++;
              j++;
              foundMatch = true;
              break;
            }
          }
          if (foundMatch) break;
        }
        if (!foundMatch) {
          if (i < words1.length) {
            unifiedDiff.push({ value: words1[i], type: "removed" });
            i++;
          }
          if (j < words2.length) {
            unifiedDiff.push({ value: words2[j], type: "added" });
            j++;
          }
        }
      }
    }

    let lastWasRemoved = false;
    unifiedDiff.forEach((part, index) => {
      const span = document.createElement("span");
      span.className = `diff-word ${part.type}`;
      span.textContent = part.value + " ";

      if (lastWasRemoved && part.type === "added") {
        const prevPart = unifiedDiff[index - 1];
        if (prevPart && prevPart.type === "removed") {
          const arrow = document.createElement("span");
          arrow.textContent = "→ ";
          arrow.className = "arrow";
          diffOutput.appendChild(arrow);
        }
      }

      diffOutput.appendChild(span);
      lastWasRemoved = part.type === "removed";
    });
  }

  function computeCombinedPromptDiff(existingPrompt, newPrompt, outputElement) {
    outputElement.value = "";

    const words1 = (existingPrompt || "").split(/\s+/).filter((w) => w);
    const words2 = (newPrompt || "").split(/\s+/).filter((w) => w);

    words1.forEach((word) => {
      const span = document.createElement("span");
      span.className = "diff-word existing";
      span.textContent = word + " ";
      outputElement.appendChild(span);
    });

    if (words1.length > 0 && words2.length > 0) {
      const separator = document.createElement("span");
      separator.textContent = " ";
      outputElement.appendChild(separator);
    }

    words2.forEach((word) => {
      const span = document.createElement("span");
      span.className = "diff-word new";
      span.textContent = word + " ";
      outputElement.appendChild(span);
    });

    if (words1.length === 0 && words2.length === 0) {
      outputElement.textContent = "The combined prompt will appear here...";
    }

    const combinedText = [...words1, ...words2].join(" ");
    outputElement.value =
      combinedText || "The combined prompt will appear here...";
  }

  async function loadFolders() {
    try {
      const data = await new Promise((resolve, reject) => {
        chrome.storage.local.get(["folders"], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result.folders || {});
          }
        });
      });

      const folders = Object.entries(data).filter(
        ([, folder]) => !folder.isHidden && !folder.isTrash
      );

      // Dropdown zum Ersetzen eines Ordners
      replaceFolderSelect.innerHTML = `
      <option value="">Select a folder or category</option>
      <optgroup label="Categorised Prompts">
        ${folders
          .map(
            ([id, folder]) => `<option value="${id}">${folder.name}</option>`
          )
          .join("")}
      </optgroup>
    `;

      // Dropdown zum Hinzufügen zu einem Ordner
      addFolderSelect.innerHTML = `
      <option value="">Select a folder</option>
      ${folders
        .map(([id, folder]) => `<option value="${id}">${folder.name}</option>`)
        .join("")}
    `;
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  }

  async function loadCombinePrompts(currentPrompt) {
    try {
      const data = await new Promise((resolve, reject) => {
        chrome.storage.local.get(["folders", "prompts"], (data) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(data);
          }
        });
      });

      const folders = data.folders || {};
      const prompts = data.prompts || {};

      combinePromptSelect.innerHTML =
        '<option value="">Select a prompt</option>';
      suggestedDropdownContent.innerHTML = "";
      suggestedDropdownButton.textContent = "Select a suggested prompt";
      suggestedPromptsDropdown.style.display = "none";
      suggestedPromptsLabel.style.display = "none";

      const allPrompts = [];

      Object.entries(prompts).forEach(([promptId, prompt]) => {
        if (prompt.isDeleted) return;

        const folderId = prompt.folderId || null;
        const folder = folderId ? folders[folderId] : null;

        const folderName = folder?.isHidden
          ? "Single Prompt"
          : folder?.name || "Ohne Ordner";

        const similarity = currentPrompt
          ? computeCosineSimilarity(currentPrompt, prompt.content || "")
          : 0;

        allPrompts.push({
          promptId,
          folderId,
          title: prompt.title || "Untitled Prompt",
          content: prompt.content || "",
          folderName,
          createdAt: prompt.createdAt || 0,
          similarity,
        });
      });

      allPrompts
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach((prompt) => {
          const option = document.createElement("option");
          option.value = prompt.promptId;
          option.textContent = `${prompt.title} (${prompt.folderName})`;
          option.title = prompt.title;
          combinePromptSelect.appendChild(option);
        });

      const displaySuggestedPrompts = (prompts) => {
        prompts.forEach((prompt) => {
          const item = document.createElement("div");
          item.className = "dropdown-item";
          item.setAttribute("data-value", prompt.promptId);

          const header = document.createElement("div");
          header.className = "dropdown-item-header";

          const title = document.createElement("span");
          title.className = "dropdown-item-title";
          title.textContent =
            prompt.title.length > 50
              ? prompt.title.slice(0, 50) + "..."
              : prompt.title;
          title.title = `${prompt.title} (Ähnlichkeit: ${(
            prompt.similarity * 100
          ).toFixed(2)}%, Kategorie: ${prompt.folderName}, Erstellt: ${new Date(
            prompt.createdAt
          ).toLocaleDateString()})`;

          const toggle = document.createElement("span");
          toggle.className = "dropdown-item-toggle";
          toggle.textContent = "Inhalt anzeigen";

          header.appendChild(title);
          header.appendChild(toggle);

          const contentWrapper = document.createElement("div");
          contentWrapper.className = "dropdown-item-content-wrapper";
          contentWrapper.style.display = "none";

          const contentLabel = document.createElement("div");
          contentLabel.className = "dropdown-item-label";
          contentLabel.textContent = "Prompt-Inhalt:";

          const content = document.createElement("div");
          content.className = "dropdown-item-content";
          content.style.marginBottom = "10px";
          content.style.padding = "10px";
          content.style.background = "#f8f9fa";
          content.style.borderRadius = "4px";
          content.style.fontSize = "13px";
          content.style.color = "#2c3e50";
          content.style.whiteSpace = "pre-wrap";
          content.textContent = prompt.content || "Kein Inhalt verfügbar";

          contentWrapper.appendChild(contentLabel);
          contentWrapper.appendChild(content);

          item.appendChild(header);
          item.appendChild(contentWrapper);

          toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isActive = contentWrapper.style.display === "block";
            contentWrapper.style.display = isActive ? "none" : "block";
            toggle.textContent = isActive
              ? "Inhalt anzeigen"
              : "Inhalt ausblenden";
          });

          item.addEventListener("click", () => {
            combinePromptSelect.value = prompt.promptId;
            suggestedDropdownButton.textContent = prompt.title;
            suggestedDropdownContent.style.display = "none";
            const event = new Event("change");
            combinePromptSelect.dispatchEvent(event);
          });

          suggestedDropdownContent.appendChild(item);
        });

        suggestedPromptsDropdown.style.display = "block";
        suggestedPromptsLabel.style.display = "block";
      };

      const getRelevantPrompts = () => {
        if (currentPrompt?.trim()) {
          return allPrompts
            .sort((a, b) => {
              if (a.createdAt !== b.createdAt) return b.createdAt - a.createdAt;
              return b.similarity - a.similarity;
            })
            .slice(0, 5);
        } else {
          return allPrompts
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);
        }
      };

      const relevantPrompts = getRelevantPrompts();

      if (relevantPrompts.length > 0) {
        displaySuggestedPrompts(relevantPrompts);
      } else {
        suggestedDropdownContent.innerHTML =
          "<div class='dropdown-item'>Keine passenden Prompts gefunden.</div>";
        suggestedPromptsDropdown.style.display = "block";
        suggestedPromptsLabel.style.display = "block";
      }
    } catch (error) {
      console.error("Fehler beim Laden der Combine-Prompts:", error);
      combinePromptSelect.innerHTML =
        '<option value="">Fehler beim Laden der Prompts</option>';
      suggestedDropdownContent.innerHTML =
        "<div class='dropdown-item'>Fehler beim Laden der Vorschläge.</div>";
      suggestedPromptsDropdown.style.display = "block";
      suggestedPromptsLabel.style.display = "block";
    }
  }

  async function loadSimilarPrompts(currentPrompt) {
    dropdownContent.innerHTML = "";
    dropdownButton.textContent = "Select a similar prompt";
    similarPromptsDropdown.style.display = "none";
    similarPromptsLabel.style.display = "none";

    if (!currentPrompt || currentPrompt.trim() === "") {
      dropdownContent.innerHTML =
        "<div class='dropdown-item'>Kein Prompt eingegeben.</div>";
      similarPromptsDropdown.style.display = "block";
      similarPromptsLabel.style.display = "block";
      return;
    }

    try {
      const data = await new Promise((resolve, reject) => {
        chrome.storage.local.get(null, (data) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(data);
          }
        });
      });

      const allPrompts = [];

      Object.entries(data).forEach(([folderId, folder]) => {
        if (folder.isTrash || !folder.prompts) return;

        folder.prompts.forEach((prompt, index) => {
          if (!prompt || !prompt.content) return;

          const similarity = computeCosineSimilarity(
            currentPrompt,
            prompt.content
          );
          allPrompts.push({
            promptId: `${folderId}:${index}`,
            title: prompt.title || "Untitled Prompt",
            description: prompt.description || "Keine Beschreibung verfügbar",
            content: prompt.content,
            similarity,
            isHidden: folder.isHidden || false,
            folderName: folder.isHidden
              ? "Single Prompt"
              : folder.name || "Unbenannter Ordner",
            folderId: folderId,
          });
        });
      });

      const similarPrompts = allPrompts
        .filter((p) => p.similarity > 0.1)
        .sort((a, b) => b.similarity - a.similarity);

      if (similarPrompts.length === 0) {
        dropdownContent.innerHTML =
          "<div class='dropdown-item'>Keine ähnlichen Prompts gefunden.</div>";
        similarPromptsDropdown.style.display = "block";
        similarPromptsLabel.style.display = "block";
        return;
      }

      similarPromptsDropdown.style.display = "block";
      similarPromptsLabel.style.display = "block";

      similarPrompts.forEach((prompt) => {
        const item = document.createElement("div");
        item.className = "dropdown-item";
        item.setAttribute("data-value", prompt.promptId);

        const header = document.createElement("div");
        header.className = "dropdown-item-header";

        const title = document.createElement("span");
        title.className = "dropdown-item-title";
        title.textContent =
          prompt.title.length > 50
            ? prompt.title.slice(0, 50) + "..."
            : prompt.title;
        title.title = `${prompt.title} (Ähnlichkeit: ${(
          prompt.similarity * 100
        ).toFixed(2)}%)`;

        const toggle = document.createElement("span");
        toggle.className = "dropdown-item-toggle";
        toggle.textContent = "Inhalt anzeigen";

        header.appendChild(title);
        header.appendChild(toggle);

        const contentWrapper = document.createElement("div");
        contentWrapper.className = "dropdown-item-content-wrapper";
        contentWrapper.style.display = "none";

        const contentLabel = document.createElement("div");
        contentLabel.className = "dropdown-item-label";
        contentLabel.textContent = "Prompt-Inhalt:";

        const content = document.createElement("div");
        content.className = "dropdown-item-content";
        content.style.marginBottom = "10px";
        content.style.padding = "10px";
        content.style.background = "#f8f9fa";
        content.style.borderRadius = "4px";
        content.style.fontSize = "13px";
        content.style.color = "#2c3e50";
        content.style.whiteSpace = "pre-wrap";
        content.textContent = prompt.content || "Kein Inhalt verfügbar";

        contentWrapper.appendChild(contentLabel);
        contentWrapper.appendChild(content);

        item.appendChild(header);
        item.appendChild(contentWrapper);

        toggle.addEventListener("click", (e) => {
          e.stopPropagation();
          const isActive = contentWrapper.style.display === "block";
          contentWrapper.style.display = isActive ? "none" : "block";
          toggle.textContent = isActive
            ? "Inhalt anzeigen"
            : "Inhalt ausblenden";
        });

        item.addEventListener("click", () => {
          replaceFolderSelect.value = prompt.isHidden
            ? "single"
            : prompt.folderId;
          replacePromptSelect.disabled = false;
          replacePromptSelect.innerHTML =
            '<option value="">Select a prompt</option>';

          chrome.storage.local.get(prompt.folderId, (data) => {
            const folder = data[prompt.folderId];
            if (folder && folder.prompts) {
              const promptOptions = folder.prompts.map((p, index) => ({
                promptId: `${prompt.folderId}:${index}`,
                title: p.title || "Untitled Prompt",
              }));

              promptOptions.forEach((p) => {
                const option = document.createElement("option");
                option.value = p.promptId;
                option.textContent = p.title;
                if (p.promptId === prompt.promptId) option.selected = true;
                replacePromptSelect.appendChild(option);
              });
            }
          });

          dropdownButton.textContent = prompt.title;
          dropdownContent.style.display = "none";
          computePromptDiff(currentPrompt, prompt.content);
        });

        dropdownContent.appendChild(item);
      });
    } catch (error) {
      console.error("Fehler beim Laden ähnlicher Prompts:", error);
      dropdownContent.innerHTML =
        "<div class='dropdown-item'>Fehler beim Laden ähnlicher Prompts.</div>";
      similarPromptsDropdown.style.display = "block";
      similarPromptsLabel.style.display = "block";
    }
  }

  createFolderButton.addEventListener("click", async () => {
    const newFolderName = newFolderInput.value.trim();
    if (!newFolderName) {
      alert("Bitte gib einen Ordnernamen ein!");
      return;
    }

    const newFolderId = `folder_${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}`;
    const newFolder = {
      name: newFolderName,
      promptIds: [],
      isHidden: false,
      isTrash: false,
    };

    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.get(["folders"], (data) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          const folders = data.folders || {};
          folders[newFolderId] = newFolder;

          chrome.storage.local.set({ folders }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              console.log("Neuer Ordner erstellt:", newFolder);
              resolve();
            }
          });
        });
      });

      const option = document.createElement("option");
      option.value = newFolderId;
      option.textContent = newFolderName;
      option.selected = true;
      addFolderSelect.appendChild(option);
      newFolderInput.value = "";
      alert(`Ordner "${newFolderName}" erfolgreich erstellt!`);
    } catch (error) {
      console.error("Fehler beim Erstellen des Ordners:", error);
      alert("Fehler beim Erstellen des Ordners.");
    }
  });

  replaceFolderSelect.addEventListener("change", async (e) => {
    const folderId = replaceFolderSelect.value;
    replacePromptSelect.disabled = !folderId;
    replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';
    shadowRoot.getElementById("promptDiffOutput").innerHTML = "";

    if (folderId) {
      try {
        if (folderId === "single") {
          const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(null, (data) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(data);
              }
            });
          });

          let singlePrompts = [];
          Object.entries(data).forEach(([id, topic]) => {
            if (topic.isHidden && !topic.isTrash && topic.prompts) {
              topic.prompts.forEach((prompt, index) => {
                singlePrompts.push({
                  folderId: id,
                  index,
                  title: prompt.title || "Untitled Prompt",
                });
              });
            }
          });

          singlePrompts.forEach((prompt) => {
            const option = document.createElement("option");
            option.value = `${prompt.folderId}:${prompt.index}`;
            option.textContent =
              prompt.title.length > 50
                ? prompt.title.slice(0, 50) + "..."
                : prompt.title;
            option.title = prompt.title;
            replacePromptSelect.appendChild(option);
          });
        } else {
          const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(folderId, (data) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(data);
              }
            });
          });

          const topic = data[folderId];
          if (topic && topic.prompts) {
            topic.prompts.forEach((prompt, index) => {
              const option = document.createElement("option");
              option.value = index;
              const promptTitle = prompt.title || "Untitled Prompt";
              option.textContent =
                promptTitle.length > 50
                  ? promptTitle.slice(0, 50) + "..."
                  : promptTitle;
              option.title = promptTitle;
              replacePromptSelect.appendChild(option);
            });
          }
        }
      } catch (error) {
        console.error("Error fetching folder data:", error);
      }
    }
  });

  combinePromptSelect.addEventListener("change", async (e) => {
    const promptValue = combinePromptSelect.value;
    combinedPromptPreview.innerHTML = "The combined prompt will appear here...";

    if (promptValue !== "") {
      try {
        const [folderId, promptIndex] = promptValue.split(":");
        const data = await new Promise((resolve, reject) => {
          chrome.storage.local.get(folderId, (data) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(data);
            }
          });
        });

        const topic = data[folderId];
        if (topic && topic.prompts && topic.prompts[promptIndex]) {
          const existingPrompt = topic.prompts[promptIndex].content || "";
          const currentPrompt = promptTextarea.value.trim();
          computeCombinedPromptDiff(
            existingPrompt,
            currentPrompt,
            combinedPromptPreview
          );
        } else {
          combinedPromptPreview.textContent =
            "Error: Selected prompt not found.";
        }
      } catch (error) {
        console.error("Error fetching prompt for combine:", error);
        combinedPromptPreview.textContent = "Error loading combined prompt.";
      }
    }
  });

  replacePromptSelect.addEventListener("change", async (e) => {
    const folderId = replaceFolderSelect.value;
    const promptValue = replacePromptSelect.value;

    if (folderId && promptValue !== "") {
      try {
        if (folderId === "single") {
          const [singleFolderId, promptIndex] = promptValue.split(":");
          const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(singleFolderId, (data) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(data);
              }
            });
          });

          const topic = data[singleFolderId];
          if (topic && topic.prompts && topic.prompts[promptIndex]) {
            const selectedPrompt = topic.prompts[promptIndex].content;
            const currentPrompt = promptTextarea.value.trim();
            computePromptDiff(currentPrompt, selectedPrompt);
          }
        } else {
          const promptIndex = promptValue;
          const data = await new Promise((resolve, reject) => {
            chrome.storage.local.get(folderId, (data) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(data);
              }
            });
          });

          const topic = data[folderId];
          if (topic && topic.prompts && topic.prompts[promptIndex]) {
            const selectedPrompt = topic.prompts[promptIndex].content;
            const currentPrompt = promptTextarea.value.trim();
            computePromptDiff(currentPrompt, selectedPrompt);
          }
        }
      } catch (error) {
        console.error("Error fetching prompt data:", error);
        shadowRoot.getElementById("promptDiffOutput").innerHTML =
          "Error loading prompt differences.";
      }
    } else {
      shadowRoot.getElementById("promptDiffOutput").innerHTML = "";
    }
  });

  dropdownButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const currentDisplay = dropdownContent.style.display;
    dropdownContent.style.display =
      currentDisplay === "block" ? "none" : "block";
  });

  suggestedDropdownButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const currentDisplay = suggestedDropdownContent.style.display;
    suggestedDropdownContent.style.display =
      currentDisplay === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!similarPromptsDropdown.contains(e.target)) {
      dropdownContent.style.display = "none";
    }
    if (!suggestedPromptsDropdown.contains(e.target)) {
      suggestedDropdownContent.style.display = "none";
    }
  });

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  promptTextarea.addEventListener(
    "input",
    debounce(() => {
      const currentPrompt = promptTextarea.value.trim();
      if (currentPrompt) {
        loadSimilarPrompts(currentPrompt);
      }
    }, 500)
  );

  nextToPromptButton.addEventListener("click", (e) => {
    if (promptTitleInput.value.trim() === "") {
      alert("Bitte gib einen Prompt-Titel ein!");
      return;
    }
    if (promptDescInput.value.trim() === "") {
      alert("Bitte gib eine Prompt-Beschreibung ein!");
      return;
    }
    titleSection.classList.remove("active");
    promptSection.classList.add("active");
    promptTextarea.focus();
  });

  backToTitleButton.addEventListener("click", () => {
    promptSection.classList.remove("active");
    titleSection.classList.add("active");
    promptTitleInput.focus();
  });

  nextToOptionsButton.addEventListener("click", () => {
    if (promptTextarea.value.trim() === "") {
      alert("Bitte gib einen Prompt-Inhalt ein!");
      return;
    }
    promptSection.classList.remove("active");
    optionsSection.classList.add("active");
    modalContent.classList.add("options-active");
    loadFolders();
    loadCombinePrompts(promptTextarea.value.trim());
    loadSimilarPrompts(promptTextarea.value.trim());
  });

  backToPromptEditButton.addEventListener("click", () => {
    optionsSection.classList.remove("active");
    promptSection.classList.add("active");
    modalContent.classList.remove("options-active");
    promptTextarea.focus();
  });

  optionsSwitch.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      optionsSwitch
        .querySelectorAll("button")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      optionsSection
        .querySelectorAll(".option-content")
        .forEach((content) => content.classList.remove("active"));
      const targetContent = optionsSection.querySelector(
        `#${button.getAttribute("data-tab")}`
      );
      if (targetContent) targetContent.classList.add("active");
    });
  });

  saveButton.addEventListener("click", async () => {
    const activeOption = optionsSwitch
      .querySelector("button.active")
      .getAttribute("data-tab");
    const promptTitle = promptTitleInput.value.trim();
    const promptDescription = promptDescInput.value.trim();
    const promptContent = promptTextarea.value.trim();

    if (!promptTitle || !promptDescription || !promptContent) {
      alert(
        "Bitte fülle alle Felder aus (Titel, Beschreibung, Prompt-Inhalt)!"
      );
      return;
    }

    switch (activeOption) {
      case "create":
        await createNewPrompt(
          promptTitle,
          promptDescription,
          promptContent,
          closeModal
        );
        break;

      case "replace":
        const folderId = replaceFolderSelect.value;
        const promptValue = replacePromptSelect.value;
        if (!folderId || !promptValue) {
          alert("Bitte wähle einen Ordner und einen Prompt zum Ersetzen aus!");
          return;
        }
        await replacePrompt(
          promptTitle,
          promptDescription,
          promptContent,
          folderId,
          promptValue,
          closeModal
        );
        break;

      case "add":
        const addFolderId = addFolderSelect.value;
        if (!addFolderId) {
          alert("Bitte wähle einen Ordner aus oder erstelle einen neuen!");
          return;
        }
        await addPromptToFolder(
          promptTitle,
          promptDescription,
          promptContent,
          addFolderId,
          closeModal
        );
        break;

      case "combine":
        const combinePromptValue = combinePromptSelect.value;
        if (!combinePromptValue) {
          alert("Bitte wähle einen Prompt zum Kombinieren aus!");
          return;
        }
        const combinedText = combinedPromptPreview.value.trim();
        if (!combinedText) {
          alert("Kombinierter Prompt-Inhalt ist leer!");
          return;
        }
        await combineWithExistingPrompt(
          promptTitle,
          promptDescription,
          combinedText,
          combinePromptValue,
          closeModal
        );
        break;

      default:
        alert("Ungültige Option ausgewählt!");
    }
  });
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

document.addEventListener("DOMContentLoaded", removeElement);

// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
let currentIcon = null;

function createIcon(x, y, selectedText) {
  removeCurrentIcon();

  // Inject CSS einmalig
  if (!document.getElementById("text-marker-style")) {
    const style = document.createElement("style");
    style.id = "text-marker-style";
    style.textContent = `
      .text-marker-icon {
        position: absolute;
        cursor: pointer;
        z-index: 9999;
        transition: transform 0.3s ease;
        background: none; /* Kein Hintergrund, um Weiß/Blau zu entfernen */
        border: none; /* Kein Rahmen, um das Icon klar hervorzuheben */
        padding: 0; /* Padding entfernt, Größe wird durch Bild bestimmt */
      }

      .text-marker-icon:hover {
        transform: scale(1.3) rotate(5deg); /* Vergrößerung und Drehung für Effekt */
      }

      .text-marker-icon img {
        width: 48px; /* Größere, gut sichtbare Größe */
        height: 48px;
        display: block; /* Sicherstellen, dass das Bild korrekt dargestellt wird */
      }

      .text-marker-icon::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(ellipse at center, rgba(0, 123, 255, 0.3), transparent 70%);
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 50%;
        pointer-events: none;
      }

      .text-marker-icon:hover::after {
        opacity: 1; /* Subtiler blauer Halo-Effekt beim Hover */
      }

      .animate-icon {
        animation: spinIn 0.4s ease-out;
      }

      @keyframes spinIn {
        from {
          transform: scale(0.8) rotate(-90deg);
          opacity: 0;
        }
        to {
          transform: scale(1) rotate(0deg);
          opacity: 1;
        }
      }

      .text-marker-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
    `;
    document.head.appendChild(style);
  }

  // Icon-Wrapper
  const icon = document.createElement("div");
  icon.className = "text-marker-icon";
  icon.style.left = `${x + 10}px`;
  icon.style.top = `${y + 10}px`;
  icon.title = "Klicke hier, um den markierten Text zu speichern";

  // Dein eigenes Icon-Bild
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("icon/icon48.png");
  img.alt = "Speichern";
  img.onerror = () => {
    console.error("Bild konnte nicht geladen werden: ", img.src);
  };
  img.onload = () => {
    console.log("Bild erfolgreich geladen: ", img.src);
  };
  icon.appendChild(img);

  icon.addEventListener("click", () => {
    promptSaver(selectedText);
    removeCurrentIcon();
  });

  document.body.appendChild(icon);
  icon.classList.add("animate-icon");
  currentIcon = icon;
}

function removeCurrentIcon() {
  if (currentIcon && currentIcon.parentElement) {
    currentIcon.remove();
    currentIcon = null;
  }
}

// Hauptlistener
document.addEventListener("mouseup", () => {
  setTimeout(() => {
    chrome.storage.local.get(["enabled"], (result) => {
      console.log("Enabled status:", result.enabled); // DEBUG

      if (!result.enabled) return;

      const selection = window.getSelection();
      const text = selection.toString().trim();
      console.log("Markierter Text:", text); // DEBUG

      if (text.length === 0) {
        removeCurrentIcon();
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      createIcon(rect.right + window.scrollX, rect.top + window.scrollY, text);
    });
  }, 0);
});
