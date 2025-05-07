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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📩 Message received in content.js:", request);

  if (request.action !== "usePrompt") {
    sendResponse({
      status: "unknown_action",
      message: "Action not recognized",
    });
    return true;
  }

  console.log("✅ usePrompt action received!");
  const inputHandlers = {
    copilot: {
      selector: "textarea#copilot-chat-textarea",
      setText: (element, text) => (element.value = text),
    },
    gemini: {
      selector:
        ".text-input-field_textarea-inner > rich-textarea > [role='textbox'] > p",
      setText: (element, text) => (element.innerHTML = text),
    },
    blackbox: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    chatGPT: {
      selector: "#composer-background",
      setText: setChatGPTText,
    },
    grok: {
      selector: ".relative.z-10 > textarea",
      setText: (element, text) => (element.value = text),
    },
    claude: {
      selector: ".ProseMirror > p",
      setText: (element, text) => (element.innerHTML = text),
    },
    microCopilot: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    mistral: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    duckduckgo: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    perplexity: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
    deepseek: {
      selector: "textarea",
      setText: (element, text) => (element.value = text),
    },
  };

  handlePromptInsertion(inputHandlers, request.text, sendResponse);
  return true; // Required for asynchronous sendResponse
});

inputFieldTrigger();

// Helper Functions
function handlePromptInsertion(handlers, text, sendResponse) {
  let success = false;

  for (const [name, { selector, setText }] of Object.entries(handlers)) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        setText(element, text);
        triggerInputEvent(element);
        console.log(`✍️ Text inserted into ${name}:`, text);
        success = true;
      }
    } catch (error) {
      console.warn(`⚠️ Error processing ${name} input:`, error);
    }
  }

  sendResponse({
    status: success ? "success" : "error",
    message: success
      ? "Prompt inserted successfully"
      : "No suitable input found",
  });
}

function triggerInputEvent(element) {
  if (element.tagName === "TEXTAREA" || element.isContentEditable) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function setChatGPTText(startElement, text) {
  let currentElement = startElement;
  for (let level = 1; level <= 6; level++) {
    currentElement = Array.from(currentElement.children).find(
      (child) => child.tagName === "DIV"
    );
    if (!currentElement) {
      console.log(`Ebene ${level}: Kein DIV-Kind gefunden`);
      return;
    }
    console.log(`Ebene ${level}: DIV gefunden:`, currentElement);
  }

  const paragraph = currentElement.querySelector("p");
  if (paragraph) {
    paragraph.textContent = text;
    console.log("Paragraph erfolgreich gefunden und Wert gesetzt:", text);
  } else {
    console.log("Ebene 7: Kein Paragraph-Element gefunden");
  }
}

/**
 * Displays a modal for saving a prompt with a multi-step form, using Shadow DOM for isolation.
 * @param {string} message The initial prompt message to display.
 */
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

  showFullContentCheckbox.addEventListener("change", (e) => {
    promptTextarea.value = e.target.checked
      ? originalMessage
      : originalMessage.includes(":")
      ? originalMessage.split(":")[0].trim()
      : originalMessage;
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
  replaceFolderLabel.textContent = "Select folder:";
  const replaceFolderSelect = document.createElement("select");
  replaceFolderSelect.id = "replaceFolderSelect";
  replaceFolderSelect.innerHTML = '<option value="">Select a folder</option>';

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

  const optionsButtons = document.createElement("div");
  optionsButtons.className = "button-group";
  const backToPromptButton = document.createElement("button");
  backToPromptButton.textContent = "Back";
  backToPromptButton.className = "back-button";

  optionsSection.appendChild(optionsHeader);
  optionsSection.appendChild(optionsSwitch);
  optionsSection.appendChild(createContent);
  optionsSection.appendChild(replaceContent);
  optionsSection.appendChild(addContent);
  optionsButtons.appendChild(backToPromptButton);
  optionsSection.appendChild(optionsButtons);

  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer";

  const saveButton = document.createElement("button");
  saveButton.className = "save-button";
  saveButton.textContent = "Speichern";

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
      max-width: 600px;
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
      background: #218 Ascendant: #218838;
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
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in {
      animation: fadeIn 0.3s ease-in;
    }
  `;

  // Modal zusammenbauen
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

  modalFooter.appendChild(saveButton);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);

  modal.appendChild(modalContent);

  // Stile und Modal zum Shadow Root hinzufügen
  try {
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(modal);
    console.log("Modal created and appended to shadow root");
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Modals zum Shadow Root:", error);
    alert("Fehler beim Erstellen des Modals. Bitte versuche es erneut.");
    return;
  }

  // Funktion zum Schließen des Modals
  function closeModal() {
    modal.style.display = "none";
    observer.disconnect(); // Observer stoppen
    try {
      document.body.removeChild(shadowHost);
    } catch (error) {
      console.error("Fehler beim Entfernen des Shadow Hosts:", error);
    }
  }

  // Modal asynchron anzeigen
  setTimeout(() => {
    modal.style.display = "block";
    console.log("Modal display set to block");
    if (promptTitleInput) {
      promptTitleInput.focus(); // Fokus auf das erste Eingabefeld setzen
    }
  }, 100);

  // MutationObserver zum Schutz vor DOM-Mutationen
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (modal.style.display !== "block") {
        console.warn("Modal display changed unexpectedly, restoring...");
        modal.style.display = "block";
      }
    });
  });
  observer.observe(modal, { attributes: true, attributeFilter: ["style"] });

  // Modal schließen bei Klick auf Schließen-Span
  closeSpan.addEventListener("click", closeModal);

  // Modal schließen bei Klick außerhalb
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Modal schließen bei Escape-Taste
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  // Funktion zum Berechnen und Anzeigen der Prompt-Differenz
  function computePromptDiff(currentPrompt, selectedPrompt) {
    const diffOutput = shadowRoot.getElementById("promptDiffOutput");
    diffOutput.innerHTML = "";

    // Split texts into words
    const words1 = selectedPrompt.split(/\s+/).filter((w) => w);
    const words2 = currentPrompt.split(/\s+/).filter((w) => w);

    // Compute diff
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

    // Render diff
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

  // Ordner für Replace- und Add-Optionen laden
  async function loadFolders() {
    try {
      const data = await new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (data) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(data);
          }
        });
      });

      const folders = Object.entries(data).filter(
        ([, topic]) =>
          topic.prompts && Array.isArray(topic.prompts) && !topic.isHidden
      );

      replaceFolderSelect.innerHTML =
        '<option value="">Select a folder</option>';
      folders.forEach(([id, topic]) => {
        if (topic.prompts.length > 0) {
          const option = document.createElement("option");
          option.value = id;
          option.textContent = topic.name;
          replaceFolderSelect.appendChild(option);
        }
      });

      addFolderSelect.innerHTML = '<option value="">Select a folder</option>';
      folders.forEach(([id, topic]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = topic.name;
        addFolderSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  // Prompts für ausgewählten Ordner in Replace-Option laden
  replaceFolderSelect.addEventListener("change", async (e) => {
    const folderId = replaceFolderSelect.value;
    replacePromptSelect.disabled = !folderId;
    replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';
    shadowRoot.getElementById("promptDiffOutput").innerHTML = "";

    if (folderId) {
      try {
        const data = await new Promise((resolve, reject) => {
          chrome.storage.sync.get(folderId, (data) => {
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
      } catch (error) {
        console.error("Error fetching folder data:", error);
      }
    }
  });

  // Event-Listener für Prompt-Auswahl zum Anzeigen der Differenz
  replacePromptSelect.addEventListener("change", async (e) => {
    const folderId = replaceFolderSelect.value;
    const promptIndex = replacePromptSelect.value;

    if (folderId && promptIndex !== "") {
      try {
        const data = await new Promise((resolve, reject) => {
          chrome.storage.sync.get(folderId, (data) => {
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
      } catch (error) {
        console.error("Error fetching prompt data:", error);
        shadowRoot.getElementById("promptDiffOutput").innerHTML =
          "Error loading prompt differences.";
      }
    } else {
      shadowRoot.getElementById("promptDiffOutput").innerHTML = "";
    }
  });

  // Schritt-Navigation
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
  });

  backToTitleButton.addEventListener("click", (e) => {
    promptSection.classList.remove("active");
    titleSection.classList.add("active");
  });

  nextToOptionsButton.addEventListener("click", async (e) => {
    if (promptTextarea.value.trim() === "") {
      alert("Bitte gib einen Prompt-Text ein!");
      return;
    }
    await loadFolders();
    promptSection.classList.remove("active");
    optionsSection.classList.add("active");
    modalContent.classList.add("options-active");
  });

  backToPromptButton.addEventListener("click", (e) => {
    optionsSection.classList.remove("active");
    promptSection.classList.add("active");
    modalContent.classList.remove("options-active");
  });

  // Options-Switcher-Logik mit Event-Delegation
  optionsSwitch.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const buttons = shadowRoot.querySelectorAll(".options-switch button");
      const contents = shadowRoot.querySelectorAll(".option-content");
      buttons.forEach((btn) => {
        if (btn) btn.classList.remove("active");
      });
      contents.forEach((c) => {
        if (c) c.classList.remove("active");
      });
      e.target.classList.add("active");
      const tabContent = shadowRoot.getElementById(
        e.target.getAttribute("data-tab")
      );
      if (tabContent) {
        tabContent.classList.add("active");
      } else {
        console.warn(
          "Tab content not found for data-tab:",
          e.target.getAttribute("data-tab")
        );
      }
    }
  });

  // Speicher-Logik mit asynchroner Behandlung
  saveButton.addEventListener("click", async (e) => {
    const promptTitle = promptTitleInput.value.trim();
    const promptDescription = promptDescInput.value.trim();
    const promptContent = promptTextarea.value.trim();
    const activeOption = shadowRoot
      .querySelector(".options-switch button.active")
      ?.getAttribute("data-tab");

    if (!promptTitle || !promptDescription || !promptContent) {
      alert("Bitte fülle alle Felder (Titel, Beschreibung, Prompt) aus!");
      return;
    }

    if (!activeOption) {
      alert("Bitte wähle eine Option aus!");
      return;
    }

    async function savePrompt() {
      const promptObject = {
        title: promptTitle,
        description: promptDescription,
        content: promptContent,
      };

      try {
        if (activeOption === "create") {
          const hiddenFolderId = `hidden_folder_${Date.now()}_${Math.floor(
            Math.random() * 10000
          )}`;
          const hiddenFolder = {
            name: promptTitle,
            prompts: [promptObject],
            isHidden: true,
          };

          await new Promise((resolve, reject) => {
            chrome.storage.sync.set({ [hiddenFolderId]: hiddenFolder }, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                console.log(
                  "Standalone prompt created in hidden folder:",
                  hiddenFolder
                );
                resolve();
              }
            });
          });
          closeModal();
        } else if (activeOption === "replace") {
          const folderId = replaceFolderSelect.value;
          const promptIndex = replacePromptSelect.value;

          if (!folderId || promptIndex === "") {
            alert("Bitte wähle einen Ordner und eine Prompt aus!");
            return;
          }

          const data = await new Promise((resolve, reject) => {
            chrome.storage.sync.get(folderId, (data) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(data);
              }
            });
          });

          const topic = data[folderId];
          if (topic && topic.prompts) {
            topic.prompts[promptIndex] = promptObject;
            topic.name = topic.prompts.length === 1 ? promptTitle : topic.name;

            await new Promise((resolve, reject) => {
              chrome.storage.sync.set({ [folderId]: topic }, () => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  console.log(
                    `Prompt in folder ${folderId} replaced at index ${promptIndex}`
                  );
                  resolve();
                }
              });
            });
            closeModal();
          }
        } else if (activeOption === "add") {
          const folderId = addFolderSelect.value;

          if (!folderId) {
            alert("Bitte wähle einen Ordner aus!");
            return;
          }

          const data = await new Promise((resolve, reject) => {
            chrome.storage.sync.get(folderId, (data) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(data);
              }
            });
          });

          const topic = data[folderId] || { name: promptTitle, prompts: [] };
          topic.prompts.push(promptObject);

          await new Promise((resolve, reject) => {
            chrome.storage.sync.set({ [folderId]: topic }, () => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                console.log(`Prompt added to folder ${folderId}`);
                resolve();
              }
            });
          });
          closeModal();
        }
      } catch (error) {
        console.error("Error in savePrompt:", error);
        alert("Fehler beim Speichern des Prompts.");
      }
    }

    await savePrompt();
  });
}

document.addEventListener("DOMContentLoaded", removeElement);

// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
