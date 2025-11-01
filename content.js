const extpayClient = ExtPay("promptin"); // ExtPay global verfügbar

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
  /\/app\//.test(path)
) {
  addGeminiButton();
}

  if (
  window.location.hostname === "grok.com" &&
  (path.includes("/c") || path.includes("/chat"))
) {
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
  if (
    window.location.hostname === "meta.ai" ||
    (window.location.hostname === "www.meta.ai" && path.startsWith("/prompt/"))
  ) {
    addMetaAiButton();
  }
}, 3000); // Alle 3 Sekunden prüfen

inputFieldTrigger();

// Subfunction to handle creating a new prompt
async function createNewPrompt(promptData, closeModal) {
  console.log("So werde ich gespeichert bei PromptSaver");
  const promptId = `${Date.now()}_${generateUUID()}`;
  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, "");

  let compatibleModels;

  if (hostname === "chatgpt.com") {
    compatibleModels = ["ChatGPT"];
  } else if (hostname === "grok.com") {
    compatibleModels = ["Grok"];
  } else if (hostname === "gemini.google.com") {
    compatibleModels = ["Gemini"];
  } else if (hostname === "claude.ai") {
    compatibleModels = ["Claude"];
  } else if (hostname === "blackbox.ai") {
    compatibleModels = ["Blackbox"];
  } else if (hostname === "github.com") {
    compatibleModels = ["Copilot"];
  } else if (hostname === "copilot.microsoft.com") {
    compatibleModels = ["Microsoft Copilot"];
  } else if (hostname === "chat.mistral.ai") {
    compatibleModels = ["Mistral"];
  } else if (hostname === "duckduckgo.com") {
    compatibleModels = ["DuckDuckGo"];
  } else if (hostname === "perplexity.ai") {
    compatibleModels = ["Perplexity"];
  } else if (hostname === "chat.deepseek.com") {
    compatibleModels = ["DeepSeek"];
  } else if (hostname === "deepai.org") {
    compatibleModels = ["Deepai"];
  } else if (hostname === "chat.qwen.ai") {
    compatibleModels = ["Qwen AI"];
  } else if (hostname === "meta.ai") {
    compatibleModels = ["Meta AI"];
  } else {
    compatibleModels = ["Unknown"];
  }

  console.log("compatibleModels:", compatibleModels);

  const incompatibleModels = [];
  const isFavorite = false;
  const folderId = null;
  const notes = "";

  const newPrompt = {
    promptId: promptId,
    title: promptData.title,
    description: promptData.description,
    content: promptData.content,
    notes,
    types: promptData.types || "", // Verwende promptData.type
    compatibleModels,
    incompatibleModels,
    tags: promptData.tags || [], // Verwende promptData.tags
    isFavorite,
    folderId,
    createdAt: Date.now(),
    updatedAt: null,
    usageCount: 0,
    lastUsed: null,
    usageHistory: [],
    isTrash: false,
    deletedAt: null,
    trashedAt: null,
    versions: [
      {
        versionId: `${Date.now()}_${generateUUID()}`,
        title: promptData.title,
        description: promptData.description,
        content: promptData.content,
        timestamp: Date.now(),
      },
    ],
    metaChangeLog: [
      {
        timestamp: Date.now(),
        changes: {
          title: { from: null, to: promptData.title },
          description: { from: null, to: promptData.description },
          content: { from: null, to: promptData.content },
          types: { from: null, to: promptData.types || "" }, // Anpassung für type
          compatibleModels: { from: [], to: compatibleModels },
          incompatibleModels: { from: [], to: incompatibleModels },
          tags: { from: [], to: promptData.tags || [] }, // Anpassung für tags
          isFavorite: { from: false, to: isFavorite },
          folderId: { from: null, to: folderId },
          notes: { from: null, to: notes },
        },
      },
    ],
    performanceHistory: [],
  };

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

    const prompts = data.prompts || {};
    const folders = data.folders || {};
    prompts[promptId] = newPrompt;

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
    alert("Error creating prompt: " + error.message);
  }
}

// Subfunction to handle replacing an existing prompt
async function replacePrompt(promptData, folderId, promptId, closeModal) {
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
      alert("Prompt not found!");
      return;
    }

    const oldPrompt = prompts[promptId];
    const currentUrl = window.location.hostname;
    const compatibleModels = currentUrl.includes("chatgpt.com")
      ? ["ChatGPT"]
      : ["Unknown"];
    const incompatibleModels = oldPrompt.incompatibleModels || [];
    const isFavorite = oldPrompt.isFavorite || false;
    const notes = oldPrompt.notes || "";

    const newVersion = {
      versionId: `${Date.now()}_${generateUUID()}`,
      title: promptData.title,
      description: promptData.description,
      content: promptData.content,
      timestamp: Date.now(),
    };

    const updatedPrompt = {
      ...oldPrompt,
      title: promptData.title,
      description: promptData.description,
      content: promptData.content,
      notes,
      types: promptData.types || oldPrompt.types || "", // Behalte alten Typ, falls keiner neu angegeben
      compatibleModels,
      incompatibleModels,
      tags: promptData.tags || oldPrompt.tags || [], // Behalte alte Tags, falls keine neuen angegeben
      isFavorite,
      folderId,
      updatedAt: Date.now(),
      usageCount: oldPrompt.usageCount || 0,
      lastUsed: oldPrompt.lastUsed || null,
      versions: [newVersion, ...(oldPrompt.versions || [])],
      metaChangeLog: [
        {
          timestamp: Date.now(),
          changes: {
            title: { from: oldPrompt.title, to: promptData.title },
            description: { from: oldPrompt.description, to: promptData.description },
            content: { from: oldPrompt.content, to: promptData.content },
            types: { from: oldPrompt.types || "", to: promptData.types || oldPrompt.types || "" },
            compatibleModels: {
              from: oldPrompt.compatibleModels || [],
              to: compatibleModels,
            },
            tags: { from: oldPrompt.tags || [], to: promptData.tags || oldPrompt.tags || [] },
          },
        },
        ...(oldPrompt.metaChangeLog || []),
      ],
      performanceHistory: oldPrompt.performanceHistory || [],
    };

    prompts[promptId] = updatedPrompt;

    if (folderId && folders[folderId]) {
      const folder = folders[folderId];
      if (folder.promptIds.length === 1) {
        folder.name = promptData.title;
      }
    }

    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ prompts, folders }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(`Prompt ${promptId} erfolgreich ersetzt.`);
          alert("Promptly replaced successfully!");
          resolve();
        }
      });
    });

    closeModal();
  } catch (error) {
    console.error("Fehler beim Ersetzen des Prompts:", error);
    alert("Error replacing the prompt.");
  }
}

// Subfunction to handle adding a prompt to a folder
async function addPromptToFolder(promptData, folderId, closeModal) {
  const promptId = `${Date.now()}_${generateUUID()}`;
  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, "");

  let compatibleModels;

  if (hostname === "chatgpt.com") compatibleModels = ["ChatGPT"];
  else if (hostname === "grok.com") compatibleModels = ["Grok"];
  else if (hostname === "gemini.google.com") compatibleModels = ["Gemini"];
  else if (hostname === "claude.ai") compatibleModels = ["Claude"];
  else if (hostname === "blackbox.ai") compatibleModels = ["Blackbox"];
  else if (hostname === "github.com") compatibleModels = ["Copilot"];
  else if (hostname === "copilot.microsoft.com")
    compatibleModels = ["Microsoft Copilot"];
  else if (hostname === "chat.mistral.ai") compatibleModels = ["Mistral"];
  else if (hostname === "duckduckgo.com") compatibleModels = ["DuckDuckGo"];
  else if (hostname === "perplexity.ai") compatibleModels = ["Perplexity"];
  else if (hostname === "chat.deepseek.com") compatibleModels = ["DeepSeek"];
  else if (hostname === "deepai.org") compatibleModels = ["Deepai"];
  else if (hostname === "chat.qwen.ai") compatibleModels = ["Qwen AI"];
  else if (hostname === "meta.ai") compatibleModels = ["Meta AI"];
  else compatibleModels = ["Unknown"];

  const incompatibleModels = [];
  const isFavorite = false;
  const notes = "";

  const newPrompt = {
    promptId,
    title: promptData.title,
    description: promptData.description,
    content: promptData.content,
    notes,
    types: promptData.types || [],
    compatibleModels,
    incompatibleModels,
    tags: promptData.tags || [],
    isFavorite,
    folderId,
    createdAt: Date.now(),
    updatedAt: null,
    usageCount: 0,
    lastUsed: null,
    usageHistory: [],
    isTrash: false,
    deletedAt: null,
    trashedAt: null,
    versions: [
      {
        versionId: `${Date.now()}_${generateUUID()}`,
        title: promptData.title,
        description: promptData.description,
        content: promptData.content,
        timestamp: Date.now(),
      },
    ],
    metaChangeLog: [
      {
        timestamp: Date.now(),
        changes: {
          title: { from: null, to: promptData.title },
          description: { from: null, to: promptData.description },
          content: { from: null, to: promptData.content },
          types: { from: [], to: promptData.types || [] },
          compatibleModels: { from: [], to: compatibleModels },
          incompatibleModels: { from: [], to: incompatibleModels },
          tags: { from: [], to: promptData.tags || [] },
          isFavorite: { from: false, to: isFavorite },
          folderId: { from: null, to: folderId },
          notes: { from: null, to: notes },
        },
      },
    ],
    performanceHistory: [],
  };

  try {
    // Bestehende Prompts und Ordner laden
    const data = await new Promise((resolve, reject) => {
      chrome.storage.local.get(["prompts", "folders"], (data) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(data);
      });
    });

    const prompts = data.prompts || {};
    const folders = data.folders || {};

    if (!folders[folderId])
      throw new Error(`Folder ${folderId} does not exist.`);

    prompts[promptId] = newPrompt;

    folders[folderId].promptIds = folders[folderId].promptIds || [];
    folders[folderId].promptIds.push(promptId);

    // Speichern
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ prompts, folders }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });

    console.log(`Prompt ${promptId} added to folder ${folderId}`);
    closeModal();
  } catch (error) {
    console.error("Error adding prompt to folder:", error);
    alert("Error adding prompt: " + error.message);
  }
}

// Subfunction to handle combining with an existing prompt
async function combineWithExistingPrompt(
  promptData,
  combinedText,
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

    const prompts = data.prompts || {};
    const folders = data.folders || {};

    if (!prompts[promptId]) {
      alert("Prompt not found!");
      return;
    }

    const existingPrompt = prompts[promptId];
    const currentUrl = window.location.hostname;
    const compatibleModels = currentUrl.includes("chatgpt.com")
      ? ["ChatGPT"]
      : ["Unknown"];
    const incompatibleModels = existingPrompt.incompatibleModels || [];
    const isFavorite = existingPrompt.isFavorite || false;
    const folderId = existingPrompt.folderId || null;
    const notes = existingPrompt.notes || "";

    const newVersion = {
      versionId: `${Date.now()}_${generateUUID()}`,
      title: promptData.title,
      description: promptData.description,
      content: combinedText,
      timestamp: Date.now(),
    };

    const updatedPrompt = {
      ...existingPrompt,
      title: promptData.title,
      description: promptData.description,
      content: combinedText,
      notes,
      types: promptData.types || existingPrompt.types || [],
      compatibleModels,
      incompatibleModels,
      tags: promptData.tags || existingPrompt.tags || [],
      isFavorite,
      folderId,
      updatedAt: Date.now(),
      usageCount: existingPrompt.usageCount || 0,
      lastUsed: existingPrompt.lastUsed || null,
      versions: [newVersion, ...(existingPrompt.versions || [])],
      metaChangeLog: [
        {
          timestamp: Date.now(),
          changes: {
            title: { from: existingPrompt.title, to: promptData.title },
            description: { from: existingPrompt.description, to: promptData.description },
            content: { from: existingPrompt.content, to: combinedText },
            types: { from: existingPrompt.types || [], to: promptData.types || existingPrompt.types || [] },
            compatibleModels: {
              from: existingPrompt.compatibleModels || [],
              to: compatibleModels,
            },
            tags: { from: existingPrompt.tags || [], to: promptData.tags || existingPrompt.tags || [] },
          },
        },
        ...(existingPrompt.metaChangeLog || []),
      ],
      performanceHistory: existingPrompt.performanceHistory || [],
    };

    prompts[promptId] = updatedPrompt;

    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ prompts }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          console.log(
            `Prompt ${promptId} erfolgreich kombiniert und gespeichert.`
          );
          alert("Successfully combined and saved!");
          resolve();
        }
      });
    });

    closeModal();
  } catch (error) {
    console.error("Fehler beim Kombinieren des Prompts:", error);
    alert("Error combining the prompt.");
  }
}

async function promptSaver(message) {
  // Sicherstellen, dass der DOM verfügbar ist
  if (!document.body || !document.head) {
    console.error(
      "DOM nicht verfügbar: document.body oder document.head fehlt."
    );
    alert("Error: Page not fully loaded. Please try again.");
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

// Create the label text with a red asterisk
promptTitleLabel.innerHTML = 'Prompt Title: <span style="color: red">*</span>';

  const promptTitleInput = document.createElement("input");
  promptTitleInput.type = "text";
  promptTitleInput.id = "promptTitle";
  promptTitleInput.name = "promptTitle";
  promptTitleInput.placeholder = "Enter a title for your prompt";

  // === Handle Enter Key ===
promptTitleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
    const start = promptTitleInput.selectionStart;
    const end = promptTitleInput.selectionEnd;
    const value = promptTitleInput.value;
    promptTitleInput.value = value.substring(0, start) + "\n" + value.substring(end);
    promptTitleInput.selectionStart = promptTitleInput.selectionEnd = start + 1;
  }
});

  const promptDescLabel = document.createElement("label");
  promptDescLabel.setAttribute("for", "promptDescription");
  promptDescLabel.textContent = "Prompt Description:";

  const promptDescInput = document.createElement("textarea");
  promptDescInput.id = "promptDescription";
  promptDescInput.name = "promptDescription";
  promptDescInput.rows = 3;
  promptDescInput.placeholder = "Enter a description for your prompt";

  // === Handle Enter Key ===
promptDescInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
  }
});

// Type Selection
const typeLabel = document.createElement("label");
typeLabel.setAttribute("for", "promptType");
typeLabel.textContent = "Prompt Type:";
typeLabel.style.marginTop = "16px";

const typeSelect = document.createElement("select");
typeSelect.id = "promptType";
typeSelect.name = "promptType";

chrome.storage.local.get(["types"], (data)=>{
  if (chrome.runtime.lastError) {
    console.error("Error loading data:", chrome.runtime.lastError);
    return;
  }

  const types = data.types || [];

  // Setze den Inhalt des Select-Elements abhängig davon, ob Typen vorhanden sind
  if (types.length === 0) {
    console.log("No types exist");

    typeSelect.innerHTML = `
      <option value="">No types available</option>
    `;
    typeSelect.disabled = true; // Optional: deaktivieren, wenn keine Auswahl möglich ist
  } else {
    typeSelect.innerHTML = `
      <option value="">Select type</option>
      ${types.map(type => `<option value="${type}">${type}</option>`).join("")}
    `;
  }
})

const tagsLabel = document.createElement("label");
tagsLabel.setAttribute("for", "promptTags");
tagsLabel.textContent = "Prompt Tags (select multiple):";
tagsLabel.style.marginTop = "16px";
tagsLabel.style.display = "block";

// Container für Checkboxen
const tagsContainer = document.createElement("div");
tagsContainer.id = "promptTags";
tagsContainer.style.display = "flex";
tagsContainer.style.flexWrap = "wrap";
tagsContainer.style.gap = "8px";
tagsContainer.style.marginTop = "8px";
tagsContainer.style.border = "1px solid #ccc";
tagsContainer.style.padding = "10px";
tagsContainer.style.borderRadius = "6px";
tagsContainer.style.backgroundColor = "#f9f9f9";

// Tags aus Speicher laden
chrome.storage.local.get(["tags"], (data) => {
  if (chrome.runtime.lastError) {
    console.error("Error loading tags:", chrome.runtime.lastError);
    return;
  }

  const tags = data.tags || [];

  if (tags.length === 0) {
    const noTags = document.createElement("div");
    noTags.textContent = "No tags available.";
    tagsContainer.appendChild(noTags);
    return;
  }

  tags.forEach((tag) => {
    const tagWrapper = document.createElement("label");
    tagWrapper.style.display = "flex";
    tagWrapper.style.alignItems = "center";
    tagWrapper.style.gap = "4px";
    tagWrapper.style.padding = "4px 8px";
    tagWrapper.style.background = "#eee";
    tagWrapper.style.borderRadius = "4px";
    tagWrapper.style.cursor = "pointer";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "promptTags";
    checkbox.value = tag;

    const labelText = document.createElement("span");
    labelText.textContent = tag;

    tagWrapper.appendChild(checkbox);
    tagWrapper.appendChild(labelText);
    tagsContainer.appendChild(tagWrapper);
  });
});

  const nextToPromptButton = document.createElement("button");
  nextToPromptButton.textContent = "Next";
  nextToPromptButton.className = "next-button";

  // Schritt 2: Prompt-Textarea
const promptSection = document.createElement("div");
promptSection.className = "step-section";

// Label
const promptTextareaLabel = document.createElement("label");
promptTextareaLabel.setAttribute("for", "promptTextarea");
promptTextareaLabel.innerHTML = 'Your Prompt: <span style="color: red">*</span';

// Textarea
const promptTextarea = document.createElement("textarea");
promptTextarea.id = "promptTextarea";
promptTextarea.name = "promptTextarea";
promptTextarea.rows = 10;
promptTextarea.style.width = "100%";

// Initial Message
message = typeof message === "string" ? message.trim() : String(message).trim();
let originalMessage = message;
promptTextarea.value = message;
promptTextarea.placeholder = "Edit your prompt here...";

// === STATE TRACKING ===
let colonTrimmed = false;
let colonTrimOriginal = promptTextarea.value;

let codeSeparated = false;
let codeDetectionOriginal = promptTextarea.value;
let detectedCode = "";
let detectedPromptWithoutCode = "";

let smartSplitApplied = false;
let smartSplitOriginal = promptTextarea.value;

// === OPTIONS BOX ===
const optionsBox = document.createElement("div");
optionsBox.className = "options-box";
optionsBox.style.marginTop = "15px";
optionsBox.style.padding = "15px";
optionsBox.style.border = "1px solid #ccc";
optionsBox.style.borderRadius = "6px";
optionsBox.style.background = "#f9f9f9";

// === FUNCTION: Check and Render Visibility of Option Elements ===
function updateOptionsVisibility() {
  colonContainer.style.display = promptTextarea.value.includes(":") ? "block" : "none";

  const codeRegex = /```[\s\S]*?```|(<\/?[\w\s="/.':;#-\/\?]+>)/g;
  codeDetectContainer.style.display = codeRegex.test(promptTextarea.value) ? "block" : "none";

  const smartSplitIndicators = ["Please", "Explain", "Summarize", "\n\n"];
  const matches = smartSplitIndicators.some((indicator) =>
    promptTextarea.value.includes(indicator)
  );
  smartSplitContainer.style.display = matches ? "block" : "none";
}

// === Colon-Based Trimming ===
const colonTrimCheckbox = document.createElement("input");
colonTrimCheckbox.type = "checkbox";
colonTrimCheckbox.id = "colonTrimCheckbox";

const colonTrimLabel = document.createElement("label");
colonTrimLabel.setAttribute("for", "colonTrimCheckbox");
colonTrimLabel.textContent = "Trim prompt at first colon ':'";
colonTrimLabel.style.marginLeft = "8px";

const colonContainer = document.createElement("div");
colonContainer.style.marginBottom = "10px";
colonContainer.appendChild(colonTrimCheckbox);
colonContainer.appendChild(colonTrimLabel);
colonContainer.style.display = "none";

colonTrimCheckbox.addEventListener("change", (e) => {
  if (e.target.checked) {
    if (!colonTrimmed && promptTextarea.value.includes(":")) {
      colonTrimOriginal = promptTextarea.value;
      promptTextarea.value = promptTextarea.value.split(":")[0].trim();
      colonTrimmed = true;
    }
  } else {
    if (colonTrimmed) {
      promptTextarea.value = colonTrimOriginal;
      colonTrimmed = false;
    }
  }
});

// === Insert Variable Button ===
const insertVariableButton = document.createElement("button");
insertVariableButton.textContent = "Insert {{variable}}";
insertVariableButton.className = "insert-variable-button";
insertVariableButton.style.margin = "10px 0";
insertVariableButton.style.padding = "6px 12px";
insertVariableButton.style.background = "#1e90ff";
insertVariableButton.style.color = "white";
insertVariableButton.style.border = "none";
insertVariableButton.style.borderRadius = "4px";
insertVariableButton.style.cursor = "pointer";

insertVariableButton.addEventListener("mouseover", () => {
  insertVariableButton.style.background = "#4169e1";
});
insertVariableButton.addEventListener("mouseout", () => {
  insertVariableButton.style.background = "#1e90ff";
});

insertVariableButton.addEventListener("click", () => {
  const placeholder = "{{variable}}";
  const start = promptTextarea.selectionStart;
  const end = promptTextarea.selectionEnd;
  const value = promptTextarea.value;
  promptTextarea.value = value.slice(0, start) + placeholder + value.slice(end);
  promptTextarea.selectionStart = promptTextarea.selectionEnd = start + placeholder.length;
  promptTextarea.focus();
});

// === Code Block Detection ===
const autoCodeDetectCheckbox = document.createElement("input");
autoCodeDetectCheckbox.type = "checkbox";
autoCodeDetectCheckbox.id = "autoCodeDetectCheckbox";

const autoCodeDetectLabel = document.createElement("label");
autoCodeDetectLabel.setAttribute("for", "autoCodeDetectCheckbox");
autoCodeDetectLabel.textContent = "➡️ Automatically detect and separate code blocks";
autoCodeDetectLabel.style.marginLeft = "8px";

const codeDetectContainer = document.createElement("div");
codeDetectContainer.style.marginTop = "10px";
codeDetectContainer.appendChild(autoCodeDetectCheckbox);
codeDetectContainer.appendChild(autoCodeDetectLabel);
codeDetectContainer.style.display = "none";

autoCodeDetectCheckbox.addEventListener("change", () => {
  const codeRegex = /```[\s\S]*?```|(<\/?[\w\s="/.':;#-\/\?]+>)/g;

  if (autoCodeDetectCheckbox.checked) {
    const value = promptTextarea.value;
    const matches = value.match(codeRegex);

    if (matches) {
      codeDetectionOriginal = promptTextarea.value;
      detectedCode = matches.join("\n\n");
      detectedPromptWithoutCode = value.replace(codeRegex, "").trim();
      promptTextarea.value = detectedPromptWithoutCode;
      codeSeparated = true;
    }
  } else {
    if (codeSeparated) {
      promptTextarea.value = codeDetectionOriginal;
      codeSeparated = false;
    }
  }
});

// === Intelligent Prompt Splitting ===
const smartSplitCheckbox = document.createElement("input");
smartSplitCheckbox.type = "checkbox";
smartSplitCheckbox.id = "smartSplitCheckbox";

const smartSplitLabel = document.createElement("label");
smartSplitLabel.setAttribute("for", "smartSplitCheckbox");
smartSplitLabel.textContent = "➡️ Enable intelligent prompt splitting";
smartSplitLabel.style.marginLeft = "8px";

const smartSplitContainer = document.createElement("div");
smartSplitContainer.style.marginTop = "10px";
smartSplitContainer.appendChild(smartSplitCheckbox);
smartSplitContainer.appendChild(smartSplitLabel);
smartSplitContainer.style.display = "none";

smartSplitCheckbox.addEventListener("change", () => {
  if (smartSplitCheckbox.checked) {
    const text = promptTextarea.value;
    const keywords = ["Please", "Explain", "Summarize"];
    let splitPoint = -1;

    for (let keyword of keywords) {
      let index = text.indexOf(keyword);
      if (index !== -1 && (splitPoint === -1 || index < splitPoint)) {
        splitPoint = index;
      }
    }

    if (splitPoint === -1) {
      splitPoint = text.indexOf("\n\n");
    }

    if (splitPoint !== -1) {
      smartSplitOriginal = promptTextarea.value;
      const main = text.substring(0, splitPoint).trim();
      const extra = text.substring(splitPoint).trim();
      promptTextarea.value = main;
      smartSplitApplied = true;
    }
  } else {
    if (smartSplitApplied) {
      promptTextarea.value = smartSplitOriginal;
      smartSplitApplied = false;
    }
  }
});

// === Input Listener for Dynamic Option Visibility + State Reset ===
promptTextarea.addEventListener("input", () => {
  updateOptionsVisibility();

  if (!colonTrimCheckbox.checked) {
    colonTrimOriginal = promptTextarea.value;
  }
  if (!autoCodeDetectCheckbox.checked) {
    codeDetectionOriginal = promptTextarea.value;
  }
  if (!smartSplitCheckbox.checked) {
    smartSplitOriginal = promptTextarea.value;
  }
});

// === Assemble Options Box ===
optionsBox.appendChild(colonContainer);
optionsBox.appendChild(insertVariableButton);
optionsBox.appendChild(codeDetectContainer);
optionsBox.appendChild(smartSplitContainer);

// === Buttons ===
const promptButtons = document.createElement("div");
promptButtons.className = "button-group";
promptButtons.style.marginTop = "10px";

const backToTitleButton = document.createElement("button");
backToTitleButton.textContent = "Back";
backToTitleButton.className = "back-button";

const nextToOptionsButton = document.createElement("button");
nextToOptionsButton.textContent = "Next";
nextToOptionsButton.className = "next-button";

promptButtons.appendChild(backToTitleButton);
promptButtons.appendChild(nextToOptionsButton);

// === Handle Enter Key ===
promptTextarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
    const start = promptTextarea.selectionStart;
    const end = promptTextarea.selectionEnd;
    const value = promptTextarea.value;
    promptTextarea.value = value.substring(0, start) + "\n" + value.substring(end);
    promptTextarea.selectionStart = promptTextarea.selectionEnd = start + 1;
  }
});

// === Final Assembly ===
promptSection.appendChild(promptTextareaLabel);
promptSection.appendChild(promptTextarea);
promptSection.appendChild(optionsBox);
promptSection.appendChild(promptButtons);

// === Init ===
updateOptionsVisibility();


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
  similarPromptsLabel.textContent = "Advanced Similarity Insights:";

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

    // Zentraler Klick-Handler für Similarity-Dropdown
dropdownContent.addEventListener("click", async (e) => {
  const item = e.target.closest(".dropdown-item");
  if (!item || !item.dataset.promptId) return;

  e.stopPropagation();

  const promptId = item.dataset.promptId;
  const folderId = item.dataset.folderId;
  const isCategorised = item.dataset.isCategorised === "true";
  const title = item.dataset.title;
  const content = item.dataset.content;

 // --- FIX: Zuverlässige Befüllung von Folder + Prompt ---
let folderValue = "";
if (folderId) {
  folderValue = `folder:${folderId}`;
} else if (item.dataset.isCategorised === "true") {
  folderValue = "categorised";
} else {
  folderValue = "single";
}

replaceFolderSelect.value = folderValue;
replacePromptSelect.disabled = true;
replacePromptSelect.innerHTML = '<option value="">Loading...</option>';

// Trigger change to load prompts
replaceFolderSelect.dispatchEvent(new Event("change", { bubbles: true }));

// Wait for prompts to load
await new Promise(r => setTimeout(r, 50));

// Select the prompt
replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';
const opt = document.createElement("option");
opt.value = promptId;
opt.textContent = title;
opt.selected = true;
replacePromptSelect.appendChild(opt);
replacePromptSelect.disabled = false;
// --- ENDE FIX ---

// UI finalisieren
dropdownButton.textContent = title;
dropdownContent.style.display = "none";
computePromptDiff(promptTextarea.value.trim(), content);

  // 2. Prompts laden
  try {
    const data = await new Promise((res) => chrome.storage.local.get(null, res));
    const { prompts = {}, folders = {} } = data;

    let promptList = [];

    if (folderId && folders[folderId]) {
      promptList = (folders[folderId].promptIds || [])
        .map(pid => prompts[pid])
        .filter(p => p && !p.isDeleted);
    } else if (folderValue === "categorised") {
      promptList = Object.values(prompts).filter(p => p?.isCategorised && !p.isDeleted);
    } else if (folderValue === "single") {
      promptList = Object.values(prompts).filter(p => !p?.folderId && !p.isDeleted);
    }

    promptList.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.promptId;
      opt.textContent = p.title || "Untitled Prompt";
      if (p.promptId === promptId) opt.selected = true;
      replacePromptSelect.appendChild(opt);
    });

    // 3. UI finalisieren
    dropdownButton.textContent = title;
    dropdownContent.style.display = "none";
    computePromptDiff(promptTextarea.value.trim(), content);

  } catch (err) {
    console.error("Fehler beim Laden nach Similarity-Auswahl:", err);
  }
});

  // --- ExtensionPay integration ---
  extpayClient.getUser().then((user) => {
    const email = user?.email; // 👈 E-Mail vom User
    const allowedFreeEmails = [
      "business.olivierthomas@gmail.com",
      "usa.obamatiger@gmail.com",
    ];

    const isSpecialFreeUser = allowedFreeEmails.includes(email);

    if (
      user.paid === "promonthly" ||
      user.paid === "proyearly" ||
      isSpecialFreeUser
    ) {
      // User has paid
      similarPromptsDropdown.appendChild(dropdownButton);
      similarPromptsDropdown.appendChild(dropdownContent);
    } else {
      // User hasn't paid
      const lockedMsg = document.createElement("div");
      lockedMsg.innerHTML = "🔒 Unlock with Pro Plan";
      lockedMsg.id = "unlockShell";
      lockedMsg.style.cursor = "pointer";
      lockedMsg.style.color = "#666";
      lockedMsg.style.margin = "6px 0";
      lockedMsg.style.padding = "10px";
      lockedMsg.style.border = "1px solid #dcdcdc";
      lockedMsg.style.borderRadius = "4px";
      lockedMsg.style.background = "#f9f9f9";
      lockedMsg.title = "Unlock Advanced Similarity Insights";

      // Redirect beim Klick
      lockedMsg.addEventListener("click", () => {
        extpayClient.openPaymentPage("promonthly");
      });

      similarPromptsDropdown.appendChild(lockedMsg);
    }
  });

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

    // === Handle Enter Key ===
newFolderInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
  }
});

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

  // Create unlock span (hidden by default)
  const unlockCombine = document.createElement("span");
  unlockCombine.id = "unlockCombine";
  unlockCombine.style.cursor = "pointer";
  unlockCombine.style.fontSize = "20px";
  unlockCombine.style.marginLeft = "10px";
  unlockCombine.style.display = "none";
  unlockCombine.title = "Unlock with Basic Plan";
  unlockCombine.textContent = "🔒 Unlock with Basic Plan";

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

  // === Handle Enter Key ===
combinedPromptPreview.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
  }
});

  combineContent.appendChild(unlockCombine);

  // --- ExtensionPay integration ---
  extpayClient
    .getUser()
    .then((user) => {
      if (user.paid) {
        // User has a plan → append content elements
        if (!combineContent.contains(combineText))
          combineContent.appendChild(combineText);
        if (!combineContent.contains(suggestedPromptsLabel))
          combineContent.appendChild(suggestedPromptsLabel);
        if (!combineContent.contains(suggestedPromptsDropdown))
          combineContent.appendChild(suggestedPromptsDropdown);
        if (!combineContent.contains(combinePromptLabel))
          combineContent.appendChild(combinePromptLabel);
        if (!combineContent.contains(combinePromptSelect))
          combineContent.appendChild(combinePromptSelect);
        if (!combineContent.contains(previewLabel))
          combineContent.appendChild(previewLabel);
        if (!combineContent.contains(combinedPromptPreview))
          combineContent.appendChild(combinedPromptPreview);

        // Hide unlock span
        unlockCombine.style.display = "none";
      } else {
        // User hasn't paid → remove content elements if they exist
        if (combineContent.contains(combineText))
          combineContent.removeChild(combineText);
        if (combineContent.contains(suggestedPromptsLabel))
          combineContent.removeChild(suggestedPromptsLabel);
        if (combineContent.contains(suggestedPromptsDropdown))
          combineContent.removeChild(suggestedPromptsDropdown);
        if (combineContent.contains(combinePromptLabel))
          combineContent.removeChild(combinePromptLabel);
        if (combineContent.contains(combinePromptSelect))
          combineContent.removeChild(combinePromptSelect);
        if (combineContent.contains(previewLabel))
          combineContent.removeChild(previewLabel);
        if (combineContent.contains(combinedPromptPreview))
          combineContent.removeChild(combinedPromptPreview);

        // Show unlock span
        unlockCombine.style.display = "block";
        if (!combineContent.contains(unlockCombine))
          combineContent.appendChild(unlockCombine);

        // Redirect on click
        unlockCombine.onclick = () => {
          extpayClient.openPaymentPage("basicmonthly");
        };
      }
    })
    .catch((err) => {
      console.error("ExtPay error:", err);
      alert(
        "Something went wrong checking your subscription. Please try again."
      );
    });

  const optionsButtons = document.createElement("div");
  optionsButtons.className = "button-group";

  const backToPromptEditButton = document.createElement("button");
  backToPromptEditButton.textContent = "Back";
  backToPromptEditButton.className = "back-button";

  const saveButton = document.createElement("button");
  saveButton.className = "save-button";
  saveButton.textContent = "Save";

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
  titleSection.appendChild(typeLabel);
  titleSection.appendChild(typeSelect);
  titleSection.appendChild(tagsLabel);
  titleSection.appendChild(tagsContainer);
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
    alert("Error creating the modal. Please try again.");
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

      // Modified: Added "Categorised Prompts" and "Single Prompts" as static options
      // Explanation: We now include all folders, "Categorised Prompts", and a new "Single Prompts" option in the dropdown
      replaceFolderSelect.innerHTML = `
      <option value="">Select a folder or category</option>
      <optgroup label="Folders">
        ${folders
          .map(
            ([id, folder]) =>
              `<option value="folder:${id}">${folder.name}</option>`
          )
          .join("")}
      </optgroup>
      <optgroup label="Categories">
        <option value="categorised">Categorised Prompts</option>
        <option value="single">Single Prompts</option>
      </optgroup>
    `;

      // Dropdown zum Hinzufügen zu einem Ordner (unchanged for this section)
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

      // Reset der Select- und Vorschlags-UI
      combinePromptSelect.innerHTML =
        '<option value="">Select a prompt</option>';
      suggestedDropdownContent.innerHTML = "";
      suggestedDropdownButton.textContent = "Select a suggested prompt";
      suggestedPromptsDropdown.style.display = "none";
      suggestedPromptsLabel.style.display = "none";

      const allPrompts = [];

      // Alle Prompts durchgehen
      Object.entries(prompts).forEach(([promptId, prompt]) => {
        if (prompt.isDeleted) return;

        const folderId = prompt.folderId || null;

        const similarity = currentPrompt
          ? computeCosineSimilarity(currentPrompt, prompt.content || "")
          : 0;

        allPrompts.push({
          promptId,
          folderId,
          title: prompt.title || "Untitled Prompt",
          content: prompt.content || "",
          createdAt: prompt.createdAt || 0,
          similarity,
        });
      });

      // Prompts nach Datum sortieren (neueste zuerst)
      allPrompts
        .sort((a, b) => b.createdAt - a.createdAt)
        .forEach((prompt) => {
          const option = document.createElement("option");
          option.value = prompt.promptId;
          option.textContent = `${prompt.title} (${prompt.folderName})`;
          option.title = prompt.title;
          combinePromptSelect.appendChild(option);
        });

      // Funktion zum Anzeigen der Vorschläge
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

      // Relevante Prompts ermitteln
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
          "<div class='dropdown-item'>No matching prompts found.</div>";
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

  function computePromptDiffForItem(
    currentPrompt,
    selectedPrompt,
    diffContainer
  ) {
    diffContainer.innerHTML = ""; // Leere den Container

    // Normalize whitespace and split into words
    const words1 = (selectedPrompt || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((w) => w);
    const words2 = (currentPrompt || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter((w) => w);

    // Compute diff
    let i = 0,
      j = 0;
    const unifiedDiff = [];
    let diffCount = 0; // Zähler für Unterschiede

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
                diffCount++;
                i++;
              }
              while (j < k) {
                unifiedDiff.push({ value: words2[j], type: "added" });
                diffCount++;
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
            diffCount++;
            i++;
          }
          if (j < words2.length) {
            unifiedDiff.push({ value: words2[j], type: "added" });
            diffCount++;
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
          diffContainer.appendChild(arrow);
        }
      }

      diffContainer.appendChild(span);
      lastWasRemoved = part.type === "removed";
    });

    return { diffCount };
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

      // Durch alle Prompts iterieren
      Object.entries(data.prompts || {}).forEach(([promptId, prompt]) => {
        if (!prompt || !prompt.content) return;

        const similarity = computeCosineSimilarity(
          currentPrompt,
          prompt.content
        );

        // Unterschiede berechnen (wie in Code 2)
        const { diffCount } = computePromptDiffForItem(
          currentPrompt,
          prompt.content || "",
          document.createElement("div")
        );

        // Ordnername bestimmen (falls vorhanden)
        let folderName = "Kein Ordner";
        if (prompt.folderId && data.folders && data.folders[prompt.folderId]) {
          folderName =
            data.folders[prompt.folderId].name || "Unbenannter Ordner";
        }

        allPrompts.push({
          promptId,
          title: prompt.title || "Untitled Prompt",
          description: prompt.description || "Keine Beschreibung verfügbar",
          content: prompt.content,
          similarity,
          diffCount,
          folderName,
          folderId: prompt.folderId || null,
        });
      });

      const similarPrompts = allPrompts
        .filter((p) => p.similarity > 0.1)
        .sort((a, b) => a.diffCount - b.diffCount); // sortiere wie Code 2 nach Diff

      // Falls identischer Prompt gefunden wird
      const identicalPrompt = similarPrompts.find((p) => p.diffCount === 0);
      if (identicalPrompt) {
        dropdownContent.innerHTML = `
          <div class='dropdown-item'>
            This prompt already exists:<br>
            <strong>Title:</strong> ${identicalPrompt.title}<br>
            <strong>Description:</strong> ${identicalPrompt.description}
          </div>`;
        similarPromptsDropdown.style.display = "block";
        similarPromptsLabel.style.display = "block";
        return;
      }

      if (similarPrompts.length === 0) {
        dropdownContent.innerHTML =
          "<div class='dropdown-item'>No similar prompts were found.</div>";
        similarPromptsDropdown.style.display = "block";
        similarPromptsLabel.style.display = "block";
        return;
      }

      similarPromptsDropdown.style.display = "block";
      similarPromptsLabel.style.display = "block";

      similarPrompts.forEach((prompt) => {
        if (prompt.diffCount === 0) return; // identische überspringen

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
        title.title = `${prompt.title} (Differences: ${prompt.diffCount} words, Category: ${prompt.folderName})`;

        const toggle = document.createElement("span");
        toggle.className = "dropdown-item-toggle";
        toggle.textContent = "Show content";

        header.appendChild(title);
        header.appendChild(toggle);

        // === Angepasster Anzeigebereich (Prompt Content + Differences) ===
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "dropdown-item-content-wrapper";
        contentWrapper.style.display = "none";

        const contentLabel = document.createElement("div");
        contentLabel.className = "dropdown-item-label";
        contentLabel.textContent = "Prompt Content:";

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

        const diffLabel = document.createElement("div");
        diffLabel.className = "dropdown-item-label";
        diffLabel.textContent = "Differences:";

        const diffContainer = document.createElement("div");
        diffContainer.className = "dropdown-item-diff";
        diffContainer.style.marginTop = "10px";
        diffContainer.style.padding = "10px";
        diffContainer.style.background = "#f8f9fa";
        diffContainer.style.borderRadius = "4px";
        diffContainer.style.fontSize = "13px";
        diffContainer.style.color = "#2c3e50";

        const diffSummary = document.createElement("div");
        diffSummary.className = "diff-summary";
        diffSummary.style.marginTop = "10px";
        diffSummary.style.fontWeight = "bold";
        diffSummary.style.color = "#1e90ff";

        contentWrapper.appendChild(contentLabel);
        contentWrapper.appendChild(content);
        contentWrapper.appendChild(diffLabel);
        contentWrapper.appendChild(diffContainer);
        contentWrapper.appendChild(diffSummary);
        // === Ende angepasster Anzeigebereich ===

        item.appendChild(header);
        item.appendChild(contentWrapper);

        toggle.addEventListener("click", (e) => {
          e.stopPropagation();
          const isActive = contentWrapper.style.display === "block";
          contentWrapper.style.display = isActive ? "none" : "block";
          toggle.textContent = isActive ? "Show content" : "Hide content";

          if (!isActive) {
            const { diffCount } = computePromptDiffForItem(
              currentPrompt,
              prompt.content,
              diffContainer
            );
            const wordLabel = diffCount === 1 ? "Word" : "Words";
            diffSummary.textContent = `Differences: ${diffCount} ${wordLabel}`;
          } else {
            diffContainer.innerHTML = "";
            diffSummary.textContent = "";
          }
        });

       // Nur Daten ins Item packen – kein Event-Listener!
item.dataset.promptId = prompt.promptId;
item.dataset.folderId = prompt.folderId || "";
item.dataset.isCategorised = !!prompt.isCategorised || false;
item.dataset.title = prompt.title;
item.dataset.content = prompt.content;

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
      alert("Please enter a folder name!");
      return;
    }

    const newFolderId = `${Date.now()}_${generateUUID()}`;
    const newFolder = {
      folderId: newFolderId,
      name: newFolderName,
      promptIds: [],
      isTrash: false,
      createdAt: Date.now(),
      updatedAt: "",
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
      // alert(`Ordner "${newFolderName}" erfolgreich erstellt!`);
    } catch (error) {
      console.error("Fehler beim Erstellen des Ordners:", error);
      alert("Error creating folder.");
    }
  });

  replaceFolderSelect.addEventListener("change", async (e) => {
    const selection = replaceFolderSelect.value;
    replacePromptSelect.disabled = !selection;
    replacePromptSelect.innerHTML = '<option value="">Select a prompt</option>';
    shadowRoot.getElementById("promptDiffOutput").innerHTML = "";

    if (!selection) return;

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

      let promptList = [];

      // Modified: Handle different selection types (folder, categorised, single)
      // Explanation: We now check the selection type and populate prompts accordingly
      if (selection.startsWith("folder:")) {
        const folderId = selection.replace("folder:", "");
        const folder = folders[folderId];
        if (folder && Array.isArray(folder.promptIds)) {
          promptList = folder.promptIds
            .map((promptId) => prompts[promptId])
            .filter((prompt) => prompt && !prompt.isDeleted);
        }
      } else if (selection === "categorised") {
        // Handle Categorised Prompts
        promptList = Object.values(prompts).filter(
          (prompt) => prompt && prompt.isCategorised && !prompt.isDeleted
        );
      } else if (selection === "single") {
        // Handle Single Prompts (prompts not linked to any folder)
        promptList = Object.values(prompts).filter(
          (prompt) => prompt && !prompt.folderId && !prompt.isDeleted
        );
      }

      // Populate the prompt dropdown
      promptList.forEach((prompt) => {
        const option = document.createElement("option");
        option.value = prompt.promptId;
        const promptTitle = prompt.title || "Untitled Prompt";
        option.textContent =
          promptTitle.length > 50
            ? promptTitle.slice(0, 50) + "..."
            : promptTitle;
        option.title = promptTitle;
        replacePromptSelect.appendChild(option);
      });

      // Enable the prompt select if there are prompts available
      replacePromptSelect.disabled = promptList.length === 0;
    } catch (error) {
      console.error("Error fetching folder or prompt data:", error);
      replacePromptSelect.innerHTML =
        '<option value="">Error loading prompts</option>';
    }
  });

  combinePromptSelect.addEventListener("change", async (e) => {
    const promptId = combinePromptSelect.value;
    combinedPromptPreview.innerHTML = "The combined prompt will appear here...";

    if (promptId !== "") {
      try {
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
        const existingPromptObj = prompts[promptId];

        if (existingPromptObj && existingPromptObj.content) {
          const existingPrompt = existingPromptObj.content;
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
    const promptId = replacePromptSelect.value;

    if (promptId !== "") {
      try {
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
        const selectedPrompt = prompts[promptId];

        if (selectedPrompt && selectedPrompt.content) {
          const currentPrompt = promptTextarea.value.trim();
          computePromptDiff(currentPrompt, selectedPrompt.content);
        } else {
          shadowRoot.getElementById("promptDiffOutput").innerHTML =
            "Error: Selected prompt not found.";
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
      alert("Please enter a prompt title!");
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
      alert("Please enter a prompt!");
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
  const promptType = typeSelect.value; // Extrahiere den ausgewählten Typ
  const promptTags = Array.from(tagsContainer.querySelectorAll('input[name="promptTags"]:checked')).map(checkbox => checkbox.value); // Extrahiere ausgewählte Tags

  if (!promptTitle || !promptContent) {
    alert("Please fill in all fields (title, prompt content)!");
    return;
  }

  const promptData = {
  title: promptTitle,
  description: promptDescription,
  content: promptContent,
  types: promptType ? [promptType] : [],
  tags: promptTags || [],
};

  switch (activeOption) {
    case "create":
      await createNewPrompt(promptData, closeModal);
      break;
    case "replace":
      const folderId = replaceFolderSelect.value;
      const promptValue = replacePromptSelect.value;
      if (!folderId || !promptValue) {
        alert("Please select a folder and a prompt to replace!");
        return;
      }
      await replacePrompt(promptData, folderId, promptValue, closeModal);
      break;
    case "add":
      const addFolderId = addFolderSelect.value;
      if (!addFolderId) {
        alert("Please select a folder or create a new one!");
        return;
      }
      await addPromptToFolder(promptData, addFolderId, closeModal);
      break;
    case "combine":
      const combinePromptValue = combinePromptSelect.value;
      if (!combinePromptValue) {
        alert("Please select a prompt to combine!");
        return;
      }
      const combinedText = combinedPromptPreview.value.trim();
      if (!combinedText) {
        alert("Combined prompt content is empty!");
        return;
      }
      await combineWithExistingPrompt(
        promptData,
        combinedText,
        combinePromptValue,
        closeModal
      );
      break;
    default:
      alert("Invalid option selected!");
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
  icon.title = "Click here to save the selected text";

  // Dein eigenes Icon-Bild
  const img = document.createElement("img");
  img.src = chrome.runtime.getURL("icon/icon48.png");
  img.alt = "Save";
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