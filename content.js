document.addEventListener("DOMContentLoaded", removeElement);
function removeElement() {
  if (window.location.hostname === "github.com") {
    // Remove News Elements
    // Hide the right sidebar
    const sidebar = document.querySelector(".feed-right-sidebar");
    if (sidebar) {
      sidebar.style.display = "none";
    }

    // Hide the feed container for 'for-you' topic
    const feedContainer = document.querySelector(
      "feed-container[data-active-topic='for-you']"
    );
    if (feedContainer) {
      feedContainer.style.display = "none";
    }

    // Hide Footer container
    const footer = document.querySelector("footer");
    if (footer) {
      footer.style.display = "none";
    }
  }
}

// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

let buttonCounter = 1; // Startwert für auto_increment
let existingToolbars = new Set(); // Set zur Verfolgung bereits verarbeiteter Toolbars
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

function blackboxButtonClick() {
  // Berechnung des Index muss bei jedem Aufruf neu erfolgen
  const proseElements = document.querySelectorAll(".prose");
  const totalElements = proseElements.length;
  const newIndex = totalElements - 2;

  console.log("Total Elements:", totalElements);
  console.log("New Index (zweitletztes Element):", newIndex);

  if (newIndex >= 0 && newIndex < totalElements) {
    const selectedProse = proseElements[newIndex];
    const firstParagraph = selectedProse.querySelector("p");

    if (firstParagraph) {
      console.log(firstParagraph.innerHTML);
      promptSaver(firstParagraph.innerHTML);
    } else {
      console.log("Kein Paragraph in diesem Prose-Element gefunden.");
    }
  } else {
    console.log("Nicht genügend Prose-Elemente vorhanden.");
  }
}

function grokButtonClick(index) {
  console.log("INDEX: " + index);

  index = index - 1;

  // Alle Elemente mit der Klasse "items-end" auswählen
  const containers = document.querySelectorAll(".items-end > div > span");

  // Überprüfen, ob es mindestens ein Element gibt
  if (containers.length > 0) {
    console.log("INDEX: " + index);
    // Hier kannst du das gewünschte Element auswählen, z.B. das erste Element
    const specificContainer = containers[index]; // Ändere den Index, um ein anderes Element auszuwählen

    // Den Text des spezifischen Elements anzeigen
    console.log(specificContainer.innerHTML);

    promptSaver(specificContainer.innerHTML);
  } else {
    console.log("Keine Elemente mit der Klasse 'items-end' gefunden.");
  }
}

function geminiButtonClick(index) {
  console.log("INDEX: " + index);

  index = index - 1;

  // Verwende den Index im ID-Selector
  let element = document.getElementById(`user-query-content-${index}`);

  // Prüfe, ob das Element existiert
  if (!element) {
    console.log(`Element mit ID 'user-query-content-${index}' nicht gefunden`);
    return;
  }

  // Finde das erste span-Element in der spezifischen Verschachtelung
  let span = element.querySelector(":scope > span > span > div > p");

  // Prüfe, ob span gefunden wurde und gib Inhalt aus
  if (span) {
    console.log("Gefundener Inhalt: " + span.innerHTML);

    promptSaver(span.innerHTML);
  } else {
    console.log("Kein passendes span-Element gefunden");
  }
}

function chatGPTButtonClick(index) {
  // Überprüfen, ob der Index eine positive Zahl ist
  index = index - 1;
  const articleElement = document.querySelector(
    `article[data-testid='conversation-turn-${index}']`
  );

  if (articleElement) {
    let stage = articleElement.children[1];
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    stage = stage.children[0];
    // console.log(stage.className);
    // stage = stage.children[0];
    // console.log(stage.textContent);
    promptSaver(stage.textContent);
  } else {
    console.log(
      `Article with data-testid 'conversation-turn-${index}' not found.`
    );
  }
}

function addMistralButtonClick(index) {
  index = index - 1;
  // 1. Zuerst das spezifische Element auswählen (das 6. Kind mit der angegebenen Klasse).
  let targetElement = document.querySelector(
    `.group.flex.w-full.gap-3:nth-child(${index})`
  );

  if (targetElement) {
    // 2. Innerhalb dieses Elements, gehen wir durch alle Kinder-Elemente (divs)
    let divs = targetElement.querySelectorAll("div");

    if (divs.length >= 4) {
      // 3. Wir holen uns den vierten div und lesen den darin enthaltenen Text aus
      let fourthDiv = divs[3];
      // console.log(fourthDiv.textContent); // Gibt den Text des vierten div aus
      promptSaver(fourthDiv.textContent);
    } else {
      console.log("Es gibt weniger als 4 div-Elemente in diesem Container.");
    }
  } else {
    console.log(
      "Das Ziel-Element mit der angegebenen Klasse wurde nicht gefunden."
    );
  }
}

function promptSaver(message) {
  // Sicherstellen, dass der DOM verfügbar ist
  if (!document.body || !document.head) {
    console.error("DOM nicht verfügbar: document.body oder document.head fehlt.");
    alert("Fehler: Seite nicht vollständig geladen. Bitte versuche es erneut.");
    return;
  }

  console.log("promptSaver aufgerufen mit message:", message);

  // Create modal elements
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

  // Step 1: Prompt Title and Description
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

  // Step 2: Prompt Textarea
  const promptSection = document.createElement("div");
  promptSection.className = "step-section";

  const promptTextareaLabel = document.createElement("label");
  promptTextareaLabel.setAttribute("for", "promptTextarea");
  promptTextareaLabel.textContent = "Your Prompt:";

  const promptTextarea = document.createElement("textarea");
  promptTextarea.id = "promptTextarea";
  promptTextarea.name = "promptTextarea";
  promptTextarea.rows = 10;
  message = message ? message.trim() : "";
  let processedMessage = message.includes(":")
    ? message.split(":").slice(0, -1).join(":").trim()
    : message;
  promptTextarea.value = processedMessage;
  promptTextarea.placeholder = "Bearbeite deinen Prompt hier...";

  const promptButtons = document.createElement("div");
  promptButtons.className = "button-group";
  const backToTitleButton = document.createElement("button");
  backToTitleButton.textContent = "Back";
  backToTitleButton.className = "back-button";
  const nextToOptionsButton = document.createElement("button");
  nextToOptionsButton.textContent = "Next";
  nextToOptionsButton.className = "next-button";

  // Step 3: Options
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

  // Create new prompt option
  const createContent = document.createElement("div");
  createContent.id = "create";
  createContent.className = "option-content active";
  const createText = document.createElement("p");
  createText.textContent =
    "Creates a new prompt without assigning it to a folder. Click 'Save' to confirm.";
  createContent.appendChild(createText);

  // Replace prompt option
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

  replaceContent.appendChild(replaceText);
  replaceContent.appendChild(replaceFolderLabel);
  replaceContent.appendChild(replaceFolderSelect);
  replaceContent.appendChild(replacePromptLabel);
  replaceContent.appendChild(replacePromptSelect);

  // Add prompt to folder option
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

  // Footer
  const modalFooter = document.createElement("div");
  modalFooter.className = "modal-footer";

  const saveButton = document.createElement("button");
  saveButton.className = "save-button";
  saveButton.textContent = "Speichern";

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
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
    .modal-body textarea {
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
    .modal-body textarea:focus {
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
  `;

  // Assemble the modal
  modalHeader.appendChild(closeSpan);
  modalHeader.appendChild(headerTitle);

  titleSection.appendChild(promptTitleLabel);
  titleSection.appendChild(promptTitleInput);
  titleSection.appendChild(promptDescLabel);
  titleSection.appendChild(promptDescInput);
  titleSection.appendChild(nextToPromptButton);

  promptSection.appendChild(promptTextareaLabel);
  promptSection.appendChild(promptTextarea);
  promptButtons.appendChild(backToTitleButton);
  promptButtons.appendChild(nextToOptionsButton);
  promptSection.appendChild(promptButtons);

  optionsSection.appendChild(optionsHeader);
  optionsSection.appendChild(optionsSwitch);
  optionsSection.appendChild(createContent);
  optionsSection.appendChild(replaceContent);
  optionsSection.appendChild(addContent);
  optionsButtons.appendChild(backToPromptButton);
  optionsSection.appendChild(optionsButtons);

  modalBody.appendChild(titleSection);
  modalBody.appendChild(promptSection);
  modalBody.appendChild(optionsSection);

  modalFooter.appendChild(saveButton);

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modalContent.appendChild(modalFooter);

  modal.appendChild(modalContent);

  // Add styles and modal to document
  try {
    document.head.appendChild(style);
    document.body.appendChild(modal);
    console.log("Modal created and appended to DOM");
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Modals zum DOM:", error);
    alert("Fehler beim Erstellen des Modals. Bitte versuche es erneut.");
    return;
  }

  // Show the modal
  modal.style.display = "block";
  console.log("Modal display set to block");

  // Load folders for replace and add options
  function loadFolders() {
    chrome.storage.sync.get(null, (data) => {
      if (chrome.runtime.lastError) {
        console.error("Error fetching data:", chrome.runtime.lastError);
        return;
      }

      const folders = Object.entries(data).filter(
        ([, topic]) => topic.prompts && Array.isArray(topic.prompts)
      );

      // Populate replaceFolderSelect
      replaceFolderSelect.innerHTML = '<option value="">Select a folder</option>';
      folders.forEach(([id, topic]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = topic.name;
        replaceFolderSelect.appendChild(option);
      });

      // Populate addFolderSelect
      addFolderSelect.innerHTML = '<option value="">Select a folder</option>';
      folders.forEach(([id, topic]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = topic.name;
        addFolderSelect.appendChild(option);
      });
    });
  }

  // Load prompts for selected folder in replace option
  replaceFolderSelect.addEventListener("change", () => {
    const folderId = replaceFolderSelect.value;
    replacePromptSelect.disabled = !folderId;
    replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';

    if (folderId) {
      chrome.storage.sync.get(folderId, (data) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching folder data:", chrome.runtime.lastError);
          return;
        }

        const topic = data[folderId];
        if (topic && topic.prompts) {
          topic.prompts.forEach((prompt, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = prompt.length > 50 ? prompt.slice(0, 50) + "..." : prompt;
            option.title = prompt;
            replacePromptSelect.appendChild(option);
          });
        }
      });
    }
  });

  // Step navigation
  nextToPromptButton.onclick = function () {
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
  };

  backToTitleButton.onclick = function () {
    promptSection.classList.remove("active");
    titleSection.classList.add("active");
  };

  nextToOptionsButton.onclick = function () {
    if (promptTextarea.value.trim() === "") {
      alert("Bitte gib einen Prompt-Text ein!");
      return;
    }
    loadFolders();
    promptSection.classList.remove("active");
    optionsSection.classList.add("active");
    modalContent.classList.add("options-active");
  };

  backToPromptButton.onclick = function () {
    optionsSection.classList.remove("active");
    promptSection.classList.add("active");
    modalContent.classList.remove("options-active");
  };

  // Options Switcher logic
  const subOptionButtonsElements = optionsSwitch.querySelectorAll("button");
  const optionContents = optionsSection.querySelectorAll(".option-content");
  subOptionButtonsElements.forEach((button) => {
    button.addEventListener("click", () => {
      subOptionButtonsElements.forEach((btn) => btn.classList.remove("active"));
      optionContents.forEach((c) => c.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.getAttribute("data-tab")).classList.add("active");
    });
  });

  // Save logic
  saveButton.onclick = function () {
    const promptTitle = promptTitleInput.value.trim();
    const promptDescription = promptDescInput.value.trim();
    const promptContent = promptTextarea.value.trim();
    const activeOption = optionsSwitch.querySelector("button.active").getAttribute("data-tab");

    if (!promptTitle || !promptDescription || !promptContent) {
      alert("Bitte fülle alle Felder (Titel, Beschreibung, Prompt) aus!");
      return;
    }

    if (activeOption === "create") {
      const promptId = `prompt_${Date.now()}`;
      const newPrompt = {
        id: promptId,
        title: promptTitle,
        description: promptDescription,
        content: promptContent,
        folderId: null,
      };

      chrome.storage.sync.set({ [promptId]: newPrompt }, () => {
        if (chrome.runtime.lastError) {
          console.error("Error saving prompt:", chrome.runtime.lastError);
          alert("Fehler beim Speichern des Prompts.");
        } else {
          console.log("New prompt created:", newPrompt);
          modal.style.display = "none";
          document.body.removeChild(modal);
          document.head.removeChild(style);
        }
      });
    } else if (activeOption === "replace") {
      const folderId = replaceFolderSelect.value;
      const promptIndex = replacePromptSelect.value;

      if (!folderId || promptIndex === "") {
        alert("Bitte wähle einen Ordner und eine Prompt aus!");
        return;
      }

      chrome.storage.sync.get(folderId, (data) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching folder data:", chrome.runtime.lastError);
          return;
        }

        const topic = data[folderId];
        if (topic && topic.prompts) {
          topic.prompts[promptIndex] = promptContent;
          topic.name = topic.prompts.length === 1 ? promptTitle : topic.name;

          chrome.storage.sync.set({ [folderId]: topic }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error replacing prompt:", chrome.runtime.lastError);
              alert("Fehler beim Ersetzen der Prompt.");
            } else {
              console.log(`Prompt in folder ${folderId} replaced at index ${promptIndex}`);
              modal.style.display = "none";
              document.body.removeChild(modal);
              document.head.removeChild(style);
            }
          });
        }
      });
    } else if (activeOption === "add") {
      const folderId = addFolderSelect.value;

      if (!folderId) {
        alert("Bitte wähle einen Ordner aus!");
        return;
      }

      chrome.storage.sync.get(folderId, (data) => {
        if (chrome.runtime.lastError) {
          console.error("Error fetching folder data:", chrome.runtime.lastError);
          return;
        }

        const topic = data[folderId] || { name: promptTitle, prompts: [] };
        topic.prompts.push(promptContent);

        chrome.storage.sync.set({ [folderId]: topic }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error adding prompt to folder:", chrome.runtime.lastError);
            alert("Fehler beim Hinzufügen der Prompt zum Ordner.");
          } else {
            console.log(`Prompt added to folder ${folderId}`);
            modal.style.display = "none";
            document.body.removeChild(modal);
            document.head.removeChild(style);
          }
        });
      });
    }
  };

  // Close modal
  closeSpan.onclick = function () {
    modal.style.display = "none";
    try {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    } catch (error) {
      console.error("Fehler beim Entfernen des Modals:", error);
    }
  };

  // Optimierten window.onclick Handler
  window.addEventListener("click", function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
      try {
        document.body.removeChild(modal);
        document.head.removeChild(style);
      } catch (error) {
        console.error("Fehler beim Entfernen des Modals:", error);
      }
    }
  }, { once: true }); // Handler wird nur einmal ausgeführt
}

// Funktion zum Abrufen des passenden Chat-Elements
function copilotButtonClick(index) {
  // Überprüfen, ob der Index eine positive Zahl ist
  if (index <= 0) {
    console.error("Index muss eine positive Zahl sein.");
    return;
  }

  // Berechnung des nth-child-Wertes
  const nthChild = index;

  console.log("Nth-child: " + nthChild);

  const elements = document.querySelectorAll(
    ".UserMessage-module__container--cAvvK.ChatMessage-module__userMessage--xvIFp"
  );
  let message;
  // Stelle sicher, dass nthChild innerhalb des gültigen Bereichs liegt
  if (nthChild > 0 && nthChild <= elements.length) {
    message = elements[nthChild - 1]; // nth-child ist 1-basiert, NodeList ist 0-basiert
    console.log(message.textContent.trim());
  } else {
    console.log("Ungültiger nthChild-Wert: " + nthChild);
  }

  if (message) {
    promptSaver(message);
  } else {
    console.log(`Kein Element für Prompt ${index} gefunden.`);
  }
}
function claudeButtonClick(index) {
  // Alle Elemente mit data-testid='user-message' auswählen
  let userMessages = document.querySelectorAll("[data-testid='user-message']");

  // Das zweite Element auswählen (Index 1, da 0-based)
  let secondUserMessage = userMessages[index];

  // Das p-Element innerhalb des zweiten Elements finden und dessen innerHTML abrufen
  let paragraph = secondUserMessage.querySelector("p");
  if (!paragraph) {
    throw new Error("Kein p-Element im zweiten user-message gefunden");
  }
  let content = paragraph.innerHTML;
  if (content) {
    promptSaver(content);
    console.log(content);
  }
}
function addDuckduckGoButtonClick(index) {
  // Alle div-Elemente mit heading-Attribut auswählen
  const allDivsWithHeading = document.querySelectorAll("div[heading]");
  // Das zweite Element (Index 1) auswählen
  const divWithHeading = allDivsWithHeading[index - 1];

  if (divWithHeading && divWithHeading.parentElement) {
    const parentDiv = divWithHeading.parentElement;

    const pElement = parentDiv.querySelector("p");
    if (pElement) {
      console.log(pElement.textContent);
      promptSaver(pElement.textContent);
    } else {
      console.log("Kein p-Element gefunden");
    }
  } else {
    console.log(
      "Kein zweites div[heading]-Element oder kein parentElement gefunden"
    );
  }
}
function addMicrosoftCopilotButtonClick(index) {
  try {
    // Alle DIVs mit data-tabster, die "groupper" enthalten, auswählen
    const targetDivs = document.querySelectorAll(
      'div[data-tabster*="groupper"]'
    );
    if (targetDivs.length < 1) {
      throw new Error("Kein DIV mit data-tabster='groupper' gefunden");
    }

    // Sicherstellen, dass der übergebene Index gültig ist
    if (index < 0 || index >= targetDivs.length) {
      throw new Error(
        `Ungültiger Index ${index} für ${targetDivs.length} groupper-Elemente`
      );
    }

    // Das Ziel-Element basierend auf dem übergebenen Index auswählen
    const selectedDiv = targetDivs[index];
    console.log(`Ausgewähltes ${index + 1}. "groupper"-DIV:`, selectedDiv);

    // Index des vorherigen Elements (index - 1), um die Benutzernachricht zu erhalten
    const userIndex = index - 1;
    if (userIndex < 0) {
      console.warn(`Kein vorheriges Element für Index ${index} vorhanden`);
      return;
    }

    // Vorheriges groupper-Element auswählen
    const userTargetDiv = targetDivs[userIndex];
    console.log(`Vorheriges (${userIndex + 1}.) groupper-DIV:`, userTargetDiv);

    // Einziges direktes DIV im vorherigen groupper auswählen
    const nestedDiv = userTargetDiv.querySelector(":scope > div");
    if (!nestedDiv) {
      console.error("Kein direktes DIV im vorherigen groupper-DIV gefunden");
      return;
    }
    console.log("Direktes DIV im vorherigen groupper:", nestedDiv);

    // Nächstes verschachteltes DIV auswählen (innerhalb von nestedDiv)
    const nestedDiv2 = nestedDiv.querySelector("div");
    if (!nestedDiv2) {
      console.error(
        "Kein verschachteltes DIV im nestedDiv des vorherigen groupper gefunden"
      );
      return;
    }
    console.log("Verschachteltes DIV im vorherigen groupper:", nestedDiv2);

    // Textinhalt des innersten DIV ausgeben (Benutzernachricht)
    const textContent = nestedDiv2.textContent.trim();
    if (textContent) {
      console.log(
        `Benutzernachricht im ${userIndex + 1}. groupper-DIV:`,
        textContent
      );
      promptSaver(textContent);
    } else {
      console.warn(`Kein Text im ${userIndex + 1}. groupper-DIV gefunden`);
    }
  } catch (error) {
    console.error("Fehler:", error.message);
  }
}
function addPerplexityButtonClick(index) {
  const container = document.querySelector(".scrollable-container");
  if (!container) {
    throw new Error("Scrollable container nicht gefunden");
  }

  // Finde das erste div-Element ohne Klasse innerhalb des Containers
  let divElement = container.querySelector("div[class='']");
  if (!divElement) {
    throw new Error("Div-Element ohne Klasse nicht gefunden");
  }
  divElement = divElement.children[index - 1];
  let title = divElement.querySelector(".overflow-hidden");
  title = title.children[0];

  // console.log(title.innerText);
  promptSaver(title);
}

function addDeepSeekButtonClick(index) {
  const root = document.getElementById("root");

  // Check if root exists
  if (!root) {
    console.log("Root-Element nicht gefunden.");
    return;
  }

  let currentElement = root;
  const path = [0, 1, 1, 0, 1, 0, 0, 0]; // Path to the desired element

  // Navigate through the path to find the final element
  for (let i = 0; i < path.length; i++) {
    const nextIndex = path[i];
    if (
      currentElement?.children &&
      nextIndex < currentElement.children.length
    ) {
      currentElement = currentElement.children[nextIndex];
      console.log(
        `Element ${i + 1}: ${currentElement.tagName}, Klasse: ${
          currentElement.className
        }`
      );
    } else {
      console.log(`Element ${i + 1} nicht gefunden.`);
      return;
    }
  }

  // Check if the final element was found
  if (!currentElement) {
    console.log("Finales Element nicht gefunden.");
    return;
  }

  console.log(
    `Finales Element: ${currentElement.tagName}, Klasse: ${currentElement.className}`
  );

  // Adjust the index (subtract 2 as per original logic)
  const adjustedIndex = index - 2;
  const children = currentElement.children;

  // Select and log the specific child element
  if (children && adjustedIndex >= 0 && adjustedIndex < children.length) {
    const selectedChild = children[adjustedIndex];
    console.log(
      `Ausgewähltes Element ${
        adjustedIndex + 1
      }: ${selectedChild.textContent.trim()}`
    );
    promptSaver(selectedChild.textContent.trim());
  } else {
    console.log(`Element mit Index ${adjustedIndex} nicht gefunden.`);
  }
}
