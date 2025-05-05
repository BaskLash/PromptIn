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

document.addEventListener("DOMContentLoaded", removeElement);

// Hilfsfunktion zur Generierung einer eindeutigen ID
async function generateUniqueID(baseName) {
  return `${baseName}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
